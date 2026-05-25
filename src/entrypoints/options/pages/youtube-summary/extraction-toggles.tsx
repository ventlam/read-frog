import { useState } from "react"

const TOGGLES = [
  { id: "chapters", label: "Chapter outline", desc: "Auto-detect and segment." },
  { id: "timestamps", label: "Timestamp jump", desc: "Click to seek the player." },
  { id: "highlights", label: "Quote highlights", desc: "Pull memorable lines." },
  { id: "translate", label: "Translate to your lang", desc: "Run after summarizing." },
] as const

export function ExtractionToggles() {
  const [state, setState] = useState<Record<string, boolean>>({
    chapters: true,
    timestamps: true,
    highlights: true,
    translate: false,
  })

  const toggle = (id: string) => setState(s => ({ ...s, [id]: !s[id] }))

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">
        Extraction
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {TOGGLES.map(t => (
          <label
            key={t.id}
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              state[t.id]
                ? "bg-lime-50 border-lime-200 dark:bg-lime-950/30 dark:border-lime-800"
                : "bg-muted/30 border-border"
            }`}
          >
            <button
              type="button"
              role="switch"
              aria-checked={state[t.id]}
              onClick={() => toggle(t.id)}
              className={`relative mt-0.5 h-[18px] w-[32px] shrink-0 rounded-full transition-colors ${
                state[t.id] ? "bg-emerald-800" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-[left] ${
                  state[t.id] ? "left-[16px]" : "left-[2px]"
                }`}
              />
            </button>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{t.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
