import type { Config } from "@/types/config/config"

const LANG_NAMES: Record<string, string> = {
  "cmn": "Simplified Chinese", "cmn-Hant": "Traditional Chinese", "eng": "English",
  "jpn": "Japanese", "kor": "Korean", "spa": "Spanish", "fra": "French", "deu": "German",
  "por": "Portuguese", "rus": "Russian", "arb": "Arabic", "hin": "Hindi", "vie": "Vietnamese",
  "tha": "Thai", "ind": "Indonesian", "ita": "Italian", "tur": "Turkish", "pol": "Polish",
  "nld": "Dutch", "swe": "Swedish", "ukr": "Ukrainian",
}

export function getOutputLanguage(config: Config): string {
  const code = config.language.targetCode
  return LANG_NAMES[code] || code
}
