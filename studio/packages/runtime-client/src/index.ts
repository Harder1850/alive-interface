/**
 * ALIVE Studio — Runtime Client
 *
 * Browser-side singleton that is the ONLY communication path from
 * studio plugins to the runtime.
 *
 * Architecture:
 *   Plugin → runtimeClient.executeCommand(cmd)
 *            → WebSocket → theia-app server
 *            → MockRuntime (dev) or alive-runtime (prod)
 *            → events back over WS
 *            → runtimeClient emits to plugins
 *
 * Rules (from ALIVE architecture):
 *   - Interface must NEVER call alive-mind or alive-body directly.
 *   - All signals/commands go through this client → runtime.
 *   - This client is a thin transport layer. No logic lives here.
 */

import type { RuntimeEvent, InterfaceCommand, RuntimeStatus, TraceEntry } from '@alive-studio/shared-types';

// ─── Minimal browser-compatible EventEmitter ─────────────────────────────────
// No Node.js dependency. Works in both browser and bundled environments.

class Emitter {
  private handlers = new Map<string, Array<(data: unknown) => void>>();

  on(event: string, handler: (data: unknown) => void): () => void {
    let list = this.handlers.get(event);
    if (!list) { list = []; this.handlers.set(event, list); }
    list.push(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: (data: unknown) => void): void {
    const list = this.handlers.get(event);
    if (list) this.handlers.set(event, list.filter(h => h !== handler));
  }

  emit(event: string, data: unknown): void {
    const list = this.handlers.get(event);
    if (list) list.forEach(h => { try { h(data); } catch (e) { console.error('[Emitter]', e); } });
  }
}

// ─── RuntimeClient ────────────────────────────────────────────────────────────

export class RuntimeClient {
  private emitter    = new Emitter();
  private ws:        WebSocket | null = null;
  private wsUrl      = '';
  private reconnect: ReturnType<typeof setTimeout> | null = null;

  // Mirror of runtime state (updated from incoming events)
  private _status: RuntimeStatus = {
    running:      false,
    mode:         'idle',
    signal_count: 0,
    error_count:  0,
    uptime_ms:    0,
  };

  private _traces    = new Map<string, TraceEntry>();
  private _connected = false;

  // ─── Connection ──────────────────────────────────────────────────────────

  /** Call once from app.ts after DOM is ready. */
  connect(url?: string): void {
    this.wsUrl = url ?? `ws://${window.location.host}`;
    this._open();
  }

  private _open(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    console.log(`[RuntimeClient] Connecting → ${this.wsUrl}`);
    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => {
      this._connected = true;
      if (this.reconnect) { clearTimeout(this.reconnect); this.reconnect = null; }
      console.log('[RuntimeClient] Connected');
      this.emitter.emit('client.connected', {});
    };

    this.ws.onmessage = (msg: MessageEvent) => {
      try {
        const event = JSON.parse(msg.data as string) as RuntimeEvent;
        this._handle(event);
      } catch (e) {
        console.error('[RuntimeClient] Bad message:', e);
      }
    };

    this.ws.onclose = () => {
      this._connected = false;
      this.emitter.emit('client.disconnected', {});
      console.warn('[RuntimeClient] Disconnected — retrying in 3 s');
      this.reconnect = setTimeout(() => this._open(), 3000);
    };

    this.ws.onerror = () => {
      // onclose will fire next; no extra action needed
    };
  }

  // ─── Commands ─────────────────────────────────────────────────────────────

  async executeCommand(cmd: InterfaceCommand): Promise<void> {
    if (cmd.type === 'clear_trace') {
      this._traces.clear();
      this.emitter.emit('trace.cleared', {});
      return;
    }

    if (!this._connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      const msg = 'Not connected to ALIVE Studio server';
      console.warn('[RuntimeClient]', msg);
      this.emitter.emit('runtime.error', { error: msg, stage: cmd.type });
      return;
    }

    this.ws.send(JSON.stringify(cmd));
  }

  // ─── Event handling ───────────────────────────────────────────────────────

  private _handle(event: RuntimeEvent): void {
    // Special case: status snapshot from server
    if (event.type === 'status.update') {
      this._status = { ...event.status };
      this.emitter.emit('status.updated', this._status);
      return;
    }

    // Mutate local status mirror
    switch (event.type) {
      case 'runtime.started':
        this._status.running  = true;
        this._status.profile  = event.profile;
        this._status.mode     = 'active';
        break;
      case 'runtime.stopped':
        this._status.running  = false;
        this._status.mode     = 'idle';
        break;
      case 'signal.received':
        this._status.signal_count++;
        this._status.last_signal = event.signal_id;
        // Start a new trace entry
        this._traces.set(event.signal_id, {
          signal_id:   event.signal_id,
          raw_content: event.raw_content,
          timestamp:   event.timestamp,
          events:      [],
        });
        break;
      case 'stg.evaluated':
        this._status.last_stg_verdict = event.verdict;
        break;
      case 'pipeline.error':
        this._status.error_count++;
        break;
    }

    // Append event to the appropriate trace
    if ('signal_id' in event && event.signal_id) {
      const trace = this._traces.get(event.signal_id);
      if (trace) {
        trace.events.push(event);
        const terminal = event.type === 'execution.completed'
          || event.type === 'ltg.evaluated'
          || event.type === 'pipeline.error'
          || event.type === 'pipeline.terminated';
        if (terminal) {
          trace.final_result = event.type;
          if (event.type === 'pipeline.terminated' || event.type === 'pipeline.error') {
            trace.terminal_stage = ('stage' in event) ? (event as { stage: string }).stage : 'unknown';
          }
          this.emitter.emit('trace.updated', { ...trace, events: [...trace.events] });
        }
      }
    }

    // Broadcast to all subscribers
    this.emitter.emit(event.type, event);
    this.emitter.emit('pipeline.event', event);
  }

  // ─── Subscriptions ────────────────────────────────────────────────────────

  on(event: string, handler: (data: unknown) => void): () => void {
    return this.emitter.on(event, handler);
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  getStatus():    RuntimeStatus           { return { ...this._status }; }
  isConnected():  boolean                 { return this._connected; }
  getTrace(id: string): TraceEntry | undefined { return this._traces.get(id); }
  getAllTraces(): TraceEntry[]             { return Array.from(this._traces.values()); }
}

/** Module-level singleton — all plugins share this single connection. */
export const runtimeClient = new RuntimeClient();
