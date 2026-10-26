import type { PlayerDataResponse } from "./utils"
import {
  ENSURE_SUBTITLES_REQUEST_TYPE,
  ENSURE_SUBTITLES_RESPONSE_TYPE,
  PLAYER_DATA_REQUEST_TYPE,
  PLAYER_DATA_RESPONSE_TYPE,
  PLAYER_RESPONSE_PENDING_ERROR,
  TIMEDTEXT_WAIT_TIMEOUT_MS,
  WAIT_TIMEDTEXT_REQUEST_TYPE,
  WAIT_TIMEDTEXT_RESPONSE_TYPE,
} from "@/utils/constants/subtitles"
import { getCachedTimedtextUrl, setupTimedtextObserver, waitForTimedtextUrl } from "./timedtext-observer"
import { errorResponse, normalizeTracks, parseAudioTracks } from "./utils"

interface PlayerDataRequest {
  type: typeof PLAYER_DATA_REQUEST_TYPE
  requestId: string
  expectedVideoId: string
}

interface YouTubePlayer extends HTMLElement {
  getPlayerResponse?: () => any
  getVideoData?: () => any
  getAudioTrack?: () => any
  getPlayerState?: () => number
  getWebPlayerContextConfig?: () => any
  getOption?: (module: string, option: string) => any
  toggleSubtitles?: () => void
}

declare global {
  interface Window {
    ytcfg?: {
      get?: (key: string) => string | undefined
    }
  }
}

interface SelectedTrackSnapshot {
  languageCode: string | null
  vssId: string | null
}

function getPlayerVideoId(player: YouTubePlayer, loaded = false): string | null {
  try {
    return loaded
      ? player.getVideoData?.()?.video_id ?? null
      : player.getPlayerResponse?.()?.videoDetails?.videoId ?? null
  }
  catch {
    return null
  }
}

function findYoutubePlayer(expectedVideoId?: string): YouTubePlayer | null {
  if (expectedVideoId) {
    const candidates = [
      document.querySelector<YouTubePlayer>("#movie_player"),
      ...document.querySelectorAll<YouTubePlayer>(".html5-video-player"),
    ]
    const matched = candidates.find(player => player && getPlayerVideoId(player) === expectedVideoId)
      ?? candidates.find(player => player && getPlayerVideoId(player, true) === expectedVideoId)
    if (matched)
      return matched
  }
  return document.querySelector(
    ".html5-video-player.playing-mode, .html5-video-player.paused-mode",
  ) ?? document.querySelector(".html5-video-player")
}

export function injectPlayerApi(): void {
  if ((window as any).__READ_FROG_INTERCEPTOR_INJECTED__) {
    return
  }
  ;(window as any).__READ_FROG_INTERCEPTOR_INJECTED__ = true

  setupTimedtextObserver()
  window.addEventListener("message", handleMessage)
}

function handleMessage(event: MessageEvent): void {
  if (event.origin !== window.location.origin)
    return

  if (event.data?.type === PLAYER_DATA_REQUEST_TYPE) {
    const request = event.data as PlayerDataRequest
    const response = getPlayerData(request)
    window.postMessage(response, window.location.origin)
  }

  if (event.data?.type === WAIT_TIMEDTEXT_REQUEST_TYPE) {
    const { requestId, videoId } = event.data
    void waitForTimedtextUrl(videoId, TIMEDTEXT_WAIT_TIMEOUT_MS).then((url) => {
      window.postMessage({
        type: WAIT_TIMEDTEXT_RESPONSE_TYPE,
        requestId,
        url,
      }, window.location.origin)
    })
  }

  if (event.data?.type === ENSURE_SUBTITLES_REQUEST_TYPE) {
    const { requestId, videoId } = event.data
    ensureSubtitlesEnabled(videoId)
    window.postMessage({
      type: ENSURE_SUBTITLES_RESPONSE_TYPE,
      requestId,
    }, window.location.origin)
  }
}

