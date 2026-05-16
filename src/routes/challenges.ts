import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import prisma from '../lib/prisma.js'
import { ALL_CATEGORY_IDS } from './config.js'

const HABIT_TYPES = ['avoid', 'conquer']
const VISIBILITIES = ['public', 'private']
const CHECKIN_STATUSES = [
  'completed',
  'notDone',
  'stayedFirm',
  'difficultDay',
]

async function authUser(req: FastifyRequest, reply: FastifyReply) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    reply.status(401).send({ error: 'Não autorizado' })
    return null
  }
  const record = await prisma.token.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!record) {
    reply.status(401).send({ error: 'Token inválido' })
    return null
  }
  return record.user
}

async function profileForUser(userId: string, username: string) {
  const existing = await prisma.communityProfile.findUnique({ where: { userId } })
  if (existing) return existing
  return prisma.communityProfile.create({
    data: { userId, name: username, level: 1, levelName: 'Desperto' },
  })
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let buf = ''
  for (let i = 0; i < 6; i++) {
    buf += chars[Math.floor(Math.random() * chars.length)]
  }
  return buf
}

function dayKey(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

type ChallengeRow = Awaited<ReturnType<typeof prisma.challenge.findFirstOrThrow>>

async function serializeChallenge(c: ChallengeRow) {
  const memberCount = await prisma.challengeMember.count({
    where: { challengeId: c.id },
  })
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    category: c.category,
    habitType: c.habitType,
    visibility: c.visibility,
    inviteCode: c.inviteCode,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    createdByUserId: c.createdByUserId,
    memberCount,
    collectiveXp: c.collectiveXp,
    groupShieldPercent: c.groupShieldPercent,
    createdAt: c.createdAt.toISOString(),
  }
}

type MemberWithUser = Awaited<
  ReturnType<
    typeof prisma.challengeMember.findFirstOrThrow<{
      include: { user: { include: { profile: true } } }
    }>
  >
>

function serializeMember(m: MemberWithUser, currentUserId: string) {
  const profile = m.user.profile
  return {
    id: m.id,
    groupId: m.challengeId,
    userId: m.userId,
    userName: profile?.name ?? m.user.username,
    level: profile?.level ?? 1,
    levelName: profile?.levelName ?? 'Desperto',
    joinedAt: m.joinedAt.toISOString(),
    xpInChallenge: m.xpInChallenge,
    completedDays: m.completedDays,
    currentStreak: m.currentStreak,
    hasCheckedInToday: m.hasCheckedInToday,
    isMe: m.userId === currentUserId,
  }
}

async function recomputeMemberTodayFlags(challengeId: string) {
  // Reset hasCheckedInToday quando vira o dia (não roda em background — só
  // quando alguém abre o desafio ou faz check-in).
  const today = dayKey(new Date())
  const members = await prisma.challengeMember.findMany({
    where: { challengeId },
  })
  for (const m of members) {
    const last = m.lastCheckinDate ? dayKey(m.lastCheckinDate) : null
    const shouldBeFlagged = last !== null && last.getTime() === today.getTime()
    if (m.hasCheckedInToday !== shouldBeFlagged) {
      await prisma.challengeMember.update({
        where: { id: m.id },
        data: { hasCheckedInToday: shouldBeFlagged },
      })
    }
  }
}

async function recomputeShield(challengeId: string) {
  const recent = await prisma.challengeDailyProgress.findMany({
    where: { challengeId },
    orderBy: { date: 'desc' },
    take: 7,
  })
  if (recent.length === 0) return
  const rates = recent.map((p) =>
    p.totalMembers === 0 ? 0 : p.checkedInCount / p.totalMembers,
  )
  const avg = rates.reduce((a, b) => a + b, 0) / rates.length
  const shield = Math.min(100, Math.max(0, Math.round(avg * 100)))
  await prisma.challenge.update({
    where: { id: challengeId },
    data: { groupShieldPercent: shield },
  })
}

