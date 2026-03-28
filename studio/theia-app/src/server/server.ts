/**
 * ALIVE Studio — App Server
 *
 * Responsibilities:
 *   - Serve the static browser app (public/)
 *   - Accept WebSocket connections from the browser client
 *   - Route commands to MockRuntime (dev) or the alive-runtime InterfaceBridge (real)
 *   - Broadcast pipeline events back to connected clients
 *   - Expose /api/open-vscode convenience endpoint
 *
 * Runtime mode is selected by the ALIVE_REAL_RUNTIME environment variable:
 *
 *   ALIVE_REAL_RUNTIME=false  (default)
 *     Uses MockRuntime — self-contained, no external dependencies.
 *     Perfect for UI development and demos.
 *
 *   ALIVE_REAL_RUNTIME=true
 *     Proxies every browser connection to the InterfaceBridge WebSocket server
 *     on port 2719. Start alive-runtime separately before starting the Studio.
 *     Pipeline events flow: Browser ←2718→ Studio ←2719→ InterfaceBridge ←→ runPipeline
 */

import express              from 'express';
import http                 from 'http';
import path                 from 'path';
import { exec }             from 'child_process';
import { WebSocketServer, WebSocket } from 'ws';
import { MockRuntime }      from './mock-runtime';

const ALIVE_REPOS    = path.resolve(__dirname, '../../../../../..');
const PUBLIC_DIR     = path.resolve(__dirname, '../../public');
const PORT           = Number(process.env.PORT           ?? 2718);
const BRIDGE_PORT    = Number(process.env.BRIDGE_PORT    ?? 2719);
const USE_REAL_RUNTIME = process.env.ALIVE_REAL_RUNTIME === 'true';

// ─── HTTP server ──────────────────────────────────────────────────────────────

const app    = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    repoRoot: ALIVE_REPOS,
    mode: USE_REAL_RUNTIME ? 'real' : 'mock',
  });
});

// Open a path in VS Code (convenience; optional)
app.post('/api/open-vscode', (req, res) => {
  const target = (req.body as { path?: string }).path ?? ALIVE_REPOS;
  exec(`code "${target}"`, (err) => {
    if (err) {
      console.error('[Studio] open-vscode error:', err.message);
      res.status(500).json({ ok: false, error: err.message });
    } else {
      res.json({ ok: true });
    }
  });
});

// Fallback: serve index.html for any unknown route
app.get('*', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ─── WebSocket server ─────────────────────────────────────────────────────────

const wss = new WebSocketServer({ server });

wss.on('connection', (browserWs: WebSocket) => {
  console.log('[Studio] Browser client connected');

  if (USE_REAL_RUNTIME) {
    // ── Real runtime mode: proxy to InterfaceBridge on port 2719 ──────────────
    console.log(`[Studio] Connecting to InterfaceBridge on ws://localhost:${BRIDGE_PORT}`);

    const bridge = new WebSocket(`ws://localhost:${BRIDGE_PORT}`);

    bridge.on('open', () => {
      console.log('[Studio] Bridge connection established');
    });

    // Forward every event the bridge emits straight to the browser client
    bridge.on('message', (data: Buffer) => {
      if (browserWs.readyState === WebSocket.OPEN) {
        browserWs.send(data.toString());
      }
    });

    // Forward every command the browser sends straight to the bridge
    browserWs.on('message', (data: Buffer) => {
      if (bridge.readyState === WebSocket.OPEN) {
        bridge.send(data.toString());
      } else {
        console.warn('[Studio] Bridge not ready — dropping command');
        browserWs.send(JSON.stringify({
          type: 'runtime.error',
          error: 'Bridge is not connected — is alive-runtime running?',
          stage: 'server',
        }));
      }
    });

    bridge.on('close', () => {
      console.log('[Studio] Bridge connection closed');
      if (browserWs.readyState === WebSocket.OPEN) {
        browserWs.send(JSON.stringify({
          type: 'runtime.error',
          error: 'Bridge disconnected — alive-runtime may have stopped',
          stage: 'server',
        }));
        browserWs.close();
      }
    });

    bridge.on('error', (err: Error) => {
      console.error('[Studio] Bridge error:', err.message);
      if (browserWs.readyState === WebSocket.OPEN) {
        browserWs.send(JSON.stringify({
          type: 'runtime.error',
          error: `Bridge connection failed: ${err.message}`,
          stage: 'server',
        }));
      }
    });

    browserWs.on('close', () => {
      console.log('[Studio] Browser client disconnected — closing bridge connection');
      bridge.close();
    });

    browserWs.on('error', (err: Error) => {
      console.error('[Studio] Browser WS error:', err.message);
      bridge.close();
    });

  } else {
    // ── Mock runtime mode: self-contained, no external dependencies ───────────

    // Each connection gets its own MockRuntime instance.
    const runtime = new MockRuntime((event) => {
      if (browserWs.readyState === WebSocket.OPEN) {
        browserWs.send(JSON.stringify(event));
      }
    });

    // Greet the client
    browserWs.send(JSON.stringify({ type: 'studio.connected', timestamp: Date.now() }));

    browserWs.on('message', (data: Buffer) => {
      try {
        const cmd = JSON.parse(data.toString()) as Record<string, unknown>;
        console.log(`[Studio] Command: ${cmd.type}`);
        runtime.handleCommand(cmd);
      } catch (e) {
        console.error('[Studio] Bad command payload:', e);
        browserWs.send(JSON.stringify({
          type: 'runtime.error',
          error: 'Bad command format',
          stage: 'server',
        }));
      }
    });

    browserWs.on('close', () => {
      console.log('[Studio] Browser client disconnected');
      runtime.dispose();
    });

    browserWs.on('error', (err: Error) => {
      console.error('[Studio] WS error:', err.message);
    });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

const modeLabel = USE_REAL_RUNTIME
  ? `REAL RUNTIME  (bridge → ws://localhost:${BRIDGE_PORT})`
  : 'MOCK RUNTIME  (dev)';

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════╗');
  console.log('  ║         ALIVE Studio is running        ║');
  console.log('  ╠═══════════════════════════════════════╣');
  console.log(`  ║  URL:   http://localhost:${PORT}           ║`);
  console.log(`  ║  Repos: ${ALIVE_REPOS.slice(-36).padEnd(36)} ║`);
  console.log(`  ║  Mode:  ${modeLabel.padEnd(30)} ║`);
  console.log('  ╚═══════════════════════════════════════╝');
  console.log('');

  if (USE_REAL_RUNTIME) {
    console.log(`  ⚠  Real runtime mode: ensure alive-runtime is running on port ${BRIDGE_PORT}`);
    console.log('     cd alive-runtime && node --import tsx src/wiring/start-bridge.ts');
    console.log('');
  }
});
