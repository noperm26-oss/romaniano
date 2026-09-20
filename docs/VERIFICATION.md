# Verification and review notes — 2026-09-19

## Automated checks

Run from the repository root:

```sh
npm run check
npm test
npm run test:e2e
```

- **23 Node tests:** collision sweeps, thin walls/corners, free spawning, repeated A*, road weighting, unreachable/invalid goals, dynamic-collider invalidation, narrow gates, scope boundaries, global doctrine quotas, reinforcement reservations, group membership, **1,200 simulated player units**, individual class files, medieval weapon catalog, animation/simulation boundaries and offline artifacts.
- **23 Chromium scenario checks** (three new building checks plus the original 20): menu/back/role/spawn buttons; paid single-click recruitment; auto-buy toggles; button and keyboard commands; exact scope; F2-hidden buttons with WASD/sprint/dodge; idle/locomotion/melee/block poses; horse/rally/AFK; settings and text-input isolation; map-click area orders; safe paths through real settlements; an AI-controlled unit actually crossing a hamlet; every existing class/weapon rig; attack/stagger/death poses without controls; invisible archer firing and corpse cleanup; player bow input; **400 additional recruits beyond the AI cap**; death/redeploy/new campaign; camera-wall clearance; a rendered screenshot and ordinary rAF smoke; narrow layout; `file://` and static subdirectory hosting.
- Browser assertions include **zero uncaught page errors**. Offline file boot checks for **no HTTP requests**. The HTML has no runtime external script/image/style references or injected Cloudflare challenge.

The new tests are included as source. Detailed run reports and screenshots are generated under ignored `test-results/`. Historical scripts `test7.js`–`test13.js` mentioned in the uploaded handoff were **not uploaded**; these are newly implemented regression suites, not a claim that those unavailable scripts ran.

## Every building enterable — v3.1 countryside rebuild (2026-09-20)

The ~8,300 instanced box-and-prism hamlet/farmstead houses are gone. `src/buildings/prefabs.js` builds ≈90 regional
houses, barns, sheds, workshops and chapels once through the normal kit (`structShell` + furnished `INTERIORS`), captures
their geometry, colliders, door leaf, lights, chimney and structure record, and stamps them as `InstancedMesh` instances
(one per prefab per 375 u cell). Each instance re-registers its colliders, an animated instanced door leaf, its lights,
chimney and an enterable structure, so the NO-CLIP audit, the entrance check and the door/light/smoke systems cover it like
any named building. Hamlets (821, on levelled ground) are lanes with fenced yards, gates, gardens, sheds, ovens, woodpiles,
beehives, dovecotes, orchards, a chapel or barn, a well and a troiță; farmsteads ring their well; Romaria's blocks are filled
with alleys and townhouses. Named buildings gained hip roofs, prispă galleries, visible half-timbering, benches, gable
windows and foundation skirts; the windmill became a real mill tower with a room.

Headless diagnostics (`__game.buildingsLive()`): ~9,900 structures, **~9,820 enterable** (the rest: two water gates, the
ferry, flags, beacons), ~9,780 hinged doors, ~21,100 light sources, ~10,700 chimneys, ~210,000 colliders (~7 µs per query
inside a hamlet), boot ≈ 9 s headless. The five walled towns are lined with townhouses along every street as well. New browser check: *countryside houses are real: the instanced door swings open for the
player, a furnished lit interior waits behind it* (three houses sampled across the map; door opens > 0.9, ≥ 3 furniture
colliders, ≥ 1 light and chimney, free threshold inside and out). Existing thresholds were raised (doors/enterable/audited
walls > 8,000; every non-enterable structure must be a gate, tent, ferry, flag or beacon). 25 browser checks, 25 Node tests.

## Map rebuild — ROM-MAP-SPEC-003 v3.0 "Lemn și Piatră" (2026-09-20)

The world was brought up to the v3.0 master map specification (`docs/ROM-MAP-SPEC-003.md` records the mapping, the coordinate registry and the deviations D-1..D-10). Headless boot diagnostics: ~1,800 registered structures (1,725 enterable), ~1,680 hinged doors, ~3,970 light sources, ~3,490 chimneys, 143 moving parts, 102 road ribbons (68 village lanes, 15 trails, 98 milestones, 2 toll arches), 22 bridges of which 6 fords, 56 capture flags, 10 beacons, 48 villages from seven regional kits, 12 waystations, 256/256 zones. New checks: `tests/geography.test.mjs` (world frame, regions, villages with lanes ≤ 1400 u, no overlapping pads, roads dry outside bridges/fords, road classes and speed bonus, level homeland flats, massif height) and the browser check "NO-CLIP LAW: every registered wall face is solid, roads never run through river water" (`__game.noclipAudit()` = 0 offenders, `__game.roadProbe()` = 0 wet samples). The ground grid is 512² so rivers keep their troughs; road ribbons sample the rendered triangles (`terrainMeshH`) and never float.

