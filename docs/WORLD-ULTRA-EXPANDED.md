# ROMANIANO — THE WORLD (ULTRA EXPANDED EDITION)

This is THE map description for Romaniano / Age of Warfare. The 6,000 × 6,000 unit
world is rebuilt from it in `src/world/*` and `src/buildings/*`. Coordinates:
`x` grows east, `z` grows south, north is `-z`, the capital sits at `0,0`.

## Palette (hex)

| use | value |
| --- | --- |
| Carpathian limestone / snow | `#8a9aa8` / `#e8f0f8` |
| pine forest | `#2f4a2e` |
| Transylvanian wheat / vine / road | `#c9b24a` / `#6b8f3a` / `#9a8555` |
| Wallachian grass / marsh / mud | `#6a8a3a` / `#5a6a4a` / `#7a6a4a` |
| Moldavian black forest / rock / river | `#3a5a2e` / `#7a7a6a` / `#4a6a7a` |
| trade-route dust / dry earth | `#c2b08a` / `#9a8a6a` |
| Romaria stone / boulevard / garden | `#9a9a8a` / `#8a8070` / `#6a8a5a` |
| battlefield scar / burned | `#6e5f43` / `#5a4a3a` |
| whitewash / timber / dark oak | `#e2d6bb` / `#5d4326` / `#241d16` |
| gold / iron / blood red | `#c9a227` / `#50565e` / `#7a3434` |

The sky is iron-grey overcast most days and bruised purple-orange at dusk.

## The eight zones

1. **Northern Carpathian Ridge** — 6000 × 1200, the whole north (`z < -1800`).
   Jagged limestone, snow above the tree line, glacier-fed rivers in ravines,
   avalanche scars, a frozen lake. Sites: **Turnul Vântului** (watchtower on a
   peak, signal brazier, spiral stair), **Peștera Pustnicului** (hermit's cave
   with a carved shrine), **Stânca de Fier** (iron-reinforced mountain fort, the
   Viking seat), **Mănăstirea Sf. Andrei** (bell tower, monks' cells, library,
   candle workshop, walled garden), **Frostwind Pass outpost** (palisade, barracks,
   beacon).
2. **Transylvanian Heartland** — west, `x < -1000`, `z < 200`. Rolling hills,
   vineyards, wheat, oak woods on the hilltops. Sites: **Ardealburg** (walled
   market town with three gates, market square, blacksmith district, town hall,
   tavern *Lupul Roșu*, school of scribes — the Spartan seat), **Valea Lupilor**
   (log-house village: church, watermill on the stream, hunter's cabin, bathhouse,
   18 households).
3. **Wallachian Lowlands** — south-west, `x < -1000`, `z >= 200`. Flat marshy
   plain, tall grass, slow dark rivers, reeds. Sites: **Cetatea Dunării** (enceinte
   fortress: 20 m walls, four round towers, moat and drawbridge, grand hall,
   dungeon, stable, kitchen, armory, archive — the Roman seat), the **Wallachian
   war camp** (tents, training ground, archery range, siege workshop, drum tower).
4. **Moldavian Borderlands** — east, `x > 1000`, `z < 200`. Rocky, dense black
   forest, river valleys that serve as invasion corridors. Sites: **Hotarul de
   Nord** (double-palisade border fort with earthworks — the Moldavian seat),
   **Codrul Vechi** (forest village: smokehouses, hunter's lodge, herbalist,
   woodcutter, mushroom cellar, wolf shrine).
5. **Southern Trade Route** — 6000 × 1000, the whole south (`z > 2000`). Dust,
   dry earth, the long east–west road with mile markers, wells and roadside
   shrines. Sites: **Oaza Drumului** trade post, inn **Drumul Lung** (the Egyptian
   seat), **Poarta Sud** checkpoint, caravan repair workshop, merchant stables,
   guard barracks.
6. **Capital Romaria** — 2000 × 2000 at the centre. Walled city with four gates,
   **the royal palace** (throne room, library, garden courtyard, kitchens),
   **Great Cathedral Sf. Mihail** (nave, iconostasis, crypt, bell tower), the grand
   market with butcher, tailor, spice merchant, bookseller, armorer and horse
   trader, river docks — the seat of the Nippon faction.
7. **Battlefields** — scattered: ambush sites, plains of graves, river crossings,
   siege zones, burned villages, memorial stones.
8. **Secret locations** — hidden cave shrine, abandoned monastery, bandit
   hideout *Cuibul Lupilor*, crypt maze, waterfall cave, forgotten watchtower,
   smuggler tunnels, witch's hut.

## Rules for every structure

* Solid: every wall, tower, tent and palisade has a matching `addCollider()`.
* Enterable: every named building has a real door opening (animated leaf that
  swings for whoever walks up to it), real windows (panes that glow at night)
  and a furnished interior.
* Alive: chimney smoke, mill wheels, bells on a schedule, forge hammers, torches
  with a pooled light budget, waterfalls and rivers that flow, banners in wind.
* Medieval Romanian / Moldavian only — no firearms, no modern material.
