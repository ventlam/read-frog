import type {
  BackgroundGenerateObjectPayload,
  BackgroundGenerateObjectResponse,
} from "@/types/background-generate-object"
import { generateObject, jsonSchema } from "ai"
import { logger } from "@/utils/logger"
import { onMessage } from "@/utils/message"
import { getModelById } from "@/utils/providers/model"

export async function runGenerateObjectInBackground(
  payload: BackgroundGenerateObjectPayload,
): Promise<BackgroundGenerateObjectResponse> {
  const { providerId, schema, schemaName, schemaDescription, ...params } = payload
  const model = await getModelById(providerId)

  const { object } = await generateObject({
    model,
    system: params.system,
    prompt: params.prompt,
    temperature: params.temperature,
    schema: jsonSchema(schema),
    schemaName,
    schemaDescription,
  })

  return { object: object as any }
}

export function setupLLMGenerateObjectMessageHandlers() {
  onMessage("backgroundGenerateObject", async (message) => {
    try {
      return await runGenerateObjectInBackground(message.data)
    }
    catch (error) {
      logger.error("[Background] backgroundGenerateObject failed", error)
      throw error
    }
  })
}
