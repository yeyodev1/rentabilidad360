<script setup lang="ts">
import { useOnboardingStore } from '@/stores/onboarding'

const store = useOnboardingStore()
</script>

<template>
  <div class="step-container">
    <div class="step-header">
      <button class="btn-back" @click="store.goToStep(3)">
        <i class="fa-solid fa-arrow-left" /> Atrás
      </button>
      <div class="step-indicator">Paso 4 de 5</div>
    </div>

    <div class="step-content">
      <h2 class="step-title">Hablemos de tus clientes</h2>

      <div class="input-group">
        <label class="input-label">Precio promedio (Ticket)</label>
        <div class="price-input-wrapper">
        <span class="price-prefix">{{ store.currencySymbol }}</span>
          <input
            v-model.number="store.avgPrice"
            type="number"
            class="price-input"
            placeholder="0"
            min="0"
            inputmode="decimal"
            autocomplete="off"
          />
        </div>
      </div>

      <div class="input-group">
        <label class="input-label">
          Cantidad mensual de clientes
          <span class="input-sublabel">Arrastra para ajustar</span>
        </label>
        <input
          type="range"
          class="clients-slider"
          min="0"
          max="5000"
          step="10"
          :value="store.monthlyClients ?? 0"
          @input="store.monthlyClients = Number(($event.target as HTMLInputElement).value)"
        />
        <div class="clients-value">
          <span class="value-number">{{ store.monthlyClients ?? 0 }}</span>
          <span class="value-label">clientes / mes</span>
        </div>
      </div>
    </div>

    <div class="step-footer">
      <div class="live-estimate">
        Ventas estimadas:
        <strong v-if="store.estimatedSales !== null">
          {{ store.currencySymbol }}{{ store.estimatedSales.toLocaleString('en-US') }}
        </strong>
        <span v-else>Completa los campos</span>
      </div>

      <button
        :class="['btn-primary', { disabled: !store.step3Complete }]"
        :disabled="!store.step3Complete"
        @click="store.goToStep(5)"
      >
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

.clients-slider {
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

.clients-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: rgba($primary, 0.04);
  border-radius: 14px;
}

.value-number {
  font-size: 1.8rem;
  font-weight: 700;
  color: $primary-dark;
  font-variant-numeric: tabular-nums;
}

.value-label {
  font-size: 0.9rem;
  color: $text-secondary;
}

.step-footer {
  padding: 16px 0;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

.live-estimate {
  text-align: center;
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 12px;
  padding: 10px;
  background: rgba($primary, 0.04);
  border-radius: 10px;

  strong {
    color: $primary;
    font-weight: 700;
  }

  span {
    color: #ccc;
    font-style: italic;
  }
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

  &:not(.disabled):active {
    transform: scale(0.97);
  }

  &.disabled {
    background: #d0d0d0;
    cursor: not-allowed;
  }
}

.btn-arrow {
  font-size: 1.2rem;
}
</style>
