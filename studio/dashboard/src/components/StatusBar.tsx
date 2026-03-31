import type { SystemStatus } from "../types";

interface StatusBarProps {
  system: SystemStatus | null;
}

export function StatusBar({ system }: StatusBarProps) {
  return (
    <footer
      style={{
        display: "flex",
        gap: 16,
        alignItems: "center",
        padding: "8px 12px",
        borderTop: "1px solid #1f2a38",
        fontSize: 12,
        color: "#b6c7d9",
      }}
    >
      <span>CPU: {system ? `${system.cpuPercent}%` : "--"}</span>
      <span>
        RAM: {system ? `${system.ramUsedGb}/${system.ramTotalGb} GB` : "--"}
      </span>
      <span>
        Disk: {system ? `${system.diskUsedGb}/${system.diskTotalGb} GB` : "--"}
      </span>
      <span style={{ marginLeft: "auto" }}>
        {system ? new Date(system.timestamp).toLocaleString() : new Date().toLocaleString()}
      </span>
    </footer>
  );
}
