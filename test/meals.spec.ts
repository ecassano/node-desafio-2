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

  it('should be able to list all meals from a user', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com',
      })
      .expect(201)

    const cookie = createUserResponse.get('Set-Cookie')!
    const fixedDateOne = new Date().toISOString()
    const fixedDateTwo = new Date().toISOString()

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Café da manhã',
        description: 'Ovos e frutas',
        date: fixedDateOne,
        isOnDiet: true,
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Almoço',
        description: 'Hambúrguer e batata frita',
        date: fixedDateTwo,
        isOnDiet: false,
      })
      .expect(201)

    const listUserMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .expect(200)

    expect(listUserMealsResponse.body.meals).toEqual([
      expect.objectContaining({
        name: 'Café da manhã',
        description: 'Ovos e frutas',
        date: fixedDateOne,
        isOnDiet: true,
      }),
      expect.objectContaining({
        name: 'Almoço',
        description: 'Hambúrguer e batata frita',
        date: fixedDateTwo,
        isOnDiet: false,
      }),
    ])
  })
})
