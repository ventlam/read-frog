# Chrome Web Store 发布文案

适用版本：Skim AI v0.1.2。默认语言为简体中文（zh_CN）。下列中英文详细描述按相同顺序介绍相同功能；英文文案也明确说明界面默认使用简体中文。

包内 9 个语言版本的名称和简介均已统一为 YouTube 视频摘要、搜索结果摘要、网页与字幕翻译。标题均在 75 字符以内，简介均在 132 字符以内。

## 简体中文（默认语言）

### 名称

Skim AI - YouTube 摘要与搜索

### 简介

AI 总结 YouTube 视频和搜索结果，并翻译网页与字幕。摘要功能需配置自己的 AI API 密钥。

### 详细描述

```text
Skim AI 通过 AI 总结 YouTube 视频和搜索结果，并提供网页与字幕翻译，帮助你快速了解视频和网页内容。

YouTube 视频摘要
• 根据可读取的视频字幕生成概要、核心要点、带时间戳的章节和精彩观点。
• 根据视频时长调整摘要结构，并为较长视频分章节分析。
• 查看字幕全文、复制全文或下载 TXT；字幕查看和导出可在摘要生成期间使用。
• 围绕视频内容继续提问。
• 关闭当前视频的侧栏；切换视频后重新检测。视频提供可读取字幕时显示侧栏。

搜索结果摘要
• 在 Google、Bing 和 DuckDuckGo 搜索页显示 AI 摘要侧栏。
• 综合搜索结果的标题和片段，并提供来源引用。
• 针对搜索内容继续提问。

网页与字幕翻译
• 支持网页双语显示和 YouTube 字幕翻译。
• 在设置中选择翻译及摘要的目标语言，并配置 AI 提供商。

设置与费用
• 界面默认使用简体中文。
• 视频摘要、搜索摘要和 AI 问答需要配置你自己的 AI 服务及 API 密钥。使用费用由所选服务商决定。
• 生成摘要和 AI 回答时，相关字幕、搜索结果或问题文本会发送给你配置的 AI 服务商。

Skim AI 基于 Read Frog 开发，采用 GPL-3.0 开源许可。
源码：https://github.com/ventlam/read-frog
```

## English

### Name

Skim AI - YouTube Summaries & Search

### Short description

AI summaries of YouTube videos and search results, plus webpage and subtitle translation. Summaries use your own AI API key.

### Detailed description

```text
Skim AI uses AI to summarize YouTube videos and search results, and provides webpage and subtitle translation to help you understand video and web content quickly.

YouTube video summaries
• Generate an overview, key takeaways, timestamped chapters, and highlights from available video captions.
• Adapt the summary structure to the video length and analyze longer videos by chapter.
• Read and copy the full transcript or download it as TXT. Transcript viewing and export are available while a summary is being generated.
• Ask follow-up questions about the video.
• Close the sidebar for the current video. Skim AI checks again when you switch videos. The sidebar appears when readable captions are available.

Search result summaries
• Show an AI summary sidebar on Google, Bing, and DuckDuckGo search pages.
• Combine search result titles and snippets with source citations.
• Ask follow-up questions about the search.

Webpage and subtitle translation
• Support bilingual webpage display and YouTube subtitle translation.
• Choose the target language for translation and summaries, and configure AI providers in Settings.

Setup and costs
• The interface defaults to Simplified Chinese.
• Video summaries, search summaries, and AI questions require your own configured AI service and API key. Usage costs depend on your chosen provider.
• Relevant captions, search results, or question text are sent to your configured AI provider when generating summaries and AI answers.

Skim AI is built on Read Frog and is open source under GPL-3.0.
Source code: https://github.com/ventlam/read-frog
```

## 更新商店后台

1. 如果当前版本正在审核，先在后台使用 Cancel review 返回草稿状态。
2. 在已有 Skim AI 条目的 Package 页面上传 `assets/skimai/skim-ai-v0.1.2.zip`。
3. 打开 Store listing，通过页面顶部语言下拉框选择默认简体中文，使用上面的中文详细描述并保存。
4. 切换到 English，使用上面的英文详细描述并保存。包内名称、简介随新包上传；后台详细描述需要分别更新。
5. 如果后台已经填写其他语言的详细描述，也要保留同一组功能，并注明界面默认使用简体中文。
6. 重新提交审核，查看元数据一致性提示。

Chrome Web Store 会自动分析各语言的功能表述。名称、简介和详细描述需要共同对应实际功能；重新提交时检查后台返回的提示。

官方说明：https://developer.chrome.com/docs/webstore/cws-dashboard-listing#ensure-consistency-between-localizations

## Category

Productivity

---

## Permission Justifications

| Permission                   | Justification                                                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| storage                      | Stores user preferences, API keys, and cached summaries locally                                                                                                |
| tabs                         | Detects active tab URL to determine when to show video summary or search panel                                                                                 |
| alarms                       | Schedules periodic tasks for translation features                                                                                                              |
| cookies                      | Required for YouTube subtitle fetching (authentication with YouTube's caption API)                                                                             |
| contextMenus                 | Provides right-click translate option for selected text                                                                                                        |
| identity                     | Optional Google account login for sync features (inherited from Read Frog)                                                                                     |
| scripting                    | Injects content scripts for translation overlay on user-activated pages                                                                                        |
| webNavigation                | Detects YouTube SPA navigation to re-inject summary panel on video changes                                                                                     |
| offscreen                    | Processes audio for text-to-speech features in background                                                                                                      |
| sidePanel                    | Provides side panel UI for translation features                                                                                                                |
| host*permissions (*://\_/\*) | Required for webpage translation to work on any site the user visits. Video summary and search features only activate on YouTube and supported search engines. |
