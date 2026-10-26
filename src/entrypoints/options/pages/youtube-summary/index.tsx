import { PageLayout } from "../../components/page-layout"
import { ExamplePrompts } from "./example-prompts"
import { ExtractionToggles } from "./extraction-toggles"
import { YouTubeSummaryConfig } from "./youtube-summary-config"

export function YouTubeSummaryPage() {
  return (
    <PageLayout title="YouTube 视频摘要">
      <div className="space-y-6 py-6">
        <div>
          <p className="text-sm text-muted-foreground max-w-xl">
            设置 Skim AI 提取的视频内容，并调整摘要提示词。
          </p>
        </div>
        <ExtractionToggles />
        <YouTubeSummaryConfig />
        <ExamplePrompts />
      </div>
    </PageLayout>
  )
}
