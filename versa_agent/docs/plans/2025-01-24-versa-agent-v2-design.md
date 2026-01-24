# VersaAgent 2.0 设计文档

日期: 2025-01-24
版本: 2.0
状态: 设计阶段

## 1. 概述

VersaAgent 2.0 是对现有智能多代理协作平台的重大升级，新增以下核心功能：

1. 全自动操作功能 - 支持全自动、半自动、工作流模板三种模式
2. MCP 功能 - 同时支持 Client 和 Server 模式
3. 多 LLM 支持 - 支持 OpenAI、Anthropic、DeepSeek、本地模型、国产模型
4. 任务持久化 - 使用 PostgreSQL 存储所有任务和状态
5. 实时数据库更新 - 使用 SSE + PostgreSQL LISTEN/NOTIFY

## 2. 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│  │ Task Panel  │ │ Agent View  │ │ Workflow Editor     │    │
│  └─────────────┘ └─────────────┘ └─────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ SSE / HTTP
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway (Express)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────────────┐ │
│  │ Auth     │ │ Rate Limit│ │ Request Router              │ │
│  └──────────┘ └──────────┘ └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐   ┌──────────────┐
│  LLM Service │    │ Workflow Engine  │   │ MCP Service  │
│  (多LLM统一) │    │  (自动/半自动)    │   │(Client+Server)│
└──────────────┘    └──────────────────┘   └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌─────────────────────┐
                    │   PostgreSQL DB     │
                    │ + LISTEN/NOTIFY     │
                    └─────────────────────┘
```

**技术栈：**
- 前端：React + TypeScript + Vite + Zustand
- 后端：Node.js + Express + TypeScript
- 数据库：PostgreSQL + Prisma ORM
- 实时通信：SSE (Server-Sent Events)
- MCP：@modelcontextprotocol SDK

## 3. 多 LLM 统一服务

### 3.1 核心接口

```typescript
interface LLMProvider {
  name: string;
  chat(params: ChatParams): Promise<ChatResponse>;
  stream(params: ChatParams): AsyncIterable<ChatChunk>;
  estimateCost(tokens: number): number;
}

interface ChatParams {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
}
```

### 3.2 支持的提供商

| 提供商 | 文件 | 模型 |
|--------|------|------|
| OpenAI | `openai.ts` | GPT-4, GPT-3.5 |
| Anthropic | `anthropic.ts` | Claude 3.5 Sonnet |
| DeepSeek | `deepseek.ts` | deepseek-chat |
| 智谱 AI | `zhipu.ts` | GLM-4 |
| Moonshot | `kimi.ts` | moonshot-v1 |
| 中转站 | `openrouter.ts` | 聚合多个模型 |
| 本地模型 | `ollama.ts` | 各种开源模型 |

### 3.3 关键特性

- **智能路由**：根据任务类型自动选择最合适的 LLM
- **故障转移**：主 LLM 失败时自动切换备用
- **成本追踪**：记录每次调用的 token 和费用
- **速率限制**：每个提供商独立的速率控制
- **缓存层**：相似查询的智能缓存

## 4. 工作流引擎与自动化模式

### 4.1 三种执行模式

#### 全自动模式 (auto)
```typescript
await workflowEngine.execute({
  mode: 'auto',
  task: "分析本周销售数据并生成报告",
  agents: ['analyst', 'writer', 'reviewer']
});
// 无需人工干预，自动完成所有步骤
```

#### 半自动模式 (semi)
```typescript
await workflowEngine.execute({
  mode: 'semi',
  task: "部署新版本到生产环境",
  steps: [
    { agent: 'devops', task: '运行测试' },
    { agent: 'devops', task: '部署', confirm: true },  // 确认点
    { agent: 'monitor', task: '验证部署' }
  ]
});
// 在部署前暂停，等待用户确认后继续
```

#### 工作流模板 (template)
```typescript
const skillDeploy = {
  name: 'production-deploy',
  description: '标准生产部署流程',
  steps: [
    { agent: 'tester', task: '运行完整测试套件' },
    { agent: 'reviewer', task: '代码审查检查' },
    { agent: 'builder', task: '构建 Docker 镜像' },
    { agent: 'deployer', task: '灰度发布', confirm: true }
  ]
};
// 用户：使用 skill production-deploy
```

### 4.2 状态机

```
┌─────────┐   ┌─────────┐   ┌──────────┐   ┌──────────┐
│ PENDING │ → │ RUNNING │ → │ PAUSED   │ → │ COMPLETE │
└─────────┘   └─────────┘   └──────────┘   └──────────┘
                    │              │
                    ▼              ▼
               ┌──────────┐   ┌──────────┐
               │ FAILED   │   │ CANCELLED│
               └──────────┘   └──────────┘
