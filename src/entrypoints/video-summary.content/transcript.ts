import { YoutubeSubtitlesFetcher } from "@/utils/subtitles/fetchers/youtube"

export interface TranscriptSegment {
  start: number
  duration: number
  text: string
}

export async function fetchTranscript(videoId: string, signal?: AbortSignal): Promise<TranscriptSegment[]> {
  const fetcher = new YoutubeSubtitlesFetcher()
  const cancel = () => fetcher.cleanup()
  signal?.addEventListener("abort", cancel, { once: true })
  try {
    signal?.throwIfAborted()
    if (!await fetcher.hasAvailableSubtitles())
      return []
    signal?.throwIfAborted()
    if (getVideoId() !== videoId)
      throw new Error("视频已切换")
    const fragments = await fetcher.fetch()
    signal?.throwIfAborted()
    return fragments.map(f => ({
      start: f.start / 1000,
      duration: (f.end - f.start) / 1000,
      text: f.text,
    }))
  }
  finally {
    signal?.removeEventListener("abort", cancel)
    fetcher.cleanup()
  }
}

export function transcriptToText(segments: TranscriptSegment[]): string {
  return segments.map(segment => segment.text).join(" ").trim()
}

// Only model input is budgeted; the script view and clipboard always use the full text.
// Sample across the whole video so long recordings retain their ending in the overview.
export function transcriptForModel(text: string, maxChars = 200000): string {
  if (text.length <= maxChars)
    return text
  const separator = "\n[…]\n"
  const samples = 20
  const chunkSize = Math.floor((maxChars - separator.length * (samples - 1)) / samples)
  return Array.from({ length: samples }, (_, i) => {
    const start = Math.floor(i * (text.length - chunkSize) / (samples - 1))
    return text.slice(start, start + chunkSize)
  }).join(separator)
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
  if (parts.length === 3)
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return parts[0] * 60 + (parts[1] || 0)
}
