// Seed dedicado aos Desafios Coletivos. Cria usuários reais (com senha,
// pra você logar e ver de perspectivas diferentes), grupos, membros,
// mensagens e algumas entradas de progresso diário.
//
// Senha unificada: teste123
// Usuários: ana, joao, marina, helena, carlos, lia, rafa
//
// Idempotente: rerodar não duplica nada.

import argon2 from 'argon2'
import prisma from '../src/lib/prisma.js'

const PASSWORD = 'teste123'

type SeedUser = {
  username: string
  name: string
  level: number
  levelName: string
}

const seedUsers: SeedUser[] = [
  { username: 'ana', name: 'Ana', level: 10, levelName: 'Mestre do Córtex' },
  { username: 'joao', name: 'João', level: 6, levelName: 'Focado' },
  { username: 'marina', name: 'Marina', level: 7, levelName: 'Determinado' },
  { username: 'helena', name: 'Helena', level: 8, levelName: 'Forjado' },
  { username: 'carlos', name: 'Carlos', level: 9, levelName: 'Soberano' },
  { username: 'lia', name: 'Lia', level: 5, levelName: 'Resiliente' },
  { username: 'rafa', name: 'Rafa', level: 3, levelName: 'Atento' },
]

type SeedMember = {
  username: string
  xpInChallenge: number
  completedDays: number
  currentStreak: number
  hasCheckedInToday: boolean
}

type SeedMessage = {
  username: string
  text: string
  hoursAgo: number
}

type SeedDailyProgress = {
  daysAgo: number
  checkedIn: number
  completed: number
  difficult: number
}

type SeedChallenge = {
  id: string
  name: string
  description: string
  category: string
  habitType: 'avoid' | 'conquer'
  visibility: 'public' | 'private'
  inviteCode: string
  daysAgoStart: number
  durationDays: number
  createdBy: string
  members: SeedMember[]
  messages: SeedMessage[]
  daily: SeedDailyProgress[]
}

