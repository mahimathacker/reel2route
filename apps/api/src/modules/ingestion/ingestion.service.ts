import {
  sourceContentSchema,
  type SourceContent,
  type SourcePlatform,
} from '@reel2route/contracts'

import type { ContentProvider } from './content-provider.js'
import { parseContentUrl } from './content-url.js'

export class ContentProviderNotConfiguredError extends Error {
  constructor(platform: SourcePlatform) {
    super(`No content provider is configured for ${platform}`)
    this.name = 'ContentProviderNotConfiguredError'
  }
}

export class DuplicateContentProviderError extends Error {
  constructor(platform: SourcePlatform) {
    super(`Multiple content providers are configured for ${platform}`)
    this.name = 'DuplicateContentProviderError'
  }
}

export class ContentProviderIdentityMismatchError extends Error {
  constructor() {
    super('The content provider response does not match the requested URL')
    this.name = 'ContentProviderIdentityMismatchError'
  }
}

export class IngestionService {
  readonly #providers = new Map<SourcePlatform, ContentProvider>()

  constructor(providers: readonly ContentProvider[]) {
    for (const provider of providers) {
      if (this.#providers.has(provider.platform)) {
        throw new DuplicateContentProviderError(provider.platform)
      }

      this.#providers.set(provider.platform, provider)
    }
  }

  async ingest(input: string): Promise<SourceContent> {
    const parsedUrl = parseContentUrl(input)
    const provider = this.#providers.get(parsedUrl.platform)

    if (provider === undefined) {
      throw new ContentProviderNotConfiguredError(parsedUrl.platform)
    }

    const content = sourceContentSchema.parse(await provider.fetch(parsedUrl))

    if (
      content.platform !== parsedUrl.platform ||
      content.externalId !== parsedUrl.externalId ||
      content.canonicalUrl !== parsedUrl.canonicalUrl
    ) {
      throw new ContentProviderIdentityMismatchError()
    }

    return content
  }
}
