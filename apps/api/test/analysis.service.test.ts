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

  it('resolves only independently visitable places', async () => {
    const evidence = [{ source: 'transcript' as const, text: 'Visit the Louvre and see the Mona Lisa', timestampSeconds: 10 }]
    const places: ContentExtraction['places'] = [
      {
        name: 'Louvre Museum',
        category: 'attraction',
        role: 'independent_place',
        parentPlaceName: null,
        context: 'A museum visit',
        evidence,
        confidence: 'high',
        mentionCount: 1,
      },
      {
        name: 'Mona Lisa',
        category: 'other',
        role: 'within_place',
        parentPlaceName: 'Louvre Museum',
        context: 'An artwork inside the Louvre',
        evidence,
        confidence: 'high',
        mentionCount: 1,
      },
      {
        name: 'Paris',
        category: 'neighbourhood',
        role: 'destination_label',
        parentPlaceName: null,
        context: 'The overall destination',
        evidence,
        confidence: 'high',
        mentionCount: 1,
      },
    ]
    const richExtraction = { ...extraction, destinationGuess: 'Paris, France', places }
    const resolveAll = vi.fn().mockResolvedValue([] as ResolvedPlace[])
    const service = new AnalysisService(
      { ingest: vi.fn().mockResolvedValue(source) },
      { extract: vi.fn().mockResolvedValue(richExtraction) },
      { resolveAll },
    )

    await service.analyze('https://youtu.be/dQw4w9WgXcQ')

    expect(resolveAll).toHaveBeenCalledWith([places[0]], 'Paris, France')
  })
})
