# Contributing to VersaAgent

感谢你考虑为 VersaAgent 做贡献！

## 开发流程

1. **Fork 仓库**
   - 点击 GitHub 页面右上角的 Fork 按钮

2. **Clone 你的 fork**
   ```bash
   git clone https://github.com/konghanyu-hash/VersaAgent.git
   cd VersaAgent
   ```

3. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

4. **安装依赖**
   ```bash
   # 后端
   cd backend && npm install

   # 前端
   cd ../frontend && npm install
   ```

5. **进行开发**
   - 遵循现有代码风格
   - 添加必要的测试
   - 更新相关文档

6. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   提交信息格式：
   - `feat:` 新功能
   - `fix:` Bug 修复
   - `docs:` 文档更新
   - `style:` 代码格式调整
   - `refactor:` 代码重构
   - `test:` 测试相关
   - `chore:` 构建/工具链相关

7. **推送到你的 fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **创建 Pull Request**
   - 访问原始仓库页面
   - 点击 "New Pull Request"
   - 填写 PR 描述模板

## 代码规范

### TypeScript
- 使用严格模式 (`strict: true`)
- 避免使用 `any` 类型
- 为所有函数添加返回类型
- 为公共 API 添加 JSDoc 注释

### React
- 使用函数组件和 Hooks
- 组件名使用 PascalCase
- 文件名使用 kebab-case 或 PascalCase

### 命名约定
- 文件名: `kebab-case.ts` 或 `PascalCase.tsx`
- 变量/函数: `camelCase`
- 常量: `UPPER_SNAKE_CASE`
- 类/接口/类型: `PascalCase`
- 私有成员: `_camelCase`

## 测试

```bash
# 运行所有测试
npm test

# 运行测试并查看覆盖率
npm test:coverage

# 运行 linting
npm run lint
```

## 报告 Bug

请通过 [Issues](https://github.com/konghanyu-hash/VersaAgent/issues) 报告 bug，包含：
- Bug 描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（OS、Node 版本等）

## 提出功能建议

欢迎提出功能建议！请在创建 Issue 前：
1. 检查是否已有类似建议
2. 描述使用场景
3. 说明为什么这个功能有用

## 行为准则

- 尊重所有贡献者
- 欢迎不同观点和建设性批评
- 关注对社区最有利的事情

## 许可证

通过贡献代码，你同意你的贡献将使用 MIT 许可证进行许可。
