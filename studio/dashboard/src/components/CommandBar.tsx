import { useState, type FormEvent, type ChangeEvent } from "react";

interface CommandBarProps {
  onRun: (command: string) => Promise<void> | void;
  placeholder?: string;
}

export function CommandBar({ onRun, placeholder }: CommandBarProps) {
  const [command, setCommand] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        const event = e as FormEvent<HTMLFormElement>;
        event.preventDefault();
        if (!command.trim()) return;
        await onRun(command);
        setCommand("");
      }}
      style={{ display: "flex", gap: 8, width: "100%" }}
    >
      <input
        value={command}
        onChange={(e) => {
          const event = e as ChangeEvent<HTMLInputElement>;
          setCommand(event.target.value);
        }}
        placeholder={placeholder ?? "Try: help | system | open mind root | run runtime tests"}
        style={{
          flex: 1,
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #2f3a4a",
          background: "#0d1420",
          color: "#f5f7fa",
        }}
      />
      <button type="submit">Run</button>
    </form>
  );
}
