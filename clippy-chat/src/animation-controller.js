/**
 * Animation Controller for Clippy Chat
 * Maps conversation states to ClippyJS animations
 */

class AnimationController {
  constructor(clippyAgent, config = {}) {
    if (!clippyAgent) {
      throw new Error('ClippyAgent instance is required');
    }

    this.agent = clippyAgent;

    // Default animation mappings
    this.animationMap = {
      idle: config.idle || ['Wave', 'LookDown', 'Blink', 'LookLeft', 'LookRight'],
      greeting: config.greeting || 'Greeting',
      listening: config.listening || 'LookDown',
      thinking: config.thinking || 'Writing',
      excited: config.excited || 'Congratulate',
      searching: config.searching || 'Searching',
      confused: config.confused || 'Confused',
      explaining: config.explaining || 'Explaining',
      waving: config.waving || 'Wave'
    };

    this.currentState = 'idle';
    this.idleInterval = null;
    this.idleAnimationDelay = config.idleAnimationDelay || 15000; // 15 seconds
    this.playIdleAnimations = config.playIdleAnimations !== false;
    this.alternatingInterval = null;
    this.alternatingAnimations = [];
    this.alternatingIndex = 0;
  }

  /**
   * Trigger animation based on state
   * @param {string} state - The conversation state
   * @param {boolean} stopCurrent - Whether to stop current animations first
   */
  trigger(state, stopCurrent = true) {
    if (!this.agent) {
      console.warn('Clippy agent not available');
      return;
    }

    this.currentState = state;

    // Stop idle animations when changing state
    this.stopIdleAnimations();

    // Stop current animation if requested
    if (stopCurrent) {
      this.agent.stop();
    }

    // Get animation name for this state
    const animation = this.animationMap[state];

    if (!animation) {
      console.warn(`No animation mapped for state: ${state}`);
      return;
    }

    // Handle array of animations (pick random)
    if (Array.isArray(animation)) {
      const randomAnimation = animation[Math.floor(Math.random() * animation.length)];
      this.playAnimation(randomAnimation);
    } else {
      this.playAnimation(animation);
    }
  }

  /**
   * Play a specific animation
   * @param {string} animationName - Name of the animation
   */
  playAnimation(animationName) {
    if (!this.agent) {
      console.warn('Clippy agent not available');
      return;
    }

    try {
      // Check if animation exists
      const availableAnimations = this.agent.animations();
      if (!availableAnimations.includes(animationName)) {
        console.warn(`Animation "${animationName}" not available. Using random animation.`);
        this.agent.animate(); // Play random animation as fallback
        return;
      }

      this.agent.play(animationName);
    } catch (error) {
      console.error('Error playing animation:', error);
    }
  }

  /**
   * Start playing idle animations periodically
   */
  startIdleAnimations() {
    if (!this.playIdleAnimations || this.idleInterval) {
      return; // Already running or disabled
    }

    this.idleInterval = setInterval(() => {
      if (this.currentState === 'idle') {
        this.trigger('idle', false); // Don't stop current animation
      }
    }, this.idleAnimationDelay);
  }

  /**
   * Stop idle animations
   */
  stopIdleAnimations() {
    if (this.idleInterval) {
      clearInterval(this.idleInterval);
      this.idleInterval = null;
    }
  }

  /**
   * Start alternating between animations
   * @param {Array<string>} animations - Array of animation names to alternate
   * @param {number} interval - Time between animations in milliseconds (default: 3000)
   */
  startAlternating(animations, interval = 3000) {
    if (!animations || animations.length === 0) {
      console.warn('No animations provided for alternating');
      return;
    }

    // Stop any existing alternating
    this.stopAlternating();

    this.alternatingAnimations = animations;
    this.alternatingIndex = 0;

    // Play first animation immediately
    this.playAnimation(animations[0]);

    // Start alternating
    this.alternatingInterval = setInterval(() => {
      this.alternatingIndex = (this.alternatingIndex + 1) % this.alternatingAnimations.length;
      this.playAnimation(this.alternatingAnimations[this.alternatingIndex]);
    }, interval);
  }

  /**
   * Stop alternating animations
   */
  stopAlternating() {
    if (this.alternatingInterval) {
      clearInterval(this.alternatingInterval);
      this.alternatingInterval = null;
      this.alternatingAnimations = [];
      this.alternatingIndex = 0;
    }
  }

  /**
   * Get current state
   * @returns {string}
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * Set state without triggering animation
   * @param {string} state - The new state
   */
  setState(state) {
    this.currentState = state;
  }

  /**
   * Stop all animations
   */
  stop() {
    if (this.agent) {
      this.agent.stop();
    }
    this.stopIdleAnimations();
    this.stopAlternating();
  }

  /**
   * Update animation mappings
   * @param {Object} mappings - New animation mappings
   */
  updateMappings(mappings) {
    this.animationMap = { ...this.animationMap, ...mappings };
  }

  /**
   * Get available animations from Clippy agent
   * @returns {Array<string>} - List of animation names
   */
  getAvailableAnimations() {
    if (!this.agent) {
      return [];
    }

    try {
      return this.agent.animations();
    } catch (error) {
      console.error('Error getting animations:', error);
      return [];
    }
  }

  /**
   * Get current animation mappings
   * @returns {Object}
   */
  getMappings() {
    return { ...this.animationMap };
  }
}

// Export for ES modules
export { AnimationController };

// For browser usage via rollup build
if (typeof window !== 'undefined') {
  window.AnimationController = AnimationController;
}

