import { env } from '../../config/env.js'
import { InstagramMetadataClient } from './instagram-metadata.client.js'
import { InstagramProvider } from './instagram.provider.js'
import { IngestionService } from './ingestion.service.js'
import { YouTubeMetadataClient } from './youtube-metadata.client.js'
import { YouTubeProvider } from './youtube.provider.js'
import { YouTubeTranscriptClient } from './youtube-transcript.client.js'

const youtubeMetadataClient = new YouTubeMetadataClient(env.YOUTUBE_API_KEY)
const youtubeTranscriptClient = new YouTubeTranscriptClient()
const youtubeProvider = new YouTubeProvider(
  youtubeMetadataClient,
  youtubeTranscriptClient,
)
const instagramProvider = new InstagramProvider(new InstagramMetadataClient())

export const ingestionService = new IngestionService([
  youtubeProvider,
  instagramProvider,
])
