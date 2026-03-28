/**
 * ALIVE Studio - Theia Application Entry Point
 * Development cockpit, system inspector, launcher, trace viewer, test harness
 */

import { runtimeClient } from '@alive-studio/runtime-client';
import { launcher } from '@alive-studio/launcher';
import { trace } from '@alive-studio/trace';
import { signals } from '@alive-studio/signals';
import { state } from '@alive-studio/state';
import { logs } from '@alive-studio/logs';

// Initialize all plugins
async function initializePlugins() {
  console.log('[ALIVE Studio] Initializing plugins...');

  try {
    await launcher.activate();
    console.log('[ALIVE Studio] ✓ Launcher plugin activated');

    await trace.activate();
    console.log('[ALIVE Studio] ✓ Trace plugin activated');

    await signals.activate();
    console.log('[ALIVE Studio] ✓ Signals plugin activated');

    await state.activate();
    console.log('[ALIVE Studio] ✓ State plugin activated');

    await logs.activate();
    console.log('[ALIVE Studio] ✓ Logs plugin activated');

    console.log('[ALIVE Studio] All plugins initialized');
  } catch (error) {
    console.error('[ALIVE Studio] Plugin initialization failed:', error);
  }
}

// Set up command palette
function initializeCommandPalette() {
  console.log('[ALIVE Studio] Initializing command palette...');

  // Register commands
  const commands: { [key: string]: () => void } = {
    'Start ALIVE': async () => {
      await runtimeClient.executeCommand({ type: 'start', profile: 'default' });
    },
    'Stop ALIVE': async () => {
      await runtimeClient.executeCommand({ type: 'stop' });
    },
    'Inject CPU Spike': async () => {
      await runtimeClient.executeCommand({ type: 'inject_signal', payload: 'cpu spike' });
    },
    'Inject Disk Low': async () => {
      await runtimeClient.executeCommand({ type: 'inject_signal', payload: 'disk low' });
    },
    'Open Trace View': () => {
      const tracePanel = document.getElementById('alive-trace');
      if (tracePanel) {
        tracePanel.scrollIntoView({ behavior: 'smooth' });
      }
    },
    'Open State View': () => {
      const statePanel = document.getElementById('alive-state');
      if (statePanel) {
        statePanel.scrollIntoView({ behavior: 'smooth' });
      }
    },
  };

  // Listen for Ctrl+K (command palette trigger)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      showCommandPalette(commands);
    }
  });
}

function showCommandPalette(commands: { [key: string]: () => void }) {
  // Create simple command palette
  const input = prompt(
    'Command palette (Ctrl+K):\n\n' +
    Object.keys(commands).map((cmd, i) => `${i + 1}. ${cmd}`).join('\n') +
    '\n\nEnter command name or number:'
  );

  if (input) {
    const cmd = Object.keys(commands)[parseInt(input) - 1] || input;
    if (commands[cmd]) {
      commands[cmd]();
    }
  }
}

// Initialize UI theme and styles
function initializeTheme() {
  const style = document.createElement('style');
  style.textContent = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Fira Code', 'Consolas', monospace;
      background: #1e1e1e;
      color: #d4d4d4;
      overflow: hidden;
    }

    html, body {
      width: 100%;
      height: 100%;
    }

    #root {
      display: grid;
      grid-template-columns: 250px 1fr 350px;
      grid-template-rows: auto 1fr 150px;
      height: 100vh;
      gap: 1px;
      background: #1e1e1e;
    }

    .sidebar-left {
      grid-column: 1;
      grid-row: 1 / 3;
      border-right: 1px solid #3e3e42;
      overflow-y: auto;
      background: #252525;
    }

    .main-content {
      grid-column: 2;
      grid-row: 1 / 3;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .tab-bar {
      display: flex;
      gap: 1px;
      background: #1e1e1e;
      border-bottom: 1px solid #3e3e42;
      padding: 0;
    }

    .tab {
      padding: 10px 15px;
      background: #2d2d30;
      border: none;
      color: #d4d4d4;
      cursor: pointer;
      font-family: 'Fira Code', monospace;
      font-size: 12px;
      border-bottom: 2px solid transparent;
    }

    .tab:hover {
      background: #3e3e42;
    }

    .tab.active {
      background: #1e1e1e;
      border-bottom-color: #4ec9b0;
      color: #4ec9b0;
    }

    .tab-content {
      flex: 1;
      overflow: auto;
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .right-panel {
      grid-column: 3;
      grid-row: 1 / 3;
      border-left: 1px solid #3e3e42;
      background: #252525;
      overflow-y: auto;
    }

    .logs-panel {
      grid-column: 1 / 4;
      grid-row: 3;
      border-top: 1px solid #3e3e42;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .file-explorer {
      padding: 15px;
    }

    .file-item {
      padding: 5px;
      color: #d4d4d4;
      font-size: 12px;
    }

    .file-item:hover {
      background: #3e3e42;
    }

    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: #1e1e1e;
    }

    ::-webkit-scrollbar-thumb {
      background: #464647;
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #707070;
    }
  `;

  document.head.appendChild(style);
}

// Create main UI layout
function createLayout() {
  const root = document.getElementById('root') || document.createElement('div');
  root.id = 'root';

  root.innerHTML = `
    <div class="sidebar-left">
      <div class="file-explorer">
        <h3 style="color: #4ec9b0; font-size: 12px; margin-bottom: 10px;">ALIVE Project</h3>
        <div class="file-item">📁 alive-constitution/</div>
        <div class="file-item">📁 alive-body/</div>
        <div class="file-item">📁 alive-mind/</div>
        <div class="file-item">📁 alive-runtime/</div>
        <div class="file-item">📁 alive-interface/</div>
      </div>
    </div>

    <div class="main-content">
      <div class="tab-bar">
        <button class="tab active" data-tab="launcher">🚀 Launcher</button>
        <button class="tab" data-tab="trace">📋 Trace</button>
        <button class="tab" data-tab="signals">⚡ Signals</button>
      </div>

      <div id="launcher" class="tab-content active"></div>
      <div id="trace" class="tab-content"></div>
      <div id="signals" class="tab-content"></div>
    </div>

    <div class="right-panel">
      <!-- State panel will be inserted here -->
    </div>

    <div class="logs-panel">
      <!-- Logs panel will be inserted here -->
    </div>
  `;

  if (!document.getElementById('root')) {
    document.body.appendChild(root);
  }

  // Set up tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetTab = (e.target as HTMLElement).getAttribute('data-tab');
      if (targetTab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        (e.target as HTMLElement).classList.add('active');
        const content = document.getElementById(targetTab);
        if (content) {
          content.classList.add('active');
        }
      }
    });
  });
}

// Main initialization
async function main() {
  console.log('🚀 ALIVE Studio starting...');
  console.log('📦 Runtime integration: alive-runtime/src/wiring/pipeline.ts');

  initializeTheme();
  createLayout();
  await initializePlugins();
  initializeCommandPalette();

  console.log('✅ ALIVE Studio ready');
  console.log('💡 Tip: Press Ctrl+K for command palette');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
