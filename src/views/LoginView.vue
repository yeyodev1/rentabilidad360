<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { authService } from '@/services/authService'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPwd = ref(false)

async function handleLogin() {
  error.value = ''
  if (!email.value.trim() || !password.value) {
    error.value = 'Email y contraseña son obligatorios'
    return
  }
  loading.value = true
  try {
    const res = await authService.login(email.value.trim(), password.value)
    localStorage.setItem('access_token', res.data.token)
    if (res.data.user.role) {
      localStorage.setItem('user_role', res.data.user.role)
    }
    userStore.setUser(res.data.user)
    router.replace(res.data.hasWorkspace ? '/modulos' : '/onboarding')
  } catch (e: any) {
    if (e?.response?.data?.needsVerification) {
      router.replace(`/verify?email=${encodeURIComponent(e.response.data.email)}`)
      return
    }
    error.value = e?.response?.data?.message || e?.message || 'Credenciales inválidas. Intenta de nuevo.'
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
        <i class="fa-solid fa-chart-pie" /> Allio
      </div>

      <h1 class="auth-title">Bienvenido de vuelta</h1>
      <p class="auth-sub">Inicia sesión para ver tus diagnósticos y módulos operativos.</p>

      <form class="auth-form" @submit.prevent="handleLogin">
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
              autocomplete="current-password"
            />
            <button
              type="button"
              class="field-toggle"
              @click="showPwd = !showPwd"
              :aria-label="showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'"
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
          <i v-else class="fa-solid fa-right-to-bracket" />
          <span>{{ loading ? 'Ingresando...' : 'Iniciar sesión' }}</span>
        </button>
      </form>

      <p class="auth-footer">
        ¿No tienes cuenta?
        <RouterLink to="/register" class="auth-link">Crea una gratis <i class="fa-solid fa-arrow-right" /></RouterLink>
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

.field-input-wrap { position: relative; }

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

.field-toggle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: $text-secondary;
  cursor: pointer;
  padding: 6px 8px;
  font-size: 0.9rem;
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

.auth-footer {
  text-align: center;
  font-size: 0.82rem;
  color: $text-secondary;
  margin: 4px 0 0;
}

.auth-link {
  color: $primary;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
