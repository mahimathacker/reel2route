import { createTripRequestSchema } from '@reel2route/contracts'
import { Router } from 'express'
import { z } from 'zod'

import { parseRequest } from '../../middleware/request-validation.js'
import type { PlanningService } from './planning.service.js'

export const createPlanningRouter = (
  planningService: Pick<PlanningService, 'create' | 'get'>,
): Router => {
  const router = Router()

  router.post('/', async (request, response) => {
    const input = parseRequest(createTripRequestSchema, request.body)
    const trip = await planningService.create(input.url, input.preferences)
    response.status(200).json(trip)
  })

  router.get('/:tripId', (request, response) => {
    const tripId = parseRequest(z.uuid(), request.params.tripId)
    response.status(200).json(planningService.get(tripId))
  })

  return router
}
