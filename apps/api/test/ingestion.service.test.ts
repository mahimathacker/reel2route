import type { SourceContent, SourcePlatform } from '@reel2route/contracts'
import { describe, expect, it, vi } from 'vitest'

import type { ContentProvider } from '../src/modules/ingestion/content-provider.js'
import {
  ContentProviderIdentityMismatchError,
  ContentProviderNotConfiguredError,
  DuplicateContentProviderError,
  IngestionService,
} from '../src/modules/ingestion/ingestion.service.js'

const youtubeUrl = 'https://youtu.be/dQw4w9WgXcQ?t=20'

const youtubeContent: SourceContent = {
  platform: 'youtube',
  canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  externalId: 'dQw4w9WgXcQ',
  title: 'A weekend in Jaipur',
  description: null,
  transcript: [],
  caption: null,
  locationTags: [],
  author: 'Reel2Route Fixture',
  publishedAt: null,
  unavailableFields: ['description', 'transcript', 'caption', 'location_tags'],
}

const createProvider = (
  platform: SourcePlatform,
  content: SourceContent = youtubeContent,
): ContentProvider => ({
  platform,
  fetch: vi.fn().mockResolvedValue(content),
})

describe('IngestionService', () => {
  it('dispatches a canonical parsed URL to the matching provider', async () => {
    const provider = createProvider('youtube')
    const service = new IngestionService([provider])

    await expect(service.ingest(youtubeUrl)).resolves.toEqual(youtubeContent)
    expect(provider.fetch).toHaveBeenCalledWith({
      platform: 'youtube',
      externalId: 'dQw4w9WgXcQ',
      canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    })
  })

  it('rejects a URL when its platform provider is not configured', async () => {
    const service = new IngestionService([])

    await expect(service.ingest(youtubeUrl)).rejects.toBeInstanceOf(
      ContentProviderNotConfiguredError,
    )
  })

  it('rejects duplicate providers for the same platform', () => {
    expect(
      () =>
        new IngestionService([
          createProvider('youtube'),
          createProvider('youtube'),
        ]),
    ).toThrow(DuplicateContentProviderError)
  })

  it('rejects schema-invalid provider output', async () => {
    const provider: ContentProvider = {
      platform: 'youtube',
      fetch: vi.fn().mockResolvedValue({
        platform: 'youtube',
        externalId: 'dQw4w9WgXcQ',
      }),
    }
    const service = new IngestionService([provider])

    await expect(service.ingest(youtubeUrl)).rejects.toThrow()
  })

  it('rejects provider content that identifies a different source', async () => {
    const provider = createProvider('youtube', {
      ...youtubeContent,
      externalId: 'aaaaaaaaaaa',
    })
    const service = new IngestionService([provider])

    await expect(service.ingest(youtubeUrl)).rejects.toBeInstanceOf(
      ContentProviderIdentityMismatchError,
    )
  })
})
