<script setup lang="ts">
import { useOnboardingStore } from '@/stores/onboarding'
import { PAIN_POINTS, type PainPointId } from '@/stores/onboarding'

const store = useOnboardingStore()

function isSelected(id: PainPointId) {
  return store.painPoints.includes(id)
}

function toggle(id: PainPointId) {
  store.togglePain(id)
  if (navigator.vibrate) navigator.vibrate(10)
}

function back() {
  store.goToStep(1)
}

function next() {
  if (!store.painStepComplete) return
  store.goToStep(3)
}
</script>

<template>
  <div class="step-container">
    <div class="step-header">
      <button class="btn-back" @click="back">
        <i class="fa-solid fa-arrow-left" /> Atrás
      </button>
      <div class="step-indicator">Paso 2 de 5</div>
    </div>

    <div class="step-content">
      <div class="title-block">
        <span class="title-badge">
          <i class="fa-solid fa-heart-pulse" />
          Antes de empezar
        </span>
        <h2 class="step-title">
          Elige tu mayor <span class="highlight">dolor de cabeza</span> actual
        </h2>
        <p class="step-sub">
          Puedes seleccionar uno o varios. Adaptaremos el diagnóstico a lo que más te duele.
        </p>
      </div>

      <div class="pain-grid">
        <button
          v-for="p in PAIN_POINTS"
          :key="p.id"
          :class="['pain-card', { active: isSelected(p.id) }]"
          type="button"
          @click="toggle(p.id)"
        >
          <span class="pain-icon"><i :class="p.icon" /></span>
          <span class="pain-body">
            <span class="pain-title">{{ p.title }}</span>
            <span class="pain-desc">"{{ p.description }}"</span>
          </span>
          <span class="pain-check">
            <i v-if="isSelected(p.id)" class="fa-solid fa-circle-check" />
            <i v-else class="fa-regular fa-circle" />
          </span>
        </button>
      </div>
    </div>

    <div class="step-footer">
      <button
        :class="['btn-primary', { disabled: !store.painStepComplete }]"
        :disabled="!store.painStepComplete"
        @click="next"
      >
        Continuar diagnóstico
        <i class="fa-solid fa-arrow-right" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.step-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 20px;
  min-height: 100dvh;
}

.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  padding-bottom: 8px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  color: $primary-dark;
  cursor: pointer;
  font-family: $font-principal;
  padding: 4px 0;

  i { color: $primary; }
}

.step-indicator {
  font-size: 0.75rem;
  font-weight: 600;
  color: $text-secondary;
  background: rgba($primary-dark, 0.05);
  padding: 4px 12px;
  border-radius: 20px;
}

.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-top: 16px;
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: $primary;
  background: rgba($primary, 0.1);
  padding: 4px 10px;
  border-radius: 14px;
  align-self: flex-start;
}

.step-title {
  font-size: 1.55rem;
  font-weight: 700;
  line-height: 1.3;
  color: $primary-dark;
  margin: 0;
}

.highlight {
  color: $primary;
}

.step-sub {
  font-size: 0.92rem;
  color: $text-secondary;
  margin: 0;
  line-height: 1.45;
}

.pain-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pain-card {
  display: grid;
  grid-template-columns: 56px 1fr 28px;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px;
  border: 2px solid rgba($primary-dark, 0.08);
  border-radius: 16px;
  background: white;
  font-family: $font-principal;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  -webkit-tap-highlight-color: transparent;

  &:active { transform: scale(0.98); }

  &.active {
    border-color: $primary;
    background: rgba($primary, 0.05);
    box-shadow: 0 4px 18px rgba($primary, 0.16);

    .pain-icon { background: $primary; color: white; }
    .pain-check i { color: $primary; }
  }
}

.pain-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba($primary, 0.08);
  color: $primary;
  border-radius: 14px;
  font-size: 1.5rem;
  transition: background 0.2s, color 0.2s;
}

.pain-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pain-title {
  font-size: 0.98rem;
  font-weight: 700;
  color: $primary-dark;
}

.pain-desc {
  font-size: 0.78rem;
  color: $text-secondary;
  line-height: 1.4;
  font-style: italic;
}

.pain-check {
  font-size: 1.4rem;
  color: rgba($primary-dark, 0.22);
}

.step-footer {
  padding: 16px 0;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

.btn-primary {
  width: 100%;
  padding: 18px;
  border: none;
  border-radius: 14px;
  background: $primary;
  color: white;
  font-size: 1rem;
  font-weight: 700;
  font-family: $font-principal;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 6px 20px rgba($primary, 0.28);
  -webkit-tap-highlight-color: transparent;

  &:not(.disabled):active { transform: scale(0.97); }

  &.disabled {
    background: #d0d0d0;
    cursor: not-allowed;
    box-shadow: none;
  }
}
</style>
