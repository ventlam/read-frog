import { YoutubeSubtitlesFetcher } from "@/utils/subtitles/fetchers/youtube"

export interface TranscriptSegment {
  start: number
  duration: number
  text: string
}

let fetcher: YoutubeSubtitlesFetcher | null = null

export async function fetchTranscript(_videoId: string): Promise<TranscriptSegment[]> {
  try {
    if (!fetcher)
      fetcher = new YoutubeSubtitlesFetcher()

    const fragments = await fetcher.fetch()
    return fragments.map(f => ({
      start: f.start / 1000,
      duration: (f.end - f.start) / 1000,
      text: f.text,
    }))
  }
  catch (err) {
    console.warn("[SkimAI] Transcript fetch failed:", err)
    return []
  }
}

export function transcriptToText(segments: TranscriptSegment[], maxChars = 200000): string {
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

export function estimateDuration(segments: TranscriptSegment[]): number {
  if (segments.length === 0)
    return 0
  const last = segments[segments.length - 1]
  return Math.ceil((last.start + last.duration) / 60)
}

export function sliceTranscript(segments: TranscriptSegment[], startSec: number, endSec: number): string {
  return segments
    .filter(s => s.start >= startSec && s.start < endSec)
    .map(s => s.text)
    .join(" ")
    .trim()
}

export function parseTimestamp(ts: string): number {
  const parts = ts.split(":").map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return parts[0] * 60 + (parts[1] || 0)
}

export function resetFetcher(): void {
  if (fetcher) {
    fetcher.cleanup()
    fetcher = null
  }
}
