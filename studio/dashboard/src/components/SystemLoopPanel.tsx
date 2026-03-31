import type { Phase1LoopStatus } from "../types";
import { fmtTimestamp, KeyValueRow } from "./Phase1PanelCommon";

interface SystemLoopPanelProps {
  loop: Phase1LoopStatus | null;
}

export function SystemLoopPanel({ loop }: SystemLoopPanelProps) {
  const triage = loop?.triageDecision;
  const signal = loop?.lastSignal;
  const timestamps = loop?.stageTimestamps ?? {};

  return (
    <section style={{ border: "1px solid #253246", borderRadius: 10, background: "#0f1623", padding: 10 }}>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>System Loop</h3>
      <div style={{ display: "grid", gap: 6 }}>
        <KeyValueRow
          columns="170px 1fr"
          label="current mode"
          value={`${loop?.mode ?? "--"}${loop?.deepCognitionOpened ? " (deep-opened)" : ""}`}
        />
        <KeyValueRow
          columns="170px 1fr"
          label="last incoming signal"
          value={signal ? `${signal.source ?? "--"}/${signal.kind ?? "--"} (${signal.id ?? "--"})` : "--"}
        />
        <KeyValueRow columns="170px 1fr" label="normalized signal" value={loop?.lastSummary ?? loop?.note ?? "--"} />
        <KeyValueRow
          columns="170px 1fr"
          label="runtime triage"
          value={triage
            ? `novelty=${triage.novelty ?? "--"}, relevance=${triage.relevance ?? "--"}, contradiction=${String(
                triage.contradictionCandidate ?? false
              )}`
            : "--"}
        />
        <KeyValueRow
          columns="170px 1fr"
          label="baseline / deep"
          value={triage ? `${triage.openedDeep ? "deep opened" : "baseline only"}` : "--"}
        />
        <KeyValueRow columns="170px 1fr" label="candidate action" value={loop?.lastCandidateAction ?? "--"} />
        <KeyValueRow columns="170px 1fr" label="candidate summary" value={loop?.lastCandidateSummary ?? "--"} />
        <KeyValueRow
          columns="170px 1fr"
          label="outcome status"
          value={loop?.lastOutcome ? `${loop.lastOutcome.success ? "success" : "failure"}: ${loop.lastOutcome.note ?? "--"}` : "--"}
        />
        <KeyValueRow columns="170px 1fr" label="signal timestamp" value={fmtTimestamp(signal?.ts)} />
        <KeyValueRow columns="170px 1fr" label="outcome timestamp" value={fmtTimestamp(loop?.lastOutcome?.timestamp)} />
        {Object.keys(timestamps).length > 0 ? (
          Object.entries(timestamps).map(([key, value]) => (
            <KeyValueRow key={key} columns="170px 1fr" label={`${key} ts`} value={fmtTimestamp(value)} />
          ))
        ) : (
          <KeyValueRow columns="170px 1fr" label="stage timestamps" value="--" />
        )}
      </div>
    </section>
  );
}