// ========================================
// INLINE TEST (run with: node src/animation-controller.js)
// ========================================
if (typeof require !== 'undefined' && require.main === module) {
  console.log('🧪 Running inline tests for AnimationController...\n');

  // Mock Clippy agent for testing
  class MockClippyAgent {
    constructor() {
      this.lastAnimation = null;
      this.stopped = false;
      this.animations_list = [
        'Wave', 'Greeting', 'Thinking', 'Congratulate',
        'Searching', 'Confused', 'Explaining', 'LookDown',
        'LookLeft', 'LookRight', 'Blink'
      ];
    }

    play(animationName) {
      this.lastAnimation = animationName;
      this.stopped = false;
      console.log(`  [Mock] Playing animation: ${animationName}`);
    }

    animate() {
      this.lastAnimation = 'random';
      console.log(`  [Mock] Playing random animation`);
    }

    stop() {
      this.stopped = true;
      console.log(`  [Mock] Stopped animations`);
    }

    animations() {
      return this.animations_list;
    }
  }

  // Test 1: Create controller
  console.log('Test 1: Create animation controller');
  const mockAgent = new MockClippyAgent();
  const controller = new AnimationController(mockAgent);
  console.log('  Created:', controller instanceof AnimationController);
  console.log('  Current state:', controller.getCurrentState());
  console.log('  ✅ PASSED\n');

  // Test 2: Trigger greeting animation
  console.log('Test 2: Trigger greeting animation');
  controller.trigger('greeting');
  console.log('  Current state:', controller.getCurrentState());
  console.log('  Last animation:', mockAgent.lastAnimation);
  if (mockAgent.lastAnimation !== 'Greeting') {
    throw new Error('Failed to trigger greeting animation');
  }
  console.log('  ✅ PASSED\n');

  // Test 3: Trigger thinking animation
  console.log('Test 3: Trigger thinking animation');
  controller.trigger('thinking');
  console.log('  Last animation:', mockAgent.lastAnimation);
  if (mockAgent.lastAnimation !== 'Thinking') {
    throw new Error('Failed to trigger thinking animation');
  }
  console.log('  ✅ PASSED\n');

  // Test 4: Trigger idle (random from array)
  console.log('Test 4: Trigger idle animation (random from array)');
  controller.trigger('idle');
  console.log('  Last animation:', mockAgent.lastAnimation);
  const idleAnimations = ['Wave', 'LookDown', 'Blink', 'LookLeft', 'LookRight'];
  if (!idleAnimations.includes(mockAgent.lastAnimation)) {
    throw new Error('Failed to trigger idle animation');
  }
  console.log('  ✅ PASSED\n');

  // Test 5: Play specific animation
  console.log('Test 5: Play specific animation');
  controller.playAnimation('Wave');
  console.log('  Last animation:', mockAgent.lastAnimation);
  if (mockAgent.lastAnimation !== 'Wave') {
    throw new Error('Failed to play specific animation');
  }
  console.log('  ✅ PASSED\n');

  // Test 6: Handle non-existent animation (fallback)
  console.log('Test 6: Handle non-existent animation');
  controller.playAnimation('NonExistentAnimation');
  console.log('  Last animation:', mockAgent.lastAnimation);
  if (mockAgent.lastAnimation !== 'random') {
    throw new Error('Failed to fallback to random animation');
  }
  console.log('  ✅ PASSED\n');

  // Test 7: Stop animations
  console.log('Test 7: Stop animations');
  controller.stop();
  console.log('  Agent stopped:', mockAgent.stopped);
  if (!mockAgent.stopped) {
    throw new Error('Failed to stop animations');
  }
  console.log('  ✅ PASSED\n');

  // Test 8: Update animation mappings
  console.log('Test 8: Update animation mappings');
  controller.updateMappings({
    greeting: 'Wave',
    custom: 'Explaining'
  });
  const mappings = controller.getMappings();
  console.log('  Updated greeting:', mappings.greeting);
  console.log('  Custom mapping:', mappings.custom);
  if (mappings.greeting !== 'Wave' || mappings.custom !== 'Explaining') {
    throw new Error('Failed to update mappings');
  }
  console.log('  ✅ PASSED\n');

  // Test 9: Get available animations
  console.log('Test 9: Get available animations');
  const available = controller.getAvailableAnimations();
  console.log('  Available animations count:', available.length);
  console.log('  First few:', available.slice(0, 3).join(', '));
  if (available.length === 0) {
    throw new Error('Failed to get available animations');
  }
  console.log('  ✅ PASSED\n');

  // Test 10: Custom configuration
  console.log('Test 10: Custom configuration');
  const customController = new AnimationController(mockAgent, {
    greeting: 'Wave',
    thinking: 'Confused',
    playIdleAnimations: false
  });
  const customMappings = customController.getMappings();
  console.log('  Custom greeting:', customMappings.greeting);
  console.log('  Custom thinking:', customMappings.thinking);
  console.log('  Idle animations:', customController.playIdleAnimations);
  if (customMappings.greeting !== 'Wave' || customMappings.thinking !== 'Confused') {
    throw new Error('Failed to apply custom configuration');
  }
  console.log('  ✅ PASSED\n');

  // Test 11: Set state without triggering
  console.log('Test 11: Set state without triggering animation');
  const beforeAnimation = mockAgent.lastAnimation;
  controller.setState('listening');
  console.log('  State changed to:', controller.getCurrentState());
  console.log('  Animation unchanged:', mockAgent.lastAnimation === beforeAnimation);
  if (controller.getCurrentState() !== 'listening' || mockAgent.lastAnimation !== beforeAnimation) {
    throw new Error('Failed to set state without triggering');
  }
  console.log('  ✅ PASSED\n');

  console.log('✅ All inline tests PASSED!');
}
