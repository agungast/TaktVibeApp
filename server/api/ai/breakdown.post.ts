import { serverSupabaseUser } from '#supabase/server'
import { GoogleGenAI } from '@google/genai'
import { requireAiUser } from '../../utils/aiAuth'
import { consumeAiQuota } from '../../utils/aiQuota'
import { limitAiText } from '../../utils/aiInput'

export default defineEventHandler(async (event) => {
  // 1. Verifikasi Autentikasi Pengguna
  const user = await requireAiUser(() => serverSupabaseUser(event))
  if (!consumeAiQuota(user.id)) {
    throw createError({ statusCode: 429, statusMessage: 'Kuota AI per jam terlampaui. Coba lagi nanti.' })
  }

  // 2. Baca dan validasi payload
  const body = await readBody(event)
  const title = limitAiText(body?.title)
  const description = limitAiText(body?.description)

  if (!title) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: Judul tugas (title) wajib diisi.'
    })
  }

  // 3. Ambil API Key dari runtime config
  const config = useRuntimeConfig()
  const geminiApiKey = config.geminiApiKey || process.env.GEMINI_API_KEY

  // 4. Jika API Key belum disetel, berikan fallback cerdas berbasis heuristik
  if (!geminiApiKey) {
    console.warn('[AI Breakdown] GEMINI_API_KEY tidak ditemukan. Menggunakan generator fallback.')
    return {
      success: true,
      subtasks: generateSmartFallbackSubtasks(title, description),
      isFallback: true,
      message: 'Mode fallback aktif. Pasang GEMINI_API_KEY di file .env untuk hasil analisis AI penuh.'
    }
  }

  // 5. Panggil Google Gemini API
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey })

    const promptText = `
Anda adalah asisten manajemen tugas dan produktivitas profesional untuk aplikasi TaktVibe.
Tugas Anda adalah menganalisis tugas pengguna berikut, lalu memecahnya menjadi 4 hingga 6 subtask checklist yang konkret, terstruktur, langsung dapat dieksekusi (actionable), dan tidak bertele-tele.

Judul Tugas: "${title}"
${description ? `Konteks/Deskripsi Tugas:\n"${description}"` : ''}

Ketentuan:
1. Setiap subtask harus berupa instruksi singkat yang jelas dan realistis diselesaikan dalam 1 sesi fokus (15-45 menit).
2. Gunakan Bahasa Indonesia yang natural, profesional, dan lugas.
3. Kembalikan HANYA format JSON valid dengan struktur:
{
  "subtasks": [
    "Subtask 1",
    "Subtask 2",
    "Subtask 3",
    "Subtask 4"
  ]
}
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
      // Pembersihan jika ada markdown formatting
      const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(cleanJson)
    }

    if (parsed && Array.isArray(parsed.subtasks) && parsed.subtasks.length > 0) {
      const sanitizedSubtasks = parsed.subtasks
        .map((s: any) => String(s).trim())
        .filter((s: string) => s.length > 0)
        .slice(0, 8)

      return {
        success: true,
        subtasks: sanitizedSubtasks,
        isFallback: false
      }
    }

    // Fallback jika respons tidak memiliki format subtasks yang diharapkan
    return {
      success: true,
      subtasks: generateSmartFallbackSubtasks(title, description),
      isFallback: true,
      message: 'Format model tidak sesuai, mengalihkan ke subtask terstruktur.'
    }
  } catch (err: any) {
    console.error('[AI Breakdown Error]:', err)
    // Jangan biarkan aplikasi crash jika API error/kuota habis, berikan fallback dengan pesan ramah
    return {
      success: true,
      subtasks: generateSmartFallbackSubtasks(title, description),
      isFallback: true,
      message: `Terjadi kendala saat menghubungi AI (${err?.message || 'Network error'}). Menampilkan subtask rekomendasi.`
    }
  }
})

/**
 * Generator subtask cerdas cadangan jika API key belum diisi atau offline
 */
function generateSmartFallbackSubtasks(title: string, description: string): string[] {
  const lower = (title + ' ' + description).toLowerCase()

  if (lower.includes('bug') || lower.includes('error') || lower.includes('fix') || lower.includes('perbaiki')) {
    return [
      `Reproduksi bug "${title}" di lingkungan lokal`,
      'Analisis log error dan identifikasi akar masalah',
      'Tulis perbaikan kode pada modul terkait',
      'Uji coba skenario edge-case dan verifikasi perbaikan',
      'Dokumentasikan catatan perubahan'
    ]
  }

  if (lower.includes('auth') || lower.includes('login') || lower.includes('daftar') || lower.includes('register')) {
    return [
      'Rancang alur validasi input form dan state error',
      'Integrasikan endpoint autentikasi Supabase',
      'Kelola sesi token & proteksi route middleware',
      'Uji coba alur login sukses, gagal, dan reset password'
    ]
  }

  if (lower.includes('desain') || lower.includes('ui') || lower.includes('tampilan') || lower.includes('landing')) {
    return [
      'Tentukan hierarki konten dan struktur wireframe',
      'Terapkan komponen dengan token warna & font Outfit',
      'Pastikan responsivitas pada layar mobile & desktop',
      'Periksa kontras warna dan kelancaran transisi interaksi'
    ]
  }

  if (lower.includes('api') || lower.includes('backend') || lower.includes('database') || lower.includes('migrasi')) {
    return [
      'Definisikan skema tabel dan relasi data',
      'Buat dan jalankan skrip migrasi SQL dengan kebijakan RLS',
      'Implementasikan endpoint handler dan validasi payload',
      'Uji coba kueri database dengan skenario beban'
    ]
  }

  return [
    `Riset dan identifikasi kebutuhan untuk "${title}"`,
    'Rancang langkah implementasi awal',
    'Eksekusi pengerjaan inti secara bertahap',
    'Review hasil akhir dan lakukan pengujian',
    'Tandai tugas sebagai selesai dan evaluasi durasi'
  ]
}
