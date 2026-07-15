import { describe, expect, it, vi } from 'vitest'

import { InstagramMetadataClient } from '../src/modules/ingestion/instagram-metadata.client.js'

describe('InstagramMetadataClient', () => {
  it('extracts and decodes public Open Graph metadata', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        `<html><head>
          <meta content="Mahima on Instagram: &quot;Jaipur &amp; food&quot;" property="og:title">
          <meta property="og:description" content="A four-day Jaipur itinerary &amp; guide">
        </head></html>`,
        { status: 200 },
      ),
    )
    const client = new InstagramMetadataClient(fetchMock)

    await expect(
      client.fetch('https://www.instagram.com/reel/C8Example_1/'),
    ).resolves.toEqual({
      status: 'available',
      metadata: {
        title: 'Mahima on Instagram: "Jaipur & food"',
        caption: 'A four-day Jaipur itinerary & guide',
        author: 'Mahima',
      },
    })
  })

  it.each([
    { response: new Response('', { status: 404 }), reason: 'not_found' },
    { response: new Response('', { status: 429 }), reason: 'blocked' },
    { response: new Response('<html>Login</html>'), reason: 'blocked' },
  ])('returns $reason when metadata is unavailable', async ({ response, reason }) => {
    const client = new InstagramMetadataClient(
      vi.fn<typeof fetch>().mockResolvedValue(response),
    )

    await expect(client.fetch('https://instagram.com/reel/example/')).resolves.toEqual({
      status: 'unavailable',
      reason,
    })
  })

  it('converts network failures into an unavailable result', async () => {
    const client = new InstagramMetadataClient(
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError('network failed')),
    )

    await expect(client.fetch('https://instagram.com/reel/example/')).resolves.toEqual({
      status: 'unavailable',
      reason: 'request_failed',
    })
  })
})
