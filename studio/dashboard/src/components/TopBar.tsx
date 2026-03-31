import { CommandBar } from "./CommandBar";

interface TopBarProps {
  onRefresh: () => void;
  onCommand: (command: string) => Promise<void> | void;
}

export function TopBar({ onRefresh, onCommand }: TopBarProps) {
  return (
    <header
      style={{
        display: "grid",
        gridTemplateColumns: "180px 1fr auto",
        gap: 12,
        alignItems: "center",
        padding: 12,
        borderBottom: "1px solid #1f2a38",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 18 }}>ALIVE Studio</div>
      <CommandBar onRun={onCommand} />
      <button onClick={onRefresh}>Refresh</button>
    </header>
  );
}
