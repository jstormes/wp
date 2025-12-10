/**
 * Semantic Testing Framework - HTTP Client
 */

import type { TestConfig, ChatResponse } from './types.js';

/**
 * HTTP client for agent API calls
 */
export class AgentTestClient {
  private config: TestConfig;

  constructor(config: TestConfig) {
    this.config = config;
  }

  /**
   * Send a chat message to an agent
   */
  async chat(
    agentPath: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<ChatResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const url = `${this.config.baseUrl}/agents/${agentPath}/chat`;

      if (this.config.verbose) {
        console.log(`  [HTTP] POST ${url}`);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, metadata }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json() as ChatResponse;

      if (this.config.verbose) {
        console.log(`  [HTTP] Response received, toolCalls: ${data.data.toolCalls?.length || 0}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
