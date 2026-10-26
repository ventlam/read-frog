// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { ENSURE_SUBTITLES_REQUEST_TYPE, PLAYER_DATA_REQUEST_TYPE, PLAYER_RESPONSE_PENDING_ERROR } from "@/utils/constants/subtitles"
import { injectPlayerApi } from "../inject-player-api"

vi.mock("../timedtext-observer", () => ({
  setupTimedtextObserver: vi.fn(),
  getCachedTimedtextUrl: () => null,
  waitForTimedtextUrl: vi.fn().mockResolvedValue(null),
}))

function addPlayer(id: string, videoId: string, loadedId = videoId) {
  const player = document.createElement("div")
  player.id = id
  player.className = "html5-video-player paused-mode"
  Object.assign(player, {
    getPlayerResponse: () => ({ videoDetails: { videoId }, captions: { playerCaptionsTracklistRenderer: { captionTracks: [] } } }),
    getVideoData: () => ({ video_id: loadedId }),
    toggleSubtitles: vi.fn(),
  })
  player.innerHTML = "<button class=\"ytp-subtitles-button\" aria-pressed=\"false\"></button>"
  document.body.appendChild(player)
  return player as typeof player & { toggleSubtitles: ReturnType<typeof vi.fn> }
}

function request(data: Record<string, unknown>) {
  window.dispatchEvent(new MessageEvent("message", { origin: window.location.origin, data: { requestId: "test-request", ...data } }))
}

describe("youTube player selection backport", () => {
  beforeAll(injectPlayerApi)
  beforeEach(() => vi.spyOn(window, "postMessage").mockImplementation(() => {}))
  afterEach(() => {
    document.body.innerHTML = ""
    vi.restoreAllMocks()
  })

  it("selects the watch player even when a paused thumbnail preview comes first", () => {
    addPlayer("inline-preview-player", "preview")
    addPlayer("movie_player", "current")
    request({ type: PLAYER_DATA_REQUEST_TYPE, expectedVideoId: "current" })
    expect(window.postMessage).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.objectContaining({ videoId: "current" }) }), window.location.origin)
  })

  it("reports that the matching player's response is still pending", () => {
    addPlayer("movie_player", "previous", "current")
    request({ type: PLAYER_DATA_REQUEST_TYPE, expectedVideoId: "current" })
    expect(window.postMessage).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: PLAYER_RESPONSE_PENDING_ERROR }), window.location.origin)
  })

  it("enables captions on the requested video rather than the preview", () => {
    const preview = addPlayer("inline-preview-player", "preview")
    const current = addPlayer("movie_player", "current")
    request({ type: ENSURE_SUBTITLES_REQUEST_TYPE, videoId: "current" })
    expect(current.toggleSubtitles).toHaveBeenCalledOnce()
    expect(preview.toggleSubtitles).not.toHaveBeenCalled()
  })
})
