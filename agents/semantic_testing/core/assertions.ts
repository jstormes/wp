/**
 * Semantic Testing Framework - Assertions
 */

import type { ChatResponse, DelegationAssertion, AssertionResult } from './types.js';

/**
 * Assert that a specific delegation tool was called
 */
export function assertDelegation(
  response: ChatResponse,
  expected: DelegationAssertion
): AssertionResult {
  const toolCalls = response.data.toolCalls || [];
  const targetCall = toolCalls.find((tc) => tc.toolName === expected.tool);

  if (!targetCall) {
    return {
      type: 'delegation',
      passed: false,
      expected: expected.tool,
      actual: toolCalls.map((tc) => tc.toolName),
      message: `Expected delegation to "${expected.tool}", but found: ${
        toolCalls.map((tc) => tc.toolName).join(', ') || 'none'
      }`,
    };
  }

  // Check args contain expected keywords if specified
  if (expected.argsContain && expected.argsContain.length > 0) {
    const argsString = JSON.stringify(targetCall.args).toLowerCase();
    const missing = expected.argsContain.filter(
      (kw) => !argsString.includes(kw.toLowerCase())
    );

    if (missing.length > 0) {
      return {
        type: 'delegation-args',
        passed: false,
        expected: expected.argsContain,
        actual: targetCall.args,
        message: `Delegation args missing keywords: ${missing.join(', ')}`,
      };
    }
  }

  return {
    type: 'delegation',
    passed: true,
    expected: expected.tool,
    actual: targetCall.toolName,
  };
}

/**
 * Assert that no delegation occurred
 */
export function assertNoDelegation(response: ChatResponse): AssertionResult {
  const toolCalls = response.data.toolCalls || [];
  const delegationCalls = toolCalls.filter((tc) => tc.toolName.startsWith('ask'));

  return {
    type: 'no-delegation',
    passed: delegationCalls.length === 0,
    expected: 'no delegation',
    actual: delegationCalls.map((tc) => tc.toolName),
    message:
      delegationCalls.length > 0
        ? `Expected no delegation, but found: ${delegationCalls.map((tc) => tc.toolName).join(', ')}`
        : undefined,
  };
}

/**
 * Assert that response text contains specified keywords
 */
export function assertResponseContains(
  response: ChatResponse,
  keywords: string[]
): AssertionResult {
  const text = response.data.text.toLowerCase();
  const found = keywords.filter((kw) => text.includes(kw.toLowerCase()));
  const missing = keywords.filter((kw) => !text.includes(kw.toLowerCase()));

  return {
    type: 'response-contains',
    passed: missing.length === 0,
    expected: keywords,
    actual: found,
    message: missing.length > 0 ? `Response missing keywords: ${missing.join(', ')}` : undefined,
  };
}
