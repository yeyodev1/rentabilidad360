<script setup lang="ts">
import { ref } from 'vue'
import { costingService } from '@/services/costingService'

const props = defineProps<{
  modelValue: Record<string, any>
  businessStage?: 'project' | 'existing' | null
}>()

const emit = defineEmits(['update:modelValue'])

const suggestions = ref<Record<number, { min: number; max: number; monthlyUnitsTarget: number | null } | null>>({})
const estimating = ref<Record<number, boolean>>({})
let debounceTimers: Record<number, ReturnType<typeof setTimeout>> = {}

function addItem() {
  const updatedValue = JSON.parse(JSON.stringify(props.modelValue))
  if (!updatedValue.recipes) updatedValue.recipes = []
  updatedValue.recipes.push({ name: '', productionCost: null, currentSellingPrice: null })
  emit('update:modelValue', updatedValue)
}

function skipStep() {
  const updatedValue = JSON.parse(JSON.stringify(props.modelValue))
  updatedValue.skipped = true
  emit('update:modelValue', updatedValue)
}

function undoSkip() {
  const updatedValue = JSON.parse(JSON.stringify(props.modelValue))
  updatedValue.skipped = false
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
    if (field === 'productionCost') scheduleEstimate(idx, value)
  }
}

function scheduleEstimate(idx: number, cost: number | null) {
  if (debounceTimers[idx]) clearTimeout(debounceTimers[idx])
  if (cost == null || cost <= 0) {
    suggestions.value = { ...suggestions.value, [idx]: null }
    return
  }
  debounceTimers[idx] = setTimeout(async () => {
    estimating.value = { ...estimating.value, [idx]: true }
    try {
      const res = await costingService.estimatePrice(cost)
      const s: any = res.data
      suggestions.value = {
        ...suggestions.value,
        [idx]: { min: s.suggestedMinPrice, max: s.suggestedMaxPrice, monthlyUnitsTarget: s.monthlyUnitsTarget },
      }
    } catch {
      suggestions.value = { ...suggestions.value, [idx]: null }
    } finally {
      estimating.value = { ...estimating.value, [idx]: false }
    }
  }, 500)
}

function fmtMoney(n: number) {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}

function isEstimating(i: string | number): boolean {
  return !!estimating.value[Number(i)]
}
function getSuggestion(i: string | number) {
  return suggestions.value[Number(i)] || null
}
</script>

<template>
  <div class="ob-recipes-container">
    <p class="ob-hint-line">
      <i class="fa-solid fa-circle-info" />
      Escribe el costo y te damos el precio sugerido, meta de venta y vigencia.
      <template v-if="businessStage === 'existing'">Agrega tu precio actual para comparar.</template>
    </p>

    <!-- Main Editor Box -->
    <div class="ob-recipes-editor">
      <div class="recipes-list">
        <TransitionGroup name="list" tag="div" class="list-wrapper">
          <div v-for="(r, i) in (modelValue.recipes || [])" :key="i" class="recipe-card-row">
            <div class="recipe-inputs">
              <div class="input-container name-field">
                <label class="mobile-only-label">Nombre del plato</label>
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

              <div class="input-container price-field">
                <label class="mobile-only-label">Costo de producción</label>
                <div class="input-wrapper" :class="{ 'has-value': r.productionCost !== null && r.productionCost !== '' }">
                  <i class="fa-solid fa-dollar-sign field-icon" />
                  <input
                    :value="r.productionCost"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    min="0"
                    class="recipe-input price-input"
                    @input="updateItem(i, 'productionCost', ($event.target as HTMLInputElement).value === '' ? null : parseFloat(($event.target as HTMLInputElement).value))"
                  />
                </div>
              </div>

              <div v-if="businessStage === 'existing'" class="input-container price-field">
                <label class="mobile-only-label">Tu precio actual</label>
                <div class="input-wrapper" :class="{ 'has-value': r.currentSellingPrice }">
                  <i class="fa-solid fa-tag field-icon" />
                  <input
                    :value="r.currentSellingPrice"
                    placeholder="Opcional"
                    type="number"
                    step="0.01"
                    min="0"
                    class="recipe-input price-input"
                    @input="updateItem(i, 'currentSellingPrice', ($event.target as HTMLInputElement).value === '' ? null : parseFloat(($event.target as HTMLInputElement).value))"
                  />
                </div>
              </div>

              <div class="action-field">
                <button type="button" class="delete-btn" title="Eliminar plato" @click="removeItem(i)">
                  <i class="fa-solid fa-trash-can" />
                </button>
              </div>
            </div>

            <!-- Live suggestion preview -->
            <div v-if="isEstimating(i)" class="suggestion-box loading">
              <i class="fa-solid fa-spinner fa-spin" /> Calculando precio sugerido…
            </div>
            <div v-else-if="getSuggestion(i)" class="suggestion-box">
              <div class="sugg-item">
                <span class="sugg-lbl">Precio sugerido</span>
                <strong class="sugg-val">{{ fmtMoney(getSuggestion(i)!.min) }} – {{ fmtMoney(getSuggestion(i)!.max) }}</strong>
              </div>
              <div class="sugg-item" v-if="getSuggestion(i)!.monthlyUnitsTarget">
                <span class="sugg-lbl">Vende al mes</span>
                <strong class="sugg-val">{{ getSuggestion(i)!.monthlyUnitsTarget }} und.</strong>
              </div>
              <div class="sugg-item">
                <span class="sugg-lbl">Vigencia</span>
                <strong class="sugg-val">30 días</strong>
              </div>
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
          Agrega los platos principales de tu negocio para conocer su precio ideal de venta.
        </p>
      </div>

      <!-- Add Button -->
      <button type="button" class="add-recipe-btn" @click="addItem">
        <span class="btn-icon"><i class="fa-solid fa-plus" /></span>
        <span>Agregar nuevo plato al menú</span>
      </button>

      <button v-if="!modelValue.skipped" class="ob-skip-btn" @click="skipStep">
        <i class="fa-regular fa-circle-xmark" /> No tengo platos ahora, los agregaré después
      </button>
      <div v-else class="ob-skipped-banner">
        <i class="fa-solid fa-forward-step" />
        <span>Omitiste los platos del menú. Puedes agregarlos después desde Costeo.</span>
        <button class="ob-undo-btn" @click="undoSkip">Agregar ahora</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ob-recipes-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.ob-hint-line {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  margin: 0; font-size: 0.82rem; color: $text-secondary;
  i { color: $primary; }
}

