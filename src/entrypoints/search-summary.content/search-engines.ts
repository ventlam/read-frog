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

const GOOGLE_CONFIG: SearchEngineConfig = {
  name: "Google",
  queryParam: "q",
  resultsSelector: "#search",
  sidebarAnchor: "#rhs",
  sidebarPosition: "afterbegin",
  resultItemSelector: "div.g",
  resultTitleSelector: "h3",
  resultSnippetSelector: "[data-sncf], .VwiC3b",
}

const SEARCH_ENGINES: Record<string, SearchEngineConfig> = {
  "www.google.com": GOOGLE_CONFIG,
  "www.google.co.uk": GOOGLE_CONFIG,
  "www.google.co.jp": GOOGLE_CONFIG,
  "www.google.com.sg": GOOGLE_CONFIG,
  "www.google.com.au": GOOGLE_CONFIG,
  "www.google.com.hk": GOOGLE_CONFIG,
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
  url?: string
}

export function extractSearchResults(config: SearchEngineConfig, maxResults = 6): SearchResult[] {
  const root = document.querySelector(config.resultsSelector) ?? document
  const results: SearchResult[] = []
  const seenTitles = new Set<string>()

  const items = root.querySelectorAll(config.resultItemSelector)
  for (const item of items) {
    if (results.length >= maxResults)
      break
    const r = extractFromItem(item, config)
    if (r && !seenTitles.has(r.title)) {
      seenTitles.add(r.title)
      results.push(r)
    }
  }

  if (results.length < 3) {
    const titles = root.querySelectorAll(config.resultTitleSelector)
    for (const titleEl of titles) {
      if (results.length >= maxResults)
        break
      const container = titleEl.closest("div[data-ved], div.g, li.b_algo, article") ?? titleEl.parentElement?.parentElement
      if (!container)
        continue
      const r = extractFromItem(container, config)
      if (r && !seenTitles.has(r.title)) {
        seenTitles.add(r.title)
        results.push(r)
      }
    }
  }

  return results
}

function extractFromItem(item: Element, config: SearchEngineConfig): SearchResult | null {
  const titleEl = item.querySelector(config.resultTitleSelector) ?? item.querySelector("h3, h2")
  const title = titleEl?.textContent?.trim()
  if (!title || title.length < 3)
    return null
  const url = extractResultUrl(item, titleEl)

  const snippetSelectors = `${config.resultSnippetSelector}, [data-sncf], [data-content-feature], .VwiC3b, .IsZvec, .b_caption p, span[style*="-webkit-line-clamp"]`
  let snippet = ""
  for (const el of item.querySelectorAll(snippetSelectors)) {
    const text = el.textContent?.trim() ?? ""
    if (text.length > snippet.length && text !== title && text.length > 20) {
      snippet = text.length > 500 ? `${text.slice(0, 500)}...` : text
    }
  }

  if (!snippet) {
    const fullText = item.textContent?.replace(title, "").trim() ?? ""
    if (fullText.length > 30)
      snippet = fullText.length > 500 ? `${fullText.slice(0, 500)}...` : fullText
  }

  if (!snippet)
    return null
  return url ? { title, snippet, url } : { title, snippet }
}

function extractResultUrl(item: Element, titleEl: Element | null): string | undefined {
  const anchor = titleEl?.closest<HTMLAnchorElement>("a[href]") ?? item.querySelector<HTMLAnchorElement>("a[href]")
  const href = anchor?.getAttribute("href")
  if (!href)
    return undefined
  return normalizeResultUrl(href)
}

function normalizeResultUrl(href: string): string | undefined {
  try {
    const url = new URL(href, window.location.href)
    if (url.pathname === "/url") {
      const target = url.searchParams.get("q") ?? url.searchParams.get("url")
      if (target)
        return normalizeResultUrl(target)
    }
    if (url.protocol === "http:" || url.protocol === "https:")
      return url.href
  }
  catch {
    return undefined
  }
  return undefined
}
