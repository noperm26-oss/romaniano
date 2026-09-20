# ROM-MAP-SPEC-003 v3.0 "LEMN ȘI PIATRĂ" — implementation record

This document is the build record for the master map specification **ROM-MAP-SPEC-003 v3.0** (delivered in chat; it
supersedes `WORLD-ULTRA-EXPANDED.md` wherever the two differ). It lists where every section of the spec lives in the
code, the coordinate registry the build actually uses, the deviations that were necessary, and how the acceptance
checks are run. Coordinates: x east, z south (north is −z), world 6,000 × 6,000, sixteen 375 u zones per side.

**v3.1 addendum (phase 3 — "every building has an interior")**: the instanced box-and-prism hamlet houses of v3.0 are
gone. The countryside is rebuilt from real regional houses (`src/buildings/prefabs.js`) — solid walls, hinged doors,
lit windows, chimneys, furnished rooms — stamped as instances, on levelled hamlet and farmstead ground, in fenced yards
along lanes (see §1 rows §5.3 and §8, deviations D-11..D-14 and the v3.1 budget in §5). Named buildings gained hip roofs,
full-length prispă galleries, visible half-timbering, benches, gable windows and foundation skirts; Romaria's blocks are
filled with alleys and townhouses.

## 1. Where each section of the spec lives

| Spec | Code |
|---|---|
| §1 world frame, 16×16 zones, region grid | `src/world/geography.js` — `WORLD`, `ZN/ZS`, `WORLD_REGIONS`, `getRegion()` (grid-conformant), `regionWeights()` in `terrain.js` (soft-edged twin for painting) |
| §1.5 flats | `FLATS` / `addFlat()` — plateau r560 for Romaria, 215–300 for the other seats, `s.r` for every site, 70 for every village, `noFlat` for terrain-bound sites |
| §2 terrain envelopes & palette | `baseH()` (ridge, pass corridor, peaks, massif `massifH()`), palette + region paint in `src/world/terrain.js` (512² grid, `terrainMeshH()` exposes the rendered triangles) |
| §3 hydrology | `RIVERS` RV-01..04 (Catmull-Rom, 45 u), `LAKES` WTR-01..07 + mill ponds, `MOATS`, `waterCut()` (banks at 1.5·hw, fords lift the bed), water ribbons never sink under the mesh |
| §4 roads | `ROADS` (R0/R1/R1t/R2/R3, `ROAD_CLASSES`), 49+ auto village lanes, 15 trails, `densifyPolyline()`, `ROAD_GRID`/`roadField()`/`roadSpeedAt()`; `src/world/roads.js` builds draped vertex-coloured ribbons with kerbs, milestones (250 u), crosses/signposts at junctions, wells (700 u on RG-04), gate lanterns (30 u/200 u), toll arches |
| §4.8 bridges & fords | computed road×river intersections → `BRIDGES` (stone for R0, timber for R1/R2 over wide water, fords for lanes/trails over small rivers); `buildBridge()` / `buildFord()` in `fortifications.js` |
| §4.9 waystations & beacons | 12 `waystation` sites (WS-01..12) in `areas.js`; `BEACON_DEF` SB-xx built by `flags.js` (owner-coloured fire at night) |
| §5 building taxonomy, collision, animation | `architecture.js` shells (real door/window openings, gable/long/thatch/**hip**/flat/church roofs, visible half-timbering, **prispă** galleries, benches, gable windows, foundation skirts), `wallColliders()`, `interiors.js` `buildBuilding()`, `animations/buildings.js` (doors — hinged groups **and instanced leaves** —, glow, lights, smoke, wheels, hammers, bells, drums, fountains, waterfall, windmill sails, shadoof, winch, flag raise, beacon colour) |
| §5.3 the countryside tier (v3.1) | `src/buildings/prefabs.js` — every hamlet / farmstead / lone house is a **real building built once through the kit and instanced**: `prefabCapture()` records geometry, colliders, door leaf, lights, chimney and structure while `PREFAB_REC` is set; `prefabPlace()` stamps an instance (quarter-turn facing) and re-registers colliders/door/lights/chimney/structure; `prefabFlush()` makes one `InstancedMesh` per prefab per 375 u cell. Catalogue `PREFAB_PAL` × {cottage, house, farm, barn, stable, workshop, chapel, shed} × variants (≈90 prefabs) + yard pieces (woodpile, haystack, oven, beehives, dovecote, well, cart, troiță, tent) |
| §5.9 RBL-01..21 | `src/buildings/vernacular.js` (`rblCasa`, `rblFoisor`, `rblCula`, `rblBordei`, `rblBisericaLemn`, `rblConac`, `rblHan`, `rblCrama`, `rblSura`, `rblGrajd`, `rblStana`, `rblMoaraApa`, `rblMoaraVant`, `rblCumpana`, `rblPoarta`, `rblFanar`, `rblPorumbar`, `rblAfumatoare`, `rblBeci`, `rblFantana`, `rblSalt`) + `RBL_KITS` per region |
| §6 unit sheets | `towns.js` (six seats), `landmarks.js` + `areas.js` (`SITE_BUILDERS[kind]` for every `SITES_DEF` entry) |
| §7 new villages & areas | `VILLAGES` (32 ratified + NV-01..16) in `villages.js` with §7.1 features; NA-01..14 kinds in `areas.js`; NV-17 cave village and NA-13 mountain in `areas.js` |
| §8 settlement kits | `RBL_KITS` (CA AR VA MO TD CP BF) for the 48 villages; `HAMLET_KINDS` + `PREFAB_PAL` per region for the countryside; `HAMLETS` (geography.js — four levelled sites per zone) built by `buildHamlet()`: a lane (E-W or N-S), fenced yards with gates and paths, houses facing the lane, gardens, sheds, ovens, woodpiles, beehives, dovecotes, orchards, a chapel or barn closing the lane, well + troiță + hay cart at the open end, fields beyond; `DISTRICT_KITS` farmsteads ring their well facing it; Romaria blocks get an alley cross, townhouses, a well and courtyard trees; `townInfill()` lines every straight street of the other five towns with townhouses of the region's kit (`td.inside()` keeps them inside the walls, plazas and doors stay clear) |
| §9 relics | `src/world/relics.js` — REL-04 school door, REL-05 throne dais, REL-06 inn door, REL-07 fort chapel yard, REL-08 archive door |
| §10 homeland walls | Romaria 32-gon r520 (16 towers, 4 axis gates + market postern, two water gates); Ardealburg rectangle; Cetatea rectangle + moat + drawbridge; Hotarul earth rampart + double palisade; Stânca pentagon; Drumul Lung open inn town |
| §11 gameplay layer | `FLAGS` (56 CMP flags: banner poles that read `zones[zi].owner`), spawns via `townData[f].frontZ`, road speed bonus in `player.js`/`ai.js`, `zone-info.js` terrain classes |
| §12 budgets | see §5 below |
| §14 QA | `tests/geography.test.mjs`, `tests/browser.mjs` (NO-CLIP audit, road probe), `__game.noclipAudit()`, `__game.roadProbe()` |

