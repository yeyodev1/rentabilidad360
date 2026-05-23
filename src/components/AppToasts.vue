<script setup lang="ts">
import { useUIStore } from '@/stores/ui'
const ui = useUIStore()
</script>

<template>
  <Teleport to="body">
    <div class="toast-stack" role="region" aria-label="Notificaciones">
      <TransitionGroup name="toast">
        <article
          v-for="t in ui.toasts"
          :key="t.id"
          :class="['toast', t.tone]"
          role="status"
        >
          <span class="t-icon"><i :class="t.icon" /></span>
          <div class="t-body">
            <strong class="t-title">{{ t.title }}</strong>
            <p v-if="t.message" class="t-msg">{{ t.message }}</p>
          </div>
          <button class="t-close" @click="ui.dismissToast(t.id)" aria-label="Cerrar">
            <i class="fa-solid fa-xmark" />
          </button>
          <span class="t-progress" :style="{ animationDuration: t.duration + 'ms' }" />
        </article>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.toast-stack {
  position: fixed;
  bottom: 20px;
  right: 20px;
  left: auto;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: min(380px, calc(100vw - 32px));
  pointer-events: none;
  @media (max-width: 640px) {
    left: 16px; right: 16px; bottom: 16px;
    max-width: none;
  }
}

.toast {
  position: relative;
  pointer-events: auto;
  background: white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: 0 18px 40px rgba($primary-dark, 0.18);
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 12px;
  align-items: center;
  overflow: hidden;
  font-family: $font-principal;

  &::before {
    content: '';
    position: absolute; inset: 0 auto 0 0; width: 4px;
  }
  &.info::before { background: $primary; }
  &.success::before { background: $alert-success; }
  &.warning::before { background: $alert-warning; }
  &.error::before { background: $alert-error; }
}

.t-icon {
  width: 40px; height: 40px; border-radius: 12px;
  background: rgba($primary, 0.08); color: $primary;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1rem;
  .toast.success & { background: rgba($alert-success, 0.12); color: $alert-success; }
  .toast.warning & { background: rgba($alert-warning, 0.15); color: darken($alert-warning, 8%); }
  .toast.error & { background: rgba($alert-error, 0.12); color: $alert-error; }
}

.t-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.t-title { font-size: 0.92rem; font-weight: 800; color: $primary-dark; }
.t-msg { margin: 0; font-size: 0.8rem; color: $text-secondary; line-height: 1.45; }

.t-close {
  border: none; background: rgba($primary-dark, 0.06); color: $primary-dark;
  width: 28px; height: 28px; border-radius: 8px; cursor: pointer; font-size: 0.78rem;
  &:hover { background: rgba($primary-dark, 0.12); }
}

.t-progress {
  position: absolute; left: 0; bottom: 0; height: 3px; width: 100%;
  background: linear-gradient(90deg, currentColor, transparent);
  color: $primary;
  transform-origin: left;
  animation: tprog linear forwards;
  opacity: 0.65;
  .toast.success & { color: $alert-success; }
  .toast.warning & { color: $alert-warning; }
  .toast.error & { color: $alert-error; }
}
@keyframes tprog {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

.toast-enter-active, .toast-leave-active { transition: opacity 0.25s, transform 0.25s; }
.toast-enter-from { opacity: 0; transform: translateY(16px) scale(0.97); }
.toast-leave-to { opacity: 0; transform: translateX(20px); }
.toast-move { transition: transform 0.25s; }
</style>
