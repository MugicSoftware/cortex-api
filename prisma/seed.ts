import prisma from '../src/lib/prisma.js'

type SeedProfile = {
  id: string
  name: string
  level: number
  levelName: string
}

type SeedReaction = { authorId: string; type: string }

type SeedComment = {
  id: string
  authorId: string
  anonymous?: boolean
  text: string
  minutesAgo: number
  reactions?: SeedReaction[]
  parentCommentId?: string
}

type SeedPost = {
  id: string
  authorId: string
  anonymous?: boolean
  category: string
  type: string
  text: string
  minutesAgo: number
  reactions?: SeedReaction[]
  comments?: SeedComment[]
}

const profiles: SeedProfile[] = [
  { id: 'seed_carlos', name: 'Carlos', level: 9, levelName: 'Soberano' },
  { id: 'seed_marina', name: 'Marina', level: 6, levelName: 'Focado' },
  { id: 'seed_joao', name: 'João', level: 4, levelName: 'Disciplinado' },
  { id: 'seed_ana', name: 'Ana', level: 10, levelName: 'Mestre do Córtex' },
  { id: 'seed_anon', name: 'Lia', level: 5, levelName: 'Resiliente' },
  { id: 'seed_bruno', name: 'Bruno', level: 7, levelName: 'Determinado' },
  { id: 'seed_helena', name: 'Helena', level: 8, levelName: 'Forjado' },
]

const posts: SeedPost[] = [
  {
    id: 'seed_p_1',
    authorId: 'seed_anon',
    anonymous: true,
    category: 'smoking',
    type: 'pedidoApoio',
    text:
      'Estou com vontade agora depois do almoço. Esse é meu horário mais difícil. Vou tentar esperar 5 minutos antes de decidir.',
    minutesAgo: 12,
    reactions: [
      { authorId: 'seed_marina', type: 'apoio' },
      { authorId: 'seed_ana', type: 'apoio' },
      { authorId: 'seed_carlos', type: 'tamoJunto' },
      { authorId: 'seed_bruno', type: 'tamoJunto' },
    ],
    comments: [
      {
        id: 'seed_c_1a',
        authorId: 'seed_marina',
        text: 'Tamo junto. Esses 5 minutos costumam mudar tudo.',
        minutesAgo: 8,
        reactions: [{ authorId: 'seed_ana', type: 'apoio' }],
      },
      {
        id: 'seed_c_1b',
        authorId: 'seed_carlos',
        text: 'Já passei por aí. Respira fundo, você consegue.',
        minutesAgo: 4,
        reactions: [{ authorId: 'seed_helena', type: 'apoio' }],
      },
    ],
  },
  {
    id: 'seed_p_2',
    authorId: 'seed_marina',
    category: 'social_media',
    type: 'vitoria',
    text:
      'Ontem deixei o celular fora do quarto e consegui dormir sem rolar feed. Parece pequeno, mas para mim foi uma vitória enorme.',
    minutesAgo: 80,
    reactions: [
      { authorId: 'seed_carlos', type: 'vitoria' },
      { authorId: 'seed_ana', type: 'vitoria' },
      { authorId: 'seed_joao', type: 'vitoria' },
      { authorId: 'seed_ana', type: 'boaPausa' },
    ],
    comments: [
      {
        id: 'seed_c_2a',
        authorId: 'seed_ana',
        text: 'Não é pequeno não. Isso muda a noite inteira.',
        minutesAgo: 60,
        reactions: [{ authorId: 'seed_marina', type: 'apoio' }],
      },
    ],
  },
  {
    id: 'seed_p_3',
    authorId: 'seed_joao',
    category: 'food',
    type: 'reflexao',
    text:
      'Percebi que minha vontade de doce aparece mais quando estou cansado, não necessariamente com fome.',
    minutesAgo: 180,
    reactions: [
      { authorId: 'seed_marina', type: 'boaPausa' },
      { authorId: 'seed_ana', type: 'boaPausa' },
      { authorId: 'seed_helena', type: 'boaPausa' },
    ],
    comments: [
      {
        id: 'seed_c_3a',
        authorId: 'seed_helena',
        text: 'Mesma coisa aqui. Quando vejo, estou comendo sem fome.',
        minutesAgo: 160,
      },
    ],
  },
  {
    id: 'seed_p_4',
    authorId: 'seed_ana',
    category: 'shopping',
    type: 'estrategia',
    text:
      'Uma coisa que me ajudou foi colocar tudo no carrinho e esperar 24h antes de comprar. Na maioria das vezes a vontade passa.',
    minutesAgo: 300,
    reactions: [
      { authorId: 'seed_carlos', type: 'boaPausa' },
      { authorId: 'seed_marina', type: 'boaPausa' },
      { authorId: 'seed_joao', type: 'tamoJunto' },
      { authorId: 'seed_bruno', type: 'boaPausa' },
    ],
    comments: [
      {
        id: 'seed_c_4a',
        authorId: 'seed_bruno',
        text: 'Vou tentar essa hoje mesmo.',
        minutesAgo: 240,
      },
    ],
  },
  {
    id: 'seed_p_5',
    authorId: 'seed_carlos',
    category: 'studies',
    type: 'vitoria',
    text: 'Consegui estudar 40 minutos sem abrir o celular. O mais difícil foi começar.',
    minutesAgo: 420,
    reactions: [
      { authorId: 'seed_marina', type: 'vitoria' },
      { authorId: 'seed_ana', type: 'apoio' },
      { authorId: 'seed_helena', type: 'vitoria' },
    ],
  },
  {
    id: 'seed_p_6',
    authorId: 'seed_joao',
    category: 'smoking',
    type: 'recomeco',
    text:
      'Hoje eu cedi, mas registrei. Vou tentar não transformar um momento difícil em desistência.',
    minutesAgo: 540,
    reactions: [
      { authorId: 'seed_ana', type: 'recomeco' },
      { authorId: 'seed_marina', type: 'recomeco' },
      { authorId: 'seed_carlos', type: 'recomeco' },
      { authorId: 'seed_helena', type: 'apoio' },
    ],
    comments: [
      {
        id: 'seed_c_6a',
        authorId: 'seed_ana',
        text: 'Registrar é a parte mais importante. Tamo junto.',
        minutesAgo: 520,
      },
      {
        id: 'seed_c_6b',
        authorId: 'seed_marina',
        text: 'Amanhã é outro dia. Você está no caminho.',
        minutesAgo: 500,
      },
    ],
  },
  {
    id: 'seed_p_7',
    authorId: 'seed_marina',
    category: 'exercise',
    type: 'estrategia',
    text:
      'Deixar a roupa da academia separada na noite anterior diminuiu muito a chance de eu desistir de manhã.',
    minutesAgo: 720,
    reactions: [
      { authorId: 'seed_carlos', type: 'boaPausa' },
      { authorId: 'seed_ana', type: 'boaPausa' },
      { authorId: 'seed_joao', type: 'tamoJunto' },
    ],
  },
  {
    id: 'seed_p_8',
    authorId: 'seed_anon',
    anonymous: true,
    category: 'social_media',
    type: 'pedidoApoio',
    text: 'Estou tentando não abrir o aplicativo agora. Só precisava escrever isso em algum lugar.',
    minutesAgo: 1080,
    reactions: [
      { authorId: 'seed_marina', type: 'apoio' },
      { authorId: 'seed_carlos', type: 'apoio' },
      { authorId: 'seed_ana', type: 'apoio' },
      { authorId: 'seed_joao', type: 'tamoJunto' },
      { authorId: 'seed_bruno', type: 'tamoJunto' },
    ],
    comments: [
      {
        id: 'seed_c_8a',
        authorId: 'seed_helena',
        text: 'Escrever aqui já é uma pausa. Você não está sozinho.',
        minutesAgo: 1000,
      },
    ],
  },
  {
    id: 'seed_p_9',
    authorId: 'seed_bruno',
    category: 'studies',
    type: 'reflexao',
    text:
      'Engraçado como quando começo uma tarefa difícil, em 10 minutos a resistência some. O problema é sempre o início.',
    minutesAgo: 1400,
    reactions: [
      { authorId: 'seed_ana', type: 'boaPausa' },
      { authorId: 'seed_marina', type: 'boaPausa' },
    ],
  },
  {
    id: 'seed_p_10',
    authorId: 'seed_helena',
    category: 'exercise',
    type: 'vitoria',
    text: 'Sete dias seguidos bebendo água assim que acordo. Pequeno hábito, grande mudança.',
    minutesAgo: 1700,
    reactions: [
      { authorId: 'seed_carlos', type: 'vitoria' },
      { authorId: 'seed_marina', type: 'vitoria' },
      { authorId: 'seed_ana', type: 'tamoJunto' },
    ],
    comments: [
      {
        id: 'seed_c_10a',
        authorId: 'seed_joao',
        text: 'Inspirador. Vou começar amanhã.',
        minutesAgo: 1600,
      },
    ],
  },
]

