import { execSync } from 'node:child_process'
import { app } from '../src/app'
import { describe, beforeAll, afterAll, beforeEach, it, expect } from 'vitest'
import request from 'supertest'

describe('Users routes', () => {
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

  it('should be able to create a new user', async () => {
    const response = await request(app.server).post('/users').send({
      name: 'John Doe',
      email: 'johndoe@example.com',
    })

    expect(response.status).toBe(201)
  })
})
