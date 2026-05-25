const EXAMPLES = [
  {
    label: "Cited research answer",
    body: `Using the provided web search results, write a comprehensive reply to the given query.
Cite results using [[number](URL)] notation after the reference.
If the query is a company name, use only contents of [1].
Keep answers short and easy to understand.
Finally, give all references as:
- [number] : [TITLE](URL)

Use markdown for clear, easy-to-read formatting.`,
  },
  {
    label: "Three-bullet summary",
    body: "Summarize the content below in 3 bullet points.",
  },
  {
    label: "Key takeaways",
    body: "What are the key takeaways from the content below?",
  },
  {
    label: "Gist extractor",
    body: "Extract the gist of the content below.",
  },
  {
    label: "Highlight template",
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
        <h3 className="text-lg font-bold">Example prompts</h3>
        <span className="text-xs text-muted-foreground">copy-paste, tweak, mix</span>
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
                Copy
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
