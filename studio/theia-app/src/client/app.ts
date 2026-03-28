/**
 * ALIVE Studio — Browser App Entry Point
 *
 * This file is bundled by esbuild into public/bundle.js.
 * It:
 *   1. Connects the RuntimeClient to the WebSocket server
 *   2. Mounts each plugin into its HTML container
 *   3. Wires tab navigation
 *   4. Wires command palette (Ctrl/Cmd + P)
 *   5. Wires "Open in VS Code" button
 *   6. Maintains connection status in the status bar
 */

import { runtimeClient } from '@alive-studio/runtime-client';
import { LauncherPlugin } from '@alive-studio/launcher';
import { TracePlugin }    from '@alive-studio/trace';
import { SignalsPlugin }  from '@alive-studio/signals';
import { StatePlugin }    from '@alive-studio/state';
import { LogsPlugin }     from '@alive-studio/logs';

// ─── Boot ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // 1. Connect to the studio server WebSocket
  runtimeClient.connect();

  // 2. Mount all plugins into their panel containers
  mount('panel-launcher', new LauncherPlugin());
  mount('panel-trace',    new TracePlugin());
  mount('panel-signals',  new SignalsPlugin());
  mount('panel-state',    new StatePlugin());
  mount('panel-logs',     new LogsPlugin());

  // 3. Tab navigation
  setupTabs();

  // 4. Command palette
  setupCommandPalette();

  // 5. Sidebar nav links (nav items that activate tabs)
  setupSidebarNav();

  // 6. VS Code button
  setupVSCode();

  // 7. Status bar: connection state
  setupStatusBar();

  // 8. Sidebar quick-inject buttons (dispatched as CustomEvents from inline HTML script)
  window.addEventListener('studio:inject', (e: Event) => {
    const payload = (e as CustomEvent<{ payload: string }>).detail?.payload;
    if (payload) runtimeClient.executeCommand({ type: 'inject_signal', payload });
  });

  console.log('[Studio] ALIVE Studio initialised');
});

// ─── Plugin mounting ──────────────────────────────────────────────────────────

function mount(id: string, plugin: { mount(el: HTMLElement): void }): void {
  const el = document.getElementById(id);
  if (!el) { console.error(`[Studio] Panel not found: #${id}`); return; }
  plugin.mount(el);
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function setupTabs(): void {
  const tabs   = document.querySelectorAll<HTMLElement>('.tab');
  const panels = document.querySelectorAll<HTMLElement>('.panel');

  function activate(tabId: string): void {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    panels.forEach(p => {
      const active = p.id === `panel-${tabId}`;
      p.style.display = active ? 'block' : 'none';
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.tab;
      if (id) activate(id);
    });
  });

  // Default tab
  activate('launcher');
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────

function setupSidebarNav(): void {
  document.querySelectorAll<HTMLElement>('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      const target = el.dataset.nav;
      if (!target) return;
      // activate the matching tab
      document.querySelector<HTMLElement>(`.tab[data-tab="${target}"]`)?.click();
    });
  });
}

// ─── Command Palette ──────────────────────────────────────────────────────────

interface Command {
  label:  string;
  action: () => void;
}

