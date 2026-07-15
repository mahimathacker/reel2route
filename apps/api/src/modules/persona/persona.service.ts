import {
  personaProfileSchema,
  type PersonaId,
  type PersonaProfile,
  type TripPreferences,
} from '@reel2route/contracts'

type PersonaDefinition = Omit<PersonaProfile, 'fitScore' | 'reason' | 'dailyStopTarget'> & {
  baseStops: number
}

const DEFINITIONS: readonly PersonaDefinition[] = [
  {
    id: 'budget_explorer',
    name: 'Budget Explorer',
    summary: 'Prioritises authentic experiences and value over convenience.',
    accommodationStyle: 'Well-reviewed hostels, guesthouses, or simple hotels',
    transportStyle: 'Public transport, walking, and shared rides',
    diningStyle: 'Local eateries, markets, and affordable regional food',
    activityPricePreference: 'budget',
    baseStops: 5,
  },
  {
    id: 'comfort_traveller',
    name: 'Comfort Traveller',
    summary: 'Balances memorable experiences with time, rest, and convenience.',
    accommodationStyle: 'Reliable mid-range hotels in convenient areas',
    transportStyle: 'A practical mix of cabs, walking, and public transport',
    diningStyle: 'A mix of trusted local restaurants and casual discoveries',
    activityPricePreference: 'moderate',
    baseStops: 4,
  },
  {
    id: 'premium_escape',
    name: 'Premium Escape',
    summary: 'Optimises for privacy, service quality, and standout experiences.',
    accommodationStyle: 'Boutique or luxury stays with strong service',
    transportStyle: 'Private transfers and pre-arranged transport',
    diningStyle: 'Destination dining and highly rated premium restaurants',
    activityPricePreference: 'premium',
    baseStops: 3,
  },
]

const BUDGET_COMPATIBILITY: Record<TripPreferences['budgetRange'], Record<PersonaId, number>> = {
  budget: { budget_explorer: 50, comfort_traveller: 30, premium_escape: 12 },
  moderate: { budget_explorer: 28, comfort_traveller: 50, premium_escape: 28 },
  premium: { budget_explorer: 12, comfort_traveller: 30, premium_escape: 50 },
}

const GROUP_COMPATIBILITY: Record<TripPreferences['groupType'], Record<PersonaId, number>> = {
  solo: { budget_explorer: 25, comfort_traveller: 18, premium_escape: 12 },
  couple: { budget_explorer: 16, comfort_traveller: 22, premium_escape: 25 },
  friends: { budget_explorer: 23, comfort_traveller: 20, premium_escape: 12 },
  family: { budget_explorer: 12, comfort_traveller: 25, premium_escape: 18 },
}

const PACE_COMPATIBILITY: Record<TripPreferences['pace'], Record<PersonaId, number>> = {
  relaxed: { budget_explorer: 12, comfort_traveller: 22, premium_escape: 25 },
  balanced: { budget_explorer: 20, comfort_traveller: 25, premium_escape: 18 },
  packed: { budget_explorer: 25, comfort_traveller: 20, premium_escape: 12 },
}

const preferenceMatch = (persona: PersonaId, preferences: TripPreferences) =>
  BUDGET_COMPATIBILITY[preferences.budgetRange][persona] +
  GROUP_COMPATIBILITY[preferences.groupType][persona] +
  PACE_COMPATIBILITY[preferences.pace][persona]

const stopTarget = (base: number, pace: TripPreferences['pace']) =>
  Math.min(7, Math.max(2, base + (pace === 'packed' ? 1 : pace === 'relaxed' ? -1 : 0)))

const reasonFor = (
  definition: PersonaDefinition,
  preferences: TripPreferences,
) =>
  `${definition.name} adapts the ${preferences.days}-day trip for ${preferences.groupType} travellers with a ${preferences.pace} pace, using ${definition.transportStyle.toLowerCase()} and ${definition.accommodationStyle.toLowerCase()}.`

export class PersonaService {
  generate(preferences: TripPreferences): PersonaProfile[] {
    return DEFINITIONS.map((definition) =>
      personaProfileSchema.parse({
        id: definition.id,
        name: definition.name,
        summary: definition.summary,
        accommodationStyle: definition.accommodationStyle,
        transportStyle: definition.transportStyle,
        diningStyle: definition.diningStyle,
        activityPricePreference: definition.activityPricePreference,
        dailyStopTarget: stopTarget(definition.baseStops, preferences.pace),
        fitScore: preferenceMatch(definition.id, preferences),
        reason: reasonFor(definition, preferences),
      }),
    )
  }
}
