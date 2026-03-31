import type { Phase1RuntimeStatus } from "../types";
import { fmtTimestamp, KeyValueRow } from "./Phase1PanelCommon";

interface RuntimeStatusPanelProps {
  status: Phase1RuntimeStatus | null;
}

export function RuntimeStatusPanel({ status }: RuntimeStatusPanelProps) {
  const warnings = status?.recentWarnings ?? [];
  const errors = status?.recentErrors ?? [];

  return (
    <section style={{ border: "1px solid #253246", borderRadius: 10, background: "#0f1623", padding: 10 }}>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Runtime Status</h3>
      <div style={{ display: "grid", gap: 6 }}>
        <KeyValueRow label="current mode" value={status?.currentMode ?? "--"} />
        <KeyValueRow label="baseline vigilance active" value={String(status?.baselineVigilanceActive ?? false)} />
        <KeyValueRow label="deep cognition active" value={String(status?.deepCognitionActive ?? false)} />
        <KeyValueRow label="deep cognition opened" value={String(status?.deepCognitionOpened ?? false)} />
        <KeyValueRow label="last signal" value={status?.lastSignal ?? status?.lastSignalProcessed ?? "--"} />
        <KeyValueRow label="last signal id" value={status?.lastSignalId ?? "--"} />
        <KeyValueRow label="last signal timestamp" value={fmtTimestamp(status?.lastSignalTimestamp)} />
        <KeyValueRow label="last candidate action" value={status?.lastCandidateAction ?? "--"} />
        <KeyValueRow label="last candidate summary" value={status?.lastCandidateSummary ?? "--"} />
        <KeyValueRow label="last loop result summary" value={status?.lastLoopResultSummary ?? "--"} />
        <KeyValueRow label="last outcome summary" value={status?.lastOutcomeSummary ?? "--"} />
        <KeyValueRow label="last outcome timestamp" value={fmtTimestamp(status?.lastOutcomeTimestamp)} />
        <KeyValueRow label="loop processed timestamp" value={fmtTimestamp(status?.loopProcessedTimestamp)} />
        <KeyValueRow label="runtime updated timestamp" value={fmtTimestamp(status?.runtimeUpdatedTimestamp)} />
        <KeyValueRow label="recent warnings" value={warnings.length > 0 ? warnings.join(" | ") : "none"} />
        <KeyValueRow label="recent errors" value={errors.length > 0 ? errors.join(" | ") : "none"} />
        <KeyValueRow label="data source" value={status?.source ?? "--"} />
        <KeyValueRow label="refresh timestamp" value={fmtTimestamp(status?.refreshTimestamp)} />
      </div>
    </section>
  );
}
