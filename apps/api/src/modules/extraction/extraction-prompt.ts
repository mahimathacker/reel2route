import type { SourceContent } from '@reel2route/contracts'

const MAX_SOURCE_CHARACTERS = 30_000

const addSection = (sections: string[], label: string, value: string | null) => {
  if (value !== null && value.trim().length > 0) {
    sections.push(`${label}:\n${value.trim()}`)
  }
}

export const buildExtractionInput = (content: SourceContent) => {
  const sections = [
    `Platform: ${content.platform}`,
    `Canonical URL: ${content.canonicalUrl}`,
  ]

  addSection(sections, 'Title', content.title)
  addSection(sections, 'Description', content.description)
  addSection(sections, 'Caption', content.caption)

  if (content.locationTags.length > 0) {
    sections.push(`Location tags:\n${content.locationTags.join('\n')}`)
  }

  if (content.transcript.length > 0) {
    sections.push(
      `Transcript:\n${content.transcript
        .map((segment) => `[${segment.startSeconds}s] ${segment.text}`)
        .join('\n')}`,
    )
  }

  return sections.join('\n\n').slice(0, MAX_SOURCE_CHARACTERS)
}

export const EXTRACTION_SYSTEM_PROMPT = `You extract travel facts from social content.

Rules:
- Extract only places and activities supported by the supplied source.
- Preserve the exact supporting snippet and its source type as evidence.
- Use transcript timestamps when available; otherwise use null.
- Count distinct mentions of each place across all supplied sources.
- High confidence means explicit and repeated or unambiguous; medium means explicit once; low means a plausible but uncertain reference.
- Do not invent addresses, coordinates, ratings, prices, hotels, or destinations.
- Keep vibes short and grounded in the content's language.
- Report important missing planning information instead of guessing it.
- Merge duplicate references to the same place.`
