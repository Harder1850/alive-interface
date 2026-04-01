interface QuickLaunchPanelProps {
  demoRunStatus: "idle" | "running" | "completed" | "failed";
  demoRunMessage?: string;
  startupReadiness?: {
    studioReady: boolean;
    runtimeReady: boolean;
    demoPathReady: boolean;
    intentPathReady: boolean;
  } | null;
  intentValue: string;
  intentRunning: boolean;
  intentStatusLabel?: string;
  intentMessage?: string;
  autoApprovedCount: number;
  pendingApprovalCount: number;
  blockedCount: number;
  latestThreadId?: string;
  latestIssue?: string;
  onIntentChange: (value: string) => void;
  onRunIntent: () => Promise<void> | void;
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
  startupReadiness,
  intentValue,
  intentRunning,
  intentStatusLabel,
  intentMessage,
  autoApprovedCount,
  pendingApprovalCount,
  blockedCount,
  latestThreadId,
  latestIssue,
  onIntentChange,
  onRunIntent,
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
  const isDemoPathReady = Boolean(startupReadiness?.demoPathReady);
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
      <h3 style={{ marginTop: 0 }}>Live Mode</h3>
      <div style={{ marginBottom: 8, color: "#dbe8f7", fontSize: 13 }}>
        One-click local run. Executes a proving scenario and refreshes visible results.
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10, fontSize: 12 }}>
        <span style={{ padding: "3px 8px", borderRadius: 999, background: startupReadiness?.studioReady ? "#153a2a" : "#3a1d1d" }}>
          Studio: {startupReadiness?.studioReady ? "ready" : "not ready"}
        </span>
        <span style={{ padding: "3px 8px", borderRadius: 999, background: startupReadiness?.runtimeReady ? "#153a2a" : "#3a1d1d" }}>
          Runtime: {startupReadiness?.runtimeReady ? "ready" : "not ready"}
        </span>
        <span style={{ padding: "3px 8px", borderRadius: 999, background: startupReadiness?.demoPathReady ? "#153a2a" : "#3a1d1d" }}>
          Demo path: {startupReadiness?.demoPathReady ? "ready" : "not ready"}
        </span>
        <span style={{ padding: "3px 8px", borderRadius: 999, background: startupReadiness?.intentPathReady ? "#153a2a" : "#3a1d1d" }}>
          Intent path: {startupReadiness?.intentPathReady ? "ready" : "not ready"}
        </span>
      </div>

      <div style={{ border: "1px solid #2a3a52", borderRadius: 8, padding: 8, background: "#0a111b", marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: "#b8cae0", marginBottom: 6 }}>Plain-language intent</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={intentValue}
            onChange={(event) => onIntentChange(event.target.value)}
            placeholder="What do you want to do?"
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #2f3a4a",
              background: "#0d1420",
              color: "#f5f7fa",
            }}
          />
          <button onClick={onRunIntent} disabled={intentRunning || !startupReadiness?.intentPathReady}>
            {intentRunning ? "Running..." : "Run"}
          </button>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: "#dbe8f7" }}>
          status: <strong>{intentStatusLabel ?? "idle"}</strong>
          {intentMessage ? ` — ${intentMessage}` : ""}
        </div>
      </div>

      <div style={{ border: "1px solid #2a3a52", borderRadius: 8, padding: 8, background: "#0a111b", marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: "#b8cae0", marginBottom: 6 }}>Approvals</div>
        <div style={{ display: "grid", gap: 4, fontSize: 12, color: "#dbe8f7" }}>
          <div>Auto-approved actions: <strong>{autoApprovedCount}</strong></div>
          <div>Pending approval actions: <strong>{pendingApprovalCount}</strong></div>
          <div>Blocked actions: <strong>{blockedCount}</strong></div>
          <div>Latest thread: <strong>{latestThreadId ?? "--"}</strong></div>
          <div>Latest issue: <strong>{latestIssue ?? "none"}</strong></div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
        <button
          onClick={onRunLiveDemo}
          disabled={demoRunStatus === "running" || !isDemoPathReady}
          style={{
            fontSize: 15,
            fontWeight: 700,
            padding: "10px 12px",
            background: "#2c6bed",
            color: "#fff",
            border: "1px solid #4f85f5",
            borderRadius: 8,
            cursor: demoRunStatus === "running" || !isDemoPathReady ? "not-allowed" : "pointer",
            opacity: demoRunStatus === "running" || !isDemoPathReady ? 0.7 : 1,
          }}
        >
          {demoRunStatus === "running" ? "Running Live Demo..." : "Run Live Demo"}
        </button>
        {!isDemoPathReady ? (
          <div style={{ fontSize: 12, color: "#ffbfbf" }}>
            Demo path is not ready yet. Wait for startup checks to pass.
          </div>
        ) : null}

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

      <details>
        <summary style={{ cursor: "pointer", color: "#9cb4cd", fontSize: 12, marginBottom: 6 }}>
          Advanced / developer controls
        </summary>
        <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
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
      </details>
    </section>
  );
}
