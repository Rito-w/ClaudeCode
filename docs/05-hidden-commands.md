# 隐藏命令 & 秘密开关

> 源码位置：`src/commands.ts`、`src/commands/`、`src/main.tsx`

Claude Code 中有大量未公开的斜杠命令、CLI 参数和环境变量。

---

## Feature-gated 命令

通过编译开关控制，外部版本中不可见：

| 命令 | 编译开关 | 功能 |
|------|---------|------|
| `/buddy` | `BUDDY` | 宠物伴侣系统 |
| `/proactive` | `PROACTIVE` / `KAIROS` | 主动自主模式 |
| `/assistant` | `KAIROS` | 持久助手模式 |
| `/brief` | `KAIROS` / `KAIROS_BRIEF` | 简报模式 |
| `/bridge` | `BRIDGE_MODE` | 远程控制桥接 |
| `/voice` | `VOICE_MODE` | 语音交互 |
| `/ultraplan` | `ULTRAPLAN` | 云端深度规划 |
| `/fork` | `FORK_SUBAGENT` | 子代理分叉 |
| `/peers` | `UDS_INBOX` | 对等通信（Unix Domain Socket） |
| `/workflows` | `WORKFLOW_SCRIPTS` | 工作流脚本 |
| `/torch` | `TORCH` | Torch 功能 |
| `/force-snip` | `HISTORY_SNIP` | 强制历史截断 |
| `/remoteControlServer` | `DAEMON` + `BRIDGE_MODE` | 远程控制服务器 |
| `/web` / `/remote-setup` | `CCR_REMOTE_SETUP` | Claude Code on the Web 设置 |

---

## 仅内部用户命令

仅 `USER_TYPE === 'ant'`（Anthropic 内部员工）可见，定义在 `src/commands.ts` 第 225-254 行：

| 命令 | 功能 |
|------|------|
| `/teleport` | 传送会话到远程/本地 |
| `/bughunter` | 内部 Bug 猎人 |
| `/mock-limits` | 模拟速率限制 |
| `/ctx_viz` | 上下文可视化 |
| `/break-cache` | 强制缓存清除 |
| `/ant-trace` | 内部追踪工具 |
| `/good-claude` | 内部正向反馈 |
| `/agents-platform` | 智能体平台管理 |
| `/autofix-pr` | 自动修复 PR |
| `/debug-tool-call` | 调试工具调用 |
| `/reset-limits` | 重置速率限制 |
| `/backfill-sessions` | 回填历史会话 |
| `/commit-push-pr` | 内部提交/推送/PR 工作流 |
| `/perf-issue` | 性能问题诊断 |
| `/share` / `/summary` | 会话分享和总结 |
| `/bridge-kick` | 踢出桥接连接 |
| `/subscribe-pr` | PR 订阅（需 `KAIROS_GITHUB_WEBHOOKS`） |
| `/tags` | 标签管理 |
| `/files` | 文件列表 |
| `/env` | 环境变量管理 |
| `/oauth-refresh` | OAuth 刷新 |
| `/onboarding` | 引导流程 |
| `/init-verifiers` | 初始化验证器 |

---

## 其他不常见命令

外部版本可见但鲜为人知：

| 命令 | 功能 |
|------|------|
| `/stickers` | 贴纸 |
| `/thinkback` / `/thinkback-play` | 思维回放 |
| `/rewind` | 历史倒退 |
| `/heapdump` | 堆转储 |
| `/sandbox-toggle` | 沙箱开关 |
| `/chrome` | Chrome 浏览器集成 |
| `/advisor` | 服务端顾问工具 |
| `/btw` | 快速备注（"by the way"） |

---

## 隐藏 CLI 参数

定义在 `src/main.tsx` 第 3817-3877 行，通过 `hideHelp()` 隐藏。

### 所有构建可见但隐藏

| 参数 | 功能 |
|------|------|
| `--teleport [session]` | 恢复传送会话 |
| `--remote [description]` | 创建远程会话 |
| `--sdk-url <url>` | WebSocket 端点（仅 `-p` 模式） |
| `--advisor <model>` | 服务端顾问工具 |
| `--agent-id <id>` | 队友代理 ID |
| `--agent-name <name>` | 队友显示名称 |
| `--team-name <name>` | 团队名称 |
| `--agent-color <color>` | 队友 UI 颜色 |
| `--plan-mode-required` | 需要先进入计划模式 |
| `--parent-session-id <id>` | 父会话 ID |
| `--teammate-mode <mode>` | 队友生成方式 |
| `--agent-type <type>` | 自定义代理类型 |

