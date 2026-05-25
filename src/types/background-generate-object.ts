import type { JSONValue } from "ai"

export interface BackgroundGenerateObjectPayload {
  providerId: string
  system?: string
  prompt: string
  temperature?: number
  schema: Record<string, unknown>
  schemaName?: string
  schemaDescription?: string
}

export interface BackgroundGenerateObjectResponse {
  object: JSONValue
}
