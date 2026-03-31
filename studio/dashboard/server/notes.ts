import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dashboardDir = path.resolve(__dirname, "..");

const notesDir = path.join(dashboardDir, "notes");
const notesFile = path.join(notesDir, "studio-notes.md");

const defaultNotes = `# ALIVE Studio Notes

## Today
- 

## Missing Details / Follow-ups
- 

## Commands to Remember
- npm run dev
`;

export async function getNotes(): Promise<string> {
  try {
    return await fs.readFile(notesFile, "utf-8");
  } catch {
    await fs.mkdir(notesDir, { recursive: true });
    await fs.writeFile(notesFile, defaultNotes, "utf-8");
    return defaultNotes;
  }
}

export async function saveNotes(content: string): Promise<void> {
  await fs.mkdir(notesDir, { recursive: true });
  await fs.writeFile(notesFile, content, "utf-8");
}

export async function getNotesFilePath(): Promise<string> {
  await getNotes();
  return notesFile;
}
