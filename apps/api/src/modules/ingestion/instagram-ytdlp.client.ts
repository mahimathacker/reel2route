import { execFile } from 'node:child_process'

export type InstagramYtDlpMetadata = {
  title: string | null
  caption: string | null
  author: string | null
}

export type InstagramYtDlpResult =
  | { status: 'available'; metadata: InstagramYtDlpMetadata }
  | { status: 'unavailable' }

type CommandRunner = (
  command: string,
  args: readonly string[],
) => Promise<{ stdout: string }>

const runCommand: CommandRunner = (command, args) =>
  new Promise((resolve, reject) => {
    execFile(command, [...args], { timeout: 15_000, maxBuffer: 2_000_000 }, (error, stdout) => {
      if (error !== null) reject(error instanceof Error ? error : new Error('yt-dlp failed'))
      else resolve({ stdout })
    })
  })

const textOrNull = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null

export class InstagramYtDlpClient {
  constructor(private readonly runner: CommandRunner = runCommand) {}

  async fetch(canonicalUrl: string): Promise<InstagramYtDlpResult> {
    try {
      const { stdout } = await this.runner('yt-dlp', [
        '--dump-single-json',
        '--skip-download',
        '--no-warnings',
        '--socket-timeout',
        '10',
        canonicalUrl,
      ])
      const data: unknown = JSON.parse(stdout)

      if (typeof data !== 'object' || data === null) return { status: 'unavailable' }

      const record = data as Record<string, unknown>
      const metadata = {
        title: textOrNull(record.title),
        caption: textOrNull(record.description),
        author: textOrNull(record.uploader) ?? textOrNull(record.channel),
      }

      if (metadata.title === null && metadata.caption === null) {
        return { status: 'unavailable' }
      }

      return { status: 'available', metadata }
    } catch {
      return { status: 'unavailable' }
    }
  }
}
