import { z } from 'zod'

const googlePlaceSchema = z.object({
  id: z.string().min(1),
  displayName: z.object({ text: z.string().min(1) }),
  formattedAddress: z.string().min(1).optional(),
  location: z.object({ latitude: z.number(), longitude: z.number() }),
  primaryType: z.string().min(1).optional(),
  types: z.array(z.string()).default([]),
  rating: z.number().min(0).max(5).optional(),
  priceLevel: z
    .enum([
      'PRICE_LEVEL_FREE',
      'PRICE_LEVEL_INEXPENSIVE',
      'PRICE_LEVEL_MODERATE',
      'PRICE_LEVEL_EXPENSIVE',
      'PRICE_LEVEL_VERY_EXPENSIVE',
    ])
    .optional(),
  googleMapsUri: z.url().optional(),
})

const responseSchema = z.object({
  places: z.array(googlePlaceSchema).default([]),
})

export type GooglePlace = z.infer<typeof googlePlaceSchema>

export class GooglePlacesRequestError extends Error {
  constructor(readonly status: number) {
    super(`Google Places request failed with status ${status}`)
    this.name = 'GooglePlacesRequestError'
  }
}

export class GooglePlacesResponseError extends Error {
  constructor() {
    super('Google Places returned an invalid response')
    this.name = 'GooglePlacesResponseError'
  }
}

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.primaryType',
  'places.types',
  'places.rating',
  'places.priceLevel',
  'places.googleMapsUri',
].join(',')

export class GooglePlacesClient {
  readonly #apiKey: string
  readonly #fetch: typeof globalThis.fetch

  constructor(apiKey: string, fetchImplementation = globalThis.fetch) {
    this.#apiKey = apiKey.trim()
    this.#fetch = fetchImplementation
  }

  async search(textQuery: string): Promise<GooglePlace[]> {
    const response = await this.#fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': this.#apiKey,
          'x-goog-fieldmask': FIELD_MASK,
        },
        body: JSON.stringify({ textQuery, pageSize: 3 }),
        signal: AbortSignal.timeout(10_000),
      },
    )

    if (!response.ok) throw new GooglePlacesRequestError(response.status)

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new GooglePlacesResponseError()
    }

    const result = responseSchema.safeParse(payload)
    if (!result.success) throw new GooglePlacesResponseError()

    return result.data.places
  }
}
