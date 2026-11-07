<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="authStore.showProfileModal"
        class="modal-backdrop"
        @click.self="authStore.closeProfileModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        <div class="modal-card">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-left">
              <div class="header-icon-wrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div>
                <h3 id="profile-modal-title" class="modal-title">Edit Profil Pengguna</h3>
                <p class="modal-subtitle">Kelola nama, foto profil, dan kata sandi akun Anda</p>
              </div>
            </div>
            <button class="modal-close-btn" @click="authStore.closeProfileModal" title="Tutup">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Form Body -->
          <form @submit.prevent="handleSaveProfile" class="modal-body">
            <!-- Alert Notifikasi -->
            <div v-if="authStore.profileError" class="alert-banner error">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ authStore.profileError }}</span>
            </div>

            <div v-if="authStore.profileSuccess" class="alert-banner success">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>{{ authStore.profileSuccess }}</span>
            </div>

            <!-- Section 1: Avatar Upload -->
            <div class="avatar-section">
              <div class="avatar-preview-wrap">
                <img
                  v-if="previewAvatarUrl || (authStore.avatarUrl && !removeAvatarRequested)"
                  :src="previewAvatarUrl || authStore.avatarUrl!"
                  alt="Avatar"
                  class="avatar-image"
                />
                <div v-else class="avatar-initials-circle">
                  {{ authStore.userInitials }}
                </div>

                <!-- Overlay Camera Button -->
                <label class="avatar-edit-badge" title="Ganti Foto Avatar">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    class="hidden-file-input"
                    @change="onAvatarFileChange"
                    :disabled="authStore.profileLoading"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </label>
              </div>

              <div class="avatar-actions-info">
                <div class="avatar-btn-row">
                  <label class="avatar-upload-btn" :class="{ disabled: authStore.profileLoading }">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      class="hidden-file-input"
                      @change="onAvatarFileChange"
                      :disabled="authStore.profileLoading"
                    />
                    <span>Pilih Foto Baru</span>
                  </label>

                  <button
                    v-if="previewAvatarUrl || (authStore.avatarUrl && !removeAvatarRequested)"
                    type="button"
                    class="avatar-remove-btn"
                    @click="handleRemoveAvatar"
                    :disabled="authStore.profileLoading"
                  >
                    Hapus Foto
                  </button>
                </div>
                <span class="avatar-hint">Format PNG, JPG, atau WebP hingga 3MB.</span>
              </div>
            </div>

            <!-- Section 2: Informasi Akun -->
            <div class="form-group">
              <label class="form-label">Email Akun</label>
              <div class="input-wrapper disabled-wrapper">
                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input
                  type="email"
                  :value="authStore.userEmail"
                  disabled
                  class="form-input readonly-input"
                />
                <span class="verified-badge" title="Akun Terdaftar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Terdaftar
                </span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Nama Lengkap <span class="required">*</span></label>
              <div class="input-wrapper">
                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  v-model="form.fullName"
                  type="text"
                  placeholder="Masukkan nama lengkap Anda..."
                  required
                  class="form-input"
                  :disabled="authStore.profileLoading"
                />
              </div>
            </div>

            <!-- Section 3: Keamanan / Ganti Password (Accordion) -->
            <div class="security-section">
              <button
                type="button"
                class="security-toggle-btn"
                @click="showPasswordFields = !showPasswordFields"
              >
                <div class="toggle-title-wrap">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span>Ganti Kata Sandi (Opsional)</span>
                </div>
                <svg
                  class="chevron-toggle"
                  :class="{ rotated: showPasswordFields }"
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              <Transition name="expand">
                <div v-if="showPasswordFields" class="security-fields">
                  <!-- Kata Sandi Baru -->
                  <div class="form-group">
                    <label class="form-label">Kata Sandi Baru</label>
                    <div class="input-wrapper">
                      <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      <input
                        v-model="form.newPassword"
                        :type="showPassword ? 'text' : 'password'"
                        placeholder="Minimal 6 karakter"
                        minlength="6"
                        class="form-input"
                        :disabled="authStore.profileLoading"
                      />
                      <button
                        type="button"
                        class="password-eye-btn"
                        @click="showPassword = !showPassword"
                      >
                        <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Konfirmasi Kata Sandi Baru -->
                  <div class="form-group">
                    <label class="form-label">Konfirmasi Kata Sandi Baru</label>
                    <div class="input-wrapper">
                      <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      <input
                        v-model="form.confirmPassword"
                        :type="showPassword ? 'text' : 'password'"
                        placeholder="Ulangi kata sandi baru"
                        class="form-input"
                        :disabled="authStore.profileLoading"
                      />
                    </div>
                    <span v-if="form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword" class="password-mismatch-msg">
                      ⚠️ Kata sandi konfirmasi tidak cocok.
                    </span>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Footer Actions -->
            <div class="modal-footer">
              <button
                type="button"
                class="btn-cancel"
                @click="authStore.closeProfileModal"
                :disabled="authStore.profileLoading"
              >
                Batal
              </button>

              <button
                type="submit"
                class="btn-save-profile"
                :disabled="authStore.profileLoading || isFormInvalid"
              >
                <span v-if="authStore.profileLoading" class="spinner"></span>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                <span>{{ authStore.profileLoading ? 'Menyimpan...' : 'Simpan Perubahan' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useAuthStore } from '~/stores/authStore'
import { useToastStore } from '~/stores/toastStore'

const authStore = useAuthStore()
const toast = useToastStore()

// State Form
const form = reactive({
  fullName: '',
  newPassword: '',
  confirmPassword: ''
})

const selectedAvatarFile = ref<File | null>(null)
const previewAvatarUrl = ref<string | null>(null)
const removeAvatarRequested = ref<boolean>(false)
const showPassword = ref<boolean>(false)
const showPasswordFields = ref<boolean>(false)

// Sinkronkan data saat modal dibuka
watch(
  () => authStore.showProfileModal,
  (isOpen) => {
    if (isOpen) {
      form.fullName = authStore.fullName || authStore.displayName
      form.newPassword = ''
      form.confirmPassword = ''
      selectedAvatarFile.value = null
      previewAvatarUrl.value = null
      removeAvatarRequested.value = false
      showPasswordFields.value = false
    }
  }
)

const isFormInvalid = computed<boolean>(() => {
  if (!form.fullName.trim()) return true
  if (showPasswordFields.value && form.newPassword) {
    if (form.newPassword.length < 6) return true
    if (form.newPassword !== form.confirmPassword) return true
  }
  return false
})

const onAvatarFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    if (file.size > 3 * 1024 * 1024) {
      toast.warning('Ukuran foto terlalu besar. Maksimal 3MB.')
      return
    }
    selectedAvatarFile.value = file
    previewAvatarUrl.value = URL.createObjectURL(file)
    removeAvatarRequested.value = false
  }
}

