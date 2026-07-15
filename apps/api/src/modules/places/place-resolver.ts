import {
  resolvedPlaceSchema,
  type ConfidenceLevel,
  type ExtractedPlace,
  type ResolvedPlace,
} from '@reel2route/contracts'

import type { GooglePlace, GooglePlacesClient } from './google-places.client.js'

const PRICE_LEVELS: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
}

const normalize = (value: string) =>
  value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim()

const similarity = (expected: string, actual: string) => {
  const left = new Set(normalize(expected).split(' ').filter(Boolean))
  const right = new Set(normalize(actual).split(' ').filter(Boolean))
  const intersection = [...left].filter((token) => right.has(token)).length
  const union = new Set([...left, ...right]).size
  return union === 0 ? 0 : intersection / union
}

const confidenceFor = (score: number): ConfidenceLevel =>
  score >= 0.8 ? 'high' : score >= 0.5 ? 'medium' : 'low'

const alternativesFor = (places: GooglePlace[]) =>
  places.map((place) => ({
    placeId: place.id,
    displayName: place.displayName.text,
    formattedAddress: place.formattedAddress ?? null,
  }))

export class PlaceResolver {
  constructor(
    private readonly client: Pick<GooglePlacesClient, 'search'>,
  ) {}

  async resolve(
    source: ExtractedPlace,
    destinationGuess: string | null,
  ): Promise<ResolvedPlace> {
    const query = [source.name, destinationGuess].filter(Boolean).join(', ')
    const candidates = await this.client.search(query)

    if (candidates.length === 0) {
      return resolvedPlaceSchema.parse({
        source,
        status: 'not_found',
        resolutionConfidence: null,
        placeId: null,
        displayName: null,
        formattedAddress: null,
        latitude: null,
        longitude: null,
        primaryType: null,
        types: [],
        rating: null,
        priceLevel: null,
        googleMapsUri: null,
        alternatives: [],
      })
    }

    const ranked = candidates
      .map((place) => ({ place, score: similarity(source.name, place.displayName.text) }))
      .sort((left, right) => right.score - left.score)
    const best = ranked[0]
    if (best === undefined) throw new Error('Place ranking invariant failed')

    const runnerUpScore = ranked[1]?.score ?? 0
    const ambiguous = best.score < 0.5 || best.score - runnerUpScore < 0.15

    if (ambiguous) {
      return resolvedPlaceSchema.parse({
        source,
        status: 'ambiguous',
        resolutionConfidence: 'low',
        placeId: null,
        displayName: null,
        formattedAddress: null,
        latitude: null,
        longitude: null,
        primaryType: null,
        types: [],
        rating: null,
        priceLevel: null,
        googleMapsUri: null,
        alternatives: alternativesFor(ranked.map(({ place }) => place)),
      })
    }

    const place = best.place
    return resolvedPlaceSchema.parse({
      source,
      status: 'resolved',
      resolutionConfidence: confidenceFor(best.score),
      placeId: place.id,
      displayName: place.displayName.text,
      formattedAddress: place.formattedAddress ?? null,
      latitude: place.location.latitude,
      longitude: place.location.longitude,
      primaryType: place.primaryType ?? null,
      types: place.types,
      rating: place.rating ?? null,
      priceLevel: place.priceLevel === undefined ? null : PRICE_LEVELS[place.priceLevel],
      googleMapsUri: place.googleMapsUri ?? null,
      alternatives: [],
    })
  }

  async resolveAll(
    places: ExtractedPlace[],
    destinationGuess: string | null,
  ): Promise<ResolvedPlace[]> {
    const resolved: ResolvedPlace[] = []

    for (let index = 0; index < places.length; index += 5) {
      resolved.push(
        ...(await Promise.all(
          places
            .slice(index, index + 5)
            .map((place) => this.resolve(place, destinationGuess)),
        )),
      )
    }

    return resolved
  }
}
