/**
 * Semantic Testing Framework - Test Runner
 */

import { AgentTestClient } from './client.js';
import * as assertions from './assertions.js';
import type { TestCase, TestResult, TestConfig, Reporter, AssertionResult } from './types.js';

/**
 * Test runner that executes test cases and collects results
 */
export class TestRunner {
  private client: AgentTestClient;
  private reporter: Reporter;

  constructor(config: TestConfig, reporter: Reporter) {
    this.client = new AgentTestClient(config);
    this.reporter = reporter;
  }

  /**
   * Run all test cases
   */
  async run(testCases: TestCase[]): Promise<TestResult[]> {
    const results: TestResult[] = [];

    this.reporter.onStart(testCases);

    for (const testCase of testCases) {
      this.reporter.onTestStart(testCase);
      const result = await this.runTest(testCase);
      results.push(result);
      this.reporter.onTestEnd(testCase, result);
    }

    this.reporter.onEnd(results);

    return results;
  }

  /**
   * Run a single test case
   */
  private async runTest(testCase: TestCase): Promise<TestResult> {
    const startTime = Date.now();
    const assertionResults: AssertionResult[] = [];

    try {
      const response = await this.client.chat(
        testCase.agentPath,
        testCase.message,
        testCase.metadata
      );

      // Run delegation assertion
      if (testCase.assertions.delegation) {
        assertionResults.push(
          assertions.assertDelegation(response, testCase.assertions.delegation)
        );
      }

      // Run no-delegation assertion
      if (testCase.assertions.noDelegation) {
        assertionResults.push(assertions.assertNoDelegation(response));
      }

      // Run response-contains assertion
      if (testCase.assertions.responseContains) {
        assertionResults.push(
          assertions.assertResponseContains(response, testCase.assertions.responseContains)
        );
      }

      const allPassed = assertionResults.every((r) => r.passed);

      return {
        testCase,
        status: allPassed ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        response,
        assertions: assertionResults,
      };
    } catch (error) {
      return {
        testCase,
        status: 'error',
        duration: Date.now() - startTime,
        assertions: assertionResults,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}
