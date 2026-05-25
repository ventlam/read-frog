export interface SearchEngineConfig {
  name: string
  queryParam: string
  resultsSelector: string
  sidebarAnchor: string
  sidebarPosition: "beforebegin" | "afterbegin" | "beforeend" | "afterend"
  resultItemSelector: string
  resultTitleSelector: string
  resultSnippetSelector: string
}

const SEARCH_ENGINES: Record<string, SearchEngineConfig> = {
  "www.google.com": {
    name: "Google",
    queryParam: "q",
    resultsSelector: "#search",
    sidebarAnchor: "#rhs",
    sidebarPosition: "afterbegin",
    resultItemSelector: "div.g",
    resultTitleSelector: "h3",
    resultSnippetSelector: "[data-sncf], .VwiC3b",
  },
  "www.bing.com": {
    name: "Bing",
    queryParam: "q",
    resultsSelector: "#b_results",
    sidebarAnchor: "#b_context",
    sidebarPosition: "afterbegin",
    resultItemSelector: "li.b_algo",
    resultTitleSelector: "h2",
    resultSnippetSelector: ".b_caption p",
  },
  "duckduckgo.com": {
    name: "DuckDuckGo",
    queryParam: "q",
    resultsSelector: "[data-testid='mainline']",
    sidebarAnchor: "[data-testid='sidebar']",
    sidebarPosition: "afterbegin",
    resultItemSelector: "article[data-testid='result']",
    resultTitleSelector: "h2",
    resultSnippetSelector: "[data-result='snippet']",
  },
}

export function getSearchEngineConfig(): SearchEngineConfig | null {
  return SEARCH_ENGINES[window.location.hostname] ?? null
}

export function extractSearchQuery(config: SearchEngineConfig): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get(config.queryParam)
}

export interface SearchResult {
  title: string
  snippet: string
}

export function extractSearchResults(config: SearchEngineConfig, maxResults = 6): SearchResult[] {
  const items = document.querySelectorAll(config.resultItemSelector)
  const results: SearchResult[] = []

  for (const item of items) {
    if (results.length >= maxResults)
      break

    const title = item.querySelector(config.resultTitleSelector)?.textContent?.trim()
    const snippet = item.querySelector(config.resultSnippetSelector)?.textContent?.trim()

    if (title && snippet) {
      results.push({ title, snippet })
    }
  }

  return results
}
