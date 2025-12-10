/**
 * Delegation Chain Test Cases
 *
 * These tests verify that agents correctly delegate requests to other agents.
 */

import type { TestCase } from '../../core/types.js';

export const delegationTests: TestCase[] = [
  // Orchestrator -> Sales Agent
  {
    name: 'orchestrator -> askSalesAgent (pricing inquiry)',
    description: 'Pricing questions should be delegated to the sales agent',
    agentPath: 'orchestrator',
    message: 'What are your pricing options for the enterprise plan?',
    assertions: {
      delegation: {
        tool: 'askSalesAgent',
        argsContain: ['pricing'],
      },
    },
  },
  {
    name: 'orchestrator -> askSalesAgent (quote request)',
    description: 'Quote requests should be delegated to the sales agent',
    agentPath: 'orchestrator',
    message: 'I want to buy your product. Can you give me a quote for 10 licenses?',
    assertions: {
      delegation: {
        tool: 'askSalesAgent',
        argsContain: ['quote'],
      },
    },
  },

  // Orchestrator -> Support Agent
  {
    name: 'orchestrator -> askSupportAgent (technical issue)',
    description: 'Technical issues should be delegated to the support agent',
    agentPath: 'orchestrator',
    message: 'My application keeps crashing when I try to log in',
    assertions: {
      delegation: {
        tool: 'askSupportAgent',
        argsContain: ['crash'],
      },
    },
  },
  {
    name: 'orchestrator -> askSupportAgent (password reset)',
    description: 'Password reset requests should be delegated to support',
    agentPath: 'orchestrator',
    message: 'How do I reset my password?',
    assertions: {
      delegation: {
        tool: 'askSupportAgent',
        argsContain: ['password'],
      },
    },
  },

  // Orchestrator -> Knowledge Agent
  {
    name: 'orchestrator -> askKnowledgeAgent (documentation)',
    description: 'Documentation questions should be delegated to knowledge agent',
    agentPath: 'orchestrator',
    message: 'Where can I find the API documentation?',
    assertions: {
      delegation: {
        tool: 'askKnowledgeAgent',
        argsContain: ['documentation'],
      },
    },
  },

  // Front-end -> Orchestrator
  {
    name: 'front-end -> askOrchestrator (complex request)',
    description: 'Complex requests should be delegated to orchestrator',
    agentPath: 'front-end',
    message: 'I need a price quote for 100 enterprise licenses',
    assertions: {
      delegation: {
        tool: 'askOrchestrator',
      },
    },
  },

  // No delegation expected
  {
    name: 'front-end -> no delegation (simple greeting)',
    description: 'Simple greetings should be handled directly without delegation',
    agentPath: 'front-end',
    message: 'Hello!',
    assertions: {
      noDelegation: true,
    },
  },
];
