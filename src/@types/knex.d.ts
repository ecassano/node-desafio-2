import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      name: string
      email: string
      session_id: string
      session_expires_at: Date
    }
    meals: {
      id: string
      name: string
      description: string
      date: Date
      is_on_diet: boolean
      user_id: string
    }
  }
}
