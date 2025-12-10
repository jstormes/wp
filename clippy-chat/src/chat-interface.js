/**
 * Chat Interface Component for Clippy Chat
 * Handles the message list and input area inside the chat bubble
 */

import { MarkdownFormatter } from './markdown-formatter.js';

class ChatInterface {
  constructor(containerElement, config = {}) {
    if (!containerElement) {
      throw new Error('Container element is required');
    }

    this.container = containerElement;
    this.config = {
      placeholder: config.placeholder || 'Type a message...',
      sendButtonText: config.sendButtonText || 'Send',
      autoGreeting: config.autoGreeting || null,
      theme: config.theme || {}
    };

    this.messageList = null;
    this.inputArea = null;
    this.inputField = null;
    this.sendButton = null;
    this.typingIndicator = null;

    this.onSendMessage = config.onSendMessage || null;

    // Initialize markdown formatter
    this.markdownFormatter = new MarkdownFormatter();

    this._create();
  }

  /**
   * Create the chat interface DOM structure
   * @private
   */
  _create() {
    // Clear container
    this.container.innerHTML = '';

    // Create message list area
    this.messageList = document.createElement('div');
    this.messageList.className = 'clippy-message-list';
    this.messageList.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 15px;
      background: #f5f5f5;
    `;

    // Create typing indicator (hidden by default)
    this.typingIndicator = document.createElement('div');
    this.typingIndicator.className = 'clippy-typing-indicator';
    this.typingIndicator.style.cssText = `
      display: none;
      padding: 10px 15px;
      font-size: 12px;
      color: #666;
      font-style: italic;
      background: #fff;
      border-top: 1px solid #e0e0e0;
    `;
    this.typingIndicator.textContent = 'Clippy is typing...';

    // Create input area
    this.inputArea = document.createElement('div');
    this.inputArea.className = 'clippy-input-area';
    this.inputArea.style.cssText = `
      display: flex;
      padding: 15px;
      gap: 10px;
      background: white;
      border-top: 1px solid #e0e0e0;
    `;

    // Create input field
    this.inputField = document.createElement('input');
    this.inputField.type = 'text';
    this.inputField.className = 'clippy-input-field';
    this.inputField.placeholder = this.config.placeholder;
    this.inputField.style.cssText = `
      flex: 1;
      padding: 10px 12px;
      border: 2px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    `;
    this.inputField.onfocus = () => this.inputField.style.borderColor = '#667eea';
    this.inputField.onblur = () => this.inputField.style.borderColor = '#ddd';

    // Handle Enter key
    this.inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._handleSend();
      }
    });

    // Create send button
    this.sendButton = document.createElement('button');
    this.sendButton.className = 'clippy-send-button';
    this.sendButton.textContent = this.config.sendButtonText;
    this.sendButton.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    `;
    this.sendButton.onmouseover = () => {
      this.sendButton.style.transform = 'translateY(-2px)';
      this.sendButton.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
    };
    this.sendButton.onmouseout = () => {
      this.sendButton.style.transform = 'translateY(0)';
      this.sendButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
    };
    this.sendButton.onclick = () => this._handleSend();

    // Assemble
    this.inputArea.appendChild(this.inputField);
    this.inputArea.appendChild(this.sendButton);

    this.container.appendChild(this.messageList);
    this.container.appendChild(this.typingIndicator);
    this.container.appendChild(this.inputArea);

    // Show auto greeting if configured
    if (this.config.autoGreeting) {
      this.addMessage('assistant', this.config.autoGreeting);
    }
  }

  /**
   * Handle send button click or Enter key
   * @private
   */
  _handleSend() {
    const text = this.inputField.value.trim();
    if (!text) return;

    // Clear input
    this.inputField.value = '';

    // Add user message
    this.addMessage('user', text);

    // Call callback
    if (this.onSendMessage) {
      this.onSendMessage(text);
    }
  }

  /**
   * Format markdown text to HTML using the markdown formatter
   * @private
   * @param {string} text - Markdown text to format
   * @returns {string} HTML output
   */
  _formatMessage(text) {
    return this.markdownFormatter.format(text);
  }

