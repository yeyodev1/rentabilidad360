<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppShell from '@/layout/AppShell.vue'
import RecipeBuilder from '@/components/RecipeBuilder.vue'
import { costingService } from '@/services/costingService'

const recipes = ref<any[]>([])
const ingredients = ref<any[]>([])
const loading = ref(true)
const showBuilder = ref(false)
const showIngredientList = ref(false)
const deleting = ref<string | null>(null)
const successMsg = ref('')
const ingredientDeleting = ref<string | null>(null)

async function loadData() {
  loading.value = true
  try {
    const [rRes, iRes] = await Promise.all([
      costingService.listRecipes().catch(() => ({ data: [] })),
      costingService.listIngredients().catch(() => ({ data: [] })),
    ])
    recipes.value = (rRes as any).data || []
    ingredients.value = (iRes as any).data || []
  } catch {
    recipes.value = []
    ingredients.value = []
  } finally {
    loading.value = false
  }
}

function computeRecipeCost(r: any): number {
  if (!r.ingredients?.length) return 0
  return r.ingredients.reduce((sum: number, ing: any) => {
    const cost = ing.ingredientId?.costPrice || 0
    return sum + (ing.quantity || 0) * cost
  }, 0)
}

function computeRecipeMargin(r: any): number {
  const cost = computeRecipeCost(r)
  return (r.sellingPrice || 0) - cost
}

function computeRecipeMarginPct(r: any): number {
  if (!r.sellingPrice) return 0
  return (computeRecipeMargin(r) / r.sellingPrice) * 100
}

function marginLevel(pct: number): string {
  if (pct >= 60) return 'green'
  if (pct >= 30) return 'yellow'
  return 'red'
}

const totalRecipes = computed(() => recipes.value.length)
const avgMarginPct = computed(() => {
  if (!recipes.value.length) return 0
  const total = recipes.value.reduce((s, r) => s + computeRecipeMarginPct(r), 0)
  return total / recipes.value.length
})
const avgSellingPrice = computed(() => {
  if (!recipes.value.length) return 0
  return recipes.value.reduce((s, r) => s + (r.sellingPrice || 0), 0) / recipes.value.length
})
const avgCost = computed(() => {
  if (!recipes.value.length) return 0
  return recipes.value.reduce((s, r) => s + computeRecipeCost(r), 0) / recipes.value.length
})

// Break-even: assumes avg margin per ticket. Fixed cost = $3000 default (from rent + payroll typical)
const fixedCost = ref(3000)
const ticketsSold = ref(0)
const breakEvenTickets = computed(() => {
  const avgContrib = avgSellingPrice.value - avgCost.value
  if (avgContrib <= 0) return 999
  return Math.ceil(fixedCost.value / avgContrib)
})
const goalRatio = computed(() => {
  if (breakEvenTickets.value <= 0) return 1
  return Math.min(1, ticketsSold.value / breakEvenTickets.value)
})
const goalPct = computed(() => Math.round(goalRatio.value * 100))
const goalLevel = computed(() => {
  if (goalRatio.value >= 1) return 'green'
  if (goalRatio.value >= 0.6) return 'yellow'
  return 'red'
})

async function onRecipeSaved() {
  showBuilder.value = false
  successMsg.value = 'Receta guardada exitosamente'
  setTimeout(() => { successMsg.value = '' }, 3000)
  await loadData()
}

async function deleteRecipe(id: string) {
  if (!confirm('¿Eliminar esta receta?')) return
  deleting.value = id
  try {
    await costingService.deleteRecipe(id)
    await loadData()
  } catch {
    // ignore
  } finally {
    deleting.value = null
  }
}

async function deleteIngredient(id: string) {
  if (!confirm('¿Eliminar este ingrediente?')) return
  ingredientDeleting.value = id
  try {
    await costingService.deleteIngredient(id)
    await loadData()
  } catch {
    // ignore
  } finally {
    ingredientDeleting.value = null
  }
}

function fmtMoney(n: number) {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}
function fmtPct(n: number) {
  return `${n.toFixed(1)}%`
}

onMounted(async () => {
  document.title = 'Costeo de Recetas · Rentabilidad360'
  await loadData()
})
</script>

