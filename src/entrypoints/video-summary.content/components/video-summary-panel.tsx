import type { Config } from "@/types/config/config"
import { useEffect, useRef, useState } from "react"
import { sendMessage } from "@/utils/message"
import { fetchTranscript, getVideoTitle, transcriptToText } from "../transcript"

interface Props {
  config: Config
  videoId: string
}

type Status = "idle" | "loading" | "done" | "error" | "no-transcript"
type Tab = "summary" | "chapters" | "highlights" | "script" | "ask"

const LANG_NAMES: Record<string, string> = {
  "cmn": "Simplified Chinese", "cmn-Hant": "Traditional Chinese", "eng": "English",
  "jpn": "Japanese", "kor": "Korean", "spa": "Spanish", "fra": "French", "deu": "German",
  "por": "Portuguese", "rus": "Russian", "arb": "Arabic", "hin": "Hindi", "vie": "Vietnamese",
  "tha": "Thai", "ind": "Indonesian", "ita": "Italian", "tur": "Turkish", "pol": "Polish",
  "nld": "Dutch", "swe": "Swedish", "ukr": "Ukrainian",
}

function getOutputLanguage(config: Config): string {
  const code = config.language.targetCode
  return LANG_NAMES[code] || code
}

const SUMMARY_SCHEMA = {
  type: "object" as const,
  properties: {
    tldr: { type: "string", description: "A thorough 4-6 sentence summary covering main thesis, key arguments and conclusion" },
    keyPoints: { type: "array", items: { type: "string" }, description: "8-12 detailed takeaways with specific details" },
    chapters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
        },
        required: ["title", "summary"],
      },
      description: "Key topic segments in chronological order",
    },
    highlights: { type: "array", items: { type: "string" }, description: "Memorable quotes from the speaker, exact words" },
  },
  required: ["tldr", "keyPoints", "chapters", "highlights"],
}

