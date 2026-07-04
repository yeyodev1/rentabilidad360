<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppShell from '@/layout/AppShell.vue'
import RecipeBuilder from '@/components/RecipeBuilder.vue'
import { costingService } from '@/services/costingService'
import { onboardingService } from '@/services/onboardingService'
import { useUIStore } from '@/stores/ui'

const ui = useUIStore()
const recipes = ref<any[]>([])
const ingredients = ref<any[]>([])
const loading = ref(true)
const showBuilder = ref(false)
const showIngredientList = ref(false)
const deleting = ref<string | null>(null)
const successMsg = ref('')
const ingredientDeleting = ref<string | null>(null)
const showCostsModal = ref(false)
const savingCosts = ref(false)
const costsForm = ref({
  rent: 0,
  staffCount: 0,
  averageSalary: 0,
  utilities: 0,
  internet: 0,
  insurance: 0,
  marketing: 0,
  other: 0,
})

const payrollEstimate = computed(() =>
  Math.max(0, Number(costsForm.value.staffCount) || 0) * Math.max(0, Number(costsForm.value.averageSalary) || 0),
)

const totalFixedCostEstimate = computed(() =>
  payrollEstimate.value +
  (Number(costsForm.value.rent) || 0) +
  (Number(costsForm.value.utilities) || 0) +
  (Number(costsForm.value.internet) || 0) +
  (Number(costsForm.value.insurance) || 0) +
  (Number(costsForm.value.marketing) || 0) +
  (Number(costsForm.value.other) || 0),
)

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

// Cost and suggestion now come pre-computed from the backend (costing.service.ts pricing engine).
function recipeCost(r: any): number {
  return r.cost ?? 0
}

function marginLevel(pct: number): string {
  if (pct >= 60) return 'green'
  if (pct >= 30) return 'yellow'
  return 'red'
}

