# ALIVE Studio

**Development cockpit for the ALIVE organism.**

A real, running browser-based workbench that lets you:
- Launch and stop the ALIVE runtime
- Inject test signals through the full pipeline
- Watch the signal trace in real time (ingestion → STG → mind → execution → LTG)
- Monitor runtime state and mode
- Read all logs and errors in one panel

---

## Quick start

```bash
cd alive-interface/studio/theia-app

# Install dependencies (Express, ws, esbuild, TypeScript)
npm install

# Build server + bundle client
npm run build

# Start the studio
npm start
```

Then open **http://localhost:2718** in your browser.

---

## Dev mode (auto-rebuild on change)

```bash
npm run dev:simple
```

This builds everything then starts the server. Re-run after source changes.

For full watch mode (requires `concurrently`):
```bash
npm run dev
```

---

## What you'll see

```
┌──────────────────────────────────────────────────────────────┐
│ A │ ALIVE Studio        │  🚀 Launcher │ 📋 Trace │ ⚡ ...   │
│   ├─────────────────────┤──────────────────────────────────  │
│   │ > Launcher          │                                     │
│   │ > Signal Trace      │   Plugin panel renders here        │
│   │ > Signal Injection  │                                     │
│   │ > Runtime State     │                                     │
│   │ > Logs              │                                     │
│   ├─────────────────────┴──────────────────────────────────  │
│   │ 📄 Logs & Output                                          │
│   │ [log entries stream here]                                 │
│   └──────────────────────────────────────────────────────────│
│ ◉ Connected · ALIVE Studio · dev                             │
└──────────────────────────────────────────────────────────────┘
```

**Left sidebar** — workspace navigation + panel shortcuts + quick-inject buttons
**Tab bar** — switch between Launcher / Trace / Signals / State
**Bottom panel** — live log output
**Status bar** — connection state
**Ctrl+P** — command palette (all ALIVE commands)

---

## Architecture

```
alive-interface/studio/
├── packages/
│   ├── shared-types/       ← RuntimeEvent, InterfaceCommand, TraceEntry types
│   └── runtime-client/     ← WebSocket client singleton (one path to runtime)
├── plugins/
│   ├── alive-launcher/     ← Start/stop, profile selector, session status
│   ├── alive-trace/        ← Signal trace cards (expandable per-stage)
│   ├── alive-signals/      ← Test signal injection panel
│   ├── alive-state/        ← Runtime state overview + event feed
│   └── alive-logs/         ← Unified log/warn/error panel
└── theia-app/
    ├── src/server/
    │   ├── server.ts        ← Express + WebSocket server
    │   └── mock-runtime.ts  ← Full pipeline simulator (STG, mind, executive, LTG)
    ├── src/client/
    │   └── app.ts           ← Browser entry point (mounts plugins, wires tabs)
    ├── public/
    │   ├── index.html       ← App shell (CSS Grid cockpit layout)
    │   └── studio.css       ← VS Code-inspired dark theme
    └── esbuild.config.mjs   ← Bundles all TS → public/bundle.js
```

**Architecture rule**: plugins never touch alive-mind, alive-body, or alive-runtime
directly. All communication goes through `runtimeClient` → WebSocket → `server.ts`
→ `MockRuntime` (dev) or real runtime bridge (prod).

---

## What is real vs mocked

| Component | Status |
|---|---|
| App shell, tab layout, command palette | ✅ Real |
| All 5 plugins (UI + event wiring) | ✅ Real |
| RuntimeClient (WebSocket, EventEmitter) | ✅ Real |
| WebSocket server + command routing | ✅ Real |
| Signal pipeline simulation | ✅ Mock — see `mock-runtime.ts` |
| alive-runtime integration | ⬜ Not yet — replace `MockRuntime` in `server.ts` |

---

## Wiring to alive-runtime

When `alive-runtime` exposes a WebSocket or HTTP API:

1. Open `theia-app/src/server/server.ts`
2. Replace `new MockRuntime(send)` with your real runtime bridge class
3. The bridge must accept `handleCommand(cmd)` and call `emit(event)` for each pipeline event
4. No plugin code changes needed — the interface contract is stable

---

## Docs

- `docs/ALIVE_STUDIO_ARCHITECTURE.md` — full architecture reference
- `docs/ALIVE_STUDIO_RUNBOOK.md`      — step-by-step operation guide
