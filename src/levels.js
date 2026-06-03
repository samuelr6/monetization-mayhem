// ============================================================================
// levels.js — builds a single floor: bounds, direction, enemies, coins, exit
// Boustrophedon flow: odd floors go left->right, even floors right->left.
// ============================================================================
import { CONFIG, zoneForFloor, isSpecial } from '../config.js';
import { makeRng, rngRange, rngInt } from './engine.js';
import { spawnEnemies } from './enemies.js';

export class Level {
  constructor(floorNum, diff) {
    this.floor = floorNum;
    this.zoneType = zoneForFloor(floorNum);
    this.special = isSpecial(floorNum);     // 'cafeteria' | ... | null
    this.rng = makeRng(0x9e37 ^ (floorNum * 2654435761));

    const groundY = CONFIG.height - 70;
    const minX = 0;
    const maxX = CONFIG.floorInnerWidth;
    this.bounds = { minX, maxX, groundY };

    // direction & spawn/exit sides
    this.leftToRight = (floorNum % 2 === 1);
    const m = CONFIG.wallMargin;
    if (this.leftToRight) {
      this.spawnX = minX + m + 20;
      this.exitX = maxX - m - 40;        // stairwell on the right
      this.exitSide = 'right';
    } else {
      this.spawnX = maxX - m - 60;
      this.exitX = minX + m;             // stairwell on the left
      this.exitSide = 'left';
    }
    this.exitW = 80;

    // enemies (none on special floors — those are safe rooms)
    this.enemies = this.special ? [] : spawnEnemies(floorNum, this.zoneType, this.bounds, this.rng, diff);
    this.projectiles = [];

    // coins (monetization $$) — fewer on special floors
    this.coins = this._scatterCoins();

    this.complete = false;
  }

  _scatterCoins() {
    const coins = [];
    const n = this.special ? 4 : rngInt(this.rng, 5, 9);
    const { minX, maxX, groundY } = this.bounds;
    for (let i = 0; i < n; i++) {
      const x = rngRange(this.rng, minX + 120, maxX - 120);
      const onGround = this.rng() < 0.5;
      const y = onGround ? groundY - 30 : groundY - rngRange(this.rng, 110, 180);
      coins.push({ x, y, r: 11, taken: false, bob: rngRange(this.rng, 0, 6.28) });
    }
    return coins;
  }

  // Stairwell/exit rectangle (the goal zone for this floor).
  get exitRect() {
    return {
      x: this.exitSide === 'right' ? this.bounds.maxX - this.exitW - CONFIG.wallMargin + 30
                                   : this.bounds.minX + CONFIG.wallMargin - 30,
      y: this.bounds.groundY - 150,
      w: this.exitW,
      h: 150,
    };
  }
}
