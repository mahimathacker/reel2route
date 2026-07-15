import type { ContentExtraction, SourceContent } from '@reel2route/contracts'

export interface ContentExtractor {
  readonly extract: (content: SourceContent) => Promise<ContentExtraction>
}
