/**
 * ALIVE Logs Plugin
 * Display logs, errors, warnings from runtime
 */

import { runtimeClient } from '@alive-studio/runtime-client';
import type { RuntimeEvent } from '@alive-studio/shared-types';

export class LogsPlugin {
  private logsContainer: HTMLElement | null = null;
  private logs: Array<{ timestamp: number; level: string; message: string }> = [];
  private maxLogs = 100;

  public async activate(): Promise<void> {
    console.log('[LogsPlugin] Activated');
    this.createUI();
    this.attachListeners();
    this.captureConsoleLogs();
  }

  private createUI(): void {
    const container = document.createElement('div');
    container.id = 'alive-logs';
    container.innerHTML = `
      <div class="logs-panel">
        <div class="logs-header">
          <h2>📄 Logs</h2>
          <div class="log-controls">
            <select id="log-filter" class="log-filter">
              <option value="">All</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
            <button id="btn-clear-logs" class="btn-clear">Clear</button>
          </div>
        </div>

        <div id="logs-list" class="logs-list">
          <p class="logs-empty">Waiting for logs...</p>
        </div>

        <style>
          #alive-logs {
            padding: 0;
            font-family: 'Consolas', 'Courier New', monospace;
            background: #1e1e1e;
            color: #d4d4d4;
            display: flex;
            flex-direction: column;
            height: 100%;
          }

          .logs-panel {
            display: flex;
            flex-direction: column;
            height: 100%;
          }

          .logs-header {
            padding: 15px 20px;
            background: #2d2d30;
            border-bottom: 1px solid #3e3e42;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .logs-header h2 {
            margin: 0;
            color: #4ec9b0;
          }

          .log-controls {
            display: flex;
            gap: 10px;
            align-items: center;
          }

          .log-filter {
            padding: 6px 10px;
            background: #1e1e1e;
            border: 1px solid #464647;
            border-radius: 4px;
            color: #d4d4d4;
            font-family: monospace;
            font-size: 12px;
            cursor: pointer;
          }

          .log-filter:focus {
            outline: none;
            border-color: #4ec9b0;
          }

          .btn-clear {
            padding: 6px 12px;
            background: #3e3e42;
            border: 1px solid #464647;
            border-radius: 4px;
            color: #d4d4d4;
            cursor: pointer;
            font-size: 12px;
          }

          .btn-clear:hover {
            background: #464647;
          }

          .logs-list {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            font-size: 12px;
          }

          .logs-empty {
            color: #858585;
            text-align: center;
            padding: 30px;
            margin: 0;
          }

          .log-entry {
            margin-bottom: 2px;
            padding: 4px 8px;
            border-left: 3px solid transparent;
            word-break: break-all;
          }

          .log-entry.info {
            border-left-color: #4ec9b0;
            color: #4ec9b0;
          }

          .log-entry.warning {
            border-left-color: #dcdcaa;
            color: #dcdcaa;
          }

          .log-entry.error {
            border-left-color: #f48771;
            color: #f48771;
          }

          .log-time {
            color: #858585;
            margin-right: 10px;
            font-size: 11px;
          }

          .log-level {
            font-weight: bold;
            margin-right: 8px;
            min-width: 10px;
          }

          .log-message {
            flex: 1;
          }
        </style>
      </div>
    `;

    document.body.appendChild(container);
    this.logsContainer = document.getElementById('logs-list');
  }

  private attachListeners(): void {
    const filterSelect = document.getElementById('log-filter') as HTMLSelectElement;
    const clearBtn = document.getElementById('btn-clear-logs');

    if (filterSelect) {
      filterSelect.addEventListener('change', () => this.renderLogs());
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearLogs());
    }

    // Listen to runtime events
    runtimeClient.on('pipeline.event', (event: RuntimeEvent) => {
      this.addLog(this.eventToLogMessage(event), 'info');
    });

    runtimeClient.on('runtime.error', (error) => {
      this.addLog((error as any).error, 'error');
    });

    runtimeClient.on('runtime.started', () => {
      this.addLog('ALIVE runtime started', 'info');
    });

    runtimeClient.on('runtime.stopped', () => {
      this.addLog('ALIVE runtime stopped', 'info');
    });
  }

  private captureConsoleLogs(): void {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'string' ? arg : JSON.stringify(arg)
      ).join(' ');
      
      if (message.includes('[RuntimeClient]') || message.includes('[Plugin]')) {
        this.addLog(message, 'info');
      }
      originalLog.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'string' ? arg : JSON.stringify(arg)
      ).join(' ');
      this.addLog(message, 'warning');
      originalWarn.apply(console, args);
    };

    console.error = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'string' ? arg : JSON.stringify(arg)
      ).join(' ');
      this.addLog(message, 'error');
      originalError.apply(console, args);
    };
  }

  private addLog(message: string, level: string = 'info'): void {
    this.logs.push({
      timestamp: Date.now(),
      level,
      message,
    });

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    this.renderLogs();
  }

  private renderLogs(): void {
    if (!this.logsContainer) return;

    const filterSelect = document.getElementById('log-filter') as HTMLSelectElement;
    const filter = filterSelect?.value || '';

    const visibleLogs = filter
      ? this.logs.filter(log => log.level === filter)
      : this.logs;

    if (visibleLogs.length === 0) {
      this.logsContainer.innerHTML = '<p class="logs-empty">No logs</p>';
      return;
    }

    this.logsContainer.innerHTML = visibleLogs
      .map(log => this.formatLogEntry(log))
      .join('');

    // Auto-scroll to bottom
    this.logsContainer.scrollTop = this.logsContainer.scrollHeight;
  }

  private formatLogEntry(log: { timestamp: number; level: string; message: string }): string {
    const time = new Date(log.timestamp).toLocaleTimeString();
    const levelStr = log.level.charAt(0).toUpperCase();

    return `
      <div class="log-entry ${log.level}">
        <span class="log-time">${time}</span>
        <span class="log-level">[${levelStr}]</span>
        <span class="log-message">${this.escapeHtml(log.message)}</span>
      </div>
    `;
  }

  private eventToLogMessage(event: RuntimeEvent): string {
    switch (event.type) {
      case 'signal.received':
        return `[SIGNAL] Received: "${(event as any).raw_content}"`;
      case 'stg.evaluated':
        return `[STG] Verdict: ${(event as any).verdict}`;
      case 'mind.completed':
        return `[MIND] Decision: ${(event as any).decision_id?.substring(0, 8)}...`;
      case 'execution.completed':
        return `[EXEC] Action: ${(event as any).action_type} → "${(event as any).result}"`;
      case 'pipeline.error':
        return `[ERROR] ${(event as any).stage}: ${(event as any).error}`;
      default:
        return `[${event.type}] ${JSON.stringify(event).substring(0, 50)}...`;
    }
  }

  private clearLogs(): void {
    this.logs = [];
    this.renderLogs();
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

export const logs = new LogsPlugin();
