/**
 * ALIVE Studio — Signals Plugin
 *
 * Purpose: Inject test signals and predefined scenarios into the runtime.
 * All injection goes through runtimeClient.executeCommand only.
 */

import { runtimeClient } from '@alive-studio/runtime-client';

interface Scenario {
  label:   string;
  payload: string;
  icon:    string;
}

const SCENARIOS: Scenario[] = [
  { icon: '🧪', label: 'Hello',           payload: 'hello' },
  { icon: '📊', label: 'Status check',    payload: 'status check' },
  { icon: '🔥', label: 'CPU spike',       payload: 'cpu spike detected' },
  { icon: '💾', label: 'Disk low',        payload: 'disk space low warning' },
  { icon: '🔁', label: 'Repeated signal', payload: 'repeated ping ping ping' },
  { icon: '⚠️', label: 'System alert',    payload: 'system alert critical' },
  { icon: '🚫', label: 'Force DENY',      payload: 'deny this signal now' },
  { icon: '⏱️', label: 'Force DEFER',     payload: 'defer this until later' },
];

export class SignalsPlugin {
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
      <div class="sp-wrap">
        <div class="sp-section">
          <div class="sp-section-title">Predefined Scenarios</div>
          <div class="sp-grid">
            ${SCENARIOS.map(s => `
              <button class="sp-scenario-btn" data-payload="${this.esc(s.payload)}">
                <span class="sp-icon">${s.icon}</span>
                <span class="sp-label">${this.esc(s.label)}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="sp-section">
          <div class="sp-section-title">Custom Signal</div>
          <div class="sp-custom-row">
            <input
              class="sp-input"
              data-id="custom-input"
              type="text"
              placeholder="Type signal payload and press Enter or ▶"
              autocomplete="off"
            />
            <button class="sp-inject-btn" data-id="inject-btn">▶ Inject</button>
          </div>
        </div>

        <div class="sp-feedback" data-id="feedback" hidden></div>
      </div>
    `;
  }

  // ─── Bind ─────────────────────────────────────────────────────────────────

  private bind(): void {
    if (!this.root) return;

    // Scenario buttons
    this.root.querySelectorAll('.sp-scenario-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const payload = (btn as HTMLElement).dataset.payload ?? '';
        this.inject(payload);
      });
    });

    // Custom input
    const input    = this.root.querySelector<HTMLInputElement>('[data-id="custom-input"]')!;
    const injectBtn = this.root.querySelector<HTMLButtonElement>('[data-id="inject-btn"]')!;

    injectBtn.addEventListener('click', () => {
      const v = input.value.trim();
      if (v) { this.inject(v); input.value = ''; }
    });

    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const v = input.value.trim();
        if (v) { this.inject(v); input.value = ''; }
      }
    });

    // Feedback from pipeline
    runtimeClient.on('signal.received', (ev: unknown) => {
      const e = ev as { raw_content: string };
      this.feedback(`Injected: "${e.raw_content}"`, 'ok');
    });

    runtimeClient.on('runtime.error', (ev: unknown) => {
      const e = ev as { error: string };
      this.feedback(e.error, 'err');
    });
  }

  private async inject(payload: string): Promise<void> {
    const status = runtimeClient.getStatus();
    if (!status.running) {
      this.feedback('Runtime not running — click ▶ Start ALIVE first', 'warn');
      return;
    }
    await runtimeClient.executeCommand({ type: 'inject_signal', payload });
  }

  private feedback(msg: string, type: 'ok' | 'err' | 'warn'): void {
    const el = this.root?.querySelector<HTMLElement>('[data-id="feedback"]');
    if (!el) return;
    el.textContent = msg;
    el.className   = `sp-feedback sp-fb-${type}`;
    el.hidden      = false;
    setTimeout(() => { if (el) el.hidden = true; }, 4000);
  }

  private esc(s: string): string {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
}
