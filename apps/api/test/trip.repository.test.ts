import type { ContentAnalysis, TripPreferences } from '@reel2route/contracts'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CostService } from '../src/modules/cost/cost.service.js'
import { ItineraryService } from '../src/modules/itinerary/itinerary.service.js'
import { PersonaService } from '../src/modules/persona/persona.service.js'
import { PackingService } from '../src/modules/planning/packing.service.js'
import {
  PlanningService,
  TripNotFoundError,
} from '../src/modules/planning/planning.service.js'
import {
  openTripDatabase,
  TripRepository,
} from '../src/modules/planning/trip.repository.js'
import { TourMatcherService } from '../src/modules/tours/tour-matcher.service.js'

const analysis: ContentAnalysis = {
  source: {
    platform: 'youtube',
    canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    externalId: 'dQw4w9WgXcQ',
    title: 'Jaipur guide',
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
  },
  extraction: {
    destinationGuess: 'Jaipur, India',
    places: [],
    activities: [],
    vibes: ['heritage'],
    missingInformation: [],
  },
  resolvedPlaces: [],
}

const preferences: TripPreferences = {
  origin: 'Mumbai, India',
  days: 2,
  budgetRange: 'moderate',
  groupType: 'couple',
  pace: 'balanced',
}

let repository: TripRepository | undefined

afterEach(() => {
  repository?.close()
  repository = undefined
})

const createService = () => {
  repository = new TripRepository(openTripDatabase(':memory:'))
  return new PlanningService(
    { analyze: vi.fn().mockResolvedValue(analysis) },
    new ItineraryService(new PersonaService()),
    new TourMatcherService([]),
    new CostService(),
    new PackingService(),
    repository,
  )
}

describe('TripRepository integration', () => {
  it('persists and restores a complete generated trip', async () => {
    const service = createService()
    const created = await service.create(
      'https://youtu.be/dQw4w9WgXcQ',
      preferences,
    )

    expect(created.tripId).toMatch(/^[0-9a-f-]{36}$/)
    expect(created.options).toHaveLength(3)
    expect(service.get(created.tripId)).toEqual(created)
  })

  it('raises a domain error for a missing trip', () => {
    const service = createService()

    expect(() =>
      service.get('00000000-0000-4000-8000-000000000000'),
    ).toThrow(TripNotFoundError)
  })
})
