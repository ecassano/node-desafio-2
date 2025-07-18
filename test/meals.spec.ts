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

  it('should be able to get a meal from a user', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com',
      })
      .expect(201)

    const cookie = createUserResponse.get('Set-Cookie')!
    const fixedDate = new Date().toISOString()

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Café da manhã',
        description: 'Ovos e frutas',
        date: fixedDate,
        isOnDiet: true,
      })
      .expect(201)

    const listUserMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .expect(200)

    const mealId = listUserMealsResponse.body.meals[0].id

    const getMealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookie)
      .expect(200)

    expect(getMealResponse.body.meal).toEqual(
      expect.objectContaining({
        id: mealId,
        name: 'Café da manhã',
        description: 'Ovos e frutas',
        date: fixedDate,
        isOnDiet: true,
      })
    )
  })

  it('should be able to update a meal from a user', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com',
      })
      .expect(201)

    const cookie = createUserResponse.get('Set-Cookie')!

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Café da manhã',
        description: 'Ovos e frutas',
        date: new Date().toISOString(),
        isOnDiet: true,
      })
      .expect(201)

    const listUserMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .expect(200)

    const meal = listUserMealsResponse.body.meals[0]

    await request(app.server)
      .put(`/meals/${meal.id}`)
      .set('Cookie', cookie)
      .send({
        name: 'Almoço',
        description: 'Pastel de camarão',
      })
      .expect(204)

    const getMealResponse = await request(app.server)
      .get(`/meals/${meal.id}`)
      .set('Cookie', cookie)
      .expect(200)

    expect(getMealResponse.body.meal).toEqual(
      expect.objectContaining({
        ...meal,
        id: meal.id,
        name: 'Almoço',
        description: 'Pastel de camarão',
        date: meal.date,
        isOnDiet: meal.isOnDiet,
      })
    )
  })

  it('should be able to delete a meal from a user', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com',
      })
      .expect(201)

    const cookie = createUserResponse.get('Set-Cookie')!

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Café da manhã',
        description: 'Ovos e frutas',
        date: new Date().toISOString(),
        isOnDiet: true,
      })
      .expect(201)

    const listUserMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .expect(200)

    const meal = listUserMealsResponse.body.meals[0]

    await request(app.server)
      .delete(`/meals/${meal.id}`)
      .set('Cookie', cookie)
      .expect(204)

    const listSecondUserMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .expect(200)

    expect(listSecondUserMealsResponse.body.meals).toEqual([])
  })

  it('should be able to get metrics from a user', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com',
      })
      .expect(201)

    const cookie = createUserResponse.get('Set-Cookie')!

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Café da manhã',
        description: 'Ovos e frutas',
        date: new Date().toISOString(),
        isOnDiet: true,
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Almoço',
        description: 'Hambúrguer e batata frita',
        date: new Date().toISOString(),
        isOnDiet: false,
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Janta',
        description: 'Salada de frutas',
        date: new Date().toISOString(),
        isOnDiet: true,
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Ceia',
        description: 'Shake de proteína',
        date: new Date().toISOString(),
        isOnDiet: true,
      })
      .expect(201)

    const getMetricsResponse = await request(app.server)
      .get('/meals/metrics')
      .set('Cookie', cookie)
      .expect(200)

    expect(getMetricsResponse.body.metrics).toEqual(
      expect.objectContaining({
        totalMeals: 4,
        totalMealsOnDiet: 3,
        totalMealsOffDiet: 1,
        bestOnDietSequence: 2,
      })
    )
  })
})
