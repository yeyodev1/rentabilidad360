<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { authService } from '@/services/authService'

const router = useRouter()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPwd = ref(false)

async function handleRegister() {
  error.value = ''
  if (!firstName.value.trim() || !lastName.value.trim() || !email.value.trim() || !password.value) {
    error.value = 'Todos los campos son obligatorios'
    return
  }
  if (password.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }
  loading.value = true
  try {
    const res = await authService.register({
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      email: email.value.trim(),
      password: password.value,
    })
    router.replace(`/verify?email=${encodeURIComponent(res.data.email)}`)
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || 'No pudimos crear tu cuenta. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-shell">
    <div class="auth-bg" aria-hidden="true">
      <div class="blob a" />
      <div class="blob b" />
    </div>

    <div class="auth-card">
      <RouterLink to="/" class="auth-back">
        <i class="fa-solid fa-arrow-left" /> Volver
      </RouterLink>

      <div class="brand-badge">
        <i class="fa-solid fa-rocket" /> Crear cuenta
      </div>

      <h1 class="auth-title">Empieza a operar tu negocio</h1>
      <p class="auth-sub">Crea tu cuenta gratis y desbloquea los módulos de cocina, costeo y horarios.</p>

      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="field-row">
          <label class="field">
            <span class="field-label"><i class="fa-solid fa-user" /> Nombre</span>
            <input
              v-model="firstName"
              type="text"
              class="field-input"
              placeholder="Ej. Juan"
              autocomplete="given-name"
            />
          </label>
          <label class="field">
            <span class="field-label">Apellido</span>
            <input
              v-model="lastName"
              type="text"
              class="field-input"
              placeholder="Ej. Pérez"
              autocomplete="family-name"
            />
          </label>
        </div>

        <label class="field">
          <span class="field-label"><i class="fa-solid fa-envelope" /> Email</span>
          <input
            v-model="email"
            type="email"
            class="field-input"
            placeholder="correo@ejemplo.com"
            inputmode="email"
            autocomplete="email"
          />
        </label>

        <label class="field">
          <span class="field-label"><i class="fa-solid fa-lock" /> Contraseña</span>
          <div class="field-input-wrap">
            <input
              v-model="password"
              :type="showPwd ? 'text' : 'password'"
              class="field-input"
              placeholder="Mínimo 6 caracteres"
              autocomplete="new-password"
            />
            <button
              type="button"
              class="field-toggle"
              @click="showPwd = !showPwd"
            >
              <i :class="showPwd ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" />
            </button>
          </div>
        </label>

        <p v-if="error" class="form-error">
          <i class="fa-solid fa-circle-exclamation" /> {{ error }}
        </p>

        <button type="submit" :class="['btn-submit', { loading }]" :disabled="loading">
          <i v-if="loading" class="fa-solid fa-spinner fa-spin" />
          <i v-else class="fa-solid fa-user-plus" />
          <span>{{ loading ? 'Creando cuenta...' : 'Crear cuenta gratis' }}</span>
        </button>
      </form>

      <p class="auth-footer">
        ¿Ya tienes cuenta?
        <RouterLink to="/login" class="auth-link">Inicia sesión <i class="fa-solid fa-arrow-right" /></RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.auth-shell {
  position: relative;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(160deg, $bg, #fbefe0 60%, #ffffff);
  overflow: hidden;
}

.auth-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.blob {
  position: absolute; filter: blur(70px); opacity: 0.4; border-radius: 50%;
  &.a { width: 360px; height: 360px; background: $primary; top: -120px; left: -100px; }
  &.b { width: 320px; height: 320px; background: $secondary; bottom: -140px; right: -80px; }
}

.auth-card {
  position: relative; z-index: 1; width: 100%; max-width: 420px;
  background: white; border-radius: 24px; padding: 28px 24px;
  box-shadow: 0 20px 60px rgba($primary-dark, 0.12);
  display: flex; flex-direction: column; gap: 14px;
}
.auth-back { display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 600; color: $primary; align-self: flex-start; padding: 6px 0; }
.brand-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: $primary; background: rgba($primary, 0.1); padding: 4px 10px; border-radius: 14px; align-self: flex-start; }
.auth-title { font-size: 1.6rem; font-weight: 700; color: $primary-dark; margin: 4px 0 0; }
.auth-sub { font-size: 0.9rem; color: $text-secondary; margin: 0 0 8px; line-height: 1.5; }
.auth-form { display: flex; flex-direction: column; gap: 14px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 0.78rem; font-weight: 600; color: $primary-dark; display: inline-flex; align-items: center; gap: 6px; i { color: $primary; } }
.field-input-wrap { position: relative; }
.field-input {
  width: 100%; padding: 14px 16px; border: 2px solid rgba($primary-dark, 0.08);
  border-radius: 12px; font-size: 0.95rem; font-family: $font-principal; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s; background: white;
  &:focus { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
}
.field-toggle { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); border: none; background: transparent; color: $text-secondary; cursor: pointer; padding: 6px 8px; font-size: 0.95rem; }
.form-error { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: $alert-error; background: rgba($alert-error, 0.08); border-radius: 10px; padding: 10px 12px; margin: 0; }
.btn-submit { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 15px; border: none; border-radius: 12px; font-family: $font-principal; font-weight: 700; font-size: 1rem; color: white; background: linear-gradient(135deg, $primary, $secondary); cursor: pointer; box-shadow: 0 8px 22px rgba($primary, 0.3); transition: transform 0.2s; &:disabled { opacity: 0.85; cursor: progress; } &:not(:disabled):active { transform: scale(0.98); } }
.auth-footer { text-align: center; font-size: 0.85rem; color: $text-secondary; margin: 4px 0 0; }
.auth-link { color: $primary; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
</style>
