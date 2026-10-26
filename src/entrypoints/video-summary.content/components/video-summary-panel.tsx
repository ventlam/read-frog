import type { TranscriptSegment } from "../transcript"
import type { Config } from "@/types/config/config"
import { useEffect, useRef, useState } from "react"
import { copyText } from "@/utils/clipboard"
import { getLLMProvidersConfig } from "@/utils/config/helpers"
import { sendMessage } from "@/utils/message"
import { getOutputLanguage } from "@/utils/skim-language"
import { estimateDuration, fetchTranscript, getVideoTitle, parseTimestamp, sliceTranscript, transcriptForModel, transcriptToText } from "../transcript"

interface Props {
  config: Config
  videoId: string
  onVisibilityChange: (visible: boolean) => void
}

type Status = "idle" | "loading" | "done" | "error" | "no-transcript"
type Tab = "summary" | "chapters" | "highlights" | "script" | "ask"

interface ChapterSection {
  timestamp: string
  title: string
  summary: string
}

interface ChapterKeyPoint {
  timestamp: string
  text: string
}

interface Chapter {
  timestamp: string
  title: string
  summary: string
  keyPoints?: ChapterKeyPoint[]
  sections?: ChapterSection[]
}

interface SummaryData {
  tldr: string
  takeaways?: string[]
  chapters: Chapter[]
  highlights: string[]
}

function getSummarySchema(durationMin: number) {
  const sectionSchema = {
    type: "object" as const,
    properties: {
      timestamp: { type: "string" as const, description: "Time range like 05:00 - 08:30" },
      title: { type: "string" as const },
      summary: { type: "string" as const },
    },
    required: ["timestamp", "title", "summary"] as const,
  }

  const chapterProps: Record<string, any> = {
    timestamp: { type: "string", description: "Time range like 00:00 - 15:30" },
    title: { type: "string" },
    summary: { type: "string" },
  }
  const chapterRequired = ["timestamp", "title", "summary"]

  if (durationMin > 45) {
    chapterProps.sections = {
      type: "array",
      items: sectionSchema,
      description: "3-5 sub-sections within this act",
    }
    chapterRequired.push("sections")
  }

  const props: Record<string, any> = {
    tldr: { type: "string", description: durationMin > 45
      ? "A 2-3 sentence high-level overview of what this conversation/episode is about"
      : "A thorough 4-6 sentence summary covering main thesis, key arguments and conclusion" },
    chapters: {
      type: "array",
      items: { type: "object", properties: chapterProps, required: chapterRequired },
    },
    highlights: { type: "array", items: { type: "string" }, description: "Memorable direct quotes from the speaker" },
  }
  const required = ["tldr", "chapters", "highlights"]

  if (durationMin > 45) {
    props.takeaways = {
      type: "array",
      items: { type: "string" },
      description: "5-8 key conclusions, insights, or arguments. Each is a complete sentence with specific details.",
    }
    required.push("takeaways")
  }

  return { type: "object" as const, properties: props, required }
}

function getChapterPrompt(durationMin: number, outputLang: string): string {
  const base = `You are Skim AI. Summarize YouTube videos into structured JSON. Always respond in ${outputLang}.`

  if (durationMin <= 15) {
    return `${base}

This is a short video (~${durationMin} min). Extract maximum detail despite the short length.

Rules:
- tldr: Write a thorough 5-8 sentence summary covering the main thesis, key arguments, supporting data/examples, and conclusion. Be specific — include names, numbers, and concrete claims.
- chapters: 4-6 topic segments. Each has a timestamp range (like "00:00 - 02:10"), title, and a 2-3 sentence summary with specific details (names, data points, arguments mentioned).
- highlights: 3-6 memorable direct quotes from the speaker, exact words.`
  }
  if (durationMin <= 45) {
    return `${base}

This is a medium-length video (~${durationMin} min).

Rules:
- tldr: Write a thorough 5-8 sentence summary covering the main thesis, key arguments, supporting evidence, and conclusion. Include specific names, data, and claims.
- chapters: 8-12 topic segments. Each has a timestamp range (like "00:00 - 03:20"), title, and a 2-3 sentence summary with specific details mentioned in the segment.
- highlights: 4-6 memorable direct quotes from the speaker, exact words.`
  }
  return `${base}

This is a long-form video (~${durationMin} min). Use a detailed two-level structure.

Rules:
- tldr: A concise 2-3 sentence overview — who, what, and the core thesis. Keep it scannable.
- takeaways: 5-8 key conclusions, insights, or arguments from the entire conversation. Each should be a complete, specific sentence (include names, numbers, examples when possible). These are the points someone would remember a week later.
- chapters: 3-5 major acts/parts. Each act has:
  - timestamp: full time range (like "00:00 - 18:30")
  - title: thematic title for this act
  - summary: 2-3 sentence overview of this act's content
  - sections: 3-5 sub-sections, each with its own timestamp range, title, and 2-3 sentence summary with specific details (names, data, arguments mentioned)
- highlights: 5-8 memorable direct quotes from the speaker, exact words. Pick the ones with the most insight or personality.`
}

