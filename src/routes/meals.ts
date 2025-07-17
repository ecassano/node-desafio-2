import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { checkSessionId } from '../middlewares/check-session-id'

const createMealBodySchema = z.object({
  name: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  isOnDiet: z.boolean(),
})

export const mealsRoutes = async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request, reply) => {
    console.log(`[${request.method}] ${request.url}`)
  })

  app.post('/', { preHandler: [checkSessionId] }, async (request, reply) => {
    const { name, description, date, isOnDiet } = createMealBodySchema.parse(
      request.body
    )

    const user = await knex('users')
      .where('session_id', request.cookies.sessionId)
      .first()

    if (!user) {
      return reply.status(404).send({
        error: 'User not found',
      })
    }

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      date,
      is_on_diet: isOnDiet,
      user_id: user.id,
    })

    return reply.status(201).send({
      message: 'Meal created successfully',
    })
  })
}
