import { knex as setupKnex } from 'knex'
import { env } from './src/env/index.ts'

const knex = setupKnex({
  client: env.DATABASE_CLIENT,
  connection: {
    filename: env.DATABASE_URL,
  },
  useNullAsDefault: true,
  migrations: {
    directory: './db/migrations',
    extension: 'ts',
  },
})

export default knex
