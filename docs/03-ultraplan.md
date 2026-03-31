# ULTRAPLAN — 云端深度规划

> 源码位置：`src/commands/ultraplan.tsx`、`src/utils/ultraplan/`、`src/utils/teleport/`
> 编译开关：`feature('ULTRAPLAN')`
> 远程开关：GrowthBook `tengu_ultraplan_model`
> 访问限制：`isEnabled: () => "external" === 'ant'`（外部版永不可用）

把难题甩给云端 Opus 独立研究最长 30 分钟。

---

## 核心概念

Ultraplan 是一个高级多代理规划模式：本地 CLI 将复杂任务发送到 Claude Code on the Web（CCR）上的远程会话，由 Opus 模型独立研究 10-30 分钟，用户可以在浏览器中查看、修改、批准方案，最后将计划传送回本地执行。

---

## 工作流程

```
本地 CLI                            云端 CCR
   │                                   │
   │  1. /ultraplan <prompt>            │
   │ ──────────────────────────────────>│
   │                                   │  2. Opus 独立研究
   │                                   │     （最长 30 分钟）
   │  3. 后台轮询等待                    │
   │ <─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
   │                                   │
   │  4. 浏览器查看/修改方案             │
   │ ──────────────────────────────────>│
   │                                   │
   │  5. 批准执行 or 传送回本地          │
   │ <──────────────────────────────────│
```

### 详细步骤

1. 用户输入 `/ultraplan <prompt>` 或在消息中包含 "ultraplan" 关键词
2. 通过 `teleportToRemote()` 创建远程 CCR 会话
3. 本地 CLI 后台轮询等待（30 分钟超时）
4. 用户在浏览器中查看规划方案、修改、批准
5. 方案可以在远程执行，也可以"传送"回本地跑

---

## 关键词触发

`src/utils/ultraplan/keyword.ts` 实现了精密的关键词检测算法：

- 在消息中检测 `ultraplan` 和 `ultrareview` 关键词
- **智能排除**：引号内、文件路径中、标识符中的出现不触发
- 避免误触发场景

---

## Teleport（传送系统）

Ultraplan 依赖的底层传送机制，实现本地 ↔ 远程会话的双向传输。

### 核心能力

| 方向 | 方式 | 说明 |
|------|------|------|
| 本地 → 远程 | `--remote [description]` | 创建远程 CCR 会话 |
| 远程 → 本地 | `--teleport [session-id]` | 恢复远程会话到本地 |

### Git Bundle 打包

`src/utils/teleport/gitBundle.ts` 在传送时将代码上下文打包为 Git Bundle，确保远程会话拥有完整的代码访问能力。

### UI 组件

| 组件 | 说明 |
|------|------|
| `src/components/TeleportProgress.tsx` | 传送进度条 |
| `src/components/TeleportError.tsx` | 传送错误提示 |
| `src/components/TeleportStash.tsx` | Stash 管理 |
| `src/components/TeleportResumeWrapper.tsx` | 恢复包装器 |
| `src/hooks/useTeleportResume.tsx` | 恢复状态 Hook |

---

## 访问限制

Ultraplan 在外部版本中**完全不可用**：

```typescript
isEnabled: () => "external" === 'ant'  // 永远为 false
```

只有 Anthropic 内部员工（`USER_TYPE === 'ant'`）能使用此功能。外部构建中相关代码被编译时 DCE（Dead Code Elimination）移除。

---

## 模型配置

使用的模型通过 GrowthBook `tengu_ultraplan_model` 远程控制，支持动态切换。

内部用户还可以通过环境变量覆盖：
- `ULTRAPLAN_PROMPT_FILE`：自定义提示文件路径

---

## 关键源码文件

| 文件 | 职责 |
|------|------|
| `src/commands/ultraplan.tsx` | Ultraplan 命令入口 |
| `src/utils/ultraplan/ccrSession.ts` | CCR 远程会话管理 |
| `src/utils/ultraplan/prompt.txt` | 提示模板（sourcemap 中为占位符） |
| `src/utils/ultraplan/keyword.ts` | 关键词触发检测 |
| `src/utils/teleport.tsx` | 核心传送逻辑 |
| `src/utils/teleport/api.ts` | 传送 API 层 |
| `src/utils/teleport/gitBundle.ts` | Git Bundle 打包 |
