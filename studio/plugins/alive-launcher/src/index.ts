/**
 * ALIVE Studio — Launcher Plugin
 *
 * Purpose: Start/stop the ALIVE runtime, select a profile, show session state.
 * Boundary: all commands flow through runtimeClient only.
 */

import { runtimeClient } from '@alive-studio/runtime-client';
import type { RuntimeStatus } from '@alive-studio/shared-types';

export class LauncherPlugin {
  private root: HTMLElement | null = null;

  /** Called by app.ts — renders into the supplied container. */
  mount(root: HTMLElement): void {
    this.root = root;
    this.render();
    this.bind();
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  private render(): void {
    if (!this.root) return;
    this.root.innerHTML = `
      <div class="lp-wrap">

        <div class="lp-header">
          <span class="lp-title">ALIVE Launcher</span>
          <span class="lp-badge stopped" data-id="badge">● STOPPED</span>
        </div>

        <div class="lp-row">
          <label class="lp-label">Profile</label>
          <select class="lp-select" data-id="profile">
            <option value="default">default</option>
            <option value="debug">debug</option>
            <option value="conservative">conservative</option>
            <option value="aggressive">aggressive</option>
          </select>
        </div>

        <div class="lp-buttons">
          <button class="lp-btn lp-btn-start" data-id="start">▶ Start ALIVE</button>
          <button class="lp-btn lp-btn-stop"  data-id="stop"  disabled>⏹ Stop</button>
        </div>

        <div class="lp-stat-grid">
          <div class="lp-stat">
            <div class="lp-stat-label">Status</div>
            <div class="lp-stat-val" data-id="s-status">Stopped</div>
          </div>
          <div class="lp-stat">
            <div class="lp-stat-label">Uptime</div>
            <div class="lp-stat-val" data-id="s-uptime">—</div>
          </div>
          <div class="lp-stat">
            <div class="lp-stat-label">Signals</div>
            <div class="lp-stat-val" data-id="s-signals">0</div>
          </div>
          <div class="lp-stat">
            <div class="lp-stat-label">Mode</div>
            <div class="lp-stat-val" data-id="s-mode">—</div>
          </div>
          <div class="lp-stat">
            <div class="lp-stat-label">Last STG</div>
            <div class="lp-stat-val" data-id="s-stg">—</div>
          </div>
          <div class="lp-stat">
            <div class="lp-stat-label">Errors</div>
            <div class="lp-stat-val" data-id="s-errors">0</div>
          </div>
        </div>

        <div class="lp-conn" data-id="conn">◌ Connecting to studio server…</div>

      </div>
    `;
  }

  // ─── Bind ─────────────────────────────────────────────────────────────────

  private bind(): void {
    const q = <T extends HTMLElement>(id: string) =>
      this.root!.querySelector<T>(`[data-id="${id}"]`);

    const startBtn  = q<HTMLButtonElement>('start')!;
    const stopBtn   = q<HTMLButtonElement>('stop')!;
    const profile   = q<HTMLSelectElement>('profile')!;

    startBtn.addEventListener('click', () =>
      runtimeClient.executeCommand({ type: 'start', profile: profile.value }));

    stopBtn.addEventListener('click', () =>
      runtimeClient.executeCommand({ type: 'stop' }));

    // Connection state
    runtimeClient.on('client.connected', () => {
      const el = q('conn');
      if (el) { el.textContent = '◉ Connected to studio server'; el.className = 'lp-conn connected'; }
    });
    runtimeClient.on('client.disconnected', () => {
      const el = q('conn');
      if (el) { el.textContent = '◌ Reconnecting…'; el.className = 'lp-conn'; }
    });

    // Runtime lifecycle
    const setRunning = (running: boolean) => {
      startBtn.disabled = running;
      stopBtn.disabled  = !running;
      const badge = q('badge');
      if (badge) {
        badge.textContent = running ? '● RUNNING' : '● STOPPED';
        badge.className   = `lp-badge ${running ? 'running' : 'stopped'}`;
      }
    };

    runtimeClient.on('runtime.started', () => { setRunning(true);  this.refresh(); });
    runtimeClient.on('runtime.stopped', () => { setRunning(false); this.refresh(); });
    runtimeClient.on('status.updated',  (s)  => this.displayStatus(s as RuntimeStatus));
    runtimeClient.on('pipeline.event',  ()   => this.refresh());

    runtimeClient.on('stg.evaluated', (e: unknown) => {
      const ev = e as { verdict: string };
      const el = q('s-stg');
      if (el) {
        el.textContent = ev.verdict;
        el.className   = `lp-stat-val stg-${ev.verdict.toLowerCase()}`;
      }
    });
  }

  private refresh():                         void { this.displayStatus(runtimeClient.getStatus()); }
  private displayStatus(s: RuntimeStatus):   void {
    const q = <T extends HTMLElement>(id: string) =>
      this.root?.querySelector<T>(`[data-id="${id}"]`);
    const set = (id: string, v: string) => { const el = q(id); if (el) el.textContent = v; };

    set('s-status',  s.running ? 'Running' : 'Stopped');
    set('s-uptime',  s.running ? `${(s.uptime_ms / 1000).toFixed(1)} s` : '—');
    set('s-signals', String(s.signal_count));
    set('s-mode',    s.mode ?? '—');
    set('s-errors',  String(s.error_count));

    const badge = q('badge');
    if (badge) {
      badge.textContent = s.running ? '● RUNNING' : '● STOPPED';
      badge.className   = `lp-badge ${s.running ? 'running' : 'stopped'}`;
    }
  }
}
