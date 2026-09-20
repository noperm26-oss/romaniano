# Editing and asset handoff contract

## Working safely

1. Edit source, never both the source and a generated HTML copy.
2. Keep changes on the review branch until the owner explicitly approves a merge.
3. Run `npm run build && npm run check && npm test && npm run test:e2e`.
4. Deliver the edited source plus regenerated `index.html` and `age-of-warfare.html`.

No cloud asset pipeline is needed. All current meshes are procedural. If replacing them with model data, embed that data locally in the generated artifact; do not add CDN/fetch dependencies or a required server.

## A character — independent of gameplay code

Example: `src/characters/moldavia/curtean.js` contains one complete class definition. Change its `name`, description, balance values or `spec` there. The player selection and recruitment menus enumerate the same catalog; you do not add a second UI definition.

- Gameplay: `hp`, `dmg`, `speed`, `range`, `cd`, `block`, `cost`.
- Cards: `name`, `en`, `tag`, `desc`, `icon` and `stats` (`hp/dmg/spd/rng` pips).
- Appearance: `spec` (helmet, armor, clothes, shield, hair, cloak, colors).
- Equipment: `spec.weapon` is a key in `WEAPONS`.
- Rig: `spec.rig`, default `warrior`.
- Motion: `spec.animation`, default `warrior`; profiles live in `src/animations/profiles.js`.
- Holding: optional `spec.weaponSocket`, overriding the weapon's normal wrist transform.

To add a Romanian character without touching the engine, put this in `src/characters/custom.js`:

```js
var baseCurtean = FACS.moldavia.classes.curtean;
FACS.moldavia.classes.strajer = Object.assign({}, baseCurtean, {
  name: 'Străjer',
  en: 'Border Guard',
  desc: 'A guard of the Moldavian mountain roads.',
  spec: Object.assign({}, baseCurtean.spec, {
    under: 0x594c38,
    weapon: 'longsword',
    animation: 'heavy'
  })
});
```

For a permanent separate file, place that definition under `src/characters/moldavia/` and add it **before** `src/characters/catalog.js` in the manifest. Keep the template's required statistics/card fields. Do not duplicate a function/declaration name across components.

### Replacement humanoid mesh

Register `CHARACTER_RIGS.myRig = function(spec) { ... }` in the extension file. A builder returns:

```js
{
  group,       // THREE.Group: world position/yaw
  body,        // child group: animated bob/lean
  mats,        // per-character materials, safe to flash without affecting another unit
  parts: {
    armL: { sh, el, wr }, armR: { sh, el, wr },
    legL: { hip, knee }, legR: { hip, knee },
    head
  },
  weapon,      // catalog id or undefined for civilians
  weaponMesh,  // attached group (optional, needed for bow-string motion)
  ranged       // true for bows
}
```

The required named joints are validated at construction. Use shoulder → elbow → wrist and hip → knee parenting. Local up is **+Y**, forward is **+Z**, units are game world units; the original humanoid is roughly two units tall. Match the original pivot positions in `characters/warrior.js`, or adapt a new animation profile/pose function. Returning renamed/missing joints is not an automatic retargeting system.

Horse, wolf, villager and worker appearances have their own files in `src/characters/`. Their behavior remains in `src/system/`. Non-humanoid rigs have separate pose functions.

## Weapons — model and grip are independent

- `weapons/blades.js`: xiphos, kopis, gladius, longsword, katana, khopesh geometry.
- `weapons/spears.js`: spear/dory/naginata geometry.
- `weapons/axe.js`, `bow.js`, `shields.js`, `quiver.js`: other medieval designs.
- `weapons/catalog.js`: ids, factory family, dimensions/colors and wrist attachment defaults.
- `animations/weapons.js`: optional bow-string deformation; `animations/warrior.js`: arm motion.

A catalog entry can be added without editing a soldier builder:

