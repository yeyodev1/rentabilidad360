<script setup lang="ts">
import { ref, computed } from 'vue'
import { costingService } from '@/services/costingService'

const emit = defineEmits<{
  (e: 'saved'): void
}>()

interface LocalIngredient {
  id: string
  name: string
  quantity: number
  unit: 'kg' | 'l' | 'unidad'
  unitCost: number
  isNew: boolean
}

const plateName = ref('')
const salePrice = ref(0)
const units = ['kg', 'l', 'unidad'] as const

const ingredients = ref<LocalIngredient[]>([
  { id: `i${Date.now()}`, name: '', quantity: 0, unit: 'kg', unitCost: 0, isNew: true }
])

const showHelp = ref(true)
const loading = ref(false)
const errorMsg = ref('')

function addIngredient() {
  ingredients.value.push({
    id: `i${Date.now()}`,
    name: '',
    quantity: 0,
    unit: 'kg',
    unitCost: 0,
    isNew: true
  })
}

function removeIngredient(id: string) {
  ingredients.value = ingredients.value.filter((i) => i.id !== id)
}

const totalVariableCost = computed(() =>
  ingredients.value.reduce((sum, i) => sum + (i.quantity || 0) * (i.unitCost || 0), 0),
)

const contributionMargin = computed(() => (salePrice.value || 0) - totalVariableCost.value)
const marginPct = computed(() => {
  if (!salePrice.value) return 0
  return (contributionMargin.value / salePrice.value) * 100
})

const marginLevel = computed<'green' | 'yellow' | 'red'>(() => {
  if (marginPct.value >= 60) return 'green' // Restaurantes deben apuntar a ~60-70% margen bruto
  if (marginPct.value >= 30) return 'yellow'
  return 'red'
})

const marginLabel = computed(() =>
  ({
    green: 'Margen Óptimo',
    yellow: 'Margen Ajustado',
    red: 'Pérdida / Crítico',
  })[marginLevel.value],
)

function fmtMoney(n: number) {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}
function fmtPct(n: number) {
  return `${n.toFixed(1)}%`
}