  /**
   * Add a message to the chat
   * @param {string} role - 'user' or 'assistant'
   * @param {string} content - Message text
   */
  addMessage(role, content) {
    const messageElem = document.createElement('div');
    messageElem.className = `clippy-message clippy-message-${role}`;

    const isUser = role === 'user';
    messageElem.style.cssText = `
      margin-bottom: 12px;
      display: flex;
      justify-content: ${isUser ? 'flex-end' : 'flex-start'};
    `;

    const bubble = document.createElement('div');
    bubble.className = 'clippy-message-bubble';

    // Format the message with markdown support
    bubble.innerHTML = this._formatMessage(content);

    bubble.style.cssText = `
      max-width: 70%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
      word-wrap: break-word;
      background: ${isUser ? '#667eea' : '#ffffff'};
      color: ${isUser ? 'white' : '#333'};
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    `;

    messageElem.appendChild(bubble);
    this.messageList.appendChild(messageElem);

    // Auto-scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Show typing indicator
   */
  showTyping() {
    if (this.typingIndicator) {
      this.typingIndicator.style.display = 'block';
    }
  }

  /**
   * Hide typing indicator
   */
  hideTyping() {
    if (this.typingIndicator) {
      this.typingIndicator.style.display = 'none';
    }
  }

  /**
   * Clear all messages
   */
  clearMessages() {
    if (this.messageList) {
      this.messageList.innerHTML = '';

      // Re-add auto greeting if configured
      if (this.config.autoGreeting) {
        this.addMessage('assistant', this.config.autoGreeting);
      }
    }
  }

  /**
   * Scroll to bottom of message list
   */
  scrollToBottom() {
    if (this.messageList) {
      this.messageList.scrollTop = this.messageList.scrollHeight;
    }
  }

  /**
   * Focus the input field
   */
  focus() {
    if (this.inputField) {
      this.inputField.focus();
    }
  }

  /**
   * Disable input (e.g., while waiting for response)
   */
  disableInput() {
    if (this.inputField) this.inputField.disabled = true;
    if (this.sendButton) this.sendButton.disabled = true;
  }

  /**
   * Enable input
   */
  enableInput() {
    if (this.inputField) this.inputField.disabled = false;
    if (this.sendButton) this.sendButton.disabled = false;
  }

  /**
   * Set input placeholder text
   * @param {string} text
   */
  setPlaceholder(text) {
    if (this.inputField) {
      this.inputField.placeholder = text;
    }
  }

  /**
   * Destroy the interface
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.messageList = null;
    this.inputArea = null;
    this.inputField = null;
    this.sendButton = null;
    this.typingIndicator = null;
  }
}

// Export for ES modules
export { ChatInterface };

// For browser usage via rollup build
if (typeof window !== 'undefined') {
  window.ChatInterface = ChatInterface;
}

// ========================================
// INLINE TEST (run with: node src/chat-interface.js)
// ========================================
if (typeof require !== 'undefined' && require.main === module) {
  console.log('🧪 Running inline tests for ChatInterface...\n');

  // For Node.js testing, we need JSDOM
  try {
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;

    console.log('✅ JSDOM environment loaded\n');
  } catch (error) {
    console.log('⚠️  JSDOM not available. Install with: npm install jsdom');
    console.log('Skipping DOM tests.\n');
    process.exit(0);
  }

  // Create container
  const container = document.createElement('div');
  document.body.appendChild(container);

  // Test 1: Create interface
  console.log('Test 1: Create chat interface');
  const chatInterface = new ChatInterface(container);
  console.log('  Created:', chatInterface instanceof ChatInterface);
  console.log('  Has message list:', chatInterface.messageList !== null);
  console.log('  Has input field:', chatInterface.inputField !== null);
  console.log('  ✅ PASSED\n');

  // Test 2: Check structure
  console.log('Test 2: Check interface structure');
  const messageList = container.querySelector('.clippy-message-list');
  const inputArea = container.querySelector('.clippy-input-area');
  const inputField = container.querySelector('.clippy-input-field');
  const sendButton = container.querySelector('.clippy-send-button');
  console.log('  Has message list:', messageList !== null);
  console.log('  Has input area:', inputArea !== null);
  console.log('  Has input field:', inputField !== null);
  console.log('  Has send button:', sendButton !== null);
  if (!messageList || !inputArea || !inputField || !sendButton) {
    throw new Error('Missing interface elements');
  }
  console.log('  ✅ PASSED\n');

  // Test 3: Add user message
  console.log('Test 3: Add user message');
  chatInterface.addMessage('user', 'Hello Clippy!');
  const userMessages = container.querySelectorAll('.clippy-message-user');
  console.log('  User messages:', userMessages.length);
  console.log('  Message text:', userMessages[0].textContent);
  if (userMessages.length !== 1 || !userMessages[0].textContent.includes('Hello Clippy!')) {
    throw new Error('Failed to add user message');
  }
  console.log('  ✅ PASSED\n');

  // Test 4: Add assistant message
  console.log('Test 4: Add assistant message');
  chatInterface.addMessage('assistant', 'Hello! How can I help?');
  const assistantMessages = container.querySelectorAll('.clippy-message-assistant');
  console.log('  Assistant messages:', assistantMessages.length);
  console.log('  Message text:', assistantMessages[0].textContent);
  if (assistantMessages.length !== 1) {
    throw new Error('Failed to add assistant message');
  }
  console.log('  ✅ PASSED\n');

  // Test 5: Show typing indicator
  console.log('Test 5: Show typing indicator');
  chatInterface.showTyping();
  const typingIndicator = container.querySelector('.clippy-typing-indicator');
  console.log('  Typing visible:', typingIndicator.style.display === 'block');
  if (typingIndicator.style.display !== 'block') {
    throw new Error('Failed to show typing indicator');
  }
  console.log('  ✅ PASSED\n');

  // Test 6: Hide typing indicator
  console.log('Test 6: Hide typing indicator');
  chatInterface.hideTyping();
  console.log('  Typing hidden:', typingIndicator.style.display === 'none');
  if (typingIndicator.style.display !== 'none') {
    throw new Error('Failed to hide typing indicator');
  }
  console.log('  ✅ PASSED\n');

  // Test 7: Disable/enable input
  console.log('Test 7: Disable and enable input');
  chatInterface.disableInput();
  console.log('  Input disabled:', inputField.disabled);
  console.log('  Button disabled:', sendButton.disabled);
  if (!inputField.disabled || !sendButton.disabled) {
    throw new Error('Failed to disable input');
  }
  chatInterface.enableInput();
  console.log('  Input enabled:', !inputField.disabled);
  console.log('  Button enabled:', !sendButton.disabled);
  if (inputField.disabled || sendButton.disabled) {
    throw new Error('Failed to enable input');
  }
  console.log('  ✅ PASSED\n');

  // Test 8: Clear messages
  console.log('Test 8: Clear messages');
  const messagesBefore = container.querySelectorAll('.clippy-message').length;
  console.log('  Messages before clear:', messagesBefore);
  chatInterface.clearMessages();
  const messagesAfter = container.querySelectorAll('.clippy-message').length;
  console.log('  Messages after clear:', messagesAfter);
  if (messagesAfter !== 0) {
    throw new Error('Failed to clear messages');
  }
  console.log('  ✅ PASSED\n');

  // Test 9: Auto greeting
  console.log('Test 9: Auto greeting on init');
  const container2 = document.createElement('div');
  const chatWithGreeting = new ChatInterface(container2, {
    autoGreeting: 'Welcome! How can I assist you?'
  });
  const greetingMessages = container2.querySelectorAll('.clippy-message-assistant');
  console.log('  Has greeting:', greetingMessages.length > 0);
  console.log('  Greeting text:', greetingMessages[0].textContent);
  if (greetingMessages.length === 0 || !greetingMessages[0].textContent.includes('Welcome')) {
    throw new Error('Failed to show auto greeting');
  }
  console.log('  ✅ PASSED\n');

  // Test 10: Send callback
  console.log('Test 10: Send message callback');
  let callbackCalled = false;
  let callbackText = '';
  const container3 = document.createElement('div');
  const chatWithCallback = new ChatInterface(container3, {
    onSendMessage: (text) => {
      callbackCalled = true;
      callbackText = text;
    }
  });

  // Simulate sending a message
  const input = container3.querySelector('.clippy-input-field');
  const button = container3.querySelector('.clippy-send-button');
  input.value = 'Test message';
  button.click();

  console.log('  Callback called:', callbackCalled);
  console.log('  Callback text:', callbackText);
  console.log('  Input cleared:', input.value === '');
  if (!callbackCalled || callbackText !== 'Test message' || input.value !== '') {
    throw new Error('Failed to trigger send callback');
  }
  console.log('  ✅ PASSED\n');

  // Test 11: Destroy interface
  console.log('Test 11: Destroy interface');
  chatInterface.destroy();
  console.log('  Message list nullified:', chatInterface.messageList === null);
  console.log('  Input field nullified:', chatInterface.inputField === null);
  if (chatInterface.messageList !== null || chatInterface.inputField !== null) {
    throw new Error('Failed to destroy interface');
  }
  console.log('  ✅ PASSED\n');

  console.log('✅ All inline tests PASSED!');
}