## World rewrite — ULTRA EXPANDED EDITION (2026-09-19)

The map was rebuilt from `docs/WORLD-ULTRA-EXPANDED.md`. Diagnostics from a headless boot (`__game.buildingsLive()`): about **1,090 registered structures, all enterable**, **1,040 hinged doors**, **2,400 light sources** (a pool of eight point lights follows the player), **3,000 smoking chimneys**, 26 moving parts (mill wheel, hammers, bells, drums, fountains, waterfall), 12 bridges, ~9,700 counted buildings including ~6,900 instanced hamlet houses, 256/256 territories covered. New browser checks assert that every registered structure has a free threshold, a free first step inside and solid wall beside the door; that the hall door swings open when the player stands in it; that window glow rises at night and that lights and smoke are active around the player.

Known limits: interiors are furnished but static (no NPC routines inside); (v3.1: hamlet and farmstead houses are now walk-in, furnished prefab instances); the crypt maze and tunnels are single-storey; bells and drums are visual (no gameplay effect).

## World changes (previous edition)

The world remains 6,000 × 6,000 and 256 territories. Existing factions, towns, landmarks, villages, districts, economy and interiors remain. Additional planned settlements contribute roughly **5,400 collidable buildings**, in about **980 hamlets** (exact totals vary with the inherited procedural placement). New construction reaches roughly 252 territories; protected capital/landmark territories retain their existing buildings. The combined legacy coverage check is 256/256.

Counts are diagnostics, not an assertion that every square metre is built on. Streets, courtyards, fields, army maneuver space and protected historical sites remain open by design. Added construction uses Romanian-style homes, workshops, chapels, crops and orchards, not modern buildings or military vehicles.

## Bugs addressed

- Duplicated UI event wiring toggled auto-buy/AFK twice and ran multiple flows.
- Undefined navigation world offset prevented obstacle rasterization.
- Stale A* closed flags leaked between searches; road discounts applied everywhere.
- Short-distance navigation ignored obstacles; spawning could return a solid position.
- Movement and camera placement could cross/enter walls.
- Scope selection retasked whole mixed groups and then overwrote unrelated member goals.
- Doctrine assigned strong groups to defense, ignored some guard percentages and rounded whole groups rather than actual selected unit counts.
- Reinforcement groups could be forwarded repeatedly and old campaign groups survived reset.
- Bow release and corpse cleanup depended on visible animation updates.
- UI clicks could attack; input stayed held on blur; Escape lacked a reliable fallback pause route.
- Dense district buildings overlapped, instance colors drifted and map-wide batches defeated spatial culling.
- Nearby target queries and mesh construction did unnecessary work; geometry/material ownership was not explicit.
- Workers and grazing animals fled toward threats rather than away from them.

## Performance changes and limits

Shared immutable geometry (including blades), per-character material reuse, reusable spatial-hash buckets, local combat/arrow queries, cached navigation edges/routes, bounded search admission and spatial instance chunks reduce avoidable work. Off-screen pose work is skipped without disabling combat. Dead entities are disposed after their lifecycle; **living player units are not removed to meet a limit**.

Headless rendering here uses **SwiftShader software rendering**, not a representative gaming GPU. We verified rendering and behavior, **not a real-GPU FPS target**. Large armies still consume memory/CPU; unlimited means no artificial recruitment/deletion cap, not infinite hardware capacity. The map is procedural and the tests sample routes; they do not prove that every possible point-to-point route is reachable. A* has a per-search expansion bound and safely refuses an unsolved route. New homestead houses are solid scenery; existing designated interiors remain enterable.

Remaining manual review: long battles on the owner's GPU/browser, very large real armies, pointer-lock behavior in the owner's embed/browser, all landmark interiors and visual/art preferences. Touch movement is not implemented; the optional buttons supplement keyboard/mouse, not a complete mobile control scheme.

## Deployment safety

The owner authorized merging after verification on 2026-09-19. The 23 Node tests and 20 browser scenarios were rerun successfully before submitting the update. The Pages workflow runs on `main` only, including manual invocations, and depends on the complete regression suite passing before publication. Branch checks do not publish. See the GitHub pull request and Actions runs for actual merge/deployment status; local test success alone does not confirm a deployment.
