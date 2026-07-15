import type { SourceContent } from '@reel2route/contracts'

import type { ContentProvider } from './content-provider.js'
import type { ParsedContentUrl } from './content-url.js'
import type { InstagramMetadataClient } from './instagram-metadata.client.js'
import type { InstagramYtDlpClient } from './instagram-ytdlp.client.js'

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
    private readonly fallbackClient?: Pick<InstagramYtDlpClient, 'fetch'>,
  ) {}

  readonly fetch = async (
    parsedUrl: ParsedContentUrl,
  ): Promise<SourceContent> => {
    if (parsedUrl.platform !== this.platform) {
      throw new InstagramProviderUrlError()
    }

    const result = await this.metadataClient.fetch(parsedUrl.canonicalUrl)
    const openGraph = result.status === 'available' ? result.metadata : null
    const needsFallback = openGraph?.caption === null || (openGraph?.caption.length ?? 0) < 120
    const fallbackResult = needsFallback
      ? await this.fallbackClient?.fetch(parsedUrl.canonicalUrl)
      : undefined
    const fallback = fallbackResult?.status === 'available' ? fallbackResult.metadata : null
    const metadata = {
      title: openGraph?.title ?? fallback?.title ?? null,
      caption:
        (fallback?.caption?.length ?? 0) > (openGraph?.caption?.length ?? 0)
          ? fallback?.caption ?? null
          : openGraph?.caption ?? null,
      author: openGraph?.author ?? fallback?.author ?? null,
    }

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
        ...(metadata.title === null ? ['title' as const] : []),
        'description',
        'transcript',
        ...(metadata.caption === null
          ? ['caption' as const]
          : []),
        'location_tags',
        ...(metadata.author === null
          ? ['author' as const]
          : []),
        'published_at',
      ],
    }
  }
}
