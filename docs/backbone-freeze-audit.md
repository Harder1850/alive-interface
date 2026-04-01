# ALIVE Backbone Freeze Audit (Interface-owned slice)

## Scope

Repos considered in boundary matrix:

- `alive-constitution`
- `alive-mind`
- `alive-body`
- `alive-runtime`
- `alive-interface`

This pass enforces structure without architecture redesign.

## Allowed import matrix

| From \ To | constitution | mind | body | runtime | interface |
|---|---:|---:|---:|---:|---:|
| constitution | ✅ self | ❌ | ❌ | ❌ | ❌ |
| mind | ✅ | ✅ self | ❌ | ❌ | ❌ |
| body | ✅ | ❌ | ✅ self | ❌ | ❌ |
| runtime | ✅ | ✅ public only (`alive-mind/src/index`) | ✅ public only (`alive-body/src/index`) | ✅ self | ❌ |
| interface | ✅ types/contracts only | ❌ direct | ❌ direct | ✅ via API/relay only | ✅ self |

## Enforcement added

### 1) Static boundary checker

File: `scripts/backbone-freeze-check.mjs`

Adds fail-fast import scanning across all five repos for disallowed cross-repo imports.

Run with:

```bash
npm run check:backbone
```

### 2) Runtime choke-point tightening in interface

- CLI entry (`src/index.ts`) no longer imports `alive-body` or `alive-runtime` internals directly.
- CLI now relays plain-language input through Studio runtime route: `POST /api/intent/run`.

### 3) Studio intent + approvals shell

- Added plain-language top input (`What do you want to do?`) in Live Mode.
- Added approval-aware counters/shell:
  - auto-approved actions
  - pending approval actions
  - blocked actions
  - latest thread / latest issue
- Added backend intent route (`/api/intent/run`) and runtime-routed execution behavior.

### 4) Readiness hardening

- `startup-readiness` now includes `intentPathReady`.
- Windows launcher now blocks until all are ready:
  - Studio
  - Runtime
  - Demo path
  - Intent path

## Public contract surfaces (current practical baseline)

- `alive-mind`: `src/index.ts` (intended public surface)
- `alive-body`: `src/index.ts` (intended public surface)
- `alive-runtime`: `src/index.ts` (runtime public surface)
- `alive-interface`: Studio API client + backend routes (relay boundary)
- `alive-constitution`: contracts/policy modules (type/contract authority)

## Launcher/live-mode verification

1. Launch with one click:

   `scripts\windows\Start-AliveStudio.cmd`

2. Confirm readiness badges in Live Mode:
   - Studio ready
   - Runtime ready
   - Demo path ready
   - Intent path ready

3. Enter a plain-language intent in top box and run.
4. Confirm approval shell updates and output log receives result.
5. Run `Run Live Demo`; confirm story/output refresh.

## Remaining structural weak spots

1. `alive-runtime` still has existing deep imports into `alive-mind/src/*` and `alive-body/src/*` in multiple files.
   - These are now explicitly detectable via `check:backbone`.
   - Full remediation requires phased runtime import migration to public surfaces.

2. Constitution packaging/public entry consistency should be normalized in-repo (export barrel + package export map).

3. A repo-level lint/CI gate should invoke `npm run check:backbone` on every PR.
