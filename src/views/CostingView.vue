<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DemoBanner from '@/components/DemoBanner.vue'
import DemoBadge from '@/components/DemoBadge.vue'
import TiendaContextBar from '@/components/TiendaContextBar.vue'
import AppShell from '@/layout/AppShell.vue'

interface Ingredient {
  id: string
  name: string
  quantity: number
  unit: string
  unitCost: number
}

interface Suggestion {
  id: string
  title: string
  body: string
}

// ----- Recipe calculator -----
const plateName = ref<string>('Bowl ranchero del chef')
const salePrice = ref<number>(8.5)

const units = ['g', 'kg', 'ml', 'l', 'u', 'cda']

const ingredients = ref<Ingredient[]>([
  { id: 'i1', name: 'Tomate riñón', quantity: 120, unit: 'g', unitCost: 0.0035 },
  { id: 'i2', name: 'Queso mozzarella', quantity: 80, unit: 'g', unitCost: 0.014 },
  { id: 'i3', name: 'Pan artesanal', quantity: 1, unit: 'u', unitCost: 0.85 },
])

function addIngredient() {
  ingredients.value.push({
    id: `i${Date.now()}`,
    name: '',
    quantity: 0,
    unit: 'g',
    unitCost: 0,
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
  if (marginPct.value >= 20) return 'green'
  if (marginPct.value >= 0) return 'yellow'
  return 'red'
})

const marginLabel = computed(() =>
  ({
    green: 'Margen saludable',
    yellow: 'Margen ajustado',
    red: 'Margen negativo',
  })[marginLevel.value],
)

const banner = ref<string>('')
let bannerTimer: number | null = null
function saveRecipe() {
  banner.value = `Receta "${plateName.value || 'sin nombre'}" guardada localmente.`
  if (bannerTimer) window.clearTimeout(bannerTimer)
  bannerTimer = window.setTimeout(() => {
    banner.value = ''
  }, 2800)
}

function fmtMoney(n: number) {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}
function fmtPct(n: number) {
  return `${n.toFixed(1)}%`
}

// ----- Goal thermometer -----
const breakEven = ref<number>(312)
const ticketsSold = ref<number>(270)
const ticketsRemaining = computed(() => Math.max(0, breakEven.value - ticketsSold.value))
const goalRatio = computed(() => Math.min(1, ticketsSold.value / breakEven.value))
const goalPct = computed(() => Math.round(goalRatio.value * 100))

const goalMessage = computed(() => {
  if (ticketsRemaining.value <= 0) {
    return '¡Cubriste tu punto de equilibrio! Cada ticket adicional es utilidad pura este mes.'
  }
  return `Te faltan vender ${ticketsRemaining.value} tickets promedio para cubrir tus costos fijos de este mes.`
})

const goalLevel = computed<'green' | 'yellow' | 'red'>(() => {
  if (goalRatio.value >= 1) return 'green'
  if (goalRatio.value >= 0.6) return 'yellow'
  return 'red'
})

// ----- ERP alerts -----
interface AlertSlot {
  id: string
  day: string
  range: string
  delta: number
  level: 'red' | 'yellow'
  suggestion: Suggestion
}

const alerts = ref<AlertSlot[]>([
  {
    id: 'a1',
    day: 'Martes',
    range: '15:00 – 17:00',
    delta: 32,
    level: 'red',
    suggestion: {
      id: 's1',
      title: 'Ajuste de turno · Martes tarde',
      body:
        'Reduce 1 mesero en el turno de 4:00 PM a 6:00 PM los martes y refuérzalo el viernes por la noche. Activa una promo de café + postre 2x1 entre 15:00 y 17:00 para atraer clientes regulares.',
    },
  },
  {
    id: 'a2',
    day: 'Jueves',
    range: '14:00 – 16:00',
    delta: 18,
    level: 'yellow',
    suggestion: {
      id: 's2',
      title: 'Ajuste de turno · Jueves tarde',
      body:
        'Mantén el equipo pero reasigna al cocinero auxiliar a prep de mise en place. Lanza un combo ejecutivo 2x1 para oficinistas cercanos entre 14:00 y 16:00.',
    },
  },
])

const activeSuggestion = ref<Suggestion | null>(null)
function showSuggestion(a: AlertSlot) {
  activeSuggestion.value = a.suggestion
}

onMounted(() => {
  document.title = 'Costeo, Metas y ERP · Rentabilidad360'
})
</script>

<template>
  <AppShell>
    <div class="mod">
      <header class="mod-top">
        <div class="mod-head">
          <h1 class="mod-title"><i class="fa-solid fa-sack-dollar" /> Costeo, Metas y Conexión ERP</h1>
          <p class="mod-sub">Costo de recetas, termómetro de punto de equilibrio y alertas por horarios.</p>
        </div>
      </header>

    <transition name="banner">
      <div v-if="banner" class="save-banner">
        <i class="fa-solid fa-circle-check" /> {{ banner }}
      </div>
    </transition>

    <div class="grid">
      <!-- ============ Recipe calculator ============ -->
      <div class="demo-wrap"><TiendaContextBar /></div>
      <div class="demo-wrap"><DemoBanner /></div>

      <section class="card calc-card">
        <header class="card-head">
          <span class="card-chip"><i class="fa-solid fa-calculator" /> Calculadora de costo</span>
          <span :class="['margin-chip', marginLevel]">
            <i
              :class="[
                'fa-solid',
                marginLevel === 'green'
                  ? 'fa-circle-check'
                  : marginLevel === 'yellow'
                    ? 'fa-triangle-exclamation'
                    : 'fa-circle-xmark',
              ]"
            />
            {{ marginLabel }} · {{ fmtPct(marginPct) }}
          </span>
        </header>
        <h3 class="card-title">Costo de receta por plato</h3>

        <div class="field-grid">
          <label class="field">
            <span class="field-lbl"><i class="fa-solid fa-utensils" /> Nombre del plato</span>
            <input v-model="plateName" type="text" placeholder="Ej. Bowl ranchero" />
          </label>
          <label class="field">
            <span class="field-lbl"><i class="fa-solid fa-coins" /> Precio de venta</span>
            <div class="money-input">
              <span>$</span>
              <input v-model.number="salePrice" type="number" min="0" step="0.05" />
            </div>
          </label>
        </div>

        <div class="ing-head">
          <span>Ingrediente</span>
          <span>Cantidad</span>
          <span>Unidad</span>
          <span>Costo unit.</span>
          <span class="ing-head-actions">Acciones</span>
        </div>

        <ul class="ing-list">
          <li v-for="ing in ingredients" :key="ing.id" class="ing-row">
            <input v-model="ing.name" class="ing-input" type="text" placeholder="Ingrediente" />
            <input
              v-model.number="ing.quantity"
              class="ing-input num"
              type="number"
              min="0"
              step="0.1"
            />
            <select v-model="ing.unit" class="ing-input select">
              <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
            </select>
            <div class="money-input small">
              <span>$</span>
              <input v-model.number="ing.unitCost" type="number" min="0" step="0.001" />
            </div>
            <button class="row-del" type="button" @click="removeIngredient(ing.id)" aria-label="Quitar">
              <i class="fa-solid fa-trash" />
            </button>
          </li>
        </ul>

        <button class="add-ing" type="button" @click="addIngredient">
          <i class="fa-solid fa-plus" /> Agregar ingrediente
        </button>

        <div class="kpi-row">
          <div class="kpi">
            <span class="kpi-lbl">Costo variable total</span>
            <strong class="kpi-val">{{ fmtMoney(totalVariableCost) }}</strong>
          </div>
          <div class="kpi">
            <span class="kpi-lbl">Margen de contribución</span>
            <strong class="kpi-val">{{ fmtMoney(contributionMargin) }}</strong>
          </div>
          <div class="kpi">
            <span class="kpi-lbl">Margen %</span>
            <strong :class="['kpi-val', marginLevel]">{{ fmtPct(marginPct) }}</strong>
          </div>
          <div class="kpi">
            <span class="kpi-lbl">Costo por porción</span>
            <strong class="kpi-val">{{ fmtMoney(totalVariableCost) }}</strong>
          </div>
        </div>

        <button class="primary-btn" type="button" @click="saveRecipe">
          <i class="fa-solid fa-floppy-disk" /> Guardar receta
        </button>
      </section>

      <!-- ============ Thermometer ============ -->
      <section class="card thermo-card">
        <header class="card-head">
          <span class="card-chip"><i class="fa-solid fa-temperature-half" /> Termómetro de meta</span>
          <span :class="['margin-chip', goalLevel]">
            {{ goalPct }}% cubierto
          </span>
        </header>
        <h3 class="card-title">Punto de equilibrio mensual</h3>

        <div class="thermo-wrap">
          <div class="thermo">
            <div class="thermo-tube">
              <div
                :class="['thermo-fill', goalLevel]"
                :style="{ height: `${goalPct}%` }"
              />
              <div class="thermo-marks">
                <span v-for="n in 5" :key="n" />
              </div>
            </div>
            <div class="thermo-bulb">
              <div :class="['bulb-inner', goalLevel]" />
            </div>
          </div>

          <div class="thermo-info">
            <div class="thermo-stat">
              <span class="t-lbl">Punto de equilibrio</span>
              <strong class="t-val">{{ breakEven }} tickets</strong>
            </div>
            <div class="thermo-stat">
              <span class="t-lbl">Tickets vendidos</span>
              <strong class="t-val">{{ ticketsSold }}</strong>
            </div>
            <div class="thermo-stat">
              <span class="t-lbl">Tickets restantes</span>
              <strong :class="['t-val', goalLevel]">{{ ticketsRemaining }}</strong>
            </div>

            <label class="slider-block">
              <span class="t-lbl">Simular tickets vendidos</span>
              <input
                v-model.number="ticketsSold"
                type="range"
                min="0"
                max="400"
                step="1"
                :class="['slider', goalLevel]"
              />
              <div class="slider-range">
                <span>0</span><span>200</span><span>400</span>
              </div>
            </label>

            <p :class="['thermo-msg', goalLevel]">
              <i
                :class="[
                  'fa-solid',
                  goalLevel === 'green' ? 'fa-circle-check' : 'fa-triangle-exclamation',
                ]"
              />
              {{ goalMessage }}
            </p>
          </div>
        </div>
      </section>
    </div>

    <!-- ============ ERP alerts ============ -->
    <section class="card alerts-card">
      <header class="card-head">
        <span class="card-chip warn"><i class="fa-solid fa-clock" /> Horas críticas detectadas</span>
        <span class="erp-badge"><i class="fa-solid fa-plug-circle-bolt" /> ERP simulado</span>
        <DemoBadge label="Demo" tone="solid" size="md" />
      </header>
      <h3 class="card-title">Alertas inteligentes por horarios</h3>
      <p class="card-sub">
        Detectamos patrones de venta debajo del promedio histórico. Optimiza tu equipo y promociones.
      </p>

      <ul class="alerts-list">
        <li
          v-for="a in alerts"
          :key="a.id"
          :class="['alert-row', a.level, { blink: a.level === 'red' }]"
        >
          <div class="alert-main">
            <span :class="['dot', a.level]" />
            <div>
              <strong class="alert-when">{{ a.day }} {{ a.range }}</strong>
              <span class="alert-desc">ventas {{ a.delta }}% por debajo del promedio</span>
            </div>
          </div>
          <button class="see-btn" type="button" @click="showSuggestion(a)">
            <i class="fa-solid fa-lightbulb" /> Ver sugerencia
          </button>
        </li>
      </ul>
    </section>

    <!-- ============ Suggestion panel ============ -->
    <section class="card sugg-card">
      <header class="card-head">
        <span class="card-chip alt"><i class="fa-solid fa-lightbulb" /> Sugerencias inteligentes</span>
      </header>
      <div v-if="activeSuggestion" class="sugg-body">
        <h4 class="sugg-title">{{ activeSuggestion.title }}</h4>
        <p class="sugg-text">{{ activeSuggestion.body }}</p>
        <div class="sugg-meta">
          <span><i class="fa-solid fa-circle-check" /> Acción recomendada por IA</span>
          <span><i class="fa-solid fa-database" /> Basado en últimos 90 días de ventas</span>
        </div>
      </div>
      <div v-else class="sugg-empty">
        <i class="fa-solid fa-wand-magic-sparkles" />
        <p>Selecciona una alerta para ver la recomendación detallada del módulo de inteligencia.</p>
      </div>
    </section>
    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.mod { padding: 0 0 60px; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); }
