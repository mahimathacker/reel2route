import { describe, expect, it, vi } from 'vitest'
import {
  fetchTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
} from 'youtube-transcript'

import { YouTubeTranscriptClient } from '../src/modules/ingestion/youtube-transcript.client.js'

const videoId = 'dQw4w9WgXcQ'

describe('YouTubeTranscriptClient', () => {
  it('preserves legacy second-based timestamps', async () => {
    const fetchMock = vi.fn<typeof fetchTranscript>().mockResolvedValue([
      { text: 'City Palace', offset: 12.5, duration: 3.25 },
    ])
    const client = new YouTubeTranscriptClient(fetchMock)

    await expect(client.fetch(videoId)).resolves.toEqual({
      status: 'available',
      segments: [
        {
          text: 'City Palace',
          startSeconds: 12.5,
          durationSeconds: 3.25,
        },
      ],
    })
  })

  it('converts modern millisecond timestamps to seconds', async () => {
    const fetchMock = vi.fn<typeof fetchTranscript>().mockResolvedValue([
      { text: 'Amber Fort', offset: 12_500, duration: 3_250 },
      { text: 'Hawa Mahal', offset: 15_750, duration: 2_000 },
    ])
    const client = new YouTubeTranscriptClient(fetchMock)

    await expect(client.fetch(videoId)).resolves.toEqual({
      status: 'available',
      segments: [
        {
          text: 'Amber Fort',
          startSeconds: 12.5,
          durationSeconds: 3.25,
        },
        {
          text: 'Hawa Mahal',
          startSeconds: 15.75,
          durationSeconds: 2,
        },
      ],
    })
  })

  it('treats a transcript containing only blank rows as unavailable', async () => {
    const fetchMock = vi.fn<typeof fetchTranscript>().mockResolvedValue([
      { text: '   ', offset: 0, duration: 2 },
    ])
    const client = new YouTubeTranscriptClient(fetchMock)

    await expect(client.fetch(videoId)).resolves.toEqual({
      status: 'unavailable',
      reason: 'not_available',
      segments: [],
    })
  })

  it.each([
    ['disabled', () => new YoutubeTranscriptDisabledError(videoId)],
    ['not_available', () => new YoutubeTranscriptNotAvailableError(videoId)],
    [
      'not_available',
      () =>
        new YoutubeTranscriptNotAvailableLanguageError(
          'en',
          ['es'],
          videoId,
        ),
    ],
    ['rate_limited', () => new YoutubeTranscriptTooManyRequestError()],
    [
      'video_unavailable',
      () => new YoutubeTranscriptVideoUnavailableError(videoId),
    ],
    ['unknown', () => new YoutubeTranscriptError('Unexpected caption error')],
  ])('maps transcript failures to %s', async (reason, createError) => {
    const fetchMock = vi
      .fn<typeof fetchTranscript>()
      .mockRejectedValue(createError())
    const client = new YouTubeTranscriptClient(fetchMock)

    await expect(client.fetch(videoId)).resolves.toEqual({
      status: 'unavailable',
      reason,
      segments: [],
    })
  })

  it('maps network failures without hiding programming errors', async () => {
    const networkFetch = vi
      .fn<typeof fetchTranscript>()
      .mockRejectedValue(new TypeError('fetch failed'))
    const brokenFetch = vi
      .fn<typeof fetchTranscript>()
      .mockRejectedValue(new Error('programming error'))

    await expect(
      new YouTubeTranscriptClient(networkFetch).fetch(videoId),
    ).resolves.toEqual({
      status: 'unavailable',
      reason: 'request_failed',
      segments: [],
    })

    await expect(
      new YouTubeTranscriptClient(brokenFetch).fetch(videoId),
    ).rejects.toThrow('programming error')
  })

  it('rejects normalized segments that violate the shared contract', async () => {
    const fetchMock = vi.fn<typeof fetchTranscript>().mockResolvedValue([
      { text: 'Invalid timestamp', offset: -1, duration: 2 },
    ])
    const client = new YouTubeTranscriptClient(fetchMock)

    await expect(client.fetch(videoId)).rejects.toThrow()
  })
})
