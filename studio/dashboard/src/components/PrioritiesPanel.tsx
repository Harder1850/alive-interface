import type { PrioritiesSnapshot } from "../types";

interface PrioritiesPanelProps {
  snapshot: PrioritiesSnapshot | null;
}

function renderList(title: string, items: string[], empty: string) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <strong style={{ fontSize: 12, color: "#b8cae0" }}>{title}</strong>
      {items.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 4 }}>
          {items.map((item, index) => (
            <li key={`${title}-${index}`} style={{ color: "#dbe8f7", fontSize: 12 }}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ color: "#95a9bf", fontSize: 12 }}>{empty}</div>
      )}
    </div>
  );
}

export function PrioritiesPanel({ snapshot }: PrioritiesPanelProps) {
  const priorities = snapshot?.priorities ?? [];

  return (
    <section style={{ border: "1px solid #253246", borderRadius: 10, background: "#0f1623", padding: 10 }}>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Priorities / Next Tasks</h3>
      <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
        {priorities.slice(0, 5).map((item) => (
          <li key={item.id} style={{ color: "#dbe8f7", fontSize: 13 }}>
            {item.text}
          </li>
        ))}
      </ol>
      {priorities.length === 0 ? <div style={{ color: "#95a9bf", fontSize: 12 }}>No priorities yet.</div> : null}

      <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
        {renderList("Current Blanks", snapshot?.currentBlanks ?? [], "No current blanks captured.")}
        {renderList(
          "Recent Implementation Notes",
          snapshot?.recentImplementationNotes ?? [],
          "No implementation notes captured."
        )}
        {renderList("Next Tasks", snapshot?.nextTasks ?? [], "No next tasks listed.")}
      </div>
    </section>
  );
}
