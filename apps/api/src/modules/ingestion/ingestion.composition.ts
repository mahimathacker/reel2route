import { env } from '../../config/env.js'
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

export const ingestionService = new IngestionService([youtubeProvider])
