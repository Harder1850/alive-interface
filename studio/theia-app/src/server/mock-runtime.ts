/**
 * ALIVE Studio — Mock Runtime
 *
 * Simulates the full ALIVE signal pipeline for development when
 * alive-runtime is not yet wired.  This lives entirely behind
 * the RuntimeClient WebSocket interface; plugins never see it.
 *
 * Pipeline simulation order:
 *   signal.received → signal.filtered → firewall.checked → cb.evaluated
 *   → stg.evaluated → (DENY/DEFER stops here) → mind.started
 *   → mind.completed → executive.evaluated → (VETOED stops here)
 *   → execution.completed → ltg.evaluated
 *
 * Swap this class with a real alive-runtime bridge in server.ts
 * when the runtime HTTP/WS API is ready.
 */

type Emitter = (event: Record<string, unknown>) => void;

interface RuntimeStatus {
  running:      boolean;
  mode:         string;
  profile:      string;
  signal_count: number;
  error_count:  number;
  last_signal?: string;
  uptime_ms:    number;
  last_stg_verdict?: string;
}

export class MockRuntime {
  private running      = false;
  private profile      = 'default';
  private startTime    = 0;
  private signalCount  = 0;
  private errorCount   = 0;
  private lastSignal   = '';
  private lastVerdict  = '';
  private statusTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private emit: Emitter) {}

  // ─── Command handler ─────────────────────────────────────────────────────

  handleCommand(cmd: Record<string, unknown>): void {
    switch (cmd.type) {
      case 'start':          this.start(String(cmd.profile ?? 'default')); break;
      case 'stop':           this.stop();                                   break;
      case 'inject_signal':  this.runPipeline(String(cmd.payload ?? '')); break;
      case 'request_status': this.pushStatus();                            break;
      default:
        console.warn(`[Mock] Unknown command: ${cmd.type}`);
    }
  }

  dispose(): void {
    if (this.statusTimer) clearInterval(this.statusTimer);
  }

  // ─── Start / Stop ─────────────────────────────────────────────────────────

  private start(profile: string): void {
    if (this.running) return;
    this.running   = true;
    this.profile   = profile;
    this.startTime = Date.now();
    this.signalCount = 0;
    this.errorCount  = 0;
    console.log(`[Mock] Runtime started (profile: ${profile})`);
    this.emit({ type: 'runtime.started', profile, timestamp: Date.now() });
    // Periodic status push so panels stay live
    this.statusTimer = setInterval(() => this.pushStatus(), 2000);
  }

  private stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.statusTimer) { clearInterval(this.statusTimer); this.statusTimer = null; }
    console.log('[Mock] Runtime stopped');
    this.emit({ type: 'runtime.stopped', timestamp: Date.now() });
    this.pushStatus();
  }

  // ─── Pipeline simulation ──────────────────────────────────────────────────

  private async runPipeline(payload: string): Promise<void> {
    if (!this.running) {
      this.emit({ type: 'runtime.error', error: 'Runtime not running', stage: 'ingestion' });
      return;
    }

    const signal_id = this.newId();
    this.signalCount++;
    this.lastSignal = signal_id;

    console.log(`[Mock] Pipeline: ${signal_id} — "${payload}"`);

    // ① Ingestion
    this.emit({ type: 'signal.received', signal_id, raw_content: payload, timestamp: Date.now() });
    await this.delay(40);

    // ② Filtering — reject obviously empty/malformed
    const passed = payload.trim().length > 0;
    this.emit({ type: 'signal.filtered', signal_id, passed });
    if (!passed) {
      this.emit({ type: 'pipeline.terminated', signal_id, reason: 'Empty payload', stage: 'filter' });
      this.pushStatus();
      return;
    }
    await this.delay(40);

    // ③ Firewall
    const firewallBlocked = payload.toLowerCase().includes('__inject__');
    this.emit({
      type: 'firewall.checked',
      signal_id,
      status: firewallBlocked ? 'blocked' : 'cleared',
      ...(firewallBlocked ? { reason: 'Pattern match: __inject__' } : {}),
    });
    if (firewallBlocked) {
      this.emit({ type: 'pipeline.terminated', signal_id, reason: 'Firewall block', stage: 'firewall' });
      this.pushStatus();
      return;
    }
    await this.delay(60);

    // ④ Comparison Baseline
    const novelty    = this.clamp(0.3 + Math.random() * 0.6 - (payload.includes('repeated') ? 0.4 : 0), 0, 1);
    const recurrence = this.clamp(1 - novelty + Math.random() * 0.2, 0, 1);
    this.emit({ type: 'cb.evaluated', signal_id, novelty: +novelty.toFixed(3), recurrence: +recurrence.toFixed(3) });
    await this.delay(80);

    // ⑤ STG — Stop-Thinking Gate
    const verdict = this.evaluateSTG(payload, novelty);
    this.lastVerdict = verdict;
    this.emit({ type: 'stg.evaluated', signal_id, verdict });
    await this.delay(60);

    if (verdict === 'DENY') {
      this.emit({ type: 'pipeline.terminated', signal_id, reason: 'STG DENY', stage: 'stg' });
      this.pushStatus();
      return;
    }
    if (verdict === 'DEFER') {
      this.emit({ type: 'pipeline.terminated', signal_id, reason: 'STG DEFER — queued', stage: 'stg' });
      this.pushStatus();
      return;
    }

    // ⑥ Mind — cognitive processing
    this.emit({ type: 'mind.started', signal_id });
    await this.delay(220); // mind takes the most time

    const decision = this.generateDecision(payload);
    this.emit({ type: 'mind.completed', signal_id, ...decision });
    await this.delay(80);

    // ⑦ Executive — authorization gate
    const vetoed = payload.toLowerCase().includes('unauthorized');
    this.emit({
      type: 'executive.evaluated',
      signal_id,
      verdict:  vetoed ? 'VETOED' : 'AUTHORIZED',
      ...(vetoed ? { reason: 'Action exceeds authorization bounds' } : {}),
    });
    await this.delay(60);

    if (vetoed) {
      this.emit({ type: 'pipeline.terminated', signal_id, reason: 'Executive VETO', stage: 'executive' });
      this.pushStatus();
      return;
    }

    // ⑧ Body execution
    const result = this.executeAction(decision.action_type, payload);
    this.emit({ type: 'execution.completed', signal_id, action_type: decision.action_type, result });
    await this.delay(60);

    // ⑨ Long-Term Gate
    const ltgResult: 'PROMOTE' | 'DEFER' | 'DISCARD' =
      novelty > 0.7 ? 'PROMOTE' : novelty < 0.25 ? 'DISCARD' : 'DEFER';
    this.emit({ type: 'ltg.evaluated', signal_id, result: ltgResult });

    this.pushStatus();
    console.log(`[Mock] Pipeline complete: ${signal_id}`);
  }

  // ─── Decision logic ───────────────────────────────────────────────────────

  private evaluateSTG(payload: string, novelty: number): 'OPEN' | 'DEFER' | 'DENY' {
    const p = payload.toLowerCase();
    if (p.includes('deny') || p.includes('banned') || p.includes('block')) return 'DENY';
    if (p.includes('defer') || p.includes('later') || p.includes('queue')) return 'DEFER';
    if (novelty < 0.1) return 'DEFER'; // too routine
    return 'OPEN';
  }

  private generateDecision(payload: string): { decision_id: string; action_type: string; confidence: number } {
    const p = payload.toLowerCase();
    let action_type = 'process.signal';
    if (p.includes('cpu'))    action_type = 'system.optimize_cpu';
    if (p.includes('disk'))   action_type = 'storage.cleanup';
    if (p.includes('memory')) action_type = 'memory.compact';
    if (p.includes('alert'))  action_type = 'alert.acknowledge';
    if (p.includes('status')) action_type = 'status.report';
    if (p.includes('hello'))  action_type = 'social.greet';

    return {
      decision_id: `dec-${Date.now().toString(36)}`,
      action_type,
      confidence:  +( 0.65 + Math.random() * 0.30 ).toFixed(3),
    };
  }

  private executeAction(action_type: string, _payload: string): string {
    const results: Record<string, string> = {
      'system.optimize_cpu':  'CPU governor adjusted',
      'storage.cleanup':      'Temp files cleared (42 MB)',
      'memory.compact':       'Memory compacted',
      'alert.acknowledge':    'Alert acknowledged and logged',
      'status.report':        'Status report generated',
      'social.greet':         'Hello acknowledged',
      'process.signal':       'Signal processed',
    };
    return results[action_type] ?? 'Action completed';
  }

  // ─── Status ───────────────────────────────────────────────────────────────

  private pushStatus(): void {
    const status: RuntimeStatus = {
      running:      this.running,
      mode:         this.running ? 'active' : 'idle',
      profile:      this.profile,
      signal_count: this.signalCount,
      error_count:  this.errorCount,
      last_signal:  this.lastSignal,
      uptime_ms:    this.running ? Date.now() - this.startTime : 0,
      last_stg_verdict: this.lastVerdict || undefined,
    };
    this.emit({ type: 'status.update', status });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private newId(): string {
    return `sig-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }
}
