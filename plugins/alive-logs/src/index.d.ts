/**
 * ALIVE Logs Plugin
 * Display logs, errors, warnings from runtime
 */
export declare class LogsPlugin {
    private logsContainer;
    private logs;
    private maxLogs;
    activate(): Promise<void>;
    private createUI;
    private attachListeners;
    private captureConsoleLogs;
    private addLog;
    private renderLogs;
    private formatLogEntry;
    private eventToLogMessage;
    private clearLogs;
    private escapeHtml;
}
export declare const logs: LogsPlugin;
//# sourceMappingURL=index.d.ts.map