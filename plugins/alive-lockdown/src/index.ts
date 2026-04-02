/**
 * ALIVE LOCKDOWN PLUGIN — alive-interface
 * LOCKDOWN MODE IMPLEMENTATION — Slice 1.5
 *
 * Displays lockdown status and provides controls in LOCKDOWN mode.
 * In LOCKDOWN, this plugin shows:
 *   - Current system mode (NORMAL/LOCKDOWN)
 *   - Blocked actions count
 *   - Incident history
 *   - Audit status
 *
 * This plugin is relay-only: it displays status but does NOT control the system.
 */

import type { RuntimeModeState } from '../../../../alive-constitution/contracts/system-mode';
import type { IncidentRecord, LockdownSummary } from '../../../../alive-constitution/contracts/incident-record';

// ─── Lockdown Status Types ───────────────────────────────────────────────────

/**
 * Lockdown status display data.
 */
export interface LockdownStatus {
  /** Current system mode. */
  mode: 'NORMAL' | 'LOCKDOWN';

  /** Whether lockdown is currently active. */
  isActive: boolean;

  /** Epoch ms when current mode was entered. */
  enteredAt: number | null;

  /** Reason for entering current mode. */
  entryReason: string | null;

  /** Number of actions blocked since lockdown entry. */
  blockedActionsCount: number;

  /** Number of unauthorized execution attempts. */
  unauthorizedAttempts: number;

  /** Current lockdown ID if in LOCKDOWN. */
  lockdownId: string | null;
}

/**
 * Plugin state.
 */
interface LockdownPluginState {
  /** Current lockdown status. */
  status: LockdownStatus;

  /** Recent incidents. */
  incidents: IncidentRecord[];

  /** Current lockdown summary if in LOCKDOWN. */
  lockdownSummary: LockdownSummary | null;
}

// ─── Default State ────────────────────────────────────────────────────────────

const defaultState: LockdownPluginState = {
  status: {
    mode: 'NORMAL',
    isActive: false,
    enteredAt: null,
    entryReason: null,
    blockedActionsCount: 0,
    unauthorizedAttempts: 0,
    lockdownId: null,
  },
  incidents: [],
  lockdownSummary: null,
};

// ─── Plugin API ──────────────────────────────────────────────────────────────

let state: LockdownPluginState = { ...defaultState };

/**
 * Get the current lockdown status.
 */
export function getLockdownStatus(): LockdownStatus {
  return { ...state.status };
}

/**
 * Get recent incidents.
 */
export function getIncidents(): readonly IncidentRecord[] {
  return [...state.incidents];
}

/**
 * Get current lockdown summary.
 */
export function getLockdownSummary(): LockdownSummary | null {
  return state.lockdownSummary ? { ...state.lockdownSummary } : null;
}

/**
 * Update lockdown status from runtime state.
 * Called by the interface when receiving updates from alive-runtime.
 */
export function updateFromRuntime(runtimeState: RuntimeModeState): void {
  state.status = {
    mode: runtimeState.mode,
    isActive: runtimeState.mode === 'LOCKDOWN',
    enteredAt: runtimeState.enteredAt || null,
    entryReason: runtimeState.entryReason || null,
    blockedActionsCount: runtimeState.blockedActionsCount,
    unauthorizedAttempts: 0, // Would come from runtime
    lockdownId: runtimeState.mode === 'LOCKDOWN' 
      ? `lockdown-${runtimeState.enteredAt}` 
      : null,
  };
}

/**
 * Update incidents from runtime.
 * Called by the interface when receiving updates from alive-runtime.
 */
export function updateIncidents(incidents: IncidentRecord[]): void {
  state.incidents = [...incidents];
}

/**
 * Update lockdown summary from runtime.
 * Called by the interface when receiving updates from alive-runtime.
 */
export function updateLockdownSummary(summary: LockdownSummary | null): void {
  state.lockdownSummary = summary ? { ...summary } : null;
}

/**
 * Check if the interface should show lockdown UI.
 */
export function shouldShowLockdownUI(): boolean {
  return state.status.isActive;
}

/**
 * Check if execution controls should be hidden.
 * In LOCKDOWN, direct execution controls are hidden.
 */
export function shouldHideExecutionControls(): boolean {
  return state.status.isActive;
}

/**
 * Get blocked actions for display.
 */
export function getBlockedActions(): readonly IncidentRecord[] {
  return state.incidents.filter(
    (i) => i.category === 'enforcement_violation' || i.blockedActions.length > 0
  );
}

/**
 * Reset plugin state (for testing).
 */
export function resetState(): void {
  state = { ...defaultState };
}
