import { describe, expect, it, vi } from "vitest"
import { i18n } from "../i18n"

vi.unmock("#i18n")

describe("skim AI Chinese UI", () => {
  it("uses Chinese text independently of the browser message lookup", () => {
    expect(i18n.t("action.copy")).toBe("复制")
    expect(i18n.t("options.general.title")).toBe("通用")
  })

  it("substitutes numeric and string values without interpreting their dollar signs", () => {
    expect(i18n.t("subtitles.errors.httpUnknown", [503])).toBe("HTTP 错误 503")
    expect(i18n.t("options.apiProviders.form.duplicateProviderName", ["$1 test"])).toContain("$1 test")
  })
})
