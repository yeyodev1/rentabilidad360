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
      <div class="banner-icon-wrapper">
        <i class="fa-solid fa-scale-balanced" />
      </div>
      <div class="banner-body">
        <h4 class="banner-title">Asigna el costo de tus insumos</h4>
        <p class="banner-text">
          Ingresa los ingredientes base para tus platos. El porcentaje de **merma** representa la porción de ingrediente que se pierde al procesar o cocinar (ej: cáscaras, huesos), permitiendo calcular costos reales.
        </p>
      </div>
    </div>

    <!-- Main Editor Box -->
    <div class="ob-ingredients-editor">
      <div class="editor-header">
        <span class="header-col-name">Nombre del Ingrediente</span>
        <span class="header-col-unit">U. Medida</span>
        <span class="header-col-cost">Costo ($)</span>
        <span class="header-col-waste">Merma (%)</span>
        <span class="header-col-actions"></span>
      </div>

      <div class="ingredients-list">
        <TransitionGroup name="list" tag="div" class="list-wrapper">
          <div
            v-for="(ing, i) in modelValue.ingredients || []"
            :key="i"
            class="ingredient-card-row"
          >
            <!-- Ingredient Name -->
            <div class="input-container name-field">
              <label class="mobile-only-label">Nombre del Ingrediente</label>
              <div class="input-wrapper" :class="{ 'has-value': ing.name }">
                <i class="fa-solid fa-basket-shopping field-icon" />
                <input
                  :value="ing.name"
                  placeholder="Ej: Tomate, Harina, Pollo..."
                  type="text"
                  class="ingredient-input"
                  @input="updateItem(i, 'name', ($event.target as HTMLInputElement).value)"
                />
              </div>
            </div>

            <!-- Unit of Measure -->
            <div class="input-container unit-field">
              <label class="mobile-only-label">Unidad de Medida</label>
              <div class="input-wrapper" :class="{ 'has-value': ing.unitOfMeasure }">
                <i class="fa-solid fa-scale-balanced field-icon" />
                <select
                  :value="ing.unitOfMeasure"
                  class="ingredient-select"
                  @change="updateItem(i, 'unitOfMeasure', ($event.target as HTMLSelectElement).value)"
                >
                  <option value="kg">Kg</option>
                  <option value="l">L</option>
                  <option value="unidad">Unidad</option>
                </select>
              </div>
            </div>

            <!-- Cost Price -->
            <div class="input-container cost-field">
              <label class="mobile-only-label">Costo unitario ($)</label>
              <div class="input-wrapper" :class="{ 'has-value': ing.costPrice !== null && ing.costPrice !== '' }">
                <i class="fa-solid fa-dollar-sign field-icon" />
                <input
                  :value="ing.costPrice"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0"
                  class="ingredient-input cost-input"
                  @input="updateItem(i, 'costPrice', ($event.target as HTMLInputElement).value === '' ? null : parseFloat(($event.target as HTMLInputElement).value))"
                />
              </div>
            </div>

            <!-- Waste Percentage -->
            <div class="input-container waste-field">
              <label class="mobile-only-label">Merma (%)</label>
              <div class="input-wrapper" :class="{ 'has-value': ing.wastePercentage !== null && ing.wastePercentage !== '' }">
                <i class="fa-solid fa-percent field-icon" />
                <input
                  :value="ing.wastePercentage"
                  placeholder="0"
                  type="number"
                  min="0"
                  max="100"
                  class="ingredient-input waste-input"
                  @input="updateItem(i, 'wastePercentage', ($event.target as HTMLInputElement).value === '' ? null : parseFloat(($event.target as HTMLInputElement).value))"
                />
              </div>
            </div>

            <!-- Delete Action -->
            <div class="action-field">
              <button
                type="button"
                class="delete-btn"
                title="Eliminar ingrediente"
                @click="removeItem(i)"
              >
                <i class="fa-solid fa-trash-can" />
              </button>
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

      <!-- Add Button -->
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

/* Premium Info Banner */
.flow-helper-banner {
  display: flex;
  gap: 16px;
  background: linear-gradient(135deg, rgba($primary, 0.05) 0%, rgba($secondary, 0.03) 100%);
  border: 1.5px solid rgba($primary, 0.12);
  border-radius: 16px;
  padding: 16px;
  align-items: flex-start;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba($primary, 0.25);
    box-shadow: 0 4px 12px rgba($primary, 0.04);
  }
}
.banner-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: white;
  border: 1px solid rgba($primary, 0.15);
  color: $primary;
  font-size: 1.1rem;
  box-shadow: 0 4px 8px rgba($primary, 0.05);
  flex-shrink: 0;
}
.banner-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.banner-title {
  margin: 0;
  font-size: 0.92rem;
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
  }
}

/* Editor Panel */
.ob-ingredients-editor {
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

  @media (min-width: 650px) {
    display: flex;
    gap: 16px;
  }
}
.header-col-name {
  flex: 1;
}
.header-col-unit {
  width: 130px;
}
.header-col-cost {
  width: 120px;
}
.header-col-waste {
  width: 110px;
}
.header-col-actions {
  width: 44px;
}

.ingredients-list {
  display: flex;
  flex-direction: column;
}
.list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ingredient-card-row {
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

  @media (min-width: 650px) {
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

  @media (min-width: 650px) {
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
  padding: 0 12px;
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
    margin-right: 8px;
    transition: color 0.2s;
  }

  &:focus-within .field-icon {
    color: $primary;
  }
}

.name-field {
  flex: 1;
}

.unit-field {
  @media (min-width: 650px) {
    width: 130px;
  }
}

.cost-field {
  @media (min-width: 650px) {
    width: 120px;
  }
}

.waste-field {
  @media (min-width: 650px) {
    width: 110px;
  }
}

.ingredient-input,
.ingredient-select {
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

.ingredient-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'><path fill='%231e293b' d='M6 7L0 1l1.5-1L6 4.5 10.5 0 12 1z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 6px center;
  background-size: 10px 6px;
  padding-right: 24px;
}

.action-field {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;

  @media (min-width: 650px) {
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

  @media (min-width: 650px) {
    width: 40px;
    height: 40px;
  }
}

.add-ingredient-btn {
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