function getPlayerData(request: PlayerDataRequest): PlayerDataResponse {
  const { requestId, expectedVideoId } = request

  try {
    const player = findYoutubePlayer(expectedVideoId)

    if (!player)
      return errorResponse(requestId, "PLAYER_NOT_FOUND")

    const playerResponse = player.getPlayerResponse?.()
    const videoId = playerResponse?.videoDetails?.videoId
    const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
    const captionTracks = normalizeTracks(tracks)
    const selectedTrack = getSelectedTrackSnapshot(player, captionTracks)

    if (!videoId || videoId !== expectedVideoId) {
      const pending = getPlayerVideoId(player, true) === expectedVideoId
      return errorResponse(requestId, pending ? PLAYER_RESPONSE_PENDING_ERROR : "VIDEO_ID_MISMATCH")
    }

    return {
      type: PLAYER_DATA_RESPONSE_TYPE,
      requestId,
      success: true,
      data: {
        videoId,
        captionTracks,
        audioCaptionTracks: parseAudioTracks(player.getAudioTrack?.()?.captionTracks),
        device: window.ytcfg?.get?.("DEVICE") ?? null,
        cver: player.getWebPlayerContextConfig?.()?.innertubeContextClientVersion ?? null,
        playerState: player.getPlayerState?.() ?? -1,
        selectedTrackLanguageCode: selectedTrack.languageCode,
        selectedTrackVssId: selectedTrack.vssId,
        cachedTimedtextUrl: getCachedTimedtextUrl(videoId),
      },
    }
  }
  catch (e) {
    return errorResponse(requestId, String(e))
  }
}

function ensureSubtitlesEnabled(videoId?: string): void {
  const player = findYoutubePlayer(videoId)
  const button = player?.querySelector<HTMLElement>(".ytp-subtitles-button")
    ?? document.querySelector<HTMLElement>(".ytp-subtitles-button")
  if (!button)
    return

  if (button.getAttribute("aria-pressed") === "true")
    return

  if (player?.toggleSubtitles) {
    player.toggleSubtitles()
  }
  else {
    button.click()
  }
}

function getSelectedTrackSnapshot(
  player: YouTubePlayer,
  captionTracks: Array<{ languageCode: string, kind?: string, vssId: string }>,
): SelectedTrackSnapshot {
  const selectedTrack = player.getOption?.("captions", "track")
  const languageCode = selectedTrack?.languageCode ?? null
  const matchedTrack = matchSelectedTrack(captionTracks, selectedTrack)
  const vssId = getSelectedTrackVssId(selectedTrack) ?? matchedTrack?.vssId ?? null

  return {
    languageCode,
    vssId,
  }
}

function getSelectedTrackVssId(selectedTrack: any): string | null {
  const directVssId = selectedTrack?.vssId ?? selectedTrack?.vss_id
  if (typeof directVssId === "string" && directVssId.length > 0)
    return directVssId

  const baseUrl = selectedTrack?.baseUrl
  if (typeof baseUrl !== "string" || baseUrl.length === 0)
    return null

  try {
    return new URL(baseUrl, window.location.origin).searchParams.get("vssId")
      ?? new URL(baseUrl, window.location.origin).searchParams.get("vss_id")
  }
  catch {
    return null
  }
}

function matchSelectedTrack(
  captionTracks: Array<{ languageCode: string, kind?: string, vssId: string }>,
  selectedTrack: any,
) {
  const selectedVssId = getSelectedTrackVssId(selectedTrack)
  if (selectedVssId) {
    return captionTracks.find(track => track.vssId === selectedVssId)
  }

  const selectedLanguageCode = selectedTrack?.languageCode
  const selectedKind = selectedTrack?.kind ?? selectedTrack?.trackKind ?? null

  if (typeof selectedLanguageCode !== "string" || selectedLanguageCode.length === 0)
    return undefined

  if (typeof selectedKind === "string" && selectedKind.length > 0) {
    const exactKindMatch = captionTracks.find(track =>
      track.languageCode === selectedLanguageCode && (track.kind ?? null) === selectedKind,
    )
    if (exactKindMatch)
      return exactKindMatch
  }

  const sameLanguageTracks = captionTracks.filter(track => track.languageCode === selectedLanguageCode)
  if (sameLanguageTracks.length === 1)
    return sameLanguageTracks[0]

  return undefined
}