<template>
  <AppShell>
    <div class="page">
      <header class="page-head">
        <div>
          <h1 class="page-title"><i class="fa-solid fa-sack-dollar" /> Costeo de Recetas</h1>
          <p class="page-sub">Calcula el costo real de tus platos, ingredientes y punto de equilibrio</p>
        </div>
        <button class="btn primary" @click="showBuilder = !showBuilder">
          <i class="fa-solid" :class="showBuilder ? 'fa-xmark' : 'fa-plus'" />
          <span class="btn-text">{{ showBuilder ? 'Cerrar' : 'Nueva Receta' }}</span>
        </button>
      </header>

      <transition name="banner">
        <div v-if="successMsg" class="success-msg">
          <i class="fa-solid fa-circle-check" /> {{ successMsg }}
        </div>
      </transition>

      <transition name="slide">
        <RecipeBuilder v-if="showBuilder" @saved="onRecipeSaved" />
      </transition>

      <div class="grid" :class="{ 'has-builder': showBuilder }">
        <section class="stats-row">
          <div class="stat-card">
            <span class="stat-val">{{ totalRecipes }}</span>
            <span class="stat-lbl">Recetas</span>
          </div>
          <div class="stat-card" :class="marginLevel(avgMarginPct)">
            <span class="stat-val">{{ fmtPct(avgMarginPct) }}</span>
            <span class="stat-lbl">Margen promedio</span>
          </div>
          <div class="stat-card">
            <span class="stat-val">{{ ingredients.length }}</span>
            <span class="stat-lbl">Insumos</span>
          </div>
          <div class="stat-card">
            <span class="stat-val">{{ fmtMoney(avgSellingPrice) }}</span>
            <span class="stat-lbl">Precio promedio</span>
          </div>
        </section>
      </div>

      <div class="list-section" v-if="!loading">
        <section class="card recipe-list-card" v-if="recipes.length">
          <header class="card-head">
            <span class="card-chip"><i class="fa-solid fa-utensils" /> Recetas ({{ recipes.length }})</span>
          </header>
          <div class="recipe-list">
            <article v-for="r in recipes" :key="r._id" class="recipe-row">
              <div class="recipe-info">
                <h4 class="recipe-name">{{ r.name }}</h4>
                <div class="recipe-meta">
                  <span>{{ fmtMoney(r.sellingPrice) }} PVP</span>
                  <span class="sep">·</span>
                  <span :class="['marg-badge', marginLevel(computeRecipeMarginPct(r))]">{{ fmtPct(computeRecipeMarginPct(r)) }}</span>
                  <span class="sep">·</span>
                  <span class="cost-val">{{ fmtMoney(computeRecipeCost(r)) }} costo</span>
                </div>
              </div>
              <div class="recipe-actions">
                <button class="action-btn" @click="deleteRecipe(r._id)" :disabled="deleting === r._id" title="Eliminar">
                  <i class="fa-solid fa-trash-can" />
                </button>
              </div>
            </article>
          </div>
        </section>

        <section class="card empty-card" v-else-if="!showBuilder">
          <div class="empty-state">
            <i class="fa-solid fa-receipt empty-icon" />
            <h3>Sin recetas aún</h3>
            <p>Crea tu primera receta para calcular costos reales y punto de equilibrio.</p>
            <button class="btn primary" @click="showBuilder = true"><i class="fa-solid fa-plus" /> Crear Receta</button>
          </div>
        </section>

        <section class="card break-even-card" v-if="recipes.length > 0">
          <header class="card-head">
            <span class="card-chip alt"><i class="fa-solid fa-chart-simple" /> Punto de equilibrio</span>
          </header>
          <div class="be-stats">
            <div class="be-stat">
              <span class="be-lbl">Costo fijo mensual</span>
              <div class="money-input sm">
                <span>$</span>
                <input v-model.number="fixedCost" type="number" min="0" step="100" />
              </div>
            </div>
            <div class="be-stat">
              <span class="be-lbl">Ticket promedio</span>
              <strong class="be-val">{{ fmtMoney(avgSellingPrice) }}</strong>
            </div>
            <div class="be-stat">
              <span class="be-lbl">Contribución x ticket</span>
              <strong class="be-val green">{{ fmtMoney(avgSellingPrice - avgCost) }}</strong>
            </div>
            <div class="be-stat highlight">
              <span class="be-lbl">Break-even</span>
              <strong class="be-val">{{ breakEvenTickets }} tickets/mes</strong>
            </div>
          </div>

          <div class="be-bar-wrap">
            <div class="be-bar">
              <div :class="['be-fill', goalLevel]" :style="{ width: goalPct + '%' }" />
            </div>
            <div class="be-range">
              <span>0</span>
              <span>{{ Math.round(breakEvenTickets / 2) }}</span>
              <span>{{ breakEvenTickets }}</span>
            </div>
          </div>

          <div class="be-slider-block">
            <label class="be-lbl">Simular tickets vendidos</label>
            <input v-model.number="ticketsSold" type="range" :min="0" :max="Math.max(breakEvenTickets * 2, 100)" step="1" class="be-slider" />
            <div class="be-sold-info">
              <span>{{ ticketsSold }} tickets</span>
              <span :class="['be-status', goalLevel]">
                <i :class="goalLevel === 'green' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'" />
                {{ goalLevel === 'green' ? 'Cubres tus costos' : goalPct + '% cubierto' }}
              </span>
            </div>
          </div>
        </section>

        <section class="card pantry-card">
          <header class="card-head">
            <span class="card-chip warn"><i class="fa-solid fa-basket-shopping" /> Despensa ({{ ingredients.length }})</span>
            <button class="toggle-btn" @click="showIngredientList = !showIngredientList">
              <i class="fa-solid" :class="showIngredientList ? 'fa-chevron-up' : 'fa-chevron-down'" />
            </button>
          </header>
          <transition name="fade">
            <div v-if="showIngredientList">
              <div v-if="!ingredients.length" class="pantry-empty">
                <p>Sin insumos registrados. Se crearán automáticamente al agregar recetas.</p>
              </div>
              <ul v-else class="pantry-list">
                <li v-for="i in ingredients" :key="i._id" class="pantry-row">
                  <div class="pantry-info">
                    <strong>{{ i.name }}</strong>
                    <span class="pantry-unit">{{ i.unitOfMeasure }} · {{ fmtMoney(i.costPrice) }}/{{ i.unitOfMeasure === 'unidad' ? 'u' : i.unitOfMeasure }}</span>
                  </div>
                  <button class="action-btn sm danger" @click="deleteIngredient(i._id)" :disabled="ingredientDeleting === i._id" title="Eliminar">
                    <i class="fa-solid fa-trash-can" />
                  </button>
                </li>
              </ul>
            </div>
          </transition>
        </section>

        <section class="card guide-card">
          <header class="card-head">
            <span class="card-chip alt"><i class="fa-solid fa-compass" /> Guía rápida</span>
          </header>
          <div class="guide-grid">
            <div class="guide-item">
              <i class="fa-solid fa-receipt" />
              <div>
                <strong>Registra recetas</strong>
                <p>Agrega cada plato con sus ingredientes exactos para conocer tu costo real.</p>
              </div>
            </div>
            <div class="guide-item">
              <i class="fa-solid fa-chart-line" />
              <div>
                <strong>Calcula tu margen</strong>
                <p>Apunta a +60% de margen bruto. Si estás debajo, revisa precios o porciones.</p>
              </div>
            </div>
            <div class="guide-item">
              <i class="fa-solid fa-bullseye" />
              <div>
                <strong>Punto de equilibrio</strong>
                <p>Saber cuántos platos necesitas vender al mes para cubrir tus costos fijos.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loader" />
        <p>Cargando datos de costeo...</p>
      </div>
    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.page { padding: 0 0 80px; display: flex; flex-direction: column; gap: 12px; }

