# Coordinator — 多 Agent 编排模式

> 源码位置：`src/coordinator/`
> 编译开关：`feature('COORDINATOR_MODE')`
> 环境变量：`CLAUDE_CODE_COORDINATOR_MODE`

主 Claude 变成纯指挥官，Worker 并行执行任务。

---

## 核心概念

Coordinator 模式将 Claude 分成两个角色：

| 角色 | 职责 | 可用工具 |
|------|------|---------|
| **Coordinator**（指挥官） | 理解目标、拆解任务、综合结果 | 仅 Agent、SendMessage、TaskStop |
| **Worker**（执行者） | 具体代码操作 | 完整工具集（过滤掉内部工具） |

Coordinator **不直接操作代码**，只负责：
- 理解用户目标，拆解任务
- 通过 `Agent` 工具派生 Worker
- 通过 `SendMessage` 向已有 Worker 发送后续指令
- 通过 `TaskStop` 停止方向错误的 Worker
- 综合多个 Worker 的结果，向用户报告

---

## 启用条件

```typescript
// src/coordinator/coordinatorMode.ts
export function isCoordinatorMode(): boolean {
  if (feature('COORDINATOR_MODE')) {
    return isEnvTruthy(process.env.CLAUDE_CODE_COORDINATOR_MODE)
  }
  return false
}
```

需要同时满足：
1. 编译时 `COORDINATOR_MODE` flag 启用
2. 运行时 `CLAUDE_CODE_COORDINATOR_MODE` 环境变量为真

---

## 标准任务流程（四阶段）

| 阶段 | 执行者 | 目的 |
|------|--------|------|
| **Research** | Worker（并行） | 调查代码库，查找文件，理解问题 |
| **Synthesis** | Coordinator 自身 | 阅读发现，理解问题，编写实施规格 |
| **Implementation** | Worker | 按规格做精准改动 |
| **Verification** | Worker | 测试改动是否生效 |

---

## Worker 通信机制

Worker 的执行结果以 XML 格式注入回 Coordinator 的对话流：

```xml
<task-notification>
  <task-id>{agentId}</task-id>
  <status>completed|failed|killed</status>
  <summary>{状态摘要}</summary>
  <result>{Worker 的最终文本回复}</result>
  <usage><total_tokens>N</total_tokens></usage>
</task-notification>
```

---

## 并发管理规则

| 任务类型 | 并行策略 |
|----------|---------|
| 只读任务（研究） | 自由并行 |
| 写操作任务（实施） | 同一组文件同时只能一个 Worker |
| 验证任务 | 可以与实施任务在不同文件区域并行 |

---

## Continue vs Spawn 决策

Coordinator 根据上下文重叠度决定继续已有 Worker 还是创建新 Worker：

| 场景 | 决策 | 方式 |
|------|------|------|
| 研究的文件就是要编辑的文件 | Continue | `SendMessage` |
| 研究范围广但实施范围窄 | Spawn fresh | `Agent` |
| 修正失败或扩展近期工作 | Continue | `SendMessage` |
| 验证另一个 Worker 刚写的代码 | Spawn fresh | 独立视角 |
| 第一次方案完全错误 | Spawn fresh | 避免锚定效应 |

---

## 核心铁律：禁止甩锅式委派

系统提示词中强调的核心原则：

> **Coordinator 必须自己做综合分析**

- 禁止写 "based on your findings" 或 "based on the research"
- Prompt 必须包含**具体文件路径、行号、要做什么改动**
- 必须说明"完成"的标准（例如"提交并报告 hash"）
- **Worker 看不到 Coordinator 的对话**，每个 prompt 必须完全自包含

---

## Scratchpad（跨 Worker 共享知识）

当 `tengu_scratch` feature gate 启用时：

- Coordinator 告知 Worker 一个 scratchpad 目录路径
- Worker 可以在该目录下自由读写文件（不需要权限提示）
- 用于跨 Worker 的持久化知识共享

---

## 会话模式恢复

`matchSessionMode()` 函数处理模式冲突：

如果当前进程处于 coordinator 模式但被恢复的会话是 normal 模式（或反之），会自动翻转 `CLAUDE_CODE_COORDINATOR_MODE` 环境变量以匹配会话的原始模式。

---

## 关键源码文件

| 文件 | 职责 |
|------|------|
| `src/coordinator/coordinatorMode.ts` | 核心逻辑（~370 行）：模式检查、工具过滤、提示词、Worker 管理 |
| `src/coordinator/workerAgent.ts` | Worker Agent 常量定义 |