const handleRemoveAvatar = () => {
  selectedAvatarFile.value = null
  if (previewAvatarUrl.value) {
    URL.revokeObjectURL(previewAvatarUrl.value)
    previewAvatarUrl.value = null
  }
  removeAvatarRequested.value = true
}

const handleSaveProfile = async () => {
  if (isFormInvalid.value) return

  const success = await authStore.updateUserProfile({
    fullName: form.fullName,
    avatarFile: selectedAvatarFile.value,
    removeAvatar: removeAvatarRequested.value,
    newPassword: showPasswordFields.value && form.newPassword ? form.newPassword : undefined
  })

  if (success) {
    toast.success('Profil berhasil diperbarui!')
    setTimeout(() => {
      authStore.closeProfileModal()
    }, 1200)
  } else if (authStore.authError) {
    toast.error(authStore.authError)
  }
}
</script>

<style scoped>
/* Backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 16px;
}

/* Card */
.modal-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 18px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.7), 0 0 24px rgba(99, 102, 241, 0.15);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  background: rgba(15, 23, 42, 0.45);
  border-bottom: 1px solid #334155;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon-wrap {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #005afb, #6120f7);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 0 0 14px rgba(99, 102, 241, 0.4);
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
}

.modal-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin: 2px 0 0 0;
}

