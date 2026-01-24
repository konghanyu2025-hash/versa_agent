/**
 * MCP Client - Allows agents to use external MCP tools
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export class MCPClient {
  private clients: Map<string, Client> = new Map();

  /**
   * Connect to an MCP server via stdio
   */
  async connectServer(name: string, command: string, args: string[] = []): Promise<void> {
    const transport = new StdioClientTransport({
      command,
      args
    });

    const client = new Client({
      name: `versa-agent-${name}`,
      version: '2.0.0'
    }, {
      capabilities: {}
    });

    await client.connect(transport);
    this.clients.set(name, client);
  }

  /**
   * Get available tools from a connected MCP server
   */
  async getTools(serverName: string): Promise<MCPTool[]> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server '${serverName}' not connected`);
    }

    const response = await client.listTools();
    return response.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }

  /**
   * Get all tools from all connected servers
   */
  async getAllTools(): Promise<Map<string, MCPTool[]>> {
    const tools = new Map<string, MCPTool[]>();

    for (const [serverName] of this.clients) {
      tools.set(serverName, await this.getTools(serverName));
    }

    return tools;
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool(serverName: string, toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server '${serverName}' not connected`);
    }

    const response = await client.callTool({
      name: toolName,
      arguments: args
    });

    return response.content;
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnectServer(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    if (client) {
      await client.close();
      this.clients.delete(serverName);
    }
  }

  /**
   * Get list of connected servers
   */
  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    for (const serverName of this.clients.keys()) {
      await this.disconnectServer(serverName);
    }
  }
}

export const mcpClient = new MCPClient();
