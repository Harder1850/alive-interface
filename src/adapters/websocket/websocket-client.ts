/** WebSocket client for real-time Runtime state updates. */
export class WebSocketClient {
  private url: string;

  constructor(url = "ws://localhost:3001") {
    this.url = url;
  }

  connect(): void {
    // TODO: implement websocket connection
  }

  onMessage(_handler: (data: unknown) => void): void {
    // TODO: implement
  }

  disconnect(): void {
    // TODO: implement
  }
}
