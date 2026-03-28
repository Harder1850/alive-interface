/**
 * ALIVE Studio Event Types
 * Events emitted by the runtime pipeline for studio plugins to consume
 */

export type RuntimeEvent =
  | { type: 'signal.received'; signal_id: string; raw_content: string; timestamp: number }
  | { type: 'signal.filtered'; signal_id: string; passed: boolean }
  | { type: 'firewall.checked'; signal_id: string; status: 'cleared' | 'blocked' }
  | { type: 'stg.evaluated'; signal_id: string; verdict: 'OPEN' | 'DEFER' | 'DENY' }
  | { type: 'mind.started'; signal_id: string }
  | { type: 'mind.completed'; signal_id: string; decision_id: string; action_type: string; confidence: number }
  | { type: 'executive.evaluated'; signal_id: string; verdict: 'AUTHORIZED' | 'VETOED'; reason?: string }
  | { type: 'execution.completed'; signal_id: string; action_type: string; result: string }
  | { type: 'pipeline.error'; signal_id: string; error: string; stage: string };

export type InterfaceCommand =
  | { type: 'start'; profile?: string }
  | { type: 'stop' }
  | { type: 'inject_signal'; payload: string }
  | { type: 'request_status' }
  | { type: 'clear_trace' };

export interface RuntimeStatus {
  running: boolean;
  mode: string;
  signal_count: number;
  last_signal?: string;
  uptime_ms: number;
}

export interface TraceEntry {
  signal_id: string;
  timestamp: number;
  events: RuntimeEvent[];
  final_result?: string;
  final_verdict?: string;
}

export interface SignalMetadata {
  id: string;
  raw_content: string;
  received_at: number;
  source: string;
}
