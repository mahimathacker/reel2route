import { describe, expect, it, vi } from 'vitest'

import type { ParsedContentUrl } from '../src/modules/ingestion/content-url.js'
import type { YouTubeMetadataClient } from '../src/modules/ingestion/youtube-metadata.client.js'
import type { YouTubeTranscriptClient } from '../src/modules/ingestion/youtube-transcript.client.js'
import {
  YouTubeProvider,
  YouTubeProviderUrlError,
} from '../src/modules/ingestion/youtube.provider.js'

const parsedYouTubeUrl: ParsedContentUrl = {
  platform: 'youtube',
  externalId: 'dQw4w9WgXcQ',
  canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
}

const metadata = {
  title: '  A weekend in Jaipur  ',
  description: '  Food, forts and hidden streets.  ',
  author: '  Reel2Route Fixture  ',
  publishedAt: '2026-01-10T08:30:00Z',
}

describe('YouTubeProvider', () => {
  it('combines metadata and transcript into normalized source content', async () => {
    const metadataFetch = vi
      .fn<YouTubeMetadataClient['fetch']>()
      .mockResolvedValue(metadata)
    const transcriptFetch = vi
      .fn<YouTubeTranscriptClient['fetch']>()
      .mockResolvedValue({
        status: 'available',
        segments: [
          {
            text: 'Start at City Palace',
            startSeconds: 84,
            durationSeconds: 3,
          },
        ],
      })
    const provider = new YouTubeProvider(
      { fetch: metadataFetch },
      { fetch: transcriptFetch },
    )

    await expect(provider.fetch(parsedYouTubeUrl)).resolves.toEqual({
      platform: 'youtube',
      canonicalUrl: parsedYouTubeUrl.canonicalUrl,
      externalId: parsedYouTubeUrl.externalId,
      title: 'A weekend in Jaipur',
      description: 'Food, forts and hidden streets.',
      transcript: [
        {
          text: 'Start at City Palace',
          startSeconds: 84,
          durationSeconds: 3,
        },
      ],
      caption: null,
      locationTags: [],
      author: 'Reel2Route Fixture',
      publishedAt: '2026-01-10T08:30:00Z',
      unavailableFields: ['caption', 'location_tags'],
    })

    expect(metadataFetch).toHaveBeenCalledWith(parsedYouTubeUrl.externalId)
    expect(transcriptFetch).toHaveBeenCalledWith(parsedYouTubeUrl.externalId)
  })

  it('marks an empty description and unavailable transcript explicitly', async () => {
    const metadataFetch = vi
      .fn<YouTubeMetadataClient['fetch']>()
      .mockResolvedValue({ ...metadata, description: '   ' })
    const transcriptFetch = vi
      .fn<YouTubeTranscriptClient['fetch']>()
      .mockResolvedValue({
        status: 'unavailable',
        reason: 'disabled',
        segments: [],
      })
    const provider = new YouTubeProvider(
      { fetch: metadataFetch },
      { fetch: transcriptFetch },
    )

    const content = await provider.fetch(parsedYouTubeUrl)

    expect(content.description).toBeNull()
    expect(content.transcript).toEqual([])
    expect(content.unavailableFields).toEqual([
      'caption',
      'location_tags',
      'description',
      'transcript',
    ])
  })

  it('rejects non-YouTube parsed URLs before calling clients', async () => {
    const metadataFetch = vi.fn<YouTubeMetadataClient['fetch']>()
    const transcriptFetch = vi.fn<YouTubeTranscriptClient['fetch']>()
    const provider = new YouTubeProvider(
      { fetch: metadataFetch },
      { fetch: transcriptFetch },
    )
    const instagramUrl: ParsedContentUrl = {
      platform: 'instagram',
      externalId: 'C8Example_1',
      canonicalUrl: 'https://www.instagram.com/reel/C8Example_1/',
    }

    await expect(provider.fetch(instagramUrl)).rejects.toBeInstanceOf(
      YouTubeProviderUrlError,
    )
    expect(metadataFetch).not.toHaveBeenCalled()
    expect(transcriptFetch).not.toHaveBeenCalled()
  })
})
