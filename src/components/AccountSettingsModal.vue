<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useUIStore } from '@/stores/ui'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ close: [] }>()

const userStore = useUserStore()
const ui = useUIStore()

const name = ref(userStore.name || '')
const emailDisplay = computed(() => userStore.email || 'cuenta-demo@rentabilidad360.app')
const initials = computed(() => {
  const n = (name.value || userStore.email || 'OP').trim()
  const parts = n.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
  return (parts[0]?.slice(0, 2) || 'OP').toUpperCase()
})

const isDirty = computed(() => (name.value || '') !== (userStore.name || ''))

watch(
  () => props.show,
  (v) => {
    if (v) {
      name.value = userStore.name || ''
    }
  },
)

function save() {
  if (!name.value.trim()) {
    ui.showToast({ title: 'Tu nombre no puede estar vacío', tone: 'warning' })
    return
  }
  userStore.setUser({ name: name.value.trim() })
  ui.showToast({
    title: 'Cuenta actualizada',
    message: 'Cambios guardados localmente.',
    tone: 'success',
  })
  emit('close')
}

function close() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="ac-modal">
      <div v-if="show" class="ac-backdrop" @click.self="close">
        <article class="ac-modal" role="dialog" aria-modal="true" aria-labelledby="ac-title">
          <header class="ac-head">
            <div class="ac-avatar">{{ initials }}</div>
            <div>
              <span class="ac-eyebrow">Mi cuenta</span>
              <h2 id="ac-title">Configura tu perfil</h2>
              <p>Estos datos se muestran al equipo y en notificaciones.</p>
            </div>
            <button class="ac-close" @click="close" aria-label="Cerrar"><i class="fa-solid fa-xmark" /></button>
          </header>

          <section class="ac-body">
            <div class="field">
              <label class="lbl"><i class="fa-solid fa-user" /> Nombre completo</label>
              <input
                v-model="name"
                type="text"
                class="inp"
                placeholder="Tu nombre"
                maxlength="60"
                autocomplete="name"
              />
            </div>

            <div class="field readonly">
              <label class="lbl"><i class="fa-solid fa-envelope" /> Email</label>
              <div class="ro-row">
                <input type="email" :value="emailDisplay" class="inp" readonly />
                <span class="lock"><i class="fa-solid fa-lock" /></span>
              </div>
              <span class="hint">Para cambiar tu email, contáctanos a <a href="mailto:soporte@rentabilidad360.app">soporte@rentabilidad360.app</a>.</span>
            </div>

            <div class="card-info">
              <div class="ci-ico"><i class="fa-solid fa-shield-halved" /></div>
              <div>
                <strong>Tu sesión está protegida</strong>
                <p>Datos almacenados localmente en este dispositivo hasta que sincronices.</p>
              </div>
            </div>
          </section>

          <footer class="ac-foot">
            <button class="btn ghost" type="button" @click="close">Cancelar</button>
            <button class="btn primary" type="button" :disabled="!isDirty" @click="save">
              <i class="fa-solid fa-check" /> Guardar
            </button>
          </footer>
        </article>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.ac-backdrop {
  position: fixed; inset: 0;
  background: rgba($primary-dark, 0.55);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  z-index: 9990;
}
.ac-modal {
  width: 100%; max-width: 460px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 30px 80px rgba($primary-dark, 0.32);
  display: flex; flex-direction: column;
  overflow: hidden;
  font-family: $font-principal;
}

.ac-head {
  display: grid;
  grid-template-columns: 56px 1fr 36px;
  align-items: center; gap: 14px;
  padding: 22px;
  background: linear-gradient(135deg, rgba($secondary, 0.12), white);
}
.ac-avatar {
  width: 56px; height: 56px; border-radius: 16px;
  background: linear-gradient(135deg, $primary, $secondary);
  color: white; font-size: 1.15rem; font-weight: 800;
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: 0 10px 24px rgba($primary, 0.3);
}
.ac-eyebrow {
  display: inline-block;
  font-size: 0.62rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;
  color: $primary;
}
.ac-head h2 { margin: 2px 0; font-size: 1.1rem; font-weight: 800; color: $primary-dark; }
.ac-head p { margin: 0; font-size: 0.82rem; color: $text-secondary; line-height: 1.45; }
.ac-close {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba($primary-dark, 0.06); color: $primary-dark;
  border: none; cursor: pointer; font-size: 0.85rem;
  &:hover { background: rgba($primary-dark, 0.12); }
}

.ac-body { padding: 22px; display: flex; flex-direction: column; gap: 18px; }

.field { display: flex; flex-direction: column; gap: 8px; }
.lbl {
  font-size: 0.7rem; font-weight: 800; letter-spacing: 0.4px;
  text-transform: uppercase; color: $text-secondary;
  display: inline-flex; align-items: center; gap: 6px;
  i { color: $primary; }
}
.inp {
  width: 100%; padding: 14px 16px;
  border: 2px solid rgba($primary-dark, 0.08); border-radius: 12px;
  font-size: 0.95rem; font-family: $font-principal;
  outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  background: white;
  &:focus { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
  &[readonly] { background: rgba($primary-dark, 0.04); color: $text-secondary; }
}

.field.readonly .ro-row { position: relative; }
.ro-row .lock {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  color: $text-secondary; opacity: 0.6;
}
.hint {
  font-size: 0.78rem; color: $text-secondary; line-height: 1.5;
  a { color: $primary; font-weight: 700; }
}

.card-info {
  display: grid; grid-template-columns: 40px 1fr; gap: 12px; align-items: center;
  padding: 14px;
  background: rgba($secondary, 0.08);
  border: 1px solid rgba($secondary, 0.2);
  border-radius: 14px;
  strong { font-size: 0.85rem; color: $primary-dark; display: block; }
  p { margin: 2px 0 0; font-size: 0.76rem; color: $text-secondary; line-height: 1.5; }
}
.ci-ico {
  width: 40px; height: 40px; border-radius: 12px;
  background: white; color: darken($secondary, 10%);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1.05rem;
}

.ac-foot {
  display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px;
  padding: 16px 22px 22px;
  border-top: 1px solid rgba($primary-dark, 0.05);
}
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px;
  border-radius: 12px;
  border: none; cursor: pointer;
  font-family: $font-principal; font-weight: 800; font-size: 0.92rem;
  &:active:not(:disabled) { transform: scale(0.97); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.btn.ghost { background: rgba($primary-dark, 0.06); color: $primary-dark; &:hover { background: rgba($primary-dark, 0.12); } }
.btn.primary {
  background: linear-gradient(135deg, $primary, $secondary); color: white;
  box-shadow: 0 10px 24px rgba($primary, 0.3);
}

.ac-modal-enter-active, .ac-modal-leave-active { transition: opacity 0.22s; }
.ac-modal-enter-from, .ac-modal-leave-to { opacity: 0; }
.ac-modal-enter-active .ac-modal, .ac-modal-leave-active .ac-modal {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s;
}
.ac-modal-enter-from .ac-modal, .ac-modal-leave-to .ac-modal {
  transform: translateY(24px) scale(0.96); opacity: 0;
}
</style>
