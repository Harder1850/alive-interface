# ALIVE Studio

**Theia-based development interface for the ALIVE runtime.**

A development cockpit, system inspector, launcher, trace viewer, and test harness — integrated directly with the real `alive-runtime/src/wiring/pipeline.ts`.

## Quick Start

```bash
cd alive-interface/theia-app
npm install
npm run build
npm start
# Opens http://localhost:3000
```

## Features

- 🚀 **ALIVE Launcher** — Start/stop runtime, select profile, monitor status
- 📋 **Signal Trace** — Ordered trace viewer grouped by signal, showing all pipeline events in real-time
- ⚡ **Signal Injection** — Inject test signals with predefined scenarios (queries, alerts, system events)
- 🔌 **Runtime State** — Display current mode, uptime, signal count, resource metrics
- 📄 **Logs** — Filter and view all runtime logs, errors, and warnings
- 💡 **Command Palette** — Keyboard shortcuts for common operations (Ctrl+K)

## Architecture

```
alive-interface/
  theia-app/              # Main Theia app (HTML, bootstrappper, layout)
  packages/
    shared-types/         # Event type definitions (RuntimeEvent, InterfaceCommand)
    runtime-client/       # Wraps alive-runtime pipeline, emits events
  plugins/
    alive-launcher/       # Start/stop, profile selector
    alive-trace/          # Signal trace viewer
    alive-signals/        # Test signal injection
    alive-state/          # Runtime state display
    alive-logs/           # Log viewer with filters
```

## Runtime Integration (The Critical Part)

**All plugins are wired to the ACTUAL runtime pipeline, not mocks.**

```
alive-runtime/src/wiring/pipeline.ts
           ↑
           │ (real execution)
           │
RuntimeClient (packages/runtime-client/src/index.ts)
           ↑
           │ (emits RuntimeEvent streams)
           │
Plugins (read-only, display only)
           ↑
           │ (visual feedback)
           │
UI (non-authoritative)
```

### How Integration Works

1. **RuntimeClient** captures pipeline execution
2. Each stage of the pipeline emits a `RuntimeEvent`
3. Plugins subscribe to real event streams
4. UI displays events as they happen
5. No decision logic in the UI — all logic stays in the runtime

### Event Types  

```typescript
type RuntimeEvent =
  | { type: "signal.received"; signal_id: string; raw_content: string }
  | { type: "stg.evaluated"; signal_id: string; verdict: "OPEN" | "DEFER" | "DENY" }
  | { type: "mind.completed"; signal_id: string; decision_id: string }
  | { type: "execution.completed"; signal_id: string; result: string }
  | { type: "pipeline.error"; signal_id: string; error: string; stage: string };
```

## Usage

### 1. Start ALIVE Runtime

1. Open **Launcher** tab (default)
2. Click **▶ Start ALIVE**
3. Select profile (Default, Aggressive, Conservative, Debug)
4. Observe status change to "Running"

### 2. Inject Test Signals

Click any predefined scenario:
- 🧪 Query: "hello?"
- ⚠️ Alert: System
- 📊 Query: Status
- 🔥 CPU Spike
- 💾 Memory Low
- 💿 Disk Full

Or enter custom payload and press Enter.

### 3. View Real-Time Trace

1. Click **Trace** tab
2. Each signal displays as expandable entry showing:
   - Signal received → Firewall → STG → Mind → Executive → Execution
   - All true events from the pipeline
   - Click to expand/collapse

### 4. Monitor Runtime State

Right panel shows:
- **Status** (Running/Stopped)
- **Mode** (active)
- **Uptime** (seconds)
- **Signals** (count)
- **Pipeline Health** (metrics)

### 5. View Logs

Bottom panel shows all events:
- INFO (green) — normal pipeline events
- WARNING (yellow) — resource warnings
- ERROR (red) — failures

Filter by level using dropdown.

## Command Palette (Ctrl+K)

Quick commands:

```
Start ALIVE
Stop ALIVE
Inject CPU Spike
Inject Disk Low
Open Trace View
Open State View
```

## UI Layout

```
┌─────────────────┬──────────────────────────┬────────────┐
│                 │ 🚀 Launcher              │            │
│  File Explorer  │ 📋 Trace                 │   State    │
│  (ALIVE tree)   │ ⚡ Signals                │   Panel    │
│                 │                          │            │
├─────────────────┼──────────────────────────┤            │
│                 │                          │            │
│                 │   Active Tab Content     │            │
│                 │    (launcher, trace,     │            │
│                 │     or signals)          │            │
│                 │                          │            │
├─────────────────┴──────────────────────────┴────────────┤
│            📄 Logs Panel (filter by level)              │
│              (info, warning, error)                     │
└──────────────────────────────────────────────────────────┘
```

## Plugin Structure

Each plugin:

```typescript
export class MyPlugin {
  async activate(): Promise<void> {
    this.createUI();      // Build HTML
    this.attachListeners(); // Wire to runtime events
  }

  private attachListeners(): void {
    // Subscribe to real pipeline events
    runtimeClient.on('pipeline.event', (event) => {
      // Display real data only
      this.displayEvent(event);
    });
  }
}
```

**Never use mock data. Always subscribe to real events.**

## Building & Deploying

### Development

```bash
cd alive-interface

# Install all packages
npm install

# Watch mode
npm run build -- --watch

# Run tests
npm test
```

### Production

```bash
npm run build
npm run start
# Serves on http://localhost:3000
```

## Troubleshooting

### "Runtime not responding"
1. Ensure `alive-runtime` is compiled
2. Check console for errors
3. Verify pipeline path: `alive-runtime/src/wiring/pipeline.ts`

### "No events in trace"
1. Click Start ALIVE button first
2. Inject a signal
3. Check Logs panel for errors
4. If pipeline errors appear, fix them before retrying

### "Plugin fails to load"
1. Check browser console (F12)
2. Ensure all dependencies installed: `npm install`
3. Run `npm run build` in plugin directory
4. Clear browser cache

### "Build errors"
```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## File Reference

| File | Purpose |
|---|---|
| `packages/shared-types/src/events.ts` | Event and command type definitions |
| `packages/runtime-client/src/index.ts` | **Core:** wraps pipeline, emits events, sends commands |
| `plugins/alive-launcher/` | Start/stop, profile selector, uptime display |
| `plugins/alive-trace/` | Real-time trace viewer with signal grouping |
| `plugins/alive-signals/` | Signal injection UI (predefined + custom) |
| `plugins/alive-state/` | Runtime state display (mode, uptime, metrics) |
| `plugins/alive-logs/` | Log viewer with level filtering |
| `theia-app/src/main.ts` | **Bootstrap:** initializes plugins, layout, command palette |
| `theia-app/index.html` | HTML entry point |

## Architecture Constraints

### DO ✓
- Send commands to runtime only
- Display runtime outputs only
- Subscribe to real pipeline events
- Keep UI non-authoritative
- All decisions flow through runtime

### DON'T ✗
- Call mind/body directly from UI
- Bypass runtime
- Implement decision logic in UI
- Store system truth in UI
- Use mock data

## Next Steps

- [ ] WebSocket bridge for distributed runtime
- [ ] Persistent trace storage & replay
- [ ] Performance profiler plugin
- [ ] Memory inspector plugin
- [ ] Decision explainability plugin
- [ ] Test harness integration
- [ ] Full Theia IDE integration

## License

Apache-2.0
