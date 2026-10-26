# Privacy Policy — Skim AI

_Last updated: May 28, 2026_

## Overview

Skim AI is a browser extension that provides AI-powered video summaries, search enhancement, and webpage translation. We are committed to protecting your privacy. This policy explains what data the extension accesses, how it's used, and what is never collected.

## Data Collection

**Skim AI does not collect, store, or transmit any personal data to our servers.** We do not operate any backend servers or data collection infrastructure.

### What stays on your device

- **API keys**: Your AI provider API keys are stored in Chrome's local storage on your device. They are never sent to any server other than the AI provider you configured.
- **User preferences**: Settings like target language, translation mode, and feature toggles are stored locally in Chrome storage.
- **No accounts**: Skim AI does not require user registration or login.

### What is sent to third-party AI providers

When you use Skim AI's features, the following data is sent **directly from your browser** to the AI provider you configured (e.g., DeepSeek, OpenAI, Anthropic):

- **Video summaries**: The transcript text of the YouTube video you are watching is sent to your AI provider for summarization.
- **Search summaries**: Snippets from search results on the current page are sent to your AI provider for synthesis.
- **Translation**: Text content from webpages you choose to translate is sent to your AI provider.

This data is sent using **your own API key** under **your own API agreement** with the provider. Skim AI acts only as a client — we never proxy, intercept, or store this data.

### What is never collected

- No browsing history
- No personal information
- No analytics or telemetry
- No cookies for tracking
- No data shared with advertisers
- No data sold to third parties

## Permissions Explained

| Permission       | Why it's needed                                                                      |
| ---------------- | ------------------------------------------------------------------------------------ |
| storage          | Save your settings and API keys locally                                              |
| tabs             | Detect when you're on YouTube or a search engine to show relevant features           |
| cookies          | Authenticate with YouTube's caption API to fetch video transcripts                   |
| host_permissions | Enable webpage translation on any site you choose to translate                       |
| scripting        | Inject translation overlay when you activate translation                             |
| webNavigation    | Detect YouTube page navigation (it's a single-page app) to refresh the summary panel |

## Data Retention

All data is stored locally in your browser's extension storage. Uninstalling the extension removes all stored data. No data persists on any external server.

## Third-Party Services

Skim AI connects to third-party AI providers only when you explicitly configure an API key and use a feature. The data handling of these providers is governed by their own privacy policies:

- [OpenAI Privacy Policy](https://openai.com/privacy)
- [Anthropic Privacy Policy](https://www.anthropic.com/privacy)
- [DeepSeek Privacy Policy](https://www.deepseek.com/privacy)
- [Google AI Privacy Policy](https://ai.google/privacy)

## Open Source

Skim AI is open source under the GPL-3.0 license. You can inspect the complete source code at: https://github.com/ventlam/read-frog

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected in the "Last updated" date above and in our GitHub repository.

## Contact

If you have questions about this privacy policy, please open an issue on our GitHub repository: https://github.com/ventlam/read-frog/issues