function SkimMark({ size = 18, color = "currentColor" }: { size?: number, color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="6" width="11" height="2" rx="1" fill={color} opacity="0.45" />
      <rect x="3" y="10.5" width="17" height="4" rx="1.5" fill="#A4C73E" />
      <rect x="4" y="18" width="8" height="2" rx="1" fill={color} opacity="0.45" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </svg>
  )
}

function renderInline(text: string) {
  const parts = text.split(/(\[\d+\]|\*\*[^*]+\*\*)/)
  return parts.map((p, i) => {
    const cite = p.match(/^\[(\d+)\]$/)
    if (cite)
      return <span key={i} className="skim-cite">{cite[1]}</span>
    const bold = p.match(/^\*\*(.+)\*\*$/)
    if (bold)
      return <strong key={i}>{bold[1]}</strong>
    return <span key={i}>{p}</span>
  })
}

function findLLMProviderId(config: Config): string | null {
  const llmProviders = getLLMProvidersConfig(config.providersConfig)
  const translateId = config.translate.providerId
  if (llmProviders.some(p => p.id === translateId))
    return translateId
  return llmProviders[0]?.id ?? null
}

function seekVideo(timestamp: string) {
  const sec = parseTimestamp(timestamp)
  const video = document.querySelector("video")
  if (video)
    video.currentTime = sec
}