.ob-recipes-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recipes-list { display: flex; flex-direction: column; }
.list-wrapper { display: flex; flex-direction: column; gap: 12px; }

.recipe-card-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba($primary-dark, 0.015);
  border: 1px solid rgba($primary-dark, 0.06);
  padding: 16px;
  border-radius: 16px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover { border-color: rgba($primary, 0.25); background: rgba($primary, 0.01); }
}

.recipe-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 700px) {
    flex-direction: row;
    align-items: center;
  }
}

.input-container { display: flex; flex-direction: column; gap: 6px; }
.mobile-only-label { font-size: 0.75rem; font-weight: 800; color: $primary-dark; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; }

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #fafbfc;
  border: 1.5px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  padding: 0 14px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:focus-within { border-color: $primary; background: white; box-shadow: 0 0 0 4px rgba($primary, 0.08); }
  &.has-value { background: white; border-color: rgba($primary-dark, 0.15); }

  .field-icon { font-size: 0.9rem; color: rgba($primary-dark, 0.3); margin-right: 10px; }
  &:focus-within .field-icon { color: $primary; }
}

.name-field { flex: 1.4; }
.price-field { flex: 1; @media (min-width: 700px) { max-width: 160px; } }

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
  &::placeholder { color: rgba($primary-dark, 0.25); font-weight: 500; }
}

.action-field { display: flex; justify-content: flex-end; }

.delete-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border: none;
  background: rgba($alert-error, 0.06); color: $alert-error; border-radius: 12px; cursor: pointer;
  transition: all 0.2s;
  &:hover { background: $alert-error; color: white; }
}

/* Suggestion box */
.suggestion-box {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px 16px;
  background: rgba($alert-success, 0.06);
  border: 1px solid rgba($alert-success, 0.2);
  border-radius: 12px;

  &.loading {
    color: $text-secondary;
    font-size: 0.82rem;
    align-items: center;
    background: rgba($primary-dark, 0.03);
    border-color: rgba($primary-dark, 0.08);
  }
}
.sugg-item { display: flex; flex-direction: column; gap: 2px; }
.sugg-lbl { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: $text-secondary; }
.sugg-val { font-size: 0.92rem; font-weight: 800; color: darken($alert-success, 12%); }

.add-recipe-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  padding: 14px; border-radius: 14px;
  background: rgba($primary, 0.04); color: $primary;
  border: 1.5px dashed rgba($primary, 0.25);
  font-weight: 800; font-size: 0.92rem; cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  margin-top: 8px;

  .btn-icon { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 6px; background: rgba($primary, 0.08); }
  &:hover { background: $primary; color: white; border-color: $primary; .btn-icon { background: rgba(white, 0.2); color: white; } }
}

.empty-state-recipes {
  text-align: center;
  padding: 40px 20px;
  background: rgba($primary-dark, 0.01);
  border: 1.5px dashed rgba($primary-dark, 0.08);
  border-radius: 18px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;

  .empty-icon-wrap { display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; border-radius: 50%; background: rgba($primary-dark, 0.03); margin-bottom: 14px; }
  .empty-icon { font-size: 1.8rem; color: rgba($primary-dark, 0.2); }
  .empty-title { font-size: 1rem; font-weight: 800; color: $primary-dark; margin: 0; }
  .empty-desc { font-size: 0.82rem; color: $text-secondary; margin: 6px 0 0; max-width: 320px; line-height: 1.45; }
}

.list-enter-active, .list-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.list-enter-from { opacity: 0; transform: translateY(16px); }
.list-leave-to { opacity: 0; transform: scale(0.95); }

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
