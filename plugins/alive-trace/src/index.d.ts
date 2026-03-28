/**
 * ALIVE Trace Plugin
 * Displays ordered trace of events grouped by signal_id
 * WIRED TO: Real pipeline output from alive-runtime/src/wiring/pipeline.ts
 */
export declare class TracePlugin {
    private traceContainer;
    private traces;
    activate(): Promise<void>;
    private createUI;
    private attachListeners;
    private renderTraces;
    private renderTraceEntry;
    private renderEvent;
    private extractEventData;
    private clearTrace;
}
export declare const trace: TracePlugin;
//# sourceMappingURL=index.d.ts.map