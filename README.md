# Romaniano · Age of Warfare

A modular continuation of the uploaded **v11 game**, not a replacement. Romanian/Moldavian content, the other existing factions, third-person combat, territory economy and the original **6,000 × 6,000** world are retained.

**The owner approved merging this update on 2026-09-19, after verification.** Future changes should still go through pull-request review and passing regression checks.

## Play — no installation, backend or connection

Open **`index.html`** or **`age-of-warfare.html`** in a WebGL-capable browser. They are identical, self-contained files, including the local Three.js library. They also work under a GitHub Pages repository subdirectory. No API, CDN, login, database, or runtime package manager is required.

On the main menu, **Loaded area** starts at Homeland so a weak machine only raises each kingdom and the ground past the fog. The highest step is the entire 6,000 × 6,000 map. What is loaded does not change its graphics. Choosing the entire map, or a smaller area, reloads.

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
| Escape / F2 / M | Pause or close overlay / toggle buttons / music |

## Editable source

| Folder | Owns |
|---|---|
| `src/characters/<faction>/` | **One file per playable character** and a faction description/palette |
| `src/characters/` | Humanoid/horse/worker/villager/wildlife mesh builders, rig registry and extension point |
| `src/weapons/` | Blade, spear, axe, bow, shield and quiver designs; weapon catalog and wrist sockets |
| `src/animations/` | Character, weapon-string, horse, wildlife, environment and effect poses |
| `src/buildings/` | The building kit: merged-geometry architecture with real doors/windows, hip/gable/thatch/flat roofs, prispă galleries and half-timbering, furniture, fortifications, furnished interiors, the instanced countryside prefabs, the six faction towns, every named site and the 48 villages |
| `src/world/` | The geography (regions, rivers, lakes, moats, roads, bridges, levelled hamlet and farmstead sites), terrain, roads, the hamlets with their yards and the farmsteads |
| `src/navigation/` | Collision hash, swept movement, exact line clearance and cached multi-resolution A* |
| `src/groups/` | Unlimited formation creation, precise command scopes, doctrine and reinforcement reservations |
| `src/system/` | Input, simulation, combat timing, economy, AI, lifecycle, rendering and state |
| `src/ui/` | HTML/CSS, menus, recruitment, maps, settings and optional controls |

**Start with [docs/EDITING.md](docs/EDITING.md)** before handing characters or weapons to another agent. Do not edit the generated HTML as source.

## The world — ROM-MAP-SPEC-003 "Lemn și Piatră"

The 6,000 × 6,000 map is built to the master map specification recorded in [docs/ROM-MAP-SPEC-003.md](docs/ROM-MAP-SPEC-003.md) (which supersedes [docs/WORLD-ULTRA-EXPANDED.md](docs/WORLD-ULTRA-EXPANDED.md) where they differ): seven regions on a 16×16 zone grid, four rivers (the Little Danube, the Royal River through the capital, the Glacier River and the Salt River), ponds, marshes and a frozen tarn, a five-class road hierarchy (imperial vias, regional roads, the caravan artery, 49 village lanes, 15 trails) laid as ribbons that follow the ground, stone and timber bridges plus fords with stepping stones, 12 waystations, 48 villages built from seven regional vernacular kits (RBL-01..21: cottages with porches, foișor houses, cule, bordeie, wooden churches with tall spires, shadoof wells, carved gates, hay racks, corn cribs, salt stores…), 14 new areas from a charcoal hamlet to a salt mine, a caravanserai and an oasis, the Raven Mountain with its cave village, a circular capital with ring road, palace core, docks and a cathedral quarter, 56 capture flags that raise the owner's banner and a chain of signal beacons.

Every building in the world is **solid and has a real entrance**: hinged doors that swing open for whoever walks up, window openings with shutters and glass that glows at dusk, chimneys that smoke, torches and hearths that light the streets at night, mill wheels, forge hammers, bells, drums and fountains that move. More than a thousand named buildings — the Ardealburg town hall and the tavern Lupul Roșu, the grand hall, dungeon, archive and armoury of Cetatea Dunării, the palisaded Hotarul de Nord, the keep of Stânca de Fier, the inn Drumul Lung, the royal palace and the Great Cathedral Sf. Mihail with its six market shops, the monastery Sf. Andrei, Valea Lupilor with its turning watermill, Codrul Vechi, the war camp, Oaza Drumului, Poarta Sud, the bandit den, the crypt maze, the witch's hut and the rest — can be walked into and are furnished inside — and so can **every house of the countryside**: the 821 hamlets and 150 farmsteads are built from real regional houses (whitewashed Moldavian houses with blue trims and a prispă, Transylvanian half-timbered houses under red tile, thatched hip-roofed Wallachian cottages, Carpathian log houses with steep shingles, ochre flat-roofed houses of the southern road, the stone townhouses of the capital), each with a hinged door, glowing windows, a smoking chimney and a furnished room, standing in fenced yards with gardens, sheds, ovens, woodpiles, beehives and orchards along a lane that ends at a chapel or a barn, a well and a troiță. They are stamped as instances of ~90 prefabs (`src/buildings/prefabs.js`), so ~8,000 walk-in houses cost the memory of ninety. No building anywhere is a box with a triangle on top.

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
