# Semantic Testing Framework

A CLI-based framework for testing agent delegation chains using real LLM calls.

## Overview

Semantic testing validates that agents correctly route requests through the delegation chain. Unlike unit tests that mock dependencies, semantic tests call real LLM endpoints to verify actual agent behavior.

### Delegation Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   ai-chat       │────▶│   front-end     │────▶│   orchestrator  │
│   (widget)      │     │   (Granite)     │     │   (Granite)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                        ┌───────────────────────────────┼───────────────────────────────┐
                        ▼                               ▼                               ▼
                ┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
                │     sales       │             │     support     │             │    knowledge    │
                │   (Gemini)      │             │   (Gemini)      │             │   (Gemini)      │
                └─────────────────┘             └─────────────────┘             └─────────────────┘
```

### How Delegation Detection Works

When an agent delegates to another agent, it uses a tool call. The API response includes a `toolCalls` array:

```json
{
  "success": true,
  "data": {
    "text": "Based on our sales team...",
    "toolCalls": [
      {
        "toolName": "askSalesAgent",
        "args": { "message": "What are your prices?" },
        "result": "Our pricing starts at..."
      }
    ]
  }
}
```

The semantic testing framework inspects this `toolCalls` array to verify correct routing.

## Quick Start

```bash
# Run all semantic tests
npm run semantic-test

# Verbose mode (shows HTTP requests)
npm run semantic-test:verbose

# From inside Docker container
SEMANTIC_TEST_BASE_URL=http://agents:8001 npm run semantic-test
```

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `SEMANTIC_TEST_BASE_URL` | `http://localhost:8001` | Agent API endpoint |
| `SEMANTIC_TEST_TIMEOUT` | `30000` | Request timeout in milliseconds |
| `SEMANTIC_TEST_VERBOSE` | `false` | Show detailed HTTP logging |

## Project Structure

```
semantic_testing/
├── core/                     # Framework core
│   ├── types.ts              # TypeScript interfaces
│   ├── config.ts             # Environment configuration
│   ├── client.ts             # HTTP client for agent API
│   ├── assertions.ts         # Assertion functions
│   ├── runner.ts             # Test execution engine
│   └── reporter.ts           # Console output with colors
├── tests/
│   ├── delegation/           # Delegation chain tests
│   │   └── index.ts
│   ├── quality/              # (Future) Response quality tests
│   └── conversation/         # (Future) Multi-turn conversation tests
├── cli.ts                    # CLI entry point
├── index.ts                  # Module exports
└── README.md                 # Quick reference
```

## Writing Test Cases

### Test Case Interface

```typescript
interface TestCase {
  name: string;                          // Display name
  description?: string;                  // Optional description
  agentPath: string;                     // Agent to call (e.g., 'orchestrator')
  message: string;                       // Message to send
  metadata?: Record<string, unknown>;    // Optional request metadata
  timeout?: number;                      // Override default timeout
  assertions: {
    delegation?: DelegationAssertion;    // Expect specific delegation
    noDelegation?: boolean;              // Expect no delegation
    responseContains?: string[];         // Check response text
  };
}

interface DelegationAssertion {
  tool: string;           // Expected tool name (e.g., 'askSalesAgent')
  argsContain?: string[]; // Keywords that should appear in delegated message
}
```

### Example Test Cases

```typescript
// semantic_testing/tests/delegation/index.ts
import type { TestCase } from '../../core/types.js';

export const delegationTests: TestCase[] = [
  // Test that pricing questions go to sales
  {
    name: 'orchestrator -> askSalesAgent (pricing)',
    description: 'Pricing inquiries should route to sales agent',
    agentPath: 'orchestrator',
    message: 'What are your pricing options for the enterprise plan?',
    assertions: {
      delegation: {
        tool: 'askSalesAgent',
        argsContain: ['pricing'],
      },
    },
  },

  // Test that technical issues go to support
  {
    name: 'orchestrator -> askSupportAgent (crash)',
    agentPath: 'orchestrator',
    message: 'My application keeps crashing when I try to log in',
    assertions: {
      delegation: {
        tool: 'askSupportAgent',
        argsContain: ['crash'],
      },
    },
  },

  // Test that simple greetings are handled directly
  {
    name: 'front-end handles greeting directly',
    agentPath: 'front-end',
    message: 'Hello!',
    assertions: {
      noDelegation: true,
    },
  },

  // Test response content
  {
    name: 'support mentions troubleshooting',
    agentPath: 'support',
    message: 'My app is not working',
    assertions: {
      responseContains: ['help', 'troubleshoot', 'issue'],
    },
  },
];
```

## Assertion Types

### `delegation`

Verify that a specific delegation tool was called:

```typescript
assertions: {
  delegation: {
    tool: 'askSalesAgent',           // Required: tool name
    argsContain: ['pricing', 'plan'], // Optional: keywords in args
  },
}
```

**Passes when:**
- The specified tool appears in `toolCalls`
- All `argsContain` keywords appear in the tool's args (case-insensitive)

### `noDelegation`

Verify that no delegation occurred:

```typescript
assertions: {
  noDelegation: true,
}
```

**Passes when:**
- No tools starting with `ask` appear in `toolCalls`

### `responseContains`

Verify the response text contains specific keywords:

```typescript
assertions: {
  responseContains: ['price', 'cost', 'plan'],
}
```

**Passes when:**
- All keywords appear in `response.data.text` (case-insensitive)

## Current Test Suite

| Test Name | Agent | Expected Behavior |
|-----------|-------|-------------------|
| Pricing inquiry | orchestrator | Delegates to `askSalesAgent` |
| Quote request | orchestrator | Delegates to `askSalesAgent` |
| Technical issue | orchestrator | Delegates to `askSupportAgent` |
| Password reset | orchestrator | Delegates to `askSupportAgent` |
| Documentation | orchestrator | Delegates to `askKnowledgeAgent` |
| Complex request | front-end | Delegates to `askOrchestrator` |
| Simple greeting | front-end | No delegation (handles directly) |

## Sample Output

```
Semantic Tests: Delegation Chain
========================================
Running 7 test(s)...

[PASS] orchestrator -> askSalesAgent (pricing inquiry)
  Message: "What are your pricing options for the enterprise plan?"
  Tool: askSalesAgent ✓
  Duration: 1.9s

[PASS] orchestrator -> askSalesAgent (quote request)
  Message: "I want to buy your product. Can you give me a quote for 10 licenses?"
  Tool: askSalesAgent ✓
  Duration: 1.9s

[PASS] orchestrator -> askSupportAgent (technical issue)
  Message: "My application keeps crashing when I try to log in"
  Tool: askSupportAgent ✓
  Duration: 5.3s

[PASS] front-end -> no delegation (simple greeting)
  Message: "Hello!"
  No delegation ✓
  Duration: 0.4s

========================================
Summary: 7 passed | 0 failed | 16.7s total
```

## Extending the Framework

### Adding New Test Types

1. Create a new folder: `semantic_testing/tests/quality/`

2. Create test cases:
```typescript
// semantic_testing/tests/quality/index.ts
import type { TestCase } from '../../core/types.js';

export const qualityTests: TestCase[] = [
  {
    name: 'Response is helpful and professional',
    agentPath: 'front-end',
    message: 'I need help',
    assertions: {
      responseContains: ['help', 'assist'],
    },
  },
];
```

3. Register in CLI:
```typescript
// semantic_testing/cli.ts
import { qualityTests } from './tests/quality/index.js';

const testCases = [
  ...delegationTests,
  ...qualityTests,  // Add new test suite
];
```

### Adding New Assertions

Add to `core/assertions.ts`:

```typescript
export function assertResponseLength(
  response: ChatResponse,
  minLength: number,
  maxLength: number
): AssertionResult {
  const length = response.data.text.length;
  const passed = length >= minLength && length <= maxLength;

  return {
    type: 'response-length',
    passed,
    expected: { min: minLength, max: maxLength },
    actual: length,
    message: passed
      ? undefined
      : `Response length ${length} not in range [${minLength}, ${maxLength}]`,
  };
}
```

Then use in runner:
```typescript
// core/runner.ts
if (testCase.assertions.responseLength) {
  assertionResults.push(
    assertions.assertResponseLength(
      response,
      testCase.assertions.responseLength.min,
      testCase.assertions.responseLength.max
    )
  );
}
```

### Adding New Reporters

Implement the `Reporter` interface:

```typescript
// core/types.ts
interface Reporter {
  onStart(testCases: TestCase[]): void;
  onTestStart(testCase: TestCase): void;
  onTestEnd(testCase: TestCase, result: TestResult): void;
  onEnd(results: TestResult[]): void;
}
```

Example JSON reporter:
```typescript
// reporters/json-reporter.ts
export class JsonReporter implements Reporter {
  private results: TestResult[] = [];

  onStart() {}
  onTestStart() {}

  onTestEnd(_: TestCase, result: TestResult) {
    this.results.push(result);
  }

  onEnd() {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.results.map(r => ({
        name: r.testCase.name,
        status: r.status,
        duration: r.duration,
      })),
    }, null, 2));
  }
}
```

## Troubleshooting

### "fetch failed" errors

The test client can't reach the agents API. Check:
- Is the agents service running? (`docker compose up agents`)
- Are you using the correct base URL?
  - From host machine: `http://localhost:8001`
  - From Docker container: `http://agents:8001`

### Tests timing out

Increase the timeout:
```bash
SEMANTIC_TEST_TIMEOUT=60000 npm run semantic-test
```

### Unexpected delegation routing

LLMs are non-deterministic. If a test fails because the LLM chose a different route:
1. Check if the routing is reasonable (may need to accept it)
2. Make the test prompt more specific
3. Adjust the orchestrator's system prompt for clearer routing rules

### Viewing detailed output

Use verbose mode to see HTTP requests:
```bash
npm run semantic-test:verbose
```

## Best Practices

1. **Use clear, unambiguous prompts** - Avoid prompts that could reasonably go to multiple agents

2. **Test the boundaries** - Include tests for edge cases like greetings, unclear requests

3. **Keep tests focused** - Each test should verify one specific behavior

4. **Use descriptive names** - `orchestrator -> askSalesAgent (pricing)` is better than `test1`

5. **Run regularly** - Include in CI/CD to catch routing regressions

6. **Accept LLM variability** - Some routing decisions are subjective; focus on clearly wrong behaviors
