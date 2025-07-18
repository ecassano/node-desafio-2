import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'
import { checkSessionId } from '../middlewares/check-session-id'
import {
  createMealBodySchema,
  getMealParamsSchema,
  mealSchema,
} from '../utils/schemas'

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

  app.get('/', { preHandler: [checkSessionId] }, async (request, reply) => {
    const user = await knex('users')
      .where('session_id', request.cookies.sessionId)
      .first()

    const meals = await knex('meals').where('user_id', user?.id)

    return reply.status(200).send({
      meals: meals.map(meal => mealSchema.parse(meal)),
    })
  })

  app.get('/:id', { preHandler: [checkSessionId] }, async (request, reply) => {
    const { id } = getMealParamsSchema.parse(request.params)

    const meal = await knex('meals').where('id', id).first()

    const user = await knex('users')
      .where('session_id', request.cookies.sessionId)
      .first()

    if (!meal) {
      return reply.status(404).send({
        error: 'Meal not found',
      })
    }

    if (meal.user_id !== user?.id) {
      return reply.status(403).send({
        error: 'Forbidden',
      })
    }

    return reply.status(200).send({ meal: mealSchema.parse(meal) })
  })
}
