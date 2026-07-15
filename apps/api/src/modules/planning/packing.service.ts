import {
  packingSuggestionSchema,
  type PackingSuggestion,
  type TripPreferences,
} from '@reel2route/contracts'

export class PackingService {
  suggest(preferences: TripPreferences): PackingSuggestion {
    const luggage =
      preferences.days <= 3
        ? 'Cabin backpack or compact cabin trolley'
        : preferences.days <= 7
          ? 'Cabin trolley plus a lightweight day backpack'
          : 'Checked suitcase plus a lightweight day backpack'
    const groupEssential =
      preferences.groupType === 'family'
        ? 'Shared medicines and family documents pouch'
        : preferences.groupType === 'solo'
          ? 'Portable charger and backup payment method'
          : 'Shared document wallet and portable charger'

    return packingSuggestionSchema.parse({
      luggage,
      essentials: [
        'Comfortable walking shoes',
        'Weather-appropriate layers',
        'Reusable water bottle',
        groupEssential,
      ],
      reason: `This luggage setup suits a ${preferences.days}-day, ${preferences.pace}-pace trip for ${preferences.groupType} travellers without unnecessary baggage.`,
    })
  }
}
