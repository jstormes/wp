# Semantic Testing Framework

A CLI-based framework for testing agent delegation chains using real LLM calls.

## Overview

This framework validates that agents correctly delegate requests to other agents through the delegation chain:

```
front-end (Granite) --askOrchestrator--> orchestrator (Granite)
                                              |
                    +-----------+-------------+-----------+
                    |           |             |
              askSalesAgent  askSupportAgent  askKnowledgeAgent
                    |           |             |
                 sales       support       knowledge
                (Gemini)     (Gemini)      (Gemini)
```

## Usage

```bash
# Run all semantic tests
npm run semantic-test

# Run with verbose output
npm run semantic-test:verbose

# Custom endpoint
SEMANTIC_TEST_BASE_URL=http://agents:8001 npm run semantic-test
```

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SEMANTIC_TEST_BASE_URL` | `http://localhost:8001` | Agent API base URL |
| `SEMANTIC_TEST_TIMEOUT` | `30000` | Request timeout (ms) |
| `SEMANTIC_TEST_VERBOSE` | `false` | Enable verbose output |

## Test Structure

```
semantic_testing/
├── core/                     # Framework core
│   ├── types.ts              # TypeScript interfaces
│   ├── config.ts             # Configuration loader
│   ├── client.ts             # HTTP client for agent API
│   ├── assertions.ts         # Assertion functions
│   ├── runner.ts             # Test runner
│   └── reporter.ts           # Console reporter
├── tests/
│   ├── delegation/           # Delegation chain tests
│   │   └── index.ts
│   ├── quality/              # (Future) Response quality tests
│   └── conversation/         # (Future) Multi-turn tests
├── cli.ts                    # CLI entry point
└── index.ts                  # Module exports
```

## Writing Test Cases

Test cases are defined in TypeScript:

```typescript
import type { TestCase } from '../../core/types.js';

export const myTests: TestCase[] = [
  {
    name: 'orchestrator -> askSalesAgent (pricing)',
    description: 'Pricing questions go to sales',
    agentPath: 'orchestrator',
    message: 'What are your prices?',
    assertions: {
      delegation: {
        tool: 'askSalesAgent',
        argsContain: ['price'],
      },
    },
  },
  {
    name: 'front-end -> no delegation (greeting)',
    agentPath: 'front-end',
    message: 'Hello!',
    assertions: {
      noDelegation: true,
    },
  },
];
```

## Assertion Types

### `delegation`
Verify a specific delegation tool was called:
```typescript
assertions: {
  delegation: {
    tool: 'askSalesAgent',
    argsContain: ['pricing', 'enterprise'],  // optional
  },
}
```

### `noDelegation`
Verify no delegation occurred:
```typescript
assertions: {
  noDelegation: true,
}
```

### `responseContains`
Verify response text contains keywords:
```typescript
assertions: {
  responseContains: ['price', 'cost', 'plan'],
}
```

## Sample Output

```
Semantic Tests: Delegation Chain
========================================
Running 7 test(s)...

[PASS] orchestrator -> askSalesAgent (pricing inquiry)
  Message: "What are your pricing options for the enterprise plan?"
  Tool: askSalesAgent ✓
  Duration: 2.1s

[PASS] orchestrator -> askSupportAgent (technical issue)
  Message: "My application keeps crashing when I try to log in"
  Tool: askSupportAgent ✓
  Duration: 1.8s

[FAIL] front-end -> askOrchestrator (complex request)
  Message: "I need a price quote for 100 enterprise licenses"
  Expected: askOrchestrator
  Actual: []
  Duration: 1.2s

========================================
Summary: 6 passed | 1 failed | 12.5s total
```

## Extending the Framework

### Adding New Test Types

1. Create a new folder under `tests/` (e.g., `tests/quality/`)
2. Define test cases in `index.ts`
3. Import and add to `cli.ts`:

```typescript
import { qualityTests } from './tests/quality/index.js';

const testCases = [
  ...delegationTests,
  ...qualityTests,
];
```

### Adding New Assertions

Add new assertion functions to `core/assertions.ts`:

```typescript
export function assertLatency(
  result: TestResult,
  maxMs: number
): AssertionResult {
  return {
    type: 'latency',
    passed: result.duration <= maxMs,
    expected: maxMs,
    actual: result.duration,
    message: result.duration > maxMs
      ? `Response took ${result.duration}ms, expected < ${maxMs}ms`
      : undefined,
  };
}
```