const challenges: SeedChallenge[] = [
  {
    id: 'seed_chl_coffee7',
    name: '7 dias sem café',
    description: 'Atravessar uma semana sem café. Um dia de cada vez.',
    category: 'coffee',
    habitType: 'avoid',
    visibility: 'public',
    inviteCode: 'CAFE7',
    daysAgoStart: 3,
    durationDays: 7,
    createdBy: 'helena',
    members: [
      { username: 'helena', xpInChallenge: 12, completedDays: 4, currentStreak: 4, hasCheckedInToday: true },
      { username: 'lia',    xpInChallenge: 9,  completedDays: 3, currentStreak: 3, hasCheckedInToday: true },
      { username: 'carlos', xpInChallenge: 10, completedDays: 3, currentStreak: 1, hasCheckedInToday: true },
      { username: 'marina', xpInChallenge: 7,  completedDays: 2, currentStreak: 0, hasCheckedInToday: false },
      { username: 'joao',   xpInChallenge: 6,  completedDays: 2, currentStreak: 2, hasCheckedInToday: true },
      { username: 'ana',    xpInChallenge: 4,  completedDays: 1, currentStreak: 1, hasCheckedInToday: false },
    ],
    messages: [
      { username: 'helena', text: 'Bora atravessar só mais um dia. ☕✋', hoursAgo: 22 },
      { username: 'carlos', text: 'Hoje foi difícil, mas sigo no desafio.', hoursAgo: 10 },
      { username: 'lia',    text: 'Se bater vontade, escreve aqui antes.', hoursAgo: 3 },
    ],
    daily: [
      { daysAgo: 3, checkedIn: 6, completed: 5, difficult: 1 },
      { daysAgo: 2, checkedIn: 5, completed: 4, difficult: 1 },
      { daysAgo: 1, checkedIn: 6, completed: 6, difficult: 0 },
      { daysAgo: 0, checkedIn: 4, completed: 4, difficult: 0 },
    ],
  },
  {
    id: 'seed_chl_reading30',
    name: '30 dias de leitura',
    description: 'Ler todo dia, nem que sejam 5 minutos.',
    category: 'reading',
    habitType: 'conquer',
    visibility: 'private',
    inviteCode: 'LEIT30',
    daysAgoStart: 7,
    durationDays: 30,
    createdBy: 'joao',
    members: [
      { username: 'joao', xpInChallenge: 120, completedDays: 7, currentStreak: 7, hasCheckedInToday: true },
      { username: 'ana',  xpInChallenge: 90,  completedDays: 6, currentStreak: 3, hasCheckedInToday: true },
      { username: 'lia',  xpInChallenge: 45,  completedDays: 4, currentStreak: 1, hasCheckedInToday: false },
    ],
    messages: [
      { username: 'joao', text: 'Já fiz meu check-in. 📚', hoursAgo: 5 },
      { username: 'ana',  text: 'Terminei um capítulo agora. Bora!', hoursAgo: 1 },
    ],
    daily: [
      { daysAgo: 7, checkedIn: 3, completed: 3, difficult: 0 },
      { daysAgo: 6, checkedIn: 2, completed: 2, difficult: 0 },
      { daysAgo: 5, checkedIn: 3, completed: 3, difficult: 0 },
      { daysAgo: 4, checkedIn: 2, completed: 2, difficult: 0 },
      { daysAgo: 3, checkedIn: 3, completed: 3, difficult: 0 },
      { daysAgo: 2, checkedIn: 3, completed: 3, difficult: 0 },
      { daysAgo: 1, checkedIn: 3, completed: 3, difficult: 0 },
      { daysAgo: 0, checkedIn: 2, completed: 2, difficult: 0 },
    ],
  },
  {
    id: 'seed_chl_socialnight14',
    name: '14 dias sem redes à noite',
    description: 'Largar o celular depois das 22h.',
    category: 'social_media',
    habitType: 'avoid',
    visibility: 'private',
    inviteCode: 'NITE14',
    daysAgoStart: 5,
    durationDays: 14,
    createdBy: 'marina',
    members: [
      { username: 'marina', xpInChallenge: 18, completedDays: 5, currentStreak: 5, hasCheckedInToday: true },
      { username: 'helena', xpInChallenge: 12, completedDays: 4, currentStreak: 2, hasCheckedInToday: true },
      { username: 'carlos', xpInChallenge: 9,  completedDays: 3, currentStreak: 0, hasCheckedInToday: false },
      { username: 'rafa',   xpInChallenge: 6,  completedDays: 2, currentStreak: 1, hasCheckedInToday: true },
    ],
    messages: [
      { username: 'marina', text: 'Consegui largar o celular antes das 23h.', hoursAgo: 18 },
      { username: 'rafa',   text: 'Esse grupo está me ajudando a não esquecer.', hoursAgo: 2 },
    ],
    daily: [
      { daysAgo: 5, checkedIn: 4, completed: 3, difficult: 1 },
      { daysAgo: 4, checkedIn: 3, completed: 3, difficult: 0 },
      { daysAgo: 3, checkedIn: 4, completed: 3, difficult: 1 },
      { daysAgo: 2, checkedIn: 2, completed: 2, difficult: 0 },
      { daysAgo: 1, checkedIn: 4, completed: 4, difficult: 0 },
      { daysAgo: 0, checkedIn: 3, completed: 2, difficult: 1 },
    ],
  },
  {
    id: 'seed_chl_gym14',
    name: 'Academia sem desculpa',
    description: 'Treinar 5x por semana.',
    category: 'exercise',
    habitType: 'conquer',
    visibility: 'public',
    inviteCode: 'ACAD14',
    daysAgoStart: 3,
    durationDays: 14,
    createdBy: 'marina',
    members: [
      { username: 'marina', xpInChallenge: 90, completedDays: 3, currentStreak: 3, hasCheckedInToday: true },
      { username: 'ana',    xpInChallenge: 72, completedDays: 3, currentStreak: 2, hasCheckedInToday: true },
      { username: 'carlos', xpInChallenge: 54, completedDays: 2, currentStreak: 1, hasCheckedInToday: false },
    ],
    messages: [
      { username: 'marina', text: 'Consegui fazer meu check-in agora. 💪', hoursAgo: 6 },
      { username: 'ana',    text: 'Treino curto hoje, mas treino.', hoursAgo: 2 },
    ],
    daily: [
      { daysAgo: 3, checkedIn: 3, completed: 3, difficult: 0 },
      { daysAgo: 2, checkedIn: 2, completed: 2, difficult: 0 },
      { daysAgo: 1, checkedIn: 3, completed: 3, difficult: 0 },
      { daysAgo: 0, checkedIn: 2, completed: 2, difficult: 0 },
    ],
  },
]

