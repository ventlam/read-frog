import "@/utils/zod-config"
import ReactDOM from "react-dom/client"
import { defineContentScript } from "#imports"
import { getLocalConfig } from "@/utils/config/storage"
import { DEFAULT_CONFIG } from "@/utils/constants/config"
import App from "./app"
import { getSearchEngineConfig } from "./search-engines"
import { searchSummaryStyles } from "./styles"

export default defineContentScript({
  matches: [
    "*://www.google.com/search*",
    "*://www.google.co.uk/search*",
    "*://www.google.co.jp/search*",
    "*://www.google.com.sg/search*",
    "*://www.google.com.au/search*",
    "*://www.google.com.hk/search*",
    "*://www.bing.com/search*",
    "*://duckduckgo.com/*",
  ],
  runAt: "document_idle",
  async main() {
    const engineConfig = getSearchEngineConfig()
    if (!engineConfig)
      return

    // Inject Skim fonts into host document
    if (!document.getElementById("skim-ai-fonts")) {
      const link = document.createElement("link")
      link.id = "skim-ai-fonts"
      link.rel = "stylesheet"
      link.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap"
      document.head.appendChild(link)
    }

    const config = await getLocalConfig() ?? DEFAULT_CONFIG

    const waitForAnchor = (): Promise<Element> => {
      return new Promise((resolve) => {
        const existing = document.querySelector(engineConfig.sidebarAnchor)
        if (existing) {
          resolve(existing)
          return
        }

        const observer = new MutationObserver(() => {
          const el = document.querySelector(engineConfig.sidebarAnchor)
          if (el) {
            observer.disconnect()
            resolve(el)
          }
        })
        observer.observe(document.body, { childList: true, subtree: true })
      })
    }

    const anchor = await waitForAnchor()

    const host = document.createElement("div")
    host.id = "skim-ai-search-summary"
    host.classList.add("notranslate")
    host.setAttribute("translate", "no")
    const shadow = host.attachShadow({ mode: "open" })

    const style = document.createElement("style")
    style.textContent = searchSummaryStyles
    shadow.appendChild(style)

    const container = document.createElement("div")
    shadow.appendChild(container)

    anchor.insertAdjacentElement(engineConfig.sidebarPosition, host)

    const root = ReactDOM.createRoot(container)
    root.render(<App config={config} engineConfig={engineConfig} />)
  },
})
