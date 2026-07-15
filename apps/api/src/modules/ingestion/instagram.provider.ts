import type { SourceContent } from '@reel2route/contracts'

import type { ContentProvider } from './content-provider.js'
import type { ParsedContentUrl } from './content-url.js'
import type { InstagramMetadataClient } from './instagram-metadata.client.js'

export class InstagramProviderUrlError extends Error {
  constructor() {
    super('The Instagram provider received a non-Instagram URL')
    this.name = 'InstagramProviderUrlError'
  }
}

export class InstagramProvider implements ContentProvider {
  readonly platform = 'instagram' as const

  constructor(
    private readonly metadataClient: Pick<InstagramMetadataClient, 'fetch'>,
  ) {}

  readonly fetch = async (
    parsedUrl: ParsedContentUrl,
  ): Promise<SourceContent> => {
    if (parsedUrl.platform !== this.platform) {
      throw new InstagramProviderUrlError()
    }

    const result = await this.metadataClient.fetch(parsedUrl.canonicalUrl)
    const metadata = result.status === 'available' ? result.metadata : null

    return {
      platform: this.platform,
      canonicalUrl: parsedUrl.canonicalUrl,
      externalId: parsedUrl.externalId,
      title: metadata?.title ?? null,
      description: null,
      transcript: [],
      caption: metadata?.caption ?? null,
      locationTags: [],
      author: metadata?.author ?? null,
      publishedAt: null,
      unavailableFields: [
        ...(metadata?.title === null || metadata === null ? ['title' as const] : []),
        'description',
        'transcript',
        ...(metadata?.caption === null || metadata === null
          ? ['caption' as const]
          : []),
        'location_tags',
        ...(metadata?.author === null || metadata === null
          ? ['author' as const]
          : []),
        'published_at',
      ],
    }
  }
}