.mod-top {
  display: flex;
  flex-direction: column;
  background: transparent;
  padding: 32px 32px 10px;
}
.mod-head { display: flex; flex-direction: column; gap: 8px; }
.mod-title {
  margin: 0; font-size: 1.6rem; font-weight: 800; color: $primary-dark;
  display: inline-flex; align-items: center; gap: 12px;
  letter-spacing: -0.5px;
  i { 
    background: linear-gradient(135deg, $primary, $secondary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}
.mod-sub { margin: 0; color: $text-secondary; font-size: 0.95rem; line-height: 1.5; max-width: 600px; }
.demo-wrap { margin: 16px 0; }
@media (max-width: 720px) {
  .mod-top { padding: 20px 16px 10px; }
  .mod-title { font-size: 1.3rem; }
}

.mod-top-old-was {
  display: grid; grid-template-columns: auto 1fr auto; align-items: center;
  gap: 14px; padding: 14px 20px; background: white;
  border-bottom: 1px solid rgba($primary-dark, 0.06);
  position: sticky; top: 0; z-index: 10;
}
.back {
  border: none; background: transparent; cursor: pointer; color: $primary;
  font-family: $font-principal; font-weight: 700; font-size: 0.85rem;
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 10px;
  &:hover { background: rgba($primary, 0.08); }
}
.mod-title {
  margin: 0; font-size: 1.02rem; font-weight: 800; color: $primary-dark;
  display: inline-flex; align-items: center; gap: 8px;
  i { color: $primary; }
}
.brand-mini {
  width: 32px; height: 32px;
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba($primary, 0.1); color: $primary; border-radius: 10px;
}

.save-banner {
  margin: 16px 20px 0;
  padding: 12px 16px; border-radius: 14px;
  background: linear-gradient(135deg, rgba($alert-success, 0.15), rgba($alert-success, 0.05));
  border: 1px solid rgba($alert-success, 0.35);
  color: darken($alert-success, 8%);
  font-family: $font-principal; font-weight: 700; font-size: 0.88rem;
  display: inline-flex; align-items: center; gap: 8px;
}
.banner-enter-active, .banner-leave-active { transition: all 0.3s ease; }
.banner-enter-from, .banner-leave-to { opacity: 0; transform: translateY(-6px); }

.grid {
  display: grid; gap: 24px; padding: 20px 32px;
  grid-template-columns: 1fr;
  @media (min-width: 1024px) { grid-template-columns: 1.4fr 1fr; }
  @media (max-width: 720px) { padding: 16px; gap: 16px; }
}

.card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 12px 36px rgba($primary-dark, 0.04), 0 2px 8px rgba($primary-dark, 0.02);
  border-radius: 24px; padding: 24px;
  transition: box-shadow 0.3s ease;
  &:hover { box-shadow: 0 16px 42px rgba($primary-dark, 0.06), 0 4px 12px rgba($primary-dark, 0.03); }
}
.card + .card { margin-top: 24px; }
.alerts-card, .sugg-card { margin: 0 32px; @media (max-width: 720px) { margin: 0 16px; } }
.sugg-card { margin-bottom: 24px; }

.card-head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  flex-wrap: wrap; margin-bottom: 8px;
}
.card-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba($primary, 0.08); color: $primary;
  padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.5px;
  &.warn { background: rgba($alert-warning, 0.12); color: darken($alert-warning, 15%); }
  &.alt { background: rgba($secondary, 0.12); color: darken($secondary, 15%); }
}
.card-title { margin: 12px 0 6px; font-size: 1.15rem; font-weight: 800; color: $primary-dark; letter-spacing: -0.3px; }
.card-sub { margin: 0 0 18px; font-size: 0.88rem; color: $text-secondary; line-height: 1.5; }

