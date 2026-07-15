import type { ContentAnalysis, ResolvedPlace } from '@reel2route/contracts'
import { describe, expect, it } from 'vitest'

import { ItineraryService } from '../src/modules/itinerary/itinerary.service.js'
import { PersonaService } from '../src/modules/persona/persona.service.js'

const resolvedPlace = (
  id: string,
  name: string,
  latitude: number,
  longitude: number,
  rating: number,
): ResolvedPlace => ({
  source: {
    name,
    category: 'landmark',
    role: 'independent_place',
    parentPlaceName: null,
    context: `${name} appears in the reel`,
    evidence: [{ source: 'transcript', text: name, timestampSeconds: 10 }],
    confidence: 'high',
    mentionCount: 1,
  },
  status: 'resolved',
  resolutionConfidence: 'high',
  placeId: id,
  displayName: name,
  formattedAddress: 'Jaipur, India',
  latitude,
  longitude,
  primaryType: 'historical_landmark',
  types: ['historical_landmark'],
  rating,
  priceLevel: 2,
  googleMapsUri: null,
  alternatives: [],
})

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
    unavailableFields: ['description', 'transcript', 'caption', 'location_tags', 'author', 'published_at'],
  },
  extraction: {
    destinationGuess: 'Jaipur, India',
    places: [],
    activities: [
      {
        name: 'Guided palace visit',
        placeName: 'City Palace',
        evidence: [{ source: 'transcript', text: 'palace tour', timestampSeconds: 10 }],
        confidence: 'high',
      },
    ],
    vibes: ['heritage'],
    missingInformation: [],
  },
  resolvedPlaces: [
    resolvedPlace('city', 'City Palace', 26.9258, 75.8237, 4.5),
    resolvedPlace('hawa', 'Hawa Mahal', 26.9239, 75.8267, 4.4),
    resolvedPlace('amber', 'Amber Fort', 26.9855, 75.8513, 4.6),
  ],
}

describe('ItineraryService', () => {
  it('creates three evidence-backed day-wise plans', () => {
    const plans = new ItineraryService(new PersonaService()).generate(analysis, {
      origin: 'Mumbai, India',
      days: 2,
      budgetRange: 'moderate',
      groupType: 'couple',
      pace: 'balanced',
    })

    expect(plans).toHaveLength(3)
    expect(plans.every(({ days }) => days.length === 2)).toBe(true)
    expect(plans[0]?.days[0]?.stops[0]?.evidence).toHaveLength(1)
    expect(
      plans.flatMap(({ days }) => days.flatMap(({ stops }) => stops))
        .find(({ name }) => name === 'City Palace')?.suggestedActivity,
    ).toBe('Guided palace visit')
  })

  it('orders nearby stops together and retains unresolved places', () => {
    const unresolved: ResolvedPlace = {
      ...resolvedPlace('unknown', 'Hidden Stepwell', 0, 0, 3),
      status: 'not_found',
      resolutionConfidence: null,
      placeId: null,
      displayName: null,
      latitude: null,
      longitude: null,
      primaryType: null,
      types: [],
      rating: null,
      priceLevel: null,
    }
    const plans = new ItineraryService(new PersonaService()).generate(
      { ...analysis, resolvedPlaces: [...analysis.resolvedPlaces, unresolved] },
      {
        origin: 'Delhi, India',
        days: 1,
        budgetRange: 'budget',
        groupType: 'solo',
        pace: 'relaxed',
      },
    )

    expect(plans[0]?.days[0]?.stops.slice(0, 2).map(({ name }) => name)).toEqual([
      'Amber Fort',
      'City Palace',
    ])
    expect(plans.every(({ unscheduledPlaces }) =>
      unscheduledPlaces.includes('Hidden Stepwell'),
    )).toBe(true)
  })
})
