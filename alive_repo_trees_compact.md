# ALIVE Repo Trees (Compact)

## alive-constitution
```text
alive-constitution/
├── .claude/
│   └── settings.local.json
├── .vscode/
│   └── extensions.json
├── amendments/
│   ├── 0001-initial.md
│   └── AMENDMENT-TEMPLATE.md
├── contracts/
│   ├── invariants/
│   │   └── system-invariants.ts
│   ├── action.d.ts
│   ├── action.d.ts.map
│   ├── action.js
│   ├── action.js.map
│   ├── action.ts
│   ├── admissibility.js
│   ├── admissibility.ts
│   ├── authorized-action.ts
│   ├── CONTRACT-TEMPLATE.js
│   ├── CONTRACT-TEMPLATE.ts
│   ├── decision.d.ts
│   ├── decision.d.ts.map
│   ├── decision.js
│   ├── decision.js.map
│   ├── decision.ts
│   ├── flag.d.ts
│   ├── flag.d.ts.map
│   ├── flag.js
│   ├── flag.js.map
│   ├── flag.ts
│   ├── intent-thread.ts
│   ├── intent.ts
│   ├── memory-entry.js
│   ├── memory-entry.ts
│   ├── memory.ts
│   ├── perception.js
│   ├── perception.ts
│   ├── relationship.js
│   ├── relationship.ts
│   ├── signal.d.ts
│   ├── signal.d.ts.map
│   ├── signal.js
│   ├── signal.js.map
│   ├── signal.ts
│   ├── state.ts
│   ├── story.js
│   ├── story.ts
│   ├── symbol.js
│   ├── symbol.ts
│   ├── transition.js
│   └── transition.ts
├── docs/
│   ├── AMENDMENT_POLICY.md
│   ├── BOUNDARY_RULES.md
│   ├── CONSTITUTION_ARCHITECTURE.md
│   ├── HARDENING_PLAN.md
│   └── SLICE_1_5_STATUS.md
├── identity/
│   ├── continuity.js
│   ├── continuity.ts
│   ├── identity-spine.js
│   ├── identity-spine.ts
│   ├── protected-self.js
│   └── protected-self.ts
├── invariants/
│   ├── action-bounds.js
│   ├── action-bounds.ts
│   ├── emergency-bounds.js
│   ├── emergency-bounds.ts
│   ├── INVARIANT-TEMPLATE.js
│   ├── INVARIANT-TEMPLATE.ts
│   ├── memory-bounds.js
│   ├── memory-bounds.ts
│   ├── system-invariants.js
│   └── system-invariants.ts
├── policy/
│   ├── admissibility.js
│   ├── admissibility.ts
│   ├── authorization.js
│   ├── authorization.ts
│   ├── escalation.js
│   ├── escalation.ts
│   ├── validation.js
│   └── validation.ts
├── src/
│   └── main.ts
├── .gitattributes
├── .gitignore
├── ALIVE_WORKING_STATE.md
├── LICENSE
├── package.json
├── README.md
├── SLICE1_STATUS.md
└── tsconfig.json
```

