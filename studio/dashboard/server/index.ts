import cors from "cors";
import express from "express";

import { executeCommandBar, openTarget, runRepoScript } from "./commands";
import { getNotes, saveNotes } from "./notes";
import { readLoopStatus, readMemorySnapshot, readRuntimeStatus } from "./phase1";
import { getPriorities, getPrioritiesSnapshot } from "./priorities";
import { getReposStatus, type RepoId } from "./repos";
import { getSystemStatus } from "./system";
import { getTargetsState, setFavorite } from "./targets";

const app = express();
const port = 4174;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function isRepoId(value: string): value is RepoId {
  return ["constitution", "runtime", "mind", "body", "interface"].includes(value);
}

app.get("/api/repos", async (_req, res) => {
  try {
    const repos = await getReposStatus();
    res.json(repos);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load repos." });
  }
});

app.post("/api/open", async (req, res) => {
  const repoId = String(req.body?.repoId ?? "").toLowerCase();
  const target = String(req.body?.target ?? "root").toLowerCase();

  if (!isRepoId(repoId)) {
    res.status(400).json({ error: "Invalid repoId" });
    return;
  }
  if (!["root", "readme", "docs"].includes(target)) {
    res.status(400).json({ error: "Invalid target" });
    return;
  }

  try {
    const result = await openTarget(repoId, target as "root" | "readme" | "docs");
    res.json(result);
  } catch (error) {
    res.status(500).json({ ok: false, output: error instanceof Error ? error.message : "Open command failed." });
  }
});

app.post("/api/run", async (req, res) => {
  const repoId = String(req.body?.repoId ?? "").toLowerCase();
  const action = String(req.body?.action ?? "").trim();

  if (!isRepoId(repoId)) {
    res.status(400).json({ error: "Invalid repoId" });
    return;
  }
  if (!action) {
    res.status(400).json({ error: "Missing action" });
    return;
  }

  const result = await runRepoScript(repoId, action);
  res.json(result);
});

app.get("/api/system", async (_req, res) => {
  try {
    const status = await getSystemStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load system status." });
  }
});

app.get("/api/notes", async (_req, res) => {
  try {
    const notes = await getNotes();
    res.json({ content: notes });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load notes." });
  }
});

app.post("/api/notes", async (req, res) => {
  const content = String(req.body?.content ?? "");
  try {
    await saveNotes(content);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to save notes." });
  }
});

app.post("/api/command", async (req, res) => {
  const command = String(req.body?.command ?? "");
  try {
    const result = await executeCommandBar(command);
    res.json(result);
  } catch (error) {
    res.status(500).json({ ok: false, output: error instanceof Error ? error.message : "Command failed." });
  }
});

app.get("/api/targets", async (_req, res) => {
  try {
    const state = await getTargetsState();
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load targets." });
  }
});

app.post("/api/targets/favorite", async (req, res) => {
  const targetId = String(req.body?.targetId ?? "");
  const pinned = Boolean(req.body?.pinned);
  if (!targetId) {
    res.status(400).json({ error: "Missing targetId" });
    return;
  }
  try {
    const state = await setFavorite(targetId, pinned);
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update favorite." });
  }
});

app.get("/api/priorities", async (_req, res) => {
  try {
    const items = await getPriorities();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load priorities." });
  }
});

app.get("/api/priorities/snapshot", async (_req, res) => {
  try {
    const snapshot = await getPrioritiesSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load priorities snapshot." });
  }
});

app.get("/api/phase1/loop", async (_req, res) => {
  try {
    const snapshot = await readLoopStatus();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load phase1 loop status." });
  }
});

app.get("/api/phase1/memory", async (_req, res) => {
  try {
    const snapshot = await readMemorySnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load phase1 memory snapshot." });
  }
});

app.get("/api/phase1/runtime", async (_req, res) => {
  try {
    const snapshot = await readRuntimeStatus();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load phase1 runtime status." });
  }
});

app.listen(port, () => {
  console.log(`ALIVE Studio MVP server listening at http://localhost:${port}`);
});
