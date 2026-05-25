export interface TranscriptSegment {
  start: number
  duration: number
  text: string
}

const MSG_REQUEST = "skim-ai-transcript-request"
const MSG_RESPONSE = "skim-ai-transcript-response"

export async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
  // Ask the main-world bridge script for transcript data
  const delays = [0, 2000, 4000, 6000]
  for (const delay of delays) {
    if (delay > 0)
      await new Promise(r => setTimeout(r, delay))

    console.log("[SkimAI] Requesting transcript via bridge, attempt", delays.indexOf(delay) + 1)
    const segments = await requestFromBridge(videoId)
    if (segments.length > 0) {
      console.log("[SkimAI] Got", segments.length, "segments from bridge")
      return segments
    }
  }
  return []
}

function requestFromBridge(videoId: string): Promise<TranscriptSegment[]> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      window.removeEventListener("message", handler)
      console.log("[SkimAI] Bridge request timed out")
      resolve([])
    }, 10000)

    function handler(event: MessageEvent) {
      if (event.data?.type !== MSG_RESPONSE || event.data?.videoId !== videoId)
        return
      window.removeEventListener("message", handler)
      clearTimeout(timeout)
      resolve(event.data.segments || [])
    }

    window.addEventListener("message", handler)
    window.postMessage({ type: MSG_REQUEST, videoId }, "*")
  })
}

export function transcriptToText(segments: TranscriptSegment[], maxChars = 12000): string {
  let result = ""
  for (const seg of segments) {
    if (result.length + seg.text.length > maxChars)
      break
    result += `${seg.text} `
  }
  return result.trim()
}

export function getVideoTitle(): string {
  return document.querySelector("yt-formatted-string.ytd-watch-metadata")?.textContent?.trim()
    ?? document.querySelector("h1.ytd-watch-metadata")?.textContent?.trim()
    ?? document.title.replace(/ - YouTube$/, "").trim()
}

export function getVideoId(): string | null {
  return new URLSearchParams(window.location.search).get("v")
}