function buildCommands(): Command[] {
  return [
    {
      label:  'ALIVE: Start',
      action: () => runtimeClient.executeCommand({ type: 'start', profile: 'default' }),
    },
    {
      label:  'ALIVE: Stop',
      action: () => runtimeClient.executeCommand({ type: 'stop' }),
    },
    {
      label:  'ALIVE: Request Status',
      action: () => runtimeClient.executeCommand({ type: 'request_status' }),
    },
    {
      label:  'ALIVE: Inject CPU Spike',
      action: () => runtimeClient.executeCommand({ type: 'inject_signal', payload: 'cpu spike detected' }),
    },
    {
      label:  'ALIVE: Inject Disk Low',
      action: () => runtimeClient.executeCommand({ type: 'inject_signal', payload: 'disk space low warning' }),
    },
    {
      label:  'ALIVE: Inject Repeated Signal',
      action: () => runtimeClient.executeCommand({ type: 'inject_signal', payload: 'repeated ping ping ping' }),
    },
    {
      label:  'ALIVE: Inject Hello',
      action: () => runtimeClient.executeCommand({ type: 'inject_signal', payload: 'hello' }),
    },
    {
      label:  'ALIVE: Force STG DENY',
      action: () => runtimeClient.executeCommand({ type: 'inject_signal', payload: 'deny this signal now' }),
    },
    {
      label:  'ALIVE: Force STG DEFER',
      action: () => runtimeClient.executeCommand({ type: 'inject_signal', payload: 'defer this until later' }),
    },
    {
      label:  'ALIVE: Clear Trace',
      action: () => runtimeClient.executeCommand({ type: 'clear_trace' }),
    },
    {
      label:  'ALIVE: Open Launcher',
      action: () => document.querySelector<HTMLElement>('.tab[data-tab="launcher"]')?.click(),
    },
    {
      label:  'ALIVE: Open Trace',
      action: () => document.querySelector<HTMLElement>('.tab[data-tab="trace"]')?.click(),
    },
    {
      label:  'ALIVE: Open Signals',
      action: () => document.querySelector<HTMLElement>('.tab[data-tab="signals"]')?.click(),
    },
    {
      label:  'ALIVE: Open State',
      action: () => document.querySelector<HTMLElement>('.tab[data-tab="state"]')?.click(),
    },
    {
      label:  'ALIVE: Open Logs',
      action: () => document.querySelector<HTMLElement>('.tab[data-tab="logs"]')?.click(),
    },
  ];
}

function setupCommandPalette(): void {
  const overlay   = document.getElementById('cmd-overlay')!;
  const input     = document.getElementById('cmd-input')  as HTMLInputElement;
  const resultBox = document.getElementById('cmd-results')!;
  const commands  = buildCommands();

  let selected = 0;

  function open(): void {
    overlay.style.display = 'flex';
    input.value = '';
    render(commands);
    input.focus();
    selected = 0;
  }

  function close(): void {
    overlay.style.display = 'none';
  }

  function render(cmds: Command[]): void {
    resultBox.innerHTML = cmds.map((c, i) =>
      `<div class="cmd-item ${i === selected ? 'selected' : ''}" data-index="${i}">${esc(c.label)}</div>`
    ).join('');

    resultBox.querySelectorAll<HTMLElement>('.cmd-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = Number(item.dataset.index);
        cmds[idx]?.action();
        close();
      });
    });
  }

  input.addEventListener('input', () => {
    selected = 0;
    const q   = input.value.toLowerCase();
    const filtered = q ? commands.filter(c => c.label.toLowerCase().includes(q)) : commands;
    render(filtered);
  });

  input.addEventListener('keydown', (e: KeyboardEvent) => {
    const items = resultBox.querySelectorAll<HTMLElement>('.cmd-item');
    if (e.key === 'ArrowDown') {
      selected = Math.min(selected + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      selected = Math.max(selected - 1, 0);
    } else if (e.key === 'Enter') {
      items[selected]?.click();
      return;
    } else if (e.key === 'Escape') {
      close();
      return;
    }
    items.forEach((el, i) => el.classList.toggle('selected', i === selected));
    items[selected]?.scrollIntoView({ block: 'nearest' });
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Keyboard shortcut: Ctrl+P or Cmd+P
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      overlay.style.display === 'none' ? open() : close();
    }
  });
}

// ─── VS Code button ───────────────────────────────────────────────────────────

function setupVSCode(): void {
  const btn = document.getElementById('btn-open-vscode');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    try {
      await fetch('/api/open-vscode', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ path: undefined }), // server uses ALIVE_REPOS default
      });
    } catch (e) {
      console.error('[Studio] open-vscode failed:', e);
    }
  });
}

// ─── Status bar ───────────────────────────────────────────────────────────────

function setupStatusBar(): void {
  const bar = document.getElementById('status-bar-text');
  if (!bar) return;

  runtimeClient.on('client.connected',    () => setBar('◉ Connected', 'connected'));
  runtimeClient.on('client.disconnected', () => setBar('◌ Disconnected', 'disconnected'));
  runtimeClient.on('runtime.started',     (e: unknown) => {
    const ev = e as { profile: string };
    setBar(`▶ Running · ${ev.profile}`, 'running');
  });
  runtimeClient.on('runtime.stopped',     () => setBar('⏹ Stopped', 'stopped'));

  function setBar(text: string, cls: string): void {
    bar.textContent = text;
    bar.className   = `sb-text ${cls}`;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
