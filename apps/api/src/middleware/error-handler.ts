import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'

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
  if (error instanceof ZodError) {
    sendError(response, 400, 'INVALID_REQUEST', 'The request is invalid')
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
