# Proving Scenario Handoff for Claude

Purpose: narrow handoff for Phase 1 proving scenario continuation only.

---

## 1) Exact files/modules Claude should edit (priority order)

### Runtime (primary choke point)
- `../alive-runtime/src/phase1/phase1-runtime.ts`
- `../alive-runtime/src/phase1/proving-scenario.ts`
- `../alive-runtime/src/index.ts`
- `../alive-runtime/src/enforcement/*` (for strict safe-action enforcement path)

### Mind (cognition only)
- `../alive-mind/src/spine/phase1-cognition-loop.ts`
- `../alive-mind/src/memory/phase1-memory.ts`
- `../alive-mind/src/memory/memory-encoder.ts`
- `../alive-mind/src/memory/memory-recall.ts`

### Interface / Studio (read-only visibility)
- `studio/dashboard/server/phase1.ts`
- `studio/dashboard/server/index.ts`
- `studio/dashboard/src/App.tsx`
- `studio/dashboard/src/components/SystemLoopPanel.tsx`
- `studio/dashboard/src/components/RuntimeStatusPanel.tsx`
- `studio/dashboard/src/components/MemorySnapshotPanel.tsx`
- `studio/dashboard/src/components/QuickLaunchPanel.tsx`

### Run-path docs/scripts
- `package.json` (interface root demo scripts)
- `scripts/demo-inspect.mjs`
- `scripts/demo-reset.mjs`
- `docs/proving-scenario-runbook.md`
- `docs/proving-scenario-audit.md`

---

## 2) Current runnable path

From `alive-interface` root:

1. `npm run demo:studio`
2. `npm run demo:trigger`
3. `npm run demo:inspect`

Optional reset:

- `npm run demo:reset`

Runtime artifacts:
- `../alive-runtime/.phase1/loop-status.json`
- `../alive-runtime/.phase1/memory-snapshot.json`

---

## 3) Blockers removed

- Added explicit runtime proving trigger script: `phase1:prove` in `alive-runtime/package.json`
- Added interface-level helper scripts:
  - `demo:start`
  - `demo:studio`
  - `demo:trigger`
  - `demo:inspect`
  - `demo:reset`
- Added artifact inspect/reset helpers:
  - `scripts/demo-inspect.mjs`
  - `scripts/demo-reset.mjs`
- Added Studio quick actions for:
  - trigger scenario
  - inspect artifacts
  - reset demo state
- Added runbook and repo audit docs

---

## 4) Blockers remaining

- Runtime/body strict safe-action whitelist enforcement needs explicit finalization for proving acceptance (currently candidate flow is visible and low-risk)
- Mind repo has overlapping/duplicate memory paths; proving path exists but ownership boundaries should be tightened before broader merges
- Body repo lacks a `test` script; Studio quick body test action may fail until script parity is added
- Interface working tree includes unrelated generated files; commit hygiene needed before demo freeze

---

## 5) Best place to add narrow proving-scenario cognition path

- **Primary:** `../alive-mind/src/spine/phase1-cognition-loop.ts`
- **Supporting memory path:** `../alive-mind/src/memory/phase1-memory.ts`
- **Runtime invocation boundary:** `../alive-runtime/src/phase1/phase1-runtime.ts`

Keep additions narrow: signal interpretation -> recall -> ActionCandidate summary.

---

## 6) Best place to add safe action whitelist enforcement

- **Runtime enforcement boundary first:** `../alive-runtime/src/enforcement/*` and `../alive-runtime/src/phase1/phase1-runtime.ts`
- **Body execution guard second:** `../alive-body/src/actuators/*` and `../alive-body/src/nervous-system/*`

Rule: runtime approves, body executes only approved low-risk whitelist actions.

---

## 7) Best place to add explanation artifacts for Studio

- Runtime artifact writer:
  - `../alive-runtime/src/phase1/phase1-runtime.ts`
- Runtime artifact relay/normalization:
  - `studio/dashboard/server/phase1.ts`
- Studio display panels:
  - `studio/dashboard/src/components/SystemLoopPanel.tsx`
  - `studio/dashboard/src/components/RuntimeStatusPanel.tsx`
  - `studio/dashboard/src/components/MemorySnapshotPanel.tsx`

Keep explanation artifacts factual and timestamped; no execution controls in Studio.
