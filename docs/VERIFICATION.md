# Verification and review notes — 2026-09-19

## Automated checks

Run from the repository root:

```sh
npm run check
npm test
npm run test:e2e
```

- **40 Node tests:** the original 23 (collision sweeps, thin walls/corners, free spawning, repeated A*, road weighting, unreachable/invalid goals, dynamic-collider invalidation, narrow gates, scope boundaries, global doctrine quotas, reinforcement reservations, group membership, **1,200 simulated player units**, individual class files, medieval weapon catalog, animation/simulation boundaries and offline artifacts) plus **17 faction-identity tests** (`tests/factions.test.mjs`): configuration completeness for all six kingdoms, the no-strongest-faction balance rule, unique signature mechanics, 5-level progression gating, Battle Momentum stacking/cap/defeat/decay, signature-ability cooldown and strain lifecycle, Nippon tactic tradeoffs, ability modifiers flowing into upkeep/income/speed/recruit cost, terrain affinity, per-brain territory priorities, doctrine switching, faction-specific AI decisions, legion/phalanx geometry, per-faction HUD battle status, morale resistance and capture-resistance asymmetry.
- **21 Chromium scenario checks:** the original 20 (menu/back/role/spawn buttons; paid single-click recruitment; auto-buy toggles; button and keyboard commands; exact scope; F2-hidden buttons with WASD/sprint/dodge; idle/locomotion/melee/block poses; horse/rally/AFK; settings and text-input isolation; map-click area orders; safe paths through real settlements; an AI-controlled unit actually crossing a hamlet; every existing class/weapon rig; attack/stagger/death poses without controls; invisible archer firing and corpse cleanup; player bow input; **400 additional recruits beyond the AI cap**; death/redeploy/new campaign; camera-wall clearance; a rendered screenshot and ordinary rAF smoke; narrow layout; `file://` and static subdirectory hosting) plus one **faction-identity scenario**: the live identity table, in-battle status chip, ability bar and doctrine switching, the Level-5 ability unlock via real territory, burst→strain→cooldown→F-key behavior, raider-culture loot and momentum on territory flips, the AFK brain making a faction-specific decision, and the codex panel (tabs, "Take this crown" hand-off to the role screen).
- A six-campaign headless smoke (2 simulated minutes per faction, AFK on) verified no runtime errors, finite economies, all six kingdoms surviving and each brain issuing its own doctrine of war (e.g. Sparta "CONSERVE (no attrition)", Norrøn "RAID the border", Kemet "BUILD & TAX").
- Browser assertions include **zero uncaught page errors**. Offline file boot checks for **no HTTP requests**. The HTML has no runtime external script/image/style references or injected Cloudflare challenge.

The new tests are included as source. Detailed run reports and screenshots are generated under ignored `test-results/`. Historical scripts `test7.js`–`test13.js` mentioned in the uploaded handoff were **not uploaded**; these are newly implemented regression suites, not a claim that those unavailable scripts ran.

## World changes

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
