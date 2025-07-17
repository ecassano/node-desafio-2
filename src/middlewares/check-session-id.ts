import { FastifyRequest, FastifyReply } from 'fastify'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'

export const checkSessionId = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const sessionId = request.cookies.sessionId

  if (!sessionId) {
    return reply.status(401).send({
      error: 'Unauthorized',
    })
  }

  const user = await knex('users').where('session_id', sessionId).first()

  if (!user) {
    return reply.status(401).send({
      error: 'Unauthorized',
    })
  }

  if (user.session_expires_at < new Date()) {
    const newSessionId = randomUUID()
    await knex('users')
      .where('id', user.id)
      .update({
        session_id: newSessionId,
        session_expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      })

    reply.setCookie('sessionId', newSessionId, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    })
  }
}
