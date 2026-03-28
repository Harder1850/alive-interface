"use strict";
/**
 * ALIVE Runtime Client
 * Wraps the actual runtime pipeline and exposes events for studio plugins
 *
 * MANDATORY: This client MUST connect to alive-runtime/src/wiring/pipeline.ts
 * NOT to mocks. Every event must source from real pipeline execution.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtimeClient = exports.RuntimeClient = void 0;
const events_1 = require("events");
class RuntimeClient {
    constructor() {
        this.eventEmitter = new events_1.EventEmitter();
        this.running = false;
        this.startTime = 0;
        this.signalCount = 0;
        this.trace = new Map();
        this.currentSignalEvents = [];
        this.currentSignalId = '';
    }
    /**
     * Subscribe to runtime events from the actual pipeline
     */
    on(event, handler) {
        this.eventEmitter.on(event, handler);
        return () => this.eventEmitter.removeListener(event, handler);
    }
    /**
     * Send command to runtime
     */
    async executeCommand(cmd) {
        switch (cmd.type) {
            case 'start':
                await this.start(cmd.profile);
                break;
            case 'stop':
                await this.stop();
                break;
            case 'inject_signal':
                await this.injectSignal(cmd.payload);
                break;
            case 'request_status':
                this.emitStatus();
                break;
            case 'clear_trace':
                this.trace.clear();
                this.eventEmitter.emit('trace.cleared', {});
                break;
        }
    }
    /**
     * Start the runtime (initialize connection to pipeline)
     */
    async start(profile) {
        if (this.running) {
            console.warn('[RuntimeClient] Already running');
            return;
        }
        try {
            this.running = true;
            this.startTime = Date.now();
            this.signalCount = 0;
            console.log(`[RuntimeClient] Starting with profile: ${profile || 'default'}`);
            // Emit startup event
            this.eventEmitter.emit('runtime.started', {
                profile: profile || 'default',
                timestamp: Date.now(),
            });
            // In production, this would establish WebSocket or IPC connection
            // to alive-runtime and begin receiving pipeline events
        }
        catch (error) {
            this.running = false;
            this.eventEmitter.emit('runtime.error', {
                error: error instanceof Error ? error.message : String(error),
                stage: 'startup',
            });
            throw error;
        }
    }
    /**
     * Stop the runtime
     */
    async stop() {
        if (!this.running) {
            console.warn('[RuntimeClient] Not running');
            return;
        }
        this.running = false;
        this.eventEmitter.emit('runtime.stopped', { timestamp: Date.now() });
    }
    /**
     * Inject a test signal into the runtime pipeline
     */
    async injectSignal(payload) {
        if (!this.running) {
            this.eventEmitter.emit('runtime.error', {
                error: 'Runtime not running',
                stage: 'inject_signal',
            });
            return;
        }
        const signalId = this.generateSignalId();
        this.currentSignalId = signalId;
        this.currentSignalEvents = [];
        this.signalCount++;
        try {
            // Emit signal received event
            this.emitPipelineEvent({
                type: 'signal.received',
                signal_id: signalId,
                raw_content: payload,
                timestamp: Date.now(),
            });
            console.log(`[RuntimeClient] Injecting signal: ${signalId} with payload: "${payload}"`);
            // In production, this sends to alive-runtime which processes through the actual pipeline
            // The pipeline then emits events back through the connection
            // For now, we route to the local pipeline simulator
            await this.routeThroughPipeline(payload, signalId);
        }
        catch (error) {
            this.emitPipelineEvent({
                type: 'pipeline.error',
                signal_id: signalId,
                error: error instanceof Error ? error.message : String(error),
                stage: 'injection',
            });
        }
    }
    /**
     * Route signal through the actual pipeline
     * WIRED TO: alive-runtime/src/wiring/pipeline.ts
     */
    async routeThroughPipeline(payload, signalId) {
        try {
            // Import the actual pipeline from alive-runtime
            // This ensures we're using REAL execution, not mocks
            // Use require instead of import to avoid TypeScript root Dir issues with external modules
            const pipelineModule = require('../../../../alive-runtime/src/wiring/pipeline');
            const { runPipeline } = pipelineModule;
            // Wrap pipeline to capture events
            const capturedLogs = [];
            const originalLog = console.log;
            console.log = (...args) => {
                const message = args.join(' ');
                capturedLogs.push(message);
                originalLog.apply(console, args);
            };
            try {
                // Run the actual pipeline
                runPipeline(payload);
            }
            finally {
                console.log = originalLog;
                // Parse pipeline logs and emit as events
                this.parseAndEmitPipelineEvents(signalId, capturedLogs, payload);
            }
        }
        catch (error) {
            // If pipeline import fails, emit error
            this.emitPipelineEvent({
                type: 'pipeline.error',
                signal_id: signalId,
                error: error instanceof Error ? error.message : String(error),
                stage: 'pipeline_init',
            });
        }
    }
    /**
     * Parse console logs from pipeline and emit as structured events
     */
    parseAndEmitPipelineEvents(signalId, logs, payload) {
        for (const log of logs) {
            // Example: [PIPELINE] 4. STG       result=OPEN
            if (log.includes('[PIPELINE]') && log.includes('STG')) {
                const verdict = log.includes('OPEN') ? 'OPEN' : log.includes('DENY') ? 'DENY' : 'DEFER';
                this.emitPipelineEvent({
                    type: 'stg.evaluated',
                    signal_id: signalId,
                    verdict: verdict,
                });
            }
            if (log.includes('[PIPELINE]') && log.includes('MIND')) {
                const decisionMatch = log.match(/decision=([^ ]+)/);
                const actionMatch = log.match(/action=([^ ]+)/);
                const confMatch = log.match(/confidence=([^ ]+)/);
                this.emitPipelineEvent({
                    type: 'mind.completed',
                    signal_id: signalId,
                    decision_id: decisionMatch?.[1] || 'unknown',
                    action_type: actionMatch?.[1] || 'unknown',
                    confidence: parseFloat(confMatch?.[1] || '0'),
                });
            }
            if (log.includes('[PIPELINE]') && log.includes('EXECUTE')) {
                const resultMatch = log.match(/result="([^"]+)"/);
                this.emitPipelineEvent({
                    type: 'execution.completed',
                    signal_id: signalId,
                    action_type: 'display_text',
                    result: resultMatch?.[1] || 'completed',
                });
            }
        }
    }
    /**
     * Emit a pipeline event (for internals)
     */
    emitPipelineEvent(event) {
        this.currentSignalEvents.push(event);
        this.eventEmitter.emit('pipeline.event', event);
        this.eventEmitter.emit(`event.${event.type}`, event);
        // If this is a completion event, save trace
        if (event.type === 'execution.completed' || event.type === 'pipeline.error') {
            this.saveTrace();
        }
    }
    /**
     * Save completed trace
     */
    saveTrace() {
        if (!this.currentSignalId || this.currentSignalEvents.length === 0)
            return;
        const trace = {
            signal_id: this.currentSignalId,
            timestamp: Date.now(),
            events: this.currentSignalEvents,
            final_result: this.currentSignalEvents[this.currentSignalEvents.length - 1]?.type,
        };
        this.trace.set(this.currentSignalId, trace);
        this.eventEmitter.emit('trace.updated', trace);
    }
    /**
     * Get current runtime status
     */
    getStatus() {
        return {
            running: this.running,
            mode: 'active',
            signal_count: this.signalCount,
            last_signal: this.currentSignalId,
            uptime_ms: this.running ? Date.now() - this.startTime : 0,
        };
    }
    /**
     * Emit current status
     */
    emitStatus() {
        this.eventEmitter.emit('status.updated', this.getStatus());
    }
    /**
     * Get trace for a signal
     */
    getTrace(signalId) {
        return this.trace.get(signalId);
    }
    /**
     * Get all traces
     */
    getAllTraces() {
        return Array.from(this.trace.values());
    }
    /**
     * Generate unique signal ID
     */
    generateSignalId() {
        return `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.RuntimeClient = RuntimeClient;
// Export singleton instance
exports.runtimeClient = new RuntimeClient();
//# sourceMappingURL=index.js.map