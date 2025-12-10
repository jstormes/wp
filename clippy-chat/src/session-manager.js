/**
 * Session Manager for Clippy Chat
 * Manages conversation state, message history, and session lifecycle
 */

class SessionManager {
  constructor() {
    this.conversationId = null;
    this.messages = [];
    this.isActive = false;
    this.metadata = {};
  }

  /**
   * Start a new conversation session
   * Clears all previous messages and generates a new conversation ID
   * @returns {string} - The new conversation ID
   */
  startNewSession() {
    this.conversationId = this._generateConversationId();
    this.messages = [];
    this.isActive = true;
    this.metadata = {
      startedAt: new Date().toISOString(),
      messageCount: 0
    };

    return this.conversationId;
  }

  /**
   * End the current session
   * Clears conversation state
   */
  endSession() {
    this.isActive = false;
    this.metadata.endedAt = new Date().toISOString();

    // Keep conversationId and messages for potential logging
    // but mark as inactive
  }

  /**
   * Clear all session data
   * Complete reset of the session
   */
  clearSession() {
    this.conversationId = null;
    this.messages = [];
    this.isActive = false;
    this.metadata = {};
  }

  /**
   * Add a user message to the conversation
   * @param {string} content - The message content
   * @returns {Object} - The message object
   */
  addUserMessage(content) {
    if (!this.isActive) {
      throw new Error('Cannot add message: session is not active');
    }

    const message = {
      role: 'user',
      content: content,
      timestamp: new Date().toISOString()
    };

    this.messages.push(message);
    this.metadata.messageCount = this.messages.length;

    return message;
  }

  /**
   * Add an assistant message to the conversation
   * @param {string} content - The message content
   * @returns {Object} - The message object
   */
  addAssistantMessage(content) {
    if (!this.isActive) {
      throw new Error('Cannot add message: session is not active');
    }

    const message = {
      role: 'assistant',
      content: content,
      timestamp: new Date().toISOString()
    };

    this.messages.push(message);
    this.metadata.messageCount = this.messages.length;

    return message;
  }

  /**
   * Add a system message to the conversation
   * @param {string} content - The message content
   * @returns {Object} - The message object
   */
  addSystemMessage(content) {
    if (!this.isActive) {
      throw new Error('Cannot add message: session is not active');
    }

    const message = {
      role: 'system',
      content: content,
      timestamp: new Date().toISOString()
    };

    this.messages.push(message);
    this.metadata.messageCount = this.messages.length;

    return message;
  }

  /**
   * Get all messages in the conversation
   * Returns only role and content (strips timestamps for API compatibility)
   * @returns {Array} - Array of message objects {role, content}
   */
  getMessages() {
    return this.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Get full messages with timestamps
   * @returns {Array} - Array of message objects with timestamps
   */
  getFullMessages() {
    return [...this.messages];
  }

  /**
   * Get the current conversation ID
   * @returns {string|null} - The conversation ID or null if no active session
   */
  getConversationId() {
    return this.conversationId;
  }

  /**
   * Check if session is active
   * @returns {boolean}
   */
  isSessionActive() {
    return this.isActive;
  }

  /**
   * Get session metadata
   * @returns {Object} - Session metadata
   */
  getMetadata() {
    return { ...this.metadata };
  }

  /**
   * Get message count
   * @returns {number} - Number of messages in conversation
   */
  getMessageCount() {
    return this.messages.length;
  }

  /**
   * Generate a unique conversation ID
   * Format: conv-{timestamp}-{random}
   * @returns {string}
   * @private
   */
  _generateConversationId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `conv-${timestamp}-${random}`;
  }

  /**
   * Get last message
   * @returns {Object|null} - Last message or null if no messages
   */
  getLastMessage() {
    if (this.messages.length === 0) return null;
    return { ...this.messages[this.messages.length - 1] };
  }

  /**
   * Get last N messages
   * @param {number} n - Number of messages to retrieve
   * @returns {Array} - Array of last N messages
   */
  getLastNMessages(n) {
    if (n <= 0) return [];
    return this.messages.slice(-n).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }
}

// Export for ES modules
export { SessionManager };

// For browser usage via rollup build
if (typeof window !== 'undefined') {
  window.SessionManager = SessionManager;
}