.page-head {
  padding: 16px 16px 0; display: flex; justify-content: space-between; align-items: center; gap: 8px;
}
.page-title { margin: 0; font-size: 1.25rem; font-weight: 900; color: $primary-dark; display: flex; align-items: center; gap: 8px;
  i { color: $primary; } @media (min-width: $bp-mobile) { font-size: 1.4rem; }
}
.page-sub { margin: 2px 0 0; font-size: 0.82rem; color: $text-secondary; }
@media (max-width: 374px) { .btn-text { display: none; } }

.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 14px 18px; border-radius: 12px;
  font-family: $font-principal; font-weight: 700; font-size: 0.9rem;
  border: none; cursor: pointer; transition: transform 0.15s, background 0.2s; white-space: nowrap;
  min-height: 48px;
  &:active:not(:disabled) { transform: scale(0.97); }
  &.primary { background: linear-gradient(135deg, $primary, $secondary); color: white; box-shadow: 0 8px 20px rgba($primary, 0.28); }
  &.ghost { background: rgba($primary-dark, 0.06); color: $primary-dark; &:hover { background: rgba($primary-dark, 0.12); } }
  @media (min-width: $bp-mobile) { padding: 12px 18px; }
}

.success-msg {
  margin: 12px 16px 0; padding: 12px 16px; border-radius: 14px;
  background: linear-gradient(135deg, rgba($alert-success, 0.15), rgba($alert-success, 0.05));
  border: 1px solid rgba($alert-success, 0.35);
  color: darken($alert-success, 8%); font-weight: 700; font-size: 0.88rem;
  display: flex; align-items: center; gap: 8px;
}
.banner-enter-active, .banner-leave-active { transition: all 0.3s ease; }
.banner-enter-from, .banner-leave-to { opacity: 0; transform: translateY(-6px); }

