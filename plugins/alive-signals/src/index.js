"use strict";
/**
 * ALIVE Signals Plugin
 * Inject test signals, choose predefined scenarios
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.signals = exports.SignalsPlugin = void 0;
const runtime_client_1 = require("@alive-studio/runtime-client");
class SignalsPlugin {
    async activate() {
        console.log('[SignalsPlugin] Activated');
        this.createUI();
        this.attachListeners();
    }
    createUI() {
        const container = document.createElement('div');
        container.id = 'alive-signals';
        container.innerHTML = `
      <div class="signals-panel">
        <h2>⚡ Signal Injection</h2>

        <div class="section">
          <h3>Predefined Scenarios</h3>
          <div class="scenario-buttons">
            <button class="scenario-btn" data-payload="hello?">🧪 Query: "hello?"</button>
            <button class="scenario-btn" data-payload="system alert">⚠️ Alert: System</button>
            <button class="scenario-btn" data-payload="status check">📊 Query: Status</button>
            <button class="scenario-btn" data-payload="cpu spike">🔥 CPU Spike</button>
            <button class="scenario-btn" data-payload="memory low">💾 Memory Low</button>
            <button class="scenario-btn" data-payload="disk full">💿 Disk Full</button>
          </div>
        </div>

        <div class="section">
          <h3>Custom Signal</h3>
          <div class="input-group">
            <input 
              id="custom-signal-input" 
              type="text" 
              placeholder="Enter custom signal payload..."
              class="signal-input"
            />
            <button id="btn-inject-custom" class="btn btn-primary">Inject</button>
          </div>
        </div>

        <div id="injection-status" class="injection-status"></div>

        <style>
          #alive-signals {
            padding: 20px;
            font-family: 'Fira Code', monospace;
            background: #1e1e1e;
            color: #d4d4d4;
          }

          #alive-signals h2 {
            margin-top: 0;
            color: #4ec9b0;
          }

          .section {
            margin: 20px 0;
            padding-bottom: 20px;
            border-bottom: 1px solid #3e3e42;
          }

          .section:last-child {
            border-bottom: none;
          }

          .section h3 {
            margin: 0 0 12px 0;
            color: #ce9178;
            font-size: 13px;
          }

          .scenario-buttons {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .scenario-btn {
            padding: 10px 12px;
            background: #2d2d30;
            border: 1px solid #464647;
            border-radius: 4px;
            color: #d4d4d4;
            cursor: pointer;
            font-family: 'Fira Code', monospace;
            font-size: 12px;
            transition: all 0.2s;
          }

          .scenario-btn:hover {
            background: #3e3e42;
            border-color: #4ec9b0;
          }

          .scenario-btn:active {
            background: #4ec9b0;
            color: #1e1e1e;
          }

          .input-group {
            display: flex;
            gap: 8px;
          }

          .signal-input {
            flex: 1;
            padding: 8px;
            background: #2d2d30;
            border: 1px solid #464647;
            border-radius: 4px;
            color: #d4d4d4;
            font-family: 'Fira Code', monospace;
            font-size: 12px;
          }

          .signal-input:focus {
            outline: none;
            border-color: #4ec9b0;
          }

          .btn {
            padding: 8px 16px;
            background: #007acc;
            border: none;
            border-radius: 4px;
            color: white;
            cursor: pointer;
            font-family: 'Fira Code', monospace;
            font-size: 12px;
          }

          .btn:hover {
            background: #005a9e;
          }

          .injection-status {
            margin-top: 15px;
            padding: 10px;
            border-radius: 4px;
            font-size: 12px;
            display: none;
          }

          .injection-status.active {
            display: block;
          }

          .injection-status.success {
            background: #1e3d1f;
            border-left: 3px solid #6a9955;
            color: #6a9955;
          }

          .injection-status.error {
            background: #3d1e1e;
            border-left: 3px solid #f48771;
            color: #f48771;
          }

          .injection-status.warning {
            background: #3d2d1e;
            border-left: 3px solid #dcdcaa;
            color: #dcdcaa;
          }
        </style>
      </div>
    `;
        document.body.appendChild(container);
    }
    attachListeners() {
        // Scenario buttons
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const payload = e.target.getAttribute('data-payload');
                if (payload) {
                    this.injectSignal(payload);
                }
            });
        });
        // Custom signal injection
        const customInput = document.getElementById('custom-signal-input');
        const injectBtn = document.getElementById('btn-inject-custom');
        if (injectBtn) {
            injectBtn.addEventListener('click', () => {
                if (customInput?.value.trim()) {
                    this.injectSignal(customInput.value);
                    customInput.value = '';
                }
            });
        }
        if (customInput) {
            customInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && customInput.value.trim()) {
                    this.injectSignal(customInput.value);
                    customInput.value = '';
                }
            });
        }
        // Listen to pipeline events for feedback
        runtime_client_1.runtimeClient.on('pipeline.event', (event) => {
            if (event.type === 'signal.received') {
                this.showStatus('Signal injected: ' + event.raw_content, 'success');
            }
        });
        runtime_client_1.runtimeClient.on('runtime.error', (error) => {
            this.showStatus(error.error, 'error');
        });
    }
    async injectSignal(payload) {
        try {
            const status = runtime_client_1.runtimeClient.getStatus();
            if (!status.running) {
                this.showStatus('Runtime not running. Start ALIVE first.', 'warning');
                return;
            }
            this.showStatus(`Injecting: "${payload}"...`, 'success');
            await runtime_client_1.runtimeClient.executeCommand({ type: 'inject_signal', payload });
        }
        catch (error) {
            this.showStatus(`Failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
        }
    }
    showStatus(message, type) {
        const statusEl = document.getElementById('injection-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `injection-status active ${type}`;
            // Auto-hide after 5 seconds
            setTimeout(() => {
                statusEl.classList.remove('active');
            }, 5000);
        }
    }
}
exports.SignalsPlugin = SignalsPlugin;
exports.signals = new SignalsPlugin();
//# sourceMappingURL=index.js.map