.margin-chip {
  font-family: $font-principal; font-weight: 800; font-size: 0.75rem;
  padding: 6px 14px; border-radius: 24px;
  display: inline-flex; align-items: center; gap: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
  &.green { background: linear-gradient(135deg, lighten($alert-success, 25%), lighten($alert-success, 15%)); color: darken($alert-success, 25%); border: 1px solid rgba($alert-success, 0.2); }
  &.yellow { background: linear-gradient(135deg, lighten($alert-warning, 25%), lighten($alert-warning, 15%)); color: darken($alert-warning, 25%); border: 1px solid rgba($alert-warning, 0.2); }
  &.red { background: linear-gradient(135deg, lighten($alert-error, 25%), lighten($alert-error, 15%)); color: darken($alert-error, 20%); border: 1px solid rgba($alert-error, 0.2); }
}

/* ---- Calculator ---- */
.field-grid {
  display: grid; gap: 10px; margin-top: 14px;
  grid-template-columns: 1fr;
  @media (min-width: 600px) { grid-template-columns: 1.4fr 1fr; }
}
.field { display: flex; flex-direction: column; gap: 6px; }
.field-lbl {
  font-size: 0.72rem; font-weight: 700; color: $text-secondary;
  text-transform: uppercase; letter-spacing: 0.4px;
  display: inline-flex; align-items: center; gap: 6px;
  i { color: $primary; }
}
.field input {
  padding: 11px 12px; border-radius: 12px;
  border: 1px solid rgba($primary-dark, 0.1);
  font-family: $font-principal; font-size: 0.92rem; color: $primary-dark;
  background: #f8fafc;
  &:focus { outline: none; border-color: $primary; background: white; }
}
.money-input {
  display: grid; grid-template-columns: 28px 1fr; align-items: center;
  border: 1px solid rgba($primary-dark, 0.1); border-radius: 12px;
  background: #f8fafc; overflow: hidden;
  &:focus-within { border-color: $primary; background: white; }
  span {
    text-align: center; font-weight: 800; color: $primary;
    font-family: $font-principal;
  }
  input {
    border: none; background: transparent;
    padding: 11px 10px 11px 0;
    font-family: $font-principal; font-size: 0.92rem; color: $primary-dark;
    &:focus { outline: none; }
  }
  &.small {
    grid-template-columns: 22px 1fr;
    span { font-size: 0.82rem; }
    input { padding: 9px 6px 9px 0; font-size: 0.85rem; }
  }
}