interface SummaryData {
  tldr: string
  keyPoints: string[]
  chapters: { title: string, summary: string }[]
  highlights: string[]
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

export function VideoSummaryPanel({ config, videoId }: Props) {
  const [data, setData] = useState<SummaryData | null>(null)
  const [status, setStatus] = useState<Status>("idle")
  const [tab, setTab] = useState<Tab>("summary")
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<{ role: string, text: string }[]>([])
  const [input, setInput] = useState("")
  const [transcriptText, setTranscriptText] = useState("")
  const [copied, setCopied] = useState(false)
  const requestedRef = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const genRef = useRef(0)

  const outputLang = getOutputLanguage(config)

  const generate = (force = false) => {
    if (!force && requestedRef.current === videoId)
      return
    requestedRef.current = videoId
    setData(null)
    setStatus("loading")
    if (!force)
      setTab("summary")

    const providerId = config.translate.providerId
    if (!providerId) {
      setStatus("error")
      return
    }

    const gen = ++genRef.current

    async function run() {
      try {
        const segments = await fetchTranscript(videoId)
        if (gen !== genRef.current)
          return
        if (segments.length === 0) {
          setStatus("no-transcript")
          return
        }

        const title = getVideoTitle()
        const transcript = transcriptToText(segments)
        setTranscriptText(transcript)

        let summaryData: SummaryData

        try {
          const resp = await sendMessage("backgroundGenerateObject", {
            providerId,
            schemaName: "VideoSummary",
            schemaDescription: "Structured summary of a YouTube video",
            schema: SUMMARY_SCHEMA,
            system: `You are Skim AI. Summarize YouTube videos into structured JSON. Always respond in ${outputLang}.

Rules:
- tldr: Write a thorough 4-6 sentence summary covering the main thesis, key arguments, and conclusion. Don't be too brief.
- keyPoints: 8-12 detailed bullet points. Each point should be a complete thought with specific details, data, or examples mentioned in the video.
- chapters: 4-8 topic segments in chronological order. Each needs a clear title and a 1-2 sentence summary.
- highlights: 3-6 memorable direct quotes from the speaker. Use their exact words.`,
            prompt: `Title: ${title}\n\nTranscript:\n${transcript}`,
            temperature: 0.3,
          })
          summaryData = resp.object as unknown as SummaryData
        }
        catch {
          // Fallback: use generateText with JSON instruction
          const textResp = await sendMessage("backgroundGenerateText", {
            providerId,
            system: `You are Skim AI. Always respond in ${outputLang}. Return ONLY valid JSON, no markdown, no explanation.`,
            prompt: `Summarize this video as JSON with this exact structure:
{"tldr":"4-6 sentence summary","keyPoints":["point1","point2",...],"chapters":[{"title":"...","summary":"..."},...],"highlights":["quote1","quote2",...]}

Rules: tldr should be 4-6 sentences. keyPoints should have 8-12 items with specific details. chapters should have 4-8 segments. highlights should have 3-6 exact speaker quotes.

Title: ${title}

Transcript:
${transcript}`,
            temperature: 0.3,
          })

          const cleaned = textResp.text.replace(/^[^{]*/, "").replace(/[^}]*$/, "")
          summaryData = JSON.parse(cleaned) as SummaryData
        }

        if (gen !== genRef.current)
          return
        setData(summaryData)
        setStatus("done")
      }
      catch (err) {
        if (gen !== genRef.current)
          return
        console.error("[SkimAI] Summary generation failed:", err)
        setStatus("error")
      }
    }

    void run()
  }

  // eslint-disable-next-line react/exhaustive-deps -- generate is intentionally excluded
  useEffect(() => {
    generate()
  }, [videoId, config])

  const handleRefresh = () => {
    requestedRef.current = null
    setMessages([])
    generate(true)
  }

  const handleAsk = (q: string) => {
    const providerId = config.translate.providerId
    if (!providerId || !q.trim())
      return

    const userMsg = q.trim()
    setMessages(m => [...m, { role: "user", text: userMsg }])
    setInput("")

    const history = [...messages, { role: "user", text: userMsg }]
      .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
      .join("\n\n")

    async function doAsk() {
      try {
        const resp = await sendMessage("backgroundGenerateText", {
          providerId,
          system: `You are Skim AI. Answer questions about this video. Always respond in ${outputLang}.\n\nTranscript (first 8000 chars):\n${transcriptText.slice(0, 8000)}\n\nConversation:\n${history}`,
          prompt: userMsg,
          temperature: 0.3,
        })
        setMessages(m => [...m, { role: "ai", text: resp.text }])
        setTimeout(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight) }, 50)
      }
      catch {
        setMessages(m => [...m, { role: "ai", text: "Sorry, something went wrong." }])
      }
    }
    void doAsk()
  }

  const tabs: { id: Tab, label: string, badge?: number }[] = [
    { id: "summary", label: "TL;DR" },
    { id: "chapters", label: "Chapters", badge: data?.chapters.length },
    { id: "highlights", label: "Highlights", badge: data?.highlights.length },
    { id: "script", label: "Script" },
    { id: "ask", label: "Ask" },
  ]

  return (
    <div className="skim-panel">
      {/* Header */}
      <div className="skim-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span className="skim-wordmark">
            <SkimMark size={20} color="var(--brand)" />
            <span>Skim AI</span>
          </span>
          <span className="skim-context-chip">on youtube</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {status !== "loading" && (
            <button className="skim-btn ghost" style={{ padding: 5 }} onClick={handleRefresh} title="Regenerate">
              <RefreshIcon />
            </button>
          )}
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
        {status === "loading" && (
          <div className="skim-loading">
            <div className="skim-spinner" />
            <span>Skimming transcript...</span>
          </div>
        )}

        {status === "no-transcript" && (
          <div className="skim-empty">No transcript available for this video.</div>
        )}

        {status === "error" && (
          <div className="skim-error">
            <div>Failed to generate summary.</div>
            <button className="skim-btn" style={{ marginTop: 8 }} onClick={handleRefresh}>
              <RefreshIcon />
              {" "}
              Retry
            </button>
          </div>
        )}

        {/* TL;DR */}
        {status === "done" && tab === "summary" && data && (
          <div className="skim-body-pad">
            <div className="skim-label">In one breath</div>
            <div className="skim-summary-text">{renderInline(data.tldr)}</div>

            <div className="skim-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>
                The argument, in
                {data.keyPoints.length}
                {" "}
                beats
              </span>
              <button className="skim-btn ghost" style={{ padding: "2px 6px", fontSize: 11 }} onClick={() => setExpanded(x => !x)}>
                {expanded ? "Less" : "Expand"}
              </button>
            </div>

            {data.keyPoints.map((point, i) => (
              <div key={i} className="skim-bullet">
                <span className="skim-bullet-num">{i + 1}</span>
                <span className="skim-bullet-text">{renderInline(point)}</span>
              </div>
            ))}

            {expanded && data.chapters.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="skim-label">Key moments</div>
                {data.chapters.map((c, i) => (
                  <div key={i} style={{ padding: "6px 0", borderTop: i ? "1px solid var(--line-soft)" : "none", fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>
                    <strong>{c.title}</strong>
                    {c.summary ? ` — ${c.summary}` : ""}
                  </div>
                ))}
              </div>
            )}

            <div className="skim-actions">
              <button className="skim-btn accent">Save as note</button>
              <button className="skim-btn">Copy TL;DR</button>
              <button className="skim-btn ghost" onClick={handleRefresh}>
                <RefreshIcon />
                {" "}
                Regenerate
              </button>
            </div>
          </div>
        )}

        {/* Chapters */}
        {status === "done" && tab === "chapters" && data && (
          <>
            <div style={{ padding: "12px 14px 8px" }}>
              <span className="skim-label" style={{ marginBottom: 0 }}>
                {data.chapters.length}
                {" "}
                sections
              </span>
            </div>
            {data.chapters.map((c, i) => (
              <div key={i} className="skim-chapter">
                <span className="skim-chapter-ts">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="skim-chapter-title">{c.title}</div>
                  {c.summary && <div className="skim-chapter-sub">{c.summary}</div>}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Highlights */}
        {status === "done" && tab === "highlights" && data && (
          <>
            <div style={{ padding: "12px 14px 8px" }}>
              <span className="skim-label">
                {data.highlights.length}
                {" "}
                quotes
              </span>
            </div>
            {data.highlights.map((h, i) => (
              <div key={i} className="skim-highlight">
                <div className="skim-highlight-row">
                  <span className="skim-highlight-mark">"</span>
                  <div className="skim-highlight-quote">{h}</div>
                </div>
                <div className="skim-highlight-meta">
                  <span className="skim-highlight-tag">Quote</span>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Script */}
        {status === "done" && tab === "script" && (
          <div className="skim-body-pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span className="skim-label" style={{ marginBottom: 0 }}>
                Full transcript ·
                {" "}
                {Math.round(transcriptText.length / 4)}
                {" "}
                tokens
              </span>
              <button
                className="skim-btn"
                style={{ fontSize: 11 }}
                onClick={() => {
                  void navigator.clipboard.writeText(transcriptText)
                  setCopied(true)
                  setTimeout(setCopied, 2000, false)
                }}
              >
                {copied ? "✓ Copied" : "Copy all"}
              </button>
            </div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.6,
              color: "var(--ink-soft)", whiteSpace: "pre-wrap", wordBreak: "break-word",
              maxHeight: 400, overflowY: "auto",
              background: "var(--bg-soft)", borderRadius: 8, padding: 12,
              border: "1px solid var(--line)",
            }}
            >
              {transcriptText || "No transcript loaded."}
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
                <div>Ask anything about this video. I have the full transcript and our conversation stays in context.</div>
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
          {["What's the main argument?", "Summarize the key takeaways", "What's the most surprising claim?"].map(q => (
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
              placeholder="Ask about this video..."
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
        <span>
          transcript ·
          {outputLang.toLowerCase()}
        </span>
      </div>
    </div>
  )
}
