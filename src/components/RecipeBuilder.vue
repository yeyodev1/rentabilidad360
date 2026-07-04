<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { costingService } from '@/services/costingService'

const emit = defineEmits<{
  (e: 'saved'): void
}>()

const plateName = ref('')
const productionCost = ref<number | null>(null)
const currentSellingPrice = ref<number | null>(null)

const loading = ref(false)
const estimating = ref(false)
const errorMsg = ref('')
const suggestion = ref<{ min: number; max: number; monthlyUnitsTarget: number | null; validityDays: number } | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(productionCost, (cost) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!cost || cost <= 0) {
    suggestion.value = null
    return
  }
  debounceTimer = setTimeout(async () => {
    estimating.value = true
    try {
      const res = await costingService.estimatePrice(cost)
      const s: any = res.data
      suggestion.value = { min: s.suggestedMinPrice, max: s.suggestedMaxPrice, monthlyUnitsTarget: s.monthlyUnitsTarget, validityDays: s.validityDays }
    } catch {
      suggestion.value = null
    } finally {
      estimating.value = false
    }
  }, 450)
})

const marginPct = computed(() => {
  if (!productionCost.value || !currentSellingPrice.value) return null
  return ((currentSellingPrice.value - productionCost.value) / currentSellingPrice.value) * 100
})

const marginLevel = computed<'green' | 'yellow' | 'red' | null>(() => {
  if (marginPct.value == null) return null
  if (marginPct.value >= 60) return 'green'
  if (marginPct.value >= 30) return 'yellow'
  return 'red'
})

function fmtMoney(n: number) {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}
function fmtPct(n: number) {
  return `${n.toFixed(1)}%`
}

