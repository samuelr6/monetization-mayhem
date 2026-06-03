// ============================================================================
// render.js — ALL vector art, drawn on canvas. Fully parameterized so visuals
// can be tuned to match reference photos the user shares later.
// ============================================================================
import { CONFIG } from '../config.js';

const C = CONFIG.palette;

export class Renderer {
  constructor(ctx, camera) {
    this.ctx = ctx;
    this.cam = camera;
    this.W = CONFIG.width;
    this.H = CONFIG.height;
  }

  clear() {
    const { ctx } = this;
    const g = ctx.createLinearGradient(0, 0, 0, this.H);
    g.addColorStop(0, C.bgTop);
    g.addColorStop(1, C.bgBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.W, this.H);
  }

  // ---- Background: parallax city skyline through the windows ----------------
  background(floor) {
    const { ctx, cam } = this;
    // distant skyline scrolls slowly (parallax)
    const px = -cam.x * 0.25;
    ctx.save();
    ctx.translate(px % 240, 0);
    for (let i = -1; i < this.W / 240 + 2; i++) {
      const bx = i * 240;
      this._cityBlock(bx + 20, 120, 70, 220, floor);
      this._cityBlock(bx + 110, 180, 56, 160, floor);
      this._cityBlock(bx + 180, 150, 64, 190, floor);
    }
    ctx.restore();

    // soft vignette / light haze
    const haze = ctx.createLinearGradient(0, 0, 0, this.H);
    haze.addColorStop(0, 'rgba(255,255,255,0.04)');
    haze.addColorStop(1, 'rgba(0,0,0,0.12)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, this.W, this.H);
  }

  _cityBlock(x, y, w, h, floor) {
    const { ctx } = this;
    ctx.fillStyle = C.skyline;
    ctx.fillRect(x, y, w, h);
    // lit windows
    ctx.fillStyle = 'rgba(244,201,93,0.55)';
    for (let wy = y + 12; wy < y + h - 8; wy += 18) {
      for (let wx = x + 8; wx < x + w - 8; wx += 16) {
        if (((wx + wy + floor) * 7) % 5 < 2) ctx.fillRect(wx, wy, 8, 10);
      }
    }
  }

  // ---- The floor itself -----------------------------------------------------
  floorRoom(level) {
    const { ctx, cam } = this;
    const b = level.bounds;
    const gy = b.groundY;
    ctx.save();
    ctx.translate(-cam.x, 0);

    // interior wall band behind the action
    const wallTop = gy - 230;
    const wg = ctx.createLinearGradient(0, wallTop, 0, gy);
    wg.addColorStop(0, this._roomTint(level));
    wg.addColorStop(1, C.wall);
    ctx.fillStyle = wg;
    ctx.fillRect(b.minX - 100, wallTop, (b.maxX - b.minX) + 200, gy - wallTop);

    // interior windows row (office vibe)
    this._windowStrip(b.minX, b.maxX, wallTop + 24, level);

    // floor slab
    ctx.fillStyle = C.floorBand;
    ctx.fillRect(b.minX - 100, gy, (b.maxX - b.minX) + 200, this.H - gy + 40);
    // trim line (Jetpack-Joyride style bright edge)
    ctx.fillStyle = C.floorTrim;
    ctx.fillRect(b.minX - 100, gy - 4, (b.maxX - b.minX) + 200, 4);
    // floor tiles
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let tx = b.minX; tx < b.maxX; tx += 64) ctx.fillRect(tx, gy + 8, 2, this.H - gy);

    // special-room decor
    if (level.special) this._specialDecor(level, gy);

    // side walls (entrance/exit are stairwells)
    ctx.fillStyle = C.wall;
    ctx.fillRect(b.minX - 100, wallTop - 30, 100, this.H);
    ctx.fillRect(b.maxX, wallTop - 30, 120, this.H);

    // stairwell exit
    this._stairwell(level, gy);

    ctx.restore();
  }

  _roomTint(level) {
    switch (level.special) {
      case 'cafeteria': return '#3a4a3a';
      case 'sanctuary': return '#3a3550';
      case 'coffee':    return '#4a3a2e';
      case 'linkedin':  return '#0e3a6b';   // LinkedIn blue
      case 'review':    return '#4a2f3a';
      default:          return '#2c3350';
    }
  }

