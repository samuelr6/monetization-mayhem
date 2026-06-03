// ============================================================================
// engine.js — input handling, AABB collision helpers, camera, RNG, timing
// ============================================================================

// ---- Input -----------------------------------------------------------------
export class Input {
  constructor(target = window) {
    this.keys = new Set();
    this.pressed = new Set();   // edge-triggered this frame
    this._down = new Set();
    target.addEventListener('keydown', (e) => {
      if (TRACKED.has(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this._down.add(e.code);
      this.keys.add(e.code);
    });
    target.addEventListener('keyup', (e) => {
      if (TRACKED.has(e.code)) e.preventDefault();
      this.keys.delete(e.code);
    });
    window.addEventListener('blur', () => this.keys.clear());
  }
  // Call once per frame, after reading, to roll edge state.
  beginFrame() {
    this.pressed = this._down;
    this._down = new Set();
  }
  held(code)    { return this.keys.has(code); }
  justDown(code){ return this.pressed.has(code); }

  get left()     { return this.held('ArrowLeft'); }
  get right()    { return this.held('ArrowRight'); }
  get jumpDown() { return this.justDown('ArrowUp'); }   // edge-triggered
  get jumpHeld() { return this.held('ArrowUp'); }
  get duck()     { return this.held('ArrowDown'); }
  get block()    { return this.held('Space'); }
}
const TRACKED = new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space']);

// ---- AABB collision --------------------------------------------------------
export function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
export function rectsOverlap(a, b) {
  return aabb(a.x, a.y, a.w, a.h, b.x, b.y, b.w, b.h);
}

// ---- Camera ----------------------------------------------------------------
export class Camera {
  constructor(viewW, viewH) {
    this.x = 0; this.y = 0;
    this.viewW = viewW; this.viewH = viewH;
    this.minX = 0; this.maxX = 0;
  }
  setBounds(minX, maxX) { this.minX = minX; this.maxX = maxX; }
  follow(targetCx, lerp = 0.12) {
    let desired = targetCx - this.viewW / 2;
    desired = Math.max(this.minX, Math.min(this.maxX, desired));
    this.x += (desired - this.x) * lerp;
  }
  snap(targetCx) {
    let desired = targetCx - this.viewW / 2;
    this.x = Math.max(this.minX, Math.min(this.maxX, desired));
  }
}

// ---- Deterministic-ish RNG (seedable per floor) ----------------------------
export function makeRng(seed) {
  let s = seed >>> 0;
  return function rng() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
export function rngRange(rng, lo, hi) { return lo + rng() * (hi - lo); }
export function rngInt(rng, lo, hi) { return Math.floor(rngRange(rng, lo, hi + 1)); }
export function rngPick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

// ---- Misc ------------------------------------------------------------------
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;
