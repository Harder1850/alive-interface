import fs from "node:fs/promises";
import path from "node:path";

const runtimePhase1Dir = path.resolve(process.cwd(), "..", "alive-runtime", ".phase1");

async function removeIfExists(file) {
  try {
    await fs.rm(file, { force: true });
    return true;
  } catch {
    return false;
  }
}

await fs.mkdir(runtimePhase1Dir, { recursive: true });

const loopFile = path.join(runtimePhase1Dir, "loop-status.json");
const memoryFile = path.join(runtimePhase1Dir, "memory-snapshot.json");

const loopRemoved = await removeIfExists(loopFile);
const memoryRemoved = await removeIfExists(memoryFile);

console.log("=== ALIVE Phase 1 Reset ===");
console.log(`phase1 dir: ${runtimePhase1Dir}`);
console.log(`loop-status.json: ${loopRemoved ? "removed" : "already absent"}`);
console.log(`memory-snapshot.json: ${memoryRemoved ? "removed" : "already absent"}`);
