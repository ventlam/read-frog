export const videoSummaryStyles = /* css */ `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap');
  @import url('https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap');

  :host {
    --bg: #FAF8F3;
    --bg-card: #FFFFFF;
    --bg-soft: #F4F1E8;
    --ink: #0F0F0E;
    --ink-soft: #2B2B27;
    --muted: #6E6E66;
    --muted-soft: #9C9C92;
    --line: #E5E1D5;
    --line-soft: #EFECE2;
    --line-strong: #D6D2C4;
    --brand: #0B3B30;
    --accent: #D2F26C;
    --accent-soft: #EBF7BD;
    --accent-deep: #A4C73E;
    --chip: #F1EDE2;
    --font-display: "Instrument Serif", "Times New Roman", serif;
    --font-ui: "General Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
    --r-sm: 6px;
    --r-md: 10px;
    --r-lg: 14px;
    --r-pill: 999px;
  }

  *, *::before, *::after { box-sizing: border-box; }

  .skim-panel {
    font-family: var(--font-ui);
    color: var(--ink);
    background: var(--bg-card);
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    -webkit-font-smoothing: antialiased;
    height: 100%;
  }

  .skim-header {
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .skim-wordmark {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 19px;
    line-height: 1;
    letter-spacing: -0.02em;
    color: var(--brand);
  }

  .skim-context-chip {
    font-size: 10.5px;
    font-family: var(--font-mono);
    color: var(--muted);
    background: var(--bg-soft);
    padding: 2px 6px;
    border-radius: 4px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .skim-tabs {
    display: flex;
    gap: 2px;
    border-bottom: 1px solid var(--line);
    padding: 0 14px;
    background: var(--bg-card);
  }

  .skim-tab {
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
    padding: 12px 10px;
    border: none;
    background: transparent;
    cursor: pointer;
    position: relative;
    transition: color 0.12s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .skim-tab:hover { color: var(--ink-soft); }
  .skim-tab.active { color: var(--ink); }
  .skim-tab.active::after {
    content: '';
    position: absolute;
    left: 8px; right: 8px; bottom: -1px;
    height: 2px;
    background: var(--ink);
    border-radius: 2px 2px 0 0;
  }

  .skim-tab-badge {
    font-size: 10px;
    font-family: var(--font-mono);
    background: var(--accent);
    color: var(--ink);
    padding: 1px 5px;
    border-radius: 3px;
    margin-left: 2px;
  }

  .skim-body {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--line-strong) transparent;
    background: var(--bg-card);
  }
  .skim-body::-webkit-scrollbar { width: 6px; }
  .skim-body::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 3px; }
  .skim-body::-webkit-scrollbar-track { background: transparent; }

  .skim-body-pad { padding: 16px 16px 8px; }

  .skim-label {
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--muted);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .skim-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .skim-summary-text {
    font-family: var(--font-ui);
    font-style: normal;
    font-size: 13.5px;
    line-height: 1.55;
    letter-spacing: -0.005em;
    color: var(--ink);
    margin: 0 0 14px;
    text-wrap: pretty;
  }

  .skim-hl {
    background-image: linear-gradient(180deg, transparent 60%, var(--accent) 60%);
    background-size: 100% 100%;
    padding: 0 2px;
  }

  .skim-cite {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    color: var(--brand);
    background: var(--accent-soft);
    border: 1px solid #DCE9B2;
    border-radius: 4px;
    padding: 1px 5px;
    margin: 0 1px;
    cursor: pointer;
    transition: background 0.12s;
    vertical-align: 1px;
  }
  .skim-cite:hover { background: var(--accent); }

  .skim-bullet {
    display: grid;
    grid-template-columns: 20px 1fr auto;
    gap: 10px;
    padding: 10px 0;
    align-items: baseline;
  }
  .skim-bullet + .skim-bullet { border-top: 1px solid var(--line-soft); }

  .skim-bullet-num {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 18px;
    color: var(--brand);
    line-height: 1;
  }

  .skim-bullet-text {
    font-size: 13.5px;
    line-height: 1.5;
    color: var(--ink-soft);
  }

  .skim-ts-btn {
    background: var(--bg-soft);
    border: 1px solid var(--line);
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .skim-ts-btn:hover { background: var(--accent-soft); }

  .skim-chapter {
    display: grid;
    grid-template-columns: 56px 1fr;
    gap: 12px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--line-soft);
    cursor: pointer;
    transition: background 0.12s;
    align-items: start;
  }
  .skim-chapter:hover { background: var(--bg-soft); }
  .skim-chapter.active { background: var(--accent-soft); }

  .skim-chapter-ts {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--brand);
    font-weight: 500;
    padding-top: 2px;
    font-variant-numeric: tabular-nums;
  }

  .skim-chapter-title {
    font-size: 13.5px;
    font-weight: 500;
    color: var(--ink);
    line-height: 1.35;
  }

  .skim-chapter-sub {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.4;
    margin-top: 2px;
  }

  .skim-highlight {
    padding: 12px 14px;
    border-bottom: 1px solid var(--line-soft);
    cursor: pointer;
    transition: background 0.12s;
  }
  .skim-highlight:hover { background: var(--bg-soft); }

  .skim-highlight-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .skim-highlight-mark {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 24px;
    color: var(--brand);
    line-height: 1;
    margin-top: -2px;
  }

  .skim-highlight-quote {
    font-family: var(--font-display);
    font-size: 17px;
    line-height: 1.35;
    color: var(--ink);
    letter-spacing: -0.01em;
    flex: 1;
  }

  .skim-highlight-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    font-size: 11.5px;
    color: var(--muted);
  }

  .skim-highlight-tag {
    padding: 1px 6px;
    border-radius: 3px;
    background: var(--chip);
    color: var(--ink-soft);
    font-size: 10.5px;
    font-weight: 500;
  }

  .skim-msg {
    font-size: 13.5px;
    line-height: 1.55;
    padding: 10px 12px;
    border-radius: var(--r-md);
    margin-bottom: 8px;
  }
  .skim-msg.user {
    background: var(--bg-soft);
    color: var(--ink);
    margin-left: 28px;
  }
  .skim-msg.ai {
    background: transparent;
    color: var(--ink);
    margin-right: 28px;
  }

  .skim-msg-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10.5px;
    font-family: var(--font-mono);
    color: var(--muted);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .skim-canned {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    padding: 0 14px 8px;
  }

  .skim-canned-btn {
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 500;
    color: var(--ink);
    background: var(--bg-soft);
    border: 1px solid var(--line);
    border-radius: var(--r-pill);
    padding: 5px 10px;
    cursor: pointer;
    text-align: left;
    line-height: 1.3;
  }
  .skim-canned-btn:hover { background: var(--chip); }

  .skim-composer {
    padding: 8px 12px 12px;
    border-top: 1px solid var(--line);
    background: var(--bg-card);
  }

  .skim-composer-inner {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--bg-soft);
    border: 1px solid var(--line);
    border-radius: var(--r-pill);
    padding: 4px 4px 4px 14px;
  }

  .skim-composer-input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-family: var(--font-ui);
    font-size: 13.5px;
    color: var(--ink);
    padding: 6px 0;
  }

  .skim-composer-send {
    padding: 7px 9px;
    border-radius: 999px;
    background: var(--ink);
    color: var(--bg);
    border: 1px solid var(--ink);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .skim-composer-send:disabled {
    background: var(--line);
    border-color: var(--line);
    cursor: default;
  }

  .skim-btn {
    font-family: var(--font-ui);
    font-weight: 500;
    font-size: 13px;
    line-height: 1;
    border-radius: var(--r-pill);
    border: 1px solid var(--line-strong);
    background: var(--bg-card);
    color: var(--ink);
    padding: 8px 12px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background 0.12s;
    white-space: nowrap;
  }
  .skim-btn:hover { background: var(--bg-soft); }
  .skim-btn.accent {
    background: var(--accent);
    border-color: var(--accent-deep);
    color: var(--ink);
  }
  .skim-btn.accent:hover { background: var(--accent-deep); }
  .skim-btn.ghost {
    border-color: transparent;
    background: transparent;
  }
  .skim-btn.ghost:hover { background: var(--bg-soft); }

  .skim-actions {
    display: flex;
    gap: 6px;
    margin-top: 16px;
    flex-wrap: wrap;
  }

  .skim-foot {
    padding: 8px 14px;
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--muted-soft);
    border-top: 1px solid var(--line-soft);
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--bg-soft);
    letter-spacing: 0.02em;
  }

  .skim-loading {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--muted);
    font-size: 13px;
    padding: 24px 16px;
  }

  .skim-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--line);
    border-top-color: var(--brand);
    border-radius: 50%;
    animation: skim-spin 0.6s linear infinite;
  }

  @keyframes skim-spin {
    to { transform: rotate(360deg); }
  }

  .skim-error {
    color: #C24A2D;
    font-size: 13px;
    padding: 16px;
  }

  .skim-empty {
    color: var(--muted);
    font-size: 13px;
    padding: 24px 16px;
    text-align: center;
  }
`
