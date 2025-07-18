import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'
import { checkSessionId } from '../middlewares/check-session-id'
import {
  createMealBodySchema,
  getMealParamsSchema,
  mealSchema,
  updateMealBodySchema,
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

  app.put('/:id', { preHandler: [checkSessionId] }, async (request, reply) => {
    const { id } = getMealParamsSchema.parse(request.params)

    const { name, description, date, isOnDiet } = updateMealBodySchema.parse(
      request.body
    )

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

    await knex('meals')
      .where('id', id)
      .update({
        name: name ?? meal.name,
        description: description ?? meal.description,
        date: date ?? meal.date,
        is_on_diet: isOnDiet ?? meal.is_on_diet,
      })

    return reply.status(204).send()
  })

  app.delete(
    '/:id',
    { preHandler: [checkSessionId] },
    async (request, reply) => {
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

      return reply.status(204).send()
    }
  )

  app.get(
    '/metrics',
    { preHandler: [checkSessionId] },
    async (request, reply) => {
      const user = await knex('users')
        .where('session_id', request.cookies.sessionId)
        .first()

      const meals = await knex('meals').where('user_id', user?.id)

      const totalMeals = meals.length
      const totalMealsOnDiet = meals.filter(meal => meal.is_on_diet).length
      const totalMealsOffDiet = meals.filter(meal => !meal.is_on_diet).length
      const bestOnDietSequence = meals.reduce(
        (acc, meal) => {
          if (meal.is_on_diet) {
            acc.currentSequence += 1
            acc.bestSequence = Math.max(acc.currentSequence, acc.bestSequence)
          } else {
            acc.currentSequence = 0
          }
          return acc
        },
        { currentSequence: 0, bestSequence: 0 }
      ).bestSequence

      return reply.status(200).send({
        metrics: {
          totalMeals,
          totalMealsOnDiet,
          totalMealsOffDiet,
          bestOnDietSequence,
        },
      })
    }
  )
}
