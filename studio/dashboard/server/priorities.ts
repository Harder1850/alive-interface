import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getNotes } from "./notes";

export interface PriorityItem {
  id: string;
  text: string;
}

export interface PrioritiesSnapshot {
  priorities: PriorityItem[];
  currentBlanks: string[];
  recentImplementationNotes: string[];
  nextTasks: string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dashboardDir = path.resolve(__dirname, "..");
const notesDir = path.join(dashboardDir, "notes");
const prioritiesFile = path.join(notesDir, "priorities.json");

const defaultPriorities: PriorityItem[] = [
  { id: "p1", text: "Finalize memory-module additive wiring plan" },
  { id: "p2", text: "Run runtime test matrix from Studio command bar" },
  { id: "p3", text: "Review constitution docs for routing constraints" },
  { id: "p4", text: "Capture open blanks/decisions in studio notes" },
  { id: "p5", text: "Stabilize dashboard command + status UX" },
];

function parseSectionBullets(markdown: string, heading: string): string[] {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sectionMatch = markdown.match(new RegExp(`##\\s+${escaped}\\s*([\\s\\S]*?)(\\n##\\s+|$)`, "i"));
  if (!sectionMatch) return [];

  const body = sectionMatch[1] ?? "";
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean)
    .slice(0, 8);
}

export async function getPriorities(): Promise<PriorityItem[]> {
  try {
    const raw = await fs.readFile(prioritiesFile, "utf-8");
    const parsed = JSON.parse(raw) as PriorityItem[];
    return parsed.slice(0, 5);
  } catch {
    await fs.mkdir(notesDir, { recursive: true });
    await fs.writeFile(prioritiesFile, JSON.stringify(defaultPriorities, null, 2), "utf-8");
    return defaultPriorities;
  }
}

export async function getPrioritiesSnapshot(): Promise<PrioritiesSnapshot> {
  const [priorities, notes] = await Promise.all([getPriorities(), getNotes()]);

  const currentBlanks = parseSectionBullets(notes, "Missing Details / Follow-ups");
  const recentImplementationNotes = parseSectionBullets(notes, "Today");
  const nextTasks = parseSectionBullets(notes, "Next Tasks");

  return {
    priorities,
    currentBlanks,
    recentImplementationNotes,
    nextTasks,
  };
}
