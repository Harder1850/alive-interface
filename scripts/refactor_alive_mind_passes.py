from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[2] / "alive-mind"


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def write(path: str, content: str) -> None:
    p = ROOT / path
    ensure_dir(p.parent)
    p.write_text(content.strip() + "\n", encoding="utf-8")


DIRS = [
    "docs/architecture",
    "docs/specs",
    "docs/build",
    "knowledge/seeded",
    "knowledge/injected",
    "knowledge/manifests",
    "src/public",
    "src/contracts",
    "src/config",
    "src/core",
    "src/ingestion",
    "src/asm",
    "src/baseline",
    "src/autonomic",
    "src/organizer",
    "src/compression",
    "src/threads",
    "src/drives",
    "src/goals",
    "src/attention",
    "src/working-memory",
    "src/symbols",
    "src/concepts",
    "src/agents",
    "src/embodiment",
    "src/memory/orchestrator",
    "src/memory/episodic",
    "src/memory/semantic",
    "src/memory/reference",
    "src/memory/procedural",
    "src/memory/contradiction",
    "src/memory/causal",
    "src/memory/narrative",
    "src/memory/association",
    "src/memory/outcome",
    "src/recall",
    "src/interpretation",
    "src/decision-context",
    "src/decision-types",
    "src/analog",
    "src/candidates",
    "src/evaluation",
    "src/outcome-evaluation",
    "src/simulation",
    "src/dominance",
    "src/delegation",
    "src/conflict",
    "src/budget",
    "src/scheduling",
    "src/learning",
    "src/promotion",
    "src/consolidation",
    "src/world-model",
    "src/story",
    "src/observability",
    "src/self-monitoring",
    "src/reflection",
    "src/utils",
    "src/tests",
]


DOC_SHELL = """# {title}

## Purpose
TODO: define scope and stable guarantees.

## Current status
- scaffold only
- no doctrine finalized here

## Inputs / Outputs
TODO

## Boundaries
TODO

## Open questions
TODO
"""


