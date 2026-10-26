import type { ReactNode } from "react"
import type { SearchResult } from "../search-engines"
import type { Config } from "@/types/config/config"
import { useEffect, useRef, useState } from "react"
import { getLLMProvidersConfig } from "@/utils/config/helpers"
import { sendMessage } from "@/utils/message"
import { getOutputLanguage } from "@/utils/skim-language"

function findLLMProviderId(config: Config): string | null {
  const llmProviders = getLLMProvidersConfig(config.providersConfig)
  const translateId = config.translate.providerId
  if (llmProviders.some(p => p.id === translateId))
    return translateId
  return llmProviders[0]?.id ?? null
}

interface SummaryPanelProps {
  query: string
  results: SearchResult[]
  config: Config
}

type Status = "idle" | "loading" | "done" | "error"
type Tab = "answer" | "sources" | "ask"

interface SearchAnswer {
  summary: string
  findings: { point: string, sources: number[] }[]
}

const SEARCH_SCHEMA = {
  type: "object" as const,
  properties: {
    summary: { type: "string", description: "2-3 sentence overview answering the query" },
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          point: { type: "string", description: "A key finding, 1-2 sentences" },
          sources: { type: "array", items: { type: "number" }, description: "Source numbers like [1, 3]" },
        },
        required: ["point", "sources"],
      },
      description: "3-6 key findings with source citations",
    },
  },
  required: ["summary", "findings"],
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

function parseCitations(text: string, renderCitation: (sourceNumber: number, key: string | number) => ReactNode) {
  const parts = text.split(/(\[\d+\])/)
  return parts.map((p, i) => {
    const m = p.match(/^\[(\d+)\]$/)
    if (m)
      return renderCitation(Number(m[1]), i)
    return <span key={i}>{p}</span>
  })
}

