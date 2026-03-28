"use strict";
/**
 * ALIVE Trace Plugin
 * Displays ordered trace of events grouped by signal_id
 * WIRED TO: Real pipeline output from alive-runtime/src/wiring/pipeline.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.trace = exports.TracePlugin = void 0;
const runtime_client_1 = require("@alive-studio/runtime-client");
class TracePlugin {
    constructor() {
        this.traceContainer = null;
        this.traces = new Map();
    }
    async activate() {
        console.log('[TracePlugin] Activated');
        this.createUI();
        this.attachListeners();
    }
    createUI() {
        const container = document.createElement('div');
        container.id = 'alive-trace';
        container.innerHTML = `
      <div class="trace-panel">
        <div class="trace-header">
          <h2>📋 Signal Trace</h2>
          <button id="btn-clear-trace" class="btn-clear">Clear Trace</button>
        </div>
        
        <div id="trace-list" class="trace-list">
          <p class="trace-empty">Waiting for signals...</p>
        </div>

        <style>
          #alive-trace {
            padding: 20px;
            font-family: 'Fira Code', monospace;
            background: #1e1e1e;
            color: #d4d4d4;
            overflow-y: auto;
            height: 100%;
          }

          .trace-panel {
            display: flex;
            flex-direction: column;
            height: 100%;
          }

          .trace-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            border-bottom: 1px solid #404040;
            padding-bottom: 10px;
          }

          .trace-header h2 {
            margin: 0;
            color: #4ec9b0;
          }

          .btn-clear {
            padding: 6px 12px;
            background: #3e3e42;
            color: #d4d4d4;
            border: 1px solid #464647;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          }

          .btn-clear:hover {
            background: #464647;
          }

          .trace-list {
            flex: 1;
            overflow-y: auto;
          }

          .trace-empty {
            color: #858585;
            text-align: center;
            padding: 30px;
          }

          .trace-entry {
            margin-bottom: 12px;
            border: 1px solid #3e3e42;
            border-radius: 4px;
            background: #252525;
            overflow: hidden;
          }

          .trace-entry-header {
            background: #2d2d30;
            padding: 10px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #3e3e42;
          }

          .trace-entry-header:hover {
            background: #333333;
          }

          .trace-entry-id {
            font-weight: bold;
            color: #4ec9b0;
            flex: 1;
          }

          .trace-entry-meta {
            font-size: 11px;
            color: #858585;
            margin-left: 10px;
          }

          .trace-entry-content {
            display: none;
            padding: 10px;
            max-height: 200px;
            overflow-y: auto;
          }

          .trace-entry-content.expanded {
            display: block;
          }

          .trace-event {
            padding: 6px 8px;
            margin: 4px 0;
            background: #1e1e1e;
            border-left: 3px solid #4ec9b0;
            border-radius: 2px;
            font-size: 11px;
          }

          .trace-event.error {
            border-left-color: #f48771;
          }

          .trace-event.success {
            border-left-color: #6a9955;
          }

          .trace-event-type {
            color: #ce9178;
            font-weight: bold;
          }

          .trace-event-data {
            color: #9cdcfe;
            font-size: 10px;
            margin-top: 2px;
          }
        </style>
      </div>
    `;
        document.body.appendChild(container);
        this.traceContainer = document.getElementById('trace-list');
    }
    attachListeners() {
        const clearBtn = document.getElementById('btn-clear-trace');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearTrace());
        }
        // Listen to trace updates from runtime
        runtime_client_1.runtimeClient.on('trace.updated', (trace) => {
            this.traces.set(trace.signal_id, trace);
            this.renderTraces();
        });
        runtime_client_1.runtimeClient.on('trace.cleared', () => {
            this.traces.clear();
            this.renderTraces();
        });
        runtime_client_1.runtimeClient.on('pipeline.event', (event) => {
            // Update in real-time as events come in
            const currentSignalId = event.type === 'signal.received'
                ? event.signal_id
                : undefined;
            if (currentSignalId) {
                // Create placeholder trace for new signal
                const trace = {
                    signal_id: currentSignalId,
                    timestamp: Date.now(),
                    events: [event],
                };
                this.traces.set(currentSignalId, trace);
            }
            else {
                // Add event to existing trace
                for (const trace of this.traces.values()) {
                    if (trace.events[0]?.signal_id === event.signal_id) {
                        trace.events.push(event);
                        break;
                    }
                }
            }
            this.renderTraces();
        });
    }
    renderTraces() {
        if (!this.traceContainer)
            return;
        if (this.traces.size === 0) {
            this.traceContainer.innerHTML = '<p class="trace-empty">Waiting for signals...</p>';
            return;
        }
        const sortedTraces = Array.from(this.traces.values())
            .sort((a, b) => b.timestamp - a.timestamp);
        this.traceContainer.innerHTML = sortedTraces
            .map(trace => this.renderTraceEntry(trace))
            .join('');
        // Attach expand/collapse listeners
        document.querySelectorAll('.trace-entry-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const content = e.currentTarget.nextElementSibling;
                if (content) {
                    content.classList.toggle('expanded');
                }
            });
        });
    }
    renderTraceEntry(trace) {
        const eventCount = trace.events.length;
        const lastEvent = trace.events[trace.events.length - 1];
        const status = lastEvent?.type === 'pipeline.error' ? 'error' : 'success';
        return `
      <div class="trace-entry">
        <div class="trace-entry-header">
          <div class="trace-entry-id">Signal: ${trace.signal_id.substring(0, 12)}...</div>
          <div class="trace-entry-meta">${eventCount} events</div>
        </div>
        <div class="trace-entry-content">
          ${trace.events.map(event => this.renderEvent(event)).join('')}
        </div>
      </div>
    `;
    }
    renderEvent(event) {
        const statusClass = event.type === 'pipeline.error' ? 'error' : 'success';
        const data = this.extractEventData(event);
        return `
      <div class="trace-event ${statusClass}">
        <div class="trace-event-type">${event.type}</div>
        <div class="trace-event-data">${data}</div>
      </div>
    `;
    }
    extractEventData(event) {
        switch (event.type) {
            case 'stg.evaluated':
                return `verdict: ${event.verdict}`;
            case 'mind.completed':
                return `decision: ${event.decision_id?.substring(0, 8)}... confidence: ${event.confidence}`;
            case 'execution.completed':
                return `result: "${event.result}"`;
            case 'pipeline.error':
                return `error: ${event.error} @ ${event.stage}`;
            case 'signal.received':
                return `payload: "${event.raw_content}"`;
            default:
                return JSON.stringify(event).substring(0, 60) + '...';
        }
    }
    clearTrace() {
        runtime_client_1.runtimeClient.executeCommand({ type: 'clear_trace' });
    }
}
exports.TracePlugin = TracePlugin;
exports.trace = new TracePlugin();
//# sourceMappingURL=index.js.map