function formatDuration(min: number): string {
  if (min < 60)
    return `${min} 分钟`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`
}

function parseDurationFromTs(ts: string): string {
  const parts = ts.split("-").map(s => s.trim())
  if (parts.length !== 2)
    return ""
  const toSec = (t: string) => {
    const p = t.split(":").map(Number)
    if (p.length === 3)
      return p[0] * 3600 + p[1] * 60 + p[2]
    return p[0] * 60 + (p[1] || 0)
  }
  const diff = Math.round((toSec(parts[1]) - toSec(parts[0])) / 60)
  return diff > 0 ? `${diff} 分钟` : ""
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.15s", transform: open ? "rotate(90deg)" : "rotate(0)" }}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function ChaptersView({ chapters, durationMin, expandedActs, onToggle }: {
  chapters: Chapter[]
  durationMin: number
  expandedActs: Record<number, boolean>
  onToggle: (i: number) => void
}) {
  const hasActs = durationMin > 45 && chapters.some(c => c.sections && c.sections.length > 0)
  const totalSections = hasActs
    ? chapters.reduce((n, c) => n + (c.sections?.length || 0), 0)
    : chapters.length

  return (
    <>
      <div style={{ padding: "12px 14px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="skim-label" style={{ marginBottom: 0 }}>
          {hasActs
            ? `${chapters.length} 个章节 · ${totalSections} 个段落`
            : `${chapters.length} 个段落`}
        </span>
        {durationMin > 0 && (
          <span className="skim-label" style={{ marginBottom: 0, opacity: 0.6 }}>
            {formatDuration(durationMin)}
          </span>
        )}
      </div>

      {hasActs
        ? chapters.map((act, i) => {
            const isOpen = expandedActs[i] ?? false
            const dur = parseDurationFromTs(act.timestamp)
            return (
              <div key={i}>
                <div
                  className="skim-act-header"
                  onClick={() => onToggle(i)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 14px", cursor: "pointer",
                    borderBottom: "1px solid var(--line-soft)",
                    background: isOpen ? "var(--bg-soft)" : "transparent",
                    transition: "background 0.12s",
                  }}
                >
                  <ChevronIcon open={isOpen} />
                  <span className="skim-chapter-ts" style={{ minWidth: 70, fontSize: 11 }}>{act.timestamp}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{act.title}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4, marginTop: 2 }}>{act.summary}</div>
                  </div>
                  {dur && <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted-soft)", whiteSpace: "nowrap", background: "var(--chip)", padding: "2px 6px", borderRadius: 3 }}>{dur}</span>}
                </div>
                {isOpen && act.sections && act.sections.map((s, j) => (
                  <div key={j} className="skim-chapter" style={{ paddingLeft: 36 }}>
                    <span className="skim-chapter-ts">{s.timestamp}</span>
                    <div>
                      <div className="skim-chapter-title">{s.title}</div>
                      {s.summary && <div className="skim-chapter-sub">{s.summary}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )
          })
        : chapters.map((c, i) => {
            const isOpen = expandedActs[i] ?? false
            const hasDetail = c.keyPoints && c.keyPoints.length > 0
            return (
              <div key={i} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                <div className="skim-chapter" onClick={() => hasDetail && onToggle(i)} style={{ cursor: hasDetail ? "pointer" : "default", borderBottom: "none" }}>
                  <span
                    className="skim-chapter-ts"
                    onClick={(e) => {
                      e.stopPropagation()
                      seekVideo((c.timestamp || "00:00").split("-")[0].trim())
                    }}
                    style={{ cursor: "pointer" }}
                    title="跳转到此段落"
                  >
                    {c.timestamp || String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="skim-chapter-title">
                      {hasDetail && <span style={{ display: "inline-block", marginRight: 4 }}><ChevronIcon open={isOpen} /></span>}
                      {c.title}
                    </div>
                    {c.summary && <div className="skim-chapter-sub">{c.summary}</div>}
                  </div>
                </div>
                {isOpen && c.keyPoints && (
                  <div style={{ padding: "0 14px 10px 68px" }}>
                    {c.keyPoints.map((kp, j) => {
                      const ts = typeof kp === "string" ? null : kp.timestamp
                      const text = typeof kp === "string" ? kp : kp.text
                      return (
                        <div key={j} style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.55, padding: "5px 0", borderTop: j ? "1px solid var(--line-soft)" : "none", display: "flex", gap: 8, alignItems: "baseline" }}>
                          {ts && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation()
                                seekVideo(ts)
                              }}
                              style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#2563eb", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                            >
                              {ts}
                            </span>
                          )}
                          <span>{text}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
    </>
  )
}

export function VideoSummaryPanel({ config, videoId, onVisibilityChange }: Props) {
  const [data, setData] = useState<SummaryData | null>(null)
  const [status, setStatus] = useState<Status>("idle")
  const [tab, setTab] = useState<Tab>("summary")
  const [messages, setMessages] = useState<{ role: string, text: string }[]>([])
  const [input, setInput] = useState("")
  const [transcriptText, setTranscriptText] = useState("")
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [closed, setClosed] = useState(false)
  const [durationMin, setDurationMin] = useState(0)
  const [expandedActs, setExpandedActs] = useState<Record<number, boolean>>({})
  const requestedRef = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const genRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const outputLang = getOutputLanguage(config)

  const generate = (force = false) => {
    if (!force && requestedRef.current === videoId)
      return
    requestedRef.current = videoId
    setErrorMessage("")
    setData(null)
    setStatus("loading")
    if (!force)
      setTab("summary")

    const providerId = findLLMProviderId(config)
    const gen = ++genRef.current
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    async function run() {
      try {
        const segments = await fetchTranscript(videoId, controller.signal)
        if (gen !== genRef.current)
          return
        if (segments.length === 0) {
          setStatus("no-transcript")
          return
        }

        const title = getVideoTitle()
        const fullTranscript = transcriptToText(segments)
        if (!fullTranscript) {
          setStatus("no-transcript")
          return
        }
        setTranscriptText(fullTranscript)
        const transcript = transcriptForModel(fullTranscript)

        const dur = estimateDuration(segments)
        setDurationMin(dur)

        if (!providerId)
          throw new Error("请先在 Skim AI 设置中配置 AI 服务。你仍可查看和复制字幕全文。")

        const summaryData = dur > 15
          ? await twoPassGenerate(providerId, title, transcript, segments, dur, gen)
          : await singlePassGenerate(providerId, title, transcript, dur)

        if (gen !== genRef.current)
          return
        setData(summaryData)
        setStatus("done")
      }
      catch (err) {
        if (gen !== genRef.current)
          return
        console.error("[SkimAI] Summary generation failed:", err)
        setErrorMessage(err instanceof Error ? err.message : "生成摘要失败，请重试。")
        setStatus("error")
      }
    }

    async function singlePassGenerate(providerId: string, title: string, transcript: string, dur: number): Promise<SummaryData> {
      const schema = getSummarySchema(dur)
      const system = getChapterPrompt(dur, outputLang)
      try {
        const resp = await sendMessage("backgroundGenerateObject", {
          providerId, schemaName: "VideoSummary", schemaDescription: "Structured summary of a YouTube video",
          schema, system,
          prompt: `Title: ${title}\n\nTranscript:\n${transcript}\n\nIMPORTANT: You MUST write ALL output in ${outputLang}.`,
          temperature: 0.3,
        })
        return resp.object as unknown as SummaryData
      }
      catch {
        if (gen !== genRef.current)
          throw new Error("cancelled")
        const textResp = await sendMessage("backgroundGenerateText", {
          providerId,
          system: `You are Skim AI. Always respond in ${outputLang}. Return ONLY valid JSON.`,
          prompt: `${system}\n\nTitle: ${title}\nTranscript:\n${transcript}\n\nReturn JSON: {"tldr":"...","chapters":[{"timestamp":"00:00 - 03:20","title":"...","summary":"..."}],"highlights":["..."]}\nIMPORTANT: ALL output in ${outputLang}.`,
          temperature: 0.3,
        })
        return JSON.parse(textResp.text.replace(/^[^{]*/, "").replace(/[^}]*$/, ""))
      }
    }

    async function twoPassGenerate(providerId: string, title: string, transcript: string, rawSegments: TranscriptSegment[], dur: number, gen: number): Promise<SummaryData> {
      // === Pass 1: Structure discovery ===
      const pass1Schema = {
        type: "object" as const,
        properties: {
          tldr: { type: "string", description: "2-3 sentence overview" },
          segments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                start: { type: "string", description: "Start time like 00:00 or 01:15:00" },
                end: { type: "string", description: "End time" },
                title: { type: "string", description: "Short topic title" },
              },
              required: ["start", "end", "title"],
            },
          },
          highlights: { type: "array", items: { type: "string" }, description: "5-8 memorable direct quotes, exact words" },
        },
        required: ["tldr", "segments", "highlights"],
      }

      let pass1: { tldr: string, segments: { start: string, end: string, title: string }[], highlights: string[] }

      try {
        const resp = await sendMessage("backgroundGenerateObject", {
          providerId, schemaName: "VideoStructure", schemaDescription: "Topic structure of a video",
          schema: pass1Schema,
          system: `You are Skim AI. Identify the topic structure of this ${dur}-minute video. Respond in ${outputLang}.

Rules:
- tldr: 2-3 sentence overview of the entire video.
- segments: Break the video into 8-20 topic segments (more for longer videos, ~5 min each). Each segment needs a precise start/end timestamp and a descriptive title. Cover the ENTIRE video from start to finish.
- highlights: 5-8 memorable direct quotes from the speaker, exact words.

IMPORTANT: Segments must cover the full duration (0:00 to the end). Do not skip any portion.`,
          prompt: `Title: ${title}\n\nFull transcript (~${dur} min):\n${transcript}\n\nIMPORTANT: ALL output in ${outputLang}. Segments MUST cover the full ${dur} minutes.`,
          temperature: 0.2,
        })
        pass1 = resp.object as any
      }
      catch {
        if (gen !== genRef.current)
          throw new Error("cancelled")
        const textResp = await sendMessage("backgroundGenerateText", {
          providerId,
          system: `You are Skim AI. Respond in ${outputLang}. Return ONLY valid JSON.`,
          prompt: `Identify topic structure of this ${dur}-min video. Return JSON:
{"tldr":"2-3 sentences","segments":[{"start":"00:00","end":"07:30","title":"topic"},...],"highlights":["quote1",...]}

Cover the ENTIRE ${dur} minutes with 8-20 segments (~5 min each). ALL output in ${outputLang}.

Title: ${title}
Transcript:\n${transcript}`,
          temperature: 0.2,
        })
        pass1 = JSON.parse(textResp.text.replace(/^[^{]*/, "").replace(/[^}]*$/, ""))
      }

      if (gen !== genRef.current)
        throw new Error("cancelled")

      // === Pass 2: Parallel deep summarization ===
      const pass2Results = await Promise.all(
        pass1.segments.map(async (seg) => {
          const startSec = parseTimestamp(seg.start)
          const endSec = parseTimestamp(seg.end)
          const segText = sliceTranscript(rawSegments, startSec, endSec)
          if (!segText)
            return { summary: "", keyPoints: [] as string[] }

          const pass2Schema = {
            type: "object" as const,
            properties: {
              summary: { type: "string", description: "1-2 sentence gist of this segment" },
              keyPoints: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    timestamp: { type: "string", description: "Approximate time like 02:30 or 1:15:00" },
                    text: { type: "string", description: "Detailed point with specific names, data, arguments" },
                  },
                  required: ["timestamp", "text"],
                },
                description: "3-6 detailed points, each with a timestamp and specific content",
              },
            },
            required: ["summary", "keyPoints"],
          }

          try {
            const resp = await sendMessage("backgroundGenerateObject", {
              providerId, schemaName: "SegmentAnalysis", schemaDescription: "Deep analysis of a video segment",
              schema: pass2Schema,
              system: `You are Skim AI. Analyze this video segment in detail. Respond in ${outputLang}.

Rules:
- summary: 1-2 sentence gist only. Be concise.
- keyPoints: 3-6 detailed findings. Each MUST have a timestamp (approximate time within the segment) and a detailed text with specific names, numbers, examples, or arguments mentioned. Each point should be 1-2 sentences with real content, not generic.`,
              prompt: `Video: ${title}\nSegment: "${seg.title}" (${seg.start} - ${seg.end})\n\nTranscript:\n${segText}\n\nIMPORTANT: ALL output in ${outputLang}.`,
              temperature: 0.3,
            })
            return resp.object as { summary: string, keyPoints: { timestamp: string, text: string }[] }
          }
          catch {
            if (gen !== genRef.current)
              throw new Error("cancelled")
            try {
              const textResp = await sendMessage("backgroundGenerateText", {
                providerId,
                system: `You are Skim AI. Respond in ${outputLang}. Return ONLY valid JSON.`,
                prompt: `Analyze segment "${seg.title}" (${seg.start}-${seg.end}):\n${segText}\n\nReturn: {"summary":"1-2 sentences","keyPoints":[{"timestamp":"02:30","text":"detailed point"},...]}\n3-6 points, each with timestamp. ALL in ${outputLang}.`,
                temperature: 0.3,
              })
              return JSON.parse(textResp.text.replace(/^[^{]*/, "").replace(/[^}]*$/, ""))
            }
            catch {
              return { summary: "", keyPoints: [] as string[] }
            }
          }
        }),
      )

      // === Merge results ===
      const chapters: Chapter[] = pass1.segments.map((seg, i) => ({
        timestamp: `${seg.start} - ${seg.end}`,
        title: seg.title,
        summary: pass2Results[i]?.summary || "",
        keyPoints: pass2Results[i]?.keyPoints || [],
      }))

      const takeaways = chapters
        .flatMap(c => (c.keyPoints || []).map(kp => typeof kp === "string" ? kp : kp.text))
        .filter(Boolean)
        .slice(0, 10)

      return {
        tldr: pass1.tldr,
        takeaways,
        chapters,
        highlights: pass1.highlights || [],
      }
    }

    void run()
  }

  useEffect(() => {
    generate()
    return () => {
      genRef.current++
      requestedRef.current = null
      abortRef.current?.abort()
    }
  }, [videoId, config])

  useEffect(() => {
    onVisibilityChange(!closed && status !== "no-transcript" && (transcriptText.length > 0 || status === "error"))
  }, [closed, status, transcriptText, onVisibilityChange])

  useEffect(() => () => {
    if (copyTimerRef.current)
      clearTimeout(copyTimerRef.current)
  }, [])

  const handleRefresh = () => {
    requestedRef.current = null
    setMessages([])
    generate(true)
  }

  const handleClose = () => {
    genRef.current++
    abortRef.current?.abort()
    setClosed(true)
  }

  const handleCopy = async (text: string) => {
    setCopied(false)
    setCopyError("")
    try {
      await copyText(text)
      setCopied(true)
      if (copyTimerRef.current)
        clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(setCopied, 2000, false)
    }
    catch {
      setCopyError("复制失败，请重试或点击“下载全文”保存字幕。")
    }
  }

  const downloadTranscript = () => {
    const url = URL.createObjectURL(new Blob([transcriptText], { type: "text/plain;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = `SkimAI-${videoId}.txt`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const handleAsk = (q: string) => {
    const providerId = findLLMProviderId(config)
    if (!providerId || !q.trim())
      return

    const userMsg = q.trim()
    setMessages(m => [...m, { role: "user", text: userMsg }])
    setInput("")

    const history = [...messages, { role: "user", text: userMsg }]
      .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
      .join("\n\n")

    async function doAsk(providerId: string) {
      try {
        const resp = await sendMessage("backgroundGenerateText", {
          providerId,
          system: `You are Skim AI. Answer questions about this video. Always respond in ${outputLang}.\n\nTranscript:\n${transcriptForModel(transcriptText)}\n\nConversation:\n${history}`,
          prompt: userMsg,
          temperature: 0.3,
        })
        setMessages(m => [...m, { role: "ai", text: resp.text }])
        setTimeout(() => {
          scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
        }, 50)
      }
      catch {
        setMessages(m => [...m, { role: "ai", text: "回答失败，请重试。" }])
      }
    }
    void doAsk(providerId)
  }

  const tabs: { id: Tab, label: string, badge?: number }[] = [
    { id: "summary", label: "概要" },
    { id: "chapters", label: "章节", badge: data?.chapters.length },
    { id: "highlights", label: "精彩观点", badge: data?.highlights.length },
    { id: "script", label: "字幕全文" },
    { id: "ask", label: "提问" },
  ]

  if (closed || status === "no-transcript")
    return null

  return (
    <div className="skim-panel">
      {/* Header */}
      <div className="skim-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span className="skim-wordmark">
            <SkimMark size={20} color="var(--brand)" />
            <span>Skim AI</span>
          </span>
          <span className="skim-context-chip">YouTube 视频</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {status !== "loading" && (
            <button className="skim-btn ghost" style={{ padding: 5 }} onClick={handleRefresh} title="重新生成">
              <RefreshIcon />
            </button>
          )}
          <button className="skim-btn ghost" style={{ padding: 5 }} onClick={handleClose} title="关闭面板，切换视频后重新显示" aria-label="关闭 Skim AI 面板">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="skim-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`skim-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <span>{t.label}</span>
            {t.badge != null && t.badge > 0 && <span className="skim-tab-badge">{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="skim-body" ref={scrollRef}>
        {copyError && <div className="skim-error" role="alert">{copyError}</div>}
        {status === "loading" && tab !== "script" && (
          <div className="skim-loading">
            <div className="skim-spinner" />
            <span>正在生成视频摘要…</span>
          </div>
        )}

        {status === "error" && tab !== "script" && (
          <div className="skim-error">
            <div>{errorMessage || "生成摘要失败，请重试。"}</div>
            <button className="skim-btn" style={{ marginTop: 8 }} onClick={handleRefresh}>
              <RefreshIcon />
              {" "}
              重试
            </button>
          </div>
        )}

        {/* TL;DR */}
        {status === "done" && tab === "summary" && data && (
          <div className="skim-body-pad">
            <div className="skim-label">
              视频概要
              {durationMin > 0 && <span style={{ opacity: 0.6, marginLeft: 8 }}>{formatDuration(durationMin)}</span>}
            </div>
            <div className="skim-summary-text">{renderInline(data.tldr)}</div>

            {data.takeaways && data.takeaways.length > 0 && (
              <>
                <div className="skim-label" style={{ marginTop: 16 }}>核心要点</div>
                {data.takeaways.map((t, i) => (
                  <div key={i} className="skim-bullet">
                    <span className="skim-bullet-num">{i + 1}</span>
                    <span className="skim-bullet-text">{renderInline(t)}</span>
                  </div>
                ))}
              </>
            )}

            <div className="skim-actions">
              <button className="skim-btn accent" onClick={() => setTab("chapters")}>
                {data.chapters.length}
                {" "}
                个章节 →
              </button>
              <button
                className="skim-btn"
                onClick={() => {
                  const full = data.takeaways?.length
                    ? `${data.tldr}\n\n${data.takeaways.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
                    : data.tldr
                  void handleCopy(full)
                }}
              >
                {copied ? "✓ 已复制" : "复制概要"}
              </button>
              <button className="skim-btn ghost" onClick={handleRefresh}>
                <RefreshIcon />
                {" "}
                重新生成
              </button>
            </div>
          </div>
        )}

        {/* Chapters */}
        {status === "done" && tab === "chapters" && data && (
          <ChaptersView chapters={data.chapters} durationMin={durationMin} onToggle={i => setExpandedActs(s => ({ ...s, [i]: !s[i] }))} expandedActs={expandedActs} />
        )}

        {/* Highlights */}
        {status === "done" && tab === "highlights" && data && (
          <>
            <div style={{ padding: "12px 14px 8px" }}>
              <span className="skim-label">
                {data.highlights.length}
                {" "}
                条精彩观点
              </span>
            </div>
            {data.highlights.map((h, i) => (
              <div key={i} className="skim-highlight">
                <div className="skim-highlight-row">
                  <span className="skim-highlight-mark">"</span>
                  <div className="skim-highlight-quote">{h}</div>
                </div>
                <div className="skim-highlight-meta">
                  <span className="skim-highlight-tag">原话</span>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Script */}
        {transcriptText && tab === "script" && (
          <div className="skim-body-pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <span className="skim-label" style={{ marginBottom: 0 }}>
                字幕全文 ·
                {" "}
                {transcriptText.length.toLocaleString("zh-CN")}
                {" "}
                字符
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="skim-btn" style={{ fontSize: 11 }} onClick={downloadTranscript}>下载全文</button>
                <button
                  className="skim-btn"
                  style={{ fontSize: 11 }}
                  onClick={() => { void handleCopy(transcriptText) }}
                >
                  {copied ? "✓ 已复制" : "复制全文"}
                </button>
              </div>
            </div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.6,
              color: "var(--ink-soft)", whiteSpace: "pre-wrap", wordBreak: "break-word",
              maxHeight: 400, overflowY: "auto",
              background: "var(--bg-soft)", borderRadius: 8, padding: 12,
              border: "1px solid var(--line)",
            }}
            >
              {transcriptText || "正在加载字幕…"}
            </div>
          </div>
        )}

        {/* Ask */}
        {status === "done" && tab === "ask" && (
          <div style={{ padding: "14px 14px 6px" }}>
            {messages.length === 0 && (
              <div className="skim-msg ai">
                <div className="skim-msg-label">
                  <SkimMark size={11} color="var(--brand)" />
                  {" "}
                  Skim AI
                </div>
                <div>可以询问视频内容，Skim AI 会结合字幕和对话记录回答。</div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`skim-msg ${m.role}`}>
                {m.role === "ai" && (
                  <div className="skim-msg-label">
                    <SkimMark size={11} color="var(--brand)" />
                    {" "}
                    Skim AI
                  </div>
                )}
                <div>{renderInline(m.text)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Canned questions */}
      {status === "done" && tab === "ask" && messages.length === 0 && (
        <div className="skim-canned">
          {["视频的核心观点是什么？", "总结视频的关键结论", "视频中最出人意料的观点是什么？"].map(q => (
            <button key={q} className="skim-canned-btn" onClick={() => handleAsk(q)}>{q}</button>
          ))}
        </div>
      )}

      {/* Composer */}
      {status === "done" && tab === "ask" && (
        <div className="skim-composer">
          <div className="skim-composer-inner">
            <input
              className="skim-composer-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  handleAsk(input)
              }}
              placeholder="询问视频内容…"
            />
            <button className="skim-composer-send" onClick={() => handleAsk(input)} disabled={!input.trim()}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="skim-foot">
        <SkimMark size={11} color="var(--muted-soft)" />
        <span>by vent</span>
      </div>
    </div>
  )
}