export function SummaryPanel({ query, results, config }: SummaryPanelProps) {
  const [answer, setAnswer] = useState<SearchAnswer | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [tab, setTab] = useState<Tab>("answer")
  const [messages, setMessages] = useState<{ role: string, text: string }[]>([])
  const [input, setInput] = useState("")
  const requestedRef = useRef(false)
  const outputLang = getOutputLanguage(config)

  useEffect(() => {
    if (requestedRef.current || !query || results.length === 0)
      return
    requestedRef.current = true

    const providerId = findLLMProviderId(config)
    if (!providerId) {
      setStatus("error")
      setErrorMsg("请先在 Skim AI 设置中配置 AI 服务。")
      return
    }

    setStatus("loading")

    const context = results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}`)
      .join("\n\n")

    async function run(providerId: string) {
      try {
        const resp = await sendMessage("backgroundGenerateObject", {
          providerId,
          schemaName: "SearchSummary",
          schemaDescription: "Structured summary of search results",
          schema: SEARCH_SCHEMA,
          system: `You are Skim AI. Synthesize search results into a structured answer. Respond in ${outputLang}.`,
          prompt: `Query: "${query}"\n\nSearch Results:\n${context}\n\nIMPORTANT: Respond in ${outputLang}.`,
          temperature: 0.3,
        })
        setAnswer(resp.object as unknown as SearchAnswer)
        setStatus("done")
      }
      catch {
        try {
          const textResp = await sendMessage("backgroundGenerateText", {
            providerId,
            system: `You are Skim AI. Return ONLY valid JSON. Respond in ${outputLang}.`,
            prompt: `Synthesize these search results for "${query}" as JSON:\n{"summary":"2-3 sentences","findings":[{"point":"finding","sources":[1,2]}]}\n\nResults:\n${context}`,
            temperature: 0.3,
          })
          const parsed = JSON.parse(textResp.text.replace(/^[^{]*/, "").replace(/[^}]*$/, ""))
          setAnswer(parsed)
          setStatus("done")
        }
        catch (err) {
          setErrorMsg(err instanceof Error ? err.message : "生成摘要失败，请重试。")
          setStatus("error")
        }
      }
    }

    void run(providerId)
  }, [query, results, config, outputLang])

  const handleAsk = (q: string) => {
    const providerId = findLLMProviderId(config)
    if (!providerId || !q.trim())
      return

    const userMsg = q.trim()
    setMessages(m => [...m, { role: "user", text: userMsg }])
    setInput("")

    async function run(providerId: string) {
      try {
        const context = results
          .map((r, i) => `[${i + 1}] ${r.title}: ${r.snippet}`)
          .join("\n")

        const response = await sendMessage("backgroundGenerateText", {
          providerId,
          system: `You are Skim AI, an AI search assistant. Answer based on these search results:\n${context}\n\nUse [1], [2] etc to cite sources. Always respond in ${outputLang}.`,
          prompt: userMsg,
          temperature: 0.3,
        })
        setMessages(m => [...m, { role: "ai", text: response.text }])
      }
      catch {
        setMessages(m => [...m, { role: "ai", text: "回答失败，请重试。" }])
      }
    }

    void run(providerId)
  }

  const tabs: { id: Tab, label: string }[] = [
    { id: "answer", label: "回答" },
    { id: "sources", label: "来源" },
    { id: "ask", label: "提问" },
  ]

  const renderCitation = (sourceNumber: number, key: string | number, extraClassName = "") => {
    const result = results[sourceNumber - 1]
    const className = extraClassName ? `skim-cite ${extraClassName}` : "skim-cite"
    if (result?.url) {
      return (
        <a key={key} className={className} href={result.url} title={result.title}>
          {sourceNumber}
        </a>
      )
    }
    return <span key={key} className={className}>{sourceNumber}</span>
  }

  return (
    <div className="skim-panel">
      {/* Header */}
      <div className="skim-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="skim-wordmark">
            <SkimMark size={19} color="var(--brand)" />
            <span>Skim AI</span>
          </span>
          <span className="skim-context-chip">搜索摘要</span>
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
            <span>正在整理搜索结果…</span>
          </div>
        )}

        {status === "error" && (
          <div className="skim-error">{errorMsg}</div>
        )}

        {status === "done" && tab === "answer" && answer && (
          <>
            <div className="skim-label">搜索概要</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink)", marginBottom: 14 }}>
              {parseCitations(answer.summary, renderCitation)}
            </div>

            {answer.findings.length > 0 && (
              <>
                <div className="skim-label">主要发现</div>
                {answer.findings.map((f, i) => (
                  <div key={i} className="skim-pick">
                    <div className="skim-pick-desc">
                      {parseCitations(f.point, renderCitation)}
                      {f.sources.map(s => (
                        renderCitation(s, `finding-${i}-${s}`, "offset")
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            <div className="skim-actions">
              <button
                className="skim-btn"
                onClick={() => {
                  const text = `${answer.summary}\n\n${answer.findings.map(f => `- ${f.point} [${f.sources.join(",")}]`).join("\n")}`
                  void navigator.clipboard.writeText(text)
                }}
              >
                复制
              </button>
              <button
                className="skim-btn ghost"
                onClick={() => {
                  requestedRef.current = false
                  setAnswer(null)
                  setStatus("idle")
                }}
              >
                重新生成
              </button>
            </div>
          </>
        )}

        {status === "done" && tab === "sources" && (
          <>
            <div className="skim-label">
              {results.length}
              {" "}
              个来源
            </div>
            {results.map((r, i) => {
              const content = (
                <>
                  <span className="skim-cite source-index">{i + 1}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="skim-source-title">{r.title}</div>
                    <div className="skim-source-site">
                      {r.snippet.slice(0, 80)}
                      ...
                    </div>
                  </div>
                </>
              )

              if (r.url) {
                return (
                  <a key={i} className="skim-source" href={r.url} title={r.title}>
                    {content}
                  </a>
                )
              }

              return <div key={i} className="skim-source">{content}</div>
            })}
          </>
        )}

        {status === "done" && tab === "ask" && (
          <>
            {messages.length === 0
              ? (
                  <>
                    <div className="skim-ask-empty">可以继续提问</div>
                    {[
                      `这些搜索结果有哪些主要差异？`,
                      `关于“${query}”，哪个来源最可靠？`,
                      `总结各方的共同观点`,
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
                      <div>{parseCitations(m.text, renderCitation)}</div>
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
              placeholder="继续询问搜索内容…"
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
          个来源
        </span>
      </div>
    </div>
  )
}
