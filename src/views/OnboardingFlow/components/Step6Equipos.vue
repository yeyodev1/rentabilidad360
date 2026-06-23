<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const showGuide = ref(true)

function addItem() {
  const updatedValue = JSON.parse(JSON.stringify(props.modelValue))
  if (!updatedValue.equipment) updatedValue.equipment = []
  // Initialize with friendly standard defaults (5 years life, 90 days maintenance)
  updatedValue.equipment.push({
    name: '',
    brand: '',
    purchaseDate: '',
    historicalCost: null,
    usefulLife: 5,
    maintenanceIntervalDays: 90,
  })
  emit('update:modelValue', updatedValue)
}

function skipStep() {
  emit('update:modelValue', { ...props.modelValue, skipped: true })
}

function undoSkip() {
  emit('update:modelValue', { ...props.modelValue, skipped: false })
}

function removeItem(i: string | number) {
  const updatedValue = JSON.parse(JSON.stringify(props.modelValue))
  updatedValue.equipment.splice(Number(i), 1)
  emit('update:modelValue', updatedValue)
}

function updateItem(i: string | number, field: string, value: any) {
  const updatedValue = JSON.parse(JSON.stringify(props.modelValue))
  const idx = Number(i)
  if (updatedValue.equipment[idx]) {
    updatedValue.equipment[idx][field] = value
    emit('update:modelValue', updatedValue)
  }
}
</script>