.modal-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
}

/* Body */
.modal-body {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: calc(85vh - 120px);
  overflow-y: auto;
}

/* Alert */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 500;
}

.alert-banner.error {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #f87171;
}

.alert-banner.success {
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: #4ade80;
}

/* Avatar Section */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid #334155;
  border-radius: 12px;
}

.avatar-preview-wrap {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}

.avatar-image {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #005afb;
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
}

.avatar-initials-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #005afb, #6120f7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  border: 2px solid #334155;
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
}

.avatar-edit-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #005afb;
  border: 2px solid #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.avatar-edit-badge:hover {
  transform: scale(1.1);
}

.hidden-file-input {
  display: none;
}

.avatar-actions-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.avatar-btn-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-upload-btn {
  padding: 6px 12px;
  border-radius: 7px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid #005afb;
  color: #818cf8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.avatar-upload-btn:hover:not(.disabled) {
  background: #005afb;
  color: #ffffff;
}

.avatar-remove-btn {
  padding: 6px 12px;
  border-radius: 7px;
  background: transparent;
  border: 1px solid #475569;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.avatar-remove-btn:hover:not(:disabled) {
  border-color: #ef4444;
  color: #f87171;
  background: rgba(239, 68, 68, 0.1);
}

.avatar-hint {
  font-size: 11px;
  color: #94a3b8;
}

/* Form Group */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
}

.required {
  color: #f87171;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  pointer-events: none;
}

.form-input {
  width: 100%;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 9px;
  padding: 10px 14px 10px 38px;
  color: #f1f5f9;
  font-size: 13px;
  outline: none;
  transition: all 0.15s ease;
}

.form-input:focus {
  border-color: #005afb;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

.readonly-input {
  background: rgba(15, 23, 42, 0.4);
  color: #94a3b8;
  padding-right: 90px;
}

.verified-badge {
  position: absolute;
  right: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #4ade80;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.25);
  padding: 2px 8px;
  border-radius: 12px;
}

.password-eye-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-eye-btn:hover {
  color: #cbd5e1;
}

.password-mismatch-msg {
  font-size: 11px;
  color: #fb923c;
  margin-top: 2px;
}

/* Security Section */
.security-section {
  border: 1px solid #334155;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.2);
}

.security-toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: transparent;
  border: none;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.security-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.04);
}

.toggle-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #818cf8;
}

.chevron-toggle {
  color: #94a3b8;
  transition: transform 0.2s ease;
}

.chevron-toggle.rotated {
  transform: rotate(180deg);
}

.security-fields {
  padding: 14px;
  border-top: 1px solid #334155;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(15, 23, 42, 0.4);
}

/* Modal Footer */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid #334155;
  margin-top: 6px;
}

.btn-cancel {
  padding: 9px 16px;
  background: rgba(51, 65, 85, 0.6);
  border: 1px solid #475569;
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel:hover:not(:disabled) {
  background: #334155;
  color: #ffffff;
}

.btn-save-profile {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  background: linear-gradient(135deg, #005afb, #6120f7);
  border: 1px solid #005afb;
  border-radius: 8px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}

.btn-save-profile:hover:not(:disabled) {
  background: linear-gradient(135deg, #004ecc, #521ad8);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(99, 102, 241, 0.45);
}

.btn-save-profile:disabled, .btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Spinner */
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-card,
.modal-fade-leave-to .modal-card {
  opacity: 0;
  transform: scale(0.94) translateY(8px);
}
</style>
