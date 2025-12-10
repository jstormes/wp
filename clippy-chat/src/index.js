/**
 * Clippy Chat Widget - Main Entry Point
 * Embeddable AI chat widget with animated Clippy character
 */

// Import ClippyJS (will be bundled by rollup)
// Note: In browser, clippy is loaded via separate script tag

// Import our modules
import { APIClient } from './api-client.js';
import { SessionManager } from './session-manager.js';
import { AnimationController } from './animation-controller.js';
import { ChatBubble } from './chat-bubble.js';
import { ChatInterface } from './chat-interface.js';
import { PageReader } from './page-reader.js';

/**
 * Main ClippyChat Widget Controller
 */
class ClippyChatWidget {
  constructor() {
    this.config = null;
    this.clippyAgent = null;
    this.apiClient = null;
    this.sessionManager = null;
    this.animationController = null;
    this.chatBubble = null;
    this.chatInterface = null;
    this.pageReader = null;
    this.isInitialized = false;
    this.clippyPosition = { x: 0, y: 0 };
  }

  /**
   * Initialize the Clippy Chat widget
   * @param {Object} config - Configuration options
   */
  async init(config = {}) {
    if (this.isInitialized) {
      console.warn('ClippyChat already initialized');
      return;
    }

    // Merge default config
    this.config = {
      // API Configuration
      apiUrl: config.apiUrl || 'http://localhost:8001',
      agentPath: config.agentPath || 'front-end',
      enableTools: config.enableTools !== false,

      // Clippy Configuration
      clippyPosition: config.clippyPosition || 'bottom-right',
      clippyOffsetX: config.clippyOffsetX || 20,
      clippyOffsetY: config.clippyOffsetY || 20,
      clippyAgentPath: config.clippyAgentPath || 'vendor/clippyjs/assets/agents/',

      // Bubble Configuration
      bubbleWidth: config.bubbleWidth || 350,
      bubbleHeight: config.bubbleHeight || 500,
      bubblePosition: config.bubblePosition || 'auto',

      // Behavior
      autoGreeting: config.autoGreeting || 'Hi! How can I help you today?',
      playIdleAnimations: config.playIdleAnimations !== false,
      idleAnimationInterval: config.idleAnimationInterval || 15000,

      // Animations
      animations: config.animations || {},

      // Theme
      theme: config.theme || {}
    };

    try {
      // Initialize API client
      this.apiClient = new APIClient({
        apiUrl: this.config.apiUrl,
        agentPath: this.config.agentPath,
        enableTools: this.config.enableTools
      });

      // Initialize session manager
      this.sessionManager = new SessionManager();

      // Initialize page reader
      this.pageReader = new PageReader({
        maxTextLength: this.config.maxPageContentLength || 2000
      });

      // Load Clippy character
      await this._loadClippy();

      // Initialize components after Clippy is loaded
      this._initializeComponents();

      // Add click handler to Clippy
      this._setupClippyClickHandler();

      // Handle window resize
      this._setupResizeHandler();

      this.isInitialized = true;
      console.log('✅ ClippyChat initialized successfully');

    } catch (error) {
      console.error('Failed to initialize ClippyChat:', error);
      throw error;
    }
  }

  /**
   * Load Clippy character using ClippyJS
   * @private
   */
  async _loadClippy() {
    return new Promise((resolve, reject) => {
      if (typeof clippy === 'undefined') {
        reject(new Error('ClippyJS library not found. Make sure clippy.js is loaded.'));
        return;
      }

      clippy.load('Clippy', (agent) => {
        this.clippyAgent = agent;

        // Position Clippy
        const { x, y } = this._calculateClippyPosition();
        this.clippyPosition = { x, y };

        // Position BEFORE showing (critical!)
        agent.moveTo(x, y, 0);

        // Now show
        agent.show();

        // Play greeting animation after a delay
        setTimeout(() => {
          agent.play('Greeting');
        }, 500);

        resolve();
      }, (error) => {
        reject(new Error('Failed to load Clippy: ' + error));
      }, this.config.clippyAgentPath);
    });
  }

  /**
   * Initialize all components after Clippy is loaded
   * @private
   */
  _initializeComponents() {
    // Initialize animation controller
    this.animationController = new AnimationController(this.clippyAgent, {
      ...this.config.animations,
      playIdleAnimations: this.config.playIdleAnimations,
      idleAnimationDelay: this.config.idleAnimationInterval
    });

    // Initialize chat bubble
    this.chatBubble = new ChatBubble({
      width: this.config.bubbleWidth,
      height: this.config.bubbleHeight,
      position: this.config.bubblePosition,
      onClose: () => this._handleBubbleClose()
    });

    // Create bubble element
    this.chatBubble.create();
  }

  /**
   * Setup click handler for Clippy character
   * @private
   */
  _setupClippyClickHandler() {
    const clippyElement = document.querySelector('.clippy');
    if (clippyElement) {
      clippyElement.style.cursor = 'pointer';
      clippyElement.addEventListener('click', () => this._handleClippyClick());
    }
  }

  /**
   * Setup window resize handler
   * @private
   */
  _setupResizeHandler() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Reposition Clippy
        const { x, y } = this._calculateClippyPosition();
        this.clippyPosition = { x, y };
        if (this.clippyAgent) {
          this.clippyAgent.stop();
          this.clippyAgent.moveTo(x, y, 300);
        }

