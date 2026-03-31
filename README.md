# Claude Code 源码还原

> 从 `@anthropic-ai/claude-code` npm 包的 source map 中还原的完整 TypeScript 源码，**可本地运行**

<p align="center">
  <img src="preview.png?raw=true" alt="Claude Code CLI" width="700">
</p>

> [!WARNING]
> 本仓库为**非官方**版本，基于公开 npm 发布包 source map 还原，**仅供研究学习**。源码版权归 [Anthropic](https://www.anthropic.com) 所有。

---

## 快速开始

```bash
bun install       # 安装依赖（需要 Bun ≥ 1.3.5、Node.js ≥ 24）
bun run dev       # 启动 CLI
bun run version   # 验证版本
```

---

## 从源码中发现的 7 大隐藏功能

通过阅读还原后的 1,987 个 TypeScript 源文件，我们发现了大量未公开的隐藏功能。这些功能通过**编译开关**（`feature()`）和**用户类型**（`USER_TYPE`）进行门控，外部发布版中大部分被裁剪。

---

### 1. [BUDDY — AI 电子宠物](docs/01-buddy.md)

> 源码位置：`src/buddy/` · [查看完整分析 →](docs/01-buddy.md)

终端里的拓麻歌子！一个完整的虚拟宠物系统。

- **18 种物种**：鸭子、鹅、猫、龙、章鱼、猫头鹰、企鹅、乌龟、蜗牛、幽灵、六角恐龙、水豚、仙人掌、机器人、兔子、蘑菇、果冻、胖猫
- **5 级稀有度**：普通(60%) → 非凡(25%) → 稀有(10%) → 史诗(4%) → 传说(1%)
- **1% 闪光概率**：独立于稀有度，任何宠物都有 1% 概率成为闪光个体
- **确定性生成**：使用账号 UUID + 固定盐值 `'friend-2026-401'` 经 FNV-1a 哈希 → Mulberry32 PRNG，每人只会得到一只固定的宠物，改配置也没用
- **外观系统**：6 种眼睛样式 + 8 种帽子（皇冠、巫师帽、光环等），common 稀有度没有帽子
- **交互**：`/buddy pet` 抚摸（爱心动画）、`/buddy hatch` 孵化、`/buddy card` 查看卡片
- **动画**：500ms 帧率的 ASCII 精灵动画，气泡对话，窄终端自动退化为表情文字脸（如 `=·ω·=`）
- **编译开关**：`feature('BUDDY')`

---

### 2. [KAIROS — 永不关机的 Claude](docs/02-kairos.md)

> 源码位置：`src/assistant/`、`src/proactive/`、`src/services/autoDream/` · [查看完整分析 →](docs/02-kairos.md)

关掉终端 Claude 还在运行的持久助手模式。

- **跨会话持久运行**：通过 `.claude/settings.json` 的 `assistant: true` 激活，会话状态持久化到磁盘
- **每日日志**：自动在 `<autoMemPath>/logs/YYYY/MM/YYYY-MM-DD.md` 记录工作日志
- **自动做梦（Dream）**：距上次整合超 24 小时且有 5+ 新会话时，后台自动启动记忆整合子代理，分四阶段运行：Orient → Gather → Consolidate → Prune
- **锁机制**：`.consolidate-lock` 文件 + PID 存活检查，防止多进程同时做梦
- **主动模式（Proactive）**：没人说话时自己找活干，没活就调用 `SleepTool` 等着。接收周期性 `<tick>` 提示来检查是否有事可做
- **后台任务**：命令超 15 秒自动丢后台，支持持久 cron 任务（`permanent: true` 不受 7 天过期限制）
- **编译开关**：`feature('KAIROS')`、`feature('KAIROS_BRIEF')`、`feature('KAIROS_CHANNELS')`
- **远程开关**：GrowthBook `tengu_kairos`、`tengu_onyx_plover`（Dream 阈值配置）

---

### 3. [ULTRAPLAN — 云端深度规划](docs/03-ultraplan.md)

> 源码位置：`src/commands/ultraplan.tsx`、`src/utils/ultraplan/` · [查看完整分析 →](docs/03-ultraplan.md)

把难题甩给云端 Opus 独立研究最长 30 分钟。

- **流程**：`/ultraplan <prompt>` → 创建远程 CCR 会话 → Opus 模型独立研究 → 后台轮询等待（30 分钟超时）→ 浏览器查看/修改方案 → 批准执行或传送回本地
- **关键词触发**：消息中包含 "ultraplan" 自动触发，智能排除引号/路径/标识符中的误触发
- **传送（Teleport）**：`src/utils/teleport.tsx` 实现本地 ↔ 远程会话传输，支持 Git Bundle 打包代码上下文
- **完全内部限定**：`isEnabled: () => "external" === 'ant'`，外部版永远不可用
- **编译开关**：`feature('ULTRAPLAN')`
- **远程开关**：`tengu_ultraplan_model`（控制使用的模型）

---

### 4. [Coordinator — 多 Agent 编排模式](docs/04-coordinator.md)

> 源码位置：`src/coordinator/` · [查看完整分析 →](docs/04-coordinator.md)

主 Claude 变成纯指挥官，Worker 并行执行任务。

- **角色分离**：Coordinator 只有三个工具——派活（Agent）、通信（SendMessage）、停工（Shutdown）
- **Worker 机制**：Worker 在独立子进程中运行，各自拥有完整工具集
- **核心铁律**：系统提示中明确规定"禁止甩锅式委派"——不能把不清楚的需求直接丢给 Worker
- **任务追踪**：基于文件的共享任务列表（`~/.claude/tasks/`），Coordinator 和 Worker 共同读写
- **编译开关**：`feature('COORDINATOR_MODE')`
- **环境变量**：`CLAUDE_CODE_COORDINATOR_MODE`

---

### 5. [26+ 隐藏命令 & 秘密开关](docs/05-hidden-commands.md)

> 源码位置：`src/commands.ts`、`src/commands/` · [查看完整分析 →](docs/05-hidden-commands.md)

#### Feature-gated 命令（编译开关控制）

| 命令 | 功能 | 开关 |
|------|------|------|
| `/buddy` | 宠物系统 | `BUDDY` |
| `/proactive` | 主动自主模式 | `PROACTIVE` / `KAIROS` |
| `/assistant` | 助手模式 | `KAIROS` |
| `/brief` | 简报模式 | `KAIROS` / `KAIROS_BRIEF` |
| `/bridge` | 远程控制桥接 | `BRIDGE_MODE` |
| `/voice` | 语音模式 | `VOICE_MODE` |
| `/ultraplan` | 云端深度规划 | `ULTRAPLAN` |
| `/fork` | 子代理分叉 | `FORK_SUBAGENT` |
| `/peers` | 对等通信 | `UDS_INBOX` |
| `/workflows` | 工作流脚本 | `WORKFLOW_SCRIPTS` |
| `/torch` | Torch 功能 | `TORCH` |
| `/force-snip` | 强制历史截断 | `HISTORY_SNIP` |

#### 仅内部用户（`USER_TYPE === 'ant'`）命令

| 命令 | 功能 |
|------|------|
| `/teleport` | 传送会话到远程/本地 |
| `/bughunter` | 内部 Bug 猎人 |
| `/mock-limits` | 模拟速率限制 |
| `/ctx_viz` | 上下文可视化 |
| `/break-cache` | 强制缓存清除 |
| `/ant-trace` | 内部追踪工具 |
| `/good-claude` | 内部反馈 |
| `/agents-platform` | 智能体平台 |
| `/autofix-pr` | 自动修复 PR |
| `/debug-tool-call` | 调试工具调用 |
| `/reset-limits` | 重置速率限制 |

#### 隐藏 CLI 参数

```
--teleport [session]    恢复传送会话
--remote [description]  创建远程会话
--proactive             主动模式
--assistant             助手模式
--brief                 简报模式
--remote-control        远程控制
--hard-fail             硬失败模式
--agent-teams           多代理团队
```

---

### 6. [Bridge — 远程遥控终端](docs/06-bridge.md)

> 源码位置：`src/bridge/`（33 个文件） · [查看完整分析 →](docs/06-bridge.md)

从 claude.ai 或手机直接操控本地 CLI。

- **WebSocket 实时连接**：本地 CLI 通过 WebSocket 与 claude.ai 建立双向通道
- **完整远程控制**：远程端可以发送消息、批准权限、查看输出
- **进程间通信**：跨 Claude 会话的消息传递机制
- **状态同步**：`bridgeStatusUtil.ts` 实时同步运行状态
- **权限回调**：`bridgePermissionCallbacks.ts` 远程权限审批
- **编译开关**：`feature('BRIDGE_MODE')`、`feature('DAEMON')`

---

### 7. [50 个编译开关 + 远程门控](docs/07-feature-gates.md)

外部发布版是**阉割版**。Anthropic 通过三层门控控制功能。[查看完整分析 →](docs/07-feature-gates.md)

#### 第一层：编译时开关（`feature()`，约 50 个）

构建时决定代码包含/排除，以下是完整列表：

<details>
<summary>点击展开全部 50 个编译开关</summary>

| 开关 | 说明 |
|------|------|
| `BUDDY` | 宠物伴侣系统 |
| `KAIROS` | 持久助手模式 |
| `KAIROS_BRIEF` | 简报模式 |
| `KAIROS_CHANNELS` | 通道通知 |
| `KAIROS_GITHUB_WEBHOOKS` | GitHub Webhook |
| `ULTRAPLAN` | 云端深度规划 |
| `COORDINATOR_MODE` | 多 Agent 编排 |
| `BRIDGE_MODE` | 远程控制桥接 |
| `VOICE_MODE` | 语音交互 |
| `PROACTIVE` | 主动自主模式 |
| `FORK_SUBAGENT` | 子代理分叉 |
| `DAEMON` | 守护进程模式 |
| `UDS_INBOX` | Unix Socket 收件箱 |
| `WORKFLOW_SCRIPTS` | 工作流脚本 |
| `TORCH` | Torch 功能 |
| `MONITOR_TOOL` | 监控工具 |
| `HISTORY_SNIP` | 历史截断 |
| `ANTI_DISTILLATION_CC` | 反蒸馏保护 |
| `BASH_CLASSIFIER` | Bash 命令分类器 |
| `BG_SESSIONS` | 后台会话 |
| `CACHED_MICROCOMPACT` | 缓存微压缩 |
| `CCR_REMOTE_SETUP` | Web 远程设置 |
| `CHICAGO_MCP` | MCP 扩展（Computer Use） |
| `COMMIT_ATTRIBUTION` | 提交归属标注 |
| `CONNECTOR_TEXT` | 连接器文本 |
| `CONTEXT_COLLAPSE` | 上下文折叠 |
| `COWORKER_TYPE_TELEMETRY` | 协作者遥测 |
| `DOWNLOAD_USER_SETTINGS` | 下载用户设置 |
| `EXPERIMENTAL_SKILL_SEARCH` | 实验性技能搜索 |
| `EXTRACT_MEMORIES` | 自动提取记忆 |
| `FILE_PERSISTENCE` | 文件持久化 |
| `HARD_FAIL` | 硬失败模式 |
| `LODESTONE` | Lodestone 功能 |
| `MCP_SKILLS` | MCP 技能系统 |
| `MEMORY_SHAPE_TELEMETRY` | 记忆形状遥测 |
| `MESSAGE_ACTIONS` | 消息操作 |
| `NATIVE_CLIENT_ATTESTATION` | 客户端证明 |
| `PROMPT_CACHE_BREAK_DETECTION` | 缓存中断检测 |
| `QUICK_SEARCH` | 快速搜索 |
| `REACTIVE_COMPACT` | 响应式压缩 |
| `SLOW_OPERATION_LOGGING` | 慢操作日志 |
| `STREAMLINED_OUTPUT` | 精简输出 |
| `TEAMMEM` | 团队记忆同步 |
| `TEMPLATES` | 模板/分类器 |
| `TERMINAL_PANEL` | 终端面板 |
| `TOKEN_BUDGET` | Token 预算 |
| `TRANSCRIPT_CLASSIFIER` | 转录分类器 |
| `UNATTENDED_RETRY` | 无人值守重试 |
| `UPLOAD_USER_SETTINGS` | 上传用户设置 |
| `BREAK_CACHE_COMMAND` | 缓存清除注入 |

</details>

#### 第二层：用户类型（`USER_TYPE`）

- **`ant`**（Anthropic 内部）— 解锁全部功能、20 分钟 GrowthBook 刷新、调试工具、200+ 处专属检查
- **`external`**（外部用户）— 裁剪版，6 小时 GrowthBook 刷新

#### 第三层：GrowthBook 远程 A/B 测试

| 开关 | 控制内容 |
|------|---------|
| `tengu_kairos` | KAIROS 助手模式开关 |
| `tengu_onyx_plover` | 自动做梦阈值（间隔/会话数） |
| `tengu_cobalt_frost` | 语音识别（Nova 3）开关 |
| `tengu_ultraplan_model` | Ultraplan 使用的模型 |
| `tengu_ant_model_override` | 内部用户模型覆盖 |
| `tengu_session_memory` | 会话记忆功能 |
| `tengu_max_version_config` | 自动更新 Kill Switch |
| `tengu_frond_boric` | 数据接收器 Kill Switch |
| `tengu_herring_clock` | 团队记忆路径 |
| `tengu_sm_config` | 会话记忆配置 |

---

## 隐藏环境变量速查

<details>
<summary>点击展开完整环境变量列表</summary>

| 环境变量 | 说明 |
|----------|------|
| `ANTHROPIC_MODEL` | 模型覆盖 |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | 最大输出 token |
| `CLAUDE_CODE_DISABLE_THINKING` | 禁用思考 |
| `CLAUDE_CODE_PROACTIVE` | 主动模式 |
| `CLAUDE_CODE_COORDINATOR_MODE` | 协调器模式 |
| `CLAUDE_CODE_BRIEF` | 简报模式 |
| `CLAUDE_CODE_USE_BEDROCK` | 使用 AWS Bedrock |
| `CLAUDE_CODE_USE_VERTEX` | 使用 Google Vertex |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | 禁用自动记忆 |
| `CLAUDE_CODE_EXTRA_BODY` | API 附加 JSON |
| `CLAUDE_CODE_SYNTAX_HIGHLIGHT` | 语法高亮主题 |
| `CLAUDE_CODE_IDLE_THRESHOLD_MINUTES` | 空闲阈值（默认 75 分钟） |
| `CLAUDE_INTERNAL_FC_OVERRIDES` | GrowthBook 覆盖（仅 ant） |

</details>

---

## 项目结构

```
src/                    # 核心源码（1,987 个 TS/TSX）
├── tools/              # 53 个工具（Bash/FileEdit/Agent/MCP...）
├── commands/           # 87 个斜杠命令
├── services/           # API / MCP / analytics / autoDream
├── components/         # 148 个终端 UI 组件（React + Ink）
├── hooks/              # 87 个自定义 Hooks
├── buddy/              # 宠物伴侣系统
├── assistant/          # KAIROS 助手模式
├── coordinator/        # 多 Agent 协调器
├── bridge/             # 远程控制桥接（31 文件）
├── proactive/          # 主动模式
├── vim/                # Vim 模式引擎
├── voice/              # 语音交互
└── ...
shims/                  # 原生模块兼容替代
vendor/                 # 原生绑定源码
```

---

## 数据来源

- npm 包：[@anthropic-ai/claude-code](https://www.npmjs.com/package/@anthropic-ai/claude-code)
- 还原方式：提取 `cli.js.map` 中的 `sourcesContent`

## 声明

- 源码版权归 [Anthropic](https://www.anthropic.com) 所有
- 仅用于技术研究与学习，请勿用于商业用途
- 如有侵权，请联系删除
