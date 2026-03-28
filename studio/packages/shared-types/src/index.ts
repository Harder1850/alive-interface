/**
 * ALIVE Studio — Shared Types
 *
 * All event, command, status, and trace types shared between:
 *   - runtime-client (browser)
 *   - plugins (browser)
 *   - theia-app server (Node.js)
 *
 * This file is the single source of truth for the interface<→>runtime
 * message contract.  Do NOT add logic here.
 */

// ─── Pipeline Events ─────────────────────────────────────────────────────────
// Every event the mock/real runtime can emit.

export type RuntimeEvent =
  | { type: 'studio.connected';      timestamp: number }
  | { type: 'runtime.started';       profile: string; timestamp: number }
  | { type: 'runtime.stopped';       timestamp: number }
  | { type: 'signal.received';       signal_id: string; raw_content: string; timestamp: number }
  | { type: 'signal.filtered';       signal_id: string; passed: boolean }
  | { type: 'firewall.checked';      signal_id: string; status: 'cleared' | 'blocked'; reason?: string }
  | { type: 'cb.evaluated';          signal_id: string; novelty: number; recurrence: number }
  | { type: 'stg.evaluated';         signal_id: string; verdict: 'OPEN' | 'DEFER' | 'DENY' }
  | { type: 'mind.started';          signal_id: string }
  | { type: 'mind.completed';        signal_id: string; decision_id: string; action_type: string; confidence: number }
  | { type: 'executive.evaluated';   signal_id: string; verdict: 'AUTHORIZED' | 'VETOED'; reason?: string }
  | { type: 'execution.completed';   signal_id: string; action_type: string; result: string }
  | { type: 'ltg.evaluated';         signal_id: string; result: 'PROMOTE' | 'DEFER' | 'DISCARD' }
  | { type: 'pipeline.terminated';   signal_id: string; reason: string; stage: string }
  | { type: 'pipeline.error';        signal_id: string; error: string; stage: string }
  | { type: 'status.update';         status: RuntimeStatus }
  | { type: 'runtime.error';         error: string; stage: string };

// ─── Commands (interface → runtime) ─────────────────────────────────────────

export type InterfaceCommand =
  | { type: 'start';          profile?: string }
  | { type: 'stop' }
  | { type: 'inject_signal';  payload: string }
  | { type: 'request_status' }
  | { type: 'clear_trace' };

// ─── Runtime Status ───────────────────────────────────────────────────────────

export interface RuntimeStatus {
  running:          boolean;
  mode:             string;
  profile?:         string;
  signal_count:     number;
  last_signal?:     string;
  last_stg_verdict?: 'OPEN' | 'DEFER' | 'DENY';
  error_count:      number;
  uptime_ms:        number;
}

// ─── Trace ────────────────────────────────────────────────────────────────────
// One TraceEntry collects all pipeline events for a single signal_id.

export interface TraceEntry {
  signal_id:      string;
  raw_content:    string;
  timestamp:      number;
  events:         RuntimeEvent[];
  final_result?:  string;      // last event type
  terminal_stage?: string;     // set if pipeline was terminated early
}
