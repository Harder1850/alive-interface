# Proving Scenario Repo Audit

Scope: local Phase 1 proving scenario only (not architecture redesign).  
Date: 2026-03-30

---

## Repo: alive-constitution

### Current state
- **Branch:** `main`
- **Uncommitted changes:** none detected
- **General health:** stable contract/policy repo; low churn during proving work

### Demo-relevant entry points
- Contracts used by proving path:
  - `contracts/signal.ts`
  - `contracts/action.ts`
- Runtime/mind/body imports rely on these for signal/action shape

### Immediate blockers
- No direct runtime script here (expected)
- No blocker for proving scenario as long as contract changes are avoided

### Keep for MVP
- Existing Signal/Action contracts
- Existing policy/invariant docs as governance reference only

### Defer for later
- Contract expansion and amendment cleanup
- Broader invariant refactor

### Suggested next commit
- `chore: snapshot pre-demo audit baseline (constitution clean on main)`

---

## Repo: alive-runtime

### Current state
- **Branch:** `main`
- **Uncommitted changes:** yes (`src/index.ts`, `src/phase1/*`, `package.json`)
- **General health:** active Phase 1 wiring in-progress

### Demo-relevant entry points
- `src/phase1/phase1-runtime.ts` (triage + artifact persistence)
- `src/phase1/proving-scenario.ts` (local proving run path)
- `src/index.ts` exports Phase 1 helpers
- `npm run phase1:prove` (added)
- Existing runtime starts:
  - `npm run start`
  - `npm run start:bridge`

### Immediate blockers
- Runtime action enforcement path for proving demo remains light; candidate action flow is visible, but strict whitelist enforcement should be finalized in runtime/body enforcement modules before broader demos
- Multiple legacy slice scripts (`slice1/2/3`) can confuse run path clarity

### Keep for MVP
- `phase1-runtime.ts` + `.phase1` artifact outputs
- `proving-scenario.ts` as canonical demo trigger
- Existing STG/router/enforcement modules (runtime as choke point)

### Defer for later
- Non-Phase-1 slices and broad orchestration cleanup
- Deep runtime architecture simplification

### Suggested next commit
- `chore: snapshot pre-demo audit baseline`
- `feat: add phase1 proving script and artifact relay path`

---

## Repo: alive-mind

### Current state
- **Branch:** `main`
- **Uncommitted changes:** substantial in `src/memory/*`, `src/spine/phase1-cognition-loop.ts`, tests, docs
- **General health:** heavy in-progress memory/cognition implementation mixed with older memory modules

### Demo-relevant entry points
- `src/spine/phase1-cognition-loop.ts`
- `src/memory/phase1-memory.ts`
- `src/memory/memory-encoder.ts`
- `src/memory/memory-recall.ts`
- `src/index.ts` Phase 1 exports

### Immediate blockers
- Parallel/duplicate memory stacks (`types.ts` + new `memory-types.ts`, older orchestrator + newer phase1 memory path) increase confusion for demo ownership
- Large uncommitted footprint raises merge/demo risk

### Keep for MVP
- Narrow Phase 1 cognition loop and memory snapshot bridge
- Tests that validate Phase 1 memory behavior

### Defer for later
- Broad memory unification/refactor
- Any architecture-wide memory redesign

### Suggested next commit
- `chore: snapshot pre-demo audit baseline`
- `feat: stabilize phase1 cognition loop and memory snapshot bridge`

---

## Repo: alive-body

### Current state
- **Branch:** `main`
- **Uncommitted changes:** none detected
- **General health:** stable sensor/executor foundation for local proving inputs

### Demo-relevant entry points
- `src/sensors/system-info.ts` (battery/system health)
- `src/adapters/fs-watcher-adapter.ts` (filesystem signal source)
- `src/sensors/environment.ts` (real host telemetry)
- `src/actuators/*` + `src/nervous-system/*` for execution/safety paths

### Immediate blockers
- No top-level `test` script in `package.json` (Studio quick action for body tests will fail unless script is added)
- For proving demo, execution should remain recommendation-only or strictly whitelisted

### Keep for MVP
- Existing real sensors/adapters and safety layers
- Existing actuator guardrails

### Defer for later
- Broader autonomic and hardware-expansion work
- Non-demo adapter proliferation cleanup

### Suggested next commit
- `chore: snapshot pre-demo audit baseline`
- `chore: add body test script for studio parity` (optional quick fix)

---

## Repo: alive-interface

### Current state
- **Branch:** `main`
- **Uncommitted changes:** many new files (studio dashboard, scripts, generated trees)
- **General health:** active proving visibility hub; Studio/API relay path in place

### Demo-relevant entry points
- Root helper scripts:
  - `npm run demo:start`
  - `npm run demo:studio`
  - `npm run demo:trigger`
  - `npm run demo:inspect`
  - `npm run demo:reset`
- Studio dashboard:
  - `studio/dashboard/server/index.ts`
  - `studio/dashboard/server/phase1.ts`
  - `studio/dashboard/src/App.tsx`
  - `studio/dashboard/src/components/SystemLoopPanel.tsx`
  - `studio/dashboard/src/components/RuntimeStatusPanel.tsx`
  - `studio/dashboard/src/components/MemorySnapshotPanel.tsx`
  - `studio/dashboard/src/components/QuickLaunchPanel.tsx`

### Immediate blockers
- Working tree includes unrelated generated artifacts (`alive_repo_trees*.md`) and broad Studio additions; commit hygiene required before demo freeze
- Interface repo has no standalone runtime; depends on sibling repo scripts by design

### Keep for MVP
- Read-only Studio relay panels (loop/runtime/memory)
- Helper demo scripts and runbook docs

### Defer for later
- UI polish and non-essential dashboard features
- Any control-plane behavior (must remain read-only)

### Suggested next commit
- `docs: add proving scenario audit findings`
- `chore: add proving scenario helper scripts and runbook`

---

## Baseline snapshot recommendations (no auto-commit)

Per repo, recommended sequence:

1. `chore: snapshot pre-demo audit baseline`
2. `docs: add proving scenario audit findings`

Optional focused follow-up commits:
- runtime: `feat: add phase1 proving script and artifact relay path`
- interface: `chore: add demo helper scripts and runbook`
- interface: `feat: surface phase1 scenario actions in studio quick panel`
