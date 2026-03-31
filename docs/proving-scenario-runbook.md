# Proving Scenario Runbook (Local Dev Machine)

Scope: one end-to-end Phase 1 proving scenario only.

---

## 1) Prerequisites

- Repos are sibling folders under the same parent:
  - `alive-constitution`
  - `alive-runtime`
  - `alive-mind`
  - `alive-body`
  - `alive-interface`
- Node/npm installed.

Recommended installs:

```bash
npm --prefix ../alive-runtime install
npm --prefix ../alive-mind install
npm --prefix ../alive-body install
npm --prefix studio/dashboard install
```

Run all commands below from `alive-interface` root unless noted.

---

## 2) Canonical demo scripts (interface root)

- `npm run demo:start`
  - Starts runtime main process (`alive-runtime` `start` script).
- `npm run demo:studio`
  - Starts Studio dashboard (client + API relay).
- `npm run demo:trigger`
  - Runs proving scenario trigger (`alive-runtime` `phase1:prove`) to generate loop + memory artifacts.
- `npm run demo:inspect`
  - Prints latest artifact summary from runtime `.phase1` folder.
- `npm run demo:reset`
  - Removes runtime `.phase1/loop-status.json` and `.phase1/memory-snapshot.json`.

---

## 3) Quick run path (minimal)

### Terminal A — Studio

```bash
npm run demo:studio
```

Open: `http://localhost:5173`

### Terminal B — Trigger proving scenario

```bash
npm run demo:trigger
```

### Terminal C — Optional inspect/reset

```bash
npm run demo:inspect
npm run demo:reset
```

---

## 4) What to look for in Studio

Panels to verify proving path visibility:

1. **System Loop**
   - last incoming signal
   - runtime triage (novelty/relevance/contradiction)
   - baseline/deep state
   - candidate action + outcome
2. **Runtime Status**
   - mode, deep-opened state, candidate/outcome summaries
   - warning/error summaries
   - data source (`runtime-artifact` vs `fallback`)
3. **Memory Snapshot (read-only)**
   - working/episodes/reference/thread/outcome/associations samples
   - explicit read-only relay label

Quick Actions panel now includes:
- Trigger scenario
- Inspect artifacts
- Reset demo state

---

## 5) Artifact locations

Runtime writes proving artifacts to:

- `../alive-runtime/.phase1/loop-status.json`
- `../alive-runtime/.phase1/memory-snapshot.json`

Studio relay reads from those files via:
- `studio/dashboard/server/phase1.ts`

---

## 6) Known constraints (intentional for Phase 1)

- Studio is read-only visibility, not a control plane.
- Runtime remains the choke point.
- Mind remains cognition-only.
- Body remains sensing/execution.
- Candidate actions in proving flow are currently low-risk/display-oriented for demo safety.

---

## 7) If something looks stale

1. Reset:

```bash
npm run demo:reset
```

2. Trigger again:

```bash
npm run demo:trigger
```

3. Inspect artifacts:

```bash
npm run demo:inspect
```
