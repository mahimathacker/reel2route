import {
  tripPlanSchema,
  type ContentAnalysis,
  type ExtractedActivity,
  type PersonaId,
  type ResolvedPlace,
  type TripPlan,
  type TripPreferences,
} from '@reel2route/contracts'

import type { PersonaService } from '../persona/persona.service.js'

type SchedulablePlace = ResolvedPlace & {
  status: 'resolved'
  placeId: string
  displayName: string
  latitude: number
  longitude: number
}

const isSchedulable = (place: ResolvedPlace): place is SchedulablePlace =>
  place.status === 'resolved' &&
  place.placeId !== null &&
  place.displayName !== null &&
  place.latitude !== null &&
  place.longitude !== null

const preferenceScore = (place: SchedulablePlace, persona: PersonaId) => {
  const rating = place.rating ?? 3.5
  const price = place.priceLevel ?? 2

  if (persona === 'budget_explorer') return rating * 10 - price * 8
  if (persona === 'premium_escape') return rating * 14 + price * 3
  return rating * 12 - Math.abs(price - 2) * 4
}

const distance = (left: SchedulablePlace, right: SchedulablePlace) => {
  const latitudeKm = (left.latitude - right.latitude) * 111
  const longitudeKm =
    (left.longitude - right.longitude) *
    111 *
    Math.cos(((left.latitude + right.latitude) / 2) * (Math.PI / 180))
  return Math.hypot(latitudeKm, longitudeKm)
}

const orderByProximity = (ranked: SchedulablePlace[]) => {
  const [first, ...remaining] = ranked
  if (first === undefined) return []

  const ordered = [first]
  const pending = [...remaining]

  while (pending.length > 0) {
    const current = ordered[ordered.length - 1]
    if (current === undefined) break
    let closestIndex = 0

    for (let index = 1; index < pending.length; index += 1) {
      if (
        distance(current, pending[index] as SchedulablePlace) <
        distance(current, pending[closestIndex] as SchedulablePlace)
      ) {
        closestIndex = index
      }
    }

    const [closest] = pending.splice(closestIndex, 1)
    if (closest !== undefined) ordered.push(closest)
  }

  return ordered
}

const activityFor = (
  place: SchedulablePlace,
  activities: ExtractedActivity[],
) => {
  const normalizedName = place.source.name.toLowerCase()
  return (
    activities.find(
      (activity) => activity.placeName?.toLowerCase() === normalizedName,
    )?.name ?? null
  )
}

const durationFor = (persona: PersonaId) =>
  persona === 'premium_escape' ? 150 : persona === 'comfort_traveller' ? 120 : 90

const themeFor = (places: SchedulablePlace[]) => {
  const categories = [...new Set(places.map(({ source }) => source.category))]
  return categories.length === 0
    ? 'A flexible day to explore locally'
    : categories.slice(0, 2).join(' & ')
}

export class ItineraryService {
  constructor(
    private readonly personaService: Pick<PersonaService, 'generate'>,
  ) {}

  generate(
    analysis: ContentAnalysis,
    preferences: TripPreferences,
  ): TripPlan[] {
    const schedulable = analysis.resolvedPlaces.filter(isSchedulable)

    return this.personaService.generate(preferences).map((persona) => {
      const ranked = [...schedulable].sort(
        (left, right) =>
          preferenceScore(right, persona.id) - preferenceScore(left, persona.id),
      )
      const selected = ranked.slice(0, persona.dailyStopTarget * preferences.days)
      const ordered = orderByProximity(selected)
      const selectedIds = new Set(ordered.map(({ placeId }) => placeId))

      return tripPlanSchema.parse({
        persona,
        title: `${persona.name}: ${analysis.extraction.destinationGuess ?? 'Reel-inspired escape'}`,
        summary: `${persona.summary} Stops are selected from validated reel references and ordered to reduce unnecessary travel.`,
        days: Array.from({ length: preferences.days }, (_, dayIndex) => {
          const start = dayIndex * persona.dailyStopTarget
          const dayPlaces = ordered.slice(start, start + persona.dailyStopTarget)

          return {
            day: dayIndex + 1,
            theme: themeFor(dayPlaces),
            paceNote: `${dayPlaces.length} planned stops for a ${preferences.pace} day, aligned with the ${persona.name} profile.`,
            stops: dayPlaces.map((place, stopIndex) => ({
              order: stopIndex + 1,
              placeId: place.placeId,
              name: place.displayName,
              category: place.source.category,
              latitude: place.latitude,
              longitude: place.longitude,
              suggestedActivity: activityFor(place, analysis.extraction.activities),
              durationMinutes: durationFor(persona.id),
              reason: `${place.source.context} Included for its ${place.source.confidence} source confidence and ${persona.name} fit.`,
              evidence: place.source.evidence,
            })),
          }
        }),
        unscheduledPlaces: analysis.resolvedPlaces
          .filter(
            (place) =>
              place.placeId === null || !selectedIds.has(place.placeId),
          )
          .map(({ source }) => source.name),
      })
    })
  }
}
