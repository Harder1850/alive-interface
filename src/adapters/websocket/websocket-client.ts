/**
 * WebSocket client for real-time Runtime state updates.
 * Connects to alive-runtime on ws://localhost:7070.
 */
export class WebSocketClient {
  private url: string;
  private ws: WebSocket | null = null;
  private messageHandler: ((data: unknown) => void) | null = null;

  constructor(url = 'ws://localhost:7070/?type=interface') {
    this.url = url;
  }

  connect(): void {
    if (this.ws) return;

    this.ws = new WebSocket(this.url);

    this.ws.addEventListener('open', () => {
      console.log('[WebSocketClient] Connected to', this.url);
    });

    this.ws.addEventListener('message', (event: MessageEvent) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.data as string);
      } catch {
        parsed = event.data;
      }
      this.messageHandler?.(parsed);
    });

    this.ws.addEventListener('close', () => {
      console.log('[WebSocketClient] Disconnected. Reconnecting in 3s...');
      this.ws = null;
      setTimeout(() => this.connect(), 3000);
    });

    this.ws.addEventListener('error', (err) => {
      console.error('[WebSocketClient] Error:', err);
    });
  }

  onMessage(handler: (data: unknown) => void): void {
    this.messageHandler = handler;
  }

  send(message: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocketClient] Cannot send — not connected');
    }
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}
