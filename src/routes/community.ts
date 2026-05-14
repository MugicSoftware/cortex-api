import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import prisma from '../lib/prisma.js'
import { ALL_CATEGORY_IDS } from './config.js'

const REACTION_TYPES = ['apoio', 'boaPausa', 'vitoria', 'recomeco', 'tamoJunto']
const POST_TYPES = ['pedidoApoio', 'vitoria', 'reflexao', 'estrategia', 'recomeco']

async function getUserFromToken(token: string) {
  const record = await prisma.token.findUnique({
    where: { token },
    include: { user: true },
  })
  return record?.user ?? null
}

async function authUser(req: FastifyRequest, reply: FastifyReply) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    reply.status(401).send({ error: 'Não autorizado' })
    return null
  }
  const user = await getUserFromToken(token)
  if (!user) {
    reply.status(401).send({ error: 'Token inválido' })
    return null
  }
  return user
}

async function ensureProfile(
  userId: string,
  username: string,
  override?: { name?: string; level?: number; levelName?: string },
) {
  const existing = await prisma.communityProfile.findUnique({ where: { userId } })
  if (existing) {
    if (override && (override.name || override.level !== undefined || override.levelName)) {
      return prisma.communityProfile.update({
        where: { id: existing.id },
        data: {
          name: override.name ?? existing.name,
          level: override.level ?? existing.level,
          levelName: override.levelName ?? existing.levelName,
        },
      })
    }
    return existing
  }
  return prisma.communityProfile.create({
    data: {
      userId,
      name: override?.name ?? username,
      level: override?.level ?? 1,
      levelName: override?.levelName ?? 'Desperto',
    },
  })
}

function serializeProfile(p: { id: string; name: string; level: number; levelName: string }) {
  return { id: p.id, name: p.name, level: p.level, levelName: p.levelName }
}

type ReactionRow = { type: string; authorId: string }

function reactionsByType(rows: ReactionRow[]): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const r of rows) {
    if (!out[r.type]) out[r.type] = []
    out[r.type].push(r.authorId)
  }
  return out
}

