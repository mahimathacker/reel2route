import { describe, expect, it, vi } from 'vitest'

import type { ParsedContentUrl } from '../src/modules/ingestion/content-url.js'
import type { InstagramMetadataClient } from '../src/modules/ingestion/instagram-metadata.client.js'
import {
  InstagramProvider,
  InstagramProviderUrlError,
} from '../src/modules/ingestion/instagram.provider.js'

const parsedInstagramUrl: ParsedContentUrl = {
  platform: 'instagram',
  externalId: 'C8Example_1',
  canonicalUrl: 'https://www.instagram.com/reel/C8Example_1/',
}

describe('InstagramProvider', () => {
  it('normalizes available public Reel metadata', async () => {
    const metadataFetch = vi
      .fn<InstagramMetadataClient['fetch']>()
      .mockResolvedValue({
        status: 'available',
        metadata: {
          title: 'Mahima on Instagram: Jaipur',
          caption: 'Four days in the Pink City',
          author: 'Mahima',
        },
      })
    const provider = new InstagramProvider({ fetch: metadataFetch })

    const content = await provider.fetch(parsedInstagramUrl)

    expect(content).toMatchObject({
      platform: 'instagram',
      title: 'Mahima on Instagram: Jaipur',
      caption: 'Four days in the Pink City',
      author: 'Mahima',
      unavailableFields: [
        'description',
        'transcript',
        'location_tags',
        'published_at',
      ],
    })
  })

  it('returns explicit missing fields when Instagram blocks metadata', async () => {
    const provider = new InstagramProvider({
      fetch: vi.fn().mockResolvedValue({ status: 'unavailable', reason: 'blocked' }),
    })

    const content = await provider.fetch(parsedInstagramUrl)

    expect(content.title).toBeNull()
    expect(content.caption).toBeNull()
    expect(content.unavailableFields).toEqual([
      'title',
      'description',
      'transcript',
      'caption',
      'location_tags',
      'author',
      'published_at',
    ])
  })

  it('uses richer metadata-only fallback content when Open Graph is sparse', async () => {
    const provider = new InstagramProvider(
      {
        fetch: vi.fn().mockResolvedValue({
          status: 'available',
          metadata: { title: 'Paris', caption: 'Paris ❤️', author: null },
        }),
      },
      {
        fetch: vi.fn().mockResolvedValue({
          status: 'available',
          metadata: {
            title: 'Five days in Paris',
            caption: 'Louvre Museum, Montmartre, and Canal Saint-Martin in five days.',
            author: 'Traveller',
          },
        }),
      },
    )

    const content = await provider.fetch(parsedInstagramUrl)

    expect(content.title).toBe('Paris')
    expect(content.caption).toContain('Louvre Museum')
    expect(content.author).toBe('Traveller')
  })

  it('rejects non-Instagram parsed URLs', async () => {
    const metadataFetch = vi.fn<InstagramMetadataClient['fetch']>()
    const provider = new InstagramProvider({ fetch: metadataFetch })

    await expect(
      provider.fetch({
        platform: 'youtube',
        externalId: 'dQw4w9WgXcQ',
        canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      }),
    ).rejects.toBeInstanceOf(InstagramProviderUrlError)
    expect(metadataFetch).not.toHaveBeenCalled()
  })
})
