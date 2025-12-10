/**
 * Semantic Testing Framework - Configuration
 */

import type { TestConfig } from './types.js';

/**
 * Load configuration from environment variables
 */
export function loadConfig(): TestConfig {
  return {
    baseUrl: process.env.SEMANTIC_TEST_BASE_URL || 'http://localhost:8001',
    timeout: parseInt(process.env.SEMANTIC_TEST_TIMEOUT || '30000', 10),
    verbose: process.env.SEMANTIC_TEST_VERBOSE === 'true',
  };
}
