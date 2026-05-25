import { browser } from "#imports"

export const APP_NAME = "Skim AI"
const manifest = browser.runtime.getManifest()
export const EXTENSION_VERSION = manifest.version
