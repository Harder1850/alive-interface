/**
 * ALIVE Launcher Plugin
 * Start/stop ALIVE runtime, select profile, display status
 */

import { runtimeClient } from '@alive-studio/runtime-client';
import type { RuntimeStatus } from '@alive-studio/shared-types';

export class LauncherPlugin {
  private statusElement: HTMLElement | null = null;
  private isRunning = false;

  public async activate(): Promise<void> {
    console.log('[LauncherPlugin] Activated');
    this.createUI();
    this.attachListeners();
  }

  private createUI(): void {
    const container = document.createElement('div');
    container.id = 'alive-launcher';
    container.innerHTML = `
      <div class="launcher-panel">
        <h2>🚀 ALIVE Launcher</h2>
        
        <div class="control-group">
          <label>Profile:</label>
          <select id="profile-select">
            <option value="default">Default</option>
            <option value="aggressive">Aggressive</option>
            <option value="conservative">Conservative</option>
            <option value="debug">Debug</option>
          </select>
        </div>

        <div class="button-group">
          <button id="btn-start" class="btn btn-primary">▶ Start ALIVE</button>
          <button id="btn-stop" class="btn btn-danger" disabled>⏹ Stop ALIVE</button>
        </div>

        <div id="status-display" class="status-display">
          <div class="status-line">
            <span class="status-label">Status:</span>
            <span id="status-value" class="status-value">● Stopped</span>
          </div>
          <div class="status-line">
            <span class="status-label">Uptime:</span>
            <span id="uptime-value" class="status-value">—</span>
          </div>
          <div class="status-line">
            <span class="status-label">Signals Processed:</span>
            <span id="signal-count-value" class="status-value">0</span>
          </div>
          <div class="status-line">
            <span class="status-label">Mode:</span>
            <span id="mode-value" class="status-value">—</span>
          </div>
        </div>

        <style>
          #alive-launcher {
            padding: 20px;
            font-family: 'Fira Code', monospace;
            background: #1e1e1e;
            color: #e0e0e0;
          }

          #alive-launcher h2 {
            margin-top: 0;
            color: #4ec9b0;
          }

          .control-group {
            margin: 15px 0;
          }

          #profile-select {
            padding: 8px;
            background: #2d2d2d;
            color: #e0e0e0;
            border: 1px solid #4ec9b0;
            border-radius: 4px;
            margin-left: 10px;
          }

          .button-group {
            display: flex;
            gap: 10px;
            margin: 20px 0;
          }

          .btn {
            flex: 1;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            font-family: 'Fira Code', monospace;
            cursor: pointer;
            font-weight: bold;
          }

          .btn-primary {
            background: #007acc;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background: #005a9e;
          }

          .btn-danger {
            background: #d13438;
            color: white;
          }

          .btn-danger:hover:not(:disabled) {
            background: #a01f23;
          }

          .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .status-display {
            margin-top: 25px;
            padding: 15px;
            background: #252525;
            border-left: 3px solid #4ec9b0;
            border-radius: 4px;
          }

          .status-line {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 13px;
          }

          .status-label {
            color: #858585;
          }

          .status-value {
            color: #4ec9b0;
            font-weight: bold;
          }
        </style>
      </div>
    `;

    document.body.appendChild(container);
    this.statusElement = document.getElementById('status-display');
  }

  private attachListeners(): void {
    const startBtn = document.getElementById('btn-start') as HTMLButtonElement;
    const stopBtn = document.getElementById('btn-stop') as HTMLButtonElement;
    const profileSelect = document.getElementById('profile-select') as HTMLSelectElement;

    startBtn.addEventListener('click', () => this.start(profileSelect.value));
    stopBtn.addEventListener('click', () => this.stop());

    // Listen to runtime status updates
    runtimeClient.on('runtime.started', () => this.updateStatus());
    runtimeClient.on('runtime.stopped', () => this.updateStatus());
    runtimeClient.on('status.updated', (status) => this.displayStatus(status));
    runtimeClient.on('pipeline.event', () => this.updateStatus());
  }

  private async start(profile: string): Promise<void> {
    try {
      console.log(`[LauncherPlugin] Starting with profile: ${profile}`);
      await runtimeClient.executeCommand({ type: 'start', profile });
      this.isRunning = true;
      this.updateButtonStates();
    } catch (error) {
      console.error('[LauncherPlugin] Start failed:', error);
      alert(`Failed to start ALIVE: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async stop(): Promise<void> {
    try {
      console.log('[LauncherPlugin] Stopping');
      await runtimeClient.executeCommand({ type: 'stop' });
      this.isRunning = false;
      this.updateButtonStates();
    } catch (error) {
      console.error('[LauncherPlugin] Stop failed:', error);
    }
  }

  private updateStatus(): void {
    const status = runtimeClient.getStatus();
    this.displayStatus(status);
  }

  private displayStatus(status: RuntimeStatus): void {
    const statusValue = document.getElementById('status-value');
    const uptimeValue = document.getElementById('uptime-value');
    const signalCountValue = document.getElementById('signal-count-value');
    const modeValue = document.getElementById('mode-value');

    if (statusValue) {
      statusValue.textContent = status.running ? '● Running' : '● Stopped';
    }
    if (uptimeValue) {
      uptimeValue.textContent = status.running
        ? `${(status.uptime_ms / 1000).toFixed(1)}s`
        : '—';
    }
    if (signalCountValue) {
      signalCountValue.textContent = String(status.signal_count);
    }
    if (modeValue) {
      modeValue.textContent = status.mode || '—';
    }
  }

  private updateButtonStates(): void {
    const startBtn = document.getElementById('btn-start') as HTMLButtonElement;
    const stopBtn = document.getElementById('btn-stop') as HTMLButtonElement;

    if (startBtn && stopBtn) {
      startBtn.disabled = this.isRunning;
      stopBtn.disabled = !this.isRunning;
    }
  }
}

export const launcher = new LauncherPlugin();
