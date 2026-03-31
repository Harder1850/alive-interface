export type RepoId = "constitution" | "runtime" | "mind" | "body" | "interface";

export interface RepoStatus {
  id: RepoId;
  name: string;
  path: string;
  branch: string;
  dirty: boolean;
  hasReadme: boolean;
  hasDocs: boolean;
  hasPackageJson: boolean;
}

export interface RepoActionState {
  lastResult?: "ok" | "error";
  lastAction?: string;
  lastActionAt?: string;
  lastRefreshedAt?: string;
}

export interface CommandResult {
  ok: boolean;
  output: string;
  command?: string;
}

export interface SystemStatus {
  cpuPercent: number;
  ramUsedGb: number;
  ramTotalGb: number;
  diskUsedGb: number;
  diskTotalGb: number;
  timestamp: string;
}

export interface OutputEntry {
  id: string;
  ts: string;
  title: string;
  ok: boolean;
  body: string;
}

export interface RecentTarget {
  id: string;
  repoId: RepoId;
  target: "root" | "readme" | "docs";
  path: string;
  openedAt: string;
}

export interface TargetsState {
  recent: RecentTarget[];
  favorites: string[];
}

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

export interface Phase1LoopStatus {
  mode?: string;
  note?: string;
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
}

export interface Phase1MemorySnapshot {
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
}

export interface Phase1RuntimeStatus {
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
}
