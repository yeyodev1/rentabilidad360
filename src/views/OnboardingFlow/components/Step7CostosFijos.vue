<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

function updateField(key: string, val: any) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: val,
  })
}
</script>

<template>
  <div class="ob-fixed-costs-container">
    <!-- Step Helper Info Banner -->
    <div class="flow-helper-banner">
      <div class="banner-intro">
        <div class="banner-icon-wrapper">
          <i class="fa-solid fa-receipt" />
        </div>
        <div class="banner-body">
          <h4 class="banner-title">Gastos Mensuales y Costos Fijos</h4>
          <p class="banner-text">
            Ingresa los gastos operativos que tu negocio debe pagar mes a mes para poder funcionar. 
            <strong>Si no conoces los montos exactos, puedes usar un estimado o aproximado</strong>. 
            Podrás refinar y cambiar todos estos números más adelante en tu panel administrativo.
          </p>
        </div>
      </div>
    </div>

    <!-- Main Editor Box -->
    <div class="ob-fixed-costs-editor">
      <div class="editor-section-title">
        <i class="fa-solid fa-hand-holding-dollar" />
        <span>Estructura de Gastos Fijos (Estimados Mensuales)</span>
      </div>

      <div class="fields-grid">
        <!-- Rent (Alquiler) - Highlighted Single Column -->
        <div class="field-item full-width">
          <label class="field-label has-tooltip">
            Alquiler / Arrendamiento <span class="req">*</span>
            <span class="help-trigger" tabindex="0" data-tooltip="El costo mensual del alquiler de tu local comercial, cocina u oficinas. Si el local es propio, puedes dejarlo en 0.">
              <i class="fa-solid fa-circle-question" />
            </span>
          </label>
          <div class="premium-input-wrapper prefix">
            <span class="input-accent-symbol">$</span>
            <i class="fa-solid fa-house-chimney field-icon" />
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
          <span class="micro-hint">Ej: Renta mensual del local comercial (aproximado)</span>
        </div>

        <!-- Payroll (Nómina administrativa) -->
        <div class="field-item">
          <label class="field-label has-tooltip">
            Nómina Administrativa
            <span class="help-trigger" tabindex="0" data-tooltip="Salarios del personal administrativo, contadores, gerentes o el tuyo propio. No incluyas cocineros o meseros si su pago varía según la producción.">
              <i class="fa-solid fa-circle-question" />
            </span>
          </label>
          <div class="premium-input-wrapper prefix">
            <span class="input-accent-symbol">$</span>
            <i class="fa-solid fa-users-gear field-icon" />
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
          <span class="micro-hint">Ej: Sueldos de administración y socios</span>
        </div>

        <!-- Utilities (Servicios básicos) -->
        <div class="field-item">
          <label class="field-label has-tooltip">
            Servicios Básicos
            <span class="help-trigger" tabindex="0" data-tooltip="Consumo promedio mensual de luz, agua, gas de cocina, internet, telefonía y recolección de basura.">
              <i class="fa-solid fa-circle-question" />
            </span>
          </label>
          <div class="premium-input-wrapper prefix">
            <span class="input-accent-symbol">$</span>
            <i class="fa-solid fa-lightbulb field-icon" />
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
          <span class="micro-hint">Ej: Agua, luz, gas de cocina e internet</span>
        </div>

        <!-- Insurance (Seguros) -->
        <div class="field-item">
          <label class="field-label has-tooltip">
            Seguros y Pólizas
            <span class="help-trigger" tabindex="0" data-tooltip="Costo mensual estimado de pólizas de protección, seguro de responsabilidad civil, seguros contra incendios, etc.">
              <i class="fa-solid fa-circle-question" />
            </span>
          </label>
          <div class="premium-input-wrapper prefix">
            <span class="input-accent-symbol">$</span>
            <i class="fa-solid fa-shield-halved field-icon" />
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
          <span class="micro-hint">Ej: Seguro contra robos e incendios mensual</span>
        </div>

        <!-- Marketing -->
        <div class="field-item">
          <label class="field-label has-tooltip">
            Marketing y Publicidad
            <span class="help-trigger" tabindex="0" data-tooltip="Inversión regular mensual en anuncios (Instagram, Facebook Ads), folletos, diseño gráfico o campañas promocionales.">
              <i class="fa-solid fa-circle-question" />
            </span>
          </label>
          <div class="premium-input-wrapper prefix">
            <span class="input-accent-symbol">$</span>
            <i class="fa-solid fa-bullhorn field-icon" />
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
          <span class="micro-hint">Ej: Anuncios digitales y promociones</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ob-fixed-costs-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

