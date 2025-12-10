/**
 * Clippy Chat Configuration
 *
 * This configuration file contains all settings for the Clippy Chat widget.
 * Include this file before initializing ClippyChat.
 */

const CLIPPY_CONFIG = {
    // ============================================
    // API Configuration (Required)
    // ============================================

    // Your agent API URL (Required)
    apiUrl: 'http://localhost:8088',

    // Enable AI tools/functions
    enableTools: true,

    // ============================================
    // Position & Appearance
    // ============================================

    // Position: 'top-left', 'top-right', 'bottom-left', 'bottom-right'
    clippyPosition: 'bottom-right',

    // Distance from edges (in pixels)
    clippyOffsetX: 20,
    clippyOffsetY: 20,

    // ============================================
    // Chat Bubble Settings
    // ============================================

    // Chat bubble dimensions
    bubbleWidth: 350,
    bubbleHeight: 500,

    // Bubble position: 'auto' or specific position
    bubblePosition: 'auto',

    // ============================================
    // Behavior Settings
    // ============================================

    // Initial greeting when chat opens
    autoGreeting: 'Hi! I\'m Clippy, your AI assistant. How can I help you today?',

    // Enable/disable idle animations
    playIdleAnimations: true,

    // Time between idle animations (milliseconds)
    idleAnimationInterval: 15000,

    // ============================================
    // Advanced Settings
    // ============================================

    // API request timeout (milliseconds)
    timeout: 45000,

    // Custom animations (optional)
    animations: {
        // greeting: 'Greeting',
        // thinking: 'Thinking',
        // excited: 'Pleased',
        // confused: 'Confused'
    },

    // Theme customization (optional)
    theme: {
        // Add custom theme properties here
    }
};
