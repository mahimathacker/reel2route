import { describe, expect, it, vi } from 'vitest'

import { InstagramYtDlpClient } from '../src/modules/ingestion/instagram-ytdlp.client.js'

describe('InstagramYtDlpClient', () => {
  it('requests metadata without downloading media', async () => {
    const runner = vi.fn().mockResolvedValue({
      stdout: JSON.stringify({
        title: 'Five places in Jaipur',
        description: 'City Palace, Hawa Mahal, and Jantar Mantar in one day.',
        uploader: 'Mahima',
      }),
    })
    const client = new InstagramYtDlpClient(runner)

    await expect(client.fetch('https://www.instagram.com/reel/example/')).resolves.toEqual({
      status: 'available',
      metadata: {
        title: 'Five places in Jaipur',
        caption: 'City Palace, Hawa Mahal, and Jantar Mantar in one day.',
        author: 'Mahima',
      },
    })
    expect(runner).toHaveBeenCalledWith(
      'yt-dlp',
      expect.arrayContaining(['--skip-download', '--dump-single-json']),
    )
  })

  it('fails safely when yt-dlp is missing or Instagram blocks access', async () => {
    const client = new InstagramYtDlpClient(vi.fn().mockRejectedValue(new Error('unavailable')))

    await expect(client.fetch('https://www.instagram.com/reel/example/')).resolves.toEqual({
      status: 'unavailable',
    })
  })
})
