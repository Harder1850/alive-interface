/**
 * ALIVE Runtime Client
 * Wraps the actual runtime pipeline and exposes events for studio plugins
 *
 * MANDATORY: This client MUST connect to alive-runtime/src/wiring/pipeline.ts
 * NOT to mocks. Every event must source from real pipeline execution.
 */
import { EventEmitter } from 'events';
import type { InterfaceCommand, RuntimeStatus, TraceEntry } from '@alive-studio/shared-types';
export declare class RuntimeClient {
    private eventEmitter;
    private running;
    private startTime;
    private signalCount;
    private trace;
    private currentSignalEvents;
    private currentSignalId;
    /**
     * Subscribe to runtime events from the actual pipeline
     */
    on(event: string, handler: (data: any) => void): () => EventEmitter<[never]>;
    /**
     * Send command to runtime
     */
    executeCommand(cmd: InterfaceCommand): Promise<void>;
    /**
     * Start the runtime (initialize connection to pipeline)
     */
    private start;
    /**
     * Stop the runtime
     */
    private stop;
    /**
     * Inject a test signal into the runtime pipeline
     */
    private injectSignal;
    /**
     * Route signal through the actual pipeline
     * WIRED TO: alive-runtime/src/wiring/pipeline.ts
     */
    private routeThroughPipeline;
    /**
     * Parse console logs from pipeline and emit as structured events
     */
    private parseAndEmitPipelineEvents;
    /**
     * Emit a pipeline event (for internals)
     */
    private emitPipelineEvent;
    /**
     * Save completed trace
     */
    private saveTrace;
    /**
     * Get current runtime status
     */
    getStatus(): RuntimeStatus;
    /**
     * Emit current status
     */
    private emitStatus;
    /**
     * Get trace for a signal
     */
    getTrace(signalId: string): TraceEntry | undefined;
    /**
     * Get all traces
     */
    getAllTraces(): TraceEntry[];
    /**
     * Generate unique signal ID
     */
    private generateSignalId;
}
export declare const runtimeClient: RuntimeClient;
//# sourceMappingURL=index.d.ts.map