### 仅 ant 构建

| 参数 | 功能 |
|------|------|
| `--delegate-permissions` | `--permission-mode auto` 别名 |
| `--afk` | 已弃用的 auto 模式别名 |
| `--tasks [id]` | 任务模式 |
| `--agent-teams` | 多代理团队模式 |

### Feature-gated 参数

| 参数 | 编译开关 |
|------|---------|
| `--proactive` | `PROACTIVE` / `KAIROS` |
| `--brief` | `KAIROS` / `KAIROS_BRIEF` |
| `--assistant` | `KAIROS` |
| `--channels <servers...>` | `KAIROS` / `KAIROS_CHANNELS` |
| `--remote-control [name]` / `--rc` | `BRIDGE_MODE` |
| `--hard-fail` | `HARD_FAIL` |
| `--enable-auto-mode` | `TRANSCRIPT_CLASSIFIER` |
| `--messaging-socket-path <path>` | `UDS_INBOX` |

---

## 隐藏环境变量

### 常用但未公开

| 环境变量 | 功能 |
|----------|------|
| `ANTHROPIC_MODEL` | 覆盖默认模型 |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | 最大输出 token 数 |
| `CLAUDE_CODE_DISABLE_THINKING` | 禁用思考 |
| `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING` | 禁用自适应思考 |
| `CLAUDE_CODE_PROACTIVE` | 主动模式 |
| `CLAUDE_CODE_COORDINATOR_MODE` | 协调器模式 |
| `CLAUDE_CODE_BRIEF` | 简报模式 |
| `CLAUDE_CODE_SYNTAX_HIGHLIGHT` | 语法高亮主题 |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | 禁用自动记忆 |
| `CLAUDE_CODE_IDLE_THRESHOLD_MINUTES` | 空闲阈值（默认 75 分钟） |
| `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY` | 最大工具并发数 |

### 第三方模型集成

| 环境变量 | 功能 |
|----------|------|
| `CLAUDE_CODE_USE_BEDROCK` | 使用 AWS Bedrock |
| `CLAUDE_CODE_USE_VERTEX` | 使用 Google Vertex |
| `CLAUDE_CODE_USE_FOUNDRY` | 使用 Foundry |
| `CLAUDE_CODE_SKIP_BEDROCK_AUTH` | 跳过 Bedrock 认证 |
| `CLAUDE_CODE_SKIP_VERTEX_AUTH` | 跳过 Vertex 认证 |

### API 扩展

| 环境变量 | 功能 |
|----------|------|
| `CLAUDE_CODE_EXTRA_BODY` | API 请求附加 JSON body |
| `CLAUDE_CODE_EXTRA_METADATA` | API 请求附加元数据 |
| `CLAUDE_CODE_CLIENT_CERT` | 客户端证书 |
| `CLAUDE_CODE_ATTRIBUTION_HEADER` | 归属头部 |

### 会话与身份

| 环境变量 | 功能 |
|----------|------|
| `CLAUDE_CODE_OAUTH_TOKEN` | OAuth 令牌 |
| `CLAUDE_CODE_OAUTH_REFRESH_TOKEN` | OAuth 刷新令牌 |
| `CLAUDE_CODE_ACCOUNT_UUID` | 帐户 UUID |
| `CLAUDE_CODE_ORGANIZATION_UUID` | 组织 UUID |
| `CLAUDE_CODE_CUSTOM_OAUTH_URL` | 自定义 OAuth URL |

### 仅内部用户

| 环境变量 | 功能 |
|----------|------|
| `CLAUDE_INTERNAL_FC_OVERRIDES` | GrowthBook 功能覆盖 JSON |
| `CLAUDE_CODE_GB_BASE_URL` | GrowthBook API URL 覆盖 |
| `ULTRAPLAN_PROMPT_FILE` | Ultraplan 提示文件覆盖 |
| `MAX_THINKING_TOKENS` | 最大思考 token 数 |
| `SESSION_INGRESS_URL` | 会话入口 URL |
| `IS_DEMO` | 演示模式 |
