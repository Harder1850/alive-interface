/**
 * ALIVE State Plugin
 * Display current mode and basic runtime summary
 */

import { runtimeClient } from '@alive-studio/runtime-client';
import type { RuntimeStatus } from '@alive-studio/shared-types';

export class StatePlugin {
  private stateContainer: HTMLElement | null = null;

  public async activate(): Promise<void> {
    console.log('[StatePlugin] Activated');
    this.createUI();
    this.attachListeners();
  }

  private createUI(): void {
    const container = document.createElement('div');
    container.id = 'alive-state';
    container.innerHTML = `
      <div class="state-panel">
        <h2>🔌 Runtime State</h2>

        <div class="state-grid">
          <div class="state-card">
            <div class="state-label">Status</div>
            <div id="state-status" class="state-value state-stopped">● Stopped</div>
          </div>

          <div class="state-card">
            <div class="state-label">Mode</div>
            <div id="state-mode" class="state-value">—</div>
          </div>

          <div class="state-card">
            <div class="state-label">Uptime</div>
            <div id="state-uptime" class="state-value">—</div>
          </div>

          <div class="state-card">
            <div class="state-label">Signals</div>
            <div id="state-signals" class="state-value">0</div>
          </div>

          <div class="state-card">
            <div class="state-label">Last Signal</div>
            <div id="state-last-signal" class="state-value">—</div>
          </div>

          <div class="state-card">
            <div class="state-label">Resource Usage</div>
            <div id="state-resources" class="state-value">—</div>
          </div>
        </div>

        <div class="state-metrics">
          <h3>Pipeline Health</h3>
          <div class="metric-row">
            <span class="metric-label">Success Rate:</span>
            <div id="metric-success" class="metric-bar">
              <div class="metric-fill" style="width: 100%"></div>
            </div>
            <span class="metric-value">100%</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Avg Latency:</span>
            <span id="metric-latency" class="metric-value">—</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Errors:</span>
            <span id="metric-errors" class="metric-value">0</span>
          </div>
        </div>

        <style>
          #alive-state {
            padding: 20px;
            font-family: 'Fira Code', monospace;
            background: #1e1e1e;
            color: #d4d4d4;
          }

          #alive-state h2 {
            margin-top: 0;
            color: #4ec9b0;
          }

          .state-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin: 20px 0;
          }

          .state-card {
            background: #252525;
            border: 1px solid #3e3e42;
            border-radius: 4px;
            padding: 12px;
          }

          .state-label {
            font-size: 11px;
            color: #858585;
            text-transform: uppercase;
            margin-bottom: 6px;
          }

          .state-value {
            font-size: 14px;
            font-weight: bold;
            color: #4ec9b0;
          }

          .state-value.state-stopped {
            color: #f48771;
          }

          .state-value.state-running {
            color: #6a9955;
          }

          .state-metrics {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #3e3e42;
          }

          .state-metrics h3 {
            color: #ce9178;
            font-size: 12px;
            margin: 0 0 12px 0;
          }

          .metric-row {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
            font-size: 12px;
          }

          .metric-label {
            color: #858585;
            min-width: 100px;
          }

          .metric-bar {
            flex: 1;
            height: 4px;
            background: #3e3e42;
            border-radius: 2px;
            overflow: hidden;
            min-width: 80px;
          }

          .metric-fill {
            height: 100%;
            background: linear-gradient(90deg, #6a9955 0%, #4ec9b0 100%);
          }

          .metric-value {
            color: #4ec9b0;
            min-width: 50px;
            text-align: right;
          }
        </style>
      </div>
    `;

    document.body.appendChild(container);
    this.stateContainer = document.getElementById('alive-state');
  }

  private attachListeners(): void {
    // Subscribe to status updates
    runtimeClient.on('runtime.started', () => this.updateState());
    runtimeClient.on('runtime.stopped', () => this.updateState());
    runtimeClient.on('status.updated', (status) => this.displayState(status));
    runtimeClient.on('pipeline.event', () => this.updateState());

    // Initial state
    this.updateState();
  }

  private updateState(): void {
    const status = runtimeClient.getStatus();
    this.displayState(status);
  }

  private displayState(status: RuntimeStatus): void {
    const statusEl = document.getElementById('state-status');
    const modeEl = document.getElementById('state-mode');
    const uptimeEl = document.getElementById('state-uptime');
    const signalsEl = document.getElementById('state-signals');
    const lastSignalEl = document.getElementById('state-last-signal');

    if (statusEl) {
      if (status.running) {
        statusEl.textContent = '● Running';
        statusEl.className = 'state-value state-running';
      } else {
        statusEl.textContent = '● Stopped';
        statusEl.className = 'state-value state-stopped';
      }
    }

    if (modeEl) {
      modeEl.textContent = status.mode || '—';
    }

    if (uptimeEl) {
      uptimeEl.textContent = status.running
        ? `${(status.uptime_ms / 1000).toFixed(1)}s`
        : '—';
    }

    if (signalsEl) {
      signalsEl.textContent = String(status.signal_count);
    }

    if (lastSignalEl) {
      lastSignalEl.textContent = status.last_signal
        ? status.last_signal.substring(0, 12) + '...'
        : '—';
    }
  }
}

export const state = new StatePlugin();
