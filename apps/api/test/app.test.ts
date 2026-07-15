import type { SourceContent } from '@reel2route/contracts'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'

import { createApp } from '../src/app.js'

const unusedAnalysisService = { analyze: vi.fn() }
const unusedPlanningService = { create: vi.fn(), get: vi.fn() }

const sourceContent: SourceContent = {
  platform: 'youtube',
  canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  externalId: 'dQw4w9WgXcQ',
  title: 'Jaipur in four days',
  description: null,
  transcript: [],
  caption: null,
  locationTags: [],
  author: null,
  publishedAt: null,
  unavailableFields: [
    'description',
    'transcript',
    'caption',
    'location_tags',
    'author',
    'published_at',
  ],
}

describe('createApp', () => {
  it('serves health information without exposing Express', async () => {
    const app = createApp({
      analysisService: unusedAnalysisService,
      ingestionService: { ingest: vi.fn() },
      planningService: unusedPlanningService,
      webOrigin: 'http://localhost:5173',
    })

    const response = await request(app).get('/api/health').expect(200)

    expect(response.body).toEqual({ status: 'ok', service: 'reel2route-api' })
    expect(response.headers['x-powered-by']).toBeUndefined()
  })

  it('mounts the ingestion workflow at the public API path', async () => {
    const ingest = vi.fn().mockResolvedValue(sourceContent)
    const app = createApp({
      analysisService: unusedAnalysisService,
      ingestionService: { ingest },
      planningService: unusedPlanningService,
      webOrigin: 'http://localhost:5173',
    })

    const response = await request(app)
      .post('/api/ingestions')
      .send({ url: 'https://youtu.be/dQw4w9WgXcQ' })
      .expect(200)

    expect(ingest).toHaveBeenCalledWith('https://youtu.be/dQw4w9WgXcQ')
    expect(response.body).toEqual(sourceContent)
  })

  it('mounts the complete analysis workflow', async () => {
    const analysis = {
      source: sourceContent,
      extraction: {
        destinationGuess: 'Jaipur, India',
        places: [],
        activities: [],
        vibes: ['heritage'],
        missingInformation: [],
      },
      resolvedPlaces: [],
    }
    const analyze = vi.fn().mockResolvedValue(analysis)
    const app = createApp({
      analysisService: { analyze },
      ingestionService: { ingest: vi.fn() },
      planningService: unusedPlanningService,
      webOrigin: 'http://localhost:5173',
    })

    const response = await request(app)
      .post('/api/analyses')
      .send({ url: 'https://youtu.be/dQw4w9WgXcQ' })
      .expect(200)

    expect(analyze).toHaveBeenCalledWith('https://youtu.be/dQw4w9WgXcQ')
    expect(response.body).toEqual(analysis)
  })

  it('mounts the final trip-planning workflow', async () => {
    const create = vi.fn().mockResolvedValue({ analysis: {}, options: [] })
    const app = createApp({
      analysisService: unusedAnalysisService,
      ingestionService: { ingest: vi.fn() },
      planningService: { create, get: vi.fn() },
      webOrigin: 'http://localhost:5173',
    })
    const preferences = {
      origin: 'Mumbai, India',
      days: 4,
      budgetRange: 'moderate',
      groupType: 'couple',
      pace: 'balanced',
    }

    await request(app)
      .post('/api/trips')
      .send({ url: 'https://youtu.be/dQw4w9WgXcQ', preferences })
      .expect(200)

    expect(create).toHaveBeenCalledWith(
      'https://youtu.be/dQw4w9WgXcQ',
      preferences,
    )
  })
})
