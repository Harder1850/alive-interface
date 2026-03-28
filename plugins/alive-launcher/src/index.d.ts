/**
 * ALIVE Launcher Plugin
 * Start/stop ALIVE runtime, select profile, display status
 */
export declare class LauncherPlugin {
    private statusElement;
    private isRunning;
    activate(): Promise<void>;
    private createUI;
    private attachListeners;
    private start;
    private stop;
    private updateStatus;
    private displayStatus;
    private updateButtonStates;
}
export declare const launcher: LauncherPlugin;
//# sourceMappingURL=index.d.ts.map