# 编译开关 + 远程门控

> 源码位置：`src/commands.ts`、`src/main.tsx`、`src/services/analytics/growthbook.ts`

外部发布版是**阉割版**。Anthropic 通过三层门控精确控制每个功能的可见性和可用性。

---

## 三层门控架构

```
┌─────────────────────────────────────────────────┐
│  第一层：编译时开关 feature()                      │
│  代码包含 or 移除（Dead Code Elimination）          │
├─────────────────────────────────────────────────┤
│  第二层：运行时 USER_TYPE                          │
│  'ant'（内部）vs 'external'（外部）                 │
├─────────────────────────────────────────────────┤
│  第三层：GrowthBook 远程 A/B 测试                   │
│  tengu_ 前缀的远程开关，动态控制                     │
└─────────────────────────────────────────────────┘
```

---

## 第一层：编译时开关（约 50 个）

通过 `feature()` 函数（来自 `bun:bundle`）实现。构建时决定代码包含或排除，未包含的代码被 DCE（Dead Code Elimination）完全移除。

### 核心功能开关

| 开关 | 说明 | 状态 |
|------|------|------|
| `BUDDY` | 宠物伴侣系统 | 外部版未启用 |
| `KAIROS` | 持久助手模式 | 外部版未启用 |
| `KAIROS_BRIEF` | 简报模式 | 外部版未启用 |
| `KAIROS_CHANNELS` | 通道通知 | 外部版未启用 |
| `KAIROS_GITHUB_WEBHOOKS` | GitHub Webhook | 外部版未启用 |
| `ULTRAPLAN` | 云端深度规划 | 外部版未启用 |
| `COORDINATOR_MODE` | 多 Agent 编排 | 外部版未启用 |
| `BRIDGE_MODE` | 远程控制桥接 | 外部版未启用 |
| `VOICE_MODE` | 语音交互 | 外部版未启用 |
| `PROACTIVE` | 主动自主模式 | 外部版未启用 |
| `FORK_SUBAGENT` | 子代理分叉 | 外部版未启用 |
| `DAEMON` | 守护进程模式 | 外部版未启用 |

### 基础设施开关

| 开关 | 说明 |
|------|------|
| `UDS_INBOX` | Unix Domain Socket 收件箱 |
| `WORKFLOW_SCRIPTS` | 工作流脚本 |
| `TORCH` | Torch 功能 |
| `MONITOR_TOOL` | 监控工具 |
| `HISTORY_SNIP` | 历史截断 |
| `BG_SESSIONS` | 后台会话管理 |
| `HARD_FAIL` | 硬失败模式 |
| `CCR_REMOTE_SETUP` | Web 远程设置 |
| `CHICAGO_MCP` | MCP 扩展（Computer Use） |

### 优化与实验开关

| 开关 | 说明 |
|------|------|
| `CACHED_MICROCOMPACT` | 缓存微压缩 |
| `CONTEXT_COLLAPSE` | 上下文折叠 |
| `REACTIVE_COMPACT` | 响应式压缩 |
| `QUICK_SEARCH` | 快速搜索 |
| `TOKEN_BUDGET` | Token 预算跟踪 |
| `STREAMLINED_OUTPUT` | 精简输出 |
| `CONNECTOR_TEXT` | 连接器文本块 |
| `TERMINAL_PANEL` | 终端面板 |
| `MESSAGE_ACTIONS` | 消息操作 |

### 安全与合规开关

| 开关 | 说明 |
|------|------|
| `ANTI_DISTILLATION_CC` | 反蒸馏保护 |
| `BASH_CLASSIFIER` | Bash 命令分类器 |
| `NATIVE_CLIENT_ATTESTATION` | 原生客户端证明 |
| `TRANSCRIPT_CLASSIFIER` | 转录分类器（自动模式） |
| `UNATTENDED_RETRY` | 无人值守重试 |

### 数据与遥测开关

| 开关 | 说明 |
|------|------|
| `EXTRACT_MEMORIES` | 自动提取记忆 |
| `MEMORY_SHAPE_TELEMETRY` | 记忆形状遥测 |
| `COWORKER_TYPE_TELEMETRY` | 协作者类型遥测 |
| `SLOW_OPERATION_LOGGING` | 慢操作日志 |
| `PROMPT_CACHE_BREAK_DETECTION` | 缓存中断检测 |
| `COMMIT_ATTRIBUTION` | 提交归属标注 |

### 其他开关

