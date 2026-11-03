<template>
  <div class="callback-loading">
    <div class="spinner"></div>
    <p>Memproses masuk dengan Google...</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()

onMounted(async () => {
  // @nuxtjs/supabase (flow PKCE + detectSessionInUrl) sudah otomatis menukar
  // `?code=` saat inisialisasi. Memanggil exchangeCodeForSession() di sini
  // membuat code verifier terpakai dua kali dan exchange-nya gagal.
  // Cukup tunggu event auth pertama yang membawa session.
  const signedIn = await new Promise<boolean>((resolve) => {
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session || settled) return
      settled = true
      clearTimeout(timer)
      data.subscription.unsubscribe()
      resolve(true)
    })

    // Batas waktu untuk tautan kedaluwarsa / OAuth dibatalkan. Jangan panggil
    // method auth lain di dalam callback di atas: itu bisa deadlock.
    timer = setTimeout(async () => {
      if (settled) return
      settled = true
      data.subscription.unsubscribe()
      try {
        const { data: check } = await supabase.auth.getSession()
        resolve(!!check.session)
      } catch {
        resolve(false)
      }
    }, 3000)
  })

  await navigateTo(signedIn ? '/dashboard' : '/login', { replace: true })
})
</script>

<style scoped>
.callback-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 12px;
  color: #cbd5e1;
  text-align: center;
  background-color: #0f172a; /* Opsional: beri warna background konsisten */
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(255, 255, 255, 0.18);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
