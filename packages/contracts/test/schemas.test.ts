import { describe, expect, it } from 'vitest'

import {
  ingestContentRequestSchema,
  sourceEvidenceSchema,
  transcriptSegmentSchema,
} from '../src/schemas.js'

describe('ingestContentRequestSchema', () => {
  it('trims and accepts a valid URL', () => {
    const result = ingestContentRequestSchema.parse({
      url: '  https://www.youtube.com/watch?v=abc123  ',
    })

    expect(result.url).toBe('https://www.youtube.com/watch?v=abc123')
  })

  it('rejects invalid URLs and unexpected fields', () => {
    expect(
      ingestContentRequestSchema.safeParse({
        url: 'not-a-url',
      }).success,
    ).toBe(false)

    expect(
      ingestContentRequestSchema.safeParse({
        url: 'https://www.youtube.com/watch?v=abc123',
        userId: 'unexpected',
      }).success,
    ).toBe(false)
  })
})

describe('sourceEvidenceSchema', () => {
  it('accepts transcript evidence with a timestamp', () => {
    const result = sourceEvidenceSchema.parse({
      source: 'transcript',
      text: 'Start the morning at Jaipur City Palace',
      timestampSeconds: 84,
    })

    expect(result.timestampSeconds).toBe(84)
  })

  it('rejects fields outside the contract', () => {
    const result = sourceEvidenceSchema.safeParse({
      source: 'caption',
      text: 'City Palace, Jaipur',
      inventedPlaceId: 'fake-id',
    })

    expect(result.success).toBe(false)
  })
})

describe('transcriptSegmentSchema', () => {
  it('rejects infinite and negative timestamps', () => {
    expect(
      transcriptSegmentSchema.safeParse({
        text: 'City Palace',
        startSeconds: Number.POSITIVE_INFINITY,
      }).success,
    ).toBe(false)

    expect(
      transcriptSegmentSchema.safeParse({
        text: 'City Palace',
        startSeconds: -1,
      }).success,
    ).toBe(false)
  })
})
