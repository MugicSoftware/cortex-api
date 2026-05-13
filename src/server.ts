import 'dotenv/config'
import Fastify from 'fastify'
import rateLimit from '@fastify/rate-limit'
import authRoutes from './routes/auth.js'
import stateRoutes from './routes/state.js'

const app = Fastify({ logger: true })

// CORS manual (sem plugin extra)
app.addHook('onRequest', async (req, reply) => {
  reply.header('Access-Control-Allow-Origin', '*')
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') {
    return reply.status(204).send()
  }
})

// Rate limit só nas rotas de auth
await app.register(rateLimit, {
  max: 10,
  timeWindow: '1 minute',
  keyGenerator: (req) => req.ip,
  skip: (req) => !req.url.startsWith('/auth'),
})

// Rotas
await app.register(authRoutes)
await app.register(stateRoutes)

// Health check
app.get('/health', async () => ({ ok: true }))

const port = Number(process.env.PORT) || 3000

try {
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`Servidor rodando em http://localhost:${port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
