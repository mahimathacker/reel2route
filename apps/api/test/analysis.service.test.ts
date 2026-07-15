import type {
  ContentExtraction,
  ResolvedPlace,
  SourceContent,
} from '@reel2route/contracts'
import { describe, expect, it, vi } from 'vitest'

import { AnalysisService } from '../src/modules/analysis/analysis.service.js'

const source: SourceContent = {
  platform: 'youtube',
  canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  externalId: 'dQw4w9WgXcQ',
  title: 'Jaipur guide',
  description: null,
  transcript: [],
  caption: null,
  locationTags: [],
  author: null,
  publishedAt: null,
  unavailableFields: ['description', 'transcript', 'caption', 'location_tags', 'author', 'published_at'],
}

const extraction: ContentExtraction = {
  destinationGuess: 'Jaipur, India',
  places: [],
  activities: [],
  vibes: ['heritage'],
  missingInformation: [],
}

describe('AnalysisService', () => {
  it('runs ingestion, extraction, and resolution in order', async () => {
    const ingest = vi.fn().mockResolvedValue(source)
    const extract = vi.fn().mockResolvedValue(extraction)
    const resolveAll = vi.fn().mockResolvedValue([] as ResolvedPlace[])
    const service = new AnalysisService({ ingest }, { extract }, { resolveAll })

    await expect(
      service.analyze('https://youtu.be/dQw4w9WgXcQ'),
    ).resolves.toEqual({ source, extraction, resolvedPlaces: [] })
    expect(extract).toHaveBeenCalledWith(source)
    expect(resolveAll).toHaveBeenCalledWith([], 'Jaipur, India')
  })

  it('stops the pipeline when extraction fails', async () => {
    const ingest = vi.fn().mockResolvedValue(source)
    const extract = vi.fn().mockRejectedValue(new Error('extraction failed'))
    const resolveAll = vi.fn()
    const service = new AnalysisService({ ingest }, { extract }, { resolveAll })

    await expect(service.analyze('https://example.com')).rejects.toThrow(
      'extraction failed',
    )
    expect(resolveAll).not.toHaveBeenCalled()
  })
})