## alive-runtime
```text
alive-runtime/
├── .phase1/
│   ├── loop-status.json
│   └── memory-snapshot.json
├── docs/
│   ├── BOUNDARY_RULES.md
│   ├── ENFORCEMENT_MODEL.md
│   ├── EXECUTION_FLOW.md
│   ├── RUNTIME_ARCHITECTURE.md
│   └── STG_SPEC.md
├── enforcement/
│   ├── direct-dispatch-guard.ts
│   ├── reflex-router.ts
│   ├── stg-enforcer.ts
│   └── threat-dictionary.json
├── src/
│   ├── calibration/
│   │   └── calibration-engine.ts
│   ├── comparison-baseline/
│   │   ├── cb-service.d.ts
│   │   ├── cb-service.d.ts.map
│   │   ├── cb-service.js
│   │   ├── cb-service.js.map
│   │   ├── cb-service.ts
│   │   └── cb.ts
│   ├── enforcement/
│   │   ├── admissibility-check.js
│   │   ├── admissibility-check.ts
│   │   ├── emergency-override.ts
│   │   ├── escalation.ts
│   │   ├── executive.d.ts
│   │   ├── executive.d.ts.map
│   │   ├── executive.js
│   │   ├── executive.js.map
│   │   ├── executive.ts
│   │   ├── reflex-router.ts
│   │   ├── rollback.ts
│   │   └── validation-check.ts
│   ├── flags/
│   │   ├── flag-emitter.ts
│   │   ├── flag-store.ts
│   │   └── quorum-accumulator.ts
│   ├── lifecycle/
│   │   ├── idle.ts
│   │   ├── recovery.ts
│   │   ├── shutdown.ts
│   │   └── startup.ts
│   ├── modes/
│   │   ├── alert.ts
│   │   ├── ambient.ts
│   │   ├── emergency.ts
│   │   ├── exploration.ts
│   │   ├── recovery.ts
│   │   └── task.ts
│   ├── phase1/
│   │   ├── action-whitelist.ts
│   │   ├── intent-handler.ts
│   │   ├── phase1-runtime.ts
│   │   ├── proving-scenario.ts
│   │   └── proving-types.ts
│   ├── router/
│   │   ├── action-router.ts
│   │   ├── factory.ts
│   │   ├── memory-router.ts
│   │   ├── signal-router.js
│   │   └── signal-router.ts
│   ├── scheduler/
│   │   ├── exploration-scheduler.ts
│   │   ├── job-runner.ts
│   │   └── priority-queue.ts
│   ├── stg/
│   │   ├── stg-policy.ts
│   │   ├── stop-thinking-gate.d.ts
│   │   ├── stop-thinking-gate.d.ts.map
│   │   ├── stop-thinking-gate.js
│   │   ├── stop-thinking-gate.js.map
│   │   └── stop-thinking-gate.ts
│   ├── triage/
│   │   ├── triage-service.d.ts
│   │   ├── triage-service.d.ts.map
│   │   ├── triage-service.js
│   │   ├── triage-service.js.map
│   │   └── triage-service.ts
│   ├── wiring/
│   │   ├── body-bridge.js
│   │   ├── body-bridge.ts
│   │   ├── constitution-loader.ts
│   │   ├── interface-bridge.ts
│   │   ├── mind-bridge.js
│   │   ├── mind-bridge.ts
│   │   ├── pipeline.d.ts
│   │   ├── pipeline.d.ts.map
│   │   ├── pipeline.js
│   │   ├── pipeline.js.map
│   │   ├── pipeline.ts
│   │   ├── slice1-cycle.ts
│   │   ├── slice2-demo.ts
│   │   ├── slice3-demo.ts
│   │   └── start-bridge.ts
│   ├── cycle.ts
│   ├── ENFORCEMENT-TEMPLATE.ts
│   ├── index.js
│   ├── index.ts
│   ├── main.ts
│   └── smoke-test.ts
├── tests/
│   ├── intent-path.test.ts
│   ├── proving-scenario.test.ts
│   └── red-team.test.ts
├── .gitattributes
├── .gitignore
├── CONSTITUTION.json
├── LICENSE
├── mission.json
├── package.json
├── README.md
├── smoke-intent.ts
└── tsconfig.json
```

