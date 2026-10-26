// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { YoutubeSubtitlesFetcher } from "@/utils/subtitles/fetchers/youtube"
import { fetchTranscript, transcriptForModel, transcriptToText } from "../transcript"

vi.mock("@/utils/subtitles/fetchers/youtube", () => ({
  YoutubeSubtitlesFetcher: vi.fn(class {
    hasAvailableSubtitles = vi.fn().mockResolvedValue(true)
    fetch = vi.fn().mockResolvedValue([{ start: 1000, end: 2500, text: "字幕" }])
    cleanup = vi.fn()
  }),
}))

describe("skim AI transcript", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, "", "/watch?v=current")
  })

  it("retains the ending of transcripts longer than the old 200000 character limit", () => {
    const text = transcriptToText([
      { start: 0, duration: 1, text: "字幕".repeat(120000) },
      { start: 1, duration: 1, text: "视频结尾 THE_END" },
    ])
    expect(text.length).toBeGreaterThan(200000)
    expect(text.endsWith("视频结尾 THE_END")).toBe(true)
    const modelText = transcriptForModel(text)
    expect(modelText.length).toBeLessThanOrEqual(200000)
    expect(modelText.endsWith("视频结尾 THE_END")).toBe(true)
  })

  it("returns no text only when the player confirms there are no captions", async () => {
    vi.mocked(YoutubeSubtitlesFetcher).mockImplementationOnce(class {
      hasAvailableSubtitles = vi.fn().mockResolvedValue(false)
      fetch = vi.fn()
      cleanup = vi.fn()
    } as unknown as typeof YoutubeSubtitlesFetcher)
    await expect(fetchTranscript("current")).resolves.toEqual([])
    const instance = vi.mocked(YoutubeSubtitlesFetcher).mock.results[0].value
    expect(instance.fetch).not.toHaveBeenCalled()
    expect(instance.cleanup).toHaveBeenCalled()
  })

  it("propagates lookup failures so they can be retried", async () => {
    vi.mocked(YoutubeSubtitlesFetcher).mockImplementationOnce(class {
      hasAvailableSubtitles = vi.fn().mockRejectedValue(new Error("timeout"))
      fetch = vi.fn()
      cleanup = vi.fn()
    } as unknown as typeof YoutubeSubtitlesFetcher)
    await expect(fetchTranscript("current")).rejects.toThrow("timeout")
  })

  it("converts millisecond fragments without losing text", async () => {
    await expect(fetchTranscript("current")).resolves.toEqual([{ start: 1, duration: 1.5, text: "字幕" }])
  })

  it("stops a cancelled request before it starts looking up the player", async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(fetchTranscript("current", controller.signal)).rejects.toThrow()
    const instance = vi.mocked(YoutubeSubtitlesFetcher).mock.results[0].value
    expect(instance.hasAvailableSubtitles).not.toHaveBeenCalled()
    expect(instance.cleanup).toHaveBeenCalled()
  })
})
