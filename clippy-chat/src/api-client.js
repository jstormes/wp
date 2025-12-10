/**
 * API Client for Clippy Chat
 * Handles communication with the agent backend API
 */

class APIClient {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || 'http://localhost:8001';
    this.agentPath = config.agentPath || 'front-end';
    this.enableTools = config.enableTools !== false;
    this.timeout = config.timeout || 45000; // 45 seconds
  }

  /**
   * Send a message to the agent API
   * @param {Array} messages - Array of message objects {role, content}
   * @param {Object} options - Additional options (conversationId, etc.)
   * @returns {Promise<string>} - The assistant's response text
   */
  async sendMessage(messages, options = {}) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages must be a non-empty array');
    }

    // Get the last user message for the agents API format
    const lastMessage = messages[messages.length - 1];
    const messageText = lastMessage.content || lastMessage.text || '';

    // Build request body for agents framework API
    const requestBody = {
      message: messageText,
      conversationId: options.conversationId,
      metadata: options.metadata || {}
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.apiUrl}/agents/${this.agentPath}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // Handle agents framework response format
      return this._extractResponseText(data);

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - agent did not respond in time');
      }
      throw error;
    }
  }

  /**
   * Extract text from API response (handles agents framework format)
   * @param {Object} data - Response data from API
   * @returns {string} - Extracted text
   * @private
   */
  _extractResponseText(data) {
    // Handle agents framework format: { success: true, data: { text: "..." } }
    if (data.success && data.data && data.data.text) {
      return data.data.text;
    }

    // Handle direct string response
    if (typeof data.response === 'string') {
      return data.response;
    }

    // Handle object response with text property
    if (data.response && typeof data.response === 'object') {
      if (data.response.text) {
        return data.response.text;
      }
      // Fallback: stringify the response object
      return JSON.stringify(data.response);
    }

    // Handle direct text property
    if (data.text) {
      return data.text;
    }

    // Fallback: no valid response found
    throw new Error('Invalid response format from API');
  }

  /**
   * Check if the agent API is healthy
   * @returns {Promise<Object>} - Health check response
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Agent API unavailable: ${error.message}`);
    }
  }

  /**
   * Get agent configuration
   * @returns {Promise<Object>} - Configuration object
   */
  async getConfig() {
    try {
      const response = await fetch(`${this.apiUrl}/api/config`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Failed to get config: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get agent config: ${error.message}`);
    }
  }
}

// Export for ES modules and CommonJS
export { APIClient };

// For browser usage via rollup build
if (typeof window !== 'undefined') {
  window.APIClient = APIClient;
}

// ========================================
// INLINE TEST (run with: node src/api-client.js)
// ========================================
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].endsWith('api-client.js')) {
  console.log('🧪 Running inline tests for APIClient...\n');

  const client = new APIClient({
    apiUrl: 'http://agent:8088',
    model: 'ai/granite-4.0-h-tiny:7B-Q4_K_M'
  });

  // Test 1: Basic instantiation
  console.log('Test 1: Client instantiation');
  console.log('  API URL:', client.apiUrl);
  console.log('  Model:', client.model);
  console.log('  Enable Tools:', client.enableTools);
  console.log('  ✅ PASSED\n');

  // Test 2: Response text extraction (string format)
  console.log('Test 2: Extract text from string response');
  const mockResponse1 = { response: 'Hello from agent!' };
  const text1 = client._extractResponseText(mockResponse1);
  if (text1 !== 'Hello from agent!') {
    throw new Error('Failed to extract string response');
  }
  console.log('  Extracted:', text1);
  console.log('  ✅ PASSED\n');

  // Test 3: Response text extraction (object format)
  console.log('Test 3: Extract text from object response');
  const mockResponse2 = {
    response: {
      text: 'Found products!',
      toolCalls: [{ toolName: 'searchForProducts' }]
    }
  };
  const text2 = client._extractResponseText(mockResponse2);
  if (text2 !== 'Found products!') {
    throw new Error('Failed to extract object response');
  }
  console.log('  Extracted:', text2);
  console.log('  ✅ PASSED\n');

  // Test 4: Health check (async)
  console.log('Test 4: Health check');
  client.healthCheck()
    .then(health => {
      console.log('  Status:', health.status);
      console.log('  Version:', health.version);
      console.log('  ✅ PASSED\n');

      // Test 5: Get config (async)
      console.log('Test 5: Get agent config');
      return client.getConfig();
    })
    .then(config => {
      console.log('  Model:', config.config.model);
      console.log('  MCP Enabled:', config.mcp.enabled);
      console.log('  ✅ PASSED\n');

      // Test 6: Send actual message
      console.log('Test 6: Send test message to agent');
      return client.sendMessage([
        { role: 'user', content: 'Say hello in 5 words or less' }
      ], { conversationId: 'test-' + Date.now() });
    })
    .then(response => {
      console.log('  Agent response:', response);
      console.log('  ✅ PASSED\n');

      console.log('✅ All inline tests PASSED!');
    })
    .catch(error => {
      console.error('❌ Test failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}
