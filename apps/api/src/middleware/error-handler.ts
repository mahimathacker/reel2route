import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'

import { ContentExtractionError } from '../modules/extraction/openai-content.extractor.js'
import { UnsupportedContentUrlError } from '../modules/ingestion/content-url.js'
import {
  ContentProviderIdentityMismatchError,
  ContentProviderNotConfiguredError,
} from '../modules/ingestion/ingestion.service.js'
import {
  YouTubeMetadataRequestError,
  YouTubeMetadataResponseError,
  YouTubeVideoNotFoundError,
} from '../modules/ingestion/youtube-metadata.client.js'
import {
  GooglePlacesRequestError,
  GooglePlacesResponseError,
} from '../modules/places/google-places.client.js'
import { TripNotFoundError } from '../modules/planning/planning.service.js'
import { RequestValidationError } from './request-validation.js'

type ApiError = {
  error: {
    code: string
    message: string
  }
}

const sendError = (
  response: Parameters<ErrorRequestHandler>[2],
  status: number,
  code: string,
  message: string,
) => response.status(status).json({ error: { code, message } } satisfies ApiError)

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof RequestValidationError) {
    sendError(response, 400, 'INVALID_REQUEST', 'The request is invalid')
    return
  }

  if (error instanceof ZodError) {
    console.error('Internal schema validation failed', error.issues)
    sendError(
      response,
      500,
      'INTERNAL_VALIDATION_ERROR',
      'Generated trip data did not pass validation',
    )
    return
  }

  if (error instanceof UnsupportedContentUrlError) {
    sendError(response, 422, 'UNSUPPORTED_CONTENT_URL', error.message)
    return
  }

  if (error instanceof YouTubeVideoNotFoundError) {
    sendError(response, 404, 'VIDEO_NOT_FOUND', 'The YouTube video was not found')
    return
  }

  if (error instanceof TripNotFoundError) {
    sendError(response, 404, 'TRIP_NOT_FOUND', 'The saved trip was not found')
    return
  }

  if (
    error instanceof YouTubeMetadataRequestError ||
    error instanceof YouTubeMetadataResponseError
  ) {
    sendError(
      response,
      502,
      'YOUTUBE_UNAVAILABLE',
      'YouTube metadata is temporarily unavailable',
    )
    return
  }

  if (error instanceof ContentExtractionError) {
    console.error('OpenAI extraction failed', error.provider)

    if (error.provider.code === 'insufficient_quota') {
      sendError(
        response,
        503,
        'EXTRACTION_QUOTA_EXCEEDED',
        process.env.NODE_ENV === 'production'
          ? 'Content extraction capacity is temporarily unavailable'
          : 'OpenAI API quota is exhausted; check the project billing and usage limits',
      )
      return
    }

    sendError(
      response,
      502,
      'EXTRACTION_UNAVAILABLE',
      'Content extraction is temporarily unavailable',
    )
    return
  }

  if (
    error instanceof GooglePlacesRequestError ||
    error instanceof GooglePlacesResponseError
  ) {
    sendError(
      response,
      502,
      'PLACES_UNAVAILABLE',
      'Place validation is temporarily unavailable',
    )
    return
  }

  if (
    error instanceof ContentProviderNotConfiguredError ||
    error instanceof ContentProviderIdentityMismatchError
  ) {
    sendError(
      response,
      500,
      'INGESTION_CONFIGURATION_ERROR',
      'Content ingestion is not configured correctly',
    )
    return
  }

  console.error('Unhandled API error', error)
  sendError(response, 500, 'INTERNAL_ERROR', 'An unexpected error occurred')
}
