import type { TripPlan } from '@reel2route/contracts'
import { beforeAll, describe, expect, it } from 'vitest'

import { PersonaService } from '../src/modules/persona/persona.service.js'
import {
  loadTourCatalogue,
  type TourCatalogueEntry,
} from '../src/modules/tours/tour-catalogue.js'
import { TourMatcherService } from '../src/modules/tours/tour-matcher.service.js'

let catalogue: TourCatalogueEntry[]

beforeAll(async () => {
  catalogue = await loadTourCatalogue()
})

const plan = (): TripPlan => ({
  persona: new PersonaService().generate({
    origin: 'Mumbai, India',
    days: 1,
    budgetRange: 'moderate',
    groupType: 'couple',
    pace: 'balanced',
  })[1]!,
  title: 'Comfort Jaipur',
  summary: 'A comfortable heritage day.',
  days: [
    {
      day: 1,
      theme: 'Heritage',
      paceNote: 'Two balanced stops',
      stops: [
        {
          order: 1,
          placeId: 'city-palace',
          name: 'City Palace',
          category: 'landmark',
          latitude: 26.9258,
          longitude: 75.8237,
          suggestedActivity: null,
          durationMinutes: 120,
          reason: 'From the reel.',
          evidence: [{ source: 'title', text: 'City Palace', timestampSeconds: null }],
        },
        {
          order: 2,
          placeId: 'unknown-hotel',
          name: 'Unknown Hotel',
          category: 'other',
          latitude: 26.92,
          longitude: 75.82,
          suggestedActivity: null,
          durationMinutes: 60,
          reason: 'From the reel.',
          evidence: [{ source: 'title', text: 'Unknown Hotel', timestampSeconds: null }],
        },
      ],
    },
  ],
  unscheduledPlaces: [],
})

describe('TourMatcherService', () => {
  it('loads a realistic catalogue in the assignment range', () => {
    expect(catalogue.length).toBeGreaterThanOrEqual(20)
    expect(catalogue.length).toBeLessThanOrEqual(30)
  })

  it('prioritises exact place and persona matches', () => {
    const result = new TourMatcherService(catalogue).matchPlan(plan())
    const cityPalaceTours = result.recommendations[0]?.tours

    expect(cityPalaceTours).toHaveLength(2)
    expect(cityPalaceTours?.[0]?.id).toBe('jai-city-palace-heritage')
    expect(cityPalaceTours?.every(({ source }) => source === 'mock')).toBe(true)
    expect(result.bookabilityScore).toBe(50)
  })

  it('returns at most two recommendations per stop', () => {
    const result = new TourMatcherService(catalogue).matchPlan(plan())
    expect(result.recommendations.every(({ tours }) => tours.length <= 2)).toBe(
      true,
    )
  })
})
