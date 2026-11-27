import { serverSupabaseUser } from '#supabase/server'
import { GoogleGenAI } from '@google/genai'
import { parseFallbackDurationHours } from '../../utils/quickParseFallback'
import { requireAiUser } from '../../utils/aiAuth'
import { consumeAiQuota } from '../../utils/aiQuota'
import { limitAiText } from '../../utils/aiInput'

/**
 * Sprint 3 — AI Natural Language Quick Add
 * POST /api/ai/quick-parse
 *
 * Menerima teks bahasa alami dari dashboard (mis. "Beli domain besok jam 3 sore
 * untuk proyek TaktVibe prioritas urgent estimasi 2 jam") dan mengekstrak
 * atribut tugas dalam format JSON terstruktur.
 */
export default defineEventHandler(async (event) => {
  // 1. Verifikasi Autentikasi Pengguna
  const user = await requireAiUser(() => serverSupabaseUser(event))
  if (!consumeAiQuota(user.id)) {
    throw createError({ statusCode: 429, statusMessage: 'Kuota AI per jam terlampaui. Coba lagi nanti.' })
  }

  // 2. Baca dan validasi payload
  const body = await readBody(event)
  const prompt = limitAiText(body?.prompt)
  const currentProjects: string[] = Array.isArray(body?.current_projects) ? body.current_projects.slice(0, 20).map(limitAiText) : []

  if (!prompt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: Teks input (prompt) wajib diisi.'
    })
  }

  // 3. Ambil API Key dari runtime config
  const config = useRuntimeConfig()
  const geminiApiKey = config.geminiApiKey

  // 4. Fallback cerdas bila API key belum disetel atau saat error
  const fallback = (): any => {
    const lower = prompt.toLowerCase()
    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM'
    if (/(urgen|kesan|segera|asap|mendesak|penting sekali)/.test(lower)) priority = 'URGENT'
    else if (/(tinggi|penting|high|prioritas tinggi)/.test(lower)) priority = 'HIGH'
    else if (/(rendah|low|ringan|praktis)/.test(lower)) priority = 'LOW'

    const estimatedHours = parseFallbackDurationHours(prompt)

    return {
      success: true,
      title: prompt,
      project: null,
      priority,
      due_date: null,
      estimated_hours: estimatedHours,
      tags: extractFallbackTags(prompt),
      isFallback: true,
      message: 'Mode fallback aktif. Pasang NUXT_GEMINI_API_KEY di file .env untuk ekstraksi AI yang lebih akurat.'
    }
  }

  if (!geminiApiKey) {
    return fallback()
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey })

    const promptText = `
Anda adalah asisten manajemen tugas dan produktivitas profesional untuk aplikasi TaktVibe.
Tugas Anda adalah mengekstrak atribut tugas dari teks bahasa alami pengguna.

Contoh teks input: "Beli domain besok jam 3 sore untuk proyek TaktVibe prioritas urgent estimasi 2 jam"
Atribut yang diekstrak:
1. "title" — string: judul tugas yang jelas, singkat, dan dapat dieksekusi. Boleh mengandung objek/acara (mis. "Kirim invoice bulan lalu"), tanpa kata kerja pengantar berlebih.
2. "due_date" — string ISO 8601 (mis. "2026-10-24T15:00:00.000Z") ATAU null jika tidak disebutkan waktu/tenggat.
3. "priority" — salah satu dari: "LOW", "MEDIUM", "HIGH", "URGENT".
4. "project" — string: nama ruang kerja (space) yang relevan dari daftar user, atau null jika tidak ada.
5. "estimated_hours" — angka (jam) ATAU 0 jika tidak ada.
6. "tags" — array string (lowercase tanpa '#', mis. ["infra"]) dari label/keynote yang relevan, atau array kosong.

Kembalikan HANYA format JSON valid dengan struktur:
{
  "title": "Deskripsi singkat judul tugas",
  "due_date": "2026-10-24T15:00:00.000Z" atau null,
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "project": "Nama Ruang Kerja" atau null,
  "estimated_hours": 0,
  "tags": ["tag1", "tag2"]
}

Tidak boleh menambahkan field lain selain struktur di atas.
`.trim()

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json'
      }
    })

    const rawResponse = response.text || ''
    let parsed: any = null

    try {
      parsed = JSON.parse(rawResponse)
    } catch (parseErr) {
      const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(cleanJson)
    }

    const extracted = parsed && typeof parsed === 'object' ? parsed : {}

    const title = String(extracted.title || prompt).trim()
    const priority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(String(extracted.priority || '').toUpperCase())
      ? String(extracted.priority).toUpperCase()
      : 'MEDIUM'
    const estimatedHours = Number(extracted.estimated_hours) > 0 ? Number(extracted.estimated_hours) : 0
    const tags: string[] = Array.isArray(extracted.tags) ? extracted.tags.map((t: any) => String(t).trim().toLowerCase().replace(/^#/, '')).filter(Boolean) : []
    const dueDate: string | null = extracted.due_date ? new Date(extracted.due_date).toISOString() : null
    const project: string | null = extracted.project ? String(extracted.project) : null

    return {
      success: true,
      title,
      project,
      priority,
      due_date: dueDate,
      estimated_hours: estimatedHours,
      tags,
      isFallback: false
    }
  } catch (err: any) {
    console.error('[AI Quick Parse Error]:', err)
    return fallback()
  }
})

/**
 * Helper fallback: mengekstrak field tugas dasar dari prompt tanpa AI.
 */
function extractFallbackTags(prompt: string): string[] {
  const stopWords = new Set(['untuk', 'dengan', 'kepada', 'dari', 'yang', 'adalah', 'buat', 'tugas', 'task', 'milik', 'ke', 'di', 'pada', 'dalam', 'kegiatan', 'hari', 'ini'])
  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w) && !['jam', 'menit', 'detik', 'estimasi', 'prioritas', 'tenggat', 'batas', 'waktu', 'buat', 'adalah', 'dengan'].includes(w))
  const unique = Array.from(new Set(words)).slice(0, 5)
  return unique.length ? unique : ['general']
}
