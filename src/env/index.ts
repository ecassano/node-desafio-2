import { z } from 'zod'
import { config } from 'dotenv'

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' })

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_CLIENT: z.enum(['sqlite']),
  DATABASE_URL: z.string(),
  PORT: z.coerce.number().default(3333),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  console.error('Invalid environment variables', _env.error.format())
  process.exit(1)
}

export const env = _env.data