async function saveRecipe() {
  errorMsg.value = ''
  if (!plateName.value || productionCost.value == null || productionCost.value <= 0) {
    errorMsg.value = 'Completa el nombre del plato y su costo de producción.'
    return
  }

  loading.value = true
  try {
    await costingService.createRecipe({
      name: plateName.value,
      productionCost: productionCost.value,
      sellingPrice: currentSellingPrice.value ?? undefined,
      ingredients: [],
    })

    plateName.value = ''
    productionCost.value = null
    currentSellingPrice.value = null
    suggestion.value = null

    emit('saved')
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || err?.message || 'Error guardando el plato'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="card calc-card">
    <header class="card-head">
      <div class="card-title-group">
        <span class="card-chip"><i class="fa-solid fa-calculator" /> Nuevo Plato</span>
        <h3 class="card-title">Cuánto cuesta y a cuánto venderlo</h3>
      </div>
    </header>

    <div class="edu-box">
      <p><i class="fa-solid fa-lightbulb" /> Escribe el <strong>costo de producción</strong> de tu plato y te damos un rango de precio sugerido, cuánto necesitas vender al mes y por cuánto tiempo ese precio debería mantenerse.</p>
    </div>

    <div class="field-grid">
      <div class="field">
        <label class="field-lbl"><i class="fa-solid fa-utensils" /> Nombre del plato</label>
        <input v-model="plateName" type="text" placeholder="Ej. Hamburguesa Clásica" />
      </div>
      <div class="field">
        <label class="field-lbl"><i class="fa-solid fa-coins" /> Costo de producción</label>
        <div class="money-input">
          <span>$</span>
          <input v-model.number="productionCost" type="number" min="0" step="0.01" placeholder="Ej: 3.50" />
        </div>
      </div>
      <div class="field">
        <label class="field-lbl">
          <i class="fa-solid fa-tag" /> Tu precio actual (opcional)
          <span class="hint-icon" title="Si ya vendes este plato, ingresa tu precio actual para comparar con el sugerido."><i class="fa-solid fa-circle-info"/></span>
        </label>
        <div class="money-input">
          <span>$</span>
          <input v-model.number="currentSellingPrice" type="number" min="0" step="0.05" placeholder="Ej: 8.00" />
        </div>
      </div>
    </div>

    <div v-if="estimating" class="suggestion-panel loading">
      <i class="fa-solid fa-spinner fa-spin" /> Calculando precio sugerido…
    </div>
    <div v-else-if="suggestion" class="suggestion-panel">
      <div class="kpi">
        <span class="kpi-lbl">Precio sugerido</span>
        <strong class="kpi-val">{{ fmtMoney(suggestion.min) }} – {{ fmtMoney(suggestion.max) }}</strong>
      </div>
      <div class="kpi" v-if="suggestion.monthlyUnitsTarget">
        <span class="kpi-lbl">Vende al mes</span>
        <strong class="kpi-val">{{ suggestion.monthlyUnitsTarget }} unidades</strong>
      </div>
      <div class="kpi">
        <span class="kpi-lbl">Vigencia del precio</span>
        <strong class="kpi-val">{{ suggestion.validityDays }} días</strong>
      </div>
      <div class="kpi highlight" v-if="marginLevel">
        <span class="kpi-lbl">Tu margen actual</span>
        <div class="margin-wrap">
          <strong :class="['kpi-val', marginLevel]">{{ fmtPct(marginPct!) }}</strong>
        </div>
      </div>
    </div>

    <div v-if="errorMsg" class="error-msg">
      <i class="fa-solid fa-triangle-exclamation" /> {{ errorMsg }}
    </div>

    <button class="primary-btn" type="button" @click="saveRecipe" :disabled="loading">
      <i class="fa-solid fa-floppy-disk" /> {{ loading ? 'Guardando...' : 'Guardar plato' }}
    </button>
  </section>
</template>

<style scoped lang="scss">
.card {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 92% 12%, rgba($accent, 0.18), transparent 26%),
    linear-gradient(135deg, white, rgba($bg, 0.82));
  border: 1px solid rgba($primary-dark, 0.08);
  box-shadow: 0 24px 58px rgba($primary-dark, 0.08);
  border-radius: 28px;
  padding: 24px;
  margin: 0 16px;
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

.edu-box {
  background: rgba(white, 0.75);
  border: 1px solid rgba($primary, 0.13);
  padding: 14px 18px; border-radius: 18px; margin-bottom: 20px;
  box-shadow: inset 0 1px 0 rgba(white, 0.7);
  p { margin: 0; font-size: 0.85rem; color: $primary-dark; line-height: 1.5; strong { font-weight: 700; color: $primary; } i { color: $secondary; margin-right: 4px; } }
}

.hint-icon { color: rgba($primary-dark, 0.4); font-size: 0.7rem; margin-left: 4px; cursor: help; }

.field-grid { display: grid; gap: 16px; grid-template-columns: 1fr; @media (min-width: 700px) { grid-template-columns: repeat(3, 1fr); } margin-bottom: 20px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field-lbl {
  font-size: 0.75rem; font-weight: 800; color: $primary-dark;
  text-transform: uppercase; letter-spacing: 0.4px; display: inline-flex; align-items: center; gap: 6px;
  i { color: $primary; }
}
.field input {
  padding: 13px 16px; border-radius: 14px; border: 1.5px solid rgba($primary-dark, 0.1);
  font-family: $font-principal; font-size: 0.95rem; color: $primary-dark; background: white;
  &:focus { outline: none; border-color: $primary; background: white; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
}
.money-input {
  display: grid; grid-template-columns: 24px 1fr; align-items: center;
  border: 1.5px solid rgba($primary-dark, 0.1); border-radius: 14px; background: white; overflow: hidden;
  &:focus-within { border-color: $primary; background: white; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
  span { text-align: center; font-weight: 800; color: $primary; font-size: 0.95rem; }
  input { border: none; background: transparent; padding: 12px 12px 12px 0; font-family: $font-principal; font-size: 0.95rem; color: $primary-dark; &:focus { outline: none; } }
}

.suggestion-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  padding: 14px; border-radius: 20px; margin-bottom: 20px;
  background: rgba($primary-dark, 0.035); border: 1px solid rgba($primary-dark, 0.07);

  &.loading { color: $text-secondary; font-size: 0.85rem; align-items: center; background: rgba($primary-dark, 0.03); border-color: rgba($primary-dark, 0.08); }
}
.kpi { display: flex; flex-direction: column; gap: 4px; padding: 14px; border-radius: 16px; background: white; border: 1px solid rgba($primary-dark, 0.05); }
.kpi-lbl { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: $text-secondary; }
.kpi-val { font-size: 1.1rem; font-weight: 800; color: darken($alert-success, 10%); }
.kpi-val.green { color: $alert-success; }
.kpi-val.yellow { color: $alert-warning; }
.kpi-val.red { color: $alert-error; }
.margin-wrap { display: flex; align-items: center; gap: 12px; }

.error-msg { background: rgba($alert-error, 0.1); color: $alert-error; padding: 12px 16px; border-radius: 12px; font-size: 0.85rem; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }

.primary-btn { width: 100%; padding: 18px; border-radius: 18px; border: none; background: linear-gradient(135deg, $primary-dark, $primary); color: white; font-family: $font-principal; font-size: 1rem; font-weight: 850; display: inline-flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: all 0.2s; box-shadow: 0 12px 30px rgba($primary, 0.3); &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 38px rgba($primary, 0.36); } &:disabled { opacity: 0.7; cursor: not-allowed; } }
</style>