function dayKey(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

async function ensureUser(u: SeedUser): Promise<string> {
  const hash = await argon2.hash(PASSWORD)
  const user = await prisma.user.upsert({
    where: { username: u.username },
    update: {},
    create: { username: u.username, hash },
  })
  await prisma.communityProfile.upsert({
    where: { userId: user.id },
    update: {
      name: u.name,
      level: u.level,
      levelName: u.levelName,
      seed: true,
    },
    create: {
      userId: user.id,
      name: u.name,
      level: u.level,
      levelName: u.levelName,
      seed: true,
    },
  })
  return user.id
}

function computeCollectiveXp(c: SeedChallenge): number {
  let xp = 0
  for (const d of c.daily) {
    xp += d.completed * 3
    if (c.habitType === 'avoid') xp += d.difficult * 1
    // bônus 70% e 100% por dia
    const total = c.members.length
    const prevRatio = 0 // simplificado pra seed
    const ratio = total === 0 ? 0 : d.checkedIn / total
    if (prevRatio < 0.7 && ratio >= 0.7) xp += 10
    if (prevRatio < 1.0 && ratio >= 1.0) xp += 20
  }
  return xp
}

function computeShieldPercent(c: SeedChallenge): number {
  if (c.daily.length === 0) return c.habitType === 'avoid' ? 100 : 0
  const total = c.members.length
  const recent = c.daily.slice(-7)
  const rates = recent.map((d) =>
    total === 0 ? 0 : d.checkedIn / total,
  )
  const avg = rates.reduce((a, b) => a + b, 0) / rates.length
  return Math.max(0, Math.min(100, Math.round(avg * 100)))
}

async function ensureChallenge(c: SeedChallenge, userIds: Map<string, string>) {
  const start = dayKey(new Date(Date.now() - c.daysAgoStart * 24 * 60 * 60 * 1000))
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + c.durationDays - 1)
  const createdById = userIds.get(c.createdBy)!
  const collectiveXp = computeCollectiveXp(c)
  const shield = computeShieldPercent(c)

  await prisma.challenge.upsert({
    where: { id: c.id },
    update: {
      name: c.name,
      description: c.description,
      category: c.category,
      habitType: c.habitType,
      visibility: c.visibility,
      inviteCode: c.inviteCode,
      startDate: start,
      endDate: end,
      createdByUserId: createdById,
      collectiveXp,
      groupShieldPercent: shield,
    },
    create: {
      id: c.id,
      name: c.name,
      description: c.description,
      category: c.category,
      habitType: c.habitType,
      visibility: c.visibility,
      inviteCode: c.inviteCode,
      startDate: start,
      endDate: end,
      createdByUserId: createdById,
      collectiveXp,
      groupShieldPercent: shield,
    },
  })

  // Members — reset todos e re-cria pra refletir mock atual
  await prisma.challengeMember.deleteMany({ where: { challengeId: c.id } })
  const today = dayKey(new Date())
  for (const m of c.members) {
    const uid = userIds.get(m.username)
    if (!uid) continue
    await prisma.challengeMember.create({
      data: {
        challengeId: c.id,
        userId: uid,
        xpInChallenge: m.xpInChallenge,
        completedDays: m.completedDays,
        currentStreak: m.currentStreak,
        hasCheckedInToday: m.hasCheckedInToday,
        lastCheckinDate: m.hasCheckedInToday ? new Date() : null,
        joinedAt: start,
      },
    })
  }

  // Messages — reset
  await prisma.challengeMessage.deleteMany({ where: { challengeId: c.id } })
  for (const msg of c.messages) {
    const uid = userIds.get(msg.username)
    if (!uid) continue
    const createdAt = new Date(Date.now() - msg.hoursAgo * 60 * 60 * 1000)
    await prisma.challengeMessage.create({
      data: {
        challengeId: c.id,
        userId: uid,
        text: msg.text,
        createdAt,
      },
    })
  }

  // Daily progress — reset
  await prisma.challengeDailyProgress.deleteMany({ where: { challengeId: c.id } })
  const totalMembers = c.members.length
  for (const d of c.daily) {
    const date = dayKey(new Date(today.getTime() - d.daysAgo * 24 * 60 * 60 * 1000))
    const xp = d.completed * 3 + (c.habitType === 'avoid' ? d.difficult : 0)
    await prisma.challengeDailyProgress.create({
      data: {
        challengeId: c.id,
        date,
        totalMembers,
        checkedInCount: d.checkedIn,
        completedCount: d.completed,
        difficultCount: d.difficult,
        collectiveXpEarned: xp,
      },
    })
  }

  // Limpa check-ins individuais antigos do seed (mantém histórico real
  // dos usuários se houvesse, mas como esses users são de seed, dropar
  // o que tiver associado a esse challenge é seguro).
  await prisma.challengeCheckin.deleteMany({ where: { challengeId: c.id } })
}

async function main() {
  console.log('🌱 Seed challenges: começando…')
  const userIds = new Map<string, string>()
  for (const u of seedUsers) {
    const id = await ensureUser(u)
    userIds.set(u.username, id)
  }
  console.log(`  → ${seedUsers.length} usuários (senha: ${PASSWORD})`)

  for (const c of challenges) {
    await ensureChallenge(c, userIds)
    console.log(`  → desafio "${c.name}" (${c.members.length} membros, código ${c.inviteCode})`)
  }
  console.log(`🌱 Seed challenges pronto.\n`)
  console.log(`Logins disponíveis (senha: ${PASSWORD}):`)
  for (const u of seedUsers) {
    console.log(`  - ${u.username}`)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
