// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { copyText } from "@/utils/clipboard"
import { getLLMProvidersConfig } from "@/utils/config/helpers"
import { DEFAULT_CONFIG } from "@/utils/constants/config"
import { sendMessage } from "@/utils/message"
import { VideoSummaryPanel } from "../components/video-summary-panel"
import { fetchTranscript } from "../transcript"

vi.mock("@/utils/clipboard", () => ({ copyText: vi.fn() }))
vi.mock("@/utils/config/helpers", () => ({ getLLMProvidersConfig: vi.fn() }))
vi.mock("@/utils/message", () => ({ sendMessage: vi.fn() }))
vi.mock("../transcript", async importOriginal => ({
  ...await importOriginal<typeof import("../transcript")>(),
  fetchTranscript: vi.fn(),
  getVideoTitle: () => "测试视频",
}))

const summary = { tldr: "测试摘要", chapters: [], highlights: [] }
const segments = [{ start: 0, duration: 60, text: "视频字幕" }]

function renderPanel() {
  const onVisibilityChange = vi.fn()
  const view = render(<VideoSummaryPanel config={DEFAULT_CONFIG} videoId="current" onVisibilityChange={onVisibilityChange} />)
  return { ...view, onVisibilityChange }
}

describe("youTube summary panel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchTranscript).mockResolvedValue(segments)
    vi.mocked(getLLMProvidersConfig).mockReturnValue([{ id: "test-provider" }] as ReturnType<typeof getLLMProvidersConfig>)
    vi.mocked(sendMessage).mockResolvedValue({ object: summary } as never)
    vi.mocked(copyText).mockResolvedValue(undefined)
  })
  afterEach(cleanup)

  it("hides the panel and its host when no captions are found", async () => {
    vi.mocked(fetchTranscript).mockResolvedValue([])
    const { container, onVisibilityChange } = renderPanel()
    await waitFor(() => expect(container).toBeEmptyDOMElement())
    expect(onVisibilityChange).toHaveBeenLastCalledWith(false)
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it("keeps fetch failures visible with a retry button", async () => {
    vi.mocked(fetchTranscript).mockRejectedValue(new Error("字幕读取超时"))
    const { onVisibilityChange } = renderPanel()
    await screen.findByText("字幕读取超时")
    expect(screen.getByRole("button", { name: "重试" })).toBeInTheDocument()
    expect(onVisibilityChange).toHaveBeenLastCalledWith(true)
  })

  it("stays closed when a pending summary finishes", async () => {
    let complete!: (result: never) => void
    vi.mocked(sendMessage).mockImplementation(() => new Promise((resolve) => {
      complete = resolve
    }) as never)
    const { container, onVisibilityChange } = renderPanel()
    await waitFor(() => expect(sendMessage).toHaveBeenCalled())
    const signal = vi.mocked(fetchTranscript).mock.calls[0][1]
    fireEvent.click(screen.getByRole("button", { name: "关闭 Skim AI 面板" }))
    expect(signal?.aborted).toBe(true)
    await act(async () => complete({ object: summary } as never))
    expect(container).toBeEmptyDOMElement()
    expect(onVisibilityChange).toHaveBeenLastCalledWith(false)
  })

  it("copies the full long script while summary generation is pending", async () => {
    const fullText = `${"字幕".repeat(120000)} THE_END`
    vi.mocked(fetchTranscript).mockResolvedValue([{ start: 0, duration: 60, text: fullText }])
    vi.mocked(sendMessage).mockImplementation(() => new Promise(() => {}) as never)
    let completeCopy!: () => void
    vi.mocked(copyText).mockImplementation(() => new Promise((resolve) => {
      completeCopy = resolve
    }))
    renderPanel()
    await waitFor(() => expect(sendMessage).toHaveBeenCalled())
    fireEvent.click(screen.getByRole("button", { name: "字幕全文" }))
    fireEvent.click(screen.getByRole("button", { name: "复制全文" }))
    expect(copyText).toHaveBeenCalledWith(fullText)
    expect(screen.queryByText("✓ 已复制")).not.toBeInTheDocument()
    await act(async () => completeCopy())
    expect(screen.getByText("✓ 已复制")).toBeInTheDocument()
  })

  it("does not start a fallback request after the panel is closed", async () => {
    let fail!: (error: Error) => void
    vi.mocked(sendMessage).mockImplementation(() => new Promise((_, reject) => {
      fail = reject
    }) as never)
    renderPanel()
    await waitFor(() => expect(sendMessage).toHaveBeenCalledOnce())
    fireEvent.click(screen.getByRole("button", { name: "关闭 Skim AI 面板" }))
    await act(async () => fail(new Error("provider error")))
    expect(sendMessage).toHaveBeenCalledOnce()
  })

  it("allows reading and copying captions when no AI provider is configured", async () => {
    vi.mocked(getLLMProvidersConfig).mockReturnValue([])
    renderPanel()
    await screen.findByText(/请先在 Skim AI 设置中配置 AI 服务/)
    fireEvent.click(screen.getByRole("button", { name: "字幕全文" }))
    expect(screen.getByText("视频字幕")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "复制全文" }))
    await waitFor(() => expect(copyText).toHaveBeenCalledWith("视频字幕"))
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it("reports a copy failure and keeps the TXT download available", async () => {
    vi.mocked(copyText).mockRejectedValue(new Error("denied"))
    renderPanel()
    await screen.findByText("测试摘要")
    fireEvent.click(screen.getByRole("button", { name: "字幕全文" }))
    fireEvent.click(screen.getByRole("button", { name: "复制全文" }))
    await screen.findByRole("alert")
    expect(screen.queryByText("✓ 已复制")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "下载全文" })).toBeInTheDocument()
  })
})
