import type { Phase1MemorySnapshot } from "../types";

interface MemorySnapshotPanelProps {
  snapshot: Phase1MemorySnapshot | null;
}

function section(title: string, count: number, sample: unknown[], emptyText: string) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <strong style={{ fontSize: 12, color: "#b8cae0" }}>
        {title}: {count}
      </strong>
      {sample.length > 0 ? (
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 11,
            color: "#dce8f5",
            background: "#0a111b",
            border: "1px solid #2a3a52",
            borderRadius: 6,
            padding: 8,
          }}
        >
          {JSON.stringify(sample, null, 2)}
        </pre>
      ) : (
        <div style={{ color: "#95a9bf", fontSize: 12 }}>{emptyText}</div>
      )}
    </div>
  );
}

export function MemorySnapshotPanel({ snapshot }: MemorySnapshotPanelProps) {
  const working = snapshot?.workingMemorySample ?? snapshot?.working ?? [];
  const episodes = snapshot?.recentEpisodesSample ?? snapshot?.episodes ?? [];
  const structuralNodes = snapshot?.structuralNodeSample ?? snapshot?.structuralNodes ?? [];
  const referenceHot = snapshot?.referenceItemSample ?? snapshot?.referenceHot ?? [];
  const threadSummaries = snapshot?.threadSummarySample ?? snapshot?.threadSummaries ?? [];
  const outcomeBuffer = snapshot?.outcomeBufferSample ?? [];
  const associations = snapshot?.associationSample ?? snapshot?.associations ?? [];

  return (
    <section style={{ border: "1px solid #253246", borderRadius: 10, background: "#0f1623", padding: 10 }}>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Memory Snapshot (read-only)</h3>
      <div style={{ color: "#95a9bf", fontSize: 12, marginBottom: 8 }}>
        bridge mode: {snapshot?.readOnly === false ? "unexpected writable" : "read-only relay"}
        {snapshot?.generatedAt ? ` | generated: ${new Date(snapshot.generatedAt).toLocaleString()}` : ""}
      </div>
      {snapshot?.note ? <div style={{ color: "#95a9bf", fontSize: 12, marginBottom: 8 }}>{snapshot.note}</div> : null}
      <div style={{ display: "grid", gap: 10 }}>
        {section("working memory items", working.length, working.slice(0, 5), "No working memory items yet.")}
        {section("recent episodes", episodes.length, episodes.slice(0, 5), "No episodes available yet.")}
        {section("reference items", referenceHot.length, referenceHot.slice(0, 5), "No reference facts available.")}
        {section("thread summaries", threadSummaries.length, threadSummaries.slice(0, 5), "No thread summaries available.")}
        {section("outcome buffer", outcomeBuffer.length, outcomeBuffer.slice(0, 5), "No outcomes available.")}
        {section("structural nodes", structuralNodes.length, structuralNodes.slice(0, 3), "No structural nodes available.")}
        {section("recent associations", associations.length, associations.slice(0, 5), "No recent associations available.")}
      </div>
    </section>
  );
}
