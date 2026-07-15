import type {
  SourceContent,
  UnavailableSourceField,
} from '@reel2route/contracts'

import type { ContentProvider } from './content-provider.js'
import type { ParsedContentUrl } from './content-url.js'
import type {
  YouTubeMetadata,
  YouTubeMetadataClient,
} from './youtube-metadata.client.js'
import type {
  YouTubeTranscriptClient,
  YouTubeTranscriptResult,
} from './youtube-transcript.client.js'

type MetadataClient = Pick<YouTubeMetadataClient, 'fetch'>
type TranscriptClient = Pick<YouTubeTranscriptClient, 'fetch'>

export class YouTubeProviderUrlError extends Error {
  constructor() {
    super('The YouTube provider received a non-YouTube URL')
    this.name = 'YouTubeProviderUrlError'
  }
}

const getUnavailableFields = (
  metadata: YouTubeMetadata,
  transcript: YouTubeTranscriptResult,
): UnavailableSourceField[] => {
  const fields: UnavailableSourceField[] = ['caption', 'location_tags']

  if (metadata.description.trim().length === 0) {
    fields.push('description')
  }

  if (transcript.status === 'unavailable') {
    fields.push('transcript')
  }

  return fields
}

export class YouTubeProvider implements ContentProvider {
  readonly platform = 'youtube' as const

  constructor(
    readonly metadataClient: MetadataClient,
    readonly transcriptClient: TranscriptClient,
  ) {}

  readonly fetch = async (
    parsedUrl: ParsedContentUrl,
  ): Promise<SourceContent> => {
    if (parsedUrl.platform !== this.platform) {
      throw new YouTubeProviderUrlError()
    }

    const [metadata, transcript] = await Promise.all([
      this.metadataClient.fetch(parsedUrl.externalId),
      this.transcriptClient.fetch(parsedUrl.externalId),
    ])

    return {
      platform: this.platform,
      canonicalUrl: parsedUrl.canonicalUrl,
      externalId: parsedUrl.externalId,
      title: metadata.title.trim(),
      description: metadata.description.trim() || null,
      transcript:
        transcript.status === 'available' ? transcript.segments : [],
      caption: null,
      locationTags: [],
      author: metadata.author.trim(),
      publishedAt: metadata.publishedAt,
      unavailableFields: getUnavailableFields(metadata, transcript),
    }
  }
}
