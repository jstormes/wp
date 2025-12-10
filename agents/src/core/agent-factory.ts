import type { AgentConfig, RuntimeAgent } from '../types/agent.js';
import { BaseAgent } from './base-agent.js';
import { Logger } from '../utils/logger.js';
import type { AgentRegistry } from './registry.js';

const logger = new Logger('AgentFactory');

export interface AgentFactoryOptions {
  registry?: AgentRegistry;
}

export class AgentFactory {
  static async create(config: AgentConfig, options?: AgentFactoryOptions): Promise<RuntimeAgent> {
    logger.info('Creating agent', { id: config.id, path: config.path });

    const agent = new BaseAgent(config, options?.registry);
    await agent.initialize();

    logger.info('Agent created successfully', { id: config.id });
    return agent;
  }

  static createLazy(config: AgentConfig, options?: AgentFactoryOptions): RuntimeAgent {
    logger.info('Creating lazy agent', { id: config.id, path: config.path });
    return new BaseAgent(config, options?.registry);
  }
}