## alive-mind
```text
alive-mind/
├── docs/
│   ├── BOUNDARY_RULES.md
│   ├── MEMORY_ARCHITECTURE.md
│   ├── MEMORY_MODULE_REFACTOR.md
│   ├── MIND_ARCHITECTURE.md
│   └── ROUTING_MODEL.md
├── memory/
│   ├── stories.json
│   └── symbols.json
├── src/
│   ├── calibration/
│   │   ├── confidence.ts
│   │   ├── drift.ts
│   │   ├── error-attribution.ts
│   │   └── threshold-adjustment.ts
│   ├── cognition/
│   │   ├── deliberation/
│   │   ├── inference/
│   │   ├── intent/
│   │   ├── reasoning/
│   │   ├── self-model/
│   │   ├── are.js
│   │   ├── are.ts
│   │   ├── cce.js
│   │   ├── cce.ts
│   │   ├── sve.js
│   │   └── sve.ts
│   ├── decisions/
│   │   ├── action-generator.ts
│   │   ├── contradiction-engine.ts
│   │   ├── cost-risk-uncertainty.ts
│   │   ├── decision-selector.ts
│   │   ├── llm-teacher.ts
│   │   ├── reasoning-engine.ts
│   │   ├── rule-store.ts
│   │   ├── synthesize.js
│   │   ├── synthesize.ts
│   │   ├── transition-predictor.ts
│   │   └── value-model.ts
│   ├── learning/
│   │   ├── compression/
│   │   ├── ltg/
│   │   └── reinforcement-decay/
│   ├── memory/
│   │   ├── ltm/
│   │   ├── stm/
│   │   ├── uc/
│   │   ├── activation-engine.ts
│   │   ├── associative-graph.ts
│   │   ├── consolidator.ts
│   │   ├── contradiction-store.js
│   │   ├── contradiction-store.ts
│   │   ├── derived-memory.ts
│   │   ├── encoding-engine.ts
│   │   ├── episode-store.ts
│   │   ├── episodic-memory.ts
│   │   ├── experience-stream.ts
│   │   ├── index.ts
│   │   ├── lifecycle-engine.ts
│   │   ├── memory-encoder.ts
│   │   ├── memory-orchestrator.ts
│   │   ├── memory-recall.ts
│   │   ├── memory-types.ts
│   │   ├── outcome-buffer.ts
│   │   ├── phase1-memory.ts
│   │   ├── procedure-library.ts
│   │   ├── recall-engine.ts
│   │   ├── reference-adapter.ts
│   │   ├── reference-memory.ts
│   │   ├── reference-store.ts
│   │   ├── relationship-engine.ts
│   │   ├── retrieval-policy.ts
│   │   ├── rule-store.js
│   │   ├── rule-store.ts
│   │   ├── semantic-graph.ts
│   │   ├── story-engine.ts
│   │   ├── structural-memory.ts
│   │   ├── symbol-engine.ts
│   │   ├── thread-store.ts
│   │   ├── trust-engine.ts
│   │   ├── types.ts
│   │   └── working-memory.ts
│   ├── spine/
│   │   ├── attention-buffer.ts
│   │   ├── conscious-buffer.ts
│   │   ├── mind-loop.d.ts
│   │   ├── mind-loop.d.ts.map
│   │   ├── mind-loop.js
│   │   ├── mind-loop.js.map
│   │   ├── mind-loop.ts
│   │   ├── phase1-cognition-loop.ts
│   │   └── state-model.ts
│   ├── index.ts
│   └── MODULE-TEMPLATE.ts
├── tests/
│   ├── memory-orchestrator-integration.test.ts
│   ├── memory-refactor.test.ts
│   └── phase1-memory-mvp.test.ts
├── .env
├── .env.example
├── .gitattributes
├── .gitignore
├── LICENSE
├── package.json
├── README.md
└── tsconfig.json
```

## alive-body
```text
alive-body/
├── docs/
│   ├── BODY_ARCHITECTURE.md
│   ├── BOUNDARY_RULES.md
│   ├── FIREWALL_MODEL.md
│   └── SAFE_STATE_MODEL.md
├── logs/
│   └── experience-stream.jsonl
├── src/
│   ├── actuators/
│   │   ├── command-dispatch.ts
│   │   ├── executor.d.ts
│   │   ├── executor.d.ts.map
│   │   ├── executor.js
│   │   ├── executor.js.map
│   │   ├── executor.py
│   │   ├── executor.ts
│   │   ├── proving-executor.ts
│   │   └── reversible-actions.ts
│   ├── adapters/
│   │   ├── devices/
│   │   ├── external/
│   │   ├── filesystem/
│   │   ├── network/
│   │   ├── ADAPTER-TEMPLATE.ts
│   │   ├── base-adapter.ts
│   │   ├── cpu-adapter.ts
│   │   ├── cpu-monitor.ts
│   │   ├── disk-adapter.ts
│   │   └── fs-watcher-adapter.ts
│   ├── autonomic/
│   │   ├── anomaly-detection.ts
│   │   ├── autonomic_layer.py
│   │   ├── health.ts
│   │   └── resources.ts
│   ├── logging/
│   │   ├── execution-log.d.ts
│   │   ├── execution-log.d.ts.map
│   │   ├── execution-log.js
│   │   ├── execution-log.js.map
│   │   ├── execution-log.ts
│   │   ├── experience-stream.ts
│   │   ├── feedback.ts
│   │   └── incidents.ts
│   ├── nervous-system/
│   │   ├── emergency-stop.ts
│   │   ├── event-bus.ts
│   │   ├── external-firewall.ts
│   │   ├── firewall.d.ts
│   │   ├── firewall.d.ts.map
│   │   ├── firewall.js
│   │   ├── firewall.js.map
│   │   ├── firewall.ts
│   │   ├── hibernate-safe.ts
│   │   ├── input-guard.ts
│   │   ├── interrupt-manager.ts
│   │   ├── output-guard.ts
│   │   ├── safe-mode.ts
│   │   └── safeguards.ts
│   ├── sensors/
│   │   ├── environment.ts
│   │   ├── filtering.d.ts
│   │   ├── filtering.d.ts.map
│   │   ├── filtering.js
│   │   ├── filtering.js.map
│   │   ├── filtering.ts
│   │   ├── ingestion.d.ts
│   │   ├── ingestion.d.ts.map
│   │   ├── ingestion.js
│   │   ├── ingestion.js.map
│   │   ├── ingestion.ts
│   │   ├── microphone.ts
│   │   ├── mock-camera.ts
│   │   ├── normalization.ts
│   │   ├── sensor-registry.ts
│   │   ├── signal-quality.ts
│   │   ├── system-info.ts
│   │   └── weather.ts
│   ├── tools/
│   │   ├── captains-log.ts
│   │   ├── file-manager.d.ts
│   │   ├── file-manager.d.ts.map
│   │   ├── file-manager.js
│   │   ├── file-manager.js.map
│   │   ├── file-manager.ts
│   │   └── notifier.ts
│   └── index.ts
├── tests/
│   └── hardening.test.ts
├── .gitattributes
├── .gitignore
├── ALIVE_Cleanup_Cline_Instructions.md
├── IMPLEMENTATION_SUMMARY.md
├── LICENSE
├── package.json
├── README.md
└── tsconfig.json
```

