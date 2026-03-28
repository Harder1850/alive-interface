/**
 * ALIVE Studio — Trace Plugin
 *
 * Purpose: Show the ordered signal trace grouped by signal_id.
 *          Expandable cards, newest first, shows every pipeline stage.
 */

import { runtimeClient } from '@alive-studio/runtime-client';
import type { TraceEntry, RuntimeEvent } from '@alive-studio/shared-types';

// Stage labels in pipeline order
const STAGE_LABELS: Partial<Record<RuntimeEvent['type'], string>> = {
  'signal.received':     '① Ingested',
  'signal.filtered':     '② Filtered',
  'firewall.checked':    '③ Firewall',
  'cb.evaluated':        '④ CB',
  'stg.evaluated':       '⑤ STG',
  'mind.started':        '⑥ Mind start',
  'mind.completed':      '⑦ Mind done',
  'executive.evaluated': '⑧ Executive',
  'execution.completed': '⑨ Executed',
  'ltg.evaluated':       '⑩ LTG',
  'pipeline.terminated': '✕ Terminated',
  'pipeline.error':      '✕ Error',
};

export class TracePlugin {
  private root:   HTMLElement | null = null;
  private traces: Map<string, TraceEntry> = new Map();

  mount(root: HTMLElement): void {
    this.root = root;
    this.render();
    this.bind();
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  private render(): void {
    if (!this.root) return;
    this.root.innerHTML = `
      <div class="tp-wrap">
        <div class="tp-toolbar">
          <span class="tp-title">Signal Trace</span>
          <button class="tp-clear-btn" data-id="clear">Clear</button>
        </div>
        <div class="tp-list" data-id="list">
          <div class="tp-empty">Waiting for signals…</div>
        </div>
      </div>
    `;
  }

  // ─── Bind ─────────────────────────────────────────────────────────────────

  private bind(): void {
    const clearBtn = this.root?.querySelector('[data-id="clear"]');
    clearBtn?.addEventListener('click', () =>
      runtimeClient.executeCommand({ type: 'clear_trace' }));

    runtimeClient.on('trace.updated',  (t) => { const te = t as TraceEntry; this.traces.set(te.signal_id, te); this.renderList(); });
    runtimeClient.on('trace.cleared',  ()  => { this.traces.clear(); this.renderList(); });

    // Real-time partial trace: update as events come in
    runtimeClient.on('pipeline.event', (ev) => {
      const e = ev as RuntimeEvent;
      if (!('signal_id' in e) || !e.signal_id) return;
      let trace = this.traces.get(e.signal_id);
      if (!trace && e.type === 'signal.received') {
        trace = {
          signal_id:   e.signal_id,
          raw_content: e.raw_content,
          timestamp:   e.timestamp,
          events:      [],
        };
        this.traces.set(e.signal_id, trace);
      }
      if (trace && !trace.events.find(x => JSON.stringify(x) === JSON.stringify(e))) {
        trace.events.push(e);
      }
      this.renderList();
    });
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  private renderList(): void {
    const list = this.root?.querySelector('[data-id="list"]');
    if (!list) return;

    if (this.traces.size === 0) {
      list.innerHTML = '<div class="tp-empty">Waiting for signals…</div>';
      return;
    }

    const sorted = Array.from(this.traces.values())
      .sort((a, b) => b.timestamp - a.timestamp);

    list.innerHTML = sorted.map(t => this.renderCard(t)).join('');

    // Wire expand/collapse
    list.querySelectorAll('.tp-card-head').forEach(head => {
      head.addEventListener('click', () => {
        const body = (head as HTMLElement).nextElementSibling;
        if (body) body.classList.toggle('open');
        (head as HTMLElement).querySelector('.tp-chevron')!.textContent =
          body?.classList.contains('open') ? '▾' : '▸';
      });
    });
  }

  private renderCard(t: TraceEntry): string {
    const isError    = t.final_result === 'pipeline.error';
    const isTerminated = t.final_result === 'pipeline.terminated';
    const isDone     = !!t.final_result;
    const statusCls  = isError || isTerminated ? 'card-error' : isDone ? 'card-done' : 'card-live';
    const label      = t.raw_content.length > 32 ? t.raw_content.slice(0, 32) + '…' : t.raw_content;
    const time       = new Date(t.timestamp).toLocaleTimeString();

    return `
      <div class="tp-card ${statusCls}">
        <div class="tp-card-head">
          <span class="tp-chevron">▸</span>
          <span class="tp-card-label">"${this.esc(label)}"</span>
          <span class="tp-card-meta">${t.events.length} stages · ${time}</span>
        </div>
        <div class="tp-card-body">
          ${t.events.map(e => this.renderStage(e)).join('')}
          ${!isDone ? '<div class="tp-stage tp-stage-live">⟳ Processing…</div>' : ''}
        </div>
      </div>
    `;
  }

  private renderStage(e: RuntimeEvent): string {
    const label  = STAGE_LABELS[e.type] ?? e.type;
    const detail = this.stageDetail(e);
    const cls    = e.type === 'pipeline.error' || e.type === 'pipeline.terminated'
      ? 'tp-stage tp-stage-fail'
      : e.type === 'execution.completed' || e.type === 'ltg.evaluated'
        ? 'tp-stage tp-stage-ok'
        : 'tp-stage';

    return `<div class="${cls}"><span class="tp-stage-name">${label}</span><span class="tp-stage-detail">${this.esc(detail)}</span></div>`;
  }

  private stageDetail(e: RuntimeEvent): string {
    switch (e.type) {
      case 'signal.filtered':     return e.passed ? 'passed' : 'dropped';
      case 'firewall.checked':    return e.status + (e.reason ? ` — ${e.reason}` : '');
      case 'cb.evaluated':        return `novelty=${e.novelty.toFixed(2)} recurrence=${e.recurrence.toFixed(2)}`;
      case 'stg.evaluated':       return e.verdict;
      case 'mind.completed':      return `${e.action_type} (conf ${(e.confidence * 100).toFixed(0)}%)`;
      case 'executive.evaluated': return e.verdict + (e.reason ? ` — ${e.reason}` : '');
      case 'execution.completed': return `${e.action_type} → "${e.result}"`;
      case 'ltg.evaluated':       return e.result;
      case 'pipeline.terminated': return `${e.stage}: ${e.reason}`;
      case 'pipeline.error':      return `${e.stage}: ${e.error}`;
      default:                    return '';
    }
  }

  private esc(s: string): string {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
}
