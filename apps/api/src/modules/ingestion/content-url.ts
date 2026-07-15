import type { SourcePlatform } from '@reel2route/contracts'

const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/
const INSTAGRAM_SHORTCODE_PATTERN = /^[A-Za-z0-9_-]+$/

export type ParsedContentUrl = {
  platform: SourcePlatform
  externalId: string
  canonicalUrl: string
}

export class UnsupportedContentUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsupportedContentUrlError'
  }
}

const parseYouTubeVideoId = (url: URL): string | null => {
  const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
  const pathSegments = url.pathname.split('/').filter(Boolean)

  if (hostname === 'youtu.be') {
    return pathSegments[0] ?? null
  }

  if (hostname !== 'youtube.com' && hostname !== 'm.youtube.com') {
    return null
  }

  if (url.pathname === '/watch') {
    return url.searchParams.get('v')
  }

  if (pathSegments[0] === 'shorts' || pathSegments[0] === 'embed') {
    return pathSegments[1] ?? null
  }

  return null
}

const parseInstagramShortcode = (url: URL): string | null => {
  const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
  const pathSegments = url.pathname.split('/').filter(Boolean)

  if (hostname !== 'instagram.com') {
    return null
  }

  if (pathSegments[0] !== 'reel' && pathSegments[0] !== 'reels') {
    return null
  }

  return pathSegments[1] ?? null
}

export const parseContentUrl = (input: string): ParsedContentUrl => {
  let url: URL

  try {
    url = new URL(input)
  } catch {
    throw new UnsupportedContentUrlError('The content URL is invalid')
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new UnsupportedContentUrlError(
      'The content URL must use HTTP or HTTPS',
    )
  }

  const youtubeVideoId = parseYouTubeVideoId(url)

  if (youtubeVideoId !== null) {
    if (!YOUTUBE_VIDEO_ID_PATTERN.test(youtubeVideoId)) {
      throw new UnsupportedContentUrlError('The YouTube video ID is invalid')
    }

    return {
      platform: 'youtube',
      externalId: youtubeVideoId,
      canonicalUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
    }
  }

  const instagramShortcode = parseInstagramShortcode(url)

  if (instagramShortcode !== null) {
    if (!INSTAGRAM_SHORTCODE_PATTERN.test(instagramShortcode)) {
      throw new UnsupportedContentUrlError(
        'The Instagram Reel shortcode is invalid',
      )
    }

    return {
      platform: 'instagram',
      externalId: instagramShortcode,
      canonicalUrl: `https://www.instagram.com/reel/${instagramShortcode}/`,
    }
  }

  throw new UnsupportedContentUrlError(
    'Only YouTube videos and public Instagram Reels are supported',
  )
}
