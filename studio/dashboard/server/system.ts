import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export interface SystemStatus {
  cpuPercent: number;
  ramUsedGb: number;
  ramTotalGb: number;
  diskUsedGb: number;
  diskTotalGb: number;
  timestamp: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function cpuSnapshot(): { idle: number; total: number } {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    const t = cpu.times;
    idle += t.idle;
    total += t.user + t.nice + t.sys + t.idle + t.irq;
  }
  return { idle, total };
}

async function getCpuPercent(): Promise<number> {
  const before = cpuSnapshot();
  await new Promise((r) => setTimeout(r, 150));
  const after = cpuSnapshot();

  const idleDelta = after.idle - before.idle;
  const totalDelta = after.total - before.total;
  const used = totalDelta > 0 ? 1 - idleDelta / totalDelta : 0;
  return round2(Math.max(0, Math.min(100, used * 100)));
}

function bytesToGb(bytes: number): number {
  return round2(bytes / (1024 * 1024 * 1024));
}

async function getDiskUsage(): Promise<{ totalGb: number; usedGb: number }> {
  try {
    const root = path.parse(process.cwd()).root || "/";
    const stats = await fs.statfs(root);
    const bsize = Number(stats.bsize || 1);
    const blocks = Number(stats.blocks || 0);
    const bfree = Number(stats.bfree || 0);
    const total = bsize * blocks;
    const free = bsize * bfree;
    const used = Math.max(0, total - free);
    return { totalGb: bytesToGb(total), usedGb: bytesToGb(used) };
  } catch {
    return { totalGb: 0, usedGb: 0 };
  }
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const cpuPercent = await getCpuPercent();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const disk = await getDiskUsage();

  return {
    cpuPercent,
    ramUsedGb: bytesToGb(usedMem),
    ramTotalGb: bytesToGb(totalMem),
    diskUsedGb: disk.usedGb,
    diskTotalGb: disk.totalGb,
    timestamp: new Date().toISOString(),
  };
}
