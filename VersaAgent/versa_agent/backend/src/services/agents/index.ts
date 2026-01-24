import { prisma } from '../db';
import { llmService, type Message, type LLMProvider } from '../llm';

export interface AgentConfig {
  name: string;
  role: string;
  systemPrompt?: string;
  llmProvider: LLMProvider | string;
  llmModel: string;
  mcpTools?: string[];
  capabilities?: Record<string, unknown>;
  userId?: string;
}

/**
 * Validate if a string is a valid LLM provider
 */
function isValidLLMProvider(provider: string): provider is LLMProvider {
  const validProviders: LLMProvider[] = ['openai', 'anthropic', 'deepseek', 'zhipu', 'moonshot', 'openrouter', 'ollama'];
  return validProviders.includes(provider as LLMProvider);
}

/**
 * Agent - Represents an AI agent with specific role and capabilities
 */
export class Agent {
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Execute a task
   */
  async execute(task: string, input?: Record<string, unknown>): Promise<unknown> {
    // Validate LLM provider
    if (!isValidLLMProvider(this.config.llmProvider)) {
      throw new Error(`Invalid LLM provider: ${this.config.llmProvider}`);
    }

    const messages: Message[] = [];

    // Add system prompt if available
    if (this.config.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.config.systemPrompt
      });
    }

    // Build the task message
    let taskMessage = `Task: ${task}`;
    if (input) {
      taskMessage += `\n\nInput:\n${JSON.stringify(input, null, 2)}`;
    }

    messages.push({
      role: 'user',
      content: taskMessage
    });

    // Call LLM
    const response = await llmService.chat(this.config.llmProvider, {
      model: this.config.llmModel,
      messages,
      temperature: 0.7
    });

    // Try to parse as JSON, otherwise return as text
    try {
      return JSON.parse(response.content);
    } catch {
      return { content: response.content };
    }
  }

  /**
   * Execute with MCP tools
   */
  async executeWithMCP(task: string, mcpTools: unknown[], input?: Record<string, unknown>): Promise<unknown> {
    // Validate LLM provider
    if (!isValidLLMProvider(this.config.llmProvider)) {
      throw new Error(`Invalid LLM provider: ${this.config.llmProvider}`);
    }

    const messages: Message[] = [];

    if (this.config.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.config.systemPrompt
      });
    }

    let taskMessage = `Task: ${task}`;
    if (input) {
      taskMessage += `\n\nInput:\n${JSON.stringify(input, null, 2)}`;
    }

    messages.push({
      role: 'user',
      content: taskMessage
    });

    // Call LLM with tools
    const response = await llmService.chat(this.config.llmProvider, {
      model: this.config.llmModel,
      messages,
      tools: mcpTools as any, // MCP tools have their own type structure
      temperature: 0.7
    });

    return {
      content: response.content,
      toolCalls: response.toolCalls
    };
  }

  /**
   * Save agent to database
   */
  async save(): Promise<Agent> {
    await prisma.agent.upsert({
      where: { name: this.config.name },
      create: {
        name: this.config.name,
        role: this.config.role,
        systemPrompt: this.config.systemPrompt,
        llmProvider: this.config.llmProvider,
        llmModel: this.config.llmModel,
        mcpTools: this.config.mcpTools || [],
        capabilities: this.config.capabilities || {}
      },
      update: {
        role: this.config.role,
        systemPrompt: this.config.systemPrompt,
        llmProvider: this.config.llmProvider,
        llmModel: this.config.llmModel,
        mcpTools: this.config.mcpTools || [],
        capabilities: this.config.capabilities || {}
      }
    });

    return this;
  }

  /**
   * Get an agent by name from database
   */
  static async getByName(name: string): Promise<Agent | null> {
    const agentData = await prisma.agent.findUnique({
      where: { name }
    });

    if (!agentData) {
      return null;
    }

    return new Agent({
      name: agentData.name,
      role: agentData.role,
      systemPrompt: agentData.systemPrompt || undefined,
      llmProvider: agentData.llmProvider,
      llmModel: agentData.llmModel,
      mcpTools: agentData.mcpTools,
      capabilities: agentData.capabilities as Record<string, unknown>
    });
  }

  /**
   * List all agents
   */
  static async listAll(): Promise<Agent[]> {
    const agents = await prisma.agent.findMany();

    return agents.map(a => new Agent({
      name: a.name,
      role: a.role,
      systemPrompt: a.systemPrompt || undefined,
      llmProvider: a.llmProvider,
      llmModel: a.llmModel,
      mcpTools: a.mcpTools,
      capabilities: a.capabilities as Record<string, unknown>
    }));
  }

  /**
   * Create a new agent
   */
  static async create(config: AgentConfig): Promise<Agent> {
    const agent = new Agent(config);
    await agent.save();
    return agent;
  }

  /**
   * Delete an agent
   */
  static async delete(name: string): Promise<void> {
    await prisma.agent.delete({
      where: { name }
    });
  }

  /**
   * Update an agent
   */
  static async update(name: string, config: Partial<AgentConfig>): Promise<Agent> {
    const existing = await Agent.getByName(name);
    if (!existing) {
      throw new Error(`Agent ${name} not found`);
    }

    const updatedConfig = { ...existing.getConfig(), ...config, name };
    const agent = new Agent(updatedConfig);
    await agent.save();
    return agent;
  }
}

// Re-export types
export type { AgentConfig };
