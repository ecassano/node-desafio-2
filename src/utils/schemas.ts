import { z } from 'zod'

export const createUserBodySchema = z.object({
  name: z.string(),
  email: z.email(),
})

export const createMealBodySchema = z.object({
  name: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  isOnDiet: z.boolean(),
})

export const mealDBSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  is_on_diet: z.union([z.literal(0), z.literal(1)]).transform(val => val === 1),
})

export const mealSchema = mealDBSchema.transform(meal => ({
  ...meal,
  date: meal.date.toISOString(),
  isOnDiet: meal.is_on_diet,
}))
