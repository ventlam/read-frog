import type { SearchEngineConfig } from "./search-engines"
import type { Config } from "@/types/config/config"
import { useEffect, useState } from "react"
import { SummaryPanel } from "./components/summary-panel"
import { extractSearchQuery, extractSearchResults } from "./search-engines"

interface AppProps {
  config: Config
  engineConfig: SearchEngineConfig
}

export default function App({ config, engineConfig }: AppProps) {
  const [query, setQuery] = useState<string | null>(null)
  const [results, setResults] = useState<{ title: string, snippet: string }[]>([])

  useEffect(() => {
    const q = extractSearchQuery(engineConfig)
    if (!q)
      return

    setQuery(q)

    const observer = new MutationObserver(() => {
      const extracted = extractSearchResults(engineConfig)
      if (extracted.length > 0) {
        setResults(extracted)
        observer.disconnect()
      }
    })

    const initial = extractSearchResults(engineConfig)
    if (initial.length > 0) {
      setResults(initial)
    }
    else {
      observer.observe(document.body, { childList: true, subtree: true })
    }

    return () => observer.disconnect()
  }, [engineConfig])

  if (!query || results.length === 0)
    return null

  return <SummaryPanel query={query} results={results} config={config} />
}
