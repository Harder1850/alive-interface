"use strict";
/**
 * ALIVE Logs Plugin
 * Display logs, errors, warnings from runtime
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logs = exports.LogsPlugin = void 0;
const runtime_client_1 = require("@alive-studio/runtime-client");
class LogsPlugin {
    constructor() {
        this.logsContainer = null;
        this.logs = [];
        this.maxLogs = 100;
    }
    async activate() {
        console.log('[LogsPlugin] Activated');
        this.createUI();
        this.attachListeners();
        this.captureConsoleLogs();
    }
    createUI() {
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
    attachListeners() {
        const filterSelect = document.getElementById('log-filter');
        const clearBtn = document.getElementById('btn-clear-logs');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.renderLogs());
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearLogs());
        }
        // Listen to runtime events
        runtime_client_1.runtimeClient.on('pipeline.event', (event) => {
            this.addLog(this.eventToLogMessage(event), 'info');
        });
        runtime_client_1.runtimeClient.on('runtime.error', (error) => {
            this.addLog(error.error, 'error');
        });
        runtime_client_1.runtimeClient.on('runtime.started', () => {
            this.addLog('ALIVE runtime started', 'info');
        });
        runtime_client_1.runtimeClient.on('runtime.stopped', () => {
            this.addLog('ALIVE runtime stopped', 'info');
        });
    }
    captureConsoleLogs() {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        console.log = (...args) => {
            const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
            if (message.includes('[RuntimeClient]') || message.includes('[Plugin]')) {
                this.addLog(message, 'info');
            }
            originalLog.apply(console, args);
        };
        console.warn = (...args) => {
            const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
            this.addLog(message, 'warning');
            originalWarn.apply(console, args);
        };
        console.error = (...args) => {
            const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
            this.addLog(message, 'error');
            originalError.apply(console, args);
        };
    }
    addLog(message, level = 'info') {
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
    renderLogs() {
        if (!this.logsContainer)
            return;
        const filterSelect = document.getElementById('log-filter');
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
    formatLogEntry(log) {
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
    eventToLogMessage(event) {
        switch (event.type) {
            case 'signal.received':
                return `[SIGNAL] Received: "${event.raw_content}"`;
            case 'stg.evaluated':
                return `[STG] Verdict: ${event.verdict}`;
            case 'mind.completed':
                return `[MIND] Decision: ${event.decision_id?.substring(0, 8)}...`;
            case 'execution.completed':
                return `[EXEC] Action: ${event.action_type} → "${event.result}"`;
            case 'pipeline.error':
                return `[ERROR] ${event.stage}: ${event.error}`;
            default:
                return `[${event.type}] ${JSON.stringify(event).substring(0, 50)}...`;
        }
    }
    clearLogs() {
        this.logs = [];
        this.renderLogs();
    }
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}
exports.LogsPlugin = LogsPlugin;
exports.logs = new LogsPlugin();
//# sourceMappingURL=index.js.map