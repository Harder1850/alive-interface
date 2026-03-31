interface KeyValueRowProps {
  label: string;
  value: string;
  columns?: string;
}

export function KeyValueRow({ label, value, columns = "190px 1fr" }: KeyValueRowProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: columns, gap: 8 }}>
      <strong style={{ color: "#b8cae0", fontSize: 12 }}>{label}</strong>
      <span style={{ color: "#dbe8f7", fontSize: 12 }}>{value || "--"}</span>
    </div>
  );
}

export function fmtTimestamp(value?: number | string): string {
  if (typeof value === "number") return new Date(value).toLocaleString();
  if (typeof value === "string") {
    const n = Number(value);
    if (!Number.isNaN(n)) return new Date(n).toLocaleString();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
  }
  return "--";
}
