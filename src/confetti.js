// ============================================================================
// confetti.js — LinkedIn-blue + white confetti for the Liftoff summary card.
// Self-contained: start() begins the animation on #confetti, stop() halts it.
// ============================================================================

const COLORS = ['#0a66c2', '#0a66c2', '#ffffff', '#cdd6ee', '#0073b1'];

let canvas, ctx, raf = 0, pieces = [], running = false, last = 0;

function resize() {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = canvas.clientWidth  * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function spawnPiece(w) {
  return {
    x: Math.random() * w,
    y: -20 - Math.random() * 200,        // staggered start above viewport
    vx: (Math.random() - 0.5) * 60,
    vy: 90 + Math.random() * 120,        // px/s
    size: 6 + Math.random() * 6,
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 6,
    color: COLORS[(Math.random() * COLORS.length) | 0],
    sway: Math.random() * Math.PI * 2,
  };
}

function tick(now) {
  if (!running) return;
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  const w = canvas.clientWidth, h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);

  for (const p of pieces) {
    p.sway += dt * 2;
    p.x += (p.vx + Math.sin(p.sway) * 30) * dt;
    p.y += p.vy * dt;
    p.rot += p.rotV * dt;

    if (p.y > h + 30) {                  // recycle off-screen pieces
      Object.assign(p, spawnPiece(w));
      p.y = -20;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    // alternate rectangles and small ovals for a richer look
    if ((p.size | 0) % 2 === 0) {
      ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.55, p.size * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  raf = requestAnimationFrame(tick);
}

export function start() {
  canvas = document.getElementById('confetti');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  canvas.classList.add('on');
  resize();
  window.addEventListener('resize', resize);

  const w = canvas.clientWidth;
  pieces = Array.from({ length: 140 }, () => spawnPiece(w));
  running = true;
  last = performance.now();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(tick);
}

export function stop() {
  running = false;
  cancelAnimationFrame(raf);
  if (canvas) {
    canvas.classList.remove('on');
    ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  window.removeEventListener('resize', resize);
}
