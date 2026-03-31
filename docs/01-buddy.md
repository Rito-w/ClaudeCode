# BUDDY — AI 电子宠物

> 源码位置：`src/buddy/`
> 编译开关：`feature('BUDDY')`
> 预计上线：2026 年 4 月

终端里的拓麻歌子！一个完整的虚拟宠物伴侣系统，藏在 Claude Code 的源码里。

---

## 物种图鉴

共 **18 种**物种，定义在 `src/buddy/types.ts`。每种物种都有 3 帧 ASCII 精灵动画（idle / fidget / 特殊），精灵图为 5 行高、12 字符宽。

| 物种 | 英文 | 物种 | 英文 |
|------|------|------|------|
| 🦆 鸭子 | duck | 🐢 乌龟 | turtle |
| 🪿 鹅 | goose | 🐌 蜗牛 | snail |
| 🫧 果冻 | blob | 👻 幽灵 | ghost |
| 🐱 猫 | cat | 🦎 六角恐龙 | axolotl |
| 🐉 龙 | dragon | 🦫 水豚 | capybara |
| 🐙 章鱼 | octopus | 🌵 仙人掌 | cactus |
| 🦉 猫头鹰 | owl | 🤖 机器人 | robot |
| 🐧 企鹅 | penguin | 🐰 兔子 | rabbit |
| 🍄 蘑菇 | mushroom | 🐈 胖猫 | chonk |

> 有趣的细节：源码中物种名全部用 `String.fromCharCode` 十六进制编码（如 `c(0x64,0x75,0x63,0x6b)` = `"duck"`）。注释说明原因是某个物种名与内部模型代号冲突，会被 `excluded-strings.txt` 构建检查拦截，所以全部改用编码绕过。

---

## 稀有度系统

5 个等级，总权重 100：

| 稀有度 | 概率 | 星级 | 显示颜色 | 属性下限 |
|--------|------|------|----------|---------|
| Common（普通） | 60% | ★ | 灰色 | 5 |
| Uncommon（非凡） | 25% | ★★ | 绿色 | 15 |
| Rare（稀有） | 10% | ★★★ | 蓝色 | 25 |
| Epic（史诗） | 4% | ★★★★ | 紫色 | 35 |
| Legendary（传说） | 1% | ★★★★★ | 金色 | 50 |

- **Common 没有帽子**，其他稀有度随机分配帽子
- 稀有度越高，属性下限越高

---

## 闪光系统

```typescript
shiny: rng() < 0.01  // companion.ts 第 98 行
```

**1% 闪光概率**，独立于稀有度。任何物种、任何稀有度都有 1% 概率成为闪光个体。

---

## 外观定制

### 眼睛（6 种）

`·`  `✦`  `×`  `◉`  `@`  `°`

### 帽子（8 种）

| 帽子 | 英文 | 帽子 | 英文 |
|------|------|------|------|
| 无 | none | 光环 | halo |
| 皇冠 | crown | 巫师帽 | wizard |
| 礼帽 | tophat | 毛线帽 | beanie |
| 螺旋桨帽 | propeller | 小鸭子头饰 | tinyduck |

---

## 确定性生成机制

**每人只会得到一只固定的宠物，改配置也没用。**

生成流程（`src/buddy/companion.ts`）：

```
用户 ID（OAuth accountUuid / userID / 'anon'）
    ↓
+ 固定盐值 'friend-2026-401'
    ↓
FNV-1a 哈希（Bun 环境用 Bun.hash）
    ↓
Mulberry32 伪随机数生成器（确定性 PRNG）
    ↓
依次抽取：物种 → 眼睛 → 稀有度 → 帽子 → 闪光 → 属性
```

**防作弊设计**：只有"灵魂"数据（name, personality, hatchedAt）存入配置文件。"骨架"数据（species, rarity, shiny, eye, hat, stats）**每次都从 userId 重新计算**，不持久化。你编辑配置文件也改不了稀有度。

---

## 五维属性

每只宠物有 5 项属性：

| 属性 | 说明 |
|------|------|
| DEBUGGING | 调试能力 |
| PATIENCE | 耐心 |
| CHAOS | 混乱值 |
| WISDOM | 智慧 |
| SNARK | 毒舌值 |

生成规则：随机选一个峰值属性和一个最低属性。峰值 = 下限 + 50 + random(0-29)，最低 = max(1, 下限 - 10 + random(0-14))，其余 = 下限 + random(0-39)。

---

## 交互方式

### 斜杠命令

| 命令 | 功能 |
|------|------|
| `/buddy hatch` | 孵化宠物（AI 模型生成名字和性格） |
| `/buddy pet` | 抚摸宠物（2.5 秒爱心上浮动画） |
| `/buddy card` | 查看宠物卡片（精灵图 + 属性 + 稀有度） |
| `/buddy mute` | 静音宠物 |
| `/buddy unmute` | 取消静音 |

### 精灵动画

- **idle 动画**：500ms 一帧，按 15 帧序列 `[0,0,0,0,1,0,0,0,-1,0,0,2,0,0,0]` 循环。大部分时间静止，偶尔 fidget，极少眨眼（`-1` = 把眼睛替换为 `-`）
- **被摸/说话时**：快速循环所有帧
- **窄终端（<100 列）**：退化为一行表情文字脸（如 `=·ω·=` 猫脸、`(·>` 鸭子脸）

### 气泡对话

宠物会通过气泡说话（`companionReaction` 状态），气泡显示约 10 秒（20 ticks × 500ms），最后 3 秒渐隐。全屏模式下气泡浮动渲染，非全屏模式下内联在精灵旁边。

### AI 上下文注入

当宠物存在且未静音时，会向 Claude 的上下文注入一段提示（`src/buddy/prompt.ts`），告诉模型旁边有一只小宠物。当用户直接对宠物说话时，Claude 会保持低调（一行或更少的回复），不会模拟宠物。

---

## 上线时间线

`src/buddy/useBuddyNotification.tsx` 中定义了上线计划：

- **2026 年 4 月 1-7 日**：预热窗口期，启动时显示 15 秒的彩虹色 `/buddy` 提示
- **2026 年 4 月起**：`isBuddyLive` 返回 `true`，命令永久可用
- 输入框中输入 `/buddy` 会有特殊高亮效果

---

## 关键源码文件

| 文件 | 职责 |
|------|------|
| `src/buddy/types.ts` | 类型定义、物种/稀有度/眼睛/帽子常量 |
| `src/buddy/companion.ts` | 核心生成逻辑：哈希、PRNG、属性计算 |
| `src/buddy/sprites.ts` | 18 种物种的 ASCII 精灵图（3 帧动画） |
| `src/buddy/CompanionSprite.tsx` | React 组件：动画、气泡、交互渲染 |
| `src/buddy/prompt.ts` | AI 上下文注入 |
| `src/buddy/useBuddyNotification.tsx` | 启动预热提示、输入框高亮 |
