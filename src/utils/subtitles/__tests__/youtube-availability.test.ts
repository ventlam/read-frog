import type { PlayerData } from "../fetchers/youtube/types"
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PLAYER_RESPONSE_PENDING_ERROR } from "@/utils/constants/subtitles"
import { YoutubeSubtitlesFetcher } from "../fetchers/youtube"
import { extractPotToken } from "../fetchers/youtube/pot-token"

const playerData: PlayerData = {
  videoId: "current",
  captionTracks: [{ baseUrl: "https://www.youtube.com/api/timedtext?v=current&lang=en", languageCode: "en", vssId: ".en" }],
  audioCaptionTracks: [],
  device: null,
  cver: null,
  playerState: 1,
  selectedTrackLanguageCode: "en",
  selectedTrackVssId: ".en",
  cachedTimedtextUrl: null,
}

describe("youTube caption availability backport", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.history.replaceState({}, "", "/watch?v=current")
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("waits for the current player response instead of misreporting missing captions", async () => {
    const fetcher = new YoutubeSubtitlesFetcher()
    const request = vi.spyOn(fetcher as any, "requestPlayerData")
      .mockResolvedValueOnce({ success: false, error: "VIDEO_ID_MISMATCH" })
      .mockResolvedValueOnce({ success: false, error: PLAYER_RESPONSE_PENDING_ERROR })
      .mockResolvedValue({ success: true, data: playerData })
    const available = fetcher.hasAvailableSubtitles()
    await vi.advanceTimersByTimeAsync(300)
    await expect(available).resolves.toBe(true)
    expect(request).toHaveBeenCalledTimes(3)
  })

  it("only reports no captions after receiving the matching player's empty track list", async () => {
    const fetcher = new YoutubeSubtitlesFetcher()
    vi.spyOn(fetcher as any, "requestPlayerData").mockResolvedValue({ success: true, data: { ...playerData, captionTracks: [] } })
    await expect(fetcher.hasAvailableSubtitles()).resolves.toBe(false)
  })

  it("reports a timeout as a retryable failure", async () => {
    const fetcher = new YoutubeSubtitlesFetcher()
    vi.spyOn(fetcher as any, "requestPlayerData").mockResolvedValue({ success: false, error: "TIMEOUT" })
    await expect(fetcher.hasAvailableSubtitles()).rejects.toThrow("subtitles.errors.fetchSubTimeout")
  })

  it("does not use an advertisement's POT token for the main video", () => {
    const track = playerData.captionTracks[0]
    expect(extractPotToken(track, {
      ...playerData,
      audioCaptionTracks: [{ url: "https://www.youtube.com/api/timedtext?v=advert&pot=ad-token", vssId: ".en", languageCode: "en" }],
    }).pot).toBeNull()
    expect(extractPotToken(track, {
      ...playerData,
      audioCaptionTracks: [{ url: "https://www.youtube.com/api/timedtext?v=current&pot=video-token", vssId: ".en", languageCode: "en" }],
    }).pot).toBe("video-token")
  })
})
