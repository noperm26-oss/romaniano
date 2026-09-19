# Romaniano · Age of Warfare

A modular continuation of the uploaded **v11 game**, not a replacement. Romanian/Moldavian content, the other existing factions, third-person combat, territory economy and the original **6,000 × 6,000** world are retained.

**The owner approved merging this update on 2026-09-19, after verification.** Future changes should still go through pull-request review and passing regression checks.

## Play — no installation, backend or connection

Open **`index.html`** or **`age-of-warfare.html`** in a WebGL-capable browser. They are identical, self-contained files, including the local Three.js library. They also work under a GitHub Pages repository subdirectory. No API, CDN, login, database, or runtime package manager is required.

Choose a kingdom, then a character, then spawn. The optional button panel runs the same commands as the keyboard. **F2** hides/shows it for keyboard/mouse-only play.

| Input | Action |
|---|---|
| WASD / arrows, mouse | Move / look |
| Left / right mouse | Attack / block or bow aim |
| Shift / Space | Sprint / dodge |
| 1 / 2 / 3 / 4 | Follow / doctrine / attack / halt |
| Q | Change the fraction of your army receiving orders |
| B / T | Recruit / campaign map |
| Map click / Shift-click | Order the scoped army / march the player to owned territory |
| H / G / K | Mount / rally / AI ruler |
| F | Kingdom signature ability (unlocks at Kingdom Level 5) |
| Escape / F2 / M | Pause or close overlay / toggle buttons / music |

## Editable source

| Folder | Owns |
|---|---|
| `src/characters/<faction>/` | **One file per playable character** and a faction description/palette |
| `src/characters/` | Humanoid/horse/worker/villager/wildlife mesh builders, rig registry and extension point |
| `src/weapons/` | Blade, spear, axe, bow, shield and quiver designs; weapon catalog and wrist sockets |
| `src/animations/` | Character, weapon-string, horse, wildlife, environment and effect poses |
| `src/buildings/` | Building designs, collidable architecture, town interiors, landmarks and batch rendering |
| `src/world/` | Geography, terrain, district layouts and Romanian homesteads |
| `src/navigation/` | Collision hash, swept movement, exact line clearance and cached multi-resolution A* |
| `src/groups/` | Unlimited formation creation, precise command scopes, doctrine and reinforcement reservations |
| `src/system/` | Input, simulation, combat timing, economy, AI, lifecycle, rendering and state |
| `src/ui/` | HTML/CSS, menus, recruitment, maps, settings and optional controls |

**Start with [docs/EDITING.md](docs/EDITING.md)** before handing characters or weapons to another agent. Do not edit the generated HTML as source.

## Faction identity system

The six kingdoms — **ROME, SPARTA, MOLDOVA, NORRØN, KEMET, NIPPON** — are six distinct playstyles, not six skins. Each faction carries a complete data-driven identity (passives, signature ability, doctrines, terrain affinity, territory priorities, morale traits, AI Brain personality) defined in one place:

| File | Owns |
|---|---|
| `src/system/faction-identity.js` | `FACTION_IDENTITY` — the master table: stats, strengths/weaknesses, 5-level progression passives, signature ability, doctrines, terrain mods, territory weights, morale, brain config |
| `src/system/faction-battle.js` | Battlefield mechanics: Battle Momentum (Norrøn), legion/phalanx formation geometry (Rome/Sparta), Last Stand, frontier & precision bonuses, capture resistance, HUD battle status |
| `src/system/faction-abilities.js` | Signature ability engine (activation, cooldown, strain) and the AI Brain's faction-specific decisions |
| `src/ui/codex.js`, `src/ui/abilities.js` | The faction codex panel and the HUD ability bar (signature ability + doctrines) |

Systems (economy, capture, combat, unit AI, AFK brain, UI) consult `FACTION_IDENTITY` at runtime — **a new faction is a new table entry plus a character file, not new gameplay code**. Progression: each kingdom unlocks one passive per level (0 / 4 / 12 / 24 / 40 zones); Level 5 unlocks the signature ability. Signature abilities are risk/reward: a burst with a price paid afterwards. Balance rules enforced by `tests/factions.test.mjs`: no faction is objectively strongest (every identity has a major strength *and* a real weakness), counters are soft, and nothing is a flat "+20%".

### Build and test (authoring only)

Node.js 22+ is needed only to regenerate/test edited source, **not to play**:

```sh
npm ci
npm run build       # regenerate both standalone HTML files
npm run check       # fail on stale HTML, invalid syntax or duplicate top-level declarations
npm test            # navigation, groups, content and architecture tests
npm run test:e2e    # Chromium: real controls + deterministic simulation checks
```

The browser suite uses an npm-distributed headless Chromium fallback; `CHROME_PATH=/path/to/chrome npm run test:e2e` uses an installed browser. Test screenshots and machine-readable results go to ignored `test-results/`.

Source components are deliberately compiled in `src/manifest.json` order into **one private closure**, preserving the existing game's internal interfaces. This is not a runtime ES-module loader: standalone `file://` and offline play remain supported. To add a source file, add its path to the manifest at the correct initialization point.

## Hard rules

- **Player armies and group count remain unlimited.** Eight is a formation size, not a population cap. CPU scheduling, render culling and bot purchasing limits must never deny player recruitment or delete living units.
- **Only medieval equipment. No firearms or tanks.** New weapons must use the supported blade/spear/axe/bow family contract.
- Preserve the 6,000 × 6,000 map and Romanian/Moldavian aesthetics.
- Villagers stay immune; workers remain attackable, as in the uploaded handoff.
- Keep gameplay events out of rendering. Off-screen units still fight, fire arrows, receive orders and finish their lifecycle.

## Changes and verification

See [docs/VERIFICATION.md](docs/VERIFICATION.md) for the exercised scenarios, known limits and review checklist. The original uploaded handoff is retained as `HANDOFF-v11-github.md`; its old workspace paths/scripts are historical, not this repository's build instructions.

The Pages workflow packages only the two generated HTML files. It runs **only on `main`**, including manual runs, and waits for the complete regression suite before publishing. Branch CI tests do not deploy anything. Live site: https://noperm26-oss.github.io/romaniano/.