        // Reposition bubble if showing
        if (this.chatBubble && this.chatBubble.isShowing()) {
          this.chatBubble.position(this.clippyPosition);
        }
      }, 250);
    });
  }

  /**
   * Handle Clippy click - open chat bubble
   * @private
   */
  _handleClippyClick() {
    if (this.chatBubble.isShowing()) {
      // Already showing, do nothing
      return;
    }

    // Start new session
    this.sessionManager.startNewSession();

    // Show bubble
    this.chatBubble.show(this.clippyPosition);

    // Create chat interface inside bubble
    const contentElement = this.chatBubble.getContentElement();
    this.chatInterface = new ChatInterface(contentElement, {
      autoGreeting: this.config.autoGreeting,
      theme: this.config.theme,
      onSendMessage: (text) => this._handleUserMessage(text)
    });

    // Play greeting animation
    this.animationController.trigger('greeting');

    // Start idle animations
    this.animationController.startIdleAnimations();

    // Focus input
    setTimeout(() => {
      this.chatInterface.focus();
    }, 300);
  }

  /**
   * Handle bubble close
   * @private
   */
  _handleBubbleClose() {
    // End session
    if (this.sessionManager.isSessionActive()) {
      this.sessionManager.endSession();
    }

    // Stop animations
    if (this.animationController) {
      this.animationController.stopIdleAnimations();
      this.animationController.setState('idle');
    }

    // Destroy chat interface
    if (this.chatInterface) {
      this.chatInterface.destroy();
      this.chatInterface = null;
    }

    // Play a closing wave
    if (this.clippyAgent) {
      this.clippyAgent.play('Wave');
    }
  }

  /**
   * Handle user message
   * @param {string} text - User's message
   * @private
   */
  async _handleUserMessage(text) {
    // Extract page content
    const pageContext = this.pageReader.extractPageContext();
    const pageMarkdown = this.pageReader.formatAsMarkdown(pageContext);

    // Append page content to user's message
    const messageWithContext = `${text}\n\n---\nCURRENT PAGE CONTEXT:\n${pageMarkdown}`;

    // Add to session (with page context included)
    this.sessionManager.addUserMessage(messageWithContext);

    // Disable input while processing
    this.chatInterface.disableInput();
    this.chatInterface.showTyping();

    // Keep playing Writing animation until response returns
    this.animationController.startAlternating(['Writing'], 3000);

    try {
      // Get all messages
      const messages = this.sessionManager.getMessages();

      // Send to API
      const response = await this.apiClient.sendMessage(messages, {
        conversationId: this.sessionManager.getConversationId()
      });

      // Stop alternating animations
      this.animationController.stopAlternating();

      // Add response to session and UI
      this.sessionManager.addAssistantMessage(response);
      this.chatInterface.addMessage('assistant', response);

      // Trigger excited animation
      this.animationController.trigger('excited');

    } catch (error) {
      console.error('Error getting response:', error);

      // Stop alternating animations
      this.animationController.stopAlternating();

      // Show error message
      this.chatInterface.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');

      // Trigger confused animation
      this.animationController.trigger('confused');
    } finally {
      // Re-enable input
      this.chatInterface.hideTyping();
      this.chatInterface.enableInput();
      this.chatInterface.focus();
    }
  }

  /**
   * Calculate Clippy position based on config
   * @private
   * @returns {{x: number, y: number}}
   */
  _calculateClippyPosition() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const size = 124; // Clippy actual size (including shadow/padding)
    const offsetX = this.config.clippyOffsetX;
    const offsetY = this.config.clippyOffsetY;

    let x, y;

    switch (this.config.clippyPosition) {
      case 'top-left':
        x = offsetX;
        y = offsetY;
        break;
      case 'top-right':
        x = w - size - offsetX;
        y = offsetY;
        break;
      case 'bottom-left':
        x = offsetX;
        y = h - size - offsetY;
        break;
      case 'bottom-right':
      default:
        x = w - size - offsetX;
        y = h - size - offsetY;
        break;
    }

    return { x, y };
  }

  /**
   * Destroy the widget
   */
  destroy() {
    if (this.chatBubble) {
      this.chatBubble.destroy();
    }
    if (this.chatInterface) {
      this.chatInterface.destroy();
    }
    if (this.animationController) {
      this.animationController.stop();
    }
    if (this.clippyAgent) {
      this.clippyAgent.hide();
    }

    this.isInitialized = false;
  }
}

// Create singleton instance
const clippyChatInstance = new ClippyChatWidget();

// Export public API
const ClippyChat = {
  /**
   * Initialize ClippyChat widget
   * @param {Object} config - Configuration options
   */
  init: (config) => clippyChatInstance.init(config),

  /**
   * Destroy the widget
   */
  destroy: () => clippyChatInstance.destroy()
};

// Immediately assign to window (for browser usage)
if (typeof window !== 'undefined') {
  window.ClippyChat = ClippyChat;
  // Also export on globalThis for compatibility
  if (typeof globalThis !== 'undefined') {
    globalThis.ClippyChat = ClippyChat;
  }
}

// Export for ES modules
export {
  ClippyChat as default,
  ClippyChat,
  ClippyChatWidget,
  APIClient,
  SessionManager,
  AnimationController,
  ChatBubble,
  ChatInterface,
  PageReader
};
