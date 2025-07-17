import { execSync } from 'node:child_process'
import { app } from '../src/app'
import { describe, beforeAll, afterAll, beforeEach, it, expect } from 'vitest'
import request from 'supertest'

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run rollback --all')
    execSync('npm run migrate')
  })

  it('should be able to create a new meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com',
      })
      .expect(201)

    const createMealResponse = await request(app.server)
      .post('/meals')
      .set('Cookie', createUserResponse.get('Set-Cookie')!)
      .send({
        name: 'Café da manhã',
        description: 'Ovos e frutas',
        date: new Date().toISOString(),
        isOnDiet: true,
      })

    expect(createMealResponse.status).toBe(201)
  })
})
