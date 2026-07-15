import { z } from 'zod'

const youtubeVideoListResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      snippet: z.object({
        title: z.string(),
        description: z.string(),
        channelTitle: z.string(),
        publishedAt: z.iso.datetime(),
      }),
    }),
  ),
})

export type YouTubeMetadata = {
  title: string
  description: string
  author: string
  publishedAt: string
}

export class YouTubeMetadataConfigurationError extends Error {
  constructor() {
    super('A YouTube Data API key is required')
    this.name = 'YouTubeMetadataConfigurationError'
  }
}

export class YouTubeMetadataRequestError extends Error {
  constructor(readonly status: number) {
    super(`The YouTube metadata request failed with status ${status}`)
    this.name = 'YouTubeMetadataRequestError'
  }
}

export class YouTubeMetadataResponseError extends Error {
  constructor() {
    super('YouTube returned an invalid metadata response')
    this.name = 'YouTubeMetadataResponseError'
  }
}

export class YouTubeVideoNotFoundError extends Error {
  constructor(videoId: string) {
    super(`The YouTube video was not found: ${videoId}`)
    this.name = 'YouTubeVideoNotFoundError'
  }
}

export class YouTubeMetadataClient {
  readonly #apiKey: string
  readonly #fetch: typeof globalThis.fetch

  constructor(
    apiKey: string,
    fetchImplementation: typeof globalThis.fetch = globalThis.fetch,
  ) {
    const normalizedApiKey = apiKey.trim()

    if (normalizedApiKey.length === 0) {
      throw new YouTubeMetadataConfigurationError()
    }

    this.#apiKey = normalizedApiKey
    this.#fetch = fetchImplementation
  }

  async fetch(videoId: string): Promise<YouTubeMetadata> {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos')
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('id', videoId)
    url.searchParams.set('key', this.#apiKey)

    const response = await this.#fetch(url, {
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      throw new YouTubeMetadataRequestError(response.status)
    }

    let payload: unknown

    try {
      payload = await response.json()
    } catch {
      throw new YouTubeMetadataResponseError()
    }

    const result = youtubeVideoListResponseSchema.safeParse(payload)

    if (!result.success) {
      throw new YouTubeMetadataResponseError()
    }

    const video = result.data.items.find((item) => item.id === videoId)

    if (video === undefined) {
      throw new YouTubeVideoNotFoundError(videoId)
    }

    return {
      title: video.snippet.title,
      description: video.snippet.description,
      author: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
    }
  }
}
