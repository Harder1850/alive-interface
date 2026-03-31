import type { RepoActionState, RepoStatus } from "../types";

interface RepoCardProps {
  repo: RepoStatus;
  onOpen: (repoId: RepoStatus["id"], target: "root" | "readme" | "docs") => Promise<void> | void;
  onRun: (repoId: RepoStatus["id"], action: "tests" | "build") => Promise<void> | void;
  actionState?: RepoActionState;
}

export function RepoCard({ repo, onOpen, onRun, actionState }: RepoCardProps) {
  return (
    <article
      style={{
        background: "#111a26",
        border: "1px solid #243144",
        borderRadius: 10,
        padding: 10,
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <strong>{repo.name}</strong>
        <span
          style={{
            fontSize: 12,
            padding: "2px 8px",
            borderRadius: 999,
            background: repo.dirty ? "#4b2a2a" : "#1f3f2e",
            color: repo.dirty ? "#ffb4b4" : "#b6ffd1",
          }}
        >
          {repo.dirty ? "dirty" : "clean"}
        </span>
      </div>

      <div style={{ fontSize: 12, color: "#9fb2c8" }}>{repo.path}</div>
      <div style={{ fontSize: 12, color: "#c7d8ea" }}>branch: {repo.branch}</div>
      <div style={{ fontSize: 11, color: "#9fb2c8", display: "grid", gap: 2 }}>
        <div>
          last action: {actionState?.lastAction ?? "--"} {actionState?.lastResult ? `(${actionState.lastResult})` : ""}
        </div>
        <div>last action at: {actionState?.lastActionAt ? new Date(actionState.lastActionAt).toLocaleTimeString() : "--"}</div>
        <div>
          last refreshed: {actionState?.lastRefreshedAt ? new Date(actionState.lastRefreshedAt).toLocaleTimeString() : "--"}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <button onClick={() => onOpen(repo.id, "root")}>Open in VS Code</button>
        <button onClick={() => onOpen(repo.id, "readme")} disabled={!repo.hasReadme}>
          Open README
        </button>
        <button onClick={() => onOpen(repo.id, "docs")} disabled={!repo.hasDocs}>
          Open Docs
        </button>
        <button onClick={() => onRun(repo.id, "tests")} disabled={!repo.hasPackageJson}>
          Run Tests
        </button>
        <button onClick={() => onRun(repo.id, "build")} disabled={!repo.hasPackageJson}>
          Run Build
        </button>
      </div>
    </article>
  );
}
