export type InstagramMetadata = {
  title: string | null
  caption: string | null
  author: string | null
}

export type InstagramMetadataResult =
  | { status: 'available'; metadata: InstagramMetadata }
  | { status: 'unavailable'; reason: 'blocked' | 'not_found' | 'request_failed' }

const decodeHtml = (value: string) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')

const readAttribute = (element: string, name: string) => {
  const match = element.match(
    new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'),
  )

  return match?.[1] ?? match?.[2] ?? null
}

const readMeta = (html: string, key: string) => {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const element = match[0]
    const property =
      readAttribute(element, 'property') ?? readAttribute(element, 'name')

    if (property?.toLowerCase() === key.toLowerCase()) {
      const content = readAttribute(element, 'content')?.trim()
      return content === undefined || content.length === 0
        ? null
        : decodeHtml(content)
    }
  }

  return null
}

const inferAuthor = (title: string | null) => {
  if (title === null) return null

  const match = title.match(/^(.+?)\s+on Instagram(?::|$)/i)
  return match?.[1]?.trim() || null
}

export class InstagramMetadataClient {
  readonly #fetch: typeof globalThis.fetch

  constructor(fetchImplementation: typeof globalThis.fetch = globalThis.fetch) {
    this.#fetch = fetchImplementation
  }

  async fetch(canonicalUrl: string): Promise<InstagramMetadataResult> {
    let response: Response

    try {
      response = await this.#fetch(canonicalUrl, {
        headers: {
          'user-agent':
            'Mozilla/5.0 (compatible; Reel2Route/0.1; public metadata fetch)',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(10_000),
      })
    } catch {
      return { status: 'unavailable', reason: 'request_failed' }
    }

    if (response.status === 404) {
      return { status: 'unavailable', reason: 'not_found' }
    }

    if (!response.ok) {
      return { status: 'unavailable', reason: 'blocked' }
    }

    let html: string

    try {
      html = await response.text()
    } catch {
      return { status: 'unavailable', reason: 'request_failed' }
    }

    const title = readMeta(html, 'og:title')
    const caption =
      readMeta(html, 'og:description') ?? readMeta(html, 'description')
    const author = inferAuthor(title)

    if (title === null && caption === null) {
      return { status: 'unavailable', reason: 'blocked' }
    }

    return {
      status: 'available',
      metadata: { title, caption, author },
    }
  }
}