  _windowStrip(minX, maxX, y, level) {
    const { ctx } = this;
    for (let x = minX + 40; x < maxX - 40; x += 150) {
      ctx.fillStyle = 'rgba(126,227,255,0.10)';
      ctx.fillRect(x, y, 110, 120);
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, 110, 120);
      ctx.beginPath();
      ctx.moveTo(x + 55, y); ctx.lineTo(x + 55, y + 120);
      ctx.moveTo(x, y + 60); ctx.lineTo(x + 110, y + 60);
      ctx.stroke();
    }
  }

  _specialDecor(level, gy) {
    const { ctx } = this;
    const cx = (level.bounds.minX + level.bounds.maxX) / 2;
    ctx.textAlign = 'center';
    if (level.special === 'cafeteria') {
      // serving counter + trays
      ctx.fillStyle = '#caa46a';
      ctx.fillRect(cx - 160, gy - 60, 320, 56);
      ctx.fillStyle = '#e8d2a0';
      ctx.fillRect(cx - 160, gy - 66, 320, 8);
      for (let i = -2; i <= 2; i++) {
        ctx.fillStyle = ['#e2477e','#3ad29f','#7ee3ff','#ffd166','#e2477e'][i+2];
        ctx.fillRect(cx + i * 56 - 18, gy - 86, 36, 22);
      }
      ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = C.text;
      ctx.fillText('CAFETERIA', cx, gy - 110);
    } else if (level.special === 'sanctuary') {
      ctx.fillStyle = '#7ee3ff';
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.arc(cx, gy - 90, 70, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = C.text;
      ctx.fillText('SANCTUARY', cx, gy - 150);
      ctx.font = '16px sans-serif'; ctx.fillStyle = '#cdd6ee';
      ctx.fillText('press  E  to upgrade', cx, gy - 124);
    } else if (level.special === 'coffee') {
      // coffee booth
      ctx.fillStyle = '#6f4a2e';
      ctx.fillRect(cx - 90, gy - 70, 180, 66);
      ctx.fillStyle = '#caa46a';
      ctx.fillRect(cx - 90, gy - 76, 180, 8);
      ctx.fillStyle = '#2e2018';
      ctx.fillRect(cx - 24, gy - 110, 48, 40);   // cup
      ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5;
      ctx.fillRect(cx - 10, gy - 124, 20, 10);   // steam
      ctx.globalAlpha = 1;
      ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = C.text;
      ctx.fillText('COFFEE BOOSTER', cx, gy - 130);
    } else if (level.special === 'linkedin') {
      // Big LinkedIn logo + welcome
      this._linkedinLogo(cx, gy - 130, 70);
      ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = C.text;
      ctx.fillText('TOP OF LINKEDIN', cx, gy - 200);
      ctx.font = '16px sans-serif'; ctx.fillStyle = '#cdd6ee';
      ctx.fillText('press  E  to review & choose', cx, gy - 90);
    } else if (level.special === 'review') {
      ctx.fillStyle = '#5a3a48';
      ctx.fillRect(cx - 120, gy - 96, 240, 92);  // HR desk
      ctx.fillStyle = '#caa';
      ctx.fillRect(cx - 120, gy - 102, 240, 8);
      ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = C.text;
      ctx.fillText('PERFORMANCE REVIEW', cx, gy - 130);
      ctx.font = '16px sans-serif'; ctx.fillStyle = '#cdd6ee';
      ctx.fillText('press  E  to begin', cx, gy - 106);
    }
    ctx.textAlign = 'left';
  }

  _stairwell(level, gy) {
    const { ctx } = this;
    const r = level.exitRect;
    // doorway glow
    ctx.fillStyle = '#0c1322';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    // stairs (ascending toward exit direction)
    const up = level.exitSide === 'right' ? 1 : -1;
    ctx.fillStyle = C.stairShadow;
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const sw = r.w / steps;
      const sx = up === 1 ? r.x + i * sw : r.x + r.w - (i + 1) * sw;
      const sh = (i + 1) * (r.h / steps);
      ctx.fillStyle = i % 2 ? C.stair : C.stairShadow;
      ctx.fillRect(sx, r.y + r.h - sh, sw, sh);
    }
    // EXIT sign
    ctx.fillStyle = C.health;
    ctx.fillRect(r.x + r.w / 2 - 26, r.y - 26, 52, 20);
    ctx.fillStyle = '#06281d';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('UP ▲', r.x + r.w / 2, r.y - 11);
    ctx.textAlign = 'left';
  }

  // ---- Coins ($$) -----------------------------------------------------------
  coins(level, t) {
    const { ctx, cam } = this;
    ctx.save();
    ctx.translate(-cam.x, 0);
    for (const c of level.coins) {
      if (c.taken) continue;
      const yy = c.y + Math.sin(t * 3 + c.bob) * 4;
      ctx.beginPath();
      ctx.fillStyle = C.coin;
      ctx.arc(c.x, yy, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9a6b15';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('$', c.x, yy + 1);
      ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    }
    ctx.restore();
  }

  // ---- Projectiles ----------------------------------------------------------
  projectiles(list) {
    const { ctx, cam } = this;
    ctx.save();
    ctx.translate(-cam.x, 0);
    for (const p of list) {
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.spin);
      if (p.type === 'xfp') {
        // calculator
        ctx.fillStyle = '#23303f';
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.fillStyle = C.projectileXfp;
        ctx.fillRect(-p.w / 2 + 3, -p.h / 2 + 3, p.w - 6, 6);
        ctx.fillStyle = '#5a6b7a';
        for (let r = 0; r < 2; r++)
          for (let col = 0; col < 3; col++)
            ctx.fillRect(-p.w / 2 + 4 + col * 6, 2 + r * 6, 4, 4);
      } else {
        // crumpled pricing sheet
        ctx.fillStyle = '#f4f7ff';
        ctx.beginPath();
        ctx.moveTo(-p.w/2, -p.h/2); ctx.lineTo(p.w/2, -p.h/3);
        ctx.lineTo(p.w/2-2, p.h/2); ctx.lineTo(-p.w/3, p.h/2-2);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#c2c8d8'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-4,-3); ctx.lineTo(5,2); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // ---- Enemies --------------------------------------------------------------
  enemies(level, t) {
    const { ctx, cam } = this;
    ctx.save();
    ctx.translate(-cam.x, 0);
    for (const e of level.enemies) {
      const bob = Math.sin(t * 3 + e.bobPhase) * 3;
      this._drawWorker(e.x, e.y + bob, e.type);
      if (e.taunt) this._speech(e.x + e.w / 2, e.y + bob - 18, e.taunt);
    }
    ctx.restore();
  }

  _drawWorker(x, y, type) {
    const { ctx } = this;
    const suit = type === 'xfp' ? C.xfpSuit : C.salesSuit;
    const skin = type === 'xfp' ? C.xfpSkin : C.salesSkin;
    const w = 38, h = 64;
    // legs
    ctx.fillStyle = '#1d2433';
    ctx.fillRect(x + 8, y + 42, 9, 22);
    ctx.fillRect(x + 21, y + 42, 9, 22);
    // torso (suit)
    ctx.fillStyle = suit;
    this._roundRect(x + 4, y + 18, w - 8, 30, 6); ctx.fill();
    // shirt + tie
    ctx.fillStyle = '#f4f7ff';
    ctx.beginPath();
    ctx.moveTo(x + w/2 - 6, y + 18); ctx.lineTo(x + w/2 + 6, y + 18);
    ctx.lineTo(x + w/2, y + 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = type === 'xfp' ? '#2e7d52' : '#b8332f';
    ctx.fillRect(x + w/2 - 2, y + 20, 4, 14);
    // throwing arm
    ctx.strokeStyle = suit; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + w - 6, y + 24);
    ctx.lineTo(x + w + 6, y + 12);
    ctx.stroke();
    // head
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(x + w/2, y + 10, 11, 0, Math.PI * 2); ctx.fill();
    // hair
    ctx.fillStyle = '#2a2018';
    ctx.beginPath(); ctx.arc(x + w/2, y + 6, 11, Math.PI, 0); ctx.fill();
    // ID badge lanyard
    ctx.strokeStyle = '#0c1322'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + w/2, y + 18); ctx.lineTo(x + w/2 + 5, y + 30); ctx.stroke();
    ctx.fillStyle = '#0c1322'; ctx.fillRect(x + w/2 + 2, y + 30, 8, 6);
  }

  _speech(cx, cy, text) {
    const { ctx } = this;
    ctx.font = 'bold 13px sans-serif';
    const wTxt = ctx.measureText(text).width;
    const padX = 10, w = wTxt + padX * 2, h = 24;
    const x = cx - w / 2, y = cy - h - 6;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    this._roundRect(x, y, w, h, 7); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 6, y + h); ctx.lineTo(cx + 6, y + h); ctx.lineTo(cx, y + h + 8);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1b2233';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, y + h / 2 + 1);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  // ---- ZOE  (parameterized — tune here to match reference photos) -----------
  player(p, t) {
    const { ctx, cam } = this;
    ctx.save();
    ctx.translate(-cam.x, 0);

    const x = p.x, y = p.y, w = p.w, h = p.h;
    const cx = x + w / 2;
    const face = p.facing;
    const flicker = p.invuln > 0 && Math.floor(t * 20) % 2 === 0;
    if (flicker) ctx.globalAlpha = 0.45;

    const ducking = p.ducking;
    // leg swing for run cycle
    const swing = Math.sin(p.runPhase) * (p.onGround ? 8 : 2);

    // ----- legs -----
    ctx.fillStyle = C.zoePants;
    if (ducking) {
      ctx.fillRect(x + 4, y + h - 14, w - 8, 14);
    } else {
      ctx.save();
      this._roundRect(x + 6, y + h - 24 + 0, 10, 24, 4); ctx.fill();
      this._roundRect(x + w - 16, y + h - 24, 10, 24, 4); ctx.fill();
      ctx.restore();
      // shoes
      ctx.fillStyle = C.zoeShoe;
      ctx.fillRect(x + 4 + (swing > 0 ? 2 : 0), y + h - 6, 14, 6);
      ctx.fillRect(x + w - 18 - (swing < 0 ? 2 : 0), y + h - 6, 14, 6);
    }

    // ----- torso / shirt -----
    const torsoTop = ducking ? y + 6 : y + 18;
    const torsoH = ducking ? h - 18 : h - 42;
    ctx.fillStyle = C.zoeShirt;
    this._roundRect(x + 3, torsoTop, w - 6, torsoH, 7); ctx.fill();

    // ----- arms / blocking -----
    ctx.strokeStyle = C.zoeShirt; ctx.lineWidth = 8; ctx.lineCap = 'round';
    if (p.blocking) {
      // forearm raised across body as a shield
      ctx.strokeStyle = C.zoeSkin;
      ctx.beginPath();
      ctx.moveTo(cx - face * 2, torsoTop + 8);
      ctx.lineTo(cx + face * 16, torsoTop + 2);
      ctx.stroke();
      // shield shimmer
      ctx.strokeStyle = C.block; ctx.lineWidth = 3; ctx.globalAlpha *= 0.9;
      ctx.beginPath();
      ctx.arc(cx + face * 14, torsoTop + 10, 18, -1.1, 1.1);
      ctx.stroke();
      ctx.globalAlpha = flicker ? 0.45 : 1;
    } else {
      ctx.strokeStyle = C.zoeSkin; ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(x + 6, torsoTop + 6);
      ctx.lineTo(x + 2 + swing * 0.4, torsoTop + 20);
      ctx.moveTo(x + w - 6, torsoTop + 6);
      ctx.lineTo(x + w - 2 - swing * 0.4, torsoTop + 20);
      ctx.stroke();
    }

    // ----- head -----
    const headY = (ducking ? y + 2 : y - 2) + 10;
    ctx.fillStyle = C.zoeSkin;
    ctx.beginPath(); ctx.arc(cx, headY, 11, 0, Math.PI * 2); ctx.fill();

    // ----- ZOE'S HAIR: black, curly, shoulder-length -----
    this._zoeHair(cx, headY, face);

    // ----- face (simple, facing-aware) -----
    ctx.fillStyle = '#1b2233';
    ctx.beginPath(); ctx.arc(cx + face * 4, headY - 1, 1.6, 0, Math.PI * 2); ctx.fill();
    // smile
    ctx.strokeStyle = '#7a3b2e'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx + face * 3, headY + 3, 3, 0.1, Math.PI - 0.1); ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Curly shoulder-length black hair — clusters of arcs framing the face.
  _zoeHair(cx, headY, face) {
    const { ctx } = this;
    ctx.fillStyle = C.zoeHair;
    // crown
    ctx.beginPath(); ctx.arc(cx, headY - 3, 13, Math.PI * 0.92, Math.PI * 2.08); ctx.fill();
    // curl clusters down to the shoulders on both sides
    const curls = [
      [-13, -2, 6], [-15, 6, 6], [-13, 14, 6], [-10, 21, 5],
      [13, -2, 6],  [15, 6, 6],  [13, 14, 6],  [10, 21, 5],
      [-7, -11, 5], [0, -13, 6], [7, -11, 5],
    ];
    for (const [dx, dy, r] of curls) {
      ctx.beginPath(); ctx.arc(cx + dx, headY + dy, r, 0, Math.PI * 2); ctx.fill();
    }
    // a few highlight curls for texture
    ctx.fillStyle = 'rgba(90,70,55,0.5)';
    for (const [dx, dy, r] of [[-12, 8, 2.5], [12, 8, 2.5], [-11, 16, 2.2], [11, 16, 2.2]]) {
      ctx.beginPath(); ctx.arc(cx + dx, headY + dy, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ---- HUD (drawn in screen space) ------------------------------------------
  hud(state) {
    const { ctx } = this;
    const p = state.player;
    // top bar background
    ctx.fillStyle = 'rgba(8,14,28,0.55)';
    this._roundRect(12, 12, 360, 64, 12); ctx.fill();

    // health
    this._bar(28, 26, 180, 14, p.health / p.maxHealth,
      p.health / p.maxHealth < 0.3 ? C.healthLow : C.health, 'HEALTH');
    // stamina
    this._bar(28, 52, 180, 10, p.stamina / CONFIG.player.blockStamina, C.stamina, 'BLOCK');

    // floor + coins
    ctx.fillStyle = C.text;
    ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(`Floor ${state.floor} / ${CONFIG.totalFloors}`, this.W - 20, 36);
    ctx.fillStyle = C.coin; ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`$ ${p.coins}`, this.W - 20, 60);
    ctx.textAlign = 'left';

    // coffee indicator
    if (p.coffeeFloorsLeft > 0) {
      ctx.fillStyle = 'rgba(244,201,93,0.9)';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`☕ Boost: ${p.coffeeFloorsLeft} floors left`, 230, 44);
    }

    // hint when near exit
    if (state.nearExit) {
      ctx.fillStyle = C.text; ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('▲ Reach the stairwell to ascend', this.W / 2, this.H - 18);
      ctx.textAlign = 'left';
    }
  }

  _bar(x, y, w, h, frac, color, label) {
    const { ctx } = this;
    frac = Math.max(0, Math.min(1, frac));
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    this._roundRect(x, y, w, h, h / 2); ctx.fill();
    ctx.fillStyle = color;
    this._roundRect(x, y, w * frac, h, h / 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `bold ${h - 2}px sans-serif`;
    ctx.fillText(label, x + w + 8, y + h - 1);
  }

  // ---- helpers --------------------------------------------------------------
  _roundRect(x, y, w, h, r) {
    const { ctx } = this;
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---- LinkedIn logo (centered at cx, top-y, size = square side) -----------
  _linkedinLogo(cx, topY, size) {
    const { ctx } = this;
    const x = cx - size / 2, y = topY;
    // blue square
    ctx.fillStyle = '#0a66c2';
    this._roundRect(x, y, size, size, Math.max(4, size * 0.12)); ctx.fill();
    // white "in" — drawn with shapes so it scales cleanly
    ctx.fillStyle = '#ffffff';
    const s = size;
    // dot of the "i"
    ctx.beginPath();
    ctx.arc(x + s * 0.26, y + s * 0.28, s * 0.07, 0, Math.PI * 2); ctx.fill();
    // stem of the "i"
    ctx.fillRect(x + s * 0.20, y + s * 0.40, s * 0.12, s * 0.38);
    // "n" — vertical bar + arch + right bar
    ctx.fillRect(x + s * 0.40, y + s * 0.40, s * 0.12, s * 0.38);
    ctx.fillRect(x + s * 0.66, y + s * 0.54, s * 0.12, s * 0.24);
    // arch top of n
    ctx.beginPath();
    ctx.arc(x + s * 0.60, y + s * 0.55, s * 0.13, Math.PI, Math.PI * 1.95);
    ctx.lineWidth = s * 0.12; ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  }

  // ---- TITLE SCENE: Empire State Bldg + LinkedIn logo above + Zoe in front -
  titleScene(t) {
    const { ctx } = this;
    const W = this.W, H = this.H;

    // sky gradient is already drawn by clear(); add stars + skyline
    // stars
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 137) % W;
      const sy = (i * 71) % (H * 0.45);
      const tw = 0.5 + Math.sin(t * 2 + i) * 0.5;
      ctx.globalAlpha = 0.4 + 0.5 * tw;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;

    // distant city skyline
    for (let i = 0; i < W; i += 60) {
      const bh = 60 + ((i * 13) % 80);
      ctx.fillStyle = C.skyline;
      ctx.fillRect(i, H - 90 - bh, 50, bh);
      // a few lit windows
      ctx.fillStyle = 'rgba(244,201,93,0.45)';
      for (let wy = H - 90 - bh + 10; wy < H - 95; wy += 14) {
        for (let wx = i + 6; wx < i + 44; wx += 10) {
          if (((wx + wy) * 7) % 5 < 2) ctx.fillRect(wx, wy, 4, 6);
        }
      }
    }

    // Empire State Building (stylized) — centered
    const cx = W / 2;
    const baseY = H - 90;
    this._empireState(cx, baseY);

    // LinkedIn logo above the entrance with a soft glow
    const logoSize = 70;
    const logoY = baseY - 360;
    ctx.save();
    ctx.shadowColor = '#0a66c2';
    ctx.shadowBlur = 22;
    this._linkedinLogo(cx, logoY, logoSize);
    ctx.restore();

    // floating connector line from logo down to top of building marquee
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, logoY + logoSize + 4);
    ctx.lineTo(cx, baseY - 250);
    ctx.stroke();
    ctx.setLineDash([]);

    // Zoe in front of the entrance, with a subtle idle bob
    const zoeBob = Math.sin(t * 2) * 2;
    const zoeY = baseY - 56 + zoeBob;
    const zoeX = cx - 17;
    this._drawZoeStandalone(zoeX, zoeY, 1);

    // ground
    ctx.fillStyle = '#1b2233';
    ctx.fillRect(0, baseY, W, H - baseY);
    ctx.fillStyle = C.floorTrim;
    ctx.fillRect(0, baseY - 3, W, 3);
  }

  _empireState(cx, baseY) {
    const { ctx } = this;
    // building tiers (widest at bottom, narrowing as it climbs)
    const tiers = [
      { w: 220, h: 110 },
      { w: 180, h: 90 },
      { w: 140, h: 70 },
      { w: 100, h: 60 },
      { w: 64,  h: 40 },
    ];
    let y = baseY;
    for (const t of tiers) {
      const x = cx - t.w / 2;
      const grad = ctx.createLinearGradient(x, y - t.h, x + t.w, y);
      grad.addColorStop(0, '#3a4a6b');
      grad.addColorStop(1, '#1f2a45');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y - t.h, t.w, t.h);
      // window grid
      ctx.fillStyle = 'rgba(244,201,93,0.55)';
      for (let wy = y - t.h + 10; wy < y - 8; wy += 12) {
        for (let wx = x + 8; wx < x + t.w - 8; wx += 10) {
          if (((wx + wy) * 7) % 5 < 2) ctx.fillRect(wx, wy, 4, 6);
        }
      }
      // trim
      ctx.fillStyle = C.floorTrim;
      ctx.fillRect(x, y - t.h - 2, t.w, 2);
      y -= t.h;
    }
    // spire
    ctx.fillStyle = '#2a3550';
    ctx.beginPath();
    ctx.moveTo(cx - 8, y);
    ctx.lineTo(cx + 8, y);
    ctx.lineTo(cx + 3, y - 50);
    ctx.lineTo(cx - 3, y - 50);
    ctx.closePath(); ctx.fill();
    // antenna
    ctx.fillRect(cx - 1, y - 90, 2, 40);

    // entrance arch at the base
    const ex = cx - 24, ey = baseY - 56, ew = 48, eh = 56;
    ctx.fillStyle = '#10182b';
    ctx.beginPath();
    ctx.moveTo(ex, ey + eh);
    ctx.lineTo(ex, ey + 14);
    ctx.quadraticCurveTo(ex + ew / 2, ey - 8, ex + ew, ey + 14);
    ctx.lineTo(ex + ew, ey + eh);
    ctx.closePath(); ctx.fill();
    // doors
    ctx.fillStyle = '#caa46a';
    ctx.fillRect(ex + 6, ey + 24, 14, eh - 24);
    ctx.fillRect(ex + ew - 20, ey + 24, 14, eh - 24);
  }

  // Standalone Zoe (used for title + rocket); same look as in-game player.
  _drawZoeStandalone(x, y, face) {
    const fake = { x, y, w: 34, h: 56, facing: face, ducking: false,
                   blocking: false, invuln: 0, onGround: true, runPhase: 0 };
    const { ctx, cam } = this;
    // bypass camera translate by adding it back: titleScene/rocketScene are in
    // screen space; the player() method translates by -cam.x. So save the camera
    // values, zero them, draw, restore.
    const ox = cam.x, oy = cam.y;
    cam.x = 0; cam.y = 0;
    this.player(fake, 0);
    cam.x = ox; cam.y = oy;
  }

  // ---- ROCKET SCENE: Zoe in a rocket, "Sierra AI to the moon" --------------
  rocketScene(t) {
    const { ctx } = this;
    const W = this.W, H = this.H;

    // deep-space sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#05071a');
    sky.addColorStop(0.7, '#10142e');
    sky.addColorStop(1, '#1b2a4a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 90; i++) {
      const sx = (i * 137 + t * 30) % W;
      const sy = (i * 71) % H;
      const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i));
      ctx.globalAlpha = a; ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;

    // distant moon
    const moonX = W * 0.78, moonY = H * 0.22;
    ctx.fillStyle = '#f4f1d6';
    ctx.beginPath(); ctx.arc(moonX, moonY, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath(); ctx.arc(moonX - 14, moonY - 8, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(moonX + 10, moonY + 12, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(moonX + 4, moonY - 18, 4, 0, Math.PI * 2); ctx.fill();

    // ground (Earth horizon) — slides down as rocket "lifts off"
    const liftoff = Math.min(1, t / 2.5);
    const groundY = H - 80 + liftoff * 200;
    ctx.fillStyle = '#2a3550';
    ctx.fillRect(0, groundY, W, H - groundY + 200);
    ctx.fillStyle = '#3a4a6b';
    for (let i = 0; i < W; i += 80) {
      ctx.fillRect(i, groundY - 6, 60, 6);
    }

    // rocket: rises and trembles slightly
    const cx = W / 2;
    const baseY = H * 0.78;
    const rise = liftoff * 220;
    const tremble = (1 - liftoff) * Math.sin(t * 30) * 1.5;
    const rocketY = baseY - rise + tremble;

    this._rocket(cx, rocketY, t);

    // exhaust flames + smoke trail (only while close to ground)
    if (liftoff < 1) this._rocketFlames(cx, rocketY + 70, t);

    // tagline at top — "Sierra AI to the moon"
    ctx.save();
    const headlineAlpha = Math.min(1, t * 1.2);
    ctx.globalAlpha = headlineAlpha;
    ctx.textAlign = 'center';
    ctx.font = 'bold 40px sans-serif';
    const grad = ctx.createLinearGradient(0, 30, 0, 80);
    grad.addColorStop(0, '#ffd166');
    grad.addColorStop(1, '#f4c95d');
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(244,201,93,0.6)';
    ctx.shadowBlur = 18;
    ctx.fillText('"Sierra AI" to the moon', W / 2, 60);
    ctx.shadowBlur = 0;
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#cdd6ee';
    ctx.fillText('— Zoe, post-LinkedIn —', W / 2, 86);

    // "Good luck, Zoe!" — big yellow lettering at the bottom of the rocket scene
    const wishAlpha = Math.min(1, Math.max(0, (t - 0.5) * 1.5));
    ctx.globalAlpha = wishAlpha;
    ctx.font = 'bold 56px sans-serif';
    const wishGrad = ctx.createLinearGradient(0, H - 80, 0, H - 20);
    wishGrad.addColorStop(0, '#ffd166');
    wishGrad.addColorStop(1, '#f4c95d');
    ctx.fillStyle = wishGrad;
    ctx.shadowColor = 'rgba(244,201,93,0.7)';
    ctx.shadowBlur = 24;
    ctx.fillText('Good luck, Zoe!', W / 2, H - 30);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
    ctx.restore();
  }

  _rocket(cx, cy, t) {
    const { ctx } = this;
    // body
    const bodyW = 70, bodyH = 140;
    const bx = cx - bodyW / 2, by = cy - bodyH / 2;
    // nose cone
    ctx.fillStyle = '#e2477e';
    ctx.beginPath();
    ctx.moveTo(cx, by - 50);
    ctx.lineTo(bx, by + 20);
    ctx.lineTo(bx + bodyW, by + 20);
    ctx.closePath(); ctx.fill();
    // body
    const grad = ctx.createLinearGradient(bx, by, bx + bodyW, by);
    grad.addColorStop(0, '#f4f7ff');
    grad.addColorStop(0.5, '#dde4f2');
    grad.addColorStop(1, '#aab4c8');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bodyW, bodyH);
    // mid stripe (Sierra branding band)
    ctx.fillStyle = '#0a66c2';
    ctx.fillRect(bx, by + 30, bodyW, 14);
    // SIERRA text on stripe
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SIERRA AI', cx, by + 40);
    ctx.textAlign = 'left';

    // window/porthole with Zoe inside
    const winR = 22;
    ctx.fillStyle = '#0c1322';
    ctx.beginPath(); ctx.arc(cx, by + 78, winR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#aab4c8'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, by + 78, winR, 0, Math.PI * 2); ctx.stroke();
    // Zoe peeking through (head + curly hair) — clipped to porthole
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, by + 78, winR - 2, 0, Math.PI * 2); ctx.clip();
    // face
    ctx.fillStyle = C.zoeSkin;
    ctx.beginPath(); ctx.arc(cx, by + 82, 14, 0, Math.PI * 2); ctx.fill();
    // hair
    ctx.fillStyle = C.zoeHair;
    ctx.beginPath(); ctx.arc(cx, by + 74, 15, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
    for (const [dx, dy, r] of [[-14,-2,5],[14,-2,5],[-14,8,5],[14,8,5],[0,-14,6],[-9,-12,5],[9,-12,5]]) {
      ctx.beginPath(); ctx.arc(cx + dx, by + 82 + dy, r, 0, Math.PI * 2); ctx.fill();
    }
    // eyes + smile
    ctx.fillStyle = '#1b2233';
    ctx.beginPath(); ctx.arc(cx - 4, by + 82, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 4, by + 82, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7a3b2e'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, by + 86, 4, 0.1, Math.PI - 0.1); ctx.stroke();
    ctx.restore();

    // fins
    ctx.fillStyle = '#e2477e';
    ctx.beginPath();
    ctx.moveTo(bx, by + bodyH);
    ctx.lineTo(bx - 22, by + bodyH + 30);
    ctx.lineTo(bx, by + bodyH - 20);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx + bodyW, by + bodyH);
    ctx.lineTo(bx + bodyW + 22, by + bodyH + 30);
    ctx.lineTo(bx + bodyW, by + bodyH - 20);
    ctx.closePath(); ctx.fill();
    // bottom plate
    ctx.fillStyle = '#22304a';
    ctx.fillRect(bx + 6, by + bodyH, bodyW - 12, 14);
  }

  _rocketFlames(cx, baseY, t) {
    const { ctx } = this;
    // flicker
    const flick = 0.6 + 0.4 * Math.sin(t * 30);
    const fh = 70 * flick;
    // outer flame (orange)
    ctx.fillStyle = '#ff7b3d';
    ctx.beginPath();
    ctx.moveTo(cx - 18, baseY);
    ctx.quadraticCurveTo(cx, baseY + fh + 10, cx + 18, baseY);
    ctx.closePath(); ctx.fill();
    // inner flame (yellow)
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(cx - 10, baseY);
    ctx.quadraticCurveTo(cx, baseY + fh - 6, cx + 10, baseY);
    ctx.closePath(); ctx.fill();
    // smoke puffs trailing down
    ctx.fillStyle = 'rgba(220,220,230,0.5)';
    for (let i = 0; i < 6; i++) {
      const r = 14 + Math.sin(t * 8 + i) * 3;
      ctx.beginPath(); ctx.arc(cx + (i % 2 ? -1 : 1) * (8 + i * 4), baseY + fh + 12 + i * 14, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  flashBanner(text, alpha) {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(8,14,28,0.8)';
    this._roundRect(this.W / 2 - 240, 90, 480, 50, 12); ctx.fill();
    ctx.fillStyle = C.text; ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, this.W / 2, 121);
    ctx.textAlign = 'left';
    ctx.restore();
  }
}