## alive-interface
```text
alive-interface/
├── .claude/
│   └── settings.local.json
├── .vscode/
│   └── settings.json
├── docs/
│   ├── backbone-freeze-audit.md
│   ├── BOUNDARY_RULES.md
│   ├── INTERFACE_ARCHITECTURE.md
│   ├── proving-scenario-audit.md
│   ├── proving-scenario-handoff-for-claude.md
│   ├── proving-scenario-runbook.md
│   └── UI_BOUNDARY_RULES.md
├── packages/
│   ├── runtime-client/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared-types/
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── plugins/
│   ├── alive-launcher/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── alive-logs/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── alive-signals/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── alive-state/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── alive-trace/
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── scripts/
│   ├── windows/
│   │   ├── Start-AliveStudio.cmd
│   │   └── Start-AliveStudio.ps1
│   ├── backbone-freeze-check.mjs
│   ├── demo-inspect.mjs
│   ├── demo-reset.mjs
│   └── generate_repo_trees.py
├── src/
│   ├── adapters/
│   │   ├── api-client/
│   │   └── websocket/
│   ├── audit/
│   │   ├── action-trace/
│   │   ├── constitution-audit/
│   │   └── memory-audit/
│   ├── controls/
│   │   ├── authorization/
│   │   ├── mode-controls/
│   │   └── overrides/
│   ├── views/
│   │   ├── decisions/
│   │   ├── memory/
│   │   ├── runtime/
│   │   └── state/
│   └── index.ts
├── studio/
│   ├── dashboard/
│   │   ├── notes/
│   │   ├── server/
│   │   ├── src/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── tsconfig.json
│   │   ├── vite.config.mjs
│   │   └── vite.config.ts
│   ├── docs/
│   │   ├── ALIVE_STUDIO_ARCHITECTURE.md
│   │   └── ALIVE_STUDIO_RUNBOOK.md
│   ├── packages/
│   │   ├── runtime-client/
│   │   └── shared-types/
│   ├── plugins/
│   │   ├── alive-launcher/
│   │   ├── alive-logs/
│   │   ├── alive-signals/
│   │   ├── alive-state/
│   │   └── alive-trace/
│   ├── theia-app/
│   │   ├── public/
│   │   ├── src/
│   │   ├── esbuild.config.mjs
│   │   ├── package.json
│   │   ├── tsconfig.client.json
│   │   └── tsconfig.json
│   ├── package.json
│   └── README.md
├── tests/
├── theia-app/
│   ├── src/
│   │   ├── index.html
│   │   └── main.ts
│   ├── index.html
│   ├── package.json
│   ├── server.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── .gitattributes
├── .gitignore
├── 00_START_HERE.md
├── alive_repo_trees.md
├── alive_repo_trees_compact.md
├── ALIVE_STUDIO.md
├── BUILD_FIXES_SUMMARY.md
├── DEPLOYMENT.md
├── HANDOFF.md
├── LICENSE
├── package.json
├── README.md
├── STUDIO_BUILD_SUMMARY.md
└── tsconfig.json
```

