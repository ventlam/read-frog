import { defineContentScript } from "#imports"

export default defineContentScript({
  matches: ["*://*.youtube.com/*"],
  world: "MAIN",
  runAt: "document_start",
  main() {
    const MSG_REQUEST = "skim-ai-transcript-request"
    const MSG_RESPONSE = "skim-ai-transcript-response"

    let cachedTracks: any[] | null = null

    try {
      const existing = (window as any).ytInitialPlayerResponse
      if (existing?.captions?.playerCaptionsTracklistRenderer?.captionTracks?.length) {
        cachedTracks = existing.captions.playerCaptionsTracklistRenderer.captionTracks
        console.log("[SkimAI Bridge] Found existing ytInitialPlayerResponse with", cachedTracks!.length, "tracks")
      }
    }
    catch { /* ignore */ }

    try {
      let _stored = (window as any).ytInitialPlayerResponse
      Object.defineProperty(window, "ytInitialPlayerResponse", {
        get() { return _stored },
        set(value) {
          _stored = value
          const tracks = value?.captions?.playerCaptionsTracklistRenderer?.captionTracks
          if (tracks?.length) {
            cachedTracks = tracks
            console.log("[SkimAI Bridge] Intercepted ytInitialPlayerResponse:", tracks.length, "tracks")
          }
        },
        configurable: true,
        enumerable: true,
      })
    }
    catch (e) {
      console.warn("[SkimAI Bridge] Could not defineProperty:", e)
    }

    console.log("[SkimAI Bridge] Loaded in MAIN world")

    window.addEventListener("message", async (event) => {
      if (event.data?.type !== MSG_REQUEST)
        return
      const videoId = event.data.videoId
      if (!videoId)
        return

      console.log("[SkimAI Bridge] Request for", videoId)

      try {
        const segments = await getTranscript(videoId)
        console.log("[SkimAI Bridge] Result:", segments.length, "segments")
        window.postMessage({ type: MSG_RESPONSE, videoId, segments }, "*")
      }
      catch (err) {
        console.error("[SkimAI Bridge] Error:", err)
        window.postMessage({ type: MSG_RESPONSE, videoId, segments: [] }, "*")
      }
    })

    async function getTranscript(videoId: string): Promise<any[]> {
      // Method 1: cached tracks from interceptor
      if (cachedTracks?.length) {
        console.log("[SkimAI Bridge] Trying cached tracks:", cachedTracks.length)
        const result = await tryTracks(cachedTracks)
        if (result.length > 0) return result
        console.log("[SkimAI Bridge] Cached tracks failed")
      }

      // Method 2: window objects
      const windowTracks = getCaptionTracksFromWindow()
      if (windowTracks?.length) {
        console.log("[SkimAI Bridge] Trying window tracks:", windowTracks.length)
        const result = await tryTracks(windowTracks)
        if (result.length > 0) return result
        console.log("[SkimAI Bridge] Window tracks failed")
      }
      else {
        console.log("[SkimAI Bridge] No window tracks found")
      }

      // Method 3: player API
      const playerTracks = getCaptionTracksFromPlayer()
      if (playerTracks?.length) {
        console.log("[SkimAI Bridge] Trying player tracks:", playerTracks.length)
        const result = await tryTracks(playerTracks)
        if (result.length > 0) return result
        console.log("[SkimAI Bridge] Player tracks failed")
      }
      else {
        console.log("[SkimAI Bridge] No player tracks found")
      }

      // Method 4: Performance API URLs
      const perfUrls = getTimedTextFromPerformance()
      if (perfUrls.length > 0) {
        console.log("[SkimAI Bridge] Trying", perfUrls.length, "perf URLs")
        for (const url of perfUrls) {
          const segments = await fetchCaptions(url)
          if (segments.length > 0) return segments
        }
        console.log("[SkimAI Bridge] Perf URLs failed")
      }
      else {
        console.log("[SkimAI Bridge] No perf URLs found")
      }

      // Method 5: Fetch page HTML and extract caption tracks
      console.log("[SkimAI Bridge] Trying HTML fallback for", videoId)
      const htmlTracks = await getCaptionTracksFromHTML(videoId)
      if (htmlTracks?.length) {
        console.log("[SkimAI Bridge] HTML fallback found", htmlTracks.length, "tracks")
        const result = await tryTracks(htmlTracks)
        if (result.length > 0) return result
        console.log("[SkimAI Bridge] HTML fallback tracks failed to fetch")
      }
      else {
        console.log("[SkimAI Bridge] HTML fallback found no tracks")
      }

      return []
    }

    async function tryTracks(tracks: any[]): Promise<any[]> {
      for (const track of sortTracks(tracks)) {
        const segments = await fetchCaptions(track.baseUrl)
        if (segments.length > 0)
          return segments
      }
      return []
    }

    function getCaptionTracksFromWindow(): any[] | null {
      try {
        const ytData = (window as any).ytInitialPlayerResponse
        if (ytData?.captions?.playerCaptionsTracklistRenderer?.captionTracks?.length)
          return ytData.captions.playerCaptionsTracklistRenderer.captionTracks

        const ytplayer = (window as any).ytplayer
        const raw = ytplayer?.config?.args?.player_response
        if (raw) {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw
          if (parsed?.captions?.playerCaptionsTracklistRenderer?.captionTracks?.length)
            return parsed.captions.playerCaptionsTracklistRenderer.captionTracks
        }
      }
      catch { /* ignore */ }
      return null
    }

    function getCaptionTracksFromPlayer(): any[] | null {
      try {
        const player = document.getElementById("movie_player") as any
        if (!player?.getPlayerResponse)
          return null
        const resp = player.getPlayerResponse()
        if (resp?.captions?.playerCaptionsTracklistRenderer?.captionTracks?.length)
          return resp.captions.playerCaptionsTracklistRenderer.captionTracks
      }
      catch { /* ignore */ }
      return null
    }

    function getTimedTextFromPerformance(): string[] {
      try {
        const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[]
        return entries
          .map(e => e.name || "")
          .filter(url =>
            url.includes("/api/timedtext")
            && !url.includes("fmt=ttml"),
          )
      }
      catch { return [] }
    }

    async function getCaptionTracksFromHTML(videoId: string): Promise<any[] | null> {
      try {
        const resp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          credentials: "include",
        })
        if (!resp.ok) return null
        const html = await resp.text()
        const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/)
          ?? html.match(/"captions":\s*(\{.+?\}),\s*"videoDetails"/)
        if (!match) return null

        let data: any
        if (match[0].startsWith('"captions"')) {
          data = { captions: JSON.parse(match[1]) }
        }
        else {
          data = JSON.parse(match[1])
        }

        return data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || null
      }
      catch (e) {
        console.warn("[SkimAI Bridge] HTML parse error:", e)
        return null
      }
    }

    function sortTracks(tracks: any[]): any[] {
      return [...tracks].sort((a, b) => {
        const aEn = a.languageCode === "en"
        const bEn = b.languageCode === "en"
        if (aEn && !bEn)
          return -1
        if (!aEn && bEn)
          return 1
        const aAsr = a.kind === "asr"
        const bAsr = b.kind === "asr"
        if (!aAsr && bAsr)
          return -1
        if (aAsr && !bAsr)
          return 1
        return 0
      })
    }

    async function fetchCaptions(url: string): Promise<any[]> {
      try {
        const u = new URL(url)
        if (!u.searchParams.has("fmt"))
          u.searchParams.set("fmt", "json3")
        const resp = await fetch(u.toString(), { credentials: "include" })
        if (!resp.ok) {
          console.log("[SkimAI Bridge] Caption fetch failed:", resp.status, url.slice(0, 80))
          return []
        }
        const text = await resp.text()
        if (!text || text.length === 0)
          return []

        if (text.trim().startsWith("{")) {
          const data = JSON.parse(text)
          if (data.events) {
            return data.events
              .filter((ev: any) => ev.segs && ev.tStartMs != null)
              .map((ev: any) => ({
                start: ev.tStartMs / 1000,
                duration: (ev.dDurationMs || 0) / 1000,
                text: ev.segs.map((s: any) => s.utf8 || "").join("").replace(/\n/g, " ").trim(),
              }))
              .filter((s: any) => s.text)
          }
        }

        if (text.trim().startsWith("<")) {
          const parser = new DOMParser()
          const doc = parser.parseFromString(text, "text/xml")
          return Array.from(doc.querySelectorAll("text"))
            .map(node => ({
              start: Number.parseFloat(node.getAttribute("start") || "0"),
              duration: Number.parseFloat(node.getAttribute("dur") || "0"),
              text: (node.textContent || "").replace(/\n/g, " ").trim(),
            }))
            .filter(s => s.text)
        }

        return []
      }
      catch { return [] }
    }
  },
})