| 开关 | 说明 |
|------|------|
| `LODESTONE` | Lodestone 功能 |
| `MCP_SKILLS` | MCP 技能系统 |
| `EXPERIMENTAL_SKILL_SEARCH` | 实验性技能搜索 |
| `TEMPLATES` | 模板/工作分类器 |
| `TEAMMEM` | 团队记忆同步 |
| `FILE_PERSISTENCE` | 文件持久化 |
| `DOWNLOAD_USER_SETTINGS` | 下载用户设置 |
| `UPLOAD_USER_SETTINGS` | 上传用户设置 |
| `BREAK_CACHE_COMMAND` | 缓存清除注入 |
| `AGENT_TRIGGERS` | Cron 触发器系统 |
| `IS_LIBC_GLIBC` | glibc 检测 |
| `IS_LIBC_MUSL` | musl 检测 |

---

## 第二层：用户类型（USER_TYPE）

`process.env.USER_TYPE` 在构建时被硬编码。外部版固定为 `"external"`。

| 值 | 身份 | 检查点数量 |
|----|------|-----------|
| `'ant'` | Anthropic 内部员工 | 200+ 处 |
| `'external'` | 外部用户 | — |

源码中到处可见 `"external" === 'ant'` 的比较，这永远为 `false`。

### ant 专属能力

| 类别 | 能力 |
|------|------|
| GrowthBook | 调试日志、覆盖、20 分钟刷新（vs 外部 6 小时） |
| 调试 | API 错误详情、推测性执行日志、prompt dump |
| 命令 | 所有 `INTERNAL_ONLY_COMMANDS`（24+ 个） |
| CLI 参数 | `--delegate-permissions`、`--afk`、`--tasks`、`--agent-teams` |
| 环境变量 | `CLAUDE_INTERNAL_FC_OVERRIDES`（JSON 覆盖 GrowthBook） |
| 配置 | `/config` Gates 标签页（UI 覆盖 GrowthBook） |
| 错误处理 | 5xx 额外重试逻辑 |
| 隐私 | DataDog 中模型名不匿名化 |

---

## 第三层：GrowthBook 远程开关

`src/services/analytics/growthbook.ts` 配置了 GrowthBook SDK：

### 基础设施

- 使用 `@growthbook/growthbook` SDK
- 远程评估模式（`remoteEval: true`）
- 内部用户 20 分钟刷新，外部用户 **6 小时**刷新
- 支持磁盘缓存跨进程持久化
- 用户属性包含：`id`、`deviceID`、`platform`、`accountUUID`、`userType`、`subscriptionType`、`rateLimitTier`、`appVersion` 等

### 已知远程开关（`tengu_` 前缀）

| 开关 | 控制内容 |
|------|---------|
| `tengu_kairos` | KAIROS 助手模式总开关 |
| `tengu_onyx_plover` | AutoDream 阈值（整合间隔/会话数） |
| `tengu_cobalt_frost` | 语音识别（Nova 3）开关 |
| `tengu_ultraplan_model` | Ultraplan 使用的模型 |
| `tengu_ant_model_override` | 内部用户模型覆盖 |
| `tengu_session_memory` | 会话记忆功能 |
| `tengu_sm_config` | 会话记忆配置 |
| `tengu_max_version_config` | 自动更新 Kill Switch |
| `tengu_frond_boric` | 数据接收器 Kill Switch |
| `tengu_herring_clock` | 团队记忆路径 |
| `tengu_log_datadog_events` | Datadog 事件日志 |
| `tengu_1p_event_batch_config` | 一方事件批处理配置 |
| `tengu_event_sampling_config` | 事件采样配置 |
| `tengu_ccr_bridge` | Bridge 远程控制总开关 |
| `tengu_bridge_repl_v2` | Bridge v2 传输协议 |
| `tengu_ccr_mirror` | CCR Mirror 只写模式 |
| `tengu_scratch` | Coordinator Scratchpad |
| `tengu_kairos_cron_config` | Cron Jitter 配置 |
| `tengu_kairos_cron_durable` | 持久 Cron 任务开关 |

### 覆盖机制

内部用户可以通过以下方式覆盖远程开关：

1. 环境变量 `CLAUDE_INTERNAL_FC_OVERRIDES`（JSON 格式）
2. `/config` → Gates 标签页 → `growthBookOverrides`
3. `CLAUDE_CODE_GB_BASE_URL` 覆盖 GrowthBook API 地址

---

## 总结

Claude Code 的功能分层非常清晰：

```
外部用户能看到的
═══════════════════════════════
  基础 CLI 功能、公开命令

被 feature() 裁剪掉的
═══════════════════════════════
  BUDDY、KAIROS、ULTRAPLAN、
  BRIDGE、COORDINATOR、VOICE...

被 USER_TYPE 锁住的
═══════════════════════════════
  24+ 内部命令、调试工具、
  GrowthBook 覆盖能力

被 GrowthBook 远程控制的
═══════════════════════════════
  A/B 测试、灰度发布、
  Kill Switch、动态配置
```

外部版本是经过三层过滤后的精简版。Anthropic 内部用 `USER_TYPE=ant` 构建解锁全部功能。