async function saveRecipe() {
  errorMsg.value = ''
  if (!plateName.value || !salePrice.value || ingredients.value.length === 0) {
    errorMsg.value = 'Completa el nombre, precio de venta y al menos un ingrediente.'
    return
  }

  loading.value = true
  try {
    // 1. Save new ingredients to get their real IDs
    const finalIngredients = []
    for (const ing of ingredients.value) {
      if (!ing.name) continue

      let realId = ing.id
      if (ing.isNew) {
        const res = await costingService.createIngredient({
          name: ing.name,
          unitOfMeasure: ing.unit,
          costPrice: ing.unitCost,
        })
        realId = (res.data as any)._id
      }
      finalIngredients.push({
        ingredientId: realId,
        quantity: ing.quantity
      })
    }

    if (finalIngredients.length === 0) {
      errorMsg.value = 'Debes tener al menos un ingrediente válido.'
      return
    }

    // 2. Save Recipe
    await costingService.createRecipe({
      name: plateName.value,
      sellingPrice: salePrice.value,
      ingredients: finalIngredients
    })

    // Reset form
    plateName.value = ''
    salePrice.value = 0
    ingredients.value = [{ id: `i${Date.now()}`, name: '', quantity: 0, unit: 'kg', unitCost: 0, isNew: true }]
    
    emit('saved')
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || 'Error guardando receta'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="card calc-card">
    <header class="card-head">
      <div class="card-title-group">
        <span class="card-chip"><i class="fa-solid fa-calculator" /> Constructor de Receta</span>
        <h3 class="card-title">Arma tu plato y calcula tu rentabilidad real</h3>
      </div>
      <button class="help-btn" @click="showHelp = !showHelp" :title="showHelp ? 'Ocultar guía' : 'Mostrar guía'">
        <i class="fa-solid fa-circle-question" />
      </button>
    </header>

    <transition name="fade">
      <div v-if="showHelp" class="edu-box">
        <h4><i class="fa-solid fa-lightbulb" /> ¿Cómo funciona el costeo?</h4>
        <p>El precio de venta no se inventa, se calcula. Debes registrar exactamente cuánto te cuesta cada ingrediente (<strong>Costo Variable Total</strong>). La diferencia entre tu precio de venta y ese costo es tu <strong>Margen de Contribución</strong>, el dinero real que te queda para pagar alquiler, sueldos y tener ganancias.</p>
      </div>
    </transition>

    <div class="field-grid">
      <div class="field">
        <label class="field-lbl"><i class="fa-solid fa-utensils" /> Nombre del plato</label>
        <input v-model="plateName" type="text" placeholder="Ej. Hamburguesa Clásica" />
      </div>
      <div class="field">
        <label class="field-lbl">
          <i class="fa-solid fa-coins" /> Precio de Venta al Público (PVP)
          <span class="hint-icon" title="El precio final al que se lo cobras al cliente en el menú."><i class="fa-solid fa-circle-info"/></span>
        </label>
        <div class="money-input">
          <span>$</span>
          <input v-model.number="salePrice" type="number" min="0" step="0.05" placeholder="Ej: 12.50" />
        </div>
      </div>
    </div>

    <div class="ing-section">
      <div class="ing-head">
        <span>Ingrediente</span>
        <span>Cantidad en plato</span>
        <span>Unidad</span>
        <span>Costo de 1 Unidad ($) <span class="hint-icon" title="Ej: Si la unidad es Kg, ¿cuánto te cuesta 1 Kg entero de este ingrediente?"><i class="fa-solid fa-circle-info"/></span></span>
        <span class="ing-head-actions"></span>
      </div>

      <ul class="ing-list">
        <li v-for="ing in ingredients" :key="ing.id" class="ing-row">
          <input v-model="ing.name" class="ing-input" type="text" placeholder="Nombre (Ej: Carne molida)" />
          <input v-model.number="ing.quantity" class="ing-input num" type="number" min="0" step="0.01" placeholder="Ej: 0.15" />
          <select v-model="ing.unit" class="ing-input select">
            <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
          </select>
          <div class="money-input small">
            <span>$</span>
            <input v-model.number="ing.unitCost" type="number" min="0" step="0.001" placeholder="Ej: 8.50" />
          </div>
          <button class="row-del" type="button" @click="removeIngredient(ing.id)" aria-label="Quitar">
            <i class="fa-solid fa-trash" />
          </button>
        </li>
      </ul>

      <button class="add-ing" type="button" @click="addIngredient">
        <i class="fa-solid fa-plus" /> Agregar Ingrediente
      </button>
    </div>

    <div class="kpi-row">
      <div class="kpi">
        <span class="kpi-lbl">Costo Variable Total <span class="hint-icon" title="Lo que te cuesta armar este plato con todos sus ingredientes."><i class="fa-solid fa-circle-info"/></span></span>
        <strong class="kpi-val">{{ fmtMoney(totalVariableCost) }}</strong>
      </div>
      <div class="kpi">
        <span class="kpi-lbl">Margen de Contribución <span class="hint-icon" title="Dinero bruto que ganas por plato vendido (PVP - Costo Variable)."><i class="fa-solid fa-circle-info"/></span></span>
        <strong class="kpi-val">{{ fmtMoney(contributionMargin) }}</strong>
      </div>
      <div class="kpi highlight">
        <span class="kpi-lbl">Margen % <span class="hint-icon" title="Porcentaje de ganancia bruta. Un restaurante sano apunta a +60%."><i class="fa-solid fa-circle-info"/></span></span>
        <div class="margin-wrap">
          <strong :class="['kpi-val', marginLevel]">{{ fmtPct(marginPct) }}</strong>
          <span :class="['margin-chip', marginLevel]">{{ marginLabel }}</span>
        </div>
      </div>
    </div>

    <div v-if="errorMsg" class="error-msg">
      <i class="fa-solid fa-triangle-exclamation" /> {{ errorMsg }}
    </div>

    <button class="primary-btn" type="button" @click="saveRecipe" :disabled="loading">
      <i class="fa-solid fa-floppy-disk" /> {{ loading ? 'Guardando...' : 'Guardar e Integrar Receta' }}
    </button>
  </section>
</template>

<style scoped lang="scss">
.card {
  background: white;
  border: 1px solid rgba($primary-dark, 0.08);
  box-shadow: 0 12px 36px rgba($primary-dark, 0.04);
  border-radius: 24px; padding: 24px;
}
.card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.card-title-group { display: flex; flex-direction: column; gap: 8px; }
.card-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba($primary, 0.08); color: $primary;
  padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.5px; align-self: flex-start;
}
.card-title { margin: 0; font-size: 1.3rem; font-weight: 800; color: $primary-dark; letter-spacing: -0.3px; }
.help-btn { background: transparent; border: none; font-size: 1.2rem; color: rgba($primary, 0.6); cursor: pointer; transition: color 0.2s; &:hover { color: $primary; } }

.edu-box {
  background: linear-gradient(135deg, rgba($secondary, 0.15), rgba($secondary, 0.02));
  border: 1px solid rgba($secondary, 0.3);
  padding: 16px 20px; border-radius: 16px; margin-bottom: 24px;
  h4 { margin: 0 0 8px; color: $primary-dark; font-size: 0.95rem; display: flex; align-items: center; gap: 8px; i { color: $secondary; } }
  p { margin: 0; font-size: 0.85rem; color: $primary-dark; line-height: 1.5; strong { font-weight: 700; color: $primary; } }
}

.hint-icon { color: rgba($primary-dark, 0.4); font-size: 0.7rem; margin-left: 4px; cursor: help; }

.field-grid { display: grid; gap: 16px; grid-template-columns: 1fr; @media (min-width: 600px) { grid-template-columns: 1.4fr 1fr; } margin-bottom: 24px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field-lbl {
  font-size: 0.75rem; font-weight: 800; color: $primary-dark;
  text-transform: uppercase; letter-spacing: 0.4px; display: inline-flex; align-items: center; gap: 6px;
  i { color: $primary; }
}
.field input {
  padding: 12px 16px; border-radius: 12px; border: 1.5px solid rgba($primary-dark, 0.1);
  font-family: $font-principal; font-size: 0.95rem; color: $primary-dark; background: #f8fafc;
  &:focus { outline: none; border-color: $primary; background: white; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
}
.money-input {
  display: grid; grid-template-columns: 32px 1fr; align-items: center;
  border: 1.5px solid rgba($primary-dark, 0.1); border-radius: 12px; background: #f8fafc; overflow: hidden;
  &:focus-within { border-color: $primary; background: white; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
  span { text-align: center; font-weight: 800; color: $primary; font-size: 0.95rem; }
  input { border: none; background: transparent; padding: 12px 12px 12px 0; font-family: $font-principal; font-size: 0.95rem; color: $primary-dark; &:focus { outline: none; } }
  &.small { grid-template-columns: 24px 1fr; span { font-size: 0.85rem; } input { padding: 10px 8px 10px 0; font-size: 0.85rem; } }
}

.ing-section { background: rgba($primary-dark, 0.02); padding: 20px; border-radius: 20px; border: 1px dashed rgba($primary-dark, 0.1); margin-bottom: 24px; }
.ing-head { display: grid; gap: 10px; grid-template-columns: 1.5fr 1fr 0.8fr 1.2fr 40px; margin-bottom: 12px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: $text-secondary; }
.ing-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.ing-row { display: grid; gap: 10px; grid-template-columns: 1.5fr 1fr 0.8fr 1.2fr 40px; align-items: center; background: white; padding: 10px; border-radius: 16px; border: 1px solid rgba($primary-dark, 0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.ing-input { padding: 10px 12px; border-radius: 10px; border: 1px solid rgba($primary-dark, 0.1); font-family: $font-principal; font-size: 0.85rem; width: 100%; background: #f8fafc; &:focus { outline: none; border-color: $primary; background: white; } }
.row-del { width: 40px; height: 40px; border-radius: 10px; border: none; background: rgba($alert-error, 0.1); color: $alert-error; cursor: pointer; transition: all 0.2s; &:hover { background: $alert-error; color: white; transform: scale(1.05); } }
.add-ing { margin-top: 16px; background: white; border: 1.5px dashed rgba($primary, 0.4); color: $primary; font-weight: 800; font-size: 0.85rem; padding: 12px 20px; border-radius: 14px; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; &:hover { background: rgba($primary, 0.05); border-color: $primary; } }

.kpi-row { display: grid; gap: 16px; grid-template-columns: repeat(3, 1fr); margin-bottom: 24px; }
.kpi { background: #f8fafc; border: 1px solid rgba($primary-dark, 0.06); padding: 16px; border-radius: 16px; display: flex; flex-direction: column; gap: 8px; }
.kpi.highlight { background: linear-gradient(135deg, rgba($primary, 0.04), white); border-color: rgba($primary, 0.2); }
.kpi-lbl { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: $text-secondary; }
.kpi-val { font-size: 1.4rem; font-weight: 800; color: $primary-dark; }
.kpi-val.green { color: $alert-success; }
.kpi-val.yellow { color: $alert-warning; }
.kpi-val.red { color: $alert-error; }
.margin-wrap { display: flex; align-items: center; gap: 12px; }
.margin-chip { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; &.green { background: rgba($alert-success, 0.15); color: darken($alert-success, 10%); } &.yellow { background: rgba($alert-warning, 0.15); color: darken($alert-warning, 15%); } &.red { background: rgba($alert-error, 0.15); color: $alert-error; } }

.error-msg { background: rgba($alert-error, 0.1); color: $alert-error; padding: 12px 16px; border-radius: 12px; font-size: 0.85rem; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }

.primary-btn { width: 100%; padding: 18px; border-radius: 16px; border: none; background: linear-gradient(135deg, $primary, $secondary); color: white; font-family: $font-principal; font-size: 1rem; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 24px rgba($primary, 0.3); &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba($primary, 0.4); } &:disabled { opacity: 0.7; cursor: not-allowed; } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
