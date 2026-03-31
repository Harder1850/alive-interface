import fs from "node:fs/promises";
import path from "node:path";

const runtimePhase1Dir = path.resolve(process.cwd(), "..", "alive-runtime", ".phase1");
const loopFile = path.join(runtimePhase1Dir, "loop-status.json");
const memoryFile = path.join(runtimePhase1Dir, "memory-snapshot.json");

async function readJson(file) {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const loop = await readJson(loopFile);
const memory = await readJson(memoryFile);

console.log("=== ALIVE Phase 1 Inspect ===");
console.log(`phase1 dir: ${runtimePhase1Dir}`);

if (!loop && !memory) {
  console.log("No phase1 artifacts found. Run: npm run demo:trigger");
  process.exit(0);
}

if (loop) {
  console.log("\n[loop-status.json]");
  console.log(`mode: ${loop.mode ?? "--"}`);
  console.log(`last signal: ${loop.lastSignal?.source ?? "--"}/${loop.lastSignal?.kind ?? "--"}`);
  console.log(`candidate action: ${loop.lastCandidateAction ?? "--"}`);
  console.log(`outcome: ${loop.lastOutcome ? `${loop.lastOutcome.success ? "success" : "failure"} - ${loop.lastOutcome.note ?? ""}` : "--"}`);
}

if (memory) {
  const working = Array.isArray(memory.workingMemorySample) ? memory.workingMemorySample : memory.working ?? [];
  const episodes = Array.isArray(memory.recentEpisodesSample) ? memory.recentEpisodesSample : memory.episodes ?? [];
  const refs = Array.isArray(memory.referenceItemSample) ? memory.referenceItemSample : memory.referenceHot ?? [];
  console.log("\n[memory-snapshot.json]");
  console.log(`working items: ${working.length}`);
  console.log(`episodes: ${episodes.length}`);
  console.log(`reference items: ${refs.length}`);
}
