// ============================================================================
// worker.js — Cloudflare Worker entrypoint.
// Handles the /api/* leaderboard endpoints and falls through to the static
// assets bundle (declared in wrangler.jsonc under "assets") for everything else.
//
// Storage: a single KV key "top" holds the top 50 entries as JSON, sorted by
// score desc. Race conditions on concurrent writes are possible but acceptable
// for this scale (~10 trusted players).
// ============================================================================

const MAX_ENTRIES = 50;
const MAX_NAME_LEN = 24;
const MAX_SCORE = 100_000_000;

async function readTop(env) {
  const raw = await env.LEADERBOARD_KV.get('top');
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
      return json(await readTop(env));
    }

    if (url.pathname === '/api/score' && request.method === 'POST') {
      let body;
      try { body = await request.json(); }
      catch { return json({ error: 'Bad JSON' }, 400); }

      const name  = String(body.name  || '').trim().slice(0, MAX_NAME_LEN);
      const score = Math.floor(Number(body.score) || 0);
      const floor = Math.floor(Number(body.floor) || 0);

      if (!name)                  return json({ error: 'Name required' }, 400);
      if (score <= 0)             return json({ error: 'Invalid score' }, 400);
      if (score > MAX_SCORE)      return json({ error: 'Score too high' }, 400);
      if (floor < 1 || floor > 86) return json({ error: 'Invalid floor' }, 400);

      const entries = await readTop(env);
      entries.push({ name, score, floor, at: Date.now() });
      entries.sort((a, b) => b.score - a.score);
      const top = entries.slice(0, MAX_ENTRIES);
      await env.LEADERBOARD_KV.put('top', JSON.stringify(top));
      return json(top);
    }

    // Everything else: serve from the static asset bundle.
    return env.ASSETS.fetch(request);
  },
};
