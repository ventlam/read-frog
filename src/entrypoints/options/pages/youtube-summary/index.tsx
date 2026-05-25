import { PageLayout } from "../../components/page-layout"
import { ExamplePrompts } from "./example-prompts"
import { ExtractionToggles } from "./extraction-toggles"
import { YouTubeSummaryConfig } from "./youtube-summary-config"

export function YouTubeSummaryPage() {
  return (
    <PageLayout title="YouTube Summary">
      <div className="space-y-6 py-6">
        <div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Customize how Skim AI reads YouTube videos for you — pick what gets extracted and tune the prompt.
          </p>
        </div>
        <ExtractionToggles />
        <YouTubeSummaryConfig />
        <ExamplePrompts />
      </div>
    </PageLayout>
  )
}
