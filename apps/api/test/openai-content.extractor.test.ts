import type { ContentExtraction, SourceContent } from '@reel2route/contracts'
import type OpenAI from 'openai'
import { describe, expect, it, vi } from 'vitest'

import {
  ContentExtractionError,
  OpenAIContentExtractor,
} from '../src/modules/extraction/openai-content.extractor.js'

const content: SourceContent = {
  platform: 'youtube',
  canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  externalId: 'dQw4w9WgXcQ',
  title: 'Jaipur City Palace guide',
  description: null,
  transcript: [
    { text: 'Start at Jaipur City Palace', startSeconds: 84 },
  ],
  caption: null,
  locationTags: [],
  author: null,
  publishedAt: null,
  unavailableFields: ['description', 'caption', 'location_tags', 'author', 'published_at'],
}

const extraction: ContentExtraction = {
  destinationGuess: 'Jaipur, India',
  places: [
    {
      name: 'City Palace',
      category: 'landmark',
      context: 'Suggested as the first stop',
      evidence: [
        {
          source: 'transcript',
          text: 'Start at Jaipur City Palace',
          timestampSeconds: 84,
        },
      ],
      confidence: 'high',
      mentionCount: 2,
    },
  ],
  activities: [],
  vibes: ['heritage'],
  missingInformation: [
    { field: 'trip_duration', message: 'The trip duration is not mentioned.' },
  ],
}

const createClient = (outputParsed: unknown) => {
  const parse = vi.fn().mockResolvedValue({ output_parsed: outputParsed })
  return { client: { responses: { parse } } as unknown as Pick<OpenAI, 'responses'>, parse }
}

describe('OpenAIContentExtractor', () => {
  it('requests structured extraction and validates the parsed result', async () => {
    const { client, parse } = createClient(extraction)
    const extractor = new OpenAIContentExtractor('test-key', 'gpt-5-mini', client)

    await expect(extractor.extract(content)).resolves.toEqual(extraction)
    expect(parse).toHaveBeenCalledOnce()
    expect(parse.mock.calls[0]?.[0]).toMatchObject({ model: 'gpt-5-mini' })
    expect(JSON.stringify(parse.mock.calls[0]?.[0])).toContain(
      '[84s] Start at Jaipur City Palace',
    )
  })

  it('rejects an empty parsed response', async () => {
    const { client } = createClient(null)
    const extractor = new OpenAIContentExtractor('test-key', 'gpt-5-mini', client)

    await expect(extractor.extract(content)).rejects.toBeInstanceOf(
      ContentExtractionError,
    )
  })

  it('rejects model output that violates the extraction contract', async () => {
    const { client } = createClient({ ...extraction, places: [{ name: '' }] })
    const extractor = new OpenAIContentExtractor('test-key', 'gpt-5-mini', client)

    await expect(extractor.extract(content)).rejects.toThrow()
  })
})
