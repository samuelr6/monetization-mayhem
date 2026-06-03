// ============================================================================
// player.js — Zoe: movement, jump, duck, block, health, stats, upgrades
// ============================================================================
import { CONFIG } from '../config.js';
import { clamp } from './engine.js';

export class Player {
  constructor(difficulty = CONFIG.difficultyLevels[CONFIG.defaultDifficulty]) {
    const p = CONFIG.player;
    this.w = p.width;
    this.h = p.height;
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.facing = 1;          // 1 = right, -1 = left
    this.ducking = false;
    this.blocking = false;

    // persistent stats (carried across floors)
    this.upgrades = { speed: 0, jump: 0, block: 0, health: 0 };
    this.maxHealth = Math.round(p.maxHealth * difficulty.healthMult);
    this.health = this.maxHealth;
    this.stamina = p.blockStamina;
    this.invuln = 0;
    this.coins = 0;

    // coffee boost
    this.coffeeFloorsLeft = 0;

    // run stats (shown in reviews)
    this.stats = { damageTaken: 0, blocked: 0, dodged: 0 };

    // animation
    this.animTime = 0;
    this.runPhase = 0;
  }

  // --- derived stats ---
  get moveSpeed() {
    const base = CONFIG.player.moveSpeed + this.upgrades.speed * CONFIG.statStep.speed;
    return base * (this.coffeeFloorsLeft > 0 ? CONFIG.coffeeSpeedMult : 1);
  }
  get jumpVelocity() {
    return CONFIG.player.jumpVelocity + this.upgrades.jump * CONFIG.statStep.jump;
  }
  get blockMult() { return 1 + this.upgrades.block * CONFIG.statStep.block; }

  applyHealthUpgrade() {
    this.upgrades.health++;
    const newMax = CONFIG.player.maxHealth + this.upgrades.health * CONFIG.statStep.health;
    const gained = newMax - this.maxHealth;
    this.maxHealth = newMax;
    this.health = clamp(this.health + gained, 0, this.maxHealth);
  }

  heal(amount) { this.health = clamp(this.health + amount, 0, this.maxHealth); }

  takeHit(damage) {
    if (this.invuln > 0) return false;
    if (this.blocking && this.stamina > 5) {
      // blocking absorbs most damage, scaled by block stat, costs stamina
      const absorbed = clamp(damage * (0.75 + 0.15 * this.upgrades.block), 0, damage);
      const leak = (damage - absorbed) / this.blockMult;
      this.health = clamp(this.health - leak, 0, this.maxHealth);
      this.stamina = clamp(this.stamina - 22, 0, CONFIG.player.blockStamina);
      this.invuln = 0.35;
      this.stats.blocked++;
      this.stats.damageTaken += leak;
      return 'blocked';
    }
    this.health = clamp(this.health - damage, 0, this.maxHealth);
    this.invuln = CONFIG.player.invulnAfterHit;
    this.stats.damageTaken += damage;
    return 'hit';
  }

  get height() { return this.ducking ? CONFIG.player.duckHeight : CONFIG.player.height; }

  update(dt, input, bounds) {
    const wasDuck = this.ducking;
    this.ducking = input.duck && this.onGround;
    this.blocking = input.block && this.stamina > 2;

    // keep feet planted when duck height changes
    const newH = this.height;
    if (newH !== this.h) {
      this.y += (this.h - newH);
      this.h = newH;
    }

    // horizontal movement (slower while ducking/blocking)
    let speed = this.moveSpeed;
    if (this.ducking) speed *= 0.45;
    if (this.blocking) speed *= 0.55;

    let dir = 0;
    if (input.left)  dir -= 1;
    if (input.right) dir += 1;
    if (dir !== 0) { this.facing = dir; this.vx = dir * speed; }
    else { this.vx *= CONFIG.groundFriction; if (Math.abs(this.vx) < 6) this.vx = 0; }

    // jump
    if (input.jumpDown && this.onGround && !this.ducking) {
      this.vy = -this.jumpVelocity;
      this.onGround = false;
    }
    // variable jump height: cut velocity if released early
    if (!input.jumpHeld && this.vy < -200) this.vy *= 0.86;

    // gravity
    this.vy += CONFIG.gravity * dt;

    // integrate
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // floor (ground) collision
    if (this.y + this.h >= bounds.groundY) {
      this.y = bounds.groundY - this.h;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // walls
    this.x = clamp(this.x, bounds.minX, bounds.maxX - this.w);

    // stamina regen / drain
    if (this.blocking) {
      this.stamina = clamp(this.stamina - CONFIG.player.blockDrain * dt, 0, CONFIG.player.blockStamina);
    } else {
      this.stamina = clamp(this.stamina + CONFIG.player.blockRegen * dt, 0, CONFIG.player.blockStamina);
    }

    // timers
    if (this.invuln > 0) this.invuln -= dt;

    // anim
    this.animTime += dt;
    if (this.onGround && Math.abs(this.vx) > 20) this.runPhase += dt * 12;
    else this.runPhase = 0;
  }

  get rect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}
