<script setup lang="ts">
import { useOnboardingStore } from '@/stores/onboarding'

const store = useOnboardingStore()

const materialOptions = [15, 20, 25, 30, 35, 40, 45, 50]

function generate() {
  store.showLoading()
}

function haptic() {
  if (navigator.vibrate) navigator.vibrate(10)
}
</script>

<template>
  <div class="step-container">
    <div class="step-header">
      <button class="btn-back" @click="store.goToStep(4)">
        <i class="fa-solid fa-arrow-left" /> Atrás
      </button>
      <div class="step-indicator">Paso 5 de 5</div>
    </div>

    <div class="step-content">
      <h2 class="step-title">Tus dos gastos principales</h2>

      <div class="input-group">
        <label class="input-label">
          Costo de materia prima
          <span class="input-sublabel">¿Qué % de tus ventas se va en insumos?</span>
        </label>
        <div class="percentage-grid">
          <button
            v-for="pct in materialOptions"
            :key="pct"
            :class="['pct-chip', { active: store.rawMaterialPercent === pct }]"
            @click="store.rawMaterialPercent = pct; haptic()"
          >
            {{ pct }}%
          </button>
        </div>
      </div>

      <div class="input-group">
        <label class="input-label">Alquiler mensual</label>
        <div class="price-input-wrapper">
          <span class="price-prefix">{{ store.currencySymbol }}</span>
          <input
            v-model.number="store.monthlyRent"
            type="number"
            class="price-input"
            placeholder="0"
            min="0"
            inputmode="decimal"
            autocomplete="off"
          />
        </div>
        <p class="input-hint">Incluye renta del local, servicios y gastos fijos mensuales</p>
      </div>
    </div>

    <div class="step-footer">
      <button
        :class="['btn-generate', { disabled: !store.step4Complete }]"
        :disabled="!store.step4Complete"
        @click="generate"
      >
        Generar Diagnóstico
        <i class="fa-solid fa-wand-magic-sparkles btn-sparkle" />
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
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: $text-secondary;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: $font-principal;
  cursor: pointer;
  padding: 8px 0;
  -webkit-tap-highlight-color: transparent;

  .arrow {
    font-size: 1.1rem;
  }
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
  gap: 28px;
  padding-top: 16px;
}

.step-title {
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.3;
  color: $primary-dark;
  margin: 0;
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
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.input-sublabel {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.75rem;
  color: #999;
}

.input-hint {
  font-size: 0.75rem;
  color: #aaa;
  margin: 0;
  font-style: italic;
}

.percentage-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.pct-chip {
  padding: 12px 8px;
  border: 2px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  background: white;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: $font-principal;
  color: $primary-dark;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.93);
  }

  &.active {
    border-color: $primary;
    background: rgba($primary, 0.06);
    color: $primary;
    box-shadow: 0 0 0 3px rgba($primary, 0.12);
  }
}

.price-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 16px;
  border: 2px solid rgba($primary-dark, 0.08);
  border-radius: 14px;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus-within {
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba($primary, 0.12);
  }
}

.price-prefix {
  font-size: 1.2rem;
  font-weight: 700;
  color: $primary;
}

.price-input {
  flex: 1;
  padding: 14px 0;
  border: none;
  font-size: 1.4rem;
  font-weight: 700;
  font-family: $font-principal;
  outline: none;
  background: transparent;
  color: $primary-dark;
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &::placeholder {
    color: #d0d0d0;
  }
}

.step-footer {
  padding: 16px 0;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

.btn-generate {
  width: 100%;
  padding: 18px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, $primary, #1678b0);
  color: white;
  font-size: 1.05rem;
  font-weight: 700;
  font-family: $font-principal;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 16px rgba($primary, 0.3);
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

.btn-sparkle {
  font-size: 1.1rem;
}
</style>
