# VersaAgent 2.0

智能多代理协作平台

## 功能特性

VersaAgent 2.0 是一个多代理协作平台，支持：

- 多 LLM 支持 - OpenAI、Anthropic、DeepSeek、智谱 AI、Moonshot、Ollama
- 工作流引擎 - 全自动、半自动、模板三种执行模式
- MCP 集成 - 同时支持 Client 和 Server 模式
- 任务持久化 - PostgreSQL 数据库存储
- 实时更新 - SSE 推送工作流状态

## 架构

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

## 快速开始

### 前置要求

- Node.js >= 20.0.0
- PostgreSQL >= 14
- Docker (可选)

### 1. 克隆仓库

```bash
git clone https://github.com/konghanyu-hash/VersaAgent.git
cd VersaAgent
```

### 2. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 3. 配置环境变量

复制 `.env.example` 到 `.env` 并配置：

```bash
cp .env.example backend/.env
```

编辑 `backend/.env` 文件，添加你的 API Keys。

### 4. 启动 PostgreSQL 数据库

使用 Docker Compose：

```bash
docker-compose up -d postgres
```

### 5. 运行数据库迁移

```bash
cd backend
npm run prisma:migrate
npm run prisma:generate
```

### 6. 启动服务

```bash
# 后端 (终端 1)
cd backend
npm run dev

# 前端 (终端 2)
cd frontend
npm run dev
```

访问 http://localhost:5173

## Docker 部署

```bash
docker-compose up -d
```

## 文档

- [API 文档](docs/API.md)
- [贡献指南](CONTRIBUTING.md)
- [安全策略](SECURITY.md)

## API 端点

### 工作流
- `GET /api/workflows` - 获取所有工作流
- `POST /api/workflows` - 创建新工作流
- `GET /api/workflows/:id` - 获取工作流详情
- `POST /api/workflows/:id/execute` - 执行工作流
- `POST /api/workflows/:id/cancel` - 取消工作流
- `POST /api/workflows/:id/steps/:stepId/confirm` - 确认步骤

### 代理
- `GET /api/agents` - 获取所有代理
- `POST /api/agents` - 创建新代理
- `GET /api/agents/:name` - 获取代理详情
- `PUT /api/agents/:name` - 更新代理
- `DELETE /api/agents/:name` - 删除代理
- `POST /api/agents/:name/execute` - 执行代理任务

### LLM
- `GET /api/llm/providers` - 获取可用的 LLM 提供商
- `POST /api/llm/chat` - 聊天（非流式）
- `POST /api/llm/chat/stream` - 聊天（流式 SSE）

## 贡献指南

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 路线图

- [ ] WebUI 界面优化
- [ ] 更多 LLM 提供商支持
- [ ] 工作流可视化编辑器
- [ ] 代理市场/插件系统
- [ ] 更多 MCP 工具集成

## 截图

> 添加项目截图

## 常见问题

<details>
<summary><b>如何配置多个 LLM 提供商？</b></summary>

在 `backend/.env` 文件中添加对应的 API Keys：
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
```
</details>

<details>
<summary><b>支持本地模型吗？</b></summary>

是的！通过 Ollama 支持本地模型。确保 Ollama 正在运行：
```bash
ollama serve
```
</details>

## 技术栈

**后端：**
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- SSE (Server-Sent Events)
- MCP SDK

**前端：**
- React + TypeScript + Vite
- Zustand (状态管理)
- React Router

## 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 致谢

- [OpenAI](https://openai.com/) - GPT 模型
- [Anthropic](https://www.anthropic.com/) - Claude 模型
- [DeepSeek](https://www.deepseek.com/) - DeepSeek 模型
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP 规范

## 联系方式

作者: 孔涵羽

---

如果这个项目对你有帮助，请给一个星标
