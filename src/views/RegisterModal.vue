<script setup lang="ts">
import { ref } from 'vue'
import { authService } from '@/services/authService'
import { useUserStore } from '@/stores/user'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ close: [] }>()

const userStore = useUserStore()

const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

async function handleRegister() {
  error.value = ''
  if (!name.value.trim() || !email.value.trim() || !password.value) {
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
      name: name.value,
      email: email.value,
      password: password.value,
    })
    localStorage.setItem('access_token', res.data.token)
    userStore.setUser(res.data.user)
    success.value = true
  } catch (e: any) {
    error.value = e?.message || 'Error al registrarse. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}

function handleBackdrop(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
    if (!success.value) emit('close')
  }
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-backdrop" @click="handleBackdrop">
      <div class="modal-card">
        <button class="modal-close" @click="emit('close')"><i class="fa-solid fa-xmark" /></button>

        <template v-if="!success">
          <div class="modal-header">
            <h2 class="modal-title">Desbloquea tu diagnóstico completo</h2>
            <p class="modal-desc">Crea tu cuenta gratis y accede a análisis detallados, gráficos y proyecciones financieras.</p>
          </div>

          <form class="modal-form" @submit.prevent="handleRegister">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input v-model="name" type="text" class="form-input" placeholder="Tu nombre" />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input v-model="email" type="email" class="form-input" placeholder="correo@ejemplo.com" inputmode="email" />
            </div>
            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <input v-model="password" type="password" class="form-input" placeholder="Mínimo 6 caracteres" />
            </div>

            <p v-if="error" class="form-error">{{ error }}</p>

            <button type="submit" :class="['btn-submit', { loading }]" :disabled="loading">
              <span v-if="loading">Creando cuenta...</span>
              <span v-else>Crear cuenta gratis <i class="fa-solid fa-arrow-right" /></span>
            </button>
          </form>

          <p class="modal-footer-text">
            ¿Ya tienes cuenta?
            <RouterLink to="/login" class="modal-footer-link">
              Inicia sesión <i class="fa-solid fa-arrow-right" />
            </RouterLink>
          </p>
          <p class="modal-footer-fine">
            Al registrarte aceptas nuestros <a href="#">Términos y Condiciones</a>
          </p>
        </template>

        <template v-else>
          <div class="success-content">
            <div class="success-icon"><i class="fa-solid fa-circle-check" /></div>
            <h2 class="modal-title">¡Cuenta creada con éxito!</h2>
            <p class="modal-desc">Ahora puedes acceder a todas las herramientas de análisis avanzado.</p>
            <button class="btn-submit" @click="emit('close')">Ir al Dashboard</button>
          </div>
        </template>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  padding: 0;
  transition: background 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-card {
  background: white;
  border-radius: 24px 24px 0 0;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 28px 24px;
  padding-bottom: max(24px, env(safe-area-inset-bottom));
  position: relative;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-leave-active {
  .modal-card {
    transition: transform 0.2s ease-out;
  }
}

.modal-enter-from {
  background: rgba(0, 0, 0, 0);

  .modal-card {
    transform: translateY(100%);
  }
}

.modal-leave-to {
  background: rgba(0, 0, 0, 0);

  .modal-card {
    transform: translateY(100%);
  }
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba($primary-dark, 0.06);
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-secondary;
  -webkit-tap-highlight-color: transparent;
}

.modal-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
  padding-right: 36px;
}

.modal-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: $primary-dark;
  margin: 0;
}

.modal-desc {
  font-size: 0.85rem;
  color: $text-secondary;
  margin: 0;
  line-height: 1.5;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: $primary-dark;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  font-size: 0.95rem;
  font-family: $font-principal;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: white;

  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba($primary, 0.1);
  }
}

.form-error {
  font-size: 0.8rem;
  color: $alert-error;
  margin: 0;
  padding: 8px 12px;
  background: rgba($alert-error, 0.08);
  border-radius: 8px;
}

.btn-submit {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, $primary, #1678b0);
  color: white;
  font-size: 1rem;
  font-weight: 700;
  font-family: $font-principal;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.97);
  }

  &.loading {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.modal-footer-text {
  font-size: 0.7rem;
  color: #aaa;
  text-align: center;
  margin: 16px 0 0;
  line-height: 1.4;

  a {
    color: $primary;
    text-decoration: none;
    font-weight: 600;
  }
}

.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
  text-align: center;
}

.success-icon {
  font-size: 3rem;
}
</style>
