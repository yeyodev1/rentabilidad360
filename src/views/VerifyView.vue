<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '@/services/authService'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const email = ref((route.query.email as string) || '')
const code = ref('')
const loading = ref(false)
const resending = ref(false)
const error = ref('')
const success = ref('')

onMounted(() => {
  if (!email.value) {
    router.replace('/register')
  }
})

function onCodeInput(e: Event) {
  const input = e.target as HTMLInputElement
  code.value = input.value.replace(/\D/g, '').slice(0, 6)
}

async function handleVerify() {
  error.value = ''
  if (code.value.length !== 6) {
    error.value = 'Ingresa el código de 6 dígitos'
    return
  }
  loading.value = true
  try {
    const res = await authService.verifyEmail({ email: email.value, code: code.value })
    localStorage.setItem('access_token', res.data.token)
    if (res.data.user.role) {
      localStorage.setItem('user_role', res.data.user.role)
    }
    userStore.setUser(res.data.user)
    router.replace('/onboarding')
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || 'Código inválido o expirado.'
  } finally {
    loading.value = false
  }
}

async function handleResend() {
  resending.value = true
  error.value = ''
  success.value = ''
  try {
    await authService.resendCode(email.value)
    success.value = 'Código reenviado. Revisa tu bandeja de entrada.'
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || 'No pudimos reenviar el código.'
  } finally {
    resending.value = false
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
      <button class="auth-back" @click="router.push('/register')">
        <i class="fa-solid fa-arrow-left" /> Volver
      </button>

      <div class="brand-badge">
        <i class="fa-solid fa-envelope-circle-check" /> Verificar
      </div>

      <h1 class="auth-title">Revisa tu correo</h1>
      <p class="auth-sub">
        Te enviamos un código de 6 dígitos a <strong>{{ email }}</strong>. Si no lo encuentras, revisa tu carpeta de spam.
      </p>

      <form class="auth-form" @submit.prevent="handleVerify">
        <label class="field">
          <span class="field-label"><i class="fa-solid fa-key" /> Código de verificación</span>
          <input
            :value="code"
            @input="onCodeInput"
            type="text"
            class="field-input code-input"
            placeholder="0 0 0 0 0 0"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
          />
        </label>

        <p v-if="error" class="form-error">
          <i class="fa-solid fa-circle-exclamation" /> {{ error }}
        </p>
        <p v-if="success" class="form-success">
          <i class="fa-solid fa-circle-check" /> {{ success }}
        </p>

        <button type="submit" :class="['btn-submit', { loading }]" :disabled="loading || code.length !== 6">
          <i v-if="loading" class="fa-solid fa-spinner fa-spin" />
          <i v-else class="fa-solid fa-check-circle" />
          <span>{{ loading ? 'Verificando...' : 'Verificar cuenta' }}</span>
        </button>
      </form>

      <div class="auth-divider">
        <span>¿No recibiste el código?</span>
      </div>

      <button type="button" class="btn-outline" :disabled="resending" @click="handleResend">
        <i v-if="resending" class="fa-solid fa-spinner fa-spin" />
        <i v-else class="fa-solid fa-rotate" />
        <span>{{ resending ? 'Reenviando...' : 'Reenviar código' }}</span>
      </button>
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
  padding: 20px;
  background: $bg;
  overflow: hidden;
}

.auth-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.blob {
  position: absolute;
  filter: blur(80px);
  opacity: 0.2;
  border-radius: 50%;

  &.a {
    width: 320px;
    height: 320px;
    background: $primary;
    top: -100px;
    left: -80px;
  }

  &.b {
    width: 280px;
    height: 280px;
    background: $accent;
    bottom: -120px;
    right: -60px;
  }
}

.auth-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  background: $surface;
  border-radius: $radius-xl;
  padding: 24px 20px;
  box-shadow: $shadow-lg;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auth-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: $primary;
  align-self: flex-start;
  padding: 4px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: $font-principal;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: $primary;
  background: $primary-bg;
  padding: 4px 10px;
  border-radius: $radius-full;
  align-self: flex-start;
}

.auth-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: $text;
  margin: 4px 0 0;
  font-family: $font-secondary;
}

.auth-sub {
  font-size: 0.85rem;
  color: $text-secondary;
  margin: 0 0 6px;
  line-height: 1.5;

  strong { color: $text; }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: $text;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  i { color: $primary; }
}

.field-input {
  width: 100%;
  padding: 13px 14px;
  border: 1.5px solid $border;
  border-radius: $radius-md;
  font-size: 0.92rem;
  font-family: $font-principal;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: $surface;
  color: $text;

  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 3px $primary-bg;
  }

  &::placeholder { color: $text-secondary; opacity: 0.5; }
}

.code-input {
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: 12px;
  text-align: center;
  font-family: $font-secondary;
  padding: 16px 14px;
}

.form-error {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: $alert-error;
  background: $alert-error-bg;
  border-radius: $radius-sm;
  padding: 10px 12px;
  margin: 0;
}

.form-success {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: $alert-success;
  background: $alert-success-bg;
  border-radius: $radius-sm;
  padding: 10px 12px;
  margin: 0;
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: $radius-md;
  font-family: $font-principal;
  font-weight: 700;
  font-size: 0.95rem;
  color: white;
  background: $primary-gradient;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba($primary, 0.3);
  transition: transform 0.15s, box-shadow 0.2s;

  &:disabled { opacity: 0.7; cursor: progress; }
  &:not(:disabled):active { transform: scale(0.98); }
  &:hover:not(:disabled) { box-shadow: 0 8px 24px rgba($primary, 0.4); }
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 2px 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: $border;
  }

  span {
    font-size: 0.75rem;
    color: $text-secondary;
    white-space: nowrap;
  }
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: 1.5px solid $border;
  border-radius: $radius-md;
  font-family: $font-principal;
  font-weight: 600;
  font-size: 0.9rem;
  color: $text;
  background: transparent;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;

  &:disabled { opacity: 0.6; cursor: progress; }
  &:hover:not(:disabled) {
    border-color: $primary;
    background: $primary-bg;
  }

  i { color: $primary; }
}
</style>
