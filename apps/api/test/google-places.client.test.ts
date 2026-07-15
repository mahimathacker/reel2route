import { describe, expect, it, vi } from 'vitest'

import {
  GooglePlacesClient,
  GooglePlacesResponseError,
} from '../src/modules/places/google-places.client.js'

describe('GooglePlacesClient', () => {
  it('uses Text Search New with a bounded result set and explicit field mask', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        places: [
          {
            id: 'city-palace-id',
            displayName: { text: 'City Palace' },
            formattedAddress: 'Jaipur, Rajasthan, India',
            location: { latitude: 26.9258, longitude: 75.8237 },
            types: ['historical_landmark'],
            rating: 4.5,
            priceLevel: 'PRICE_LEVEL_MODERATE',
          },
        ],
      }),
    )
    const client = new GooglePlacesClient('maps-key', fetchMock)

    const result = await client.search('City Palace, Jaipur')

    expect(result).toHaveLength(1)
    const [url, options] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('https://places.googleapis.com/v1/places:searchText')
    expect(options).toMatchObject({ method: 'POST' })
    expect(typeof options?.body).toBe('string')
    expect(JSON.parse(options?.body as string)).toEqual({
      textQuery: 'City Palace, Jaipur',
      pageSize: 3,
    })
    expect(new Headers(options?.headers).get('x-goog-fieldmask')).toContain(
      'places.priceLevel',
    )
  })

  it('rejects failed and malformed Google responses', async () => {
    const failed = new GooglePlacesClient(
      'key',
      vi.fn<typeof fetch>().mockResolvedValue(
        Response.json(
          {
            error: {
              status: 'RESOURCE_EXHAUSTED',
              message: 'Quota exceeded for this project.',
            },
          },
          { status: 429 },
        ),
      ),
    )
    const malformed = new GooglePlacesClient(
      'key',
      vi.fn<typeof fetch>().mockResolvedValue(Response.json({ places: [{}] })),
    )

    await expect(failed.search('query')).rejects.toMatchObject({
      status: 429,
      providerStatus: 'RESOURCE_EXHAUSTED',
      providerMessage: 'Quota exceeded for this project.',
    })
    await expect(malformed.search('query')).rejects.toBeInstanceOf(
      GooglePlacesResponseError,
    )
  })
})
