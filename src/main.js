// ============================================================================
// main.js — game state machine, loop, collisions, screens (Monetization Mayhem)
// ============================================================================
import { CONFIG, isSpecial } from '../config.js';
import { Input, Camera, rectsOverlap } from './engine.js';
import { Renderer } from './render.js';
import { Player } from './player.js';
import { Level } from './levels.js';
import { SPECIAL_INFO, UPGRADES } from './floors.js';
import * as confetti from './confetti.js';
import * as music from './music.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const input = new Input();
const camera = new Camera(CONFIG.width, CONFIG.height);
const renderer = new Renderer(ctx, camera);

// DOM overlays
const overlayTitle = document.getElementById('overlay-title');
const overlayBriefing = document.getElementById('overlay-briefing');
const overlayMsg = document.getElementById('overlay-msg');
const msgCard = document.getElementById('msg-card');
document.getElementById('btn-start').addEventListener('click', () => showBriefing());
document.getElementById('btn-begin').addEventListener('click', () => beginRun());

// difficulty radio group on title screen
const diffRadios = () => Array.from(document.querySelectorAll('input[name="difficulty"]'));
function getSelectedDifficultyKey() {
  const r = diffRadios().find((i) => i.checked);
  return (r && r.value) || CONFIG.defaultDifficulty;
}

const game = {
  state: 'title',          // title | play | menu | banner | win | lose | rocket
  player: null,
  level: null,
  floor: 1,
  time: 0,                  // elapsed seconds of climbing
  nearExit: false,
  banner: null,            // { text, ttl }
  awaitingResume: false,
  difficultyKey: CONFIG.defaultDifficulty,
  difficulty: CONFIG.difficultyLevels[CONFIG.defaultDifficulty],
  rocket: null,             // { t } animation state for the win/rocket screen
};

// ---- Lifecycle -------------------------------------------------------------
// Step 1: title -> briefing. Lock in the difficulty here so it reflects what
// the player selected on the title screen.
function showBriefing() {
  game.difficultyKey = getSelectedDifficultyKey();
  game.difficulty = CONFIG.difficultyLevels[game.difficultyKey];
  hideOverlay(overlayTitle);
  showOverlay(overlayBriefing);
}

// Step 2: briefing -> actual run. Triggered by the "Let's Climb" button.
function beginRun() {
  game.player = new Player(game.difficulty);
  game.floor = 1;
  game.time = 0;
  game.rocket = null;
  hideOverlay(overlayBriefing);
  hideOverlay(overlayMsg);
  enterFloor(1);
  game.state = 'play';
}

// Back-compat shim for the debug hook + any restart paths.
function startGame() { showBriefing(); }

function enterFloor(n) {
  game.floor = n;
  const level = new Level(n, game.difficulty);
  game.level = level;
  const p = game.player;

  // place Zoe at this floor's entrance, on the ground
  p.x = level.spawnX;
  p.y = level.bounds.groundY - p.h;
  p.vx = 0; p.vy = 0;
  p.onGround = true;

  camera.setBounds(level.bounds.minX, level.bounds.maxX - CONFIG.width);
  camera.snap(p.x + p.w / 2);

  // tick down coffee boost as we climb
  if (p.coffeeFloorsLeft > 0) p.coffeeFloorsLeft--;

  // special-floor effects
  const special = isSpecial(n);
  if (special) {
    const info = SPECIAL_INFO[special];
    if (info.onEnter) info.onEnter(p);
    if (info.banner) showBanner(info.banner);
    if (info.interactive === 'upgrade') return openUpgradeMenu();
    if (info.interactive === 'linkedin') return openLinkedInReview();
    if (info.interactive === 'review') return openReview();
  }
}

function nextFloor() {
  if (game.floor >= CONFIG.totalFloors) return winGame();
  enterFloor(game.floor + 1);
}

function showBanner(text) { game.banner = { text, ttl: 2.6 }; }

// ---- Update ----------------------------------------------------------------
let last = performance.now();
function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  dt = Math.min(dt, 0.033);          // clamp big gaps

  input.beginFrame();

  if (game.state === 'play') update(dt);
  if (game.state === 'rocket') updateRocket(dt);

  render();
  requestAnimationFrame(frame);
}

function updateRocket(dt) {
  game.rocket.t += dt;
  // after ~3.2 seconds of liftoff animation, surface the summary card
  if (game.rocket.t > 3.2 && overlayMsg.classList.contains('hidden')) {
    showWinSummary();
  }
}

