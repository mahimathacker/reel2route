import { describe, expect, it } from 'vitest'

import {
  parseContentUrl,
  UnsupportedContentUrlError,
} from '../src/modules/ingestion/content-url.js'

const youtubeVideoId = 'dQw4w9WgXcQ'

describe('parseContentUrl', () => {
  it.each([
    `https://www.youtube.com/watch?v=${youtubeVideoId}`,
    `https://youtu.be/${youtubeVideoId}?t=20`,
    `https://m.youtube.com/shorts/${youtubeVideoId}?feature=share`,
    `https://youtube.com/embed/${youtubeVideoId}`,
  ])('normalizes the supported YouTube URL %s', (url) => {
    expect(parseContentUrl(url)).toEqual({
      platform: 'youtube',
      externalId: youtubeVideoId,
      canonicalUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
    })
  })

  it.each([
    'https://www.instagram.com/reel/C8Example_1/?igsh=tracking',
    'https://instagram.com/reels/C8Example_1/',
  ])('normalizes the supported Instagram Reel URL %s', (url) => {
    expect(parseContentUrl(url)).toEqual({
      platform: 'instagram',
      externalId: 'C8Example_1',
      canonicalUrl: 'https://www.instagram.com/reel/C8Example_1/',
    })
  })

  it.each([
    'not-a-url',
    `ftp://youtube.com/watch?v=${youtubeVideoId}`,
    'https://youtube.com/watch?v=short',
    'https://instagram.com/p/C8Example_1/',
    `https://youtube.example.com/watch?v=${youtubeVideoId}`,
  ])('rejects the unsupported content URL %s', (url) => {
    expect(() => parseContentUrl(url)).toThrow(UnsupportedContentUrlError)
  })
})