function currentMarginPct(r: any): number | null {
  if (!r.sellingPrice) return null
  return ((r.sellingPrice - recipeCost(r)) / r.sellingPrice) * 100
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const totalRecipes = computed(() => recipes.value.length)
const avgSuggestedMin = computed(() => {
  if (!recipes.value.length) return 0
  return recipes.value.reduce((s, r) => s + (r.suggestion?.suggestedMinPrice || 0), 0) / recipes.value.length
})
const avgCost = computed(() => {
  if (!recipes.value.length) return 0
  return recipes.value.reduce((s, r) => s + recipeCost(r), 0) / recipes.value.length
})
const totalMonthlyUnitsTarget = computed(() => {
  const targets = recipes.value
    .map((r) => r.suggestion?.monthlyUnitsTarget)
    .filter((target): target is number => typeof target === 'number' && target > 0)
  if (!targets.length) return null
  return targets.reduce((sum, target) => sum + target, 0)
})

async function onRecipeSaved() {
  showBuilder.value = false
  successMsg.value = 'Receta guardada exitosamente'
  setTimeout(() => { successMsg.value = '' }, 3000)
  await loadData()
}

async function deleteRecipe(id: string) {
  const ok = await ui.requestConfirm({
    title: 'Confirmar eliminación',
    message: 'Esta receta saldrá del módulo de Costeo. Confirma solo si ya no la necesitas para calcular precios.',
    confirmLabel: 'Sí, eliminar',
    cancelLabel: 'Conservar receta',
    tone: 'danger',
    icon: 'fa-solid fa-trash-can',
  })
  if (!ok) return
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
  const ok = await ui.requestConfirm({
    title: 'Confirmar eliminación',
    message: 'Este ingrediente saldrá de la lista de costos. Confirma solo si ya no lo usas en tus recetas.',
    confirmLabel: 'Sí, eliminar',
    cancelLabel: 'Conservar ingrediente',
    tone: 'danger',
    icon: 'fa-solid fa-trash-can',
  })
  if (!ok) return
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

async function saveFixedCosts() {
  savingCosts.value = true
  try {
    await onboardingService.saveStep(3, {
      rent: Number(costsForm.value.rent) || 0,
      payroll: payrollEstimate.value,
      utilities: Number(costsForm.value.utilities) || 0,
      internet: Number(costsForm.value.internet) || 0,
      insurance: Number(costsForm.value.insurance) || 0,
      marketing: Number(costsForm.value.marketing) || 0,
      other: Number(costsForm.value.other) || 0,
    })
    showCostsModal.value = false
    successMsg.value = 'Costos fijos guardados. Meta mensual recalculada.'
    setTimeout(() => { successMsg.value = '' }, 3000)
    await loadData()
  } finally {
    savingCosts.value = false
  }
}

function fmtMoney(n: number) {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}
function fmtPct(n: number) {
  return `${n.toFixed(1)}%`
}

onMounted(async () => {
  document.title = 'Costeo de Recetas · Allio'
  await loadData()
})
</script>

<template>
  <AppShell>
    <div class="page">
      <header class="page-head">
        <div>
          <span class="eyebrow"><i class="fa-solid fa-chart-simple" /> Motor de precios</span>
          <h1 class="page-title"><i class="fa-solid fa-sack-dollar" /> Costeo de Platos</h1>
          <p class="page-sub">Convierte el costo de producción en precio sugerido, meta mensual y vigencia de precio.</p>
        </div>
        <button class="btn primary" @click="showBuilder = !showBuilder">
          <i class="fa-solid" :class="showBuilder ? 'fa-xmark' : 'fa-plus'" />
          <span class="btn-text">{{ showBuilder ? 'Cerrar' : 'Nuevo Plato' }}</span>
        </button>
        <div class="hero-orb" aria-hidden="true">
          <i class="fa-solid fa-utensils" />
        </div>
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
            <span class="stat-ico"><i class="fa-solid fa-bowl-food" /></span>
            <div>
              <span class="stat-lbl">Platos costeados</span>
              <span class="stat-val">{{ totalRecipes }}</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-ico amber"><i class="fa-solid fa-coins" /></span>
            <div>
              <span class="stat-lbl">Costo promedio</span>
              <span class="stat-val">{{ fmtMoney(avgCost) }}</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-ico green"><i class="fa-solid fa-tag" /></span>
            <div>
              <span class="stat-lbl">Precio sugerido desde</span>
              <span class="stat-val">{{ fmtMoney(avgSuggestedMin) }}</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-ico violet"><i class="fa-solid fa-bullseye" /></span>
            <div>
              <span class="stat-lbl">Meta mensual</span>
              <button v-if="totalMonthlyUnitsTarget == null" class="stat-link" type="button" @click="showCostsModal = true">
                Configurar costos
              </button>
              <span v-else class="stat-val">{{ totalMonthlyUnitsTarget }} und.</span>
            </div>
          </div>
        </section>
      </div>

      <div class="list-section" v-if="!loading">
        <section class="card recipe-list-card" v-if="recipes.length">
          <header class="card-head">
            <div>
              <span class="card-chip"><i class="fa-solid fa-utensils" /> Platos ({{ recipes.length }})</span>
              <h2 class="section-title">Carta costeada</h2>
            </div>
          </header>
          <div class="recipe-list">
            <article v-for="r in recipes" :key="r._id" class="recipe-row">
              <div class="recipe-info">
                <div class="recipe-title-row">
                  <span class="recipe-avatar"><i class="fa-solid fa-utensils" /></span>
                  <h4 class="recipe-name">{{ r.name }}</h4>
                </div>
                <div class="recipe-meta">
                  <span class="cost-val">{{ fmtMoney(recipeCost(r)) }} costo</span>
                  <template v-if="r.suggestion">
                    <span class="sep">·</span>
                    <span class="sugg-badge">{{ fmtMoney(r.suggestion.suggestedMinPrice) }} – {{ fmtMoney(r.suggestion.suggestedMaxPrice) }} sugerido</span>
                    <span class="sep">·</span>
                    <span class="units-badge" v-if="r.suggestion.monthlyUnitsTarget">{{ r.suggestion.monthlyUnitsTarget }} und/mes</span>
                  </template>
                  <template v-if="r.sellingPrice">
                    <span class="sep">·</span>
                    <span :class="['marg-badge', marginLevel(currentMarginPct(r) || 0)]">{{ fmtMoney(r.sellingPrice) }} actual ({{ fmtPct(currentMarginPct(r) || 0) }})</span>
                  </template>
                  <template v-if="r.priceValidUntil">
                    <span class="sep">·</span>
                    <span class="validity-badge" :class="{ expired: (daysUntil(r.priceValidUntil) || 0) < 0 }">
                      <i class="fa-solid fa-clock" />
                      {{ (daysUntil(r.priceValidUntil) || 0) >= 0 ? `vence en ${daysUntil(r.priceValidUntil)}d` : 'precio vencido, revisa' }}
                    </span>
                  </template>
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
            <h3>Sin platos aún</h3>
            <p>Crea tu primer plato para conocer su costo real y precio sugerido.</p>
            <button class="btn primary" @click="showBuilder = true"><i class="fa-solid fa-plus" /> Crear Plato</button>
          </div>
        </section>

        <section class="card pantry-card" v-if="ingredients.length">
          <header class="card-head">
            <span class="card-chip warn"><i class="fa-solid fa-basket-shopping" /> Insumos ({{ ingredients.length }})</span>
            <button class="toggle-btn" @click="showIngredientList = !showIngredientList">
              <i class="fa-solid" :class="showIngredientList ? 'fa-chevron-up' : 'fa-chevron-down'" />
            </button>
          </header>
          <transition name="fade">
            <div v-if="showIngredientList">
              <ul class="pantry-list">
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
                <strong>Costo de producción</strong>
                <p>Escribe cuánto te cuesta hacer el plato para conocer tu costo real.</p>
              </div>
            </div>
            <div class="guide-item">
              <i class="fa-solid fa-chart-line" />
              <div>
                <strong>Precio sugerido</strong>
                <p>Calculado con un margen de contribución de 60%-70% sobre tu costo.</p>
              </div>
            </div>
            <div class="guide-item">
              <i class="fa-solid fa-bullseye" />
              <div>
                <strong>Meta de venta mensual</strong>
                <p>Cuántas unidades de ese plato necesitas vender al mes para cubrir tu parte de costos fijos.</p>
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

    <Teleport to="body">
      <Transition name="cost-modal">
        <div v-if="showCostsModal" class="modal-backdrop" @click.self="showCostsModal = false">
          <section class="costs-modal" role="dialog" aria-modal="true" aria-labelledby="costs-modal-title">
            <button class="modal-close" type="button" aria-label="Cerrar" @click="showCostsModal = false">
              <i class="fa-solid fa-xmark" />
            </button>

            <header class="modal-hero">
              <span class="modal-chip"><i class="fa-solid fa-calculator" /> Base mensual</span>
              <h2 id="costs-modal-title">Configura tus costos fijos</h2>
              <p>Con estos datos Allio convierte tus costos mensuales en una meta real de unidades por plato.</p>
            </header>

            <div class="modal-summary">
              <span>Costos fijos estimados</span>
              <strong>{{ fmtMoney(totalFixedCostEstimate) }}</strong>
              <em>Nómina: {{ fmtMoney(payrollEstimate) }}</em>
            </div>

            <div class="cost-form-grid">
              <label class="cost-field featured">
                <span><i class="fa-solid fa-users" /> Equipo del establecimiento</span>
                <div class="split-inputs">
                  <input v-model.number="costsForm.staffCount" type="number" min="0" placeholder="Personas" />
                  <input v-model.number="costsForm.averageSalary" type="number" min="0" placeholder="Promedio nómina" />
                </div>
                <small>{{ costsForm.staffCount || 0 }} personas × {{ fmtMoney(costsForm.averageSalary || 0) }}</small>
              </label>

              <label class="cost-field">
                <span><i class="fa-solid fa-house" /> Alquiler</span>
                <input v-model.number="costsForm.rent" type="number" min="0" placeholder="0.00" />
              </label>

              <label class="cost-field">
                <span><i class="fa-solid fa-bolt" /> Servicios básicos</span>
                <input v-model.number="costsForm.utilities" type="number" min="0" placeholder="Luz, agua, gas" />
              </label>

              <label class="cost-field">
                <span><i class="fa-solid fa-wifi" /> Internet</span>
                <input v-model.number="costsForm.internet" type="number" min="0" placeholder="0.00" />
              </label>

              <label class="cost-field">
                <span><i class="fa-solid fa-shield-heart" /> Seguros / permisos</span>
                <input v-model.number="costsForm.insurance" type="number" min="0" placeholder="0.00" />
              </label>

              <label class="cost-field">
                <span><i class="fa-solid fa-bullhorn" /> Marketing</span>
                <input v-model.number="costsForm.marketing" type="number" min="0" placeholder="0.00" />
              </label>

              <label class="cost-field">
                <span><i class="fa-solid fa-box-open" /> Otros costos</span>
                <input v-model.number="costsForm.other" type="number" min="0" placeholder="0.00" />
              </label>
            </div>

            <footer class="modal-actions">
              <button class="btn ghost" type="button" @click="showCostsModal = false">Cancelar</button>
              <button class="btn primary" type="button" :disabled="savingCosts" @click="saveFixedCosts">
                <i class="fa-solid" :class="savingCosts ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'" />
                {{ savingCosts ? 'Calculando...' : 'Guardar y recalcular' }}
              </button>
            </footer>
          </section>
        </div>
      </Transition>
    </Teleport>
  </AppShell>
</template>

<style scoped lang="scss">
.page {
  padding: 0 0 80px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-head {
  position: relative;
  overflow: hidden;
  margin: 0 16px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  border: 1px solid rgba($primary-dark, 0.06);
  border-radius: 28px;
  background:
    radial-gradient(circle at 88% 18%, rgba($accent, 0.24), transparent 28%),
    linear-gradient(135deg, rgba($primary, 0.16), rgba($bg, 0.9) 50%, white);
  box-shadow: 0 24px 60px rgba($primary-dark, 0.08);

  @media (max-width: 640px) {
    padding: 20px;
    align-items: stretch;
    flex-direction: column;
  }
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
  padding: 6px 11px;
  border-radius: 999px;
  background: rgba(white, 0.72);
  color: $primary;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.9px;
  text-transform: uppercase;
  box-shadow: inset 0 0 0 1px rgba($primary, 0.1);
}
.page-title {
  margin: 0;
  font-size: clamp(1.7rem, 2.4vw, 2.55rem);
  font-weight: 950;
  color: $primary-dark;
  letter-spacing: -1px;
  display: flex;
  align-items: center;
  gap: 10px;
  i { color: $primary; }
}
.page-sub {
  margin: 8px 0 0;
  max-width: 580px;
  font-size: 0.96rem;
  color: rgba($primary-dark, 0.68);
  line-height: 1.55;
}
.hero-orb {
  position: absolute;
  right: 24px;
  bottom: -34px;
  width: 128px;
  height: 128px;
  border-radius: 38px;
  display: grid;
  place-items: center;
  color: rgba(white, 0.82);
  font-size: 3rem;
  background: linear-gradient(135deg, rgba($primary, 0.9), rgba($accent, 0.78));
  transform: rotate(-10deg);
  box-shadow: 0 30px 70px rgba($primary, 0.22);
  pointer-events: none;

  @media (max-width: 640px) { display: none; }
}
@media (max-width: 374px) { .btn-text { display: none; } }

.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 14px 18px; border-radius: 12px;
  font-family: $font-principal; font-weight: 700; font-size: 0.9rem;
  border: none; cursor: pointer; transition: transform 0.15s, background 0.2s; white-space: nowrap;
  min-height: 48px;
  &:active:not(:disabled) { transform: scale(0.97); }
  &.primary { background: linear-gradient(135deg, $primary-dark, $primary); color: white; box-shadow: 0 14px 34px rgba($primary, 0.28); }
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
.stats-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
  @media (min-width: 980px) { grid-template-columns: repeat(4, 1fr); }
  @media (max-width: 560px) { grid-template-columns: 1fr; }
}
.stat-card {
  background: rgba(white, 0.9);
  border-radius: 20px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 13px;
  border: 1px solid rgba($primary-dark, 0.06);
  box-shadow: 0 16px 34px rgba($primary-dark, 0.045);
}
.stat-ico {
  width: 46px;
  height: 46px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: $primary;
  background: rgba($primary, 0.11);
  &.amber { color: darken($alert-warning, 8%); background: rgba($alert-warning, 0.14); }
  &.green { color: darken($alert-success, 8%); background: rgba($alert-success, 0.12); }
  &.violet { color: $primary-dark; background: rgba($primary-dark, 0.08); }
}
.stat-card > div { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.stat-val { font-size: 1.2rem; font-weight: 950; color: $primary-dark; font-variant-numeric: tabular-nums; letter-spacing: -0.4px; }
.stat-lbl { font-size: 0.66rem; font-weight: 850; color: $text-secondary; text-transform: uppercase; letter-spacing: 0.45px; }
.stat-link {
  appearance: none;
  border: none;
  width: fit-content;
  padding: 0;
  background: transparent;
  color: $primary;
  font: inherit;
  font-size: 1rem;
  font-weight: 950;
  letter-spacing: -0.2px;
  cursor: pointer;
  text-align: left;
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}

.loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px 0; gap: 12px; color: $text-secondary; }
.loader { width: 36px; height: 36px; border: 3px solid rgba($primary, 0.2); border-top-color: $primary; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.card {
  background: rgba(white, 0.94); border: 1px solid rgba($primary-dark, 0.06); border-radius: 24px; padding: 20px;
  margin: 0 16px; box-shadow: 0 18px 44px rgba($primary-dark, 0.055);
}
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 16px; }
.card-chip {
  display: inline-flex; align-items: center; gap: 6px; align-self: flex-start;
  background: rgba($primary, 0.08); color: $primary;
  padding: 6px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.5px;
  &.warn { background: rgba($alert-warning, 0.12); color: darken($alert-warning, 15%); }
  &.alt { background: rgba($secondary, 0.12); color: darken($secondary, 15%); }
}
.section-title {
  margin: 8px 0 0;
  color: $primary-dark;
  font-size: 1.18rem;
  font-weight: 900;
  letter-spacing: -0.35px;
}

/* ── Recipes ── */
.recipe-list-card { padding: 20px; }
.recipe-list { display: grid; gap: 10px; }
.recipe-row {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  padding: 14px; border-radius: 18px; border: 1px solid rgba($primary-dark, 0.06);
  background: linear-gradient(135deg, #ffffff, #fbfcfe); transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
  &:hover { transform: translateY(-2px); border-color: rgba($primary, 0.22); box-shadow: 0 14px 34px rgba($primary-dark, 0.07); }
  @media (max-width: 620px) { align-items: flex-start; }
}
.recipe-info { flex: 1; min-width: 0; }
.recipe-title-row { display: flex; align-items: center; gap: 10px; }
.recipe-avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: white;
  background: linear-gradient(135deg, $primary, $primary-light);
  box-shadow: 0 8px 18px rgba($primary, 0.22);
  flex-shrink: 0;
}
.recipe-name { margin: 0; font-size: 1rem; font-weight: 900; color: $primary-dark; }
.recipe-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: 0.78rem; color: $text-secondary; margin-top: 8px; padding-left: 46px;
  @media (max-width: 620px) { padding-left: 0; }
}
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
  padding: 44px 18px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;
  background: radial-gradient(circle at 50% 0%, rgba($primary, 0.1), transparent 44%);
  border-radius: 20px;
  .empty-icon { font-size: 2.5rem; color: rgba($primary, 0.35); }
  h3 { margin: 0; font-size: 1.18rem; font-weight: 900; color: $primary-dark; }
  p { margin: 0; font-size: 0.9rem; color: $text-secondary; max-width: 320px; line-height: 1.5; }
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

.sugg-badge {
  font-weight: 700; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem;
  background: rgba($alert-success, 0.1); color: darken($alert-success, 10%);
}
.units-badge {
  font-weight: 700; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem;
  background: rgba($primary, 0.1); color: $primary;
}
.validity-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-weight: 700; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem;
  background: rgba($primary-dark, 0.06); color: $text-secondary;
  &.expired { background: rgba($alert-error, 0.1); color: $alert-error; }
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
  padding: 12px;
  border-radius: 16px;
  background: rgba($primary, 0.04);
  i { width: 34px; height: 34px; border-radius: 12px; display: grid; place-items: center; font-size: 1rem; color: $primary; background: white; flex-shrink: 0; box-shadow: 0 8px 18px rgba($primary-dark, 0.05); }
  strong { display: block; font-size: 0.85rem; font-weight: 800; color: $primary-dark; margin-bottom: 2px; }
  p { margin: 0; font-size: 0.8rem; color: $text-secondary; line-height: 1.4; }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.list-section { display: flex; flex-direction: column; gap: 12px; }

/* ── Fixed costs modal ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba($primary-dark, 0.48);
  backdrop-filter: blur(12px);
}
.costs-modal {
  position: relative;
  width: min(920px, 100%);
  max-height: min(90vh, 820px);
  overflow: auto;
  border-radius: 30px;
  border: 1px solid rgba(white, 0.48);
  background:
    radial-gradient(circle at 88% 4%, rgba($accent, 0.25), transparent 28%),
    linear-gradient(135deg, white, $bg 62%, white);
  box-shadow: 0 34px 100px rgba($primary-dark, 0.28);
}
.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 14px;
  background: rgba(white, 0.82);
  color: $primary-dark;
  cursor: pointer;
}
.modal-hero {
  padding: 30px 30px 16px;
  h2 { margin: 10px 0 6px; color: $primary-dark; font-size: clamp(1.6rem, 3vw, 2.4rem); line-height: 1.05; letter-spacing: -1px; }
  p { margin: 0; max-width: 580px; color: $text-secondary; line-height: 1.55; }
}
.modal-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba($primary, 0.1);
  color: $primary;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}
.modal-summary {
  margin: 0 30px 18px;
  padding: 18px;
  display: grid;
  gap: 4px;
  border-radius: 22px;
  background: linear-gradient(135deg, $primary-dark, $primary);
  color: white;
  box-shadow: 0 20px 42px rgba($primary, 0.22);
  span { font-size: 0.72rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; opacity: 0.74; }
  strong { font-size: clamp(1.8rem, 4vw, 2.8rem); letter-spacing: -1px; }
  em { font-style: normal; color: rgba(white, 0.78); font-weight: 700; }
}
.cost-form-grid {
  padding: 0 30px 24px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  @media (max-width: 700px) { grid-template-columns: 1fr; padding-inline: 18px; }
}
.cost-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba($primary-dark, 0.07);
  background: rgba(white, 0.78);
  span { display: inline-flex; align-items: center; gap: 7px; color: $primary-dark; font-size: 0.78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.35px; }
  i { color: $primary; }
  input {
    width: 100%;
    border: 1.5px solid rgba($primary-dark, 0.09);
    border-radius: 14px;
    padding: 13px 14px;
    background: white;
    color: $primary-dark;
    font-family: $font-principal;
    font-weight: 800;
    outline: none;
    &:focus { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
  }
  small { color: $text-secondary; font-size: 0.78rem; font-weight: 700; }
  &.featured { grid-column: 1 / -1; background: linear-gradient(135deg, rgba($primary, 0.08), rgba($accent, 0.08)); }
}
.split-inputs { display: grid; grid-template-columns: 0.7fr 1fr; gap: 10px; @media (max-width: 520px) { grid-template-columns: 1fr; } }
.modal-actions {
  position: sticky;
  bottom: 0;
  padding: 16px 30px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: linear-gradient(180deg, rgba($bg, 0), rgba($bg, 0.95) 24%, rgba($bg, 0.98));
  @media (max-width: 560px) { flex-direction: column-reverse; padding-inline: 18px; .btn { justify-content: center; } }
}
.cost-modal-enter-active,
.cost-modal-leave-active { transition: opacity 0.2s ease; .costs-modal { transition: transform 0.2s ease, opacity 0.2s ease; } }
.cost-modal-enter-from,
.cost-modal-leave-to { opacity: 0; .costs-modal { opacity: 0; transform: translateY(16px) scale(0.98); } }
</style>