.ing-head, .ing-row {
  display: grid; gap: 8px; align-items: center;
  grid-template-columns: 1.6fr 0.9fr 0.7fr 1fr 42px;
}
.ing-head {
  margin: 24px 0 8px;
  font-size: 0.7rem; font-weight: 800; letter-spacing: 0.5px;
  text-transform: uppercase; color: $text-secondary;
}
.ing-head-actions { text-align: center; }
.ing-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.ing-row {
  padding: 10px; background: white; border-radius: 16px;
  border: 1px solid rgba($primary-dark, 0.06);
  box-shadow: 0 4px 12px rgba($primary-dark, 0.02);
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba($primary-dark, 0.04); border-color: rgba($primary, 0.15); }
}
.ing-input {
  padding: 10px 12px; border-radius: 12px;
  border: 1.5px solid rgba($primary-dark, 0.08);
  font-family: $font-principal; font-size: 0.88rem; color: $primary-dark;
  background: #f8fafc; width: 100%; transition: all 0.2s;
  &:focus { outline: none; border-color: $primary; background: white; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
  &.num { text-align: right; font-variant-numeric: tabular-nums; }
  &.select { padding: 10px 8px; cursor: pointer; }
}
.row-del {
  width: 40px; height: 40px; border-radius: 12px;
  border: 1px solid rgba($alert-error, 0.2); background: rgba($alert-error, 0.05);
  color: $alert-error; cursor: pointer; transition: all 0.2s;
  display: inline-flex; align-items: center; justify-content: center;
  &:hover { background: $alert-error; color: white; transform: scale(1.05); box-shadow: 0 4px 10px rgba($alert-error, 0.25); }
}

.add-ing {
  margin-top: 16px;
  display: inline-flex; align-items: center; gap: 10px;
  padding: 12px 18px; border-radius: 14px;
  border: 2px dashed rgba($primary, 0.3); background: rgba($primary, 0.02);
  color: $primary; font-family: $font-principal; font-weight: 800; font-size: 0.9rem;
  cursor: pointer; transition: all 0.2s;
  &:hover { background: rgba($primary, 0.08); border-color: $primary; transform: translateY(-1px); }
}

.kpi-row {
  display: grid; gap: 14px; margin-top: 24px;
  grid-template-columns: repeat(2, 1fr);
  @media (min-width: 720px) { grid-template-columns: repeat(4, 1fr); }
}
.kpi {
  background: linear-gradient(180deg, white, #fbfcfd);
  border: 1px solid rgba($primary-dark, 0.06);
  box-shadow: 0 6px 14px rgba($primary-dark, 0.03);
  padding: 16px; border-radius: 16px;
  display: flex; flex-direction: column; gap: 6px;
  transition: transform 0.2s;
  &:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba($primary-dark, 0.05); }
}
.kpi-lbl {
  font-size: 0.72rem; font-weight: 800; letter-spacing: 0.5px;
  text-transform: uppercase; color: $text-secondary;
}
.kpi-val {
  font-size: 1.25rem; font-weight: 800; color: $primary-dark;
  font-variant-numeric: tabular-nums;
  &.green { color: darken($alert-success, 8%); }
  &.yellow { color: darken($alert-warning, 18%); }
  &.red { color: $alert-error; }
}

.primary-btn {
  margin-top: 24px; width: 100%;
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  padding: 16px; border: none; border-radius: 16px;
  font-family: $font-principal; font-weight: 800; font-size: 1rem;
  color: white; 
  background: linear-gradient(135deg, $primary, #1678b0);
  box-shadow: 0 8px 24px rgba($primary, 0.35); cursor: pointer;
  transition: all 0.25s;
  &:hover { box-shadow: 0 12px 32px rgba($primary, 0.45); transform: translateY(-2px); }
  &:active { transform: scale(0.98); }
}

/* ---- Thermometer ---- */
.thermo-wrap {
  margin-top: 14px;
  display: grid; gap: 18px; align-items: stretch;
  grid-template-columns: 110px 1fr;
}
.thermo {
  position: relative;
  display: flex; flex-direction: column; align-items: center;
  padding: 8px 0;
}
.thermo-tube {
  position: relative;
  width: 38px; flex: 1;
  min-height: 220px;
  background: linear-gradient(180deg, #eef2f7, #e2e8f0);
  border-radius: 22px 22px 8px 8px;
  border: 2px solid rgba($primary-dark, 0.12);
  border-bottom: none;
  overflow: hidden;
}
.thermo-fill {
  position: absolute; left: 0; right: 0; bottom: 0;
  border-radius: 0 0 4px 4px;
  transition: height 0.55s cubic-bezier(.2,.9,.3,1.2), background 0.3s;
  &.green { background: linear-gradient(180deg, lighten($alert-success, 10%), $alert-success); }
  &.yellow { background: linear-gradient(180deg, lighten($alert-warning, 8%), $alert-warning); }
  &.red { background: linear-gradient(180deg, lighten($alert-error, 12%), $alert-error); }
}
.thermo-marks {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; justify-content: space-between;
  padding: 12px 0;
  pointer-events: none;
  span {
    display: block; height: 1px; width: 14px;
    background: rgba($primary-dark, 0.2);
    margin-left: auto; margin-right: 6px;
  }
}
.thermo-bulb {
  width: 70px; height: 70px;
  margin-top: -10px;
  border-radius: 50%;
  background: #e2e8f0;
  border: 2px solid rgba($primary-dark, 0.12);
  display: flex; align-items: center; justify-content: center;
  box-shadow: inset 0 -8px 16px rgba(0,0,0,0.08);
}
.bulb-inner {
  width: 50px; height: 50px; border-radius: 50%;
  transition: background 0.3s;
  &.green { background: radial-gradient(circle at 30% 30%, lighten($alert-success, 15%), $alert-success); }
  &.yellow { background: radial-gradient(circle at 30% 30%, lighten($alert-warning, 12%), $alert-warning); }
  &.red { background: radial-gradient(circle at 30% 30%, lighten($alert-error, 18%), $alert-error); }
}

.thermo-info { display: flex; flex-direction: column; gap: 12px; }
.thermo-stat {
  display: flex; flex-direction: column; gap: 2px;
  padding: 10px 12px; background: #f8fafc; border-radius: 12px;
  border: 1px solid rgba($primary-dark, 0.05);
}
.t-lbl {
  font-size: 0.68rem; font-weight: 700; letter-spacing: 0.3px;
  text-transform: uppercase; color: $text-secondary;
}
.t-val {
  font-size: 1rem; font-weight: 800; color: $primary-dark;
  font-variant-numeric: tabular-nums;
  &.green { color: darken($alert-success, 6%); }
  &.yellow { color: darken($alert-warning, 14%); }
  &.red { color: $alert-error; }
}

.slider-block {
  display: flex; flex-direction: column; gap: 8px;
  padding: 12px; background: white;
  border-radius: 12px; border: 1px solid rgba($primary-dark, 0.06);
}
.slider {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 8px; border-radius: 999px;
  background: rgba($primary-dark, 0.08);
  outline: none;
  &::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 22px; height: 22px; border-radius: 50%;
    background: $primary; border: 3px solid white;
    box-shadow: 0 4px 10px rgba($primary, 0.35);
    cursor: pointer;
  }
  &::-moz-range-thumb {
    width: 22px; height: 22px; border-radius: 50%;
    background: $primary; border: 3px solid white;
    box-shadow: 0 4px 10px rgba($primary, 0.35);
    cursor: pointer;
  }
  &.green::-webkit-slider-thumb { background: $alert-success; box-shadow: 0 4px 10px rgba($alert-success, 0.4); }
  &.yellow::-webkit-slider-thumb { background: $alert-warning; box-shadow: 0 4px 10px rgba($alert-warning, 0.4); }
  &.red::-webkit-slider-thumb { background: $alert-error; box-shadow: 0 4px 10px rgba($alert-error, 0.4); }
}
.slider-range {
  display: flex; justify-content: space-between;
  font-size: 0.7rem; color: $text-secondary; font-weight: 600;
}
.thermo-msg {
  margin: 0; padding: 10px 12px; border-radius: 12px;
  font-size: 0.85rem; line-height: 1.5; font-weight: 600;
  display: inline-flex; align-items: flex-start; gap: 8px;
  i { margin-top: 2px; }
  &.green { background: rgba($alert-success, 0.1); color: darken($alert-success, 10%); }
  &.yellow { background: rgba($alert-warning, 0.15); color: darken($alert-warning, 14%); }
  &.red { background: rgba($alert-error, 0.1); color: darken($alert-error, 4%); }
}

/* ---- Alerts ---- */
.erp-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba($alert-success, 0.12); color: darken($alert-success, 10%);
  padding: 5px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700;
}
.alerts-list { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.alert-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 16px 20px; border-radius: 16px;
  border: 1px solid transparent;
  box-shadow: 0 4px 14px rgba(0,0,0,0.02);
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.05); }
  &.red {
    background: linear-gradient(135deg, rgba($alert-error, 0.08), rgba($alert-error, 0.01));
    border-color: rgba($alert-error, 0.25);
  }
  &.yellow {
    background: linear-gradient(135deg, rgba($alert-warning, 0.12), rgba($alert-warning, 0.02));
    border-color: rgba($alert-warning, 0.3);
  }
  &.blink { animation: subtle-blink 2s ease-in-out infinite; }
}
@keyframes subtle-blink {
  0%, 100% { box-shadow: 0 0 0 rgba($alert-error, 0); }
  50% { box-shadow: 0 0 0 5px rgba($alert-error, 0.15); }
}
.alert-main { display: flex; align-items: center; gap: 14px; }
.dot {
  width: 14px; height: 14px; border-radius: 50%;
  &.red { background: $alert-error; box-shadow: 0 0 12px rgba($alert-error, 0.6); }
  &.yellow { background: $alert-warning; box-shadow: 0 0 12px rgba($alert-warning, 0.6); }
}
.alert-when {
  display: block; font-size: 1rem; font-weight: 800; color: $primary-dark; margin-bottom: 2px;
}
.alert-desc { font-size: 0.85rem; color: $text-secondary; font-weight: 500; }
.see-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-radius: 12px;
  background: white; border: 1.5px solid rgba($primary, 0.15);
  color: $primary; font-family: $font-principal; font-weight: 800; font-size: 0.85rem;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 10px rgba($primary, 0.05);
  &:hover { background: rgba($primary, 0.08); border-color: $primary; transform: translateY(-1px); box-shadow: 0 6px 14px rgba($primary, 0.1); }
  i { color: $alert-warning; font-size: 1rem; }
}

