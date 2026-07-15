import type { SourceContent } from '@reel2route/contracts'
import express, { type ErrorRequestHandler } from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { ZodError } from 'zod'

import { createIngestionRouter } from '../src/modules/ingestion/ingestion.router.js'

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

  const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    response.status(error instanceof ZodError ? 400 : 500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

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

    await request(app)
      .post('/api/ingestions')
      .send({ url: 'not-a-url', unexpected: true })
      .expect(400)

    expect(ingest).not.toHaveBeenCalled()
  })

  it('forwards asynchronous service failures to Express error handling', async () => {
    const ingest = vi.fn().mockRejectedValue(new Error('Provider unavailable'))
    const app = createTestApp(ingest)

    const response = await request(app)
      .post('/api/ingestions')
      .send({ url: 'https://youtu.be/dQw4w9WgXcQ' })
      .expect(500)

    expect(response.body).toEqual({ error: 'Provider unavailable' })
  })
})
