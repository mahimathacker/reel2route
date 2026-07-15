import type { SourceContent } from '@reel2route/contracts'
import express from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'

import { errorHandler } from '../src/middleware/error-handler.js'
import { UnsupportedContentUrlError } from '../src/modules/ingestion/content-url.js'
import { createIngestionRouter } from '../src/modules/ingestion/ingestion.router.js'
import { YouTubeVideoNotFoundError } from '../src/modules/ingestion/youtube-metadata.client.js'

const sourceContent: SourceContent = {
  platform: 'youtube',
  canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  externalId: 'dQw4w9WgXcQ',
  title: 'A weekend in Jaipur',
  description: 'Food, forts and hidden streets.',
  transcript: [],
  caption: null,
  locationTags: [],
  author: 'Reel2Route Fixture',
  publishedAt: '2026-01-10T08:30:00Z',
  unavailableFields: ['transcript', 'caption', 'location_tags'],
}

const createTestApp = (ingest: (url: string) => Promise<SourceContent>) => {
  const app = express()

  app.use(express.json())
  app.use('/api/ingestions', createIngestionRouter({ ingest }))

  app.use(errorHandler)

  return app
}

describe('createIngestionRouter', () => {
  it('validates the URL, delegates ingestion, and returns source content', async () => {
    const ingest = vi.fn().mockResolvedValue(sourceContent)
    const app = createTestApp(ingest)

    const response = await request(app)
      .post('/api/ingestions')
      .send({ url: '  https://youtu.be/dQw4w9WgXcQ  ' })
      .expect(200)

    expect(ingest).toHaveBeenCalledWith('https://youtu.be/dQw4w9WgXcQ')
    expect(response.body).toEqual(sourceContent)
  })

  it('rejects invalid request bodies before calling the service', async () => {
    const ingest = vi.fn().mockResolvedValue(sourceContent)
    const app = createTestApp(ingest)

    const response = await request(app)
      .post('/api/ingestions')
      .send({ url: 'not-a-url', unexpected: true })
      .expect(400)

    expect(response.body).toEqual({
      error: { code: 'INVALID_REQUEST', message: 'The request is invalid' },
    })
    expect(ingest).not.toHaveBeenCalled()
  })

  it.each([
    {
      error: new UnsupportedContentUrlError('Only supported links are allowed'),
      status: 422,
      code: 'UNSUPPORTED_CONTENT_URL',
      message: 'Only supported links are allowed',
    },
    {
      error: new YouTubeVideoNotFoundError('dQw4w9WgXcQ'),
      status: 404,
      code: 'VIDEO_NOT_FOUND',
      message: 'The YouTube video was not found',
    },
  ])('maps $code service failures', async ({ error, status, code, message }) => {
    const ingest = vi.fn().mockRejectedValue(error)
    const app = createTestApp(ingest)

    const response = await request(app)
      .post('/api/ingestions')
      .send({ url: 'https://youtu.be/dQw4w9WgXcQ' })
      .expect(status)

    expect(response.body).toEqual({ error: { code, message } })
  })
})
