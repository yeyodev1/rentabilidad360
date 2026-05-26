<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

function addItem() {
  const updatedValue = JSON.parse(JSON.stringify(props.modelValue))
  if (!updatedValue.ingredients) updatedValue.ingredients = []
  updatedValue.ingredients.push({
    name: '',
    unitOfMeasure: 'unidad',
    costPrice: null,
    wastePercentage: null,
  })
  emit('update:modelValue', updatedValue)
}

function removeItem(i: string | number) {
  const updatedValue = JSON.parse(JSON.stringify(props.modelValue))
  updatedValue.ingredients.splice(Number(i), 1)
  emit('update:modelValue', updatedValue)
}

function updateItem(i: string | number, field: string, value: any) {
  const updatedValue = JSON.parse(JSON.stringify(props.modelValue))
  const idx = Number(i)
  if (updatedValue.ingredients[idx]) {
    updatedValue.ingredients[idx][field] = value
    emit('update:modelValue', updatedValue)
  }
}
</script>

<template>
  <div class="ob-ingredients-container">
    <!-- Step Helper Info Banner -->
    <div class="flow-helper-banner">
      <div class="banner-intro">
        <div class="banner-icon-wrapper">
          <i class="fa-solid fa-circle-info" />
        </div>
        <div class="banner-body">
          <h4 class="banner-title">Cálculo del costo real de tus ingredientes</h4>
          <p class="banner-text">
            Ingresa la materia prima y su costo de compra. La merma (desperdicios inevitables al cocinar) se calcula así:
          </p>
        </div>
      </div>

      <div class="banner-flow-steps">
        <!-- Insumo base -->
        <div class="flow-step">
          <div class="flow-step-icon">
            <i class="fa-solid fa-carrot" />
          </div>
          <div class="flow-step-info">
            <strong>Costo de Compra</strong>
            <span>Precio pagado por insumo</span>
          </div>
        </div>

        <div class="flow-step-connector">
          <i class="fa-solid fa-plus" />
        </div>

        <!-- Merma -->
        <div class="flow-step warning">
          <span class="step-badge warning">Porcentaje</span>
          <div class="flow-step-icon">
            <i class="fa-solid fa-trash-can" />
          </div>
          <div class="flow-step-info">
            <strong>Merma (Cáscaras/Huesos)</strong>
            <span>Si tienes dudas, pon 0% por ahora</span>
          </div>
        </div>

        <div class="flow-step-connector">
          <i class="fa-solid fa-arrow-right-long" />
        </div>

        <!-- Costo Real -->
        <div class="flow-step result">
          <span class="step-badge success">Resultado</span>
          <div class="flow-step-icon">
            <i class="fa-solid fa-scale-balanced" />
          </div>
          <div class="flow-step-info">
            <strong>Costo Real Neto</strong>
            <span>Base para tus márgenes</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Editor Box -->
    <div class="ob-ingredients-editor">
      <!-- Editor Top Bar Summary -->
      <div class="editor-top-bar">
        <div class="counter-badge">
          <i class="fa-solid fa-boxes-stacked" />
          <span>Ingredientes agregados: <strong>{{ modelValue.ingredients?.length || 0 }}</strong></span>
        </div>
        <button type="button" class="quick-add-top-btn" @click="addItem">
          <i class="fa-solid fa-plus" /> Agregar Insumo
        </button>
      </div>

      <!-- Ingredient Cards Grid -->
      <div class="ingredients-cards-grid">
        <TransitionGroup name="card-fade" tag="div" class="cards-list-wrapper">
          <div
            v-for="(ing, i) in modelValue.ingredients || []"
            :key="i"
            class="ingredient-premium-card"
            :class="{ 'is-complete': ing.name && ing.costPrice !== null }"
          >
            <!-- Card Header -->
            <div class="card-head">
              <div class="card-title-wrap">
                <span class="card-index-dot">#{{ Number(i) + 1 }}</span>
                <span class="card-label-txt">Ficha del Insumo</span>
              </div>

              <div class="card-actions-wrap">
                <span v-if="ing.name && ing.costPrice !== null" class="status-pill complete">
                  <i class="fa-solid fa-circle-check" /> Listo
                </span>
                <span v-else class="status-pill incomplete">
                  <i class="fa-solid fa-circle-minus" /> Pendiente
                </span>

                <button
                  type="button"
                  class="card-remove-btn"
                  title="Eliminar ingrediente"
                  @click="removeItem(i)"
                >
                  <i class="fa-solid fa-xmark" />
                </button>
              </div>
            </div>

            <!-- Card Body Fields -->
            <div class="card-body-fields">
              <!-- Name Input (Full Width) -->
              <div class="field-item full-width">
                <label class="field-label">Nombre del Ingrediente</label>
                <div class="premium-input-wrapper">
                  <i class="fa-solid fa-basket-shopping field-icon" />
                  <input
                    :value="ing.name"
                    placeholder="Ej: Tomate, Harina de Trigo, Pollo..."
                    type="text"
                    class="premium-input"
                    @input="updateItem(i, 'name', ($event.target as HTMLInputElement).value)"
                  />
                </div>
              </div>

              <!-- Mini Grid for Unit, Cost, Waste -->
              <div class="fields-row-grid">
                <!-- Unit of Measure -->
                <div class="field-item">
                  <label class="field-label">Unidad de Medida</label>
                  <div class="premium-input-wrapper">
                    <i class="fa-solid fa-scale-balanced field-icon" />
                    <select
                      :value="ing.unitOfMeasure"
                      class="premium-select"
                      @change="updateItem(i, 'unitOfMeasure', ($event.target as HTMLSelectElement).value)"
                    >
                      <option value="kg">Kilogramo (Kg)</option>
                      <option value="l">Litro (L)</option>
                      <option value="unidad">Unidad (U)</option>
                    </select>
                  </div>
                </div>

                <!-- Cost Price -->
                <div class="field-item">
                  <label class="field-label has-tooltip">
                    Costo Unitario
                    <span class="help-trigger" tabindex="0" data-tooltip="Lo que pagas por la unidad de medida elegida (ej. Costo por Kg)">
                      <i class="fa-solid fa-circle-question" />
                    </span>
                  </label>
                  <div class="premium-input-wrapper prefix">
                    <span class="input-accent-symbol">$</span>
                    <input
                      :value="ing.costPrice"
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      min="0"
                      class="premium-input numeric-input"
                      @input="updateItem(i, 'costPrice', ($event.target as HTMLInputElement).value === '' ? null : parseFloat(($event.target as HTMLInputElement).value))"
                    />
                  </div>
                </div>

                <!-- Waste Percentage -->
                <div class="field-item">
                  <label class="field-label has-tooltip">
                    Merma (%)
                    <span class="help-trigger" tabindex="0" data-tooltip="Parte no comestible o que se pierde en la preparación (ej: piel, huesos)">
                      <i class="fa-solid fa-circle-question" />
                    </span>
                  </label>
                  <div class="premium-input-wrapper suffix">
                    <input
                      :value="ing.wastePercentage"
                      placeholder="0"
                      type="number"
                      min="0"
                      max="100"
                      class="premium-input numeric-input"
                      @input="updateItem(i, 'wastePercentage', ($event.target as HTMLInputElement).value === '' ? null : parseFloat(($event.target as HTMLInputElement).value))"
                    />
                    <span class="input-accent-symbol">%</span>
                  </div>
                  <span class="micro-hint">¿No sabes? Pon 0%</span>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Empty State -->
      <div
        v-if="!modelValue.ingredients || modelValue.ingredients.length === 0"
        class="empty-state-ingredients"
      >
        <div class="empty-icon-wrap">
          <i class="fa-solid fa-carrot empty-icon" />
        </div>
        <p class="empty-title">Tu despensa está vacía</p>
        <p class="empty-desc">
          Agrega los insumos principales de tu cocina para poder asignarlos a tus recetas en el sistema.
        </p>
      </div>

      <!-- Add Button at the Bottom -->
      <button type="button" class="add-ingredient-btn" @click="addItem">
        <span class="btn-icon"><i class="fa-solid fa-plus" /></span>
        <span>Agregar nuevo ingrediente</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ob-ingredients-container {
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

/* Timeline Flow Steps */
.banner-flow-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  border-top: 1px dashed rgba($primary, 0.15);
  padding-top: 16px;

  @media (min-width: 650px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
}

.flow-step {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 1px solid rgba($primary-dark, 0.06);
  border-radius: 14px;
  padding: 10px 14px;
  flex: 1;
  position: relative;
  box-shadow: 0 2px 6px rgba($primary-dark, 0.01);
  transition: all 0.25s ease;

  &.warning {
    border-color: rgba($alert-warning, 0.3);
    background: rgba($alert-warning, 0.01);

    .flow-step-icon {
      background: $alert-warning;
      color: white;
    }
  }

  &.result {
    border-color: rgba($alert-success, 0.3);
    background: rgba($alert-success, 0.01);

    .flow-step-icon {
      background: $alert-success;
      color: white;
    }
  }
}

.step-badge {
  position: absolute;
  top: -8px;
  right: 12px;
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: 99px;
  background: rgba($primary, 0.1);
  color: $primary;

  &.warning {
    background: rgba($alert-warning, 0.1);
    color: $alert-warning;
  }

  &.success {
    background: rgba($alert-success, 0.1);
    color: $alert-success;
  }
}

.flow-step-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba($primary-dark, 0.05);
  color: $primary-dark;
  font-size: 0.9rem;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.flow-step-info {
  display: flex;
  flex-direction: column;
  gap: 1px;

  strong {
    font-size: 0.8rem;
    font-weight: 800;
    color: $primary-dark;
  }

  span {
    font-size: 0.72rem;
    color: $text-secondary;
  }
}

.flow-step-connector {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba($primary, 0.3);
  font-size: 1.1rem;

  @media (max-width: 649px) {
    transform: rotate(90deg);
    margin: -4px 0;
  }
}

/* Editor Container */
.ob-ingredients-editor {
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

/* Top bar with count & fast add button */
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

/* Ingredients Cards Grid */
.ingredients-cards-grid {
  width: 100%;
}
.cards-list-wrapper {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

/* High Fidelity Ingredient Card */
.ingredient-premium-card {
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
  gap: 16px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &.full-width {
    width: 100%;
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

.premium-input,
.premium-select {
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
}

.premium-input {
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

.premium-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'><path fill='%231e293b' d='M6 7L0 1l1.5-1L6 4.5 10.5 0 12 1z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 6px center;
  background-size: 10px 6px;
  padding-right: 24px;
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

/* Fields subgrid */
.fields-row-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 600px) {
    grid-template-columns: 1.2fr 1fr 1fr;
  }
}

/* Add Ingredient Button */
.add-ingredient-btn {
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
.empty-state-ingredients {
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
</style>