/* ---- Suggestion ---- */
.sugg-body { margin-top: 16px; }
.sugg-title {
  margin: 0 0 10px; font-size: 1.05rem; font-weight: 800; color: $primary-dark;
}
.sugg-text {
  margin: 0 0 16px; font-size: 0.92rem; line-height: 1.6; color: $primary-dark;
  padding: 18px; border-radius: 16px;
  background: linear-gradient(135deg, rgba($secondary, 0.15), rgba($secondary, 0.02));
  border: 1px solid rgba($secondary, 0.3);
  box-shadow: inset 0 2px 10px rgba(255,255,255,0.5), 0 4px 12px rgba($secondary, 0.05);
}
.sugg-meta {
  display: flex; flex-wrap: wrap; gap: 16px;
  font-size: 0.78rem; font-weight: 700; color: $text-secondary;
  i { color: $primary; margin-right: 6px; }
}
.sugg-empty {
  margin-top: 16px; padding: 32px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  background: #f8fafc; border-radius: 16px;
  border: 2px dashed rgba($primary-dark, 0.12);
  transition: all 0.3s;
  &:hover { background: white; border-color: rgba($primary, 0.3); }
  i { font-size: 2rem; color: rgba($primary, 0.6); }
  p { margin: 0; font-size: 0.9rem; color: $text-secondary; text-align: center; max-width: 400px; line-height: 1.6; }
}

@media (max-width: 600px) {
  .ing-head { display: none; }
  .ing-row {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "name name"
      "qty unit"
      "cost del";
    gap: 8px;
    .ing-input:nth-child(1) { grid-area: name; }
    .ing-input:nth-child(2) { grid-area: qty; }
    .ing-input:nth-child(3) { grid-area: unit; }
    .money-input { grid-area: cost; }
    .row-del { grid-area: del; width: 100%; }
  }
  .thermo-wrap { grid-template-columns: 90px 1fr; }
}
</style>
