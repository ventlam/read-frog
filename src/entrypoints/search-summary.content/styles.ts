export const searchSummaryStyles = /* css */ `
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
    --brand-hover: #0F4D40;
    --brand-ink: #FAF8F3;
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
    box-shadow: 0 1px 3px rgba(15,15,15,0.05), 0 6px 24px rgba(15,15,15,0.04);
    -webkit-font-smoothing: antialiased;
    max-height: 720px;
  }

  .skim-header {
    padding: 12px 14px 10px;
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
    font-size: 18px;
    line-height: 1;
    letter-spacing: -0.02em;
    color: var(--brand);
  }

  .skim-context-chip {
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--muted);
    background: var(--bg-soft);
    padding: 2px 6px;
    border-radius: 4px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-weight: 600;
    white-space: nowrap;
  }

  .skim-tabs {
    display: flex;
    gap: 2px;
    border-bottom: 1px solid var(--line);
    padding: 0 10px;
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

  .skim-body {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--line-strong) transparent;
    padding: 14px 14px 8px;
    background: var(--bg-card);
  }
  .skim-body::-webkit-scrollbar { width: 6px; }
  .skim-body::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 3px; }
  .skim-body::-webkit-scrollbar-track { background: transparent; }

  .skim-label {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .skim-summary-text {
    font-family: var(--font-display);
    font-size: 17px;
    line-height: 1.4;
    letter-spacing: -0.005em;
    color: var(--ink);
    margin: 0 0 12px;
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

  .skim-pick {
    padding: 10px 0;
    border-top: 1px solid var(--line-soft);
  }
  .skim-pick:first-of-type { border-top: none; }

  .skim-pick-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    flex-wrap: wrap;
  }

  .skim-pick-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
    letter-spacing: -0.01em;
  }

  .skim-pick-tag {
    font-size: 10px;
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--muted);
    background: var(--chip);
    padding: 1px 6px;
    border-radius: 4px;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .skim-pick-desc {
    font-size: 12.5px;
    color: var(--ink-soft);
    line-height: 1.5;
  }

  .skim-source {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 0;
    border-top: 1px solid var(--line-soft);
    cursor: pointer;
  }
  .skim-source:first-of-type { border-top: none; }

  .skim-source-title {
    font-size: 13px;
    color: var(--ink);
    font-weight: 500;
    letter-spacing: -0.005em;
    line-height: 1.35;
    margin-bottom: 2px;
  }

  .skim-source-site {
    font-size: 11px;
    color: var(--muted);
    font-family: var(--font-mono);
  }

  .skim-btn {
    font-family: var(--font-ui);
    font-weight: 500;
    font-size: 11.5px;
    line-height: 1;
    border-radius: var(--r-pill);
    border: 1px solid var(--line-strong);
    background: var(--bg-card);
    color: var(--ink);
    padding: 5px 9px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: background 0.12s, border-color 0.12s;
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
    gap: 4px;
    margin-top: 14px;
    flex-wrap: wrap;
  }

  .skim-ask-empty {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .skim-followup {
    display: block;
    width: 100%;
    font-family: var(--font-ui);
    font-size: 12.5px;
    font-weight: 500;
    color: var(--ink);
    background: var(--bg-soft);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 8px 10px;
    cursor: pointer;
    text-align: left;
    margin-bottom: 6px;
    line-height: 1.35;
  }
  .skim-followup:hover { background: var(--chip); }

  .skim-msg {
    font-size: 12.5px;
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
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--muted);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 5px;
  }

  .skim-composer {
    padding: 8px 10px 10px;
    border-top: 1px solid var(--line);
  }

  .skim-composer-inner {
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--bg-soft);
    border: 1px solid var(--line);
    border-radius: var(--r-pill);
    padding: 3px 3px 3px 12px;
  }

  .skim-composer-input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-family: var(--font-ui);
    font-size: 12.5px;
    color: var(--ink);
    padding: 5px 0;
    min-width: 0;
  }

  .skim-composer-send {
    padding: 6px 7px;
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
    padding: 20px 0;
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
    padding: 12px 0;
  }

  .skim-empty {
    color: var(--muted);
    font-size: 13px;
    padding: 20px 0;
    text-align: center;
  }
`