export default async function communityRoutes(app: FastifyInstance) {
  // Upsert / read current user profile
  app.post('/community/me', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    const body = (req.body ?? {}) as {
      name?: string
      level?: number
      levelName?: string
    }
    const profile = await ensureProfile(user.id, user.username, {
      name: body.name,
      level: body.level,
      levelName: body.levelName,
    })
    return reply.send(serializeProfile(profile))
  })

  app.get('/community/me', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    const profile = await ensureProfile(user.id, user.username)
    return reply.send(serializeProfile(profile))
  })

  // Feed
  app.get('/community/feed', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    const me = await ensureProfile(user.id, user.username)

    const posts = await prisma.communityPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        reactions: { select: { type: true, authorId: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: true,
            reactions: { select: { type: true, authorId: true } },
          },
        },
      },
    })

    return reply.send({
      me: serializeProfile(me),
      posts: posts.map((p) => ({
        id: p.id,
        anonymous: p.anonymous,
        category: p.category,
        type: p.type,
        text: p.text,
        createdAt: p.createdAt.toISOString(),
        author: serializeProfile(p.author),
        reactions: reactionsByType(p.reactions),
        comments: p.comments.map((c) => ({
          id: c.id,
          postId: c.postId,
          parentCommentId: c.parentCommentId,
          anonymous: c.anonymous,
          text: c.text,
          createdAt: c.createdAt.toISOString(),
          author: serializeProfile(c.author),
          reactions: reactionsByType(c.reactions),
        })),
      })),
    })
  })

  // Get a single post fresh
  app.get('/community/posts/:id', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    const { id } = req.params as { id: string }
    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        author: true,
        reactions: { select: { type: true, authorId: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: true,
            reactions: { select: { type: true, authorId: true } },
          },
        },
      },
    })
    if (!post) return reply.status(404).send({ error: 'Post não encontrado' })
    return reply.send({
      id: post.id,
      anonymous: post.anonymous,
      category: post.category,
      type: post.type,
      text: post.text,
      createdAt: post.createdAt.toISOString(),
      author: serializeProfile(post.author),
      reactions: reactionsByType(post.reactions),
      comments: post.comments.map((c) => ({
        id: c.id,
        postId: c.postId,
        parentCommentId: c.parentCommentId,
        anonymous: c.anonymous,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
        author: serializeProfile(c.author),
        reactions: reactionsByType(c.reactions),
      })),
    })
  })

  // Create post
  app.post('/community/posts', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    const me = await ensureProfile(user.id, user.username)
    const { category, type, text, anonymous } = (req.body ?? {}) as {
      category?: string
      type?: string
      text?: string
      anonymous?: boolean
    }
    if (!text || !text.trim()) return reply.status(400).send({ error: 'Texto vazio' })
    if (!category || !ALL_CATEGORY_IDS.has(category))
      return reply.status(400).send({ error: 'Categoria inválida' })
    if (!type || !POST_TYPES.includes(type))
      return reply.status(400).send({ error: 'Tipo inválido' })

    const post = await prisma.communityPost.create({
      data: {
        authorId: me.id,
        category,
        type,
        text: text.trim(),
        anonymous: anonymous === true,
      },
    })

    return reply.status(201).send({
      id: post.id,
      anonymous: post.anonymous,
      category: post.category,
      type: post.type,
      text: post.text,
      createdAt: post.createdAt.toISOString(),
      author: serializeProfile(me),
      reactions: {},
      comments: [],
    })
  })

  // Delete own post
  app.delete('/community/posts/:id', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    const me = await ensureProfile(user.id, user.username)
    const { id } = req.params as { id: string }
    const post = await prisma.communityPost.findUnique({ where: { id } })
    if (!post) return reply.status(404).send({ error: 'Post não encontrado' })
    if (post.authorId !== me.id) {
      return reply.status(403).send({ error: 'Você só pode excluir seus próprios posts.' })
    }
    await prisma.communityPost.delete({ where: { id } })
    return reply.send({ ok: true })
  })

  // Delete own comment (deleta replies também)
  app.delete('/community/comments/:id', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    const me = await ensureProfile(user.id, user.username)
    const { id } = req.params as { id: string }
    const comment = await prisma.communityComment.findUnique({ where: { id } })
    if (!comment) return reply.status(404).send({ error: 'Comentário não encontrado' })
    if (comment.authorId !== me.id) {
      return reply.status(403).send({ error: 'Você só pode excluir seus próprios comentários.' })
    }
    await prisma.communityComment.deleteMany({ where: { parentCommentId: id } })
    await prisma.communityComment.delete({ where: { id } })
    return reply.send({ ok: true })
  })

  // Toggle reaction on a post
  app.post('/community/posts/:id/reactions', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    const me = await ensureProfile(user.id, user.username)
    const { id } = req.params as { id: string }
    const { type } = (req.body ?? {}) as { type?: string }
    if (!type || !REACTION_TYPES.includes(type))
      return reply.status(400).send({ error: 'Reação inválida' })

    const post = await prisma.communityPost.findUnique({ where: { id } })
    if (!post) return reply.status(404).send({ error: 'Post não encontrado' })

    const existing = await prisma.communityReaction.findFirst({
      where: { postId: id, authorId: me.id, type },
    })
    if (existing) {
      await prisma.communityReaction.delete({ where: { id: existing.id } })
    } else {
      await prisma.communityReaction.create({
        data: { type, postId: id, authorId: me.id },
      })
      if (post.authorId !== me.id) {
        await prisma.communityNotification.create({
          data: {
            recipientId: post.authorId,
            title: 'Seu post recebeu apoio',
            body: `${me.name} reagiu ao seu post.`,
            postId: post.id,
          },
        })
      }
    }
    return reply.send({ ok: true })
  })

  // Toggle reaction on a comment
  app.post('/community/comments/:id/reactions', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    const me = await ensureProfile(user.id, user.username)
    const { id } = req.params as { id: string }
    const { type } = (req.body ?? {}) as { type?: string }
    if (!type || !REACTION_TYPES.includes(type))
      return reply.status(400).send({ error: 'Reação inválida' })

    const comment = await prisma.communityComment.findUnique({ where: { id } })
    if (!comment) return reply.status(404).send({ error: 'Comentário não encontrado' })

    const existing = await prisma.communityReaction.findFirst({
      where: { commentId: id, authorId: me.id, type },
    })
    if (existing) {
      await prisma.communityReaction.delete({ where: { id: existing.id } })
    } else {
      await prisma.communityReaction.create({
        data: { type, commentId: id, authorId: me.id },
      })
      if (comment.authorId !== me.id) {
        await prisma.communityNotification.create({
          data: {
            recipientId: comment.authorId,
            title: 'Seu comentário recebeu apoio',
            body: `${me.name} reagiu ao seu comentário.`,
            postId: comment.postId,
          },
        })
      }
    }
    return reply.send({ ok: true })
  })

  // Create comment
  app.post('/community/posts/:id/comments', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    const me = await ensureProfile(user.id, user.username)
    const { id } = req.params as { id: string }
    const { text, parentCommentId, anonymous } = (req.body ?? {}) as {
      text?: string
      parentCommentId?: string | null
      anonymous?: boolean
    }
    if (!text || !text.trim()) return reply.status(400).send({ error: 'Texto vazio' })

    const post = await prisma.communityPost.findUnique({ where: { id } })
    if (!post) return reply.status(404).send({ error: 'Post não encontrado' })

    let parent = null
    if (parentCommentId) {
      parent = await prisma.communityComment.findUnique({
        where: { id: parentCommentId },
      })
      if (!parent || parent.postId !== id) {
        return reply.status(400).send({ error: 'Comentário pai inválido' })
      }
    }

    const comment = await prisma.communityComment.create({
      data: {
        postId: id,
        parentCommentId: parent?.id ?? null,
        authorId: me.id,
        anonymous: anonymous === true,
        text: text.trim(),
      },
      include: { author: true },
    })

    // Reply → notifica o autor do comentário pai (se for outro)
    // Top-level → notifica o autor do post (se for outro)
    if (parent) {
      if (parent.authorId !== me.id) {
        await prisma.communityNotification.create({
          data: {
            recipientId: parent.authorId,
            title: 'Alguém respondeu seu comentário',
            body: anonymous
              ? 'Um anônimo respondeu seu comentário.'
              : `${me.name} respondeu seu comentário.`,
            postId: post.id,
          },
        })
      }
    } else if (post.authorId !== me.id) {
      await prisma.communityNotification.create({
        data: {
          recipientId: post.authorId,
          title: 'Alguém comentou no seu post',
          body: anonymous
            ? 'Um anônimo deixou uma palavra para você.'
            : `${me.name} deixou uma palavra para você.`,
          postId: post.id,
        },
      })
    }

    return reply.status(201).send({
      id: comment.id,
      postId: comment.postId,
      parentCommentId: comment.parentCommentId,
      anonymous: comment.anonymous,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
      author: serializeProfile(comment.author),
      reactions: {},
    })
  })

  // Notifications
  app.get('/community/notifications', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    const me = await ensureProfile(user.id, user.username)
    const items = await prisma.communityNotification.findMany({
      where: { recipientId: me.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return reply.send(
      items.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        postId: n.postId,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      })),
    )
  })

  app.post('/community/notifications/:id/read', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    const me = await ensureProfile(user.id, user.username)
    const { id } = req.params as { id: string }
    await prisma.communityNotification.updateMany({
      where: { id, recipientId: me.id },
      data: { read: true },
    })
    return reply.send({ ok: true })
  })
}
