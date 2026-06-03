// ============================================================================
// music.js — Apple Music background player for the climb.
// Apple's embed iframe is sealed (no postMessage API), so we can't programmatically
// hit play or detect track end. Instead: we mount the iframe once Start is clicked,
// let the user tap play on the embed, and reload the iframe on a timer so the
// track loops. "Long Live (Taylor's Version)" is ~5:17, so we cycle just past that.
// ============================================================================

// `&autoplay=1` is a hint; Apple's embed may ignore it, but it's harmless and
// some browsers route it through their autoplay-allowance logic when the page
// already has user activation (which it does by the time Liftoff fires).
const SRC = 'https://embed.music.apple.com/us/album/long-live-taylors-version/1690839749?i=1690840818&autoplay=1';
const LOOP_MS = 322 * 1000; // 5:22 — small buffer past the 5:17 runtime

let host = null;
let loopTimer = 0;

function buildIframe() {
  const f = document.createElement('iframe');
  f.allow = 'autoplay *; encrypted-media *;';
  f.setAttribute(
    'sandbox',
    'allow-forms allow-popups allow-same-origin allow-scripts ' +
    'allow-storage-access-by-user-activation allow-top-navigation-by-user-activation'
  );
  f.src = SRC;
  return f;
}

export function start() {
  host = host || document.getElementById('music');
  if (!host) return;
  if (!host.firstChild) host.appendChild(buildIframe());
  host.classList.add('on');

  clearInterval(loopTimer);
  loopTimer = setInterval(() => {
    // Swap the iframe to restart playback. The new iframe inherits the
    // gesture-trust of the original mount, but Apple may still require a
    // tap — that's a known limitation of the sealed embed.
    host.innerHTML = '';
    host.appendChild(buildIframe());
  }, LOOP_MS);
}

export function stop() {
  if (!host) return;
  host.classList.remove('on');
  host.innerHTML = '';
  clearInterval(loopTimer);
  loopTimer = 0;
}
