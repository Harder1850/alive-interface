interface QuickLaunchPanelProps {
  onRefreshRepos: () => Promise<void> | void;
  onRefreshRuntime: () => Promise<void> | void;
  onRefreshMemory: () => Promise<void> | void;
  onTriggerScenario: () => Promise<void> | void;
  onInspectArtifacts: () => Promise<void> | void;
  onResetDemoState: () => Promise<void> | void;
  onOpenMind: () => Promise<void> | void;
  onOpenRuntime: () => Promise<void> | void;
  onOpenBody: () => Promise<void> | void;
  onRunMindTests: () => Promise<void> | void;
  onRunRuntimeTests: () => Promise<void> | void;
  onRunBodyTests: () => Promise<void> | void;
  onOpenNotes: () => Promise<void> | void;
}

export function QuickLaunchPanel({
  onRefreshRepos,
  onRefreshRuntime,
  onRefreshMemory,
  onTriggerScenario,
  onInspectArtifacts,
  onResetDemoState,
  onOpenMind,
  onOpenRuntime,
  onOpenBody,
  onRunMindTests,
  onRunRuntimeTests,
  onRunBodyTests,
  onOpenNotes,
}: QuickLaunchPanelProps) {
  return (
    <section style={{ border: "1px solid #253246", borderRadius: 10, background: "#0f1623", padding: 10 }}>
      <h3 style={{ marginTop: 0 }}>Scenario / Quick Actions</h3>
      <div style={{ color: "#95a9bf", fontSize: 12, marginBottom: 8 }}>
        Read-only Studio relay. No hidden execution authority.
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <button onClick={onTriggerScenario}>Trigger proving scenario (runtime phase1:prove)</button>
        <button onClick={onInspectArtifacts}>Inspect latest artifacts (interface demo:inspect)</button>
        <button onClick={onResetDemoState}>Reset demo state (interface demo:reset)</button>
        <button onClick={onRefreshRepos}>Refresh repo status</button>
        <button onClick={onRefreshRuntime}>Refresh runtime status</button>
        <button onClick={onRefreshMemory}>Refresh memory snapshot</button>
        <button onClick={onOpenMind}>Open mind in VS Code</button>
        <button onClick={onOpenRuntime}>Open runtime in VS Code</button>
        <button onClick={onOpenBody}>Open body in VS Code</button>
        <button onClick={onRunMindTests}>Run mind tests</button>
        <button onClick={onRunRuntimeTests}>Run runtime tests</button>
        <button onClick={onRunBodyTests}>Run body tests</button>
        <button onClick={onOpenNotes}>Open notes</button>
      </div>
    </section>
  );
}
