import fs from "node:fs/promises";
import path from "node:path";

import { getRepoPath } from "./repos";

function phase1Dir(): string {
  return path.join(getRepoPath("runtime"), ".phase1");
}

export interface LoopStatusSnapshot {
  mode?: string;
  deepCognitionOpened?: boolean;
  lastSignal?: {
    id?: string;
    kind?: string;
    source?: string;
    raw?: string;
    ts?: number;
  };
  triageDecision?: {
    novelty?: number;
    relevance?: number;
    contradictionCandidate?: boolean;
    openedDeep?: boolean;
  };
  lastCandidateAction?: string;
  lastCandidateSummary?: string;
  lastSummary?: string;
  lastReasoningSummary?: string;
  lastOutcome?: {
    success?: boolean;
    note?: string;
    timestamp?: number;
  };
  stageTimestamps?: Record<string, number | string>;
  updatedAt?: number;
  warnings?: string[];
  errors?: string[];
  [key: string]: unknown;
}

export interface MemorySnapshot {
  note?: string;
  working?: unknown[];
  episodes?: unknown[];
  structuralNodes?: unknown[];
  referenceHot?: unknown[];
  threadSummaries?: unknown[];
  workingMemorySample?: unknown[];
  recentEpisodesSample?: unknown[];
  referenceItemSample?: unknown[];
  threadSummarySample?: unknown[];
  outcomeBufferSample?: unknown[];
  structuralNodeSample?: unknown[];
  associationSample?: unknown[];
  readOnly?: boolean;
  generatedAt?: number;
  associations?: unknown[];
  [key: string]: unknown;
}

export interface StoryModeSummary {
  noticed: string;
  lookedLike: string;
  decided: string;
  result: string;
  safetyNote: string;
  generatedAt: number;
}

export interface RuntimeStatusSnapshot {
  currentMode: string;
  baselineVigilanceActive: boolean;
  deepCognitionActive: boolean;
  deepCognitionOpened: boolean;
  lastSignal: string;
  lastSignalId: string;
  lastSignalTimestamp: string;
  lastSignalProcessed: string;
  lastCandidateAction: string;
  lastCandidateSummary: string;
  lastLoopResultSummary: string;
  lastOutcomeSummary: string;
  lastOutcomeTimestamp: string;
  loopProcessedTimestamp: string;
  runtimeUpdatedTimestamp: string;
  recentWarnings: string[];
  recentErrors: string[];
  source: "runtime-artifact" | "fallback";
  refreshTimestamp: string;
  storyMode: StoryModeSummary | null;
}

