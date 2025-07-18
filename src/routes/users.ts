import { knex } from '../database'
import { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { createUserBodySchema } from '../utils/schemas'

export const userRoutes = async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request, reply) => {
    console.log(`[${request.method}] ${request.url}`)
  })

  app.post('/', async (request, reply) => {
    const { name, email } = createUserBodySchema.parse(request.body)

    const userAlreadyExists = await knex('users')
      .where('email', email)
      .first()
      .then(user => !!user)

    if (userAlreadyExists) {
      return reply.status(400).send({ message: 'User already exists' })
    }

    const sessionId = randomUUID()
    reply.cookie('sessionId', sessionId, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    })

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      session_id: sessionId,
      session_expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    })

    return reply.status(201).send()
  })
}
