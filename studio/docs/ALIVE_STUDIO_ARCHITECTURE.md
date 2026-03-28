# ALIVE Studio — Architecture Reference

## Overview

ALIVE Studio is the development cockpit for the ALIVE organism. It is built inside
`alive-interface/studio/` as a browser-based single-page application served by a
lightweight Node.js server.

The studio's role: **observability + signal injection during development**. It must
never own logic, truth, or decision authority. It is a window into the organism,
not a controller of it.

---

## Directory structure

```
alive-interface/studio/
├── packages/
│   ├── shared-types/           ← TypeScript contracts (RuntimeEvent, commands, status)
│   └── runtime-client/         ← The only comms path: browser → server → runtime
├── plugins/
│   ├── alive-launcher/         ← Session lifecycle (start/stop/profile/status)
│   ├── alive-trace/            ← Per-signal pipeline trace (all stages)
│   ├── alive-signals/          ← Test signal injection
│   ├── alive-state/            ← Runtime overview + event feed
│   └── alive-logs/             ← Unified log panel
└── theia-app/
    ├── src/server/
    │   ├── server.ts            ← Express HTTP + WebSocket server
    │   └── mock-runtime.ts      ← Full pipeline simulator
    ├── src/client/
    │   └── app.ts               ← Browser bootstrap (mounts plugins, wires UI)
    ├── public/
    │   ├── index.html           ← App shell (CSS Grid 3-column × 3-row layout)
    │   └── studio.css           ← All styles (VS Code dark theme)
    ├── esbuild.config.mjs       ← Bundles client TS → public/bundle.js
    ├── package.json             ← deps: express, ws, esbuild, typescript
    └── tsconfig.json            ← Server compilation only (CommonJS)
```

---

## Message flow

```
Browser                 Server (Node.js)        Runtime
──────────────────────────────────────────────────────
Plugin                  server.ts               mock-runtime.ts (dev)
  │                         │                   alive-runtime (prod)
  │ ── executeCommand ──▶  runtimeClient         │
  │ (WebSocket JSON)         │── handleCommand ──▶│
  │                         │                    │── pipeline stages
  │                         │◀── emit(event) ────│
  │◀── WS message ──────────│                    │
  │ handleEvent(ev)          │                    │
  │ emitter.emit(ev.type)    │                    │
  ▼                         │                    │
Plugin handler             │                    │
(UI update)                │                    │
```

**One rule**: plugins call `runtimeClient.executeCommand(cmd)` and subscribe to
`runtimeClient.on(event, handler)`. Nothing else.

---

## Component descriptions

### `shared-types/src/index.ts`

Single source of truth for the message contract between interface and runtime.
Contains:
- `RuntimeEvent` — discriminated union of all events the pipeline can emit
- `InterfaceCommand` — commands the interface can send (start, stop, inject_signal, etc.)
- `RuntimeStatus` — snapshot of runtime state
- `TraceEntry` — collected events for one signal_id

### `runtime-client/src/index.ts`

Browser-side singleton (`runtimeClient`). Responsibilities:
- Manages the WebSocket connection to the server (auto-reconnect)
- Sends commands as JSON over WebSocket
- Receives events and dispatches them to plugin subscribers via a lightweight Emitter
- Maintains a local mirror of `RuntimeStatus`
- Stores `TraceEntry` objects per signal_id
- Does NOT contain any runtime logic. Thin transport layer only.

### `plugins/alive-launcher`

Mounts into `#panel-launcher`. Provides:
- Profile selector (default, debug, conservative, aggressive)
- Start / Stop buttons → `executeCommand({ type: 'start'/'stop' })`
- Status grid: running state, uptime, signal count, mode, last STG verdict, errors
- Connection indicator for the WebSocket link

### `plugins/alive-trace`

Mounts into `#panel-trace`. Provides:
- Expandable card per signal_id (newest first)
- Each card shows every pipeline stage in order with stage label + detail
- Partial trace updates in real-time as events arrive
- Clear button → `executeCommand({ type: 'clear_trace' })`

### `plugins/alive-signals`

Mounts into `#panel-signals`. Provides:
- 8 predefined scenario buttons (hello, cpu spike, disk low, deny, defer, etc.)
- Custom signal input field + Enter/button injection
- All inject via `executeCommand({ type: 'inject_signal', payload })`
- Runtime-not-running guard (shows warning instead of sending)

### `plugins/alive-state`

Mounts into `#panel-state`. Provides:
- Status grid: runtime on/off, profile, mode, uptime, signal count, STG, errors
- Recent pipeline event feed (last 20 events, newest first)
- Honest: shows "—" for fields that have no data yet

### `plugins/alive-logs`

Mounts into `#panel-logs` (bottom panel). Provides:
- Log, warn, error entries with timestamps and source tags
- Captures console.warn / console.error from other modules
- Subscribes to all `pipeline.event` and `runtime.error` events
- Filter by level (All / Info / Warn / Error)

### `theia-app/src/server/server.ts`

Node.js process. Responsibilities:
- Serves `public/` as static files (HTTP)
- Accepts WebSocket connections from the browser
- Creates one `MockRuntime` instance per connected client
- Routes incoming WS messages to `runtime.handleCommand(cmd)`
- `POST /api/open-vscode` — opens the ALIVE repo root in VS Code

### `theia-app/src/server/mock-runtime.ts`

Simulates the full ALIVE signal pipeline. Per-signal sequence:
1. `signal.received`
2. `signal.filtered` (rejects empty payloads)
3. `firewall.checked` (blocks `__inject__` pattern)
4. `cb.evaluated` (novelty/recurrence scores)
5. `stg.evaluated` — OPEN/DEFER/DENY based on payload content + novelty
6. `mind.started` / `mind.completed` (action_type decision + confidence)
7. `executive.evaluated` — blocks `unauthorized` keyword
8. `execution.completed`
9. `ltg.evaluated` — PROMOTE/DEFER/DISCARD based on novelty

Also handles `start`, `stop`, `request_status` commands and emits
`runtime.started/stopped` and periodic `status.update` events.

---

## Architecture boundaries

These are non-negotiable:

| Rule | Where enforced |
|------|---------------|
| Interface never calls alive-mind directly | No alive-mind imports anywhere in studio/ |
| Interface never calls alive-body directly | No alive-body imports anywhere in studio/ |
| All comms go through alive-runtime | `runtimeClient` is the only exit point |
| Interface does not own truth or decisions | Plugins read-only display; no logic |
| Mock runtime is behind the client interface | Swappable without touching any plugin |

---

## Wiring to alive-runtime

`server.ts` contains:
```typescript
const runtime = new MockRuntime((event) => ws.send(JSON.stringify(event)));
```

To connect to the real `alive-runtime`:
1. Implement a `RuntimeBridge` class with the same `handleCommand` / `dispose` API
2. The bridge connects to alive-runtime's HTTP/WS/IPC transport
3. For each pipeline event received from the real runtime, call `emit(event)` with the
   correct `RuntimeEvent` shape
4. Replace `new MockRuntime(...)` with `new RuntimeBridge(...)` in `server.ts`

No plugin code changes required.

---

## Build system

- **Server** (Node.js): `tsc` compiles `src/server/**/*.ts` → `dist/server/`
- **Client** (browser): `esbuild` bundles `src/client/app.ts` + all plugins + packages → `public/bundle.js`
  - `@alive-studio/*` aliases resolved to local source trees via esbuild `alias` option
  - No npm workspace publish needed
- **Single command**: `npm run build` in `theia-app/` runs both
