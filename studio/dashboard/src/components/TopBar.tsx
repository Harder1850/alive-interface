interface TopBarProps {
  onRefresh: () => void;
}

export function TopBar({ onRefresh }: TopBarProps) {
  return (
    <header
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 12,
        alignItems: "center",
        padding: 12,
        borderBottom: "1px solid #1f2a38",
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>ALIVE Studio</div>
        <div style={{ fontSize: 12, color: "#9cb4cd" }}>Live local mode</div>
      </div>
      <button onClick={onRefresh}>Refresh</button>
    </header>
  );
}
