import type { ChromeMessage } from "@wxt-dev/i18n/build"
import type { GeneratedI18nStructure } from "../../.wxt/i18n/structure"
import { createI18n } from "@wxt-dev/i18n"
import chineseMessages from "../../.wxt/skim-i18n-messages"

const messages: Record<string, ChromeMessage> = chineseMessages
const browserI18n = createI18n<GeneratedI18nStructure>()

function translate(key: string, ...args: (number | (string | number)[] | undefined)[]): string {
  const entry = messages[key.replaceAll(".", "_")]
  if (!entry)
    return (browserI18n.t as typeof translate)(key, ...args)

  const count = args.find((arg): arg is number => typeof arg === "number")
  const substitutions = args.find(Array.isArray) ?? (count === undefined ? [] : [count])
  const placeholders = Object.fromEntries(Object.entries(entry.placeholders ?? {}).map(([name, value]) => [name.toLowerCase(), value.content]))
  let message = entry.message
    .replace(/\$([a-z_]\w*)\$/gi, (match, name: string) => placeholders[name.toLowerCase()] ?? match)
    .replace(/\$\$|\$(\d+)/g, (match, index: string | undefined) => index ? String(substitutions[Number(index) - 1] ?? "") : "$")
  if (count !== undefined) {
    const plural = message.split(" | ")
    if (plural.length === 2)
      message = plural[count === 1 ? 0 : 1]
    else if (plural.length === 3)
      message = plural[count === 0 || count === 1 ? count : 2]
  }
  return message
}

export const i18n: ReturnType<typeof createI18n<GeneratedI18nStructure>> = { t: translate }
export type { GeneratedI18nStructure }
