# Skim AI — 开发文档

> 从零到 Chrome Web Store 发布的完整记录

## 项目概览

**Skim AI** 是一个 AI 增强浏览器插件，核心功能是 YouTube 视频智能摘要和 Google 搜索增强。基于开源项目 [Read Frog](https://github.com/mengxi-ream/read-frog)（翻译插件）fork 而来，在其现代技术栈上叠加了 AI 摘要能力。

![Skim AI Icon](https://s.draftai.cn/vent/128.png)

### 为什么做这个项目

1. **长视频消费痛点**：经常看 Invest Like the Best、CNBC 等 1-2 小时的投资访谈，需要快速提取核心观点
2. **现有工具不足**：Glarity 等工具对长视频支持差（单次 LLM 调用、transcript 截断、分割粗糙）
3. **技术验证**：验证 Two-pass 分割算法 + 并行摘要在浏览器扩展场景的可行性

### 技术栈

| 层 | 技术 |
|---|---|
| 框架 | WXT (Web Extension Toolkit) + Manifest V3 |
| 前端 | React 19 + TypeScript |
| AI | Vercel AI SDK (`generateObject` / `generateText`) |
| 构建 | Vite + pnpm |
| 样式 | Shadow DOM 隔离 + 自定义 CSS 变量 |
| 字幕 | Read Frog 的 YoutubeSubtitlesFetcher（POT token + XHR 拦截） |

---

## 开发流程

### Phase 1: 技术选型与 Fork

**目标**：找一个现代的浏览器扩展基座，避免从零搭建 MV3 + React + 消息通信等基础设施。

**评估过程**：
- 对比了 Glarity（功能全但代码老旧）、BrainyAI（不符合需求）、Read Frog（WXT + React 19 + AI SDK，架构现代）
- Read Frog 是 GPL-3.0 开源，允许 fork 修改分发
- 最终决定 fork Read Frog，在其翻译引擎上叠加摘要功能

**工具**：Claude Code（代码分析、方案对比）

### Phase 2: 品牌设计

**Skim AI 设计系统**：
- 品牌色：Deep Forest `#0B3B30` + Acid Lime `#D2F26C`
- 字体：Instrument Serif（标题）+ General Sans（正文）+ JetBrains Mono（代码/时间戳）
- 图标：深色圆角矩形底 + 三条线（骨白/酸柠绿/骨白）象征"划重点"

**完成的品牌工作**：
- 替换全部 9 个 locale 文件的名称/描述
- 生成 16/32/48/96/128 px 图标
- 设计 Shadow DOM 内的完整 CSS 变量系统

### Phase 3: YouTube 视频摘要

这是核心功能，也是开发中迭代最多的部分。

#### 3.1 Transcript 获取（最大技术挑战）

YouTube 不提供公开的字幕 API，获取 transcript 经历了多次迭代：

| 尝试 | 方法 | 结果 |
|---|---|---|
| 1 | Fetch YouTube 页面 HTML，正则提取 | 返回 LOGIN_REQUIRED |
| 2 | Content script 直接读 `window.ytInitialPlayerResponse` | 隔离世界限制，无法访问 |
| 3 | 注入 `<script>` 标签到页面 | 安全策略阻止 |
| 4 | InnerTube API 直接调用 | 需要 POT token，请求被拒 |
| 5 | 创建 MAIN world bridge 脚本 | **短视频成功**，长视频失败（POT token 缺失） |
| 6 | `Object.defineProperty` 拦截 `ytInitialPlayerResponse` | 仍然无法稳定获取 |
| 7 | **复用 Read Frog 的 `YoutubeSubtitlesFetcher`** | **完全解决** |

**关键教训**：Read Frog 已有成熟的字幕获取系统（POT token 处理、XHR 拦截、player state 等待、自动重试），不应该自己重写。

#### 3.2 摘要生成演进

**V1 — 单次调用 + Markdown 解析**
- 把 transcript 一次性发给 LLM，要求返回 Markdown
- 问题：不同语言输出的 Markdown 格式不一致，解析频繁失败

**V2 — 单次调用 + JSON Schema (generateObject)**
- 切换到 Vercel AI SDK 的 `generateObject`，用 JSON Schema 约束输出
- 解决了格式问题，但长视频（>15min）内容被截断（transcript 限制 12000 字符）

**V3 — 时长自适应 Schema**
- 根据视频时长动态调整 Schema：短视频 4-6 chapters，中等 8-12，长视频 3-5 Acts + sections
- 问题：单次调用对长视频仍然太粗，且 transcript 截断导致只覆盖前 20 分钟

![V3 TL;DR 视图](https://s.draftai.cn/vent/6.png)

![V3 Chapters Acts 视图](https://s.draftai.cn/vent/7.png)

**V4 — Two-pass 并行架构（最终方案）**

```
Pass 1 (结构发现):
  输入: 完整 transcript (200k chars)
  输出: 8-20 个时间段边界 + 标题 + TL;DR + Highlights
  特点: 轻量，只做分割不做详细分析

Pass 2 (并行深挖):
  对每个段落:
    输入: 该段时间范围的 transcript 片段
    输出: 1-2 句摘要 + 3-6 个带时间戳的详细要点
  特点: Promise.all 并行，每段独立，质量高
```

![Two-pass Chapters 视图](https://s.draftai.cn/vent/17.png)

![展开的 Key Points](https://s.draftai.cn/vent/18.png)

#### 3.3 与 Glarity 的对比

同一个 1h22m 视频，相同的 DeepSeek v4 模型：

![Glarity 输出](https://s.draftai.cn/vent/10.png)

![Skim AI 最终输出](https://s.draftai.cn/vent/12.png)

Glarity 使用单次调用 + Claude-200k，输出更详细但无结构化 JSON。Skim AI 的 Two-pass 方案在长视频上覆盖完整时长，且支持点击时间戳跳转。

### Phase 4: Google 搜索增强

在 Google/Bing/DuckDuckGo 搜索结果页的右侧栏插入 AI 摘要面板：
- 自动提取搜索结果的标题和摘要
- 发送给 LLM 生成综合答案（带来源引用 [1] [2]）
- 支持追问

**技术要点**：
- 匹配多个 Google 域名（.com, .co.uk, .co.jp, .com.sg 等）
- `#rhs` 侧栏不存在时 fallback 到 `#rcnt` 或 fixed 定位
- MutationObserver 等待搜索结果 DOM 加载

### Phase 5: 翻译引擎改进

在 Read Frog 基础上修复了两个问题：
1. **Shadow DOM 穿透**：Read Frog 的 DOM walker 会进入 Shadow DOM 翻译 Skim AI 面板内容 → 在 `traversal.ts` 加 `notranslate` class 检查
2. **中文重复翻译**：CJK 字符比例检测（>30% = 已是目标语言），跳过翻译

### Phase 6: Chrome Web Store 发布

![Store Listing 页面](https://s.draftai.cn/vent/20.png)

**准备材料**：
- 128px 图标（24-bit PNG, no alpha）
- 5 张 1280x800 截图（从开发过程截图裁剪）
- 440x280 小 promo tile + 1400x560 marquee

![Marquee Promo](https://s.draftai.cn/vent/promo-marquee-1400x560.png)

- 商店描述（英文，含功能列表、隐私声明、开源链接）
- 隐私政策（PRIVACY.md，托管在 GitHub）
- 每个 permission 的使用理由

**提交状态**：

![Pending Review](https://s.draftai.cn/vent/30.png)

因 `*://*/*` host permission（翻译功能需要），需要额外审核，预计 1-7 个工作日。

---

## 开发工具与方法

### AI 工具

| 工具 | 用途 |
|---|---|
| **Claude Code (Opus 4.6, 1M context)** | 主力开发工具 — 代码编写、调试、架构设计 |
| **Claude Code Agent (Explore)** | 代码库搜索，定位 Read Frog 的现有实现 |
| **Claude Code Agent (general-purpose)** | 调研 — Chrome Web Store 发布流程、TreeSeg 算法论文 |
| **Claude Code Agent (WebSearch)** | 搜索 YouTube transcript API、Glarity 实现细节 |

### 开发模式

整个项目在 **Claude Code** 的一个长会话中完成（跨越多天，使用了 context compaction）：
- 用户提需求 → Claude 实现 → `pnpm build` → 复制到 `frog-ai-extension/` → 用户在浏览器测试 → 反馈截图 → 迭代
- 关键决策点先讨论方案再实现（如 Beats vs Chapters 关系、分割算法选择）
- 遇到复杂问题时 spawn Agent 做深度调研（如 TreeSeg 论文、Chrome Store 要求）

### 构建流程

```bash
# 开发构建
WXT_SKIP_ENV_VALIDATION=true WXT_POSTHOG_API_KEY=dummy pnpm build

# 复制到加载目录
rm -rf frog-ai-extension && cp -r .output/chrome-mv3 frog-ai-extension

# Chrome 加载 unpacked: chrome://extensions → frog-ai-extension/

# 打包发布
cd frog-ai-extension && zip -r ../assets/skimai/skim-ai-v0.1.0.zip . -x ".*"
```

---

## 文件结构

```
src/entrypoints/
├── video-summary.content/          # YouTube 摘要（核心）
│   ├── index.tsx                   # Shadow DOM 挂载 + ResizeObserver
│   ├── app.tsx                     # React 入口
│   ├── components/
│   │   └── video-summary-panel.tsx # 主面板（Two-pass 逻辑、UI）
│   ├── transcript.ts              # YoutubeSubtitlesFetcher 封装
│   └── styles.ts                  # Skim 设计系统 CSS
├── video-summary-bridge.content/   # MAIN world bridge（保留备用）
├── search-summary.content/         # Google 搜索增强
│   ├── index.tsx                   # 挂载到 #rhs
│   ├── search-engines.ts          # Google/Bing/DDG 适配
│   └── components/
│       └── summary-panel.tsx      # Answer/Sources/Ask
├── interceptor.content/            # Read Frog 的 YouTube 拦截器
├── options/pages/youtube-summary/  # 设置页
└── background/
    └── llm-generate-object.ts     # backgroundGenerateObject handler
```

---

## 已知问题与后续计划

### 待修复
- [ ] Options 页自定义 prompt 未持久化（Save 按钮只改 state，不写 storage）
- [ ] Google 搜索面板未充分测试
- [ ] 面板高度在某些 YouTube 布局下可能不准

### 后续迭代
- [ ] **TreeSeg 语义分割**：用 embedding API 做 divisive clustering，替代 LLM 分段
- [ ] **Chain-of-Density**：对每段摘要做 3-5 轮迭代精炼
- [ ] **自定义 Prompt 生效**：Options 页 prompt 持久化 + 面板读取
- [ ] **时间戳跳转优化**：从 `document.querySelector("video").currentTime` 改为 YouTube Player API
- [ ] **缩窄 host_permissions**：翻译功能按需申请权限，减少审核延迟

---

## 许可

Skim AI 基于 [Read Frog](https://github.com/mengxi-ream/read-frog) fork，遵循 **GPL-3.0** 开源协议。

---

*文档生成日期：2026-05-28*
*开发周期：2026-05-25 ~ 2026-05-28（4天）*
*主要开发者：vent + Claude Code (Opus 4.6)*
