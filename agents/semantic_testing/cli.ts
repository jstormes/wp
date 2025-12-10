#!/usr/bin/env tsx
/**
 * Semantic Testing Framework - CLI Entry Point
 *
 * Usage:
 *   npm run semantic-test
 *   SEMANTIC_TEST_VERBOSE=true npm run semantic-test
 *   SEMANTIC_TEST_BASE_URL=http://agents:8001 npm run semantic-test
 */

import { loadConfig } from './core/config.js';
import { TestRunner } from './core/runner.js';
import { ConsoleReporter } from './core/reporter.js';
import { delegationTests } from './tests/delegation/index.js';

async function main(): Promise<void> {
  const config = loadConfig();

  if (config.verbose) {
    console.log('Configuration:', config);
  }

  const reporter = new ConsoleReporter(config.verbose);
  const runner = new TestRunner(config, reporter);

  // Collect all test cases
  const testCases = [
    ...delegationTests,
    // Future: add more test suites here
    // ...qualityTests,
    // ...conversationTests,
  ];

  // Run tests
  const results = await runner.run(testCases);

  // Exit with error code if any tests failed
  const failed = results.filter((r) => r.status !== 'passed');
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
