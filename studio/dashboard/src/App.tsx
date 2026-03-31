import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MemorySnapshotPanel } from "./components/MemorySnapshotPanel";

import { NotesPanel } from "./components/NotesPanel";
import { OutputPanel } from "./components/OutputPanel";
import { PrioritiesPanel } from "./components/PrioritiesPanel";
import { QuickLaunchPanel } from "./components/QuickLaunchPanel";
import { RecentTargetsPanel } from "./components/RecentTargetsPanel";
import { RuntimeStatusPanel } from "./components/RuntimeStatusPanel";
import { RepoCard } from "./components/RepoCard";
import { SystemLoopPanel } from "./components/SystemLoopPanel";
import { StatusBar } from "./components/StatusBar";
import { TopBar } from "./components/TopBar";
import {
  fetchNotes,
  fetchPhase1Loop,
  fetchPhase1Memory,
  fetchPhase1Runtime,
  fetchPrioritiesSnapshot,
  fetchRepos,
  fetchSystem,
  fetchTargets,
  runCommand,
  openRepo,
  runRepo,
  saveNotes,
  setFavorite,
} from "./lib/api";
import type {
  OutputEntry,
  Phase1LoopStatus,
  Phase1MemorySnapshot,
  Phase1RuntimeStatus,
  PrioritiesSnapshot,
  RepoActionState,
  RepoId,
  RepoStatus,
  SystemStatus,
  TargetsState,
} from "./types";

function mkEntry(title: string, ok: boolean, body: string): OutputEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    title,
    ok,
    body,
  };
}

