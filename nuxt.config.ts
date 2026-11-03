// https://nuxt.com/docs/api/configuration/nuxt-config

// Skrip anti-FOUC agar mode terang/gelap sudah benar sebelum halaman dirender.
const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('taktvibe_theme')||localStorage.getItem('taskflow_theme');if(t==='light'||(!t&&window.matchMedia('(prefers-color-scheme: light)').matches)){document.documentElement.classList.add('light');document.documentElement.setAttribute('data-theme','light');}else{document.documentElement.classList.remove('light');document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    'nuxt-security',
    '@vite-pwa/nuxt'
  ],
  runtimeConfig: {
    geminiApiKey: process.env.GEMINI_API_KEY || ''
  },
  css: [
    '~/assets/css/theme.css'
  ],
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: 'TaktVibe',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'TaktVibe - Personal Task & Knowledge Management System dengan Kanban, Kalender, Spaces, dan Markdown Notes.' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/images/logo-icon.png' },
        // Font dimuat lewat <link> (bukan CSS @import) supaya non-blocking dan
        // tetap konsisten dengan CSP.
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap' }
      ],
      script: [
        {
          innerHTML: THEME_BOOT_SCRIPT,
          type: 'text/javascript'
        }
      ]
    }
  },
  supabase: {
    redirect: false,
    cookieOptions: {
      // WAJIB true di produksi: cookie sesi Supabase adalah httpOnly bearer
      // token. Dengan `secure: false` token itu ikut terkirim bila situs
      // diakses lewat HTTP, sehingga vulnerable terhadap session hijacking.
      // Di development HTTP lokal, browser TIDAK akan menyimpan cookie
      // `secure`, jadi nilainya dibuat kontekstual.
      secure: process.env.NODE_ENV === 'production'
    }
  },
  // CSP ketat berbasis nonce. `nuxt-security` menambahkan nonce ke setiap
  // <script> inline yang digenerate Nuxt (import map, runtime config, dan
  // skrip anti-FOUC tema), lalu `'strict-dynamic'` mengizinkan skrip turunan
  // yang disisipkan saat hidrasi.
  security: {
    nonce: true,
    // Aplikasi memakai Supabase langsung dari browser; filter ini hanya
    // menambah risiko 403/429 palsu tanpa proteksi berarti.
    rateLimiter: false,
    xssValidator: false,
    headers: {
      referrerPolicy: 'strict-origin-when-cross-origin',
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'nonce-{{nonce}}'", "'strict-dynamic'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
        'img-src': ["'self'", 'data:', 'blob:', 'https://*.supabase.co', 'https://lh3.googleusercontent.com', 'https://*.googleusercontent.com'],
        // Koneksi REST + WebSocket milik Supabase.
        'connect-src': ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
        'media-src': ["'self'", 'blob:', 'https://*.supabase.co'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        // Hanya di produksi (HTTPS). Di dev HTTP ini memaksa aset di-upgrade
        // ke HTTPS sehingga CSS/JS gagal dimuat saat diakses lewat IP LAN.
        'upgrade-insecure-requests': process.env.NODE_ENV === 'production'
      }
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'TaktVibe',
      short_name: 'TaktVibe',
      description: 'Personal Task & Knowledge Management System',
      theme_color: '#090d16',
      background_color: '#090d16',
      display: 'standalone',
      icons: [
        { src: '/images/logo-icon.png', sizes: '192x192', type: 'image/png' },
        { src: '/images/logo-icon.png', sizes: '512x512', type: 'image/png' }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg,ico,woff2}']
    },
    devOptions: {
      enabled: false
    }
  }
})