function asObj(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

export async function readLoopStatus(): Promise<unknown> {
  const file = path.join(phase1Dir(), "loop-status.json");
  try {
    const raw = await fs.readFile(file, "utf-8");
    const parsed = asObj(JSON.parse(raw));
    return parsed;
  } catch {
    return {
      mode: "baseline",
      note: "No phase1 loop-status found yet. Run runtime proving scenario first.",
    };
  }
}

export async function readMemorySnapshot(): Promise<unknown> {
  const file = path.join(phase1Dir(), "memory-snapshot.json");
  try {
    const raw = await fs.readFile(file, "utf-8");
    const parsed = asObj(JSON.parse(raw));
    const working = Array.isArray(parsed.workingMemorySample)
      ? parsed.workingMemorySample
      : Array.isArray(parsed.working)
        ? parsed.working
        : [];
    const episodes = Array.isArray(parsed.recentEpisodesSample)
      ? parsed.recentEpisodesSample
      : Array.isArray(parsed.episodes)
        ? parsed.episodes
        : [];
    const referenceItems = Array.isArray(parsed.referenceItemSample)
      ? parsed.referenceItemSample
      : Array.isArray(parsed.referenceHot)
        ? parsed.referenceHot
        : [];
    const threadSummaries = Array.isArray(parsed.threadSummarySample)
      ? parsed.threadSummarySample
      : Array.isArray(parsed.threadSummaries)
        ? parsed.threadSummaries
        : [];
    const outcomeBufferSample = Array.isArray(parsed.outcomeBufferSample) ? parsed.outcomeBufferSample : [];
    const structuralNodes = Array.isArray(parsed.structuralNodeSample)
      ? parsed.structuralNodeSample
      : Array.isArray(parsed.structuralNodes)
        ? parsed.structuralNodes
        : [];
    const associations = Array.isArray(parsed.associationSample)
      ? parsed.associationSample
      : Array.isArray(parsed.associations)
        ? parsed.associations
        : [];

    return {
      ...parsed,
      working,
      episodes,
      referenceHot: referenceItems,
      threadSummaries,
      outcomeBufferSample,
      structuralNodes,
      associations,
      readOnly: parsed.readOnly !== false,
    };
  } catch {
    return {
      note: "No phase1 memory snapshot found yet. Run runtime proving scenario first.",
      working: [],
      episodes: [],
      structuralNodes: [],
      referenceHot: [],
      threadSummaries: [],
      outcomeBufferSample: [],
      associations: [],
      readOnly: true,
    };
  }
}

function fmtTs(value: unknown): string {
  if (typeof value === "number") return new Date(value).toISOString();
  if (typeof value === "string") {
    const n = Number(value);
    if (!Number.isNaN(n)) return new Date(n).toISOString();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "--" : parsed.toISOString();
  }
  return "--";
}

export async function readRuntimeStatus(): Promise<RuntimeStatusSnapshot> {
  const loop = (await readLoopStatus()) as LoopStatusSnapshot;
  const mode = String(loop.mode ?? "baseline");
  const lastSignal = asObj(loop.lastSignal);
  const signalSummary = [lastSignal.source, lastSignal.kind].filter(Boolean).join("/") || "--";
  const stageTimestamps = asObj(loop.stageTimestamps);
  const hasRuntimeArtifact = loop.note === undefined;

  return {
    currentMode: mode,
    baselineVigilanceActive: mode === "baseline" || mode === "deep",
    deepCognitionActive: mode === "deep" || Boolean(loop.triageDecision?.openedDeep),
    deepCognitionOpened: Boolean(loop.deepCognitionOpened ?? loop.triageDecision?.openedDeep),
    lastSignal: signalSummary,
    lastSignalId: String(lastSignal.id ?? "--"),
    lastSignalTimestamp: fmtTs(lastSignal.ts),
    lastSignalProcessed: signalSummary,
    lastCandidateAction: String(loop.lastCandidateAction ?? "--"),
    lastCandidateSummary: String(loop.lastCandidateSummary ?? "--"),
    lastLoopResultSummary: String(loop.lastSummary ?? loop.lastOutcome?.note ?? "No loop result summary yet."),
    lastOutcomeSummary: String(loop.lastOutcome?.note ?? "--"),
    lastOutcomeTimestamp: fmtTs(loop.lastOutcome?.timestamp),
    loopProcessedTimestamp: fmtTs(stageTimestamps.loopProcessedAt),
    runtimeUpdatedTimestamp: fmtTs(loop.updatedAt),
    recentWarnings: Array.isArray(loop.warnings) ? loop.warnings.map(String).slice(0, 5) : [],
    recentErrors: Array.isArray(loop.errors) ? loop.errors.map(String).slice(0, 5) : [],
    source: hasRuntimeArtifact ? "runtime-artifact" : "fallback",
    refreshTimestamp: new Date().toISOString(),
    storyMode: isStoryMode(loop.storyMode) ? loop.storyMode : null,
  };
}

function isStoryMode(value: unknown): value is StoryModeSummary {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.noticed === "string" &&
    typeof v.lookedLike === "string" &&
    typeof v.decided === "string" &&
    typeof v.result === "string" &&
    typeof v.safetyNote === "string"
  );
}
