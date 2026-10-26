import type { Config } from "@/types/config/config"
import { useEffect, useState } from "react"
import { VideoSummaryPanel } from "./components/video-summary-panel"
import { getVideoId } from "./transcript"

interface AppProps {
  config: Config
  onVisibilityChange: (visible: boolean) => void
}

export default function App({ config, onVisibilityChange }: AppProps) {
  const [videoId, setVideoId] = useState<string | null>(getVideoId)

  useEffect(() => {
    const onNavigate = () => {
      const newId = getVideoId()
      if (newId && newId !== videoId) {
        setVideoId(newId)
      }
    }

    window.addEventListener("yt-navigate-finish", onNavigate)
    return () => window.removeEventListener("yt-navigate-finish", onNavigate)
  }, [videoId])

  if (!videoId)
    return null

  return <VideoSummaryPanel key={videoId} config={config} videoId={videoId} onVisibilityChange={onVisibilityChange} />
}