```

### 4.3 SSE 实时推送

```typescript
// 服务器端
eventStream.emit('step:start', { stepId, agent, timestamp });
eventStream.emit('step:progress', { stepId, progress, output });
eventStream.emit('step:confirm', { stepId, message, options });
eventStream.emit('workflow:complete', { workflowId, result });
```

## 5. MCP 集成

### 5.1 Client 模式

允许代理调用外部 MCP 服务工具：

```typescript
class Agent {
  async executeWithMCP(task: string) {
    const mcpTools = await mcpClient.getAvailableTools();
    // filesystem, fetch, postgres, browser 等

    return await this.llm.chat({
      tools: mcpTools,
      task: task
    });
  }
}
```

### 5.2 Server 模式

暴露 VersaAgent 能力给其他应用：

```typescript
const versAgentServer = new MCPServer({
  name: 'versa-agent',
  version: '2.0.0',
  tools: {
    execute_workflow: { /* ... */ },
    create_agent: { /* ... */ },
    query_status: { /* ... */ }
  }
});
```

## 6. 数据库设计

### 6.1 核心表结构

```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 工作流表
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    mode VARCHAR(20) NOT NULL,
    config JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 工作流步骤表
CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id),
    sequence INTEGER NOT NULL,
    agent_name VARCHAR(50) NOT NULL,
    task TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    input JSONB,
    output JSONB,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

-- 代理表
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    system_prompt TEXT,
    llm_provider VARCHAR(50),
    llm_model VARCHAR(100),
    mcp_tools TEXT[],
    capabilities JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LLM 使用记录表
CREATE TABLE llm_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    cost_usd DECIMAL(10, 4),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 实时通知

```sql
-- 状态流视图
CREATE VIEW workflow_status_stream AS
SELECT
    w.id,
    w.name,
    w.status,
    COUNT(s.id) FILTER (WHERE s.status = 'completed') as completed_steps,
    COUNT(s.id) as total_steps,
    NOW() as last_update
FROM workflows w
LEFT JOIN workflow_steps s ON s.workflow_id = w.id
GROUP BY w.id;
```

```typescript
// SSE + PostgreSQL LISTEN/NOTIFY
db.listen('workflow_update', (payload) => {
  sseEmitter.emit('workflow:changed', payload);
});
```

## 7. 项目结构

```
VersaAgent/
├── frontend/                    # React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── stores/             # Zustand
│   │   ├── services/
│   │   ├── hooks/
│   │   └── App.tsx
│   └── package.json
│
├── backend/                     # Node.js + Express
│   ├── src/
│   │   ├── api/
│   │   ├── services/
│   │   │   ├── llm/
│   │   │   ├── workflow/
│   │   │   ├── mcp/
│   │   │   └── sse.ts
│   │   ├── db/
│   │   ├── agents/
│   │   └── index.ts
│   └── package.json
│
├── docker-compose.yml
├── docs/
│   └── plans/
│       └── 2025-01-24-versa-agent-v2-design.md
└── README.md
```

## 8. 核心依赖

```json
// Backend
{
  "@modelcontextprotocol/sdk": "^1.0.4",
  "@prisma/client": "^5.20.0",
  "express": "^4.18.2",
  "openai": "^4.67.0",
  "@anthropic-ai/sdk": "^0.30.0",
  "ollama": "^0.5.0",
  "zod": "^3.23.0"
}

// Frontend
{
  "react": "^18.3.0",
  "zustand": "^5.0.0",
  "eventsource": "^2.0.0",
  "react-router-dom": "^6.26.0"
}
```

## 9. 实施优先级

| 阶段 | 任务 | 优先级 |
|------|------|--------|
| 1 | 数据库设计与迁移 | 高 |
| 2 | LLM 统一服务 | 高 |
| 3 | 工作流引擎核心 | 高 |
| 4 | 前端重构 (React) | 中 |
| 5 | MCP 集成 | 中 |
| 6 | SSE 实时推送 | 中 |
| 7 | 测试覆盖 | 高 |