```js
WEAPONS.sabie = {
  family: 'blade',
  design: { len: 0.92, wide: 0.085, grip: 0.23, col: 0xc5cbd0 },
  socket: {
    hand: 'armR',
    position: [0, -0.38, 0.02],
    rotation: [0, 0, 0],       // radians; relative to wrist
    scale: 1
  }
};
```

Put the addition in `characters/custom.js` or a new weapon-definition file loaded before character textures/recruits. Then set a character's `spec.weapon = 'sabie'`. Only `blade`, `spear`, `axe`, `bow` factory families are supported. Unknown ids/families and malformed sockets throw useful errors instead of silently producing invisible equipment.

Weapons are rigid groups attached to a wrist, never scene-level floating objects. The default blade extends along local **−Y**; the spear factory contains its own orientation. If a new design points another way, fix the **socket rotation**, not movement or attack damage. The bow is left-handed by default. A custom bow may provide `weaponMesh.userData.bowString` with a three-vertex line; otherwise weapon deformation is simply skipped.

Do not mutate shared primitive geometry or global cached materials. Per-character flash materials are local. `sharedGeometry()` is for immutable geometry; each entity still has independent transforms and pose.

## Animation versus simulation

`animations/warrior.js` consumes `movingAmt`, `walkRate`, `animT/animDur`, `atkKind`, `aiming`, `blocking`, `staggerT` and `deadT`. It draws idle, walking/running, overhead attacks, thrusts, bashes, bow draw/release, block, stagger and death poses.

**Damage, arrow release, cooldowns and corpse removal are in `system/combat.js` / `system/entities.js`.** Never move those events back into `updatePose`: culled archers must still fire and off-screen corpses must still be cleaned up. Shield users normally swing their blade and use a bash every third attack; spears thrust. Bow strings bend during draw and recover on release.

## Buildings and territory

The world is described in `docs/ROM-MAP-SPEC-003.md` (implementation record of the v3.0 master map spec; `docs/WORLD-ULTRA-EXPANDED.md` is the earlier design bible); the code follows it file by file.