function update(dt) {
  const p = game.player;
  const level = game.level;
  const b = level.bounds;
  game.time += dt;

  // allow opening interactive rooms with E (in case auto-open was dismissed)
  if (level.special && input.justDown('KeyE')) {
    if (level.special === 'sanctuary') return openUpgradeMenu();
    if (level.special === 'review') return openReview();
  }

  p.update(dt, input, b);

  // enemies throw
  const coffee = p.coffeeFloorsLeft > 0;
  for (const e of level.enemies) e.update(dt, p, level.projectiles, b, coffee);

  // projectiles
  for (const pr of level.projectiles) pr.update(dt, b);
  // collide projectiles with player
  for (const pr of level.projectiles) {
    if (pr.dead) continue;
    if (rectsOverlap(pr.rect, p.rect)) {
      const res = p.takeHit(pr.damage);
      if (res) {
        pr.dead = true;
        pr.intercepted = true;  // hit or blocked, not dodged
        if (p.health <= 0) return loseGame();
      }
    }
  }
  // anything dying without being intercepted counts as a successful dodge
  for (const pr of level.projectiles) {
    if (pr.dead && !pr.intercepted && !pr.counted) {
      p.stats.dodged++;
      pr.counted = true;
    }
  }
  level.projectiles = level.projectiles.filter((pr) => !pr.dead);

  // coins
  for (const c of level.coins) {
    if (c.taken) continue;
    if (rectsOverlap({ x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 }, p.rect)) {
      c.taken = true; p.coins++;
    }
  }

  // banner fade
  if (game.banner) { game.banner.ttl -= dt; if (game.banner.ttl <= 0) game.banner = null; }

  // exit detection
  game.nearExit = false;
  const ex = level.exitRect;
  const distToExit = Math.abs((p.x + p.w / 2) - (ex.x + ex.w / 2));
  if (distToExit < 220) game.nearExit = true;
  if (rectsOverlap(ex, p.rect)) nextFloor();

  // camera follows Zoe
  camera.follow(p.x + p.w / 2);
}

// ---- Render ----------------------------------------------------------------
function render() {
  renderer.clear();
  if (game.state === 'title') {
    renderer.titleScene(performance.now() / 1000);
    return;
  }
  if (game.state === 'rocket') {
    renderer.rocketScene(game.rocket.t);
    return;
  }

  const t = game.time;
  renderer.background(game.floor);
  if (game.level) {
    renderer.floorRoom(game.level);
    renderer.coins(game.level, t);
    renderer.enemies(game.level, t);
    renderer.projectiles(game.level.projectiles);
    renderer.player(game.player, t);
    renderer.hud(game);
  }
  if (game.banner) {
    const a = Math.min(1, game.banner.ttl) * (game.banner.ttl > 2.2 ? (2.6 - game.banner.ttl) / 0.4 : 1);
    renderer.flashBanner(game.banner.text, Math.max(0, Math.min(1, a)));
  }
}

// ---- Screens (DOM overlays) ------------------------------------------------
function showOverlay(el) { el.classList.remove('hidden'); }
function hideOverlay(el) { el.classList.add('hidden'); }

function openUpgradeMenu() {
  game.state = 'menu';
  const p = game.player;
  const info = SPECIAL_INFO.sanctuary;
  const rows = UPGRADES.map((u) => {
    const lvl = p.upgrades[u.key];
    const afford = p.coins >= u.cost;
    return `<div class="pill" style="display:block;text-align:left;margin:6px 0;">
      <b style="color:#f4c95d">${u.label}</b> &nbsp;Lv.${lvl} &nbsp;
      <span style="color:#8a96b4">${u.desc}</span>
      <button data-up="${u.key}" data-cost="${u.cost}" ${afford ? '' : 'disabled'}
        style="float:right;margin-top:0;padding:6px 14px;font-size:14px;${afford ? '' : 'opacity:.4;cursor:not-allowed;'}">
        Buy ($${u.cost})</button></div>`;
  }).join('');
  msgCard.innerHTML = `
    <h2>${info.title}</h2>
    <p>${info.blurb}</p>
    <p>Incremental bookings: <b style="color:#f4c95d">$${p.coins}</b></p>
    <div style="margin:14px 0">${rows}</div>
    <button id="msg-continue">Continue Climb</button>`;
  showOverlay(overlayMsg);
  msgCard.querySelectorAll('button[data-up]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.up; const cost = +btn.dataset.cost;
      if (game.player.coins >= cost) {
        game.player.coins -= cost;
        if (key === 'health') game.player.applyHealthUpgrade();
        else game.player.upgrades[key]++;
        openUpgradeMenu(); // refresh
      }
    });
  });
  document.getElementById('msg-continue').addEventListener('click', resumePlay);
}

