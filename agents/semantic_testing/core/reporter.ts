/**
 * Semantic Testing Framework - Console Reporter
 */

import type { TestCase, TestResult, Reporter } from './types.js';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

/**
 * Console reporter with colored output
 */
export class ConsoleReporter implements Reporter {
  private verbose: boolean;
  private startTime: number = 0;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  onStart(testCases: TestCase[]): void {
    this.startTime = Date.now();
    console.log();
    console.log(`${colors.bright}Semantic Tests: Delegation Chain${colors.reset}`);
    console.log('='.repeat(40));
    console.log(`Running ${testCases.length} test(s)...`);
    console.log();
  }

  onTestStart(testCase: TestCase): void {
    if (this.verbose) {
      console.log(`${colors.cyan}[RUNNING]${colors.reset} ${testCase.name}`);
      console.log(`  Agent: ${testCase.agentPath}`);
      console.log(`  Message: "${testCase.message}"`);
    }
  }

  onTestEnd(testCase: TestCase, result: TestResult): void {
    const statusColor = result.status === 'passed' ? colors.green : colors.red;
    const statusIcon = result.status === 'passed' ? 'PASS' : 'FAIL';
    const duration = (result.duration / 1000).toFixed(1);

    console.log(`${statusColor}[${statusIcon}]${colors.reset} ${testCase.name}`);
    console.log(`  ${colors.dim}Message: "${testCase.message}"${colors.reset}`);

    // Show delegation info
    if (testCase.assertions.delegation) {
      const delegationResult = result.assertions.find((a) => a.type === 'delegation');
      if (delegationResult?.passed) {
        console.log(`  ${colors.green}Tool: ${testCase.assertions.delegation.tool} ✓${colors.reset}`);
      } else {
        console.log(`  ${colors.red}Expected: ${testCase.assertions.delegation.tool}${colors.reset}`);
        console.log(`  ${colors.red}Actual: ${JSON.stringify(delegationResult?.actual)}${colors.reset}`);
      }
    }

    if (testCase.assertions.noDelegation) {
      const noDelegationResult = result.assertions.find((a) => a.type === 'no-delegation');
      if (noDelegationResult?.passed) {
        console.log(`  ${colors.green}No delegation ✓${colors.reset}`);
      } else {
        console.log(`  ${colors.red}Unexpected delegation: ${JSON.stringify(noDelegationResult?.actual)}${colors.reset}`);
      }
    }

    // Show error if any
    if (result.error) {
      console.log(`  ${colors.red}Error: ${result.error.message}${colors.reset}`);
    }

    // Show failed assertions
    for (const assertion of result.assertions) {
      if (!assertion.passed && assertion.message) {
        console.log(`  ${colors.red}${assertion.message}${colors.reset}`);
      }
    }

    console.log(`  ${colors.dim}Duration: ${duration}s${colors.reset}`);
    console.log();
  }

  onEnd(results: TestResult[]): void {
    const totalDuration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const passed = results.filter((r) => r.status === 'passed').length;
    const failed = results.filter((r) => r.status !== 'passed').length;

    console.log('='.repeat(40));
    console.log(
      `${colors.bright}Summary:${colors.reset} ` +
        `${colors.green}${passed} passed${colors.reset} | ` +
        `${failed > 0 ? colors.red : colors.dim}${failed} failed${colors.reset} | ` +
        `${totalDuration}s total`
    );
    console.log();
  }
}
