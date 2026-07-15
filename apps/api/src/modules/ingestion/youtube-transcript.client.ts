import {
  transcriptSegmentSchema,
  type TranscriptSegment,
} from '@reel2route/contracts'
import {
  fetchTranscript as fetchYouTubeTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
  type TranscriptResponse,
} from 'youtube-transcript'

export type TranscriptUnavailableReason =
  | 'disabled'
  | 'not_available'
  | 'rate_limited'
  | 'request_failed'
  | 'video_unavailable'
  | 'unknown'

export type YouTubeTranscriptResult =
  | {
      status: 'available'
      segments: TranscriptSegment[]
    }
  | {
      status: 'unavailable'
      reason: TranscriptUnavailableReason
      segments: []
    }

type TranscriptFetcher = typeof fetchYouTubeTranscript

const getTimestampDivisor = (segments: readonly TranscriptResponse[]) => {
  const durations = segments
    .map((segment) => segment.duration)
    .filter((duration) => Number.isFinite(duration) && duration > 0)
    .sort((left, right) => left - right)

  if (durations.length === 0) {
    return 1
  }

  const medianDuration = durations[Math.floor(durations.length / 2)] ?? 0

  return medianDuration > 100 ? 1_000 : 1
}

const normalizeSegments = (
  segments: readonly TranscriptResponse[],
): TranscriptSegment[] => {
  const timestampDivisor = getTimestampDivisor(segments)

  return segments
    .filter((segment) => segment.text.trim().length > 0)
    .map((segment) =>
      transcriptSegmentSchema.parse({
        text: segment.text,
        startSeconds: segment.offset / timestampDivisor,
        durationSeconds: segment.duration / timestampDivisor,
      }),
    )
}

const unavailable = (
  reason: TranscriptUnavailableReason,
): YouTubeTranscriptResult => ({
  status: 'unavailable',
  reason,
  segments: [],
})

export class YouTubeTranscriptClient {
  readonly #fetchTranscript: TranscriptFetcher

  constructor(fetchImplementation: TranscriptFetcher = fetchYouTubeTranscript) {
    this.#fetchTranscript = fetchImplementation
  }

  async fetch(videoId: string): Promise<YouTubeTranscriptResult> {
    let transcript: TranscriptResponse[]

    try {
      transcript = await this.#fetchTranscript(videoId)
    } catch (error) {
      if (error instanceof YoutubeTranscriptDisabledError) {
        return unavailable('disabled')
      }

      if (
        error instanceof YoutubeTranscriptNotAvailableError ||
        error instanceof YoutubeTranscriptNotAvailableLanguageError
      ) {
        return unavailable('not_available')
      }

      if (error instanceof YoutubeTranscriptTooManyRequestError) {
        return unavailable('rate_limited')
      }

      if (error instanceof YoutubeTranscriptVideoUnavailableError) {
        return unavailable('video_unavailable')
      }

      if (error instanceof YoutubeTranscriptError) {
        return unavailable('unknown')
      }

      if (error instanceof TypeError) {
        return unavailable('request_failed')
      }

      throw error
    }

    const segments = normalizeSegments(transcript)

    if (segments.length === 0) {
      return unavailable('not_available')
    }

    return {
      status: 'available',
      segments,
    }
  }
}
