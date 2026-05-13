import { FastifyInstance } from 'fastify'
import prisma from '../lib/prisma.js'

async function getUserFromToken(token: string) {
  const record = await prisma.token.findUnique({
    where: { token },
    include: { user: true },
  })
  return record?.user ?? null
}

export default async function stateRoutes(app: FastifyInstance) {
  app.get('/state', async (req, reply) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return reply.status(401).send({ error: 'Não autorizado' })

    const user = await getUserFromToken(token)
    if (!user) return reply.status(401).send({ error: 'Token inválido' })

    const habits = await prisma.habit.findMany({ where: { userId: user.id } })
    const entries = await prisma.checkEntry.findMany({ where: { userId: user.id } })

    return reply.send({ habits, entries })
  })

  app.put('/state', async (req, reply) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return reply.status(401).send({ error: 'Não autorizado' })

    const user = await getUserFromToken(token)
    if (!user) return reply.status(401).send({ error: 'Token inválido' })

    const { habits, entries } = req.body as {
      habits: Array<{ id: string; name: string; emoji: string; type: string; createdAt: string }>
      entries: Array<{ id: string; habitId: string; timestamp: string; outcome: string }>
    }

    // Upsert habits
    for (const habit of habits) {
      await prisma.habit.upsert({
        where: { id: habit.id },
        update: {
          name: habit.name,
          emoji: habit.emoji,
          type: habit.type,
        },
        create: {
          id: habit.id,
          userId: user.id,
          name: habit.name,
          emoji: habit.emoji,
          type: habit.type,
          createdAt: new Date(habit.createdAt),
        },
      })
    }

    // Remove habits deletados pelo cliente
    const habitIds = habits.map((h) => h.id)
    await prisma.habit.deleteMany({
      where: { userId: user.id, id: { notIn: habitIds } },
    })

    // Upsert entries
    for (const entry of entries) {
      await prisma.checkEntry.upsert({
        where: { id: entry.id },
        update: {},
        create: {
          id: entry.id,
          habitId: entry.habitId,
          userId: user.id,
          timestamp: new Date(entry.timestamp),
          outcome: entry.outcome,
        },
      })
    }

    // Remove entries órfãs (habit deletado)
    await prisma.checkEntry.deleteMany({
      where: { userId: user.id, habitId: { notIn: habitIds } },
    })

    return reply.send({ ok: true })
  })
}
