import { env } from '../../config/env.js'
import { OpenAIContentExtractor } from '../extraction/openai-content.extractor.js'
import { ingestionService } from '../ingestion/ingestion.composition.js'
import { GooglePlacesClient } from '../places/google-places.client.js'
import { PlaceResolver } from '../places/place-resolver.js'
import { AnalysisService } from './analysis.service.js'

const extractor = new OpenAIContentExtractor(
  env.OPENAI_API_KEY,
  env.OPENAI_MODEL,
)
const placeResolver = new PlaceResolver(
  new GooglePlacesClient(env.GOOGLE_PLACES_API_KEY),
)

export const analysisService = new AnalysisService(
  ingestionService,
  extractor,
  placeResolver,
)