<template>
  <div class="ob-equipment-container">
    <!-- Step Helper Info Banner -->
    <div class="flow-helper-banner">
      <div class="banner-intro">
        <div class="banner-icon-wrapper">
          <i class="fa-solid fa-screwdriver-wrench" />
        </div>
        <div class="banner-body">
          <h4 class="banner-title">Depreciación y Mantenimiento de Equipos</h4>
          <p class="banner-text">
            Registra la maquinaria y equipos de tu negocio (ej: hornos, refrigeradores, sistemas POS). Esto permite calcular automáticamente la depreciación mensual y programar alertas de mantenimiento preventivo.
          </p>
        </div>
      </div>
    </div>

    <!-- Suggested Estimates Expandable Box -->
    <div class="estimates-guide-card" :class="{ 'is-expanded': showGuide }">
      <button type="button" class="guide-toggle-btn" @click="showGuide = !showGuide">
        <span class="guide-title-wrap">
          <i class="fa-solid fa-circle-question" />
          <strong>Guía de Estimaciones Recomendadas (Si no estás seguro)</strong>
        </span>
        <i class="fa-solid" :class="showGuide ? 'fa-chevron-up' : 'fa-chevron-down'" />
      </button>

      <div :class="['guide-content-wrapper', { 'is-open': showGuide }]">
        <div class="guide-grid">
          <!-- Cold Equipments -->
          <div class="guide-item">
            <span class="guide-icon-wrap"><i class="fa-solid fa-snowflake" /></span>
            <div class="guide-item-info">
              <strong>Equipos de Frío (Neveras, Congeladores)</strong>
              <span>Vida Útil: 8 a 10 Años</span>
              <span>Mantenimiento: Cada 90 Días (3 meses)</span>
            </div>
          </div>

          <!-- Hot Equipments -->
          <div class="guide-item">
            <span class="guide-icon-wrap"><i class="fa-solid fa-fire" /></span>
            <div class="guide-item-info">
              <strong>Equipos de Calor (Hornos, Cocinas)</strong>
              <span>Vida Útil: 10 Años</span>
              <span>Mantenimiento: Cada 180 Días (6 meses)</span>
            </div>
          </div>

          <!-- Small appliances -->
          <div class="guide-item">
            <span class="guide-icon-wrap"><i class="fa-solid fa-blender" /></span>
            <div class="guide-item-info">
              <strong>Pequeños Electrodomésticos (Licuadoras)</strong>
              <span>Vida Útil: 3 Años</span>
              <span>Mantenimiento: Cada 120 Días (4 meses)</span>
            </div>
          </div>

          <!-- Tech/POS -->
          <div class="guide-item">
            <span class="guide-icon-wrap"><i class="fa-solid fa-computer" /></span>
            <div class="guide-item-info">
              <strong>Sistemas POS y Computadoras</strong>
              <span>Vida Útil: 4 a 5 Años</span>
              <span>Mantenimiento: Cada 365 Días (1 año)</span>
            </div>
          </div>
        </div>
        <p class="guide-disclaimer">
          Nota: Hemos pre-cargado valores estándar recomendados (5 años de vida útil y 90 días de mantenimiento) al agregar un equipo nuevo para facilitarte el llenado. Puedes editarlos según lo necesites.
        </p>
      </div>
    </div>

    <!-- Main Editor Box -->
    <div class="ob-equipment-editor">
      <!-- Editor Top Bar Summary -->
      <div class="editor-top-bar">
        <div class="counter-badge">
          <i class="fa-solid fa-server" />
          <span>Equipos agregados: <strong>{{ modelValue.equipment?.length || 0 }}</strong></span>
        </div>
        <button type="button" class="quick-add-top-btn" @click="addItem">
          <i class="fa-solid fa-plus" /> Agregar Equipo
        </button>
      </div>

      <!-- Equipment Cards Grid -->
      <div class="equipment-cards-grid">
        <TransitionGroup name="card-fade" tag="div" class="cards-list-wrapper">
          <div
            v-for="(eq, i) in modelValue.equipment || []"
            :key="i"
            class="equipment-premium-card"
            :class="{ 'is-complete': eq.name && eq.historicalCost !== null && eq.purchaseDate }"
          >
            <!-- Card Header -->
            <div class="card-head">
              <div class="card-title-wrap">
                <span class="card-index-dot">#{{ Number(i) + 1 }}</span>
                <span class="card-label-txt">Ficha del Equipo</span>
              </div>

              <div class="card-actions-wrap">
                <span v-if="eq.name && eq.historicalCost !== null && eq.purchaseDate" class="status-pill complete">
                  <i class="fa-solid fa-circle-check" /> Listo
                </span>
                <span v-else class="status-pill incomplete">
                  <i class="fa-solid fa-circle-minus" /> Pendiente
                </span>

                <button
                  type="button"
                  class="card-remove-btn"
                  title="Eliminar equipo"
                  @click="removeItem(i)"
                >
                  <i class="fa-solid fa-xmark" />
                </button>
              </div>
            </div>

            <!-- Card Body Fields -->
            <div class="card-body-fields">
              <!-- Section 1: Identification -->
              <div class="card-field-section">
                <div class="section-badge-title">
                  <i class="fa-solid fa-tag" />
                  <span>Identificación Básica</span>
                </div>
                <div class="fields-two-column-grid">
                  <!-- Name -->
                  <div class="field-item">
                    <label class="field-label">Nombre del Equipo</label>
                    <div class="premium-input-wrapper">
                      <i class="fa-solid fa-desktop field-icon" />
                      <input
                        :value="eq.name"
                        placeholder="Ej: Horno Convector, Licuadora Industrial..."
                        type="text"
                        class="premium-input"
                        @input="updateItem(i, 'name', ($event.target as HTMLInputElement).value)"
                      />
                    </div>
                  </div>

                  <!-- Brand -->
                  <div class="field-item">
                    <label class="field-label">Marca / Modelo</label>
                    <div class="premium-input-wrapper">
                      <i class="fa-solid fa-industry field-icon" />
                      <input
                        :value="eq.brand"
                        placeholder="Ej: Rational, Oster..."
                        type="text"
                        class="premium-input"
                        @input="updateItem(i, 'brand', ($event.target as HTMLInputElement).value)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Section 2: Financial and Operational Parameters -->
              <div class="card-field-section border-top-dashed">
                <div class="section-badge-title">
                  <i class="fa-solid fa-circle-dollar-to-slot" />
                  <span>Finanzas y Ciclo Operativo</span>
                </div>
                <div class="fields-row-grid">
                  <!-- Purchase Date -->
                  <div class="field-item">
                    <label class="field-label">Fecha de Compra</label>
                    <div class="premium-input-wrapper">
                      <i class="fa-solid fa-calendar-days field-icon" />
                      <input
                        :value="eq.purchaseDate"
                        type="date"
                        class="premium-input date-input"
                        @change="updateItem(i, 'purchaseDate', ($event.target as HTMLInputElement).value)"
                      />
                    </div>
                    <span class="micro-hint">Día de adquisición del equipo</span>
                  </div>

                  <!-- Historical Cost -->
                  <div class="field-item">
                    <label class="field-label has-tooltip">
                      Costo de Compra
                      <span class="help-trigger" tabindex="0" data-tooltip="El precio total pagado por el equipo (sin incluir impuestos o IVA).">
                        <i class="fa-solid fa-circle-question" />
                      </span>
                    </label>
                    <div class="premium-input-wrapper prefix">
                      <span class="input-accent-symbol">$</span>
                      <input
                        :value="eq.historicalCost"
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        min="0"
                        class="premium-input numeric-input"
                        @input="updateItem(i, 'historicalCost', ($event.target as HTMLInputElement).value === '' ? null : parseFloat(($event.target as HTMLInputElement).value))"
                      />
                    </div>
                    <span class="micro-hint">Precio total pagado por el activo</span>
                  </div>

                  <!-- Useful Life -->
                  <div class="field-item">
                    <label class="field-label has-tooltip">
                      Vida Útil
                      <span class="help-trigger" tabindex="0" data-tooltip="Años estimados de vida útil para dividir el costo de compra y calcular la pérdida de valor mensual (depreciación).">
                        <i class="fa-solid fa-circle-question" />
                      </span>
                    </label>
                    <div class="premium-input-wrapper suffix">
                      <input
                        :value="eq.usefulLife"
                        placeholder="5"
                        type="number"
                        min="1"
                        max="50"
                        class="premium-input numeric-input"
                        @input="updateItem(i, 'usefulLife', ($event.target as HTMLInputElement).value === '' ? null : parseFloat(($event.target as HTMLInputElement).value))"
                      />
                      <span class="input-accent-symbol">Años</span>
                    </div>
                    <span class="micro-hint">Estándar: 5 años de uso estimado</span>
                  </div>

                  <!-- Maintenance Interval -->
                  <div class="field-item">
                    <label class="field-label has-tooltip">
                      Mantenimiento
                      <span class="help-trigger" tabindex="0" data-tooltip="Frecuencia recomendada en días para hacer revisiones preventivas y evitar averías costosas.">
                        <i class="fa-solid fa-circle-question" />
                      </span>
                    </label>
                    <div class="premium-input-wrapper suffix">
                      <input
                        :value="eq.maintenanceIntervalDays"
                        placeholder="90"
                        type="number"
                        min="1"
                        class="premium-input numeric-input"
                        @input="updateItem(i, 'maintenanceIntervalDays', ($event.target as HTMLInputElement).value === '' ? null : parseFloat(($event.target as HTMLInputElement).value))"
                      />
                      <span class="input-accent-symbol">Días</span>
                    </div>
                    <span class="micro-hint">Estándar: Cada 90 días (3 meses)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Empty State -->
      <div
        v-if="!modelValue.equipment || modelValue.equipment.length === 0"
        class="empty-state-equipment"
      >
        <div class="empty-icon-wrap">
          <i class="fa-solid fa-screwdriver-wrench empty-icon" />
        </div>
        <p class="empty-title">Sin equipos registrados</p>
        <p class="empty-desc">
          Agrega la maquinaria de tu cocina u oficina para proyectar sus gastos por depreciación y mantenimiento preventivo.
        </p>
      </div>

      <!-- Add Button at the Bottom -->
      <button type="button" class="add-equipment-btn" @click="addItem">
        <span class="btn-icon"><i class="fa-solid fa-plus" /></span>
        <span>Agregar nuevo equipo / maquinaria</span>
      </button>

      <button v-if="!modelValue.skipped" class="ob-skip-btn" @click="skipStep"><i class="fa-regular fa-circle-xmark" /> No tengo equipos ahora, los agregaré después</button>
      <div v-else class="ob-skipped-banner"><i class="fa-solid fa-forward-step" /><span>Omitiste los equipos. Puedes agregarlos después desde Mantenimiento → Equipos.</span><button class="ob-undo-btn" @click="undoSkip">Agregar ahora</button></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ob-equipment-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

