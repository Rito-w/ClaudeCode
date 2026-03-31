# Bridge — 远程遥控终端

> 源码位置：`src/bridge/`（33 个文件）
> 编译开关：`feature('BRIDGE_MODE')`、`feature('DAEMON')`
> 远程开关：GrowthBook `tengu_ccr_bridge`

从 claude.ai 或手机直接操控本地 CLI。

---

## 核心概念

Bridge（Remote Control）让用户从 **claude.ai 网页端**远程操控运行在本地终端的 Claude Code：

- 网页输入 prompt → 传送到本地 CLI 执行
- CLI 输出实时回传到网页
- 支持远程权限审批
- 支持中断、切换模型、设置思考 token 上限

---

## 两种运行模式

### 独立模式（`claude remote-control`）

在 `src/bridge/bridgeMain.ts` 中实现，作为独立的长运行服务器：

```
注册环境 → 轮询工作 → 生成子进程处理会话
```

支持 3 种 session 分发模式（`SpawnMode`）：

| 模式 | 说明 |
|------|------|
| `single-session` | 一个 session，结束后 bridge 关闭 |
| `worktree` | 持久服务器，每个 session 获得隔离的 git worktree |
| `same-dir` | 持久服务器，所有 session 共享 cwd |

### REPL 内嵌模式（`/remote-control`）

在 `src/bridge/initReplBridge.ts` + `src/bridge/replBridge.ts` 中实现：

- 在交互式 REPL 会话中启动
- 将当前对话镜像到 claude.ai
- 支持双向：本地打字和网页打字都能驱动同一个会话

---

## 启用条件

`src/bridge/bridgeEnabled.ts` 定义了严格的检查链：

```
isBridgeEnabled() =
  feature('BRIDGE_MODE')             ← 编译时 flag
  && isClaudeAISubscriber()          ← 必须是付费订阅用户
  && GrowthBook('tengu_ccr_bridge')  ← 服务端 feature flag
```

不满足时的诊断信息：
- 非订阅用户 → 提示需要订阅
- 缺少 `user:profile` OAuth scope → 提示需要重新登录
- 无法确定组织 UUID → 提示刷新账户信息
- GrowthBook 未通过 → 提示功能未启用

---

## 两代传输协议

### v1（环境层方案）

完整的环境生命周期：

```
注册环境 → 轮询工作 → 确认 → 心跳 → 注销
```

- 传输层：`HybridTransport`（WebSocket 读 + HTTP POST 写）
- API 路径：`/v1/environments/bridge` 注册，`/v1/environments/{id}/work/poll` 轮询

### v2（无环境层方案）

跳过整个 Environments API，直接连接 session-ingress：

```
1. POST /v1/code/sessions            ← 创建 session
2. POST /v1/code/sessions/{id}/bridge ← 获取 worker_jwt + epoch
3. SSE (读) + CCRClient (写)          ← 建立双向通道
4. JWT 到期前 5 分钟主动刷新          ← 保持连接
```

- 传输层：`SSETransport`（读）+ `CCRClient`（写到 CCR v2 `/worker/*` 端点）
- 由 GrowthBook `tengu_bridge_repl_v2` 门控

---

## 消息处理

`src/bridge/bridgeMessaging.ts` 实现消息路由：

### 入站消息

| 类型 | 说明 |
|------|------|
| `control_response` | 权限回复 |
| `control_request` | 服务端控制请求 |
| `SDKMessage` | 标准消息（只转发 `user` 类型） |

### 去重机制

- **回声去重**：`BoundedUUIDSet`（环形缓冲区，默认 2000 条）过滤自己发出的消息
- **重投递去重**：`recentInboundUUIDs` 过滤重复入站提示

### 服务端控制请求

| 请求 | 说明 |
|------|------|
| `initialize` | 返回能力声明 |
| `set_model` | 切换模型 |
| `set_max_thinking_tokens` | 设置思考 token 上限 |
| `set_permission_mode` | 设置权限模式 |
| `interrupt` | 中断当前操作 |

> 必须在 10-14 秒内响应，否则服务端关闭连接

---

## 独立 Bridge 服务器主循环

`src/bridge/bridgeMain.ts` 的 `runBridgeLoop()` 函数：

```
1. 注册环境 → POST /v1/environments/bridge
   （传递机器名、目录、分支、Git URL、最大 session 数）

2. 轮询工作 → GET /v1/environments/{id}/work/poll
   （指数退避）

3. 接收工作 → 解码 WorkSecret（base64url JSON）
   （提取 session_ingress_token 和 api_base_url）

4. 生成子进程 → claude --print --sdk-url ... --session-id ...
   （NDJSON stdin/stdout 通信）

5. 活动监控 → 解析 stdout NDJSON
   （提取工具使用和结果）

6. 心跳 → POST .../heartbeat

7. 清理 → stopWork + deregisterEnvironment
```

---

## 安全机制

| 机制 | 说明 |
|------|------|
| **OAuth 令牌** | 主身份凭证，从 keychain 读取，支持自动刷新 |
| **Worker JWT** | 每 session 的短期令牌（几小时过期） |
| **Trusted Device Token** | 设备信任令牌 |
| **401 恢复** | 检测 401 → OAuth 刷新 → 重获凭证 → 重建传输层 |
| **主动刷新** | JWT 到期前 5 分钟调度刷新 |

---

## 崩溃恢复

`src/bridge/bridgePointer.ts` 实现崩溃恢复指针：

- 路径：`{projectsDir}/{sanitized-cwd}/bridge-pointer.json`
- 内容：`{ sessionId, environmentId, source }`
- 生命周期：session 创建后写入 → 运行中定期刷新 mtime → 干净退出时清除
- TTL：4 小时
- 下次启动检测到指针文件，提供 `--session-id` 恢复选项
- 支持 git worktree 兄弟目录扫描

---

## 状态机

```
ready → connected → [reconnecting →] connected
                  → failed
```

| 状态 | 说明 |
|------|------|
| `ready` | 传输层创建成功 |
| `connected` | 连接建立 + 历史消息 flush 完成 |
| `reconnecting` | JWT 过期恢复中 |
| `failed` | 致命错误 |

---

## CCR Mirror 模式

一个特殊的只写模式：

- 只转发事件到远端，不接收入站提示
- 本地 session 在 claude.ai 可见但不可被远程控制
- 由 `CCR_MIRROR` 编译 flag + `tengu_ccr_mirror` GrowthBook flag 门控

---

## 关键源码文件

| 文件 | 职责 |
|------|------|
| `src/bridge/bridgeMain.ts` | 独立 bridge 服务器主循环 |
| `src/bridge/bridgeEnabled.ts` | 功能门控检查 |
| `src/bridge/bridgeConfig.ts` | OAuth 令牌和 URL 解析 |
| `src/bridge/bridgeApi.ts` | REST API 客户端 |
| `src/bridge/replBridge.ts` | REPL 内嵌桥接核心 |
| `src/bridge/replBridgeTransport.ts` | 传输层抽象（v1/v2） |
| `src/bridge/bridgeMessaging.ts` | 消息解析、路由、去重 |
| `src/bridge/initReplBridge.ts` | REPL 初始化包装器 |
| `src/bridge/sessionRunner.ts` | 子进程 session 生成器 |
| `src/bridge/bridgePointer.ts` | 崩溃恢复指针 |
| `src/bridge/workSecret.ts` | 工作密钥解码 |
| `src/bridge/jwtUtils.ts` | JWT 刷新调度 |
| `src/bridge/trustedDevice.ts` | 设备信任令牌 |