- `world/geography.js` — regions (`getRegion` follows the spec's zone grid), the six towns, `SITES_DEF` (every named place with its spec ID), 48 `VILLAGES` with kit/feature, `RIVERS` (4), `LAKES`, `MOATS`, `ROADS` (classes R0/R1/R1t/R2/R3, auto village lanes, dense splines, `ROAD_GRID`/`roadField()`/`roadSpeedAt()`), computed `BRIDGES` (bridges + fords), `FLAGS`, `BEACON_DEF`, flats and the height field (`massifH` for Muntele Corbilor). `groundH()` includes bridge decks; `groundHBase()` is the bare terrain.
- `buildings/registry.js` — shared registries filled during construction: `DOORS` (hinged leaves), `LIGHT_SRC` (pooled lights), `CHIMNEYS` (smoke), `ANIM_PARTS` (wheels, hammers, bells, drums, fountains), `STRUCTURES` (footprint + door of every named building). `siteBegin()/siteEnd()` merge a whole site into one culled group; `cellKit()` merges loose props per 375u cell.
- `buildings/architecture.js` — `kitCreate()` (merged geometry with a local frame), `structShell(o)` (walls with **real door and window openings**, shutters, glass, porch, plinth, roofs, second storey, tower, dome, arcade, buttresses, battlements, log courses, shop signs), `spawnDoorLeaf()` and `wallColliders()`.
- `buildings/furniture.js` — every interior piece (`fTable`, `fBed`, `fHearth`, `fIconostasis`, `fForge`, `fMillstone`, `fBars`, …). Pieces are placed in the building's local frame and register their own colliders through `kit.collider()`.
- `buildings/interiors.js` — `buildBuilding(o)`: shell + colliders + a furnished interior chosen by `o.interior` (house, hall, townhall, barracks, church, cathedral, cells, library, candles, kitchen, tavern, inn, forge, watermill, hunter, bathhouse, grandhall, throne, dungeon, stable, armory, herbalist, woodcutter, smokehouse, cellar, shops, checkpoint, workshop, siege, watchtower, cave, crypt, witch, bandit, tunnel, …). Add a new interior with `addInterior('name', fn)`.
- `buildings/fortifications.js` — `fortTower`, `fortWall`/`fortWallRun`, `fortGate`, `palisade`, `rampart`, `fortTent`, `pavilion`, `moatWater`, `buildBridge`; round shapes get collider chains (`colliderAlong`).
- `buildings/primitives.js` — flames and world-space props (torches, wells, carts, fences, crosses, markers, graves, braziers), all solid where they should be.
- `buildings/towns.js` — the six faction homes (`townData[fac]` keeps `hall.door` for spawns, `frontZ`, `barracks`, `temple`); `buildings/landmarks.js` + `buildings/areas.js` — `SITE_BUILDERS[kind]` for every entry of `SITES_DEF` (areas NA-01..14, the pass, serai, oasis, waystations, wolf shrine, salt mine, crystal cave, mountain, cave village, hermitage); `buildings/vernacular.js` — the Romanian building library RBL-01..21 and the regional kits `RBL_KITS`; `buildings/villages.js` — the 48 villages; `buildings/flags.js` — capture flags and signal beacons.
- `world/roads.js` — draped road ribbons per class (kerbs, colours, +speed), milestones, junction crosses/signposts, wells, gate lanterns, toll arches (`window.__roadPts`, `roadStats`, `ROAD_JUNCTIONS`, `roadNearest()/offRoad()` in areas.js keep props off the carriageway); `world/districts.js` — farmsteads/folds/quarries/camps, the zone economy (`SITES`, `zoneSiteRate`) and the wilds pass; `world/settlements.js` + `buildings/batches.js` — instanced hamlet houses with doors, windows and footprints.
- `animations/buildings.js` — `updateBuildings(dt)`: door swing, window glow, the pooled point lights, smoke/sparks/spray, moving parts (wheels, hammers, bells, drums, fountains, waterfall, windmill sails, shadoof, winch), capture-flag raise and beacon colour following `zones[].owner`. Presentation only.

Keep roads, doorways and unit clearance open: `nearDoor()` tells you whether a spot would block a registered entrance. A new rotated solid needs a matching conservative collider (use `kit.collider()` in a local frame or `colliderAlong()` for a wall at an angle). Call `addCollider()` so navigation caches invalidate; never write to the collider array directly. Decorative greenery/crops are intentionally non-solid; solid houses always register footprints. Hamlet houses are exterior scenery with doors and windows; every named building is enterable and furnished. The browser suite checks each registered structure: the threshold and the first step inside are free, and the wall beside the door is solid.

Batch meshes must set `userData.cullBounds = {x,z,r}` because this older Three.js version does not reliably infer world-spanning instance bounds. Do not mark every instance `always`; that defeats region culling.

## Navigation and groups

Navigation uses exact expanded-wall segment tests, binary-heap A*, reusable typed arrays, correct per-node road costs, generation-stamped closed sets, cached edges/routes and safe smoothing. Local navigation is six-unit resolution, long routes can use a 24-unit grid, and a bounded two-unit local fallback handles narrow passages. Unreachable commands return failure rather than pretending a straight line is a valid route.

New route searches have an admission budget per frame and failed routes are retried. This limits work, **not units**. A single difficult synchronous search can still exceed the admission threshold; it is not a hard frame-time guarantee. Cached immutable routes are returned as independent arrays.

Group members belong to one formation. Scoped orders split formations at the selection boundary; unselected units keep their existing goals. Doctrine quotas apply to the selected army as a whole, not once per owned zone. The strongest non-guard troops attack, weakest defend. Reinforcements reserve their supporting group until the threat clears or their reservation expires. There is no maximum number of groups or player troops.