/* Premium Info Banner */
.flow-helper-banner {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgba($primary, 0.05) 0%, rgba($secondary, 0.03) 100%);
  border: 1.5px solid rgba($primary, 0.12);
  border-radius: 18px;
  padding: 16px;
  gap: 16px;
  transition: all 0.3s ease;

  @media (min-width: 600px) {
    padding: 20px;
  }

  &:hover {
    border-color: rgba($primary, 0.25);
    box-shadow: 0 6px 18px rgba($primary, 0.05);
  }
}

.banner-intro {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.banner-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: white;
  border: 1px solid rgba($primary, 0.15);
  color: $primary;
  font-size: 1.05rem;
  box-shadow: 0 4px 8px rgba($primary, 0.05);
  flex-shrink: 0;
}

.banner-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.banner-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: $primary-dark;
}

.banner-text {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: $text-secondary;

  strong {
    color: $primary-dark;
    font-weight: 800;
  }
}

/* Fixed Costs Editor Box */
.ob-fixed-costs-editor {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 24px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba($primary-dark, 0.02);

  @media (min-width: 600px) {
    padding: 24px;
  }
}

.editor-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 14px;
  border-bottom: 1.5px solid rgba($primary-dark, 0.04);
  font-size: 0.9rem;
  font-weight: 800;
  color: $primary-dark;

  i {
    color: $primary;
    font-size: 1.05rem;
  }
}

/* Responsive Fields Grid */
.fields-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media (min-width: 600px) {
    grid-template-columns: 1fr 1fr;
  }
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &.full-width {
    grid-column: 1 / -1;
  }
}

.field-label {
  font-size: 0.78rem;
  font-weight: 800;
  color: $primary-dark;
  display: flex;
  align-items: center;
  gap: 6px;

  &.has-tooltip {
    cursor: help;
  }
}

.req {
  color: $alert-error;
  margin-left: 2px;
}

/* Premium Tooltip Styles */
.help-trigger {
  position: relative;
  cursor: help;
  color: rgba($primary-dark, 0.35);
  font-size: 0.78rem;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  outline: none;

  &:hover,
  &:focus,
  &:focus-within,
  &:active {
    color: $primary;

    &::after {
      content: attr(data-tooltip);
      position: absolute;
      bottom: 135%;
      left: 50%;
      transform: translateX(-50%);
      background: $primary-dark;
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.72rem;
      font-weight: 500;
      white-space: normal;
      width: 220px;
      line-height: 1.4;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
      z-index: 100;
      text-transform: none;
      letter-spacing: normal;
    }

    &::before {
      content: '';
      position: absolute;
      bottom: 120%;
      left: 50%;
      transform: translateX(-50%);
      border-width: 6px;
      border-style: solid;
      border-color: $primary-dark transparent transparent transparent;
      z-index: 100;
    }
  }
}

/* Premium Inputs with Icons & Prefixes */
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

  .field-icon {
    position: absolute;
    left: 32px;
    color: rgba($primary-dark, 0.3);
    font-size: 0.85rem;
    pointer-events: none;
  }

  &.prefix {
    .premium-input {
      padding-left: 34px;
    }
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
  padding: 12px 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: $primary-dark;
  outline: none;
  font-family: inherit;

  &::placeholder {
    color: rgba($primary-dark, 0.2);
  }
}

.numeric-input {
  font-feature-settings: "tnum";
}

.micro-hint {
  font-size: 0.7rem;
  color: $text-secondary;
  margin-top: 1px;
}
</style>
