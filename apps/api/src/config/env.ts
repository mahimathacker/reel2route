import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  WEB_ORIGIN: z.url().default('http://localhost:5173'),
  YOUTUBE_API_KEY: z.string().trim().min(1),
})

export const env = envSchema.parse(process.env)
