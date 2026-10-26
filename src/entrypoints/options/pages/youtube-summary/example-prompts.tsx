const EXAMPLES = [
  {
    label: "带引用的研究回答",
    body: `Using the provided web search results, write a comprehensive reply to the given query.
Cite results using [[number](URL)] notation after the reference.
If the query is a company name, use only contents of [1].
Keep answers short and easy to understand.
Finally, give all references as:
- [number] : [TITLE](URL)

Use markdown for clear, easy-to-read formatting.`,
  },
  {
    label: "三点概要",
    body: "Summarize the content below in 3 bullet points.",
  },
  {
    label: "关键结论",
    body: "What are the key takeaways from the content below?",
  },
  {
    label: "核心内容提取",
    body: "Extract the gist of the content below.",
  },
  {
    label: "精彩观点模板",
    body: `Your output should use the following template:
#### Summary
#### Highlights
- [Emoji] Bulletpoint

Summarise the text in up to seven concise bullet points, starting with a short highlight. Choose an appropriate emoji per bullet.
Use the text above: {{Title}} {{Transcript}}`,
  },
]

export function ExamplePrompts() {
  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text)
  }

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-3">
        <h3 className="text-lg font-bold">提示词示例</h3>
        <span className="text-xs text-muted-foreground">复制后可按需修改和组合</span>
      </div>
      <div className="space-y-2.5">
        {EXAMPLES.map((p, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-3 relative"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-semibold">{p.label}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(p.body)}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted/50 transition-colors"
              >
                复制
              </button>
            </div>
            <pre className="font-mono text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-28 overflow-hidden">
              {p.body}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}
