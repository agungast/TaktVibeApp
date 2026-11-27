import { serverSupabaseUser } from '#supabase/server'
import { GoogleGenAI } from '@google/genai'
import { requireAiUser } from '../../utils/aiAuth'
import { consumeAiQuota } from '../../utils/aiQuota'
import { limitAiText } from '../../utils/aiInput'

export default defineEventHandler(async (event) => {
  const user = await requireAiUser(() => serverSupabaseUser(event))
  if (!consumeAiQuota(user.id)) {
    throw createError({ statusCode: 429, statusMessage: 'Kuota AI per jam terlampaui. Coba lagi nanti.' })
  }

  const body = await readBody(event)
  const period = body?.period === 'daily' ? 'daily' : 'weekly'
  const completedTasks = Array.isArray(body?.completed_tasks) ? body.completed_tasks.slice(0, 20) : []
  const pendingTasks = Array.isArray(body?.pending_tasks) ? body.pending_tasks.slice(0, 20) : []

  const config = useRuntimeConfig()
  const geminiApiKey = config.geminiApiKey

  const fallback = () => {
    const comp = completedTasks.length
    const pend = pendingTasks.length
    const high = pendingTasks.filter((t: any) => (t.priority || '').toUpperCase() === 'HIGH' || (t.priority || '').toUpperCase() === 'URGENT').length
    const lines = [
      `# Briefing ${period === 'daily' ? 'Harian' : 'Mingguan'}`,
      '',
      `- Selesai: ${comp}`,
      `- Tertunda: ${pend}`,
      `- Prioritas Tinggi/Urgent: ${high}`,
      '',
      '## Fokus Hari/Minggu Ini',
      high > 0 ? '- Selesaikan tugas prioritas tinggi/urgent terlebih dahulu.' : '- Lanjutkan tugas tertunda dengan estimasi paling kecil.',
      '- Jaga ritme fokus dan catat durasi aktual bila perlu.',
      ''
    ]
    return { summary_markdown: lines.join('\n'), highlights: [`${comp} tugas selesai`, `${high} prioritas perlu perhatian`] }
  }

  if (!geminiApiKey) return fallback()

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey })
    const compText = completedTasks.map((t: any) => `- ${limitAiText(t.title)} (${t.estimated_hours || 0}h)`).join('\n')
    const pendText = pendingTasks.map((t: any) => `- [${limitAiText(t.priority)}] ${limitAiText(t.title)} due:${limitAiText(t.due_date) || '-'} (${t.estimated_hours || 0}h)`).join('\n')
    const promptText = `Buat AI Standup & Weekly Briefing untuk pengguna solo TaktVibe.
Periode: ${period}
Selesai:
${compText || '(kosong)'}

Tertunda:
${pendText || '(kosong)'}

Keluarkan HANYA JSON: {"summary_markdown": "...", "highlights": ["...", "..."]}`
    const response = await ai.models.generateContent({ model: 'gemini-1.5-flash', contents: promptText, config: { responseMimeType: 'application/json' } })
    const raw = response.text || ''
    try {
      const parsed = JSON.parse(raw.replace(/```json/gi, '').replace(/```/g, '').trim())
      if (parsed?.summary_markdown) return { summary_markdown: parsed.summary_markdown, highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [] }
    } catch {}
    return fallback()
  } catch (e: any) {
    console.error('[AI Briefing Error]:', e)
    return fallback()
  }
})
