import type { SourceContent, SourcePlatform } from '@reel2route/contracts'

import type { ParsedContentUrl } from './content-url.js'

export interface ContentProvider {
  readonly platform: SourcePlatform
  readonly fetch: (parsedUrl: ParsedContentUrl) => Promise<SourceContent>
}
