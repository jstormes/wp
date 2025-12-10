/**
 * Semantic Testing Framework - Type Definitions
 */

/**
 * Configuration for the test framework
 */
export interface TestConfig {
  baseUrl: string;
  timeout: number;
  verbose: boolean;
}

/**
 * Assertion for expected delegation
 */
export interface DelegationAssertion {
  tool: string;
  argsContain?: string[];
}

/**
 * Test case definition
 */
export interface TestCase {
  name: string;
  description?: string;
  agentPath: string;
  message: string;
  metadata?: Record<string, unknown>;
  timeout?: number;
  assertions: {
    delegation?: DelegationAssertion;
    noDelegation?: boolean;
    responseContains?: string[];
  };
}

/**
 * Result of a single assertion
 */
export interface AssertionResult {
  type: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  message?: string;
}

/**
 * Tool call result from agent response
 */
export interface ToolCallResult {
  toolName: string;
  args: unknown;
  result: unknown;
}

/**
 * Agent chat response
 */
export interface ChatResponse {
  success: boolean;
  data: {
    text: string;
    toolCalls?: ToolCallResult[];
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    finishReason: string;
  };
  traceId: string;
}

/**
 * Test execution result
 */
export interface TestResult {
  testCase: TestCase;
  status: 'passed' | 'failed' | 'error';
  duration: number;
  response?: ChatResponse;
  assertions: AssertionResult[];
  error?: Error;
}

/**
 * Reporter interface for output
 */
export interface Reporter {
  onStart(testCases: TestCase[]): void;
  onTestStart(testCase: TestCase): void;
  onTestEnd(testCase: TestCase, result: TestResult): void;
  onEnd(results: TestResult[]): void;
}