## 2. Coordinate registry (as built)

Seats of power: Ardealburg (−1800,−800) · Cetatea Dunării (−1400,1300) · Hotarul de Nord (1700,−700) · Stânca de Fier (0,−2400) ·
Drumul Lung (0,2500) · Romaria (0,0).

Romaria: wall r520 (32 sides rotated π/32 so gates sit on segment midpoints), gates N/S/E/W at (0,∓520)/(±520,0), market gate (368,368),
ring road r460, palace (0,−160) door S, esplanade z −140..−40, garden court (0,−214), Lion Column (0,0), docks x 275–300 / z 210–370,
merchant quarter x 340–440 on the eastern boulevard, cathedral (560,660) door W, grand market (690,590), twelve shrines at r580.

Rivers: RV-01 Little Danube W→E z≈1600→1150 · RV-02 Royal River from the tarn (320,−1420) south through the capital to (700,1400) ·
RV-03 Glacier River from Lacul Înghețat (−2290,−1910) east to the NE rim · RV-04 Salt River (2750,−1700)→(3050,1000).

Bridges/fords: BR-01 Podul Pustnicului (HW-01×RV-03), BR-02 Podul Coroanei (eastern boulevard), BR-03/04 ring bridges, BR-05 Podul Cetății,
BR-06 Fordul Sării (RG-05, outside Hotarul's south gate), BR-08 Fordul Prutului, BR-11 Podul Dunării Mici (HW-01), BR-13 Podul Codrului,
BR-14 Podul Mănăstirii, BR-15 Podul Oilor, BR-16 Podul Trecătorii, BR-18 Vadul Marginii, BR-19 Vadul Chiliei, BR-20 Vadul Crestei,
Vadul Ocnei (salt-mine lane), BR-21 Puntea Lupului (log bridge at Vadul Lupului), BR-M1..M3 moat bridges, BR-09 ferry barge at the river port.

Sites, villages, waystations, flags and beacons: see the arrays in `src/world/geography.js` (`SITES_DEF`, `VILLAGES`, `FLAGS`, `BEACON_DEF`);
every entry carries its spec ID.

## 3. Deviations from the spec (all deliberate, all documented here)

| ID | Spec | Built | Why |
|---|---|---|---|
| D-1 | cula door on the first floor via an outside stair | door at ground level, exterior stair is decorative | the collision contract uses axis-aligned boxes and one floor plane; a walkable stair would need slope colliders |
| D-2 | bordei half dug into the ground | stands on the ground with an earth berm | same single-floor-plane rule (no pits in the height field under a building) |
| D-3 | cave village with walkable galleries | one rock hall with three chambers, dwellings at floor level, braziers/torches/lantern chain for light | galleries above the floor would need multi-level collision |
| D-4 | RG-06 fords RV-03 at (−400,−2020) (BR-07) | RG-06 keeps the north bank of the Glacier River; one ford (BR-08 Fordul Prutului) east of the Frostwind outpost | the spec's waypoints and its river path did not intersect there; a north-bank route removes two shallow-angle water crossings |
| D-5 | several spec coordinates | nudged 30–150 u (Curtea Veche 620,−150; Vama 1600,300; Livada 1400,430; Pârâul de Argint 1000,−560; NA-11 820,−330; NA-12 1050,450; Marginea 2700,1040; Poiana Mărului 1900,−2010; Prut 1150,−1960; Șomuz −900,−2140; Pietriș −1550,−120; Cireșarii −1400,140; NA-01 1000,900; NA-04 −1300,−2420; Lacul Corbilor 1350,−2420; outpost 800,−2170; ambush sites) | spec positions overlapped a road, a river or another pad; `tests/geography.test.mjs` now asserts no two pads overlap |
| D-6 | CR-04 crosses RV-02 on its own bridge (BR-02) | the market street reaches the ring on the west bank and continues from the east bank; BR-02 is the eastern-boulevard bridge | two bridges 30 u apart would have collided |
| D-7 | 51 capture flags | 56 (one per spec entry plus the cave-village chapel, summit, Mărginime, granary, fire meadow) | superset; all read the existing zone ownership — no second capture system |
| D-8 | ≤ 6,000 colliders | ~47,000 axis-aligned boxes in a 64 u grid | every wall of every enterable building is its own collider (NO-CLIP LAW); the grid keeps queries O(1), the browser suite measures no slowdown |
| D-9 | milestones carry carved text | plain carved stones with a dark plaque | per-stone canvases would cost more than they show |
| D-10 | Hotarul gate on the west side | gates north and south (roads RG-01/RG-05 meet at the south gate, RG-01b leaves the north gate) | keeps the existing fort layout and the Salt Road geometry |
| D-11 | hamlet houses may be "solid silhouettes" (§5.1 T3) | **no silhouettes remain**: every countryside house is an instanced real building with a furnished interior, hinged door, lit windows and chimney (`prefabs.js`) | the player asked for no box-and-triangle buildings anywhere; instancing keeps the memory of ~8,000 houses at ~90 geometries |
| D-12 | ≤ 6,000 colliders (D-8 said ~47,000) | ~210,000 axis-aligned boxes | every wall, porch post, railing, fence run and piece of furniture of every enterable house collides; the 64 u grid keeps a query at ~7 µs inside a hamlet; `nearDoor()` now uses a 24 u door grid |
| D-13 | flats only under named places | one flat (r 62) under each of the 821 hamlet sites and one (r 52) under each of the 150 farmsteads, registered in `geography.js` before the terrain is built; `flatsH()` uses a 256 u spatial index so the extra flats cost nothing per query | real interiors need level floors; the terraces blend over 31 u |
| D-14 | windmill as a sealed tower | the windmill is a square mill tower with a door, two rows of windows and the miller's room (`interior:'windmill'`), sails on the door side | no building without an interior |

## 4. Acceptance checks

```
npm run check          # syntax, duplicates, stale HTML
npm test               # includes tests/geography.test.mjs: frame, regions, 48 villages with lanes, no pad overlaps,
                       # roads dry outside bridges/fords, road classes, speed bonus, level homeland flats, massif height
npm run test:e2e       # 25 browser checks, incl. "NO-CLIP LAW: every registered wall face is solid, roads never run through river water"
                       # and "countryside houses are real: the instanced door swings open for the player, a furnished lit interior waits behind it"
```

In the browser: `__game.noclipAudit()` probes four faces of every enterable structure (four insets each; doors, back
doors and gate passages are the only free faces), `__game.roadProbe(n)` samples road points against river water,
`__game.buildingsLive()` reports doors/structures/lights/chimneys/moving parts/roads/flags/beacons/RBL usage.

## 5. Measured budget (headless boot, `__game.buildingsLive()` / `memStats()` / `bootTimes()`)

v3.1 (phase 3 — every building enterable): ~9,900 registered structures (**~9,820 enterable**; the rest are the two water
gates, the ferry, flags and beacons), ~9,780 hinged doors (≈8,100 of them instanced leaves), ~21,100 light sources (pooled
to 8 point lights), ~10,700 chimneys, 147 moving parts, 821 hamlets in 248 zones (≈6,500 hamlet buildings in 5,720 yards),
150 farmsteads (≈760 buildings), ≈470 townhouses in the capital's blocks and ≈400 along the streets of the five walled
towns, 100 prefab geometries (≈240 k triangles) stamped ≈21,000 times (≈8,100 houses) in 255 cells / ≈8,350 instanced
meshes, ~210,000 colliders, 1,075 flats, 102 road ribbons / 13,800 quads, 68 lanes, 15 trails, 22 bridges (6 fords),
56 flags, 10 beacons, 48 villages, 12 waystations, 256/256 zones, ~10,460 counted buildings.
Per frame from a hamlet or a town: ~760–1,130 draw calls / ~2.3–2.9 M triangles after culling. Boot ≈ 9 s in the headless
test browser (terrain 1.7 s, towns 2.0 s, villages 1.6 s, settlements 1.7 s, prefab flush 0.05 s).

v3.0 for reference: ~1,800 structures (1,725 enterable), ~1,680 doors, ~3,970 lights, ~3,490 chimneys, ~10,170 counted
buildings of which ~8,300 were instanced box-and-prism silhouettes without interiors.
