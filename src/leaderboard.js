// ============================================================================
// leaderboard.js — submit and fetch scores against the Worker's /api/* routes.
// ============================================================================

export async function fetchLeaderboard() {
  try {
    const res = await fetch('/api/leaderboard', { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export async function submitScore({ name, score, floor }) {
  try {
    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score, floor }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export function renderLeaderboardHTML(entries, highlightKey = null) {
  if (!entries || entries.length === 0) {
    return '<p class="muted" style="text-align:center;margin:8px 0;">No scores yet — be the first.</p>';
  }
  const rows = entries.slice(0, 10).map((e, i) => {
    const key = `${e.name}:${e.score}:${e.at}`;
    const hl = key === highlightKey
      ? 'background:rgba(244,201,93,0.18);border:1px solid #f4c95d;'
      : '';
    return `<tr style="${hl}">
      <td style="padding:6px 10px;color:#8a96b4;width:36px;text-align:right;">${i + 1}</td>
      <td style="padding:6px 10px;color:#e7ecf8;font-weight:700;">${escapeHTML(e.name)}</td>
      <td style="padding:6px 10px;color:#cdd6ee;font-size:13px;">F${e.floor}</td>
      <td style="padding:6px 10px;color:#f4c95d;font-weight:700;text-align:right;">${e.score.toLocaleString('en-US')}</td>
    </tr>`;
  }).join('');
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:4px;">
    <thead><tr style="color:#8a96b4;font-size:11px;letter-spacing:1px;">
      <th style="padding:4px 10px;text-align:right;">#</th>
      <th style="padding:4px 10px;text-align:left;">NAME</th>
      <th style="padding:4px 10px;text-align:left;">FLOOR</th>
      <th style="padding:4px 10px;text-align:right;">SCORE</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
