import "@/utils/zod-config"
import ReactDOM from "react-dom/client"
import { defineContentScript } from "#imports"
import { getLocalConfig } from "@/utils/config/storage"
import { DEFAULT_CONFIG } from "@/utils/constants/config"
import App from "./app"
import { videoSummaryStyles } from "./styles"

let currentRoot: ReactDOM.Root | null = null
let resizeObserver: ResizeObserver | null = null

function syncHeight(host: HTMLElement) {
  const player = document.querySelector("#movie_player")
  if (!player)
    return
  const h = player.clientHeight
  if (h > 200)
    host.style.height = `${h}px`
}

function mount(config: any) {
  const existing = document.getElementById("skim-ai-video-summary")
  if (existing)
    return

  const anchor
    = document.querySelector("#secondary-inner")
      ?? document.querySelector("#secondary")
      ?? document.querySelector("#related")

  if (!anchor)
    return

  const host = document.createElement("div")
  host.id = "skim-ai-video-summary"
  host.classList.add("notranslate")
  host.setAttribute("translate", "no")
  host.style.marginBottom = "12px"
  host.style.overflow = "hidden"
  syncHeight(host)

  const player = document.querySelector("#movie_player")
  if (player) {
    resizeObserver = new ResizeObserver(() => syncHeight(host))
    resizeObserver.observe(player)
  }

  const shadow = host.attachShadow({ mode: "open" })

  const style = document.createElement("style")
  style.textContent = videoSummaryStyles
  shadow.appendChild(style)

  const container = document.createElement("div")
  container.style.height = "100%"
  shadow.appendChild(container)

  anchor.insertAdjacentElement("afterbegin", host)

  currentRoot = ReactDOM.createRoot(container)
  currentRoot.render(<App config={config} />)
}

function unmount() {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (currentRoot) {
    currentRoot.unmount()
    currentRoot = null
  }
  const el = document.getElementById("skim-ai-video-summary")
  if (el)
    el.remove()
}

declare global {
  interface Window {
    __SKIM_AI_VIDEO_SUMMARY__?: boolean
  }
}

function injectSkimFonts() {
  if (document.getElementById("skim-ai-fonts"))
    return
  const link = document.createElement("link")
  link.id = "skim-ai-fonts"
  link.rel = "stylesheet"
  link.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap"
  document.head.appendChild(link)
  const link2 = document.createElement("link")
  link2.rel = "stylesheet"
  link2.href = "https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
  document.head.appendChild(link2)
}

export default defineContentScript({
  matches: ["*://*.youtube.com/*"],
  runAt: "document_idle",
  async main(ctx) {
    if (window.__SKIM_AI_VIDEO_SUMMARY__)
      return
    window.__SKIM_AI_VIDEO_SUMMARY__ = true

    ctx.onInvalidated(() => {
      window.__SKIM_AI_VIDEO_SUMMARY__ = false
      unmount()
    })

    const config = await getLocalConfig() ?? DEFAULT_CONFIG

    injectSkimFonts()

    if (window.location.pathname === "/watch") {
      mount(config)
    }

    window.addEventListener("yt-navigate-finish", () => {
      unmount()
      if (window.location.pathname === "/watch") {
        setTimeout(mount, 500, config)
      }
    })
  },
})
