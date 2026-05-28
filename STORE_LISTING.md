# Chrome Web Store Listing

## Name (max 75 chars)
Skim AI - YouTube Summary & Smart Search

## Short Description (max 132 chars)
AI video summaries with two-pass deep analysis, timestamped chapters, and search enhancement. Powered by your own API key.

## Detailed Description

Skim AI turns long YouTube videos into structured, scannable summaries — and enhances your Google search with AI-powered answers.

**YouTube Video Summary**
- Two-pass deep analysis: first identifies topic boundaries across the full video, then summarizes each segment in parallel
- Hierarchical chapters with precise timestamps — click any timestamp to jump directly to that moment
- Expandable key points with specific names, data, and arguments for each segment
- TL;DR overview + Key Takeaways for quick scanning
- Highlights tab with memorable direct quotes from speakers
- Full transcript view with copy support
- Ask tab for follow-up questions about the video content
- Works with videos of any length: short clips to 2+ hour podcasts and interviews
- Adaptive segmentation: more segments for longer videos, fewer for short ones

**Google Search Enhancement**
- AI-generated answer panel in the search sidebar
- Synthesizes top search results with source citations
- Follow-up questions for deeper exploration

**Translation (powered by Read Frog)**
- Webpage translation with bilingual display
- YouTube subtitle translation overlay
- Multiple AI provider support

**Privacy First**
- Your API keys stay in local browser storage — never sent to our servers
- No user accounts required, no tracking, no analytics
- All AI processing happens directly between your browser and your chosen AI provider
- 100% open source (GPL-3.0): https://github.com/ventlam/read-frog

**Supported AI Providers**
Works with any OpenAI-compatible API: DeepSeek, OpenAI, Anthropic Claude, Google Gemini, and more. Bring your own API key.

**How It Works**
1. Install and add your AI provider API key in Settings → API Providers
2. Open any YouTube video — Skim AI automatically appears in the sidebar
3. Search on Google — the AI summary panel appears on the right
4. Customize output language, toggle features on/off in Options

Built on Read Frog's translation engine. Open source under GPL-3.0.

## Category
Productivity

## Language
English (with multi-language output support: Chinese, Japanese, Korean, Spanish, and 15+ languages)

---

## Permission Justifications

| Permission | Justification |
|---|---|
| storage | Stores user preferences, API keys, and cached summaries locally |
| tabs | Detects active tab URL to determine when to show video summary or search panel |
| alarms | Schedules periodic tasks for translation features |
| cookies | Required for YouTube subtitle fetching (authentication with YouTube's caption API) |
| contextMenus | Provides right-click translate option for selected text |
| identity | Optional Google account login for sync features (inherited from Read Frog) |
| scripting | Injects content scripts for translation overlay on user-activated pages |
| webNavigation | Detects YouTube SPA navigation to re-inject summary panel on video changes |
| offscreen | Processes audio for text-to-speech features in background |
| sidePanel | Provides side panel UI for translation features |
| host_permissions (*://*/*) | Required for webpage translation to work on any site the user visits. Video summary and search features only activate on YouTube and supported search engines. |
