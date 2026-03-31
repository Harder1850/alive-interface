import type { OutputEntry } from "../types";

interface OutputPanelProps {
  entries: OutputEntry[];
}

export function OutputPanel({ entries }: OutputPanelProps) {
  return (
    <section
      style={{
        height: "100%",
        border: "1px solid #253246",
        borderRadius: 10,
        background: "#0f1623",
        padding: 10,
        overflow: "auto",
      }}
    >
      <h3 style={{ margin: "0 0 8px 0" }}>Output</h3>
      {entries.length === 0 ? (
        <div style={{ color: "#95a9bf", fontSize: 13 }}>No actions yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {entries.map((entry) => (
            <article
              key={entry.id}
              style={{
                border: "1px solid #2a3a52",
                borderRadius: 8,
                padding: 8,
                background: "#0a111b",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                <strong style={{ color: entry.ok ? "#b9ffd6" : "#ffbfbf" }}>{entry.title}</strong>
                <span style={{ color: "#93a7bd", fontSize: 12 }}>{new Date(entry.ts).toLocaleTimeString()}</span>
              </div>
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                  fontSize: 12,
                  color: "#dce8f5",
                }}
              >
                {entry.body}
              </pre>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
