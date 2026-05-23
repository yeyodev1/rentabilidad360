<script setup lang="ts">
import { useOnboardingStore } from '@/stores/onboarding'
import { ref } from 'vue'

const store = useOnboardingStore()

import type { CurrencyCode } from '@/stores/onboarding'
import { CURRENCY_SYMBOLS } from '@/stores/onboarding'

const currencies = [
  { code: 'USD' as CurrencyCode, symbol: '$', label: 'USD' },
  { code: 'MXN' as CurrencyCode, symbol: 'MX$', label: 'MXN' },
  { code: 'EUR' as CurrencyCode, symbol: '€', label: 'EUR' },
  { code: 'COP' as CurrencyCode, symbol: 'COL$', label: 'COP' },
]

const showCurrencyPicker = ref(false)

function selectCurrency(code: CurrencyCode) {
  store.currency = code
  showCurrencyPicker.value = false
}

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US')
}

function onSliderInput(e: Event) {
  const target = e.target as HTMLInputElement
  store.investment = Number(target.value)
}

function sym(code: CurrencyCode): string {
  return CURRENCY_SYMBOLS[code]
}
</script>

<template>
  <div class="step-container">
    <div class="step-header">
      <button class="btn-back" @click="store.goToStep(2)">
        <i class="fa-solid fa-arrow-left" /> Atrás
      </button>
      <div class="step-indicator">Paso 3 de 5</div>
    </div>

    <div class="step-content">
      <h2 class="step-title">¿Cuánto planeas invertir para arrancar?</h2>

      <div class="input-group">
        <label class="input-label">Moneda</label>
          <button class="currency-selector" @click="showCurrencyPicker = !showCurrencyPicker">
          <span class="currency-display">{{ store.currencySymbol }} {{ store.currency }}</span>
          <i class="fa-solid fa-chevron-down chevron" :class="{ open: showCurrencyPicker }" />
        </button>

        <Transition name="dropdown">
          <div v-if="showCurrencyPicker" class="currency-dropdown">
            <button
              v-for="c in currencies"
              :key="c.code"
              :class="['currency-option', { active: store.currency === c.code }]"
              @click="selectCurrency(c.code)"
            >
              <span class="currency-symbol">{{ sym(c.code) }}</span>
              <span class="currency-label">{{ c.label }}</span>
              <i v-if="store.currency === c.code" class="fa-solid fa-check check" />
            </button>
          </div>
        </Transition>
      </div>

      <div class="input-group">
        <label class="input-label">
          Inversión inicial
          <span class="input-sublabel">Arrastra para ajustar</span>
        </label>

        <div class="slider-container">
          <input
            type="range"
            class="investment-slider"
            min="1000"
            max="200000"
            step="1000"
            :value="store.investment"
            @input="onSliderInput"
          />
          <div class="slider-value">
            <span class="currency-symbol-sm">{{ store.currencySymbol }}</span>
            <span class="value-number">{{ formatCurrency(store.investment) }}</span>
          </div>
          <div class="slider-range">
            <span>{{ store.currencySymbol }}1,000</span>
            <span>{{ store.currencySymbol }}200,000</span>
          </div>
        </div>
      </div>
    </div>

    <div class="step-footer">
      <button class="btn-primary" @click="store.goToStep(4)">
        Siguiente
        <i class="fa-solid fa-arrow-right btn-arrow" />
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
  align-items: center;
  gap: 8px;
}

.input-sublabel {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.75rem;
  color: #999;
}

.currency-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px;
  border: 2px solid rgba($primary-dark, 0.08);
  border-radius: 14px;
  background: white;
  cursor: pointer;
  font-family: $font-principal;
  transition: border-color 0.2s;
  -webkit-tap-highlight-color: transparent;

  &:focus {
    border-color: $primary;
  }
}

.currency-display {
  font-size: 1rem;
  font-weight: 600;
  color: $primary-dark;
}

.chevron {
  font-size: 0.7rem;
  color: $text-secondary;
  transition: transform 0.2s;

  &.open {
    transform: rotate(180deg);
  }
}

.currency-dropdown {
  border: 2px solid rgba($primary-dark, 0.08);
  border-radius: 14px;
  overflow: hidden;
  background: white;
}

.currency-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border: none;
  background: white;
  cursor: pointer;
  font-family: $font-principal;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;

  &:not(:last-child) {
    border-bottom: 1px solid rgba($primary-dark, 0.06);
  }

  &:active {
    background: rgba($primary, 0.06);
  }

  &.active {
    background: rgba($primary, 0.06);
  }
}

.currency-symbol {
  font-size: 1rem;
  font-weight: 700;
  color: $primary;
  width: 36px;
}

.currency-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: $primary-dark;
  flex: 1;
  text-align: left;
}

.check {
  color: $primary;
  font-weight: 700;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.slider-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.investment-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  border-radius: 3px;
  outline: none;
  background: rgba($primary, 0.15);

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: $primary;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba($primary, 0.3);
    transition: box-shadow 0.2s;
  }

  &::-webkit-slider-thumb:active {
    box-shadow: 0 2px 12px rgba($primary, 0.5);
  }

  &::-moz-range-thumb {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: $primary;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba($primary, 0.3);
  }
}

.slider-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  background: rgba($primary, 0.04);
  border-radius: 14px;
}

.currency-symbol-sm {
  font-size: 1.2rem;
  font-weight: 700;
  color: $primary;
}

.value-number {
  font-size: 2rem;
  font-weight: 700;
  color: $primary-dark;
  font-variant-numeric: tabular-nums;
}

.slider-range {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #999;
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
  gap: 8px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.97);
  }
}

.btn-arrow {
  font-size: 1.2rem;
}
</style>