function minutesAgoToDate(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000)
}

async function main() {
  console.log('🌱 Seed community: começando…')

  for (const p of profiles) {
    await prisma.communityProfile.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        level: p.level,
        levelName: p.levelName,
        seed: true,
      },
      create: {
        id: p.id,
        name: p.name,
        level: p.level,
        levelName: p.levelName,
        seed: true,
      },
    })
  }

  for (const post of posts) {
    const createdAt = minutesAgoToDate(post.minutesAgo)
    await prisma.communityPost.upsert({
      where: { id: post.id },
      update: {
        authorId: post.authorId,
        anonymous: post.anonymous ?? false,
        category: post.category,
        type: post.type,
        text: post.text,
        createdAt,
      },
      create: {
        id: post.id,
        authorId: post.authorId,
        anonymous: post.anonymous ?? false,
        category: post.category,
        type: post.type,
        text: post.text,
        createdAt,
      },
    })

    // Reset reactions for idempotência
    await prisma.communityReaction.deleteMany({ where: { postId: post.id } })
    for (const r of post.reactions ?? []) {
      await prisma.communityReaction.create({
        data: {
          postId: post.id,
          authorId: r.authorId,
          type: r.type,
          createdAt,
        },
      })
    }

    // Comments
    for (const c of post.comments ?? []) {
      const cCreatedAt = minutesAgoToDate(c.minutesAgo)
      await prisma.communityComment.upsert({
        where: { id: c.id },
        update: {
          postId: post.id,
          parentCommentId: c.parentCommentId ?? null,
          authorId: c.authorId,
          anonymous: c.anonymous ?? false,
          text: c.text,
          createdAt: cCreatedAt,
        },
        create: {
          id: c.id,
          postId: post.id,
          parentCommentId: c.parentCommentId ?? null,
          authorId: c.authorId,
          anonymous: c.anonymous ?? false,
          text: c.text,
          createdAt: cCreatedAt,
        },
      })
      await prisma.communityReaction.deleteMany({ where: { commentId: c.id } })
      for (const r of c.reactions ?? []) {
        await prisma.communityReaction.create({
          data: {
            commentId: c.id,
            authorId: r.authorId,
            type: r.type,
            createdAt: cCreatedAt,
          },
        })
      }
    }
  }

  console.log(`🌱 Seed pronto: ${profiles.length} perfis, ${posts.length} posts.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
