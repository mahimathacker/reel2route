import { analysisService } from '../analysis/analysis.composition.js'
import { CostService } from '../cost/cost.service.js'
import { ItineraryService } from '../itinerary/itinerary.service.js'
import { PersonaService } from '../persona/persona.service.js'
import { loadTourCatalogue } from '../tours/tour-catalogue.js'
import { TourMatcherService } from '../tours/tour-matcher.service.js'
import { PackingService } from './packing.service.js'
import { PlanningService } from './planning.service.js'

const tourCatalogue = await loadTourCatalogue()

export const planningService = new PlanningService(
  analysisService,
  new ItineraryService(new PersonaService()),
  new TourMatcherService(tourCatalogue),
  new CostService(),
  new PackingService(),
)