export default async function challengesRoutes(app: FastifyInstance) {
  // ── GET /challenges/mine ──────────────────────────────────────────
  app.get('/challenges/mine', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    const memberships = await prisma.challengeMember.findMany({
      where: { userId: user.id },
      include: { challenge: true },
      orderBy: { joinedAt: 'desc' },
    })
    const out = await Promise.all(
      memberships.map((m) => serializeChallenge(m.challenge)),
    )
    return reply.send(out)
  })

  // ── GET /challenges/public ────────────────────────────────────────
  app.get('/challenges/public', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    const myIds = await prisma.challengeMember.findMany({
      where: { userId: user.id },
      select: { challengeId: true },
    })
    const excluded = new Set(myIds.map((m) => m.challengeId))
    const challenges = await prisma.challenge.findMany({
      where: { visibility: 'public', id: { notIn: [...excluded] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    const out = await Promise.all(challenges.map((c) => serializeChallenge(c)))
    return reply.send(out)
  })

  // ── POST /challenges ──────────────────────────────────────────────
  app.post('/challenges', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    await profileForUser(user.id, user.username)
    const body = (req.body ?? {}) as {
      name?: string
      description?: string
      category?: string
      habitType?: string
      visibility?: string
      durationDays?: number
    }
    if (!body.name || !body.name.trim())
      return reply.status(400).send({ error: 'Nome obrigatório' })
    if (!body.category || !ALL_CATEGORY_IDS.has(body.category))
      return reply.status(400).send({ error: 'Categoria inválida' })
    if (!body.habitType || !HABIT_TYPES.includes(body.habitType))
      return reply.status(400).send({ error: 'habitType inválido' })
    if (!body.visibility || !VISIBILITIES.includes(body.visibility))
      return reply.status(400).send({ error: 'visibility inválido' })
    const days = Number(body.durationDays ?? 0)
    if (!Number.isFinite(days) || days < 1 || days > 365)
      return reply.status(400).send({ error: 'durationDays entre 1 e 365' })

    const now = new Date()
    const start = dayKey(now)
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + days - 1)

    // Garante código único — em prática quase nunca colide
    let code = generateInviteCode()
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.challenge.findUnique({ where: { inviteCode: code } })
      if (!exists) break
      code = generateInviteCode()
    }

    const challenge = await prisma.challenge.create({
      data: {
        name: body.name.trim(),
        description: (body.description ?? '').trim(),
        category: body.category,
        habitType: body.habitType,
        visibility: body.visibility,
        inviteCode: code,
        startDate: start,
        endDate: end,
        createdByUserId: user.id,
        collectiveXp: 0,
        groupShieldPercent: body.habitType === 'avoid' ? 100 : 0,
        members: { create: { userId: user.id } },
      },
    })

    return reply.status(201).send(await serializeChallenge(challenge))
  })

  // ── POST /challenges/:id/join ─────────────────────────────────────
  app.post('/challenges/:id/join', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    await profileForUser(user.id, user.username)
    const { id } = req.params as { id: string }
    const challenge = await prisma.challenge.findUnique({ where: { id } })
    if (!challenge) return reply.status(404).send({ error: 'Desafio não encontrado' })
    if (challenge.visibility !== 'public') {
      return reply
        .status(403)
        .send({ error: 'Esse desafio é privado. Use o código de convite.' })
    }
    await prisma.challengeMember.upsert({
      where: { challengeId_userId: { challengeId: id, userId: user.id } },
      update: {},
      create: { challengeId: id, userId: user.id },
    })
    const fresh = await prisma.challenge.findUniqueOrThrow({ where: { id } })
    return reply.send(await serializeChallenge(fresh))
  })

  // ── POST /challenges/join-by-code ─────────────────────────────────
  app.post('/challenges/join-by-code', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    await profileForUser(user.id, user.username)
    const { code } = (req.body ?? {}) as { code?: string }
    if (!code || !code.trim())
      return reply.status(400).send({ error: 'Código obrigatório' })
    const challenge = await prisma.challenge.findUnique({
      where: { inviteCode: code.trim().toUpperCase() },
    })
    if (!challenge) return reply.status(404).send({ error: 'Código inválido' })
    await prisma.challengeMember.upsert({
      where: {
        challengeId_userId: { challengeId: challenge.id, userId: user.id },
      },
      update: {},
      create: { challengeId: challenge.id, userId: user.id },
    })
    const fresh = await prisma.challenge.findUniqueOrThrow({
      where: { id: challenge.id },
    })
    return reply.send(await serializeChallenge(fresh))
  })

  // ── GET /challenges/:id/members ───────────────────────────────────
  app.get('/challenges/:id/members', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    const { id } = req.params as { id: string }
    await recomputeMemberTodayFlags(id)
    const members = await prisma.challengeMember.findMany({
      where: { challengeId: id },
      include: { user: { include: { profile: true } } },
      orderBy: { joinedAt: 'asc' },
    })
    return reply.send(members.map((m) => serializeMember(m, user.id)))
  })

  // ── GET /challenges/:id/messages ──────────────────────────────────
  app.get('/challenges/:id/messages', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    const { id } = req.params as { id: string }
    const messages = await prisma.challengeMessage.findMany({
      where: { challengeId: id },
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'asc' },
      take: 200,
    })
    return reply.send(
      messages.map((m) => ({
        id: m.id,
        groupId: m.challengeId,
        userId: m.userId,
        userName: m.user.profile?.name ?? m.user.username,
        userLevel: m.user.profile?.level ?? 1,
        text: m.text,
        createdAt: m.createdAt.toISOString(),
        isMe: m.userId === user.id,
      })),
    )
  })

  // ── POST /challenges/:id/messages ─────────────────────────────────
  app.post('/challenges/:id/messages', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    const profile = await profileForUser(user.id, user.username)
    const { id } = req.params as { id: string }
    const { text } = (req.body ?? {}) as { text?: string }
    if (!text || !text.trim())
      return reply.status(400).send({ error: 'Texto vazio' })
    // Garante que o usuário é membro
    const isMember = await prisma.challengeMember.findUnique({
      where: { challengeId_userId: { challengeId: id, userId: user.id } },
    })
    if (!isMember)
      return reply.status(403).send({ error: 'Entre no desafio antes' })
    const msg = await prisma.challengeMessage.create({
      data: { challengeId: id, userId: user.id, text: text.trim() },
    })
    return reply.status(201).send({
      id: msg.id,
      groupId: msg.challengeId,
      userId: msg.userId,
      userName: profile.name,
      userLevel: profile.level,
      text: msg.text,
      createdAt: msg.createdAt.toISOString(),
      isMe: true,
    })
  })

  // ── GET /challenges/:id/progress ──────────────────────────────────
  app.get('/challenges/:id/progress', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    const { id } = req.params as { id: string }
    const progress = await prisma.challengeDailyProgress.findMany({
      where: { challengeId: id },
      orderBy: { date: 'asc' },
    })
    return reply.send(
      progress.map((p) => ({
        date: p.date.toISOString(),
        totalMembers: p.totalMembers,
        checkedInCount: p.checkedInCount,
        completedCount: p.completedCount,
        difficultCount: p.difficultCount,
        collectiveXpEarned: p.collectiveXpEarned,
      })),
    )
  })

  // ── POST /challenges/:id/checkins ─────────────────────────────────
  app.post('/challenges/:id/checkins', async (req, reply) => {
    const user = await authUser(req, reply)
    if (!user) return
    await profileForUser(user.id, user.username)
    const { id } = req.params as { id: string }
    const { status } = (req.body ?? {}) as { status?: string }
    if (!status || !CHECKIN_STATUSES.includes(status))
      return reply.status(400).send({ error: 'status inválido' })

    const challenge = await prisma.challenge.findUnique({ where: { id } })
    if (!challenge)
      return reply.status(404).send({ error: 'Desafio não encontrado' })

    const member = await prisma.challengeMember.findUnique({
      where: { challengeId_userId: { challengeId: id, userId: user.id } },
    })
    if (!member)
      return reply.status(403).send({ error: 'Entre no desafio antes' })

    const today = dayKey(new Date())
    const lastKey = member.lastCheckinDate ? dayKey(member.lastCheckinDate) : null
    if (lastKey && lastKey.getTime() === today.getTime()) {
      return reply.status(409).send({ error: 'Você já registrou hoje.' })
    }

    // XP rules
    let xp = 0
    let counted = false
    if (status === 'completed' || status === 'stayedFirm') {
      xp = 3
      counted = true
    } else if (status === 'difficultDay') {
      xp = 1
    } else {
      xp = 0
    }

    const isPositive = status === 'completed' || status === 'stayedFirm'
    const isDifficult = status === 'difficultDay'

    // Streak: incrementa se ontem também foi check-in positivo OU se é dia 1.
    let newStreak = counted ? member.currentStreak + 1 : 0
    // Atenção: se o último foi anteontem, "quebra" mesmo se foi positivo.
    if (counted && lastKey) {
      const yesterday = new Date(today)
      yesterday.setUTCDate(yesterday.getUTCDate() - 1)
      if (lastKey.getTime() !== yesterday.getTime()) {
        newStreak = 1
      }
    }

    const updatedMember = await prisma.challengeMember.update({
      where: { id: member.id },
      data: {
        xpInChallenge: { increment: xp },
        completedDays: counted
          ? { increment: 1 }
          : undefined,
        currentStreak: newStreak,
        hasCheckedInToday: true,
        lastCheckinDate: new Date(),
      },
      include: { user: { include: { profile: true } } },
    })

    // Today's progress bucket
    const totalMembers = await prisma.challengeMember.count({
      where: { challengeId: id },
    })
    const existingDay = await prisma.challengeDailyProgress.findUnique({
      where: { challengeId_date: { challengeId: id, date: today } },
    })
    let prevCheckedIn = 0
    if (existingDay) {
      prevCheckedIn = existingDay.checkedInCount
      await prisma.challengeDailyProgress.update({
        where: { id: existingDay.id },
        data: {
          totalMembers,
          checkedInCount: { increment: 1 },
          completedCount: isPositive ? { increment: 1 } : undefined,
          difficultCount: isDifficult ? { increment: 1 } : undefined,
          collectiveXpEarned: { increment: xp },
        },
      })
    } else {
      await prisma.challengeDailyProgress.create({
        data: {
          challengeId: id,
          date: today,
          totalMembers,
          checkedInCount: 1,
          completedCount: isPositive ? 1 : 0,
          difficultCount: isDifficult ? 1 : 0,
          collectiveXpEarned: xp,
        },
      })
    }

    // Bônus coletivo ao cruzar 70% / 100%
    const newCheckedIn = prevCheckedIn + 1
    const prevRatio = totalMembers === 0 ? 0 : prevCheckedIn / totalMembers
    const ratio = totalMembers === 0 ? 0 : newCheckedIn / totalMembers
    let bonus = 0
    if (prevRatio < 0.7 && ratio >= 0.7) bonus += 10
    if (prevRatio < 1.0 && ratio >= 1.0) bonus += 20

    // Cria check-in record
    const checkin = await prisma.challengeCheckin.create({
      data: {
        challengeId: id,
        userId: user.id,
        date: today,
        status,
        xpEarned: xp + bonus,
      },
    })

    // Atualiza XP coletivo do grupo + escudo
    await prisma.challenge.update({
      where: { id },
      data: { collectiveXp: { increment: xp + bonus } },
    })
    await recomputeShield(id)

    const refreshed = await prisma.challenge.findUniqueOrThrow({ where: { id } })

    return reply.status(201).send({
      checkin: {
        id: checkin.id,
        challengeId: checkin.challengeId,
        userId: checkin.userId,
        date: checkin.date.toISOString(),
        status: checkin.status,
        xpEarned: checkin.xpEarned,
        createdAt: checkin.createdAt.toISOString(),
      },
      group: await serializeChallenge(refreshed),
      me: serializeMember(updatedMember, user.id),
    })
  })
}
