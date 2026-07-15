import {
  tourMatchedPlanSchema,
  type ItineraryStop,
  type TourMatchedPlan,
  type TourRecommendation,
  type TripPlan,
} from '@reel2route/contracts'

import type { TourCatalogueEntry } from './tour-catalogue.js'

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const scoreTour = (
  tour: TourCatalogueEntry,
  stop: ItineraryStop,
  plan: TripPlan,
) => {
  const exactPlace = tour.placeNames.some(
    (placeName) => normalize(placeName) === normalize(stop.name),
  )
  const category = tour.categories.includes(stop.category)
  if (!exactPlace && !category) return null

  return (
    (exactPlace ? 60 : 0) +
    (category ? 25 : 0) +
    (tour.personas.includes(plan.persona.id) ? 10 : 0) +
    (tour.budgetRange === plan.persona.activityPricePreference ? 5 : 0) +
    tour.rating
  )
}

export class TourMatcherService {
  constructor(private readonly catalogue: readonly TourCatalogueEntry[]) {}

  matchStop(stop: ItineraryStop, plan: TripPlan): TourRecommendation[] {
    return this.catalogue
      .map((tour) => ({ tour, score: scoreTour(tour, stop, plan) }))
      .filter(
        (candidate): candidate is { tour: TourCatalogueEntry; score: number } =>
          candidate.score !== null,
      )
      .sort((left, right) => right.score - left.score)
      .slice(0, 2)
      .map(({ tour }) => ({
        id: tour.id,
        title: tour.title,
        priceMinor: tour.priceMinor,
        currency: 'USD',
        durationMinutes: tour.durationMinutes,
        rating: tour.rating,
        source: 'mock',
        matchReason: tour.placeNames.some(
          (placeName) => normalize(placeName) === normalize(stop.name),
        )
          ? `Matches ${stop.name} and the ${plan.persona.name} profile.`
          : `Matches the ${stop.category} category and the ${plan.persona.name} profile.`,
      }))
  }

  matchPlan(plan: TripPlan): TourMatchedPlan {
    const recommendations = plan.days.flatMap((day) =>
      day.stops.map((stop) => ({
        day: day.day,
        placeId: stop.placeId,
        tours: this.matchStop(stop, plan),
      })),
    )
    const matchedStops = recommendations.filter(({ tours }) => tours.length > 0).length
    const bookabilityScore =
      recommendations.length === 0
        ? 0
        : Math.round((matchedStops / recommendations.length) * 100)

    return tourMatchedPlanSchema.parse({
      plan,
      recommendations,
      bookabilityScore,
    })
  }
}