// ========================================
// INLINE TEST (run with: node src/session-manager.js)
// ========================================
if (typeof require !== 'undefined' && require.main === module) {
  console.log('🧪 Running inline tests for SessionManager...\n');

  // Test 1: Create session manager
  console.log('Test 1: Create session manager');
  const manager = new SessionManager();
  console.log('  Created:', manager instanceof SessionManager);
  console.log('  Active:', manager.isSessionActive());
  console.log('  ✅ PASSED\n');

  // Test 2: Start new session
  console.log('Test 2: Start new session');
  const convId = manager.startNewSession();
  console.log('  Conversation ID:', convId);
  console.log('  ID format valid:', convId.startsWith('conv-'));
  console.log('  Session active:', manager.isSessionActive());
  if (!convId.startsWith('conv-') || !manager.isSessionActive()) {
    throw new Error('Failed to start session');
  }
  console.log('  ✅ PASSED\n');

  // Test 3: Add user message
  console.log('Test 3: Add user message');
  const userMsg = manager.addUserMessage('Hello Clippy!');
  console.log('  Message:', userMsg.content);
  console.log('  Role:', userMsg.role);
  console.log('  Timestamp:', userMsg.timestamp);
  console.log('  Message count:', manager.getMessageCount());
  if (userMsg.role !== 'user' || manager.getMessageCount() !== 1) {
    throw new Error('Failed to add user message');
  }
  console.log('  ✅ PASSED\n');

  // Test 4: Add assistant message
  console.log('Test 4: Add assistant message');
  const assistantMsg = manager.addAssistantMessage('Hello! How can I help you?');
  console.log('  Message:', assistantMsg.content);
  console.log('  Role:', assistantMsg.role);
  console.log('  Message count:', manager.getMessageCount());
  if (assistantMsg.role !== 'assistant' || manager.getMessageCount() !== 2) {
    throw new Error('Failed to add assistant message');
  }
  console.log('  ✅ PASSED\n');

  // Test 5: Get messages
  console.log('Test 5: Get messages');
  const messages = manager.getMessages();
  console.log('  Messages:', JSON.stringify(messages, null, 2));
  console.log('  Count:', messages.length);
  if (messages.length !== 2 || !messages[0].role || messages[0].timestamp) {
    throw new Error('Failed to get messages (timestamps should be stripped)');
  }
  console.log('  ✅ PASSED\n');

  // Test 6: Get full messages (with timestamps)
  console.log('Test 6: Get full messages');
  const fullMessages = manager.getFullMessages();
  console.log('  Has timestamps:', fullMessages[0].timestamp !== undefined);
  if (!fullMessages[0].timestamp) {
    throw new Error('Failed to get full messages with timestamps');
  }
  console.log('  ✅ PASSED\n');

  // Test 7: Get last message
  console.log('Test 7: Get last message');
  const lastMsg = manager.getLastMessage();
  console.log('  Last message role:', lastMsg.role);
  console.log('  Last message content:', lastMsg.content);
  if (lastMsg.role !== 'assistant') {
    throw new Error('Failed to get last message');
  }
  console.log('  ✅ PASSED\n');

  // Test 8: Get metadata
  console.log('Test 8: Get session metadata');
  const metadata = manager.getMetadata();
  console.log('  Started at:', metadata.startedAt);
  console.log('  Message count:', metadata.messageCount);
  if (!metadata.startedAt || metadata.messageCount !== 2) {
    throw new Error('Failed to get metadata');
  }
  console.log('  ✅ PASSED\n');

  // Test 9: End session
  console.log('Test 9: End session');
  manager.endSession();
  console.log('  Session active:', manager.isSessionActive());
  console.log('  Messages preserved:', manager.getMessageCount());
  console.log('  Ended at:', manager.getMetadata().endedAt);
  if (manager.isSessionActive() || manager.getMessageCount() !== 2) {
    throw new Error('Failed to end session properly');
  }
  console.log('  ✅ PASSED\n');

  // Test 10: Clear session
  console.log('Test 10: Clear session');
  manager.clearSession();
  console.log('  Message count:', manager.getMessageCount());
  console.log('  Conversation ID:', manager.getConversationId());
  console.log('  Session active:', manager.isSessionActive());
  if (manager.getMessageCount() !== 0 || manager.getConversationId() !== null) {
    throw new Error('Failed to clear session');
  }
  console.log('  ✅ PASSED\n');

  // Test 11: Multi-session workflow
  console.log('Test 11: Multi-session workflow');
  manager.startNewSession();
  manager.addUserMessage('First session message');
  const firstConvId = manager.getConversationId();
  manager.clearSession();

  manager.startNewSession();
  manager.addUserMessage('Second session message');
  const secondConvId = manager.getConversationId();

  console.log('  First ID:', firstConvId);
  console.log('  Second ID:', secondConvId);
  console.log('  IDs are different:', firstConvId !== secondConvId);

  if (firstConvId === secondConvId) {
    throw new Error('Conversation IDs should be unique');
  }
  console.log('  ✅ PASSED\n');

  console.log('✅ All inline tests PASSED!');
}
