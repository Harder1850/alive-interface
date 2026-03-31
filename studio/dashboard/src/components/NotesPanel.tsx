import { useEffect, useState } from "react";

interface NotesPanelProps {
  initialValue: string;
  onSave: (content: string) => Promise<void>;
}

export function NotesPanel({ initialValue, onSave }: NotesPanelProps) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <section style={{ border: "1px solid #253246", borderRadius: 10, background: "#0f1623", padding: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Notes</h3>
        <button
          onClick={async () => {
            setSaving(true);
            try {
              await onSave(value);
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          width: "100%",
          minHeight: 240,
          resize: "vertical",
          borderRadius: 8,
          border: "1px solid #2f3a4a",
          background: "#0d1420",
          color: "#f5f7fa",
          padding: 10,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: 12,
        }}
      />
    </section>
  );
}