function openLinkedInReview() {
  game.state = 'menu';
  const p = game.player;
  const mins = Math.floor(game.time / 60);
  const secs = Math.floor(game.time % 60);
  const dmg = Math.round(p.stats.damageTaken);
  const info = SPECIAL_INFO.linkedin;
  msgCard.innerHTML = `
    <h1 style="color:#0a66c2">in</h1>
    <h2>${info.title}</h2>
    <p>${info.blurb}</p>
    <div class="stats-grid">
      <div>Floors climbed</div><div class="v">${game.floor} / ${CONFIG.totalFloors}</div>
      <div>Time on the climb</div><div class="v">${mins}m ${secs}s</div>
      <div>Damage taken</div><div class="v">${dmg}</div>
      <div>Things blocked</div><div class="v">${p.stats.blocked}</div>
      <div>Things avoided</div><div class="v">${p.stats.dodged}</div>
      <div>Incremental bookings</div><div class="v">$${p.coins}</div>
    </div>
    <p class="muted">You've cleared the LinkedIn tower. Take the elevator off, or
       keep climbing to Floor 86.</p>
    <div style="margin-top:10px;">
      <button id="msg-exit" style="background:#0a66c2;color:#fff;margin-right:10px;">Exit LinkedIn 🚀</button>
      <button id="msg-continue">Keep Climbing</button>
    </div>`;
  showOverlay(overlayMsg);
  document.getElementById('msg-exit').addEventListener('click', () => winGame('linkedin'));
  document.getElementById('msg-continue').addEventListener('click', resumePlay);
}

function openReview() {
  game.state = 'menu';
  const p = game.player;
  const mins = Math.floor(game.time / 60);
  const secs = Math.floor(game.time % 60);
  const hpPct = Math.round((p.health / p.maxHealth) * 100);
  const verdict = hpPct > 70 ? 'Exceeds Expectations'
                : hpPct > 40 ? 'Meets Expectations'
                : 'Needs Improvement';
  const info = SPECIAL_INFO.review;
  msgCard.innerHTML = `
    <h2>${info.title}</h2>
    <p>${info.blurb}</p>
    <div class="stats-grid">
      <div>Floors climbed</div><div class="v">${game.floor} / ${CONFIG.totalFloors}</div>
      <div>Time on the climb</div><div class="v">${mins}m ${secs}s</div>
      <div>Current health</div><div class="v">${hpPct}%</div>
      <div>Incremental bookings</div><div class="v">$${p.coins}</div>
      <div>Overall rating</div><div class="v">${verdict}</div>
    </div>
    <p class="muted">Halfway there. Sales reps and XFPs both await above.</p>
    <button id="msg-continue">Back to the Climb</button>`;
  showOverlay(overlayMsg);
  document.getElementById('msg-continue').addEventListener('click', resumePlay);
}

function resumePlay() {
  hideOverlay(overlayMsg);
  game.state = 'play';
}

// Both exit paths (floor 28 LinkedIn exit OR floor 86 summit) → rocket scene.
function winGame(reason = 'summit') {
  game.state = 'rocket';
  game.rocket = { t: 0, reason };
  hideOverlay(overlayMsg);
}

function showWinSummary() {
  const p = game.player;
  const mins = Math.floor(game.time / 60);
  const secs = Math.floor(game.time % 60);
  const headline = game.rocket?.reason === 'linkedin'
    ? 'Exited at Floor 28' : 'Summited Floor 86';
  msgCard.innerHTML = `
    <h1 style="color:#f4c95d">🚀 Liftoff</h1>
    <h2>${headline}</h2>
    <p>Sierra AI to the moon.</p>
    <div class="stats-grid">
      <div>Total time</div><div class="v">${mins}m ${secs}s</div>
      <div>Damage taken</div><div class="v">${Math.round(p.stats.damageTaken)}</div>
      <div>Things blocked</div><div class="v">${p.stats.blocked}</div>
      <div>Things avoided</div><div class="v">${p.stats.dodged}</div>
      <div>Incremental bookings</div><div class="v">$${p.coins}</div>
    </div>
    <p class="muted">Congratulations on the send-off. 🎉</p>
    <button id="msg-restart">Play Again</button>`;
  showOverlay(overlayMsg);
  confetti.start();
  music.start();
  document.getElementById('msg-restart').addEventListener('click', () => {
    confetti.stop();
    music.stop();
    hideOverlay(overlayMsg);
    game.state = 'title';
    showOverlay(overlayTitle);
  });
}

function loseGame() {
  game.state = 'lose';
  msgCard.innerHTML = `
    <h1 style="color:#ef476f">Burned Out</h1>
    <h2>Floor ${game.floor}</h2>
    <p>The deal desk got the better of Zoe this time. Take a breath and
       climb again — the stairwell isn't going anywhere.</p>
    <button id="msg-restart">Try Again</button>`;
  showOverlay(overlayMsg);
  document.getElementById('msg-restart').addEventListener('click', () => {
    hideOverlay(overlayMsg); startGame();
  });
}

// ---- Debug hook (only when URL has ?debug=1) -------------------------------
if (new URLSearchParams(location.search).get('debug') === '1') {
  window.__mm = { game, startGame, winGame, enterFloor, showWinSummary };
}

// ---- Boot ------------------------------------------------------------------
requestAnimationFrame(frame);
