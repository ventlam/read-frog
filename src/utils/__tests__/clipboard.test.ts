// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { copyText } from "../clipboard"

describe("clipboard", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ""
  })

  it("writes long text to the Clipboard API in full", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } })
    const text = `${"字幕".repeat(120000)} THE_END`
    await copyText(text)
    expect(writeText).toHaveBeenCalledWith(text)
  })

  it("falls back to selecting the complete text and restores the previous focus", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } })
    const button = document.createElement("button")
    document.body.appendChild(button)
    button.focus()
    const text = `${"字幕".repeat(120000)} THE_END`
    const execCommand = vi.fn(() => {
      expect((document.activeElement as HTMLTextAreaElement).value).toBe(text)
      return true
    })
    Object.defineProperty(document, "execCommand", { configurable: true, value: execCommand })
    await copyText(text)
    expect(execCommand).toHaveBeenCalledWith("copy")
    expect(document.activeElement).toBe(button)
    expect(document.querySelector("textarea")).toBeNull()
  })

  it("rejects when both clipboard methods fail", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } })
    Object.defineProperty(document, "execCommand", { configurable: true, value: vi.fn().mockReturnValue(false) })
    await expect(copyText("字幕")).rejects.toThrow("复制失败")
    expect(document.querySelector("textarea")).toBeNull()
  })
})
