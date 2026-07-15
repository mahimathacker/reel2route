import {
  costEstimateSchema,
  type CostEstimate,
  type PersonaId,
  type StopTourRecommendations,
  type TripPlan,
  type TripPreferences,
} from '@reel2route/contracts'

type PersonaRates = {
  domesticFlight: number
  internationalFlight: number
  accommodationNight: number
  foodDay: number
  activityStop: number
  transportDay: number
}

const RATES: Record<PersonaId, PersonaRates> = {
  budget_explorer: {
    domesticFlight: 12_000,
    internationalFlight: 45_000,
    accommodationNight: 3_500,
    foodDay: 2_500,
    activityStop: 1_000,
    transportDay: 1_200,
  },
  comfort_traveller: {
    domesticFlight: 20_000,
    internationalFlight: 70_000,
    accommodationNight: 10_000,
    foodDay: 5_500,
    activityStop: 3_000,
    transportDay: 3_500,
  },
  premium_escape: {
    domesticFlight: 35_000,
    internationalFlight: 120_000,
    accommodationNight: 28_000,
    foodDay: 12_000,
    activityStop: 7_500,
    transportDay: 10_000,
  },
}

const normalizeLocation = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const countryPart = (value: string) =>
  normalizeLocation(value.split(',').at(-1) ?? value)

type FlightBand = 'same_destination' | 'domestic' | 'international' | 'unknown'

const flightBand = (origin: string, destination: string | null): FlightBand => {
  if (destination === null) return 'unknown'
  if (normalizeLocation(origin) === normalizeLocation(destination)) {
    return 'same_destination'
  }
  return countryPart(origin) === countryPart(destination)
    ? 'domestic'
    : 'international'
}

const flightEstimate = (
  origin: string,
  destination: string | null,
  rates: PersonaRates,
) => {
  const band = flightBand(origin, destination)
  if (band === 'same_destination') return 0
  if (band === 'domestic') return rates.domesticFlight
  return rates.internationalFlight
}

const flightAssumption = (origin: string, destination: string | null) => {
  const band = flightBand(origin, destination)
  const labels: Record<FlightBand, string> = {
    same_destination: 'same destination; no flight added',
    domestic: 'domestic route band',
    international: 'international route band',
    unknown: 'unknown destination; conservative international route band',
  }
  return `${origin} → ${destination ?? 'unknown destination'} is treated as a ${labels[band]}. Dates, airports, baggage, and booking window are unknown.`
}

const roomShare = (groupType: TripPreferences['groupType']) =>
  groupType === 'solo' ? 1 : 2

export class CostService {
  estimate(
    plan: TripPlan,
    preferences: TripPreferences,
    destination: string | null,
    recommendations: StopTourRecommendations[] = [],
  ): CostEstimate {
    const rates = RATES[plan.persona.id]
    const nights = Math.max(0, preferences.days - 1)
    const stopCount = plan.days.reduce((total, day) => total + day.stops.length, 0)
    const selectedTourPrices = recommendations
      .map(({ tours }) =>
        tours.find(({ includedInEstimate }) => includedInEstimate)?.priceMinor,
      )
      .filter((price): price is number => price !== undefined)
    const unmatchedStops = Math.max(0, stopCount - selectedTourPrices.length)
    const activityCost =
      selectedTourPrices.reduce((total, price) => total + price, 0) +
      unmatchedStops * rates.activityStop
    const accommodation = Math.round(
      (rates.accommodationNight * nights) / roomShare(preferences.groupType),
    )
    const groupAssumption =
      preferences.groupType === 'solo'
        ? 'One traveller occupies one room.'
        : 'Accommodation is shared by two travellers; exact group size was not collected.'

    const lineItems = [
      {
        category: 'flights' as const,
        label: 'Indicative return flight',
        amountMinor: flightEstimate(preferences.origin, destination, rates),
        confidence: 'low' as const,
        assumption: flightAssumption(preferences.origin, destination),
      },
      {
        category: 'accommodation' as const,
        label: `${nights} nights of accommodation`,
        amountMinor: accommodation,
        confidence: 'medium' as const,
        assumption: `${plan.persona.accommodationStyle}. ${groupAssumption}`,
      },
      {
        category: 'activities' as const,
        label: `${stopCount} planned activities`,
        amountMinor: activityCost,
        confidence: selectedTourPrices.length === stopCount ? ('medium' as const) : ('low' as const),
        assumption: `${selectedTourPrices.length} stops use selected mock-tour prices; ${unmatchedStops} unmatched stops use a persona-level allowance.`,
      },
      {
        category: 'food' as const,
        label: `${preferences.days} days of food`,
        amountMinor: rates.foodDay * preferences.days,
        confidence: 'medium' as const,
        assumption: plan.persona.diningStyle,
      },
      {
        category: 'local_transport' as const,
        label: `${preferences.days} days of local transport`,
        amountMinor: rates.transportDay * preferences.days,
        confidence: 'medium' as const,
        assumption: plan.persona.transportStyle,
      },
    ]

    return costEstimateSchema.parse({
      currency: 'USD',
      lineItems,
      totalPerPersonMinor: lineItems.reduce(
        (total, item) => total + item.amountMinor,
        0,
      ),
      confidence: 'low',
      assumptions: [
        'All amounts are per person and stored in USD cents.',
        'Travel dates are unknown, so seasonal price changes are excluded.',
        groupAssumption,
      ],
    })
  }
}
