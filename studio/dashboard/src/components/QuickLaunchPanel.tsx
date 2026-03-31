interface QuickLaunchPanelProps {
  demoRunStatus: "idle" | "running" | "completed" | "failed";
  demoRunMessage?: string;
  latestNotice?: string;
  latestReason?: string;
  latestActionOutcome?: string;
  onRunLiveDemo: () => Promise<void> | void;
  onResetDemo: () => Promise<void> | void;
  onInspectLatestCycle: () => Promise<void> | void;
  onRefreshRepos: () => Promise<void> | void;
  onRefreshRuntime: () => Promise<void> | void;
  onRefreshMemory: () => Promise<void> | void;
  onOpenMind: () => Promise<void> | void;
  onOpenRuntime: () => Promise<void> | void;
  onOpenBody: () => Promise<void> | void;
  onRunMindTests: () => Promise<void> | void;
  onRunRuntimeTests: () => Promise<void> | void;
  onRunBodyTests: () => Promise<void> | void;
  onOpenNotes: () => Promise<void> | void;
}

export function QuickLaunchPanel({
  demoRunStatus,
  demoRunMessage,
  latestNotice,
  latestReason,
  latestActionOutcome,
  onRunLiveDemo,
  onResetDemo,
  onInspectLatestCycle,
  onRefreshRepos,
  onRefreshRuntime,
  onRefreshMemory,
  onOpenMind,
  onOpenRuntime,
  onOpenBody,
  onRunMindTests,
  onRunRuntimeTests,
  onRunBodyTests,
  onOpenNotes,
}: QuickLaunchPanelProps) {
  const statusColor =
    demoRunStatus === "running"
      ? "#f2c14e"
      : demoRunStatus === "completed"
        ? "#4ed28a"
        : demoRunStatus === "failed"
          ? "#ff7d7d"
          : "#95a9bf";

  return (
    <section style={{ border: "1px solid #253246", borderRadius: 10, background: "#0f1623", padding: 10 }}>
      <h3 style={{ marginTop: 0 }}>Scenario / Quick Actions</h3>
      <div style={{ marginBottom: 8, color: "#dbe8f7", fontSize: 13 }}>
        Runs one local proving scenario and updates Studio artifacts.
      </div>
      <div style={{ color: "#95a9bf", fontSize: 12, marginBottom: 8 }}>
        Read-only Studio relay. No hidden execution authority.
      </div>

      <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
        <button
          onClick={onRunLiveDemo}
          disabled={demoRunStatus === "running"}
          style={{
            fontSize: 15,
            fontWeight: 700,
            padding: "10px 12px",
            background: "#2c6bed",
            color: "#fff",
            border: "1px solid #4f85f5",
            borderRadius: 8,
            cursor: demoRunStatus === "running" ? "not-allowed" : "pointer",
            opacity: demoRunStatus === "running" ? 0.7 : 1,
          }}
        >
          {demoRunStatus === "running" ? "Running Live Demo..." : "Run Live Demo"}
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button onClick={onResetDemo}>Reset Demo</button>
          <button onClick={onInspectLatestCycle}>Inspect Latest Cycle</button>
        </div>

        <div style={{ fontSize: 12, color: statusColor }}>
          status: <strong>{demoRunStatus}</strong>
          {demoRunMessage ? ` — ${demoRunMessage}` : ""}
        </div>

        <div style={{ border: "1px solid #2a3a52", borderRadius: 8, padding: 8, background: "#0a111b", display: "grid", gap: 6 }}>
          <strong style={{ fontSize: 12, color: "#b8cae0" }}>Latest Scenario Result</strong>
          <div style={{ fontSize: 12, color: "#dbe8f7" }}>
            <strong>Notice:</strong> {latestNotice || "--"}
          </div>
          <div style={{ fontSize: 12, color: "#dbe8f7" }}>
            <strong>Reason:</strong> {latestReason || "--"}
          </div>
          <div style={{ fontSize: 12, color: "#dbe8f7" }}>
            <strong>Action/Outcome:</strong> {latestActionOutcome || "--"}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
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
