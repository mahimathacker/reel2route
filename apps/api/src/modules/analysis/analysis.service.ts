import {
  contentAnalysisSchema,
  type ContentAnalysis,
  type ContentExtraction,
  type ResolvedPlace,
  type SourceContent,
} from '@reel2route/contracts'

type IngestionPort = {
  ingest(url: string): Promise<SourceContent>
}

type ExtractionPort = {
  extract(content: SourceContent): Promise<ContentExtraction>
}

type ResolutionPort = {
  resolveAll(
    places: ContentExtraction['places'],
    destinationGuess: string | null,
  ): Promise<ResolvedPlace[]>
}

export class AnalysisService {
  constructor(
    private readonly ingestion: IngestionPort,
    private readonly extraction: ExtractionPort,
    private readonly resolution: ResolutionPort,
  ) {}

  async analyze(url: string): Promise<ContentAnalysis> {
    const source = await this.ingestion.ingest(url)
    const extraction = await this.extraction.extract(source)
    const resolvedPlaces = await this.resolution.resolveAll(
      extraction.places,
      extraction.destinationGuess,
    )

    return contentAnalysisSchema.parse({ source, extraction, resolvedPlaces })
  }
}
