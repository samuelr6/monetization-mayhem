// ============================================================================
// Monetization Mayhem — central tunables
// All gameplay constants, zone definitions, taunts, and palette live here so
// they are easy to tweak (including matching reference photos later).
// ============================================================================

export const CONFIG = {
  // --- World / canvas ---
  width: 960,
  height: 540,
  gravity: 2400,          // px/s^2
  groundFriction: 0.82,

  // --- Floors ---
  totalFloors: 86,
  floorInnerWidth: 1800,  // playable horizontal length of a floor (world px)
  wallMargin: 60,         // px from edges where stairwell/door sits

  // --- Player (Zoe) base stats ---
  player: {
    width: 34,
    height: 56,
    duckHeight: 36,
    moveSpeed: 320,       // px/s (modified by speed stat)
    jumpVelocity: 820,    // px/s (modified by jump stat)
    maxHealth: 100,
    blockStamina: 100,    // drains while blocking, regens otherwise
    blockDrain: 60,       // per second while holding block
    blockRegen: 35,       // per second while not blocking
    invulnAfterHit: 0.9,  // seconds of i-frames after taking a hit
  },

  // --- Stat upgrades (sanctuary, floor 16) ---
  statStep: {
    speed: 40,            // +px/s per upgrade
    jump: 70,             // +px/s per upgrade
    block: 0.25,          // +25% block effectiveness per upgrade
    health: 25,           // +max health per upgrade
  },

  // --- Difficulty curve ---
  difficulty: {
    baseEnemies: 1,
    enemiesPerFloor: 0.06,      // grows slowly with floor #
    maxEnemies: 7,
    baseThrowInterval: 2.6,     // seconds between throws (early)
    minThrowInterval: 0.9,      // floor for throw interval at high levels
    throwIntervalDecay: 0.018,  // reduction per floor
    baseProjectileSpeed: 260,
    projectileSpeedPerFloor: 3.2,
  },

  // --- Special floors ---
  special: {
    cafeteria: 3,      // power-up fuel
    sanctuary: 16,     // upgrade stats
    linkedin:  28,     // TOP OF LINKEDIN — review + option to exit (win)
    coffee:    29,     // energy boost — first floor after LinkedIn exit
    review:    43,     // mid-journey performance review
  },
  coffeeBoostFloors: 20,   // coffee effect lasts this many floors
  coffeeSpeedMult: 1.25,
  coffeeThrowSlow: 1.2,    // enemies throw 20% slower while caffeinated

  // --- Enemy zones (inclusive floor ranges) ---
  // XFPs are introduced earlier (floor 14) so players who exit at the
  // LinkedIn floor (28) still get to see them.
  zones: [
    { from: 1,  to: 13, type: 'sales' },
    { from: 14, to: 29, type: 'mix' },
    { from: 30, to: 58, type: 'xfp' },
    { from: 59, to: 86, type: 'mix' },
  ],

  taunts: {
    sales: [
      'Ballpark pricing!',
      'Can you price this out for me?',
      'Extra Discount!',
    ],
    xfp: [
      'Can your team do this?',
      "It's pricing's fault",
      'We need to evolve the commercial model?',
    ],
  },

  // --- Palette (Jetpack Joyride-ish: bold flats + warm/cool contrast) ---
  palette: {
    bgTop: '#1b2a4a',
    bgBottom: '#33507e',
    skyline: '#16223c',
    skylineLit: '#f4c95d',
    floorBand: '#2a2f45',
    floorTrim: '#f4c95d',
    floorTile: '#39405c', // floor tile base
    wall: '#222838',
    stair: '#cfd6e6',
    stairShadow: '#9aa3bd',

    zoeSkin: '#e7a977',
    zoeHair: '#1a1410',
    zoeShirt: '#e2477e',
    zoePants: '#2f3b55',
    zoeShoe: '#1b2233',

    salesSuit: '#3d6bd6',
    salesSkin: '#d8a07a',
    xfpSuit: '#46b07a',
    xfpSkin: '#c98f6a',

    projectile: '#ffd166',
    projectileXfp: '#9bd1ff',
    block: '#7ee3ff',
    health: '#3ad29f',
    healthLow: '#ef476f',
    stamina: '#7ee3ff',
    coin: '#ffd166',
    text: '#f4f7ff',
  },

  audio: { enabled: false }, // toggleable, off by default

  // --- Difficulty multipliers (selected on title screen) ---
  // Tunes throw rate, projectile speed, and starting health.
  difficultyLevels: {
    easy:   { label: 'Easy',   throwIntervalMult: 1.6, projSpeedMult: 0.8, healthMult: 1.25 },
    normal: { label: 'Normal', throwIntervalMult: 1.0, projSpeedMult: 1.0, healthMult: 1.0  },
    hard:   { label: 'Hard',   throwIntervalMult: 0.7, projSpeedMult: 1.2, healthMult: 0.85 },
  },
  defaultDifficulty: 'normal',
};

// Resolve which enemy type a given floor uses.
export function zoneForFloor(floor) {
  for (const z of CONFIG.zones) {
    if (floor >= z.from && floor <= z.to) return z.type;
  }
  return 'mix';
}

export function isSpecial(floor) {
  const s = CONFIG.special;
  if (floor === s.cafeteria) return 'cafeteria';
  if (floor === s.sanctuary) return 'sanctuary';
  if (floor === s.coffee) return 'coffee';
  if (floor === s.linkedin) return 'linkedin';
  if (floor === s.review) return 'review';
  return null;
}