def main() -> None:
    for d in DIRS:
        ensure_dir(ROOT / d)

    write(
        "AUTHORITY.md",
        """
# ALIVE Mind Authority

## Boundary rules

1. Mind performs cognition only.
2. Runtime owns admission, routing, enforcement, and execution authorization.
3. Body owns sensing and execution only.
4. Interface is relay and presentation only.
5. Constitution is external law and root of trust.
6. Mind has no direct world-execution authority.
7. No hidden cross-repo authority leakage is allowed.

## Implementation guardrails

- Keep imports aligned with repo boundaries.
- Preserve working cognition logic before refactors.
- Use wrappers/re-exports during migration to avoid breaking callers.
""",
    )

    arch_docs = [
        "mind-overview",
        "loop-model",
        "routing-model",
        "memory-model",
        "first-powerful-build",
    ]
    spec_docs = [
        "asm",
        "thread-manager",
        "dominance-engine",
        "always-on-loop",
        "conflict-system",
        "budget-model",
        "learning-system",
        "event-compressor",
        "memory-orchestrator",
        "knowledge-ingestion",
    ]
    build_docs = ["implementation-plan", "dependency-map", "parallel-work-map"]

    for name in arch_docs:
        write(f"docs/architecture/{name}.md", DOC_SHELL.format(title=name.replace("-", " ").title()))
    for name in spec_docs:
        write(f"docs/specs/{name}.md", DOC_SHELL.format(title=name.replace("-", " ").title()))
    for name in build_docs:
        write(f"docs/build/{name}.md", DOC_SHELL.format(title=name.replace("-", " ").title()))

    write(
        "knowledge/README.md",
        """
# Knowledge Folder

This folder stores non-code knowledge artifacts for mind ingestion.

- `seeded/`: static curated starter packs
- `injected/`: operator-provided runtime/ops injections
- `manifests/`: metadata and provenance manifests
""",
    )
    write("knowledge/manifests/README.md", "# Knowledge Manifests\n\nTODO: manifest schema and trust metadata.")
    write("knowledge/seeded/.gitkeep", "")
    write("knowledge/injected/.gitkeep", "")

    write(
        "docs/build/current-to-target-mapping.md",
        """
# Current-to-Target Mapping (Pass 1)

## spine/*
- `src/spine/mind-loop.ts` -> wrap into `src/core/mind-loop.ts` and export in `src/public/process-cognition.ts` (wrapped)
- `src/spine/state-model.ts` -> wrap into `src/asm/state-model.ts` (wrapped)
- `src/spine/attention-buffer.ts` -> `src/attention/attention-buffer.ts` (wrapped)
- `src/spine/conscious-buffer.ts` -> `src/working-memory/conscious-buffer.ts` (wrapped)
- `src/spine/phase1-cognition-loop.ts` -> `src/core/phase1-cognition-loop.ts` (wrapped, preserve)

## memory/*
- Preserve current files as working core.
- Add category wrappers under `src/memory/{orchestrator,episodic,semantic,reference,procedural,contradiction,causal,narrative,association,outcome}`.
- Files likely split later: `phase1-memory.ts`, `memory-orchestrator.ts`, `derived-memory.ts`, `memory-recall.ts`.
- Deprecated later candidates: duplicate emitted js/d.ts siblings in `src/` (build artifacts tracked in source tree).

## decisions/*
- `synthesize.ts` -> `src/candidates/synthesize.ts` (wrapped)
- `decision-selector.ts`, `reasoning-engine.ts` -> `src/evaluation/*` (wrapped)
- `contradiction-engine.ts`, `cost-risk-uncertainty.ts`, `transition-predictor.ts`, `value-model.ts` -> `src/outcome-evaluation/*` (wrapped)

## calibration/*
- Move by wrapper into `src/self-monitoring/*` and `src/learning/*` where appropriate.
- Keep existing placeholders preserved.

## cognition/*
- Preserve `sve.ts`, `cce.ts`, `are.ts`.
- Wrap into `src/interpretation/sve.ts` and `src/evaluation/{cce,are}.ts`.

## docs/*
- Preserve existing architecture docs.
- Add `docs/architecture`, `docs/specs`, and `docs/build` structured shells.

## tests/*
- Preserve existing tests.
- Add compile-safety scaffolding test for new public/contracts/ingestion surfaces.

## Summary classification
- Preserved as-is: most existing `src/memory/*`, `src/spine/*`, `src/decisions/*`, `src/cognition/*`, `tests/*`.
- Wrapped: spine/memory/decisions/calibration/cognition routes into target folders.
- Split later: broad files that mix multiple target domains.
- Deprecated later: source-tracked transpiled artifacts (`*.js`, `*.d.ts`, maps) once cleanup phase is approved.
""",
    )

    wrappers = {
        "src/core/mind-loop.ts": "export * from '../spine/mind-loop';",
        "src/core/phase1-cognition-loop.ts": "export * from '../spine/phase1-cognition-loop';",
        "src/asm/state-model.ts": "export * from '../spine/state-model';",
        "src/attention/attention-buffer.ts": "export * from '../spine/attention-buffer';",
        "src/working-memory/conscious-buffer.ts": "export * from '../spine/conscious-buffer';",
        "src/candidates/synthesize.ts": "export * from '../decisions/synthesize';",
        "src/evaluation/decision-selector.ts": "export * from '../decisions/decision-selector';",
        "src/evaluation/reasoning-engine.ts": "export * from '../decisions/reasoning-engine';",
        "src/evaluation/cce.ts": "export * from '../cognition/cce';",
        "src/evaluation/are.ts": "export * from '../cognition/are';",
        "src/interpretation/sve.ts": "export * from '../cognition/sve';",
        "src/outcome-evaluation/contradiction-engine.ts": "export * from '../decisions/contradiction-engine';",
        "src/outcome-evaluation/cost-risk-uncertainty.ts": "export * from '../decisions/cost-risk-uncertainty';",
        "src/outcome-evaluation/transition-predictor.ts": "export * from '../decisions/transition-predictor';",
        "src/outcome-evaluation/value-model.ts": "export * from '../decisions/value-model';",
        "src/self-monitoring/confidence.ts": "export * from '../calibration/confidence';",
        "src/self-monitoring/drift.ts": "export * from '../calibration/drift';",
        "src/self-monitoring/error-attribution.ts": "export * from '../calibration/error-attribution';",
        "src/learning/threshold-adjustment.ts": "export * from '../calibration/threshold-adjustment';",
        "src/memory/orchestrator/index.ts": "export * from '../memory-orchestrator';",
        "src/memory/episodic/index.ts": "export * from '../episodic-memory';\nexport * from '../episode-store';",
        "src/memory/semantic/index.ts": "export * from '../semantic-graph';",
        "src/memory/reference/index.ts": "export * from '../reference-memory';\nexport * from '../reference-store';\nexport * from '../reference-adapter';",
        "src/memory/procedural/index.ts": "export * from '../procedure-library';",
        "src/memory/contradiction/index.ts": "export * from '../contradiction-store';",
        "src/memory/causal/index.ts": "export * from '../relationship-engine';",
        "src/memory/narrative/index.ts": "export * from '../story-engine';",
        "src/memory/association/index.ts": "export * from '../associative-graph';",
        "src/memory/outcome/index.ts": "export * from '../outcome-buffer';",
    }
    for p, c in wrappers.items():
        write(p, c)

    write(
        "src/contracts/ids.ts",
        """
export type MindId = string;
export type ThreadId = string;
export type GoalId = string;
export type KnowledgeId = string;
export type DecisionId = string;
""",
    )
    write(
        "src/contracts/shared.ts",
        """
export interface Timestamped { createdAt: number; updatedAt: number; }
export interface WithConfidence { confidence: number; }
export interface WithTrust { trust?: number; }
""",
    )
    write(
        "src/contracts/cycle.ts",
        """
import type { DecisionPackage } from './decision-package';

export interface MindInput { signalText: string; source?: string; timestamp: number; }
export interface MindOutput { summary: string; decision: DecisionPackage | null; notes: string[]; }
export interface BaselineCycleInput { hint?: string; timestamp: number; }
export interface BaselineCycleOutput { status: 'ok' | 'deferred'; summary: string; }
""",
    )
    write(
        "src/contracts/decision-context.ts",
        """
export interface DecisionContext {
  threadId?: string;
  goals: string[];
  recalledRefs: string[];
  unresolvedContradictions: string[];
}
""",
    )
    write(
        "src/contracts/decision-package.ts",
        """
export interface DecisionPackage {
  id: string;
  candidateType: string;
  rationale: string;
  confidence: number;
  risk?: number;
}
""",
    )
    write("src/contracts/delegation.ts", "export interface DelegatedTask { id: string; title: string; }\nexport interface DelegatedResult { taskId: string; ok: boolean; note?: string; }")
    write("src/contracts/outcome.ts", "export interface OutcomeInterpretation { summary: string; discrepancyScore?: number; }")
    write("src/contracts/thread.ts", "export interface ThreadContract { id: string; title: string; status: string; }")
    write("src/contracts/goal.ts", "export interface GoalContract { id: string; title: string; priority?: number; }")
    write("src/contracts/drive.ts", "export interface DriveContract { id: string; label: string; }")
    write("src/contracts/symbol.ts", "export interface SymbolContract { id: string; symbol: string; meaning: string; }")
    write("src/contracts/concept.ts", "export interface ConceptContract { id: string; name: string; relatedIds?: string[]; }")
    write("src/contracts/knowledge.ts", "export type KnowledgeSource = 'seeded' | 'injected' | 'learned';\nexport interface KnowledgeRecord { id: string; source: KnowledgeSource; payloadRef: string; }")
    write("src/contracts/error.ts", "export interface MindErrorShape { code: string; message: string; details?: unknown; }")

    write("src/config/constants.ts", "export const MIND_NAME = 'alive-mind';\nexport const DEFAULT_MAX_NOTES = 16;")
    write("src/config/thresholds.ts", "export const thresholds = {\n  confidenceLow: 0.3,\n  confidenceHigh: 0.75,\n  // TODO: unresolved doctrine thresholds remain runtime-owned\n};")
    write("src/config/defaults.ts", "export const defaults = { loopMode: 'baseline' as const, maxCandidates: 5 };")
    write("src/config/build-flags.ts", "export const buildFlags = { experimentalScaffolds: true };")
    write("src/config/feature-flags.ts", "export const featureFlags = { ingestionFrontDoor: true, storyScaffold: true };")

    write("src/utils/ids.ts", "export function makeId(prefix = 'mind'): string { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }")
    write("src/utils/time.ts", "export const now = (): number => Date.now();")
    write("src/utils/math.ts", "export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));")
    write("src/utils/ranking.ts", "export function rankByScore<T extends { score: number }>(items: T[]): T[] { return [...items].sort((a,b) => b.score - a.score); }")
    write("src/utils/collections.ts", "export function unique<T>(items: T[]): T[] { return [...new Set(items)]; }")
    write("src/utils/guards.ts", "export function isNonEmptyString(v: unknown): v is string { return typeof v === 'string' && v.trim().length > 0; }")
    write("src/utils/asserts.ts", "export function assert(condition: unknown, msg: string): asserts condition { if (!condition) throw new Error(msg); }")
    write("src/utils/hashing.ts", "import { createHash } from 'node:crypto';\nexport function hashText(text: string): string { return createHash('sha256').update(text).digest('hex'); }")
    write("src/utils/explain.ts", "export const explainTodo = (label: string): string => `${label} (TODO: doctrine pending)`;")

    write(
        "src/public/process-cognition.ts",
        """
import type { MindInput, MindOutput } from '../contracts/cycle';
import { think } from '../core/mind-loop';

export function processCognition(input: MindInput): MindOutput {
  const signal = { id: `sig-${input.timestamp}`, kind: 'user_input', source: input.source ?? 'interface', timestamp: input.timestamp, raw_content: input.signalText, confidence: 0.6, urgency: 0.4, quality_score: 0.7, payload: null, threat_flag: false } as any;
  const decision = think(signal);
  return { summary: decision.reason, decision: { id: decision.id, candidateType: decision.selected_action.type, rationale: decision.reason, confidence: decision.confidence }, notes: [] };
}
""",
    )
    write("src/public/process-baseline-cycle.ts", "import type { BaselineCycleInput, BaselineCycleOutput } from '../contracts/cycle';\nexport function processBaselineCycle(input: BaselineCycleInput): BaselineCycleOutput { return { status: 'ok', summary: `baseline cycle @ ${input.timestamp}` }; }")
    write("src/public/interpret-intent.ts", "export function interpretIntent(text: string): { intent: string; confidence: number } { return { intent: text.trim(), confidence: 0.5 }; }")
    write("src/public/interpret-outcome.ts", "import type { OutcomeInterpretation } from '../contracts/outcome';\nexport function interpretOutcome(note: string): OutcomeInterpretation { return { summary: note }; }")
    write("src/public/inspect-state.ts", "import { StateModel } from '../asm/state-model';\nconst model = new StateModel();\nexport function inspectState() { return model.get(); }")
    write("src/public/generate-story.ts", "export function generateStory(summary: string): string { return `Story: ${summary}`; }")
    write("src/public/index.ts", "export * from './process-cognition';\nexport * from './process-baseline-cycle';\nexport * from './interpret-intent';\nexport * from './interpret-outcome';\nexport * from './inspect-state';\nexport * from './generate-story';")

    write("src/ingestion/knowledge-intake.ts", "import type { KnowledgeRecord } from '../contracts/knowledge';\nexport function intakeKnowledge(record: KnowledgeRecord): KnowledgeRecord { return record; }")
    write("src/ingestion/seeded-loader.ts", "export function loadSeededKnowledge(): string[] { return []; }")
    write("src/ingestion/injected-loader.ts", "export function loadInjectedKnowledge(): string[] { return []; }")
    write("src/ingestion/knowledge-classifier.ts", "export function classifyKnowledge(text: string): 'seeded' | 'injected' | 'learned' { return text.includes('inject') ? 'injected' : 'seeded'; }")
    write("src/ingestion/knowledge-scope.ts", "export function resolveKnowledgeScope(_text: string): 'local' | 'global' { return 'local'; }")
    write("src/ingestion/knowledge-trust.ts", "export function assignKnowledgeTrust(_text: string): number { return 0.5; }")
    write("src/ingestion/knowledge-routing.ts", "export function routeKnowledge(_text: string): string { return 'memory/reference'; }")
    write("src/ingestion/knowledge-conflict.ts", "export function detectKnowledgeConflict(_text: string): boolean { return false; }")
    write("src/ingestion/knowledge-index.ts", "export function indexKnowledge(_items: string[]): number { return _items.length; }")

    write(
        "src/tests/scaffold-compilation.test.ts",
        """
import test from 'node:test';
import assert from 'node:assert/strict';
import { processBaselineCycle, interpretIntent } from '../public';
import { intakeKnowledge } from '../ingestion/knowledge-intake';
import { makeId } from '../utils/ids';

test('public scaffolds compile and return shaped data', () => {
  const cycle = processBaselineCycle({ timestamp: Date.now() });
  assert.equal(cycle.status, 'ok');
  const intent = interpretIntent('check repo status');
  assert.equal(typeof intent.intent, 'string');
  const id = makeId('k');
  const record = intakeKnowledge({ id, source: 'seeded', payloadRef: 'seed/one' });
  assert.equal(record.id, id);
});
""",
    )

    write(
        "src/index.ts",
        """
/**
 * ALIVE Mind — Entry Point
 * Preserves legacy exports and adds stable public surfaces.
 */
export { think } from './spine/mind-loop';
export { StateModel } from './spine/state-model';
export type { ASMState, MindState, State } from './spine/state-model';
export { findMatchingStory, findStrongLocalMatch } from './memory/derived-memory';
export type { Story } from './memory/derived-memory';
export { evaluateNovelSignal } from './decisions/reasoning-engine';
export * as MemoryRefactor from './memory';
export {
  runPhase1CognitionLoop,
  pushPhase1Outcome,
  getPhase1MemorySnapshot,
  getPhase1LoopSummary,
  getPhase1Orchestrator,
} from './spine/phase1-cognition-loop';

export * from './public';
""",
    )

    print("alive-mind refactor scaffolding generated")


if __name__ == "__main__":
    main()