/* Premium Info Banner with Visual Flow */
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
}

/* Suggestions Guide Box */
.estimates-guide-card {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1.5px solid rgba($primary, 0.15);
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba($primary, 0.03);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  &.is-expanded {
    border-color: rgba($primary, 0.35);
    box-shadow: 0 8px 24px rgba($primary, 0.08);
  }
}

.guide-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px;
  border: none;
  background: rgba($primary, 0.03);
  color: $primary;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s;

  &:hover {
    background: rgba($primary, 0.07);
  }
}

.guide-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  text-align: left;

  i {
    font-size: 1.05rem;
  }
}

.guide-content-wrapper {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  background: white;
  padding: 0 16px;

  &.is-open {
    max-height: 600px;
    opacity: 1;
    padding: 16px;
    border-top: 1.5px solid rgba($primary, 0.1);
  }
}

.guide-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;

  @media (min-width: 650px) {
    grid-template-columns: 1fr 1fr;
  }
}

.guide-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px;
  border-radius: 12px;
  background: rgba($primary-dark, 0.015);
  border: 1px solid rgba($primary-dark, 0.04);
}

.guide-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: white;
  border: 1px solid rgba($primary, 0.1);
  color: $primary;
  font-size: 0.82rem;
  flex-shrink: 0;
}

