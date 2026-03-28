/**
 * ALIVE Studio — Logs Plugin
 *
 * Purpose: Show all runtime logs, warnings, and errors in one panel.
 *          Captures both pipeline events and console output.
 */

import { runtimeClient } from '@alive-studio/runtime-client';
import type { RuntimeEvent } from '@alive-studio/shared-types';

type Level = 'info' | 'warn' | 'error';

interface LogEntry {
  ts:      number;
  level:   Level;
  source:  string;
  message: string;
}

export class LogsPlugin {
  private root:    HTMLElement | null = null;
  private logs:    LogEntry[]         = [];
  private maxLogs  = 500;
  private filter:  Level | '' = '';

  mount(root: HTMLElement): void {
    this.root = root;
    this.render();
    this.bind();
    this.interceptConsole();
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  private render(): void {
    if (!this.root) return;
    this.root.innerHTML = `
      <div class="logp-wrap">
        <div class="logp-toolbar">
          <span class="logp-title">Logs</span>
          <div class="logp-controls">
            <select class="logp-filter" data-id="filter">
              <option value="">All</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
            <button class="logp-clear-btn" data-id="clear">Clear</button>
          </div>
        </div>
        <div class="logp-list" data-id="list">
          <div class="logp-empty">Waiting for logs…</div>
        </div>
      </div>
    `;
  }

  // ─── Bind ─────────────────────────────────────────────────────────────────

  private bind(): void {
    const filterSel = this.root?.querySelector<HTMLSelectElement>('[data-id="filter"]');
    const clearBtn  = this.root?.querySelector('[data-id="clear"]');

    filterSel?.addEventListener('change', () => {
      this.filter = (filterSel.value as Level | '');
      this.renderList();
    });
    clearBtn?.addEventListener('click', () => { this.logs = []; this.renderList(); });

    // Pipeline events
    runtimeClient.on('pipeline.event', (ev: unknown) => {
      const e = ev as RuntimeEvent;
      const msg = this.eventToMessage(e);
      if (msg) {
        const level: Level = e.type.includes('error') || e.type.includes('terminated') ? 'error' : 'info';
        this.push(level, 'pipeline', msg);
      }
    });

    runtimeClient.on('runtime.error', (ev: unknown) => {
      const e = ev as { error: string; stage: string };
      this.push('error', 'runtime', `[${e.stage}] ${e.error}`);
    });

    runtimeClient.on('runtime.started', (ev: unknown) => {
      const e = ev as { profile: string };
      this.push('info', 'runtime', `Started (profile: ${e.profile})`);
    });
    runtimeClient.on('runtime.stopped', () =>
      this.push('info', 'runtime', 'Stopped'));

    runtimeClient.on('client.connected',    () => this.push('info', 'studio', 'Connected to studio server'));
    runtimeClient.on('client.disconnected', () => this.push('warn', 'studio', 'Disconnected — reconnecting'));
  }

  private interceptConsole(): void {
    const orig = { log: console.log, warn: console.warn, error: console.error };

    console.log = (...args: unknown[]) => {
      orig.log.apply(console, args);
      const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
      if (msg.includes('[RuntimeClient]') || msg.includes('[Studio]') || msg.includes('[Mock]')) {
        this.push('info', 'console', msg);
      }
    };
    console.warn = (...args: unknown[]) => {
      orig.warn.apply(console, args);
      this.push('warn', 'console', args.map(a => String(a)).join(' '));
    };
    console.error = (...args: unknown[]) => {
      orig.error.apply(console, args);
      this.push('error', 'console', args.map(a => String(a)).join(' '));
    };
  }

  // ─── Log management ───────────────────────────────────────────────────────

  private push(level: Level, source: string, message: string): void {
    this.logs.push({ ts: Date.now(), level, source, message });
    if (this.logs.length > this.maxLogs) this.logs.shift();
    this.renderList();
  }

  private renderList(): void {
    const list = this.root?.querySelector('[data-id="list"]');
    if (!list) return;

    const visible = this.filter
      ? this.logs.filter(l => l.level === this.filter)
      : this.logs;

    if (visible.length === 0) {
      list.innerHTML = '<div class="logp-empty">No logs</div>';
      return;
    }

    list.innerHTML = visible.map(l => this.renderEntry(l)).join('');
    // auto-scroll to bottom
    (list as HTMLElement).scrollTop = (list as HTMLElement).scrollHeight;
  }

  private renderEntry(l: LogEntry): string {
    const time = new Date(l.ts).toLocaleTimeString('en', { hour12: false });
    const icon = l.level === 'error' ? '✕' : l.level === 'warn' ? '⚠' : '·';
    return `<div class="logp-entry ${l.level}">
      <span class="logp-time">${time}</span>
      <span class="logp-icon">${icon}</span>
      <span class="logp-src">[${l.source}]</span>
      <span class="logp-msg">${this.esc(l.message)}</span>
    </div>`;
  }

  private eventToMessage(e: RuntimeEvent): string {
    switch (e.type) {
      case 'signal.received':     return `Signal received: "${('raw_content' in e ? (e as { raw_content: string }).raw_content : '')}"`;
      case 'signal.filtered':     return `Filter: ${'passed' in e && (e as { passed: boolean }).passed ? 'passed' : 'dropped'}`;
      case 'firewall.checked':    return `Firewall: ${'status' in e ? (e as { status: string }).status : ''}`;
      case 'stg.evaluated':       return `STG verdict: ${'verdict' in e ? (e as { verdict: string }).verdict : ''}`;
      case 'mind.completed':      return `Mind: ${'action_type' in e ? (e as { action_type: string }).action_type : ''} (conf ${'confidence' in e ? ((e as { confidence: number }).confidence * 100).toFixed(0) : '?'}%)`;
      case 'executive.evaluated': return `Executive: ${'verdict' in e ? (e as { verdict: string }).verdict : ''}`;
      case 'execution.completed': return `Executed: ${'action_type' in e ? (e as { action_type: string }).action_type : ''} → "${'result' in e ? (e as { result: string }).result : ''}"`;
      case 'ltg.evaluated':       return `LTG: ${'result' in e ? (e as { result: string }).result : ''}`;
      case 'pipeline.terminated': return `Pipeline terminated @ ${'stage' in e ? (e as { stage: string }).stage : ''}: ${'reason' in e ? (e as { reason: string }).reason : ''}`;
      case 'pipeline.error':      return `Pipeline error @ ${'stage' in e ? (e as { stage: string }).stage : ''}: ${'error' in e ? (e as { error: string }).error : ''}`;
      default: return '';
    }
  }

  private esc(s: string): string {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
}
