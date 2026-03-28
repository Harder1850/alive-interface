# ALIVE Studio — Runbook

## Install

```bash
cd C:\Users\mikeh\dev\ALIVE\alive-repos\alive-interface\studio\theia-app
npm install
```

This installs: `express`, `ws`, `esbuild`, `typescript`, `concurrently` and their
type definitions. No Yarn, no workspaces, no publish steps.

---

## Build

```bash
npm run build
```

Two steps run in sequence:

1. **`npm run build:server`** — runs `tsc` to compile `src/server/*.ts` → `dist/server/`
2. **`npm run build:client`** — runs `node esbuild.config.mjs` to bundle all client
   TypeScript into `public/bundle.js`

Expected output:
```
[tsc] src/server/server.ts → dist/server/server.js
[tsc] src/server/mock-runtime.ts → dist/server/mock-runtime.js
[esbuild] Bundle written → public/bundle.js
```

---

## Start

```bash
npm start
```

Starts the Express + WebSocket server. Expected console output:

```
  ╔═══════════════════════════════════════╗
  ║         ALIVE Studio is running        ║
  ╠═══════════════════════════════════════╣
  ║  URL:   http://localhost:2718           ║
  ║  Repos: ...alive-repos                  ║
  ║  Mode:  MOCK RUNTIME (dev)             ║
  ╚═══════════════════════════════════════╝
```

Open **http://localhost:2718** in your browser.

---

## Dev: watch mode

```bash
npm run dev:simple
```

Builds then starts. Re-run manually after changes.

For full watch + auto-restart (experimental):
```bash
npm run dev
```

---

## Using the cockpit

### Step 1 — Check connection

Bottom status bar shows:
- `◉ Connected` = WebSocket connected to studio server
- `◌ Connecting…` / `◌ Reconnecting…` = server not reachable

### Step 2 — Start ALIVE

1. Click the **Launcher** tab (or nav item in sidebar)
2. Select a **Profile** from the dropdown
3. Click **▶ Start ALIVE**

Status badge changes to **● RUNNING**. Bottom bar shows `▶ Running · default`.

### Step 3 — Inject a signal

**Option A — Quick inject (sidebar)**
Click any of the quick-inject buttons in the left sidebar:
`hello`, `cpu spike`, `disk low`, `deny`

**Option B — Signals panel**
1. Click the **Signals** tab
2. Click any predefined scenario button, OR
3. Type a custom payload and press **▶ Inject** or **Enter**

**Option C — Command palette (Ctrl+P)**
Press `Ctrl+P`, type `inject`, select a scenario.

### Step 4 — Watch the trace

Click the **Trace** tab.

Each injected signal appears as an expandable card. Click to expand and see:
- ① Ingested
- ② Filtered
- ③ Firewall
- ④ CB (novelty / recurrence)
- ⑤ STG verdict (OPEN / DEFER / DENY)
- ⑥ Mind start
- ⑦ Mind decision (action type + confidence %)
- ⑧ Executive (AUTHORIZED / VETOED)
- ⑨ Executed (result string)
- ⑩ LTG (PROMOTE / DEFER / DISCARD)

If STG returned DENY or DEFER, the card shows `✕ Terminated @ stg` and stops there.

### Step 5 — Check state

Click the **State** tab. Shows:
- Running status, profile, mode, uptime
- Total signals processed, last STG verdict, error count
- Rolling event feed (last 20 events)

### Step 6 — Read logs

Bottom panel always shows logs. Filter by level (Info / Warn / Error) using the
dropdown. Click **Clear** to wipe.

---

## STG scenarios (mock)

| Payload contains | STG result |
|---|---|
| `deny`, `banned`, `block` | DENY — pipeline terminates |
| `defer`, `later`, `queue` | DEFER — pipeline terminates |
| Very low novelty (repeated) | DEFER automatically |
| Anything else | OPEN — continues to mind |

| Other special patterns | Effect |
|---|---|
| `__inject__` | Firewall blocked |
| Empty string | Filter dropped |
| `unauthorized` | Executive VETO |

---

## Command palette (Ctrl+P)

Available commands:
- `ALIVE: Start` / `ALIVE: Stop`
- `ALIVE: Request Status`
- `ALIVE: Inject CPU Spike / Disk Low / Repeated Signal / Hello`
- `ALIVE: Force STG DENY` / `ALIVE: Force STG DEFER`
- `ALIVE: Clear Trace`
- `ALIVE: Open Launcher / Trace / Signals / State / Logs`

---

## Open in VS Code

Click the external-link icon in the activity bar (far left) to open the entire
ALIVE repo stack (`alive-repos/`) in VS Code.

Requires VS Code's `code` CLI to be in PATH. On Windows, run VS Code once and
enable "Add to PATH" from the Command Palette: `Shell Command: Install 'code' command`.

---

## Changing the port

```bash
PORT=3000 npm start
```

Or set `PORT` in an `.env` file and use `dotenv` — not included by default.

---

## Wiring to alive-runtime (when ready)

1. Open `src/server/server.ts`
2. Find: `const runtime = new MockRuntime(send);`
3. Replace with your runtime bridge:
   ```typescript
   import { RuntimeBridge } from './runtime-bridge';
   const runtime = new RuntimeBridge(send);
   ```
4. `RuntimeBridge` must implement:
   - `handleCommand(cmd: Record<string, unknown>): void`
   - `dispose(): void`
5. For each pipeline event received from alive-runtime, call `emit({ type: '...', ... })`
   with the appropriate `RuntimeEvent` shape from `shared-types`
6. Rebuild and restart: `npm run build && npm start`

No plugin changes required.

---

## Troubleshooting

**`bundle.js` not found / blank page**
Run `npm run build:client` first. Check that `public/bundle.js` exists.

**WebSocket shows `◌ Disconnected`**
Check that `npm start` is running and the port (2718) isn't in use:
```bash
netstat -an | findstr 2718   # Windows
lsof -i :2718                 # Unix
```

**TypeScript compilation errors in server**
Run `npm run build:server` separately to see the exact error.
Common: missing `@types/node` — ensure it's in `devDependencies`.

**esbuild alias resolution errors**
Verify the paths in `esbuild.config.mjs` — they must resolve from the `theia-app/`
directory. All `../packages/...` and `../plugins/...` paths should exist.

**Signals not appearing in trace**
Ensure runtime is **Started** before injecting. The Launcher panel shows the badge.