.guide-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.35;

  strong {
    font-size: 0.78rem;
    font-weight: 800;
    color: $primary-dark;
    margin-bottom: 2px;
  }

  span {
    font-size: 0.72rem;
    color: $text-secondary;
  }
}

.guide-disclaimer {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.4;
  color: $text-secondary;
  font-style: italic;
  padding-top: 8px;
  border-top: 1px dashed rgba($primary-dark, 0.08);
}

/* Editor Container */
.ob-equipment-editor {
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

/* Top bar with count & add button */
.editor-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1.5px solid rgba($primary-dark, 0.04);
}

.counter-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  color: $text-secondary;
  i {
    color: $primary;
  }
  strong {
    color: $primary-dark;
    font-weight: 800;
  }
}

.quick-add-top-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  background: rgba($primary, 0.06);
  border: 1px solid rgba($primary, 0.15);
  color: $primary;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: $primary;
    color: white;
    box-shadow: 0 4px 12px rgba($primary, 0.15);
  }
}

/* Cards Grid */
.equipment-cards-grid {
  width: 100%;
}
.cards-list-wrapper {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

/* Premium Card */
.equipment-premium-card {
  display: flex;
  flex-direction: column;
  background: #fbfcfd;
  border: 1.5px solid rgba($primary-dark, 0.07);
  border-radius: 18px;
  padding: 16px;
  gap: 16px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    border-color: rgba($primary, 0.25);
    background: white;
    box-shadow: 0 8px 24px rgba($primary-dark, 0.04);
  }

  &.is-complete {
    background: white;
    border-color: rgba($alert-success, 0.2);
    box-shadow: 0 4px 16px rgba($alert-success, 0.02);

    &:hover {
      border-color: rgba($alert-success, 0.4);
      box-shadow: 0 8px 24px rgba($alert-success, 0.05);
    }
  }
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba($primary-dark, 0.04);
  padding-bottom: 12px;
}

.card-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-index-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  background: rgba($primary-dark, 0.08);
  border-radius: 50%;
  font-size: 0.72rem;
  font-weight: 800;
  color: $primary-dark;
}

.card-label-txt {
  font-size: 0.82rem;
  font-weight: 800;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-actions-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 99px;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  &.complete {
    background: rgba($alert-success, 0.08);
    color: $alert-success;
  }
  &.incomplete {
    background: rgba($primary-dark, 0.05);
    color: $text-secondary;
  }
}

