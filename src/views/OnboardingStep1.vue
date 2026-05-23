<script setup lang="ts">
import { useOnboardingStore } from '@/stores/onboarding'

const store = useOnboardingStore()

const businessTypes = [
  { id: 'restaurante', label: 'Restaurante', icon: 'fa-solid fa-burger' },
  { id: 'cafeteria', label: 'Cafetería', icon: 'fa-solid fa-mug-hot' },
  { id: 'heladeria', label: 'Heladería', icon: 'fa-solid fa-ice-cream' },
  { id: 'pizza', label: 'Pizzería', icon: 'fa-solid fa-pizza-slice' },
  { id: 'panaderia', label: 'Panadería', icon: 'fa-solid fa-bread-slice' },
  { id: 'bar', label: 'Bar / Pub', icon: 'fa-solid fa-martini-glass-citrus' },
]

function select(type: string) {
  store.businessType = type
  if (navigator.vibrate) navigator.vibrate(10)
}

function next() {
  store.goToStep(2)
}
</script>

<template>
  <div class="step-container">
    <div class="step-content">
      <div class="brand-badge">
        <span class="brand-dot" />
        Rentabilidad360
      </div>

      <h1 class="step-title">
        Analiza la rentabilidad<br>de tu negocio en <span class="highlight">1 minuto</span>
      </h1>

      <div class="input-group">
        <label class="input-label">Nombre del proyecto</label>
        <input
          v-model="store.projectName"
          type="text"
          class="text-input"
          placeholder="Ej: La Esquina del Sabor"
          maxlength="50"
        />
      </div>

      <div class="input-group">
        <label class="input-label">Tipo de negocio</label>
        <div class="business-grid">
          <button
            v-for="type in businessTypes"
            :key="type.id"
            :class="['business-chip', { active: store.businessType === type.id }]"
            @click="select(type.id)"
          >
            <span class="chip-icon"><i :class="type.icon" /></span>
            <span class="chip-label">{{ type.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="step-footer">
      <Transition name="fade" mode="out-in">
        <button
          v-if="store.canProceedStep1"
          key="active"
          class="btn-primary"
          @click="next"
        >
          Siguiente
          <i class="fa-solid fa-arrow-right btn-arrow" />
        </button>
        <button
          v-else
          key="disabled"
          class="btn-primary disabled"
          disabled
        >
          Siguiente
        </button>
      </Transition>
    </div>
  </div>
</template>

<style scoped lang="scss">
.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: $primary;
  background: rgba($primary, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 16px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.brand-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: $primary;
}

.step-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 20px 0;
  min-height: 100dvh;
}

.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-top: 32px;
}

.step-title {
  font-size: 1.65rem;
  font-weight: 700;
  line-height: 1.3;
  color: $primary-dark;
  margin: 0;
}

.highlight {
  color: $primary;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.text-input {
  width: 100%;
  padding: 16px;
  border: 2px solid rgba($primary-dark, 0.08);
  border-radius: 14px;
  font-size: 1rem;
  font-family: $font-principal;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: white;

  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba($primary, 0.12);
  }

  &::placeholder {
    color: #b0b0b0;
  }
}

.business-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.business-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border: 2px solid rgba($primary-dark, 0.08);
  border-radius: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  -webkit-tap-highlight-color: transparent;
  font-family: $font-principal;

  &:active {
    transform: scale(0.95);
  }

  &.active {
    border-color: $primary;
    background: rgba($primary, 0.06);
    box-shadow: 0 0 0 3px rgba($primary, 0.12);

    .chip-icon { color: $primary; }
  }
}

.chip-icon {
  font-size: 1.5rem;
  line-height: 1;
  color: $primary-dark;
}

.chip-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: $primary-dark;
  text-align: center;
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

  &:not(.disabled):active {
    transform: scale(0.97);
  }

  &.disabled {
    background: #d0d0d0;
    cursor: not-allowed;
    box-shadow: none;
  }
}

.btn-arrow {
  font-size: 1rem;
  transition: transform 0.2s;
}

.btn-primary:not(.disabled):hover .btn-arrow {
  transform: translateX(3px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
