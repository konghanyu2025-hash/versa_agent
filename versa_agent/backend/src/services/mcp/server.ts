/**
 * MCP Server - Exposes VersaAgent capabilities to other applications
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { workflowEngine } from '../workflow/engine';
import { Agent } from '../agents';

export class MCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'versa-agent',
        version: '2.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'execute_workflow',
            description: 'Execute a workflow with the given configuration',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Workflow name' },
                mode: {
                  type: 'string',
                  enum: ['AUTO', 'SEMI', 'TEMPLATE'],
                  description: 'Execution mode'
                },
                steps: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      agentName: { type: 'string' },
                      task: { type: 'string' },
                      requiresConfirm: { type: 'boolean' }
                    },
                    required: ['agentName', 'task']
                  }
                }
              },
              required: ['name', 'mode', 'steps']
            }
          },
          {
            name: 'create_agent',
            description: 'Create a new agent with specified configuration',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                role: { type: 'string' },
                systemPrompt: { type: 'string' },
                llmProvider: { type: 'string' },
                llmModel: { type: 'string' }
              },
              required: ['name', 'role', 'llmProvider', 'llmModel']
            }
          },
          {
            name: 'list_workflows',
            description: 'List all workflows',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_workflow_status',
            description: 'Get the status of a specific workflow',
            inputSchema: {
              type: 'object',
              properties: {
                workflowId: { type: 'string' }
              },
              required: ['workflowId']
            }
          },
          {
            name: 'execute_agent_task',
            description: 'Execute a task with a specific agent',
            inputSchema: {
              type: 'object',
              properties: {
                agentName: { type: 'string' },
                task: { type: 'string' },
                input: { type: 'object' }
              },
              required: ['agentName', 'task']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'execute_workflow': {
          const workflow = await workflowEngine.createWorkflow({
            name: args.name as string,
            mode: args.mode as any,
            steps: args.steps as any[]
          });
          const result = await workflowEngine.executeWorkflow(workflow.id);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }]
          };
        }

        case 'create_agent': {
          const agent = await Agent.create({
            name: args.name as string,
            role: args.role as string,
            systemPrompt: args.systemPrompt as string,
            llmProvider: args.llmProvider as string,
            llmModel: args.llmModel as string
          });
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ agent: agent.getConfig() }, null, 2)
            }]
          };
        }

        case 'list_workflows': {
          const workflows = await workflowEngine.listWorkflows();
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(workflows, null, 2)
            }]
          };
        }

        case 'get_workflow_status': {
          const workflow = await workflowEngine.getWorkflow(args.workflowId as string);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(workflow, null, 2)
            }]
          };
        }

        case 'execute_agent_task': {
          const agent = await Agent.getByName(args.agentName as string);
          if (!agent) {
            throw new Error(`Agent '${args.agentName}' not found`);
          }
          const result = await agent.execute(
            args.task as string,
            args.input as Record<string, unknown>
          );
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }]
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  /**
   * Start the MCP server with stdio transport
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('VersaAgent MCP Server running on stdio');
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    await this.server.close();
  }
}
