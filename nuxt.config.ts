// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/supabase'
  ],
  css: [
    '~/assets/css/theme.css'
  ],
  app: {
    head: {
      title: 'TaktVibe — Personal Task & Knowledge Management',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'TaktVibe - Personal Task & Knowledge Management System dengan Kanban, Kalender, Spaces, dan Markdown Notes.' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/images/logo-icon.png' }
      ],
      script: [
        {
          innerHTML: `(function(){try{var t=localStorage.getItem('taktvibe_theme')||localStorage.getItem('taskflow_theme');if(t==='light'||(!t&&window.matchMedia('(prefers-color-scheme: light)').matches)){document.documentElement.classList.add('light');document.documentElement.setAttribute('data-theme','light');}else{document.documentElement.classList.remove('light');document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`,
          type: 'text/javascript'
        }
      ]
    }
  },
  supabase: {
    redirect: false,
    cookieOptions: {
      secure: false
    }
  },
  vite: {
    server: {
      fs: {
        allow: ['..']
      }
    }
  }
})