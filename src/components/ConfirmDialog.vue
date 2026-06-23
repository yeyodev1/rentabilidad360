<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useUIStore } from '@/stores/ui'

const ui = useUIStore()

const visible = computed(() => !!ui.confirm)

function onCancel() { ui.resolveConfirm(false) }
function onAccept() { ui.resolveConfirm(true) }

function onKey(e: KeyboardEvent) {
  if (!visible.value) return
  if (e.key === 'Escape') onCancel()
  if (e.key === 'Enter') onAccept()
}

watch(visible, (v) => {
  if (v) {
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', onKey)
    document.body.style.overflow = ''
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="visible && ui.confirm" class="dialog-backdrop" @click.self="onCancel">
        <section
          class="dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="'confirm-title'"
        >
          <header class="dialog-head" :class="ui.confirm.tone || 'default'">
            <span class="dialog-icon">
              <i :class="ui.confirm.icon || (ui.confirm.tone === 'danger' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-question')" />
            </span>
            <div>
              <h2 id="confirm-title" class="dialog-title">{{ ui.confirm.title }}</h2>
              <p v-if="ui.confirm.message" class="dialog-msg">{{ ui.confirm.message }}</p>
            </div>
            <button class="dialog-close" @click="onCancel" aria-label="Cerrar">
              <i class="fa-solid fa-xmark" />
            </button>
          </header>

          <footer class="dialog-foot">
            <button class="btn cancel" type="button" @click="onCancel">
              {{ ui.confirm.cancelLabel || 'Cancelar' }}
            </button>
            <button
              :class="['btn', 'accept', ui.confirm.tone || 'default']"
              type="button"
              @click="onAccept"
              autofocus
            >
              <i v-if="ui.confirm.tone === 'danger'" class="fa-solid fa-arrow-right-from-bracket" />
              <i v-else class="fa-solid fa-check" />
              {{ ui.confirm.confirmLabel || 'Confirmar' }}
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.dialog-backdrop {
  position: fixed; inset: 0;
  background: rgba($primary-dark, 0.55);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  z-index: 9998;
}

.dialog {
  width: 100%;
  max-width: 460px;
  background: white;
  border-radius: 22px;
  box-shadow: 0 30px 80px rgba($primary-dark, 0.32);
  overflow: hidden;
  font-family: $font-principal;
  display: flex;
  flex-direction: column;
}

.dialog-head {
  position: relative;
  display: grid;
  grid-template-columns: 56px 1fr 36px;
  gap: 14px;
  align-items: center;
  padding: 22px;

  &.default {
    background: linear-gradient(135deg, rgba($primary, 0.06), white);
    .dialog-icon { background: linear-gradient(135deg, $primary, $secondary); color: white; }
  }
  &.danger {
    background: linear-gradient(135deg, rgba($alert-error, 0.1), white);
    .dialog-icon { background: linear-gradient(135deg, $alert-error, #dc2626); color: white; }
  }
}

.dialog-icon {
  width: 56px; height: 56px; border-radius: 16px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1.35rem;
  box-shadow: 0 10px 24px rgba($primary-dark, 0.2);
}

.dialog-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: $primary-dark;
  line-height: 1.25;
}
.dialog-msg {
  margin: 4px 0 0;
  font-size: 0.88rem;
  color: $text-secondary;
  line-height: 1.5;
}

.dialog-close {
  width: 36px; height: 36px;
  border-radius: 10px;
  border: none; cursor: pointer;
  background: rgba($primary-dark, 0.06);
  color: $primary-dark;
  font-size: 0.85rem;
  &:hover { background: rgba($primary-dark, 0.12); }
}

.dialog-foot {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 16px 22px 22px;
  background: white;
}

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px 16px;
  border-radius: 12px;
  font-family: $font-principal;
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
  transition: transform 0.15s, background 0.2s;
  &:active { transform: scale(0.97); }
}

.btn.cancel {
  background: rgba($primary-dark, 0.06);
  color: $primary-dark;
  &:hover { background: rgba($primary-dark, 0.12); }
}

.btn.accept {
  color: white;
  background: linear-gradient(135deg, $primary, $secondary);
  box-shadow: 0 10px 24px rgba($primary, 0.32);
  &.danger {
    background: linear-gradient(135deg, $alert-error, #dc2626);
    box-shadow: 0 10px 24px rgba($alert-error, 0.4);
  }
}

.dialog-enter-active, .dialog-leave-active { transition: opacity 0.2s; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-active .dialog, .dialog-leave-active .dialog {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s;
}
.dialog-enter-from .dialog, .dialog-leave-to .dialog {
  transform: translateY(20px) scale(0.96);
  opacity: 0;
}
</style>
