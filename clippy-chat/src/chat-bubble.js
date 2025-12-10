/**
 * Chat Bubble Component for Clippy Chat
 * Creates and manages the speech bubble that appears near Clippy
 */

class ChatBubble {
  constructor(config = {}) {
    this.config = {
      width: config.width || 350,
      height: config.height || 500,
      position: config.position || 'auto', // 'auto', 'above', 'beside'
      offset: config.offset || { x: 20, y: 20 },
      closeButton: config.closeButton !== false
    };

    this.element = null;
    this.isVisible = false;
    this.onClose = config.onClose || null;
  }

  /**
   * Create the bubble DOM element
   * @returns {HTMLElement}
   */
  create() {
    if (this.element) {
      return this.element; // Already created
    }

    // Create bubble container
    const bubble = document.createElement('div');
    bubble.className = 'clippy-chat-bubble';
    bubble.style.cssText = `
      position: fixed;
      width: ${this.config.width}px;
      height: ${this.config.height}px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      display: none;
      flex-direction: column;
      z-index: 999;
      overflow: hidden;
    `;

    // Create header
    const header = document.createElement('div');
    header.className = 'clippy-chat-header';
    header.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
      font-size: 14px;
    `;

    const title = document.createElement('span');
    title.textContent = 'Clippy Assistant';
    header.appendChild(title);

    // Create close button if enabled
    if (this.config.closeButton) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'clippy-chat-close';
      closeBtn.innerHTML = '✕';
      closeBtn.style.cssText = `
        background: transparent;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;
      `;
      closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,0.2)';
      closeBtn.onmouseout = () => closeBtn.style.background = 'transparent';
      closeBtn.onclick = () => this.hide();

      header.appendChild(closeBtn);
    }

    bubble.appendChild(header);

    // Create content area (will be filled by ChatInterface)
    const content = document.createElement('div');
    content.className = 'clippy-chat-content';
    content.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    bubble.appendChild(content);

    this.element = bubble;
    return bubble;
  }

  /**
   * Show the bubble
   * @param {Object} clippyPosition - {x, y} coordinates of Clippy
   */
  show(clippyPosition) {
    if (!this.element) {
      this.create();
    }

    // Add to DOM if not already there
    if (!this.element.parentElement) {
      document.body.appendChild(this.element);
    }

    // Position the bubble relative to Clippy
    if (clippyPosition) {
      this.position(clippyPosition);
    }

    // Show with animation
    this.element.style.display = 'flex';
    this.element.style.opacity = '0';
    this.element.style.transform = 'scale(0.9)';
    this.element.style.transition = 'opacity 0.3s, transform 0.3s';

    // Trigger animation
    setTimeout(() => {
      this.element.style.opacity = '1';
      this.element.style.transform = 'scale(1)';
    }, 10);

    this.isVisible = true;
  }

  /**
   * Hide the bubble
   */
  hide() {
    if (!this.element || !this.isVisible) {
      return;
    }

    // Animate out
    this.element.style.opacity = '0';
    this.element.style.transform = 'scale(0.9)';

    setTimeout(() => {
      if (this.element) {
        this.element.style.display = 'none';
      }
      this.isVisible = false;

      // Call onClose callback
      if (this.onClose) {
        this.onClose();
      }
    }, 300);
  }

  /**
   * Position the bubble relative to Clippy
   * @param {Object} clippyPosition - {x, y} coordinates of Clippy
   */
  position(clippyPosition) {
    if (!this.element) return;

    const { x: clippyX, y: clippyY } = clippyPosition;
    const clippySize = 100; // Approximate Clippy size
    const bubbleWidth = this.config.width;
    const bubbleHeight = this.config.height;
    const offset = this.config.offset;

    let left, top;

    if (this.config.position === 'above') {
      // Position above Clippy
      left = clippyX;
      top = clippyY - bubbleHeight - offset.y;
    } else if (this.config.position === 'beside') {
      // Position beside Clippy (to the left)
      left = clippyX - bubbleWidth - offset.x;
      top = clippyY;
    } else {
      // Auto positioning - choose best position based on available space
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Try to position to the left of Clippy
      if (clippyX - bubbleWidth - offset.x > 0) {
        left = clippyX - bubbleWidth - offset.x;
      } else {
        // Not enough space on left, position to the right
        left = clippyX + clippySize + offset.x;
      }

      // Vertically align with Clippy, but keep in viewport
      top = Math.max(offset.y, Math.min(clippyY, windowHeight - bubbleHeight - offset.y));
    }

    // Ensure bubble stays within viewport
    left = Math.max(offset.x, Math.min(left, window.innerWidth - bubbleWidth - offset.x));
    top = Math.max(offset.y, Math.min(top, window.innerHeight - bubbleHeight - offset.y));

    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
  }

  /**
   * Get the content container element
   * @returns {HTMLElement|null}
   */
  getContentElement() {
    if (!this.element) return null;
    return this.element.querySelector('.clippy-chat-content');
  }

  /**
   * Check if bubble is visible
   * @returns {boolean}
   */
  isShowing() {
    return this.isVisible;
  }

  /**
   * Destroy the bubble
   */
  destroy() {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
    this.isVisible = false;
  }

  /**
   * Update bubble configuration
   * @param {Object} config - New configuration options
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config };

    if (this.element) {
      // Apply size changes
      if (config.width) {
        this.element.style.width = `${config.width}px`;
      }
      if (config.height) {
        this.element.style.height = `${config.height}px`;
      }
    }
  }
}

// Export for ES modules
export { ChatBubble };

// For browser usage via rollup build
if (typeof window !== 'undefined') {
  window.ChatBubble = ChatBubble;
}

// ========================================
// INLINE TEST (run with: node src/chat-bubble.js)
// Note: DOM tests need JSDOM environment
// ========================================
if (typeof require !== 'undefined' && require.main === module) {
  console.log('🧪 Running inline tests for ChatBubble...\n');

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

  // Test 1: Create bubble
  console.log('Test 1: Create bubble');
  const bubble = new ChatBubble();
  const element = bubble.create();
  console.log('  Element created:', element !== null);
  console.log('  Class name:', element.className);
  console.log('  ✅ PASSED\n');

  // Test 2: Check structure
  console.log('Test 2: Check bubble structure');
  const header = element.querySelector('.clippy-chat-header');
  const content = element.querySelector('.clippy-chat-content');
  const closeBtn = element.querySelector('.clippy-chat-close');
  console.log('  Has header:', header !== null);
  console.log('  Has content:', content !== null);
  console.log('  Has close button:', closeBtn !== null);
  if (!header || !content || !closeBtn) {
    throw new Error('Missing bubble elements');
  }
  console.log('  ✅ PASSED\n');

  // Test 3: Show bubble
  console.log('Test 3: Show bubble');
  bubble.show({ x: 500, y: 500 });
  console.log('  Is visible:', bubble.isShowing());
  console.log('  Display style:', element.style.display);
  if (!bubble.isShowing() || element.style.display !== 'flex') {
    throw new Error('Failed to show bubble');
  }
  console.log('  ✅ PASSED\n');

  // Test 4: Position bubble
  console.log('Test 4: Position bubble');
  bubble.position({ x: 100, y: 200 });
  const left = element.style.left;
  const top = element.style.top;
  console.log('  Left position:', left);
  console.log('  Top position:', top);
  console.log('  Has position:', left && top);
  if (!left || !top) {
    throw new Error('Failed to position bubble');
  }
  console.log('  ✅ PASSED\n');

  // Test 5: Get content element
  console.log('Test 5: Get content element');
  const contentElem = bubble.getContentElement();
  console.log('  Content element:', contentElem !== null);
  console.log('  Content class:', contentElem.className);
  if (contentElem.className !== 'clippy-chat-content') {
    throw new Error('Failed to get content element');
  }
  console.log('  ✅ PASSED\n');

  // Test 6: Hide bubble
  console.log('Test 6: Hide bubble');
  bubble.hide();
  setTimeout(() => {
    console.log('  Is visible:', bubble.isShowing());
    console.log('  Display style:', element.style.display);
    if (bubble.isShowing()) {
      throw new Error('Failed to hide bubble');
    }
    console.log('  ✅ PASSED\n');

    // Test 7: Custom configuration
    console.log('Test 7: Custom configuration');
    const customBubble = new ChatBubble({
      width: 400,
      height: 600,
      position: 'above',
      closeButton: false
    });
    const customElem = customBubble.create();
    const hasCloseBtn = customElem.querySelector('.clippy-chat-close');
    console.log('  Custom width:', customElem.style.width);
    console.log('  Custom height:', customElem.style.height);
    console.log('  No close button:', hasCloseBtn === null);
    if (customElem.style.width !== '400px' || customElem.style.height !== '600px' || hasCloseBtn) {
      throw new Error('Failed to apply custom configuration');
    }
    console.log('  ✅ PASSED\n');

    // Test 8: Update configuration
    console.log('Test 8: Update configuration');
    customBubble.updateConfig({ width: 500, height: 700 });
    console.log('  Updated width:', customElem.style.width);
    console.log('  Updated height:', customElem.style.height);
    if (customElem.style.width !== '500px' || customElem.style.height !== '700px') {
      throw new Error('Failed to update configuration');
    }
    console.log('  ✅ PASSED\n');

    // Test 9: Destroy bubble
    console.log('Test 9: Destroy bubble');
    document.body.appendChild(element);
    const inDOM = document.body.contains(element);
    console.log('  In DOM before destroy:', inDOM);
    bubble.destroy();
    const stillInDOM = document.body.contains(element);
    console.log('  In DOM after destroy:', stillInDOM);
    console.log('  Element nullified:', bubble.element === null);
    if (stillInDOM || bubble.element !== null) {
      throw new Error('Failed to destroy bubble');
    }
    console.log('  ✅ PASSED\n');

    console.log('✅ All inline tests PASSED!');
  }, 350); // Wait for hide animation
}