.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; overflow: hidden; }
.slide-enter-from, .slide-leave-to { opacity: 0; max-height: 0; margin-bottom: 0; padding: 0 16px; }
.slide-enter-to, .slide-leave-from { max-height: 900px; }

.grid { padding: 0 16px; }
.stats-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
  @media (min-width: $bp-mobile) { grid-template-columns: repeat(4, 1fr); gap: 10px; }
}
.stat-card {
  background: white; border-radius: 14px; padding: 12px 10px;
  display: flex; flex-direction: column; gap: 2px;
  border: 1px solid rgba($primary-dark, 0.05); text-align: center;
  &.green { border-color: rgba($alert-success, 0.25); background: rgba($alert-success, 0.04); }
  &.yellow { border-color: rgba($alert-warning, 0.25); background: rgba($alert-warning, 0.04); }
  &.red { border-color: rgba($alert-error, 0.25); background: rgba($alert-error, 0.04); }
}
.stat-val { font-size: 1.1rem; font-weight: 900; color: $primary-dark; font-variant-numeric: tabular-nums; }
.stat-lbl { font-size: 0.6rem; font-weight: 700; color: $text-secondary; text-transform: uppercase; letter-spacing: 0.3px; }

.loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px 0; gap: 12px; color: $text-secondary; }
.loader { width: 36px; height: 36px; border: 3px solid rgba($primary, 0.2); border-top-color: $primary; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.card {
  background: white; border: 1px solid rgba($primary-dark, 0.06); border-radius: 18px; padding: 16px;
  margin: 0 16px; box-shadow: 0 4px 16px rgba($primary-dark, 0.03);
}
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
.card-chip {
  display: inline-flex; align-items: center; gap: 6px; align-self: flex-start;
  background: rgba($primary, 0.08); color: $primary;
  padding: 6px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.5px;
  &.warn { background: rgba($alert-warning, 0.12); color: darken($alert-warning, 15%); }
  &.alt { background: rgba($secondary, 0.12); color: darken($secondary, 15%); }
}

/* ── Recipes ── */
.recipe-list-card { padding: 16px; }
.recipe-list { display: flex; flex-direction: column; gap: 8px; }
.recipe-row {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 12px; border-radius: 14px; border: 1px solid rgba($primary-dark, 0.05);
  background: #f8fafc; transition: all 0.15s;
  &:hover { border-color: rgba($primary, 0.15); }
}
.recipe-info { flex: 1; min-width: 0; }
.recipe-name { margin: 0; font-size: 0.95rem; font-weight: 800; color: $primary-dark; }
.recipe-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; font-size: 0.78rem; color: $text-secondary; margin-top: 2px; }
.sep { color: rgba($primary-dark, 0.15); font-weight: 700; }
.cost-val { color: $text-secondary; }
.marg-badge {
  font-weight: 800; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem;
  &.green { background: rgba($alert-success, 0.1); color: darken($alert-success, 10%); }
  &.yellow { background: rgba($alert-warning, 0.1); color: darken($alert-warning, 12%); }
  &.red { background: rgba($alert-error, 0.1); color: $alert-error; }
}
.recipe-actions { flex-shrink: 0; }
.action-btn {
  width: 36px; height: 36px; border-radius: 10px; border: none;
  background: rgba($primary-dark, 0.05); cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: $text-secondary; font-size: 0.85rem; transition: all 0.15s;
  &.sm { width: 30px; height: 30px; font-size: 0.75rem; }
  &.danger { color: $alert-error; &:hover { background: rgba($alert-error, 0.1); } }
  &:hover { background: rgba($primary, 0.1); color: $primary; }
  &:disabled { opacity: 0.4; cursor: wait; }
}

/* ── Empty ── */
.empty-state {
  padding: 32px 16px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px;
  .empty-icon { font-size: 2.2rem; color: rgba($primary-dark, 0.12); }
  h3 { margin: 0; font-size: 1.05rem; font-weight: 800; color: $primary-dark; }
  p { margin: 0; font-size: 0.85rem; color: $text-secondary; max-width: 280px; }
}

