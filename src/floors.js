// ============================================================================
// floors.js — special-floor metadata (cafeteria, sanctuary, coffee, review)
// Pure data + helpers; rendering reads `theme`, logic reads the rest.
// ============================================================================
import { CONFIG } from '../config.js';

export const SPECIAL_INFO = {
  cafeteria: {
    title: 'Floor 3 — Cafeteria',
    theme: 'cafeteria',
    blurb: 'Fuel up. Grab a tray of power-ups for the climb ahead.',
    // power-ups restore health and top off stamina
    onEnter: (player) => {
      player.heal(40);
      player.stamina = CONFIG.player.blockStamina;
    },
    banner: '🍱 Fueled up! +40 health, stamina restored.',
  },
  sanctuary: {
    title: 'Floor 16 — Sanctuary',
    theme: 'sanctuary',
    blurb: 'A moment of calm. Spend your incremental bookings to upgrade Zoe.',
    interactive: 'upgrade',   // main.js opens the upgrade menu
  },
  coffee: {
    title: 'Floor 29 — Coffee Booster',
    theme: 'coffee',
    blurb: 'Espresso shot! Faster movement and calmer enemies for 20 floors.',
    onEnter: (player) => {
      player.coffeeFloorsLeft = CONFIG.coffeeBoostFloors;
      player.heal(15);
    },
    banner: '☕ Caffeinated! Speed boost active for the next 20 floors.',
  },
  linkedin: {
    title: 'Floor 28 — Top of LinkedIn',
    theme: 'linkedin',
    blurb: 'You made it. This is the top of LinkedIn — take a bow.',
    interactive: 'linkedin',  // main.js opens a stats review with Exit / Continue
  },
  review: {
    title: 'Floor 43 — Mid-Journey Performance Review',
    theme: 'review',
    blurb: 'HR would like a word about your progress.',
    interactive: 'review',    // main.js shows the review panel
  },
};

// Upgrade shop options shown on the sanctuary floor.
export const UPGRADES = [
  { key: 'speed',  label: 'Receive Bravos from XFPs', cost: 5, desc: '+movement speed' },
  { key: 'jump',   label: 'Receive SK Nomination',    cost: 5, desc: '+jump height' },
  { key: 'block',  label: 'Take DDU Course',          cost: 6, desc: '+block strength' },
  { key: 'health', label: 'Take Some Well-Needed DTO',cost: 7, desc: '+max health' },
];
