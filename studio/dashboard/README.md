# ALIVE Studio Dashboard (Phase 1 Visibility)

This dashboard is a **read-heavy, relay-only Studio view** for watching the Phase 1 ALIVE loop while memory integration is evolving in `alive-mind`.

## What the new panels show

- **System Loop**
  - current mode + deep-opened state
  - last incoming signal
  - normalized signal summary
  - runtime triage details
  - baseline vs deep cognition state
  - candidate action
  - candidate summary
  - outcome status
  - stage timestamps (when available)
- **Memory Snapshot (read-only)**
  - working memory sample
  - recent episodes sample
  - reference item sample
  - thread summary sample
  - outcome buffer sample (if available)
  - structural node + association samples
- **Runtime Status**
  - current mode
  - baseline vigilance active
  - deep cognition active
  - deep cognition opened
  - last signal / id / timestamp
  - last candidate action/summary
  - last loop result summary
  - last outcome summary + timestamp
  - loop/runtime timestamps
  - recent warnings/errors
  - artifact source (runtime-artifact or fallback)
  - refresh timestamp
- **Scenario / Quick Actions**
  - refresh repo/runtime/memory panels
  - open mind/runtime/body in VS Code
  - run mind/runtime/body tests
  - open notes
- **Priorities / Next Tasks**
  - priorities list from `notes/priorities.json`
  - current blanks / recent notes / next tasks parsed from `notes/studio-notes.md`

## Real vs placeholder/mock data

- **Real (when artifacts/files exist):**
  - repo/system status
  - notes and priorities files
  - phase1 loop snapshot from `alive-runtime/.phase1/loop-status.json`
  - phase1 memory snapshot from `alive-runtime/.phase1/memory-snapshot.json`
  - memory bridge samples relayed from runtime/mind stores:
    - working memory sample
    - recent episodes sample
    - reference item sample
    - thread summary sample
    - outcome buffer sample
- **Placeholder/fallback:**
  - when `.phase1` artifacts do not exist yet, API returns fallback note + empty arrays
  - missing optional fields still render as `--`
  - `source=fallback` in Runtime Status indicates non-authoritative placeholder payload

## One-click Windows launcher (recommended)

Use:

`scripts/windows/Start-AliveStudio.cmd`

What it does:

1. Starts Studio services (`npm --prefix studio/dashboard run dev`) if needed
2. Waits for readiness checks to pass:
   - `GET /api/health` (Studio + Runtime baseline)
   - `GET /api/startup-readiness` (`studioReady`, `runtimeReady`, `demoPathReady`)
   - client URL reachable at `http://localhost:5173`
3. Opens browser at `http://localhost:5173`
4. Emits one clear startup error if checks fail within 120s

This is Windows-first and intended for launching from an icon/shortcut without terminal interaction.

## Run the dashboard manually

From repository root:

```bash
npm --prefix studio/dashboard install
npm --prefix studio/dashboard run dev
```

Then open `http://localhost:5173`.

The API server runs on `http://localhost:4174` via the same `dev` script.

## Run Live Demo fetch failure: root cause + fix

Root cause:

- Studio server repo path discovery in `server/repos.ts` did not include the actual ALIVE parent directory depth used in this workspace.
- That caused `getRepoPath("runtime")` to resolve to the wrong location, so `/api/run` could not execute `alive-runtime` scripts reliably.
- In UI this surfaced as a failed Run Live Demo flow (including fetch/path failures and effectively dead action behavior).

Fix applied:

- Added an additional base-dir candidate (`../../../..`) in `server/repos.ts` so runtime/interface/mind/body/constitution resolve correctly in this repo layout.
- Added startup readiness APIs and frontend gating so Run Live Demo only enables when runtime/demo path are ready.
- On success, the action refreshes artifacts and visible panels; on failure, the exact backend error is surfaced to the user.

## Assumptions and limitations

- Dashboard does not write to runtime/mind state directly.
- Actions are explicit user-triggered commands only (open/run/refresh).
- Loop/memory visibility depends on `.phase1` artifacts being produced by runtime scenarios.
- Snapshot structure is intentionally tolerant of partial/in-progress backend authority.
