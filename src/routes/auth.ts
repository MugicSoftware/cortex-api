import { FastifyInstance } from 'fastify'
import argon2 from 'argon2'
import crypto from 'crypto'
import prisma from '../lib/prisma.js'

const rateLimitConfig = {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: '1 minute',
    },
  },
}

export default async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', rateLimitConfig, async (req, reply) => {
    const { username, password } = req.body as { username: string; password: string }

    if (!username || !password) {
      return reply.status(400).send({ error: 'Username e password obrigatórios' })
    }

    const exists = await prisma.user.findUnique({ where: { username } })
    if (exists) {
      return reply.status(409).send({ error: 'Usuário já existe' })
    }

    const hash = await argon2.hash(password)
    const token = crypto.randomBytes(32).toString('hex')

    const user = await prisma.user.create({
      data: {
        username,
        hash,
        tokens: { create: { token } },
      },
    })

    return reply.status(201).send({ token, username: user.username })
  })

  app.post('/auth/login', rateLimitConfig, async (req, reply) => {
    const { username, password } = req.body as { username: string; password: string }

    if (!username || !password) {
      return reply.status(400).send({ error: 'Username e password obrigatórios' })
    }

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return reply.status(401).send({ error: 'Credenciais inválidas' })
    }

    const valid = await argon2.verify(user.hash, password)
    if (!valid) {
      return reply.status(401).send({ error: 'Credenciais inválidas' })
    }

    const token = crypto.randomBytes(32).toString('hex')
    await prisma.token.create({ data: { token, userId: user.id } })

    return reply.send({ token, username: user.username })
  })

  app.post('/auth/logout', async (req, reply) => {
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return reply.status(401).send({ error: 'Token obrigatório' })
    }

    await prisma.token.deleteMany({ where: { token } })
    return reply.send({ ok: true })
  })
}
