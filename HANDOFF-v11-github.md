# HANDOFF → NEW SESSION (v11 + GitHub Pages deploy)

## What to say to the new session (paste this):

---
Continue my game project. Workspace files are already there. Read /home/user/HANDOFF-v11-github.md first — it has the full state, env setup recipes, and your task list.

Task: (1) run the regression battery on the v11 build already in /home/user/age-of-warfare.html and fix anything red, (2) then deploy the single HTML file to my GitHub Pages (repo will be connected in this session). Give me the file to download when green.
---

## CURRENT STATE (trust this)

- `/home/user/age-of-warfare.html` — **v11 build, 905,376 B, boot-verified (`boot: true, errs: 0`)**, 0 external refs, fully self-contained. This is the deliverable.
- v11 features all landed: roads ring (7,873 road pts, `window.__roadPts`, 1 InstancedMesh), denser districts (42–65 houses), EH spatial hash (cell 24), GROUP/TASK command system (infinite groups, 8-cap chunks, strongest→attack / weakest→defend / guard per doctrine %, escalation forwards MULTIPLE groups until outnumbered, rotating spreadCounter → distinct attack targets), orders 1-4 + map-click area all route through `assignTasks`, NAV.road A* cost ×0.8, pose-skip off-screen, `__game.groups()` hook (has `.ms` = live member refs).
- **test13 (v11 suite): sections 1–6 ALL ✓** (groups form, defend spread 2 posts, 5/5 distinct attack targets, escalation forwards, area order obeyed 29/29 near post, roads exist). Section 7 perf probe ran but numbers are SwiftShader-software-render garbage (890–1000 ms/frame, 214–249 draw calls) — ignore; real-GPU perf is fine by design (1 road draw call, pose culling, hash queries).
- test13 was aborted by user mid-run at section 7; 1–6 printed ✓. **Full regression battery NOT yet run on final deduped build.**

## CRITICAL HISTORY — DO NOT REPEAT

- A patch script ran TWICE on part2.js → entire mid-block (~1050 lines) duplicated; later JS `function` declarations shadow earlier ones, so stale copies silently overrode v9/v10/v11 fixes (groupThink never ran; old update without ehashBuild won). **Fixed** by brace-matched dedup: 47 edits, kept copy1 for everything except `brainTick` (copy2 had the v10.2 nd-squared fix). Backup: `/home/user/src/part2.js.bak-dedup`.
- **RULE: before any patch, `grep -c 'function NAME' src/part2.js` must be 1. After any patch: re-grep all touched names, `node build.js && node --check game-merged.js`, then boot.**
- Verify no dups: `python3 - <<'EOF'` scan of `^function (\w+)` occurrences per src file (part1.js clean, part2.js clean post-fix).

## NEW-SESSION TASK LIST

1. Env setup (node_modules and browser cache do NOT persist between sessions):
   ```
   cd /home/user/src && npm install puppeteer@23 --no-audit --no-fund
   npx puppeteer browsers install chrome
   cd /home/user/deps/extracted/usr/lib/x86_64-linux-gnu
   for f in lib*.so.*.*; do major=$(echo "$f" | sed 's/.*\.so\.\([0-9]*\)\..*/\1/'); base=$(echo "$f" | sed 's/\.so\..*//'); [ -e "$base.so.$major" ] || ln -s "$f" "$base.so.$major"; done
   export LD_LIBRARY_PATH=/home/user/deps/extracted/usr/lib/x86_64-linux-gnu   # REQUIRED before every node run
   ```
2. Battery: `node test7.js` (14) `test8.js` (17) `test9.js` (29) `test10.js` (12) `test11.js` (37) `test12.js` (4) `test13.js` (sections 1–6 must be ✓; it takes ~12 min, be patient, protocolTimeout is 600000). Fix reds in src/part*.js → rebuild → rerun. Known flake recipe: in-page polls with early-break, never wall-clock fps.
3. Rebuild + boot: `cd /home/user/src && node build.js && node --check game-merged.js && node boot7.js` → expect `boot: true | errs: 0`, size ~905 KB.
4. Present `/home/user/age-of-warfare.html` for download.
5. Deploy to GitHub Pages once repo connected: commit the file renamed `index.html` to repo root, push, enable Pages (main branch, root) → URL `https://<user>.github.io/<repo>/`. Single file, no build step, works as static site. Offer the download AND the Pages link.

## ENV / RECIPES (validated)

- `export LD_LIBRARY_PATH=/home/user/deps/extracted/usr/lib/x86_64-linux-gnu` before EVERY node run (boot7 fails without).
- Puppeteer flags: `--no-sandbox --enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader`, viewport ≥520×340, `waitUntil:'domcontentloaded'` + 2.2s sleep, `__game.forceLook()` before pointer tests, ≥2 rAF after spawn/teleport.
- `__game` hooks (v10 set + v11 `groups()`): begin, addGold, muster(cls), army(), teamCount, owned(), zoneInfo(i), issueOrder, setScope(0=100%), areaOrder(x,z), spawnHostileNear() (spawns at player −2.4z; reposition after), groups() → [{id,n,task,atk,post,seen,x,z,ms}], insideWall, brainState, ride, settings(v), gates().
- UI ids: #faction-grid .faction-card[data-fac], #role-grid .card, buttons begin/spawn/resume/autobuy/warmap-close etc.
- Geography: 6000×6000 fixed; towns sparta(900,−900) rome(−900,−900) moldavia(900,900) vikings(−900,900) egypt(−250,−2250) nippon(250,2250).

## USER CONSTRAINTS (standing)

Single self-contained HTML always · no guns · Moldavia Romanian aesthetic · third-person cam · role before spawn · 6000×6000 map NEVER resize · player army UNLIMITED · doctrine % shared across ALL zones (no spawn stacking) · infinite groups 1 group/task · escalation until outnumber · strongest→attack weakest→defend · roads+houses done · max perf, never limit the player · v10.2 rules (king never stuck in houses, no wall phasing, villagers immune, workers attackable).
