import { FastifyInstance } from 'fastify'

// Tabela de categorias compartilhada entre hábitos e comunidade.
// Pra renomear/trocar emoji: edita aqui. O `tsx watch` recarrega o servidor
// automaticamente — não precisa rebuild da imagem.
//
// `id` é o que vai pro banco (Habit.categoryId / CommunityPost.category).
// `custom: true` em "other" sinaliza pro cliente revelar campos pra digitação.
export const CATEGORY_CONFIG = {
  version: 1,
  avoid: [
    { id: 'social_media', label: 'Redes sociais', emoji: '📱' },
    { id: 'smoking', label: 'Cigarro', emoji: '🚬' },
    { id: 'coffee', label: 'Café', emoji: '☕' },
    { id: 'alcohol', label: 'Álcool', emoji: '🍺' },
    { id: 'sweets', label: 'Doces', emoji: '🍫' },
    { id: 'food', label: 'Comida', emoji: '🍽️' },
    { id: 'shopping', label: 'Compras', emoji: '🛒' },
    { id: 'gaming', label: 'Jogos', emoji: '🎮' },
    { id: 'adult_content', label: 'Conteúdo adulto', emoji: '📵' },
    { id: 'other', label: 'Outro', emoji: '➕', custom: true },
  ],
  conquer: [
    { id: 'exercise', label: 'Exercício', emoji: '🏋️' },
    { id: 'studies', label: 'Estudos', emoji: '📚' },
    { id: 'water', label: 'Beber água', emoji: '💧' },
    { id: 'meditation', label: 'Meditação', emoji: '🧘' },
    { id: 'sleep', label: 'Sono', emoji: '🛏️' },
    { id: 'reading', label: 'Leitura', emoji: '📝' },
    { id: 'spirituality', label: 'Espiritualidade', emoji: '🙏' },
    { id: 'organization', label: 'Organização', emoji: '🧹' },
    { id: 'other', label: 'Outro', emoji: '➕', custom: true },
  ],
} as const

export const ALL_CATEGORY_IDS: ReadonlySet<string> = new Set(
  [...CATEGORY_CONFIG.avoid, ...CATEGORY_CONFIG.conquer].map((c) => c.id),
)

export default async function configRoutes(app: FastifyInstance) {
  app.get('/config/categories', async () => CATEGORY_CONFIG)
}
