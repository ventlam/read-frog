export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  }
  catch {
    // Some content-script contexts reject the Clipboard API even after a click.
    const previousFocus = document.activeElement
    const selection = window.getSelection()
    const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange()) : []
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none"
    document.body.appendChild(textarea)
    try {
      textarea.focus()
      textarea.select()
      if (!document.execCommand("copy"))
        throw new Error("复制失败，请重试或下载全文")
    }
    finally {
      textarea.remove()
      if (previousFocus instanceof HTMLElement)
        previousFocus.focus({ preventScroll: true })
      selection?.removeAllRanges()
      ranges.forEach(range => selection?.addRange(range))
    }
  }
}
