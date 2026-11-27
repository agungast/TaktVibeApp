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
  const message = limitAiText(body?.message)
  const history = Array.isArray(body?.history) ? body.history.slice(-6) : []
  const tasksSummary = Array.isArray(body?.tasks_summary) ? body.tasks_summary.slice(0, 20) : []

  if (!message) {
    throw createError({ statusCode: 400, statusMessage: 'Pesan wajib diisi.' })
  }

  const config = useRuntimeConfig()
  const geminiApiKey = config.geminiApiKey || process.env.GEMINI_API_KEY

  const fallback = () => {
    const lower = message.toLowerCase()
    if (lower.includes('prioritas') || lower.includes('mendesak') || lower.includes('urg')) {
      const urg = tasksSummary.filter((t: any) => (t.priority || '').toUpperCase() === 'URGENT')
      if (urg.length) return { reply: `Ada ${urg.length} tugas prioritas URGENT. Fokus ke yang paling dekat tenggatnya dulu.`, suggested_action: null }
      return { reply: 'Saat ini tidak ada tugas URGENT. Cek filter "Terlambat" untuk melihat yang perlu segera ditangani.', suggested_action: null }
    }
    return { reply: 'Saya bisa meringkas tugas aktif, menyarankan prioritas, atau membantu membuat tugas. Coba: "Tugas prioritas mana yang paling mendesak minggu ini?"', suggested_action: null }
  }

  if (!geminiApiKey) return fallback()

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey })
    const summaryText = tasksSummary.map((t: any, i: number) => `${i + 1}. [${limitAiText(t.status)}] ${limitAiText(t.title)} | prio:${limitAiText(t.priority)} | due:${limitAiText(t.due_date) || '-'} | est:${t.estimated_hours || 0}h`).join('\n')
    const historyText = history.map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${limitAiText(h.content)}`).join('\n')

    const promptText = `Anda adalah TaktVibe Copilot, asisten produktivitas untuk pengguna solo.
Jawab singkat, praktis, bahasa Indonesia.
Konteks tugas aktif:
${summaryText || '(tidak ada tugas)'}

Riwayat chat:
${historyText || '(kosong)'}

Pertanyaan: ${message}

Jika ada saran aksi (buat tugas/mindahkan status), sertakan suggested_action berupa JSON ringkas.
Kembalikan HANYA JSON: {"reply":"...", "suggested_action": null | {"type":"create_task"|"update_status","title":string,"status":string}}`

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: promptText,
      config: { responseMimeType: 'application/json' }
    })

    const raw = response.text || ''
    try {
      const parsed = JSON.parse(raw.replace(/```json/gi, '').replace(/```/g, '').trim())
      if (parsed && typeof parsed.reply === 'string') return { reply: parsed.reply, suggested_action: parsed.suggested_action || null }
    } catch {}
    return fallback()
  } catch (e: any) {
    console.error('[AI Chat Error]:', e)
    return fallback()
  }
})
