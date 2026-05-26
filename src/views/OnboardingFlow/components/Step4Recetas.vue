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
  if (!updatedValue.recipes) updatedValue.recipes = []
  updatedValue.recipes.push({ name: '', sellingPrice: null })
  emit('update:modelValue', updatedValue)
}

function removeItem(i: string | number) {
  const updatedValue = JSON.parse(JSON.stringify(props.modelValue))
  updatedValue.recipes.splice(Number(i), 1)
  emit('update:modelValue', updatedValue)
}

function updateItem(i: string | number, field: string, value: any) {
  const updatedValue = JSON.parse(JSON.stringify(props.modelValue))
  const idx = Number(i)
  if (updatedValue.recipes[idx]) {
    updatedValue.recipes[idx][field] = value
    emit('update:modelValue', updatedValue)
  }
}
</script>

<template>
  <div class="ob-recipes-container">
    <!-- Step Helper Info Banner -->
    <div class="flow-helper-banner">
      <div class="banner-intro">
        <div class="banner-icon-wrapper">
          <i class="fa-solid fa-circle-info" />
        </div>
        <div class="banner-body">
          <h4 class="banner-title">¿Cómo se conecta tu información?</h4>
          <p class="banner-text">
            Configura tus platos actuales en este paso. La rentabilidad se calculará de la siguiente manera:
          </p>
        </div>
      </div>

      <div class="banner-flow-steps">
        <!-- Step 4 -->
        <div class="flow-step active">
          <span class="step-badge">Paso 4 (Actual)</span>
          <div class="flow-step-icon">
            <i class="fa-solid fa-utensils" />
          </div>
          <div class="flow-step-info">
            <strong>Platos y PVP</strong>
            <span>Menú y precio público</span>
          </div>
        </div>

        <div class="flow-step-connector">
          <i class="fa-solid fa-circle-chevron-right" />
        </div>

        <!-- Step 5 -->
        <div class="flow-step">
          <span class="step-badge next">Paso 5</span>
          <div class="flow-step-icon">
            <i class="fa-solid fa-basket-shopping" />
          </div>
          <div class="flow-step-info">
            <strong>Ingredientes</strong>
            <span>Costos y porcentaje merma</span>
          </div>
        </div>

        <div class="flow-step-connector">
          <i class="fa-solid fa-circle-chevron-right" />
        </div>

        <!-- Result -->
        <div class="flow-step result">
          <span class="step-badge success">Resultado</span>
          <div class="flow-step-icon">
            <i class="fa-solid fa-chart-pie" />
          </div>
          <div class="flow-step-info">
            <strong>Márgenes Reales</strong>
            <span>Cálculo automatizado</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Editor Box -->
    <div class="ob-recipes-editor">
      <div class="editor-header">
        <span class="header-col-name">Nombre del Plato / Receta</span>
        <span class="header-col-price">Precio de Venta Público (PVP)</span>
        <span class="header-col-actions"></span>
      </div>

      <div class="recipes-list">
        <TransitionGroup name="list" tag="div" class="list-wrapper">
          <div v-for="(r, i) in (modelValue.recipes || [])" :key="i" class="recipe-card-row">
            <!-- Recipe Name Input Field -->
            <div class="input-container name-field">
              <label class="mobile-only-label">Nombre del Plato</label>
              <div class="input-wrapper" :class="{ 'has-value': r.name }">
                <i class="fa-solid fa-bowl-food field-icon" />
                <input
                  :value="r.name"
                  placeholder="Ej: Ceviche de Pescado, Lomo Saltado..."
                  type="text"
                  class="recipe-input"
                  @input="updateItem(i, 'name', ($event.target as HTMLInputElement).value)"
                />
              </div>
            </div>

            <!-- Recipe Price Input Field -->
            <div class="input-container price-field">
              <label class="mobile-only-label">PVP (Precio de Venta)</label>
              <div class="input-wrapper" :class="{ 'has-value': r.sellingPrice !== null && r.sellingPrice !== '' }">
                <i class="fa-solid fa-dollar-sign field-icon" />
                <input
                  :value="r.sellingPrice"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0"
                  class="recipe-input price-input"
                  @input="updateItem(i, 'sellingPrice', ($event.target as HTMLInputElement).value === '' ? null : parseFloat(($event.target as HTMLInputElement).value))"
                />
              </div>
            </div>

            <!-- Delete Action -->
            <div class="action-field">
              <button type="button" class="delete-btn" title="Eliminar plato" @click="removeItem(i)">
                <i class="fa-solid fa-trash-can" />
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Empty State if no recipes -->
      <div v-if="!modelValue.recipes || modelValue.recipes.length === 0" class="empty-state-recipes">
        <div class="empty-icon-wrap">
          <i class="fa-solid fa-utensils empty-icon" />
        </div>
        <p class="empty-title">Tu menú está vacío</p>
        <p class="empty-desc">
          Agrega los platos principales de tu negocio para poder calcular sus márgenes en los siguientes pasos.
        </p>
      </div>

      <!-- Add Button -->
      <button type="button" class="add-recipe-btn" @click="addItem">
        <span class="btn-icon"><i class="fa-solid fa-plus" /></span>
        <span>Agregar nuevo plato al menú</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ob-recipes-container {
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

  &.active {
    border-color: $primary;
    background: rgba($primary, 0.01);
    box-shadow: 0 4px 12px rgba($primary, 0.05);

    .flow-step-icon {
      background: $primary;
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

  &.next {
    background: rgba($primary-dark, 0.06);
    color: $text-secondary;
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

/* Editor Panel */
.ob-recipes-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba($primary-dark, 0.02);

  @media (min-width: 600px) {
    padding: 24px;
  }
}

.editor-header {
  display: none;
  font-size: 0.75rem;
  font-weight: 800;
  color: $primary-dark;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba($primary-dark, 0.06);
  opacity: 0.8;

  @media (min-width: 600px) {
    display: flex;
    gap: 16px;
  }
}
.header-col-name {
  flex: 1;
}
.header-col-price {
  width: 160px;
}
.header-col-actions {
  width: 44px;
}

.recipes-list {
  display: flex;
  flex-direction: column;
}
.list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recipe-card-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba($primary-dark, 0.015);
  border: 1px solid rgba($primary-dark, 0.06);
  padding: 16px;
  border-radius: 16px;
  position: relative;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    border-color: rgba($primary, 0.25);
    background: rgba($primary, 0.01);
    box-shadow: 0 4px 16px rgba($primary, 0.04);
  }

  @media (min-width: 600px) {
    flex-direction: row;
    align-items: center;
    background: transparent;
    border: none;
    padding: 0;
    gap: 16px;

    &:hover {
      background: transparent;
      box-shadow: none;
    }
  }
}

.input-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mobile-only-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: $primary-dark;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;

  @media (min-width: 600px) {
    display: none;
  }
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #fafbfc;
  border: 1.5px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  padding: 0 14px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:focus-within {
    border-color: $primary;
    background: white;
    box-shadow: 0 0 0 4px rgba($primary, 0.08);
  }

  &.has-value {
    background: white;
    border-color: rgba($primary-dark, 0.15);
  }

  .field-icon {
    font-size: 0.9rem;
    color: rgba($primary-dark, 0.3);
    margin-right: 10px;
    transition: color 0.2s;
  }

  &:focus-within .field-icon {
    color: $primary;
  }
}

.name-field {
  flex: 1;
}

.price-field {
  @media (min-width: 600px) {
    width: 160px;
  }
}

.recipe-input {
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

.price-input {
  font-variant-numeric: tabular-nums;
}

.action-field {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;

  @media (min-width: 600px) {
    margin-top: 0;
    width: 44px;
    justify-content: center;
  }
}

.delete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: none;
  background: rgba($alert-error, 0.06);
  color: $alert-error;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: $alert-error;
    color: white;
    box-shadow: 0 4px 12px rgba($alert-error, 0.2);
    transform: scale(1.03);
  }

  &:active {
    transform: scale(0.97);
  }

  @media (min-width: 600px) {
    width: 40px;
    height: 40px;
  }
}

.add-recipe-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px;
  border-radius: 14px;
  background: rgba($primary, 0.04);
  color: $primary;
  border: 1.5px dashed rgba($primary, 0.25);
  font-weight: 800;
  font-size: 0.92rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  margin-top: 8px;

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
.empty-state-recipes {
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

/* Transition Animations */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.list-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
