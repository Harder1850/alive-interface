import type { RecentTarget, TargetsState } from "../types";

interface RecentTargetsPanelProps {
  state: TargetsState;
  onOpen: (repoId: RecentTarget["repoId"], target: RecentTarget["target"]) => Promise<void> | void;
  onToggleFavorite: (targetId: string, pinned: boolean) => Promise<void> | void;
}

export function RecentTargetsPanel({ state, onOpen, onToggleFavorite }: RecentTargetsPanelProps) {
  const favorites = state.recent.filter((r) => state.favorites.includes(r.id));
  const recent = state.recent.filter((r) => !state.favorites.includes(r.id)).slice(0, 8);

  const renderRow = (item: RecentTarget) => {
    const pinned = state.favorites.includes(item.id);
    return (
      <div
        key={item.id}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          gap: 6,
          alignItems: "center",
          border: "1px solid #2a3a52",
          borderRadius: 8,
          padding: 6,
          background: "#0a111b",
        }}
      >
        <button onClick={() => onOpen(item.repoId, item.target)} style={{ textAlign: "left" }}>
          {item.repoId}/{item.target}
        </button>
        <span style={{ color: "#90a6be", fontSize: 11 }}>{new Date(item.openedAt).toLocaleTimeString()}</span>
        <button onClick={() => onToggleFavorite(item.id, !pinned)}>{pinned ? "★" : "☆"}</button>
      </div>
    );
  };

  return (
    <section style={{ border: "1px solid #253246", borderRadius: 10, background: "#0f1623", padding: 10 }}>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Recent Files / Favorites</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {favorites.map(renderRow)}
        {recent.map(renderRow)}
        {state.recent.length === 0 ? <div style={{ color: "#95a9bf", fontSize: 12 }}>No recent targets yet.</div> : null}
      </div>
    </section>
  );
}
