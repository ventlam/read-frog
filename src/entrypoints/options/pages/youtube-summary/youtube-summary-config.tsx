import { useState } from "react"

const DEFAULT_PROMPT = `You are an expert video analyst. From talks, interviews and explainers, extract structured information in time order. Follow this exact structure for the transcript I provide:

Core summary
One-line takeaway: capture the most central thesis in one sentence.
Key insights: in 3 bullet points, list the most valuable observations, data, or predictions.

Thread timeline
Break the video into key topic segments, in chronological order. For each segment:
Timestamp: [HH:MM:SS - HH:MM:SS]
Title: a short, sharp segment title.
Skim: the core idea in 1-2 sentences.

Title: "{{Title}}"
Transcript: "{{Transcript}}"`

const VARIABLES = ["{{Title}}", "{{Transcript}}", "{{Channel}}", "{{Duration}}"]

export function YouTubeSummaryConfig() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [saved, setSaved] = useState(true)

  const handleChange = (value: string) => {
    setPrompt(value)
    setSaved(false)
  }

  const insertVariable = (v: string) => {
    setPrompt(p => `${p} ${v}`)
    setSaved(false)
  }

  const tokenCount = Math.round(prompt.length / 4)

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center gap-3">
        <span className="text-sm font-semibold">YouTube prompt</span>
        <span className="text-xs text-muted-foreground">for transcript-based summaries</span>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-lg border bg-muted/20 overflow-hidden">
          <textarea
            value={prompt}
            onChange={e => handleChange(e.target.value)}
            spellCheck={false}
            className="w-full h-56 border-none bg-transparent outline-none resize-y font-mono text-xs leading-relaxed p-3"
          />
          <div className="border-t bg-muted/30 px-3 py-2 flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Variables:
            </span>
            {VARIABLES.map(v => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="font-mono text-[11px] font-medium text-emerald-800 bg-lime-100 border border-lime-300 rounded px-1.5 py-px cursor-pointer hover:bg-lime-200 transition-colors dark:bg-lime-900/40 dark:text-lime-300 dark:border-lime-700"
              >
                {v}
              </button>
            ))}
            <div className="flex-1" />
            <span className="font-mono text-[10px] text-muted-foreground">
              {tokenCount}
              {" "}
              / 2,000 tokens
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSaved(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Save changes
          </button>
          <button
            type="button"
            onClick={() => { setPrompt(DEFAULT_PROMPT); setSaved(false) }}
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            Use default
          </button>
          <div className="flex-1" />
          {!saved && (
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Unsaved
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