.card-remove-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba($primary-dark, 0.04);
  color: $text-secondary;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: rgba($alert-error, 0.1);
    color: $alert-error;
    transform: scale(1.05);
  }
}

/* Card Fields Body */
.card-body-fields {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.card-field-section {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &.border-top-dashed {
    border-top: 1.5px dashed rgba($primary-dark, 0.08);
    padding-top: 24px;
  }
}

.section-badge-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  font-weight: 800;
  color: $primary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;

  i {
    font-size: 0.85rem;
  }
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
      width: 200px;
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

/* Premium Inputs */
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

  &.prefix {
    padding-left: 0;
  }

  &.suffix {
    padding-right: 0;
  }

  .field-icon {
    font-size: 0.9rem;
    color: rgba($primary-dark, 0.3);
    margin-right: 8px;
    transition: color 0.2s;
  }

  &:focus-within .field-icon {
    color: $primary;
  }
}

.input-accent-symbol {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 14px 12px;
  background: rgba($primary-dark, 0.03);
  color: $text-secondary;
  font-weight: 800;
  font-size: 0.88rem;
  border-right: 1.5px solid rgba($primary-dark, 0.08);
  border-radius: 10px 0 0 10px;

  .suffix & {
    border-right: none;
    border-left: 1.5px solid rgba($primary-dark, 0.08);
    border-radius: 0 10px 10px 0;
  }
}

.premium-input {
  border: none;
  background: transparent;
  width: 100%;
  padding: 14px 0;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 700;
  color: $primary-dark;
  outline: none;

  &::placeholder {
    color: rgba($primary-dark, 0.25);
    font-weight: 500;
  }

  .prefix & {
    padding-left: 12px;
  }
  .suffix & {
    padding-right: 12px;
  }
}

.numeric-input {
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.date-input {
  cursor: pointer;
  
  &::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
    &:hover {
      opacity: 1;
    }
  }
}

.micro-hint {
  font-size: 0.68rem;
  color: $text-secondary;
  font-weight: 600;
  margin-top: 3px;
  opacity: 0.8;
  text-align: center;
  width: 100%;
}

/* Grids layout */
.fields-two-column-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media (min-width: 600px) {
    grid-template-columns: 1.2fr 1fr;
    gap: 24px;
  }
}

.fields-row-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media (min-width: 600px) {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
}

/* Add Button */
.add-equipment-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px;
  border-radius: 16px;
  background: rgba($primary, 0.04);
  color: $primary;
  border: 1.5px dashed rgba($primary, 0.25);
  font-weight: 800;
  font-size: 0.92rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  margin-top: 12px;

  .btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: rgba($primary, 0.08);
    transition: all 0.25s;
  }

  &:hover {
    background: $primary;
    color: white;
    border-color: $primary;
    box-shadow: 0 8px 24px rgba($primary, 0.15);
    transform: translateY(-1px);

    .btn-icon {
      background: rgba(white, 0.2);
      color: white;
    }
  }

  &:active {
    transform: translateY(0);
  }
}

/* Empty State */
.empty-state-equipment {
  text-align: center;
  padding: 40px 20px;
  background: rgba($primary-dark, 0.01);
  border: 1.5px dashed rgba($primary-dark, 0.08);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .empty-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba($primary-dark, 0.03);
    margin-bottom: 14px;
  }

  .empty-icon {
    font-size: 1.8rem;
    color: rgba($primary-dark, 0.2);
  }
  .empty-title {
    font-size: 1rem;
    font-weight: 800;
    color: $primary-dark;
    margin: 0;
  }
  .empty-desc {
    font-size: 0.82rem;
    color: $text-secondary;
    margin: 6px 0 0;
    max-width: 320px;
    line-height: 1.45;
  }
}

/* Card Animations */
.card-fade-enter-active,
.card-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.card-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.card-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.ob-skip-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 14px; margin-top: 8px;
  border-radius: 14px; background: transparent;
  border: 1.5px dashed rgba($primary-dark, 0.15); color: $text-secondary;
  font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: $primary; color: $primary; background: rgba($primary,0.03); }
}
.ob-skipped-banner {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px; margin-top: 12px;
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
