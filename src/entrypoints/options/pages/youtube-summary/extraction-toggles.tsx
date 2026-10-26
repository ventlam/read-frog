import { useState } from "react"

const TOGGLES = [
  { id: "chapters", label: "章节大纲", desc: "自动识别并划分章节。" },
  { id: "timestamps", label: "时间戳跳转", desc: "点击时间戳跳转播放。" },
  { id: "highlights", label: "精彩观点", desc: "提取值得记录的原话。" },
  { id: "translate", label: "翻译成目标语言", desc: "生成摘要后翻译。" },
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
        提取内容
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
