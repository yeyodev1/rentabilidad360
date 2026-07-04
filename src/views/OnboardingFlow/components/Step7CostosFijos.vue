<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const showMore = ref(false)

const hasMoreValues = computed(() =>
  !!(props.modelValue.utilities || props.modelValue.internet || props.modelValue.insurance || props.modelValue.marketing)
)

function updateField(key: string, val: any) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: val,
  })
}

function skipStep() {
  emit('update:modelValue', {
    ...props.modelValue,
    skipped: true,
  })
}

function undoSkip() {
  emit('update:modelValue', {
    ...props.modelValue,
    skipped: false,
  })
}
</script>

<template>
  <div class="ob-fixed-costs-container">
    <p class="ob-hint-line">
      <i class="fa-solid fa-circle-info" />
      Un estimado está bien — podrás refinarlo después.
    </p>

    <div class="ob-fixed-costs-editor">
      <!-- Primary fields, always visible -->
      <div class="fields-grid">
        <div class="field-item">
          <label class="field-label">Alquiler / Arrendamiento <span class="req">*</span></label>
          <div class="premium-input-wrapper prefix">
            <span class="input-accent-symbol">$</span>
            <input
              :value="modelValue.rent"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="premium-input numeric-input"
              @input="updateField('rent', ($event.target as HTMLInputElement).value === '' ? null : parseFloat(($event.target as HTMLInputElement).value))"
            />
          </div>
          <span class="micro-hint">Renta mensual del local (0 si es propio)</span>
        </div>

        <div class="field-item">
          <label class="field-label">Nómina Administrativa</label>
          <div class="premium-input-wrapper prefix">
            <span class="input-accent-symbol">$</span>
            <input
              :value="modelValue.payroll"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="premium-input numeric-input"
              @input="updateField('payroll', ($event.target as HTMLInputElement).value === '' ? null : parseFloat(($event.target as HTMLInputElement).value))"
            />
          </div>
          <span class="micro-hint">Sueldos de administración y socios</span>
        </div>
      </div>

      <!-- Secondary fields, progressive disclosure -->
      <button v-if="!showMore && !hasMoreValues" type="button" class="ob-more-toggle" @click="showMore = true">
        <i class="fa-solid fa-plus" /> Agregar más gastos (servicios, internet, seguros, marketing)
      </button>

      <Transition name="expand">
        <div v-if="showMore || hasMoreValues" class="fields-grid more-fields">
          <div class="field-item">
            <label class="field-label">Servicios Básicos</label>
            <div class="premium-input-wrapper prefix">
              <span class="input-accent-symbol">$</span>
              <input
                :value="modelValue.utilities"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="premium-input numeric-input"
                @input="updateField('utilities', ($event.target as HTMLInputElement).value === '' ? null : parseFloat(($event.target as HTMLInputElement).value))"
              />
            </div>
            <span class="micro-hint">Agua, luz y gas de cocina</span>
          </div>

          <div class="field-item">
            <label class="field-label">Internet</label>
            <div class="premium-input-wrapper prefix">
              <span class="input-accent-symbol">$</span>
              <input
                :value="modelValue.internet"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="premium-input numeric-input"
                @input="updateField('internet', ($event.target as HTMLInputElement).value === '' ? null : parseFloat(($event.target as HTMLInputElement).value))"
              />
            </div>
            <span class="micro-hint">Plan de internet y telefonía</span>
          </div>

          <div class="field-item">
            <label class="field-label">Seguros y Pólizas</label>
            <div class="premium-input-wrapper prefix">
              <span class="input-accent-symbol">$</span>
              <input
                :value="modelValue.insurance"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="premium-input numeric-input"
                @input="updateField('insurance', ($event.target as HTMLInputElement).value === '' ? null : parseFloat(($event.target as HTMLInputElement).value))"
              />
            </div>
            <span class="micro-hint">Seguro contra robos e incendios</span>
          </div>

          <div class="field-item">
            <label class="field-label">Marketing y Publicidad</label>
            <div class="premium-input-wrapper prefix">
              <span class="input-accent-symbol">$</span>
              <input
                :value="modelValue.marketing"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="premium-input numeric-input"
                @input="updateField('marketing', ($event.target as HTMLInputElement).value === '' ? null : parseFloat(($event.target as HTMLInputElement).value))"
              />
            </div>
            <span class="micro-hint">Anuncios digitales y promociones</span>
          </div>
        </div>
      </Transition>
    </div>

    <button v-if="!modelValue.skipped" class="ob-skip-btn" @click="skipStep">
      <i class="fa-regular fa-circle-xmark" /> No sé mis costos fijos ahora, los pondré después
    </button>
    <div v-else class="ob-skipped-banner">
      <i class="fa-solid fa-forward-step" />
      <span>Omitiste los costos fijos. Puedes configurarlos después desde Costeo.</span>
      <button class="ob-undo-btn" @click="undoSkip">Configurar ahora</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ob-fixed-costs-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.ob-hint-line {
  display: flex; align-items: center; gap: 8px;
  margin: 0; font-size: 0.82rem; color: $text-secondary;
  i { color: $primary; }
}

.ob-fixed-costs-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fields-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 500px) {
    grid-template-columns: 1fr 1fr;
  }
}

.more-fields { padding-top: 4px; border-top: 1px dashed rgba($primary-dark, 0.08); }

.field-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: $primary-dark;
}

.req { color: $alert-error; margin-left: 2px; }

.premium-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #fafbfc;
  border: 1.5px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  padding: 0 12px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:focus-within {
    border-color: $primary;
    background: white;
    box-shadow: 0 0 0 4px rgba($primary, 0.08);
  }
}

.input-accent-symbol {
  font-size: 0.82rem;
  font-weight: 800;
  color: $primary;
  margin-right: 8px;
  user-select: none;
}

.premium-input {
  width: 100%;
  border: none;
  background: transparent;
  padding: 14px 0;
  font-size: 0.92rem;
  font-weight: 600;
  color: $primary-dark;
  outline: none;
  font-family: inherit;

  &::placeholder { color: rgba($primary-dark, 0.2); }
}

.micro-hint {
  font-size: 0.72rem;
  color: $text-secondary;
}

.ob-more-toggle {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px; border-radius: 12px;
  background: rgba($primary, 0.05); color: $primary;
  border: 1.5px dashed rgba($primary, 0.25);
  font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba($primary, 0.1); border-color: $primary; }
}

.expand-enter-active, .expand-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 400px; }

.ob-skip-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 14px; margin-top: 4px;
  border-radius: 14px; background: transparent;
  border: 1.5px dashed rgba($primary-dark, 0.15); color: $text-secondary;
  font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: $primary; color: $primary; background: rgba($primary,0.03); }
}

.ob-skipped-banner {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px; margin-top: 4px;
  background: rgba($primary,0.04); border: 1.5px solid rgba($primary,0.12);
  border-radius: 14px; font-size: 0.85rem; color: $primary-dark; font-weight: 600;
  flex-wrap: wrap;
  i { font-size: 1.2rem; color: $primary; }
  .ob-undo-btn {
    margin-left: auto; padding: 8px 16px; border-radius: 10px;
    background: white; border: 1.5px solid $primary; color: $primary;
    font-family: inherit; font-weight: 800; font-size: 0.8rem; cursor: pointer;
    transition: all 0.2s;
    &:hover { background: $primary; color: white; }
  }
}
</style>
