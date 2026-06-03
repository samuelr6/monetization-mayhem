# Monetization Mayhem

A 2D platformer where **Zoe** climbs all 86 floors of the Empire State Building,
dodging sales reps and cross-functional partners along the way. Built as a
send-off for a departing LinkedIn manager. Jetpack Joyride–style vector art,
no build step, no dependencies.

## Run locally

The game is pure client-side code, so any static file server works. Pick whichever
you have installed:

**Python 3 (already on macOS — no install needed):**

```bash
cd "Zoe Game"
python3 -m http.server 8080
```

**Or Node.js, if you have it:**

```bash
cd "Zoe Game"
node server.js
```

Then open **http://localhost:8080** in your browser.

> No dependencies to install either way — `server.js` is a tiny zero-dependency
> static server, and the Python option ships with macOS.

## Share it on the internet (Cloudflare Tunnel)

In a **second terminal** (leave the server running):

```bash
# install once, if needed:
brew install cloudflared

# create a public HTTPS URL pointing at your local game:
cloudflared tunnel --url http://localhost:8080
```

Cloudflare prints a public `https://<random>.trycloudflare.com` URL. Share that
link and anyone can play their own solo run. Stop the tunnel (Ctrl-C) to take it
offline.

## Controls

| Key | Action |
| --- | ------ |
| ← → | Move left / right |
| ↑   | Jump |
| ↓   | Duck |
| Space | Block incoming items (drains the block meter) |
| E   | Interact on the Sanctuary (16) and Review (43) floors |

## How it plays

- Reach the **stairwell** at the far side of each floor to ascend. The path
  alternates left↔right as you climb.
- Collect **$** of incremental bookings to spend on upgrades.
- **Floors 1–13:** Sales reps throw pricing sheets ("Ballpark pricing!", …).
- **Floors 14–29:** Sales reps + early XFPs mixed together.
- **Floors 30–58:** Cross-functional partners throw calculators ("It's pricing's fault", …).
- **Floors 59–86:** A mix of both, all demanding your time.

### Special floors

| Floor | Room | Effect |
| ----- | ---- | ------ |
| 3  | Cafeteria | Fuel up: +health, stamina restored |
| 16 | Sanctuary | Spend incremental bookings to upgrade Speed / Jump / Block / Health |
| 28 | Top of LinkedIn | Mid-game review: option to exit (win) or keep climbing |
| 29 | Coffee Booster | Speed boost + calmer enemies for the next 20 floors |
| 43 | Performance Review | Mid-journey stats: floors, time, health |

**Goal:** reach **Floor 86**.

## Project layout

```
index.html      canvas + overlays (title, menus, review, win/lose)
config.js       all tunables: zones, taunts, palette, difficulty
server.js       zero-dependency static server
src/
  main.js       state machine, game loop, collisions, screens
  engine.js     input, camera, AABB collision, RNG
  player.js     Zoe: movement, jump, duck, block, health, stats
  enemies.js    sales reps, XFPs, projectiles, taunts
  levels.js     procedural floor builder (boustrophedon flow)
  floors.js     special-floor data + upgrade shop
  render.js     ALL vector art (tune here to match reference photos)
```

## Tweaking the look

All art is drawn in code in `src/render.js`. Zoe's appearance lives in
`Renderer.player()` and `Renderer._zoeHair()`; enemies in `_drawWorker()`.
Colors are centralized in `config.js` under `palette`. Share reference photos
and these routines can be adjusted to match.
