import type { SearchResult } from "../search-engines"
import type { Config } from "@/types/config/config"
import { useEffect, useRef, useState } from "react"
import { sendMessage } from "@/utils/message"

interface SummaryPanelProps {
  query: string
  results: SearchResult[]
  config: Config
}

type Status = "idle" | "loading" | "done" | "error"
type Tab = "answer" | "sources" | "ask"

function SkimMark({ size = 18, color = "currentColor" }: { size?: number, color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="6" width="11" height="2" rx="1" fill={color} opacity="0.45" />
      <rect x="3" y="10.5" width="17" height="4" rx="1.5" fill="#A4C73E" />
      <rect x="4" y="18" width="8" height="2" rx="1" fill={color} opacity="0.45" />
    </svg>
  )
}

function parseCitations(text: string) {
  const parts = text.split(/(\[\d+\])/)
  return parts.map((p, i) => {
    const m = p.match(/^\[(\d+)\]$/)
    if (m)
      return <span key={i} className="skim-cite">{m[1]}</span>
    return <span key={i}>{p}</span>
  })
}

export function SummaryPanel({ query, results, config }: SummaryPanelProps) {
  const [summary, setSummary] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [tab, setTab] = useState<Tab>("answer")
  const [messages, setMessages] = useState<{ role: string, text: string }[]>([])
  const [input, setInput] = useState("")
  const requestedRef = useRef(false)

  useEffect(() => {
    if (requestedRef.current || !query || results.length === 0)
      return
    requestedRef.current = true

    const providerId = config.translate.providerId
    if (!providerId) {
      setStatus("error")
      setSummary("No AI provider configured. Set up a provider in Skim AI settings.")
      return
    }

    setStatus("loading")

    const context = results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}`)
      .join("\n\n")

    const prompt = `Based on the following search results for the query "${query}", provide a comprehensive summary. Use citation references like [1], [2] to cite sources.

Search Results:
${context}

Format your response as:
1. A concise "in one breath" summary (2-3 sentences)
2. Then list key findings with citations

Respond in the same language as the search query. Be concise but thorough.

Output language: match the search query language.`

    async function run() {
      try {
        const response = await sendMessage("backgroundGenerateText", {
          providerId,
          prompt,
          temperature: 0.3,
        })
        setSummary(response.text)
        setStatus("done")
      }
      catch (err) {
        setSummary(err instanceof Error ? err.message : "Failed to generate summary")
        setStatus("error")
      }
    }

    void run()
  }, [query, results, config])

  const handleAsk = (q: string) => {
    const providerId = config.translate.providerId
    if (!providerId || !q.trim())
      return

    const userMsg = q.trim()
    setMessages(m => [...m, { role: "user", text: userMsg }])
    setInput("")

    async function run() {
      try {
        const context = results
          .map((r, i) => `[${i + 1}] ${r.title}: ${r.snippet}`)
          .join("\n")

        const response = await sendMessage("backgroundGenerateText", {
          providerId,
          system: `You are Skim AI, an AI search assistant. Answer based on these search results:\n${context}\n\nUse [1], [2] etc to cite sources.`,
          prompt: userMsg,
          temperature: 0.3,
        })
        setMessages(m => [...m, { role: "ai", text: response.text }])
      }
      catch {
        setMessages(m => [...m, { role: "ai", text: "Sorry, I couldn't process that question." }])
      }
    }

    void run()
  }

  const tabs: { id: Tab, label: string }[] = [
    { id: "answer", label: "Answer" },
    { id: "sources", label: "Sources" },
    { id: "ask", label: "Ask" },
  ]

  return (
    <div className="skim-panel">
      {/* Header */}
      <div className="skim-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="skim-wordmark">
            <SkimMark size={19} color="var(--brand)" />
            <span>Skim AI</span>
          </span>
          <span className="skim-context-chip">rail</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="skim-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`skim-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="skim-body">
        {status === "loading" && (
          <div className="skim-loading">
            <div className="skim-spinner" />
            <span>Skimming search results...</span>
          </div>
        )}

        {status === "error" && (
          <div className="skim-error">{summary}</div>
        )}

        {status === "done" && tab === "answer" && (
          <>
            <div className="skim-label">In one breath</div>
            <div className="skim-summary-text">{parseCitations(summary)}</div>
            <div className="skim-actions">
              <button className="skim-btn accent">Save</button>
              <button className="skim-btn">Copy</button>
              <button
                className="skim-btn ghost"
                onClick={() => {
                  requestedRef.current = false
                  setStatus("idle")
                }}
              >
                Redo
              </button>
            </div>
          </>
        )}

        {status === "done" && tab === "sources" && (
          <>
            <div className="skim-label">
              {results.length}
              {" "}
              sources used
            </div>
            {results.map((r, i) => (
              <div key={i} className="skim-source">
                <span className="skim-cite" style={{ flexShrink: 0 }}>{i + 1}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="skim-source-title">{r.title}</div>
                  <div className="skim-source-site">
                    {r.snippet.slice(0, 80)}
                    ...
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {status === "done" && tab === "ask" && (
          <>
            {messages.length === 0
              ? (
                  <>
                    <div className="skim-ask-empty">Follow-ups Skim AI suggests</div>
                    {[
                      `What are the key differences between these results?`,
                      `Which source is most reliable for "${query}"?`,
                      `Summarize the consensus view`,
                    ].map(q => (
                      <button key={q} className="skim-followup" onClick={() => handleAsk(q)}>
                        {q}
                      </button>
                    ))}
                  </>
                )
              : (
                  messages.map((m, i) => (
                    <div key={i} className={`skim-msg ${m.role}`}>
                      {m.role === "ai" && (
                        <div className="skim-msg-label">
                          <SkimMark size={10} color="var(--brand)" />
                          {" "}
                          Skim AI
                        </div>
                      )}
                      <div>{parseCitations(m.text)}</div>
                    </div>
                  ))
                )}
          </>
        )}
      </div>

      {/* Composer for Ask tab */}
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
              placeholder="Follow up about this search..."
            />
            <button
              className="skim-composer-send"
              onClick={() => handleAsk(input)}
              disabled={!input.trim()}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="skim-foot">
        <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="var(--muted-soft)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M5.5 18.5l2.8-2.8M15.7 8.3l2.8-2.8" />
        </svg>
        <span>
          {results.length}
          {" "}
          sources
        </span>
      </div>
    </div>
  )
}
