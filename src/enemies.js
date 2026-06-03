// ============================================================================
// enemies.js — Sales Reps & XFPs, their projectiles and taunts
// ============================================================================
import { CONFIG } from '../config.js';
import { aabb, rngRange, rngInt, rngPick } from './engine.js';

export class Projectile {
  constructor(x, y, vx, vy, type) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.type = type;            // 'sales' (paper/item) | 'xfp' (calculator)
    this.w = type === 'xfp' ? 26 : 22;
    this.h = type === 'xfp' ? 20 : 18;
    this.spin = 0;
    this.dead = false;
    this.intercepted = false;    // set true when player is hit/blocks; else "dodged"
    this.damage = type === 'xfp' ? 16 : 12;
  }
  update(dt, bounds) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += CONFIG.gravity * 0.35 * dt; // slight arc
    this.spin += dt * (this.vx > 0 ? 8 : -8);
    if (this.x < bounds.minX - 60 || this.x > bounds.maxX + 60 ||
        this.y > bounds.groundY + 40) this.dead = true;
  }
  get rect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}

export class Enemy {
  constructor(x, groundY, type, floor, rng, diff = { throwIntervalMult: 1, projSpeedMult: 1 }) {
    this.type = type;                 // 'sales' | 'xfp'
    this.w = 38; this.h = 64;
    this.x = x;
    this.y = groundY - this.h;
    this.floor = floor;
    this.rng = rng;

    // throw cadence scales with floor difficulty AND selected game difficulty
    const d = CONFIG.difficulty;
    let interval = Math.max(d.minThrowInterval,
      d.baseThrowInterval - floor * d.throwIntervalDecay);
    interval *= diff.throwIntervalMult;
    this.throwInterval = interval;
    this.cooldown = rngRange(rng, 0.4, interval); // stagger first throws
    this.projSpeed = (d.baseProjectileSpeed + floor * d.projectileSpeedPerFloor) * diff.projSpeedMult;

    this.taunt = '';
    this.tauntTimer = 0;
    this.bobPhase = rngRange(rng, 0, Math.PI * 2);
    this.animTime = 0;
  }

  update(dt, player, projectiles, bounds, coffeeActive) {
    this.animTime += dt;
    this.tauntTimer -= dt;
    if (this.tauntTimer < 0) this.taunt = '';

    const slow = coffeeActive ? CONFIG.coffeeThrowSlow : 1;
    this.cooldown -= dt / slow;
    if (this.cooldown <= 0) {
      this.cooldown = this.throwInterval * rngRange(this.rng, 0.8, 1.25);
      this._throwAt(player, projectiles);
    }
  }

  _throwAt(player, projectiles) {
    const taunts = CONFIG.taunts[this.type];
    this.taunt = rngPick(this.rng, taunts);
    this.tauntTimer = 1.6;

    const ox = this.x + this.w / 2;
    const oy = this.y + 18;
    const tx = player.x + player.w / 2;
    const ty = player.y + player.h / 2;
    const dx = tx - ox;
    const dy = ty - oy;
    const dist = Math.max(1, Math.hypot(dx, dy));
    // aim with a slight upward lob to counter gravity-arc
    const speed = this.projSpeed;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed - 90;
    projectiles.push(new Projectile(ox, oy, vx, vy, this.type));
  }

  get rect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}

// Spawn a set of enemies for a floor based on difficulty + zone composition.
export function spawnEnemies(floor, zoneType, bounds, rng, diff) {
  const d = CONFIG.difficulty;
  const count = Math.min(d.maxEnemies,
    Math.round(d.baseEnemies + floor * d.enemiesPerFloor + rngRange(rng, 0, 1)));

  const enemies = [];
  const usableW = bounds.maxX - bounds.minX;
  // spread enemies across the latter ~70% of the floor (toward the exit)
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1);
    const x = bounds.minX + usableW * (0.28 + 0.66 * t) + rngRange(rng, -40, 40);
    let type = zoneType;
    if (zoneType === 'mix') type = rng() < 0.5 ? 'sales' : 'xfp';
    enemies.push(new Enemy(x, bounds.groundY, type, floor, rng, diff));
  }
  return enemies;
}

export { aabb, rngInt };
