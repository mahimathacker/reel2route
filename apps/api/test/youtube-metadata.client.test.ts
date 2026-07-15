import { describe, expect, it, vi } from 'vitest'

import {
  YouTubeMetadataClient,
  YouTubeMetadataConfigurationError,
  YouTubeMetadataRequestError,
  YouTubeMetadataResponseError,
  YouTubeVideoNotFoundError,
} from '../src/modules/ingestion/youtube-metadata.client.js'

const videoId = 'dQw4w9WgXcQ'

const createJsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

const validResponse = {
  items: [
    {
      id: videoId,
      snippet: {
        title: 'A weekend in Jaipur',
        description: 'Food, forts and hidden streets.',
        channelTitle: 'Reel2Route Fixture',
        publishedAt: '2026-01-10T08:30:00Z',
      },
    },
  ],
}

describe('YouTubeMetadataClient', () => {
  it('rejects an empty API key', () => {
    expect(() => new YouTubeMetadataClient('  ')).toThrow(
      YouTubeMetadataConfigurationError,
    )
  })

  it('requests and normalizes YouTube snippet metadata', async () => {
    const fetchMock = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(createJsonResponse(validResponse))
    const client = new YouTubeMetadataClient('test-api-key', fetchMock)

    await expect(client.fetch(videoId)).resolves.toEqual({
      title: 'A weekend in Jaipur',
      description: 'Food, forts and hidden streets.',
      author: 'Reel2Route Fixture',
      publishedAt: '2026-01-10T08:30:00Z',
    })

    const [requestUrl, requestInit] = fetchMock.mock.calls[0] ?? []
    expect(requestUrl).toBeInstanceOf(URL)

    const url = requestUrl as URL
    expect(url.origin + url.pathname).toBe(
      'https://www.googleapis.com/youtube/v3/videos',
    )
    expect(url.searchParams.get('part')).toBe('snippet')
    expect(url.searchParams.get('id')).toBe(videoId)
    expect(url.searchParams.get('key')).toBe('test-api-key')
    expect(requestInit?.signal).toBeInstanceOf(AbortSignal)
  })

  it('preserves the status of unsuccessful metadata requests', async () => {
    const fetchMock = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(createJsonResponse({}, 403))
    const client = new YouTubeMetadataClient('test-api-key', fetchMock)

    await expect(client.fetch(videoId)).rejects.toMatchObject({
      name: YouTubeMetadataRequestError.name,
      status: 403,
    })
  })

  it('rejects invalid JSON responses', async () => {
    const fetchMock = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response('not-json'))
    const client = new YouTubeMetadataClient('test-api-key', fetchMock)

    await expect(client.fetch(videoId)).rejects.toBeInstanceOf(
      YouTubeMetadataResponseError,
    )
  })

  it('rejects structurally invalid responses', async () => {
    const fetchMock = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(createJsonResponse({ items: 'not-an-array' }))
    const client = new YouTubeMetadataClient('test-api-key', fetchMock)

    await expect(client.fetch(videoId)).rejects.toBeInstanceOf(
      YouTubeMetadataResponseError,
    )
  })

  it('rejects responses that do not contain the requested video', async () => {
    const fetchMock = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(createJsonResponse({ items: [] }))
    const client = new YouTubeMetadataClient('test-api-key', fetchMock)

    await expect(client.fetch(videoId)).rejects.toBeInstanceOf(
      YouTubeVideoNotFoundError,
    )
  })
})
