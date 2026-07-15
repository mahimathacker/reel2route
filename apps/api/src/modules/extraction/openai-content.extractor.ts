import {
  contentExtractionSchema,
  type ContentExtraction,
  type SourceContent,
} from '@reel2route/contracts'
import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'

import type { ContentExtractor } from './content-extractor.js'
import {
  buildExtractionInput,
  EXTRACTION_SYSTEM_PROMPT,
} from './extraction-prompt.js'

export class ContentExtractionError extends Error {
  constructor(cause?: unknown) {
    super('The model did not return a valid content extraction', { cause })
    this.name = 'ContentExtractionError'
  }
}

type ResponsesClient = Pick<OpenAI, 'responses'>

export class OpenAIContentExtractor implements ContentExtractor {
  readonly #client: ResponsesClient

  constructor(
    apiKey: string,
    private readonly model: string,
    client?: ResponsesClient,
  ) {
    this.#client = client ?? new OpenAI({ apiKey })
  }

  readonly extract = async (
    content: SourceContent,
  ): Promise<ContentExtraction> => {
    try {
      const response = await this.#client.responses.parse({
        model: this.model,
        input: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: buildExtractionInput(content) },
        ],
        text: {
          format: zodTextFormat(contentExtractionSchema, 'content_extraction'),
        },
      })

      if (response.output_parsed === null) {
        throw new ContentExtractionError()
      }

      return contentExtractionSchema.parse(response.output_parsed)
    } catch (error) {
      if (error instanceof ContentExtractionError) throw error
      throw new ContentExtractionError(error)
    }
  }
}
