/**
 * ALIVE Studio — State Plugin
 *
 * Purpose: High-level view of runtime health and session state.
 *          Minimal and honest — shows placeholders when data is absent.
 */

import { runtimeClient } from '@alive-studio/runtime-client';
import type { RuntimeStatus, RuntimeEvent } from '@alive-studio/shared-types';

export class StatePlugin {
  private root: HTMLElement | null = null;

  mount(root: HTMLElement): void {
    this.root = root;
    this.render();
    this.bind();
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  private render(): void {
    if (!this.root) return;
    this.root.innerHTML = `
      <div class="stp-wrap">

        <div class="stp-section-title">Session</div>
        <div class="stp-grid">
          <div class="stp-card">
            <div class="stp-card-label">Runtime</div>
            <div class="stp-card-val stopped" data-id="runtime-status">● Stopped</div>
          </div>
          <div class="stp-card">
            <div class="stp-card-label">Profile</div>
            <div class="stp-card-val" data-id="profile">—</div>
          </div>
          <div class="stp-card">
            <div class="stp-card-label">Mode</div>
            <div class="stp-card-val" data-id="mode">idle</div>
          </div>
          <div class="stp-card">
            <div class="stp-card-label">Uptime</div>
            <div class="stp-card-val" data-id="uptime">—</div>
          </div>
        </div>

        <div class="stp-section-title" style="margin-top:18px">Pipeline</div>
        <div class="stp-grid">
          <div class="stp-card">
            <div class="stp-card-label">Signals</div>
            <div class="stp-card-val" data-id="signals">0</div>
          </div>
          <div class="stp-card">
            <div class="stp-card-label">Last STG</div>
            <div class="stp-card-val" data-id="last-stg">—</div>
          </div>
          <div class="stp-card">
            <div class="stp-card-label">Errors</div>
            <div class="stp-card-val" data-id="errors">0</div>
          </div>
          <div class="stp-card">
            <div class="stp-card-label">Last Signal</div>
            <div class="stp-card-val" data-id="last-signal">—</div>
          </div>
        </div>

        <div class="stp-section-title" style="margin-top:18px">Recent Pipeline Events</div>
        <div class="stp-event-feed" data-id="feed">
          <div class="stp-feed-empty">No events yet</div>
        </div>

      </div>
    `;
  }

  // ─── Bind ─────────────────────────────────────────────────────────────────

  private recentEvents: Array<{ type: string; label: string; ts: number }> = [];

  private bind(): void {
    runtimeClient.on('runtime.started', () => this.refresh());
    runtimeClient.on('runtime.stopped', () => this.refresh());
    runtimeClient.on('status.updated',  (s)  => this.displayStatus(s as RuntimeStatus));
    runtimeClient.on('pipeline.event',  (ev) => {
      this.refresh();
      this.addFeedEvent(ev as RuntimeEvent);
    });

    // Initial render
    this.refresh();
  }

  private refresh(): void {
    this.displayStatus(runtimeClient.getStatus());
  }

  private displayStatus(s: RuntimeStatus): void {
    const set = (id: string, v: string, cls?: string) => {
      const el = this.root?.querySelector<HTMLElement>(`[data-id="${id}"]`);
      if (!el) return;
      el.textContent = v;
      if (cls !== undefined) el.className = `stp-card-val ${cls}`;
    };

    set('runtime-status',
      s.running ? '● Running' : '● Stopped',
      s.running ? 'running'   : 'stopped');
    set('profile',     s.profile ?? '—');
    set('mode',        s.mode    ?? 'idle');
    set('uptime',      s.running ? `${(s.uptime_ms / 1000).toFixed(1)} s` : '—');
    set('signals',     String(s.signal_count));
    set('last-stg',    s.last_stg_verdict ?? '—',
      s.last_stg_verdict ? `stg-${s.last_stg_verdict.toLowerCase()}` : '');
    set('errors',      String(s.error_count));
    set('last-signal', s.last_signal ? s.last_signal.slice(0, 16) + '…' : '—');
  }

  private addFeedEvent(e: RuntimeEvent): void {
    const label = this.eventLabel(e);
    if (!label) return;

    this.recentEvents.unshift({ type: e.type, label, ts: Date.now() });
    if (this.recentEvents.length > 20) this.recentEvents.pop();

    const feed = this.root?.querySelector('[data-id="feed"]');
    if (!feed) return;

    feed.innerHTML = this.recentEvents.map(ev => {
      const cls = ev.type.includes('error') || ev.type.includes('terminated')
        ? 'stp-feed-entry err'
        : ev.type === 'execution.completed' || ev.type === 'ltg.evaluated'
          ? 'stp-feed-entry ok'
          : 'stp-feed-entry';
      const time = new Date(ev.ts).toLocaleTimeString('en', { hour12: false });
      return `<div class="${cls}"><span class="stp-feed-time">${time}</span><span class="stp-feed-label">${this.esc(ev.label)}</span></div>`;
    }).join('');
  }

  private eventLabel(e: RuntimeEvent): string {
    switch (e.type) {
      case 'signal.received':      return `Signal in: "${('raw_content' in e) ? (e as { raw_content: string }).raw_content : ''}"`;
      case 'stg.evaluated':        return `STG → ${'verdict' in e ? (e as { verdict: string }).verdict : ''}`;
      case 'mind.completed':       return `Mind → ${'action_type' in e ? (e as { action_type: string }).action_type : ''}`;
      case 'execution.completed':  return `Executed → "${'result' in e ? (e as { result: string }).result : ''}"`;
      case 'pipeline.terminated':  return `✕ Terminated @ ${'stage' in e ? (e as { stage: string }).stage : ''}`;
      case 'pipeline.error':       return `✕ Error @ ${'stage' in e ? (e as { stage: string }).stage : ''}`;
      case 'runtime.started':      return `Runtime started`;
      case 'runtime.stopped':      return `Runtime stopped`;
      default:                     return '';
    }
  }

  private esc(s: string): string {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
}