/* ── Break-even ── */
.break-even-card { margin-top: 4px; }
.be-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px;
  @media (min-width: $bp-mobile) { grid-template-columns: repeat(4, 1fr); }
}
.be-stat {
  padding: 10px; border-radius: 12px; background: #f8fafc; border: 1px solid rgba($primary-dark, 0.04);
  display: flex; flex-direction: column; gap: 4px;
  &.highlight { background: linear-gradient(135deg, rgba($primary, 0.04), white); border-color: rgba($primary, 0.15); }
}
.be-lbl { font-size: 0.62rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; color: $text-secondary; }
.be-val { font-size: 0.95rem; font-weight: 800; color: $primary-dark; font-variant-numeric: tabular-nums;
  &.green { color: darken($alert-success, 6%); }
}

.money-input {
  display: grid; grid-template-columns: 24px 1fr; align-items: center;
  border: 1.5px solid rgba($primary-dark, 0.1); border-radius: 10px; background: white; overflow: hidden;
  &:focus-within { border-color: $primary; }
  span { text-align: center; font-weight: 800; color: $primary; font-size: 0.85rem; }
  input { border: none; background: transparent; padding: 8px 8px 8px 0; font-family: $font-principal; font-size: 0.85rem; color: $primary-dark; width: 100%; &:focus { outline: none; } }
  &.sm { grid-template-columns: 20px 1fr; span { font-size: 0.78rem; } input { padding: 6px 6px 6px 0; font-size: 0.85rem; } }
}

.be-bar-wrap { margin-bottom: 12px; }
.be-bar { height: 10px; background: rgba($primary-dark, 0.08); border-radius: 999px; overflow: hidden; }
.be-fill { display: block; height: 100%; border-radius: 999px; transition: width 0.4s ease;
  &.green { background: $alert-success; }
  &.yellow { background: $alert-warning; }
  &.red { background: $alert-error; }
}
.be-range { display: flex; justify-content: space-between; font-size: 0.62rem; color: $text-secondary; font-weight: 600; margin-top: 4px; }

.be-slider-block {
  display: flex; flex-direction: column; gap: 8px;
  padding: 12px; background: #f8fafc; border-radius: 12px; border: 1px solid rgba($primary-dark, 0.05);
}
.be-slider {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 8px; border-radius: 999px;
  background: rgba($primary-dark, 0.08); outline: none;
  &::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 50%; background: $primary; border: 3px solid white; box-shadow: 0 4px 10px rgba($primary, 0.35); cursor: pointer; }
  &::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: $primary; border: 3px solid white; box-shadow: 0 4px 10px rgba($primary, 0.35); cursor: pointer; }
}
.be-sold-info { display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; font-weight: 700; color: $primary-dark; }
.be-status {
  display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 8px; font-size: 0.72rem;
  &.green { background: rgba($alert-success, 0.1); color: darken($alert-success, 8%); }
  &.yellow { background: rgba($alert-warning, 0.1); color: darken($alert-warning, 12%); }
  &.red { background: rgba($alert-error, 0.1); color: $alert-error; }
}

/* ── Pantry ── */
.pantry-card { margin-top: 4px; }
.pantry-empty { padding: 16px; text-align: center; color: $text-secondary; font-size: 0.85rem; background: #f8fafc; border-radius: 12px; }
.pantry-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.pantry-row {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 10px 12px; border-radius: 12px; background: #f8fafc; border: 1px solid rgba($primary-dark, 0.04);
}
.pantry-info { display: flex; flex-direction: column; gap: 1px; flex: 1;
  strong { font-size: 0.88rem; color: $primary-dark; }
}
.pantry-unit { font-size: 0.75rem; color: $text-secondary; }
.toggle-btn { background: transparent; border: none; font-size: 0.9rem; color: $text-secondary; cursor: pointer; padding: 6px; border-radius: 8px; &:hover { background: rgba($primary-dark, 0.05); } }

/* ── Guide ── */
.guide-card { margin-top: 4px; margin-bottom: 24px; }
.guide-grid { display: flex; flex-direction: column; gap: 10px; }
.guide-item {
  display: flex; gap: 12px; align-items: flex-start;
  i { font-size: 1.1rem; color: $primary; margin-top: 2px; flex-shrink: 0; }
  strong { display: block; font-size: 0.85rem; font-weight: 800; color: $primary-dark; margin-bottom: 2px; }
  p { margin: 0; font-size: 0.8rem; color: $text-secondary; line-height: 1.4; }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.list-section { display: flex; flex-direction: column; gap: 12px; }
</style>