export function App() {
  const timelineAreaRef = useRef<HTMLElement | null>(null);
  const [repos, setRepos] = useState<RepoStatus[]>([]);
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [output, setOutput] = useState<OutputEntry[]>([]);
  const [targets, setTargets] = useState<TargetsState>({ recent: [], favorites: [] });
  const [priorities, setPriorities] = useState<PrioritiesSnapshot | null>(null);
  const [loopStatus, setLoopStatus] = useState<Phase1LoopStatus | null>(null);
  const [memorySnapshot, setMemorySnapshot] = useState<Phase1MemorySnapshot | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<Phase1RuntimeStatus | null>(null);
  const [demoRunStatus, setDemoRunStatus] = useState<"idle" | "running" | "completed" | "failed">("idle");
  const [demoRunMessage, setDemoRunMessage] = useState<string>("Ready.");
  const [repoAction, setRepoAction] = useState<Record<RepoId, RepoActionState>>({
    constitution: {},
    runtime: {},
    mind: {},
    body: {},
    interface: {},
  });

  const pushOutput = useCallback((entry: OutputEntry) => {
    setOutput((prev) => [entry, ...prev].slice(0, 80));
  }, []);

  const refreshAll = useCallback(async () => {
    const [reposRes, systemRes, notesRes, targetsRes, prioritiesRes, loopRes, memoryRes, runtimeRes] = await Promise.all([
      fetchRepos(),
      fetchSystem(),
      fetchNotes(),
      fetchTargets(),
      fetchPrioritiesSnapshot(),
      fetchPhase1Loop(),
      fetchPhase1Memory(),
      fetchPhase1Runtime(),
    ]);
    setRepos(reposRes);
    setSystem(systemRes);
    setNotes(notesRes);
    setTargets(targetsRes);
    setPriorities(prioritiesRes);
    setLoopStatus(loopRes);
    setMemorySnapshot(memoryRes);
    setRuntimeStatus(runtimeRes);
    const now = new Date().toISOString();
    setRepoAction((prev) => {
      const next = { ...prev };
      reposRes.forEach((repo) => {
        next[repo.id] = { ...next[repo.id], lastRefreshedAt: now };
      });
      return next;
    });
  }, []);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const timer = setInterval(() => {
      void Promise.all([fetchSystem(), fetchPhase1Loop(), fetchPhase1Memory(), fetchPhase1Runtime()])
        .then(([systemRes, loopRes, memoryRes, runtimeRes]) => {
          setSystem(systemRes);
          setLoopStatus(loopRes);
          setMemorySnapshot(memoryRes);
          setRuntimeStatus(runtimeRes);
        })
        .catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const refreshReposStatus = useCallback(async () => {
    const reposRes = await fetchRepos();
    setRepos(reposRes);
    const now = new Date().toISOString();
    setRepoAction((prev) => {
      const next = { ...prev };
      reposRes.forEach((repo) => {
        next[repo.id] = { ...next[repo.id], lastRefreshedAt: now };
      });
      return next;
    });
  }, []);

  const refreshRuntimeStatus = useCallback(async () => {
    const [runtimeRes, loopRes] = await Promise.all([fetchPhase1Runtime(), fetchPhase1Loop()]);
    setRuntimeStatus(runtimeRes);
    setLoopStatus(loopRes);
  }, []);

  const refreshMemoryOnly = useCallback(async () => {
    const memoryRes = await fetchPhase1Memory();
    setMemorySnapshot(memoryRes);
  }, []);

  const onOpen = useCallback(
    async (repoId: RepoId, target: "root" | "readme" | "docs") => {
      try {
        const result = await openRepo(repoId, target);
        pushOutput(mkEntry(`open ${repoId} ${target}`, result.ok, result.output));
        const targetsRes = await fetchTargets();
        setTargets(targetsRes);
        setRepoAction((prev) => ({
          ...prev,
          [repoId]: {
            ...prev[repoId],
            lastAction: `open ${target}`,
            lastResult: result.ok ? "ok" : "error",
            lastActionAt: new Date().toISOString(),
          },
        }));
      } catch (error) {
        pushOutput(mkEntry(`open ${repoId} ${target}`, false, error instanceof Error ? error.message : "Open failed"));
        setRepoAction((prev) => ({
          ...prev,
          [repoId]: {
            ...prev[repoId],
            lastAction: `open ${target}`,
            lastResult: "error",
            lastActionAt: new Date().toISOString(),
          },
        }));
      }
    },
    [pushOutput]
  );

  const onRun = useCallback(
    async (repoId: RepoId, action: "tests" | "build") => {
      try {
        const result = await runRepo(repoId, action);
        pushOutput(mkEntry(`run ${repoId} ${action}`, result.ok, result.output));
        setRepoAction((prev) => ({
          ...prev,
          [repoId]: {
            ...prev[repoId],
            lastAction: `run ${action}`,
            lastResult: result.ok ? "ok" : "error",
            lastActionAt: new Date().toISOString(),
          },
        }));
      } catch (error) {
        pushOutput(mkEntry(`run ${repoId} ${action}`, false, error instanceof Error ? error.message : "Run failed"));
        setRepoAction((prev) => ({
          ...prev,
          [repoId]: {
            ...prev[repoId],
            lastAction: `run ${action}`,
            lastResult: "error",
            lastActionAt: new Date().toISOString(),
          },
        }));
      }
    },
    [pushOutput]
  );

  const onCommand = useCallback(
    async (command: string) => {
      try {
        const result = await runCommand(command);
        pushOutput(mkEntry(`command: ${command}`, result.ok, result.output));
        if (command.trim() === "system") await refreshAll();
      } catch (error) {
        pushOutput(mkEntry(`command: ${command}`, false, error instanceof Error ? error.message : "Command failed"));
      }
    },
    [pushOutput, refreshAll]
  );

  const onSaveNotes = useCallback(
    async (content: string) => {
      await saveNotes(content);
      setNotes(content);
      pushOutput(mkEntry("notes save", true, "Notes saved."));
    },
    [pushOutput]
  );

  const onToggleFavorite = useCallback(async (targetId: string, pinned: boolean) => {
    const state = await setFavorite(targetId, pinned);
    setTargets(state);
  }, []);

  const leftColumn = useMemo(
    () => (
      <aside style={{ display: "grid", gap: 10, alignContent: "start", overflow: "auto", paddingRight: 4 }}>
        {repos.map((repo) => (
          <RepoCard key={repo.id} repo={repo} onOpen={onOpen} onRun={onRun} actionState={repoAction[repo.id]} />
        ))}
      </aside>
    ),
    [repos, onOpen, onRun, repoAction]
  );

  const latestNotice = loopStatus?.lastSignal
    ? `${loopStatus.lastSignal.source ?? "--"}/${loopStatus.lastSignal.kind ?? "--"}`
    : "--";
  const latestReason = loopStatus?.lastReasoningSummary ?? loopStatus?.lastSummary ?? loopStatus?.note ?? "--";
  const latestActionOutcome =
    loopStatus?.lastOutcome?.note ??
    `${loopStatus?.lastCandidateAction ?? runtimeStatus?.lastCandidateAction ?? "--"} / ${runtimeStatus?.lastOutcomeSummary ?? "--"}`;

  const focusTimelineArea = () => {
    timelineAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const runLiveDemo = useCallback(async () => {
    setDemoRunStatus("running");
    setDemoRunMessage("Running proving scenario...");
    try {
      const result = await runRepo("runtime", "phase1:prove");
      pushOutput(mkEntry("run live demo", result.ok, result.output));
      await refreshAll();
      focusTimelineArea();
      if (result.ok) {
        setDemoRunStatus("completed");
        setDemoRunMessage("Proving scenario completed and artifacts refreshed.");
      } else {
        setDemoRunStatus("failed");
        setDemoRunMessage("Scenario command returned an error.");
      }
    } catch (error) {
      setDemoRunStatus("failed");
      setDemoRunMessage(error instanceof Error ? error.message : "Run failed.");
      pushOutput(mkEntry("run live demo", false, error instanceof Error ? error.message : "Run failed"));
      focusTimelineArea();
    }
  }, [pushOutput, refreshAll]);

  return (
    <div
      style={{
        height: "100vh",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        background: "#0b1220",
        color: "#e9f0f8",
        fontFamily: "Inter, Segoe UI, system-ui, sans-serif",
      }}
    >
      <TopBar
        onRefresh={() => {
          void refreshAll();
          pushOutput(mkEntry("refresh", true, "Refreshed repos, system, and notes."));
        }}
        onCommand={onCommand}
      />

      <main
        style={{
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "340px 1fr 360px",
          gap: 12,
          padding: 12,
        }}
      >
        {leftColumn}

        <section style={{ minHeight: 0, display: "grid", gridTemplateRows: "1.3fr 1fr", gap: 12 }}>
          <OutputPanel entries={output} />
          <section ref={timelineAreaRef} style={{ minHeight: 0, overflow: "auto", display: "grid", gap: 12, paddingRight: 4 }}>
            <SystemLoopPanel loop={loopStatus} />
            <RuntimeStatusPanel status={runtimeStatus} />
            <MemorySnapshotPanel snapshot={memorySnapshot} />
          </section>
        </section>

        <section style={{ display: "grid", gap: 12, alignContent: "start", minHeight: 0, overflow: "auto" }}>
          <NotesPanel initialValue={notes} onSave={onSaveNotes} />
          <RecentTargetsPanel state={targets} onOpen={onOpen} onToggleFavorite={onToggleFavorite} />
          <PrioritiesPanel snapshot={priorities} />
          <QuickLaunchPanel
            demoRunStatus={demoRunStatus}
            demoRunMessage={demoRunMessage}
            latestNotice={latestNotice}
            latestReason={latestReason}
            latestActionOutcome={latestActionOutcome}
            onRunLiveDemo={runLiveDemo}
            onInspectLatestCycle={async () => {
              const result = await runRepo("interface", "demo:inspect");
              pushOutput(mkEntry("inspect artifacts", result.ok, result.output));
              await refreshAll();
              focusTimelineArea();
            }}
            onResetDemo={async () => {
              const result = await runRepo("interface", "demo:reset");
              pushOutput(mkEntry("reset demo state", result.ok, result.output));
              await refreshAll();
              setDemoRunStatus("idle");
              setDemoRunMessage("Demo state reset.");
              focusTimelineArea();
            }}
            onRefreshRepos={async () => {
              await refreshReposStatus();
              pushOutput(mkEntry("refresh repo status", true, "Repo status refreshed."));
            }}
            onRefreshRuntime={async () => {
              await refreshRuntimeStatus();
              pushOutput(mkEntry("refresh runtime status", true, "Runtime + loop status refreshed."));
            }}
            onRefreshMemory={async () => {
              await refreshMemoryOnly();
              pushOutput(mkEntry("refresh memory snapshot", true, "Memory snapshot refreshed."));
            }}
            onOpenMind={() => onOpen("mind", "root")}
            onOpenRuntime={() => onOpen("runtime", "root")}
            onOpenBody={() => onOpen("body", "root")}
            onRunMindTests={() => onRun("mind", "tests")}
            onRunRuntimeTests={() => onRun("runtime", "tests")}
            onRunBodyTests={() => onRun("body", "tests")}
            onOpenNotes={() => onCommand("open notes")}
          />
        </section>
      </main>

      <StatusBar system={system} />
    </div>
  );
}
