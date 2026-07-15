import { analysisService } from '../analysis/analysis.composition.js'
import { CostService } from '../cost/cost.service.js'
import { ItineraryService } from '../itinerary/itinerary.service.js'
import { PersonaService } from '../persona/persona.service.js'
import { loadTourCatalogue } from '../tours/tour-catalogue.js'
import { TourMatcherService } from '../tours/tour-matcher.service.js'
import { PackingService } from './packing.service.js'
import { PlanningService } from './planning.service.js'
import { openTripDatabase, TripRepository } from './trip.repository.js'

const tourCatalogue = await loadTourCatalogue()
const tripRepository = new TripRepository(openTripDatabase(env.DATABASE_PATH))

export const planningService = new PlanningService(
  analysisService,
  new ItineraryService(new PersonaService()),
  new TourMatcherService(tourCatalogue),
  new CostService(),
  new PackingService(),
  tripRepository,
)
import { env } from '../../config/env.js'
