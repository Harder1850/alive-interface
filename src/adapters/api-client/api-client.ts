/** HTTP API client for Runtime communication. */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = "http://localhost:3000") {
    this.baseUrl = baseUrl;
  }

  async getState(): Promise<unknown> {
    // TODO: implement
    return null;
  }

  async sendCommand(_command: unknown): Promise<unknown> {
    // TODO: implement
    return null;
  }
}
