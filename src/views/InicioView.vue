<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/layout/AppShell.vue'
import { useUserStore } from '@/stores/user'
import { costingService } from '@/services/costingService'
import { maintenanceService } from '@/services/maintenanceService'
import { onboardingService } from '@/services/onboardingService'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const recipes = ref<any[]>([])
const equipment = ref<any[]>([])
const tickets = ref<any[]>([])

const onboardingComplete = ref(true)
const onboardingStep = ref(1)
const onboardingTotalSteps = 6

async function loadData() {
  loading.value = true
  try {
    const [rRes, eRes, tRes, oRes] = await Promise.all([
      costingService.listRecipes().catch(() => ({ data: [] })),
      maintenanceService.listEquipment().catch(() => ({ data: [] })),
      maintenanceService.listTickets().catch(() => ({ data: [] })),
      onboardingService.getProgress().catch(() => null),
    ])
    recipes.value = (rRes as any).data || []
    equipment.value = (eRes as any).data || []
    tickets.value = (tRes as any).data || []
    if (oRes) {
      const d: any = (oRes as any).data
      onboardingComplete.value = !!d?.isComplete
      onboardingStep.value = d?.currentStep || 1
    }
  } finally {
    loading.value = false
  }
}

function goToOnboarding() {
  router.push('/onboarding')
}

const totalPlatos = computed(() => recipes.value.length)
const avgSuggestedMin = computed(() => {
  if (!recipes.value.length) return 0
  return recipes.value.reduce((s, r) => s + (r.suggestion?.suggestedMinPrice || 0), 0) / recipes.value.length
})
const expiredPrices = computed(() =>
  recipes.value.filter((r) => r.priceValidUntil && new Date(r.priceValidUntil).getTime() < Date.now()).length
)

const totalEquipos = computed(() => equipment.value.length)
const openTickets = computed(() => tickets.value.filter((t) => t.status === 'abierto' || t.status === 'en_progreso').length)

function fmtMoney(n: number) {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}

onMounted(async () => {
  document.title = 'Inicio · Allio'
  userStore.hydrate()
  await loadData()
})
</script>

<template>
  <AppShell>
    <div class="page">
      <header class="page-head">
        <h1 class="page-title">Hola, {{ userStore.name || 'Operador' }}</h1>
        <p class="page-sub">Resumen rápido de tu costeo y mantenimiento</p>
      </header>

      <div v-if="loading" class="loading-state">
        <div class="loader" />
        <p>Cargando…</p>
      </div>

      <template v-else>
        <article v-if="!onboardingComplete" class="setup-banner" @click="goToOnboarding">
          <div class="setup-icon"><i class="fa-solid fa-wand-magic-sparkles" /></div>
          <div class="setup-body">
            <h3>Termina de configurar tu negocio</h3>
            <p>
              Te faltan {{ onboardingTotalSteps - onboardingStep + 1 }} de {{ onboardingTotalSteps }} pasos.
              Con tus costos fijos y tu menú completos, Allio te da precios sugeridos y metas de venta
              mucho más precisos — te va a facilitar la vida.
            </p>
            <span class="setup-cta">Continuar configuración <i class="fa-solid fa-arrow-right" /></span>
          </div>
        </article>

        <div class="modules-grid">
        <article class="module-card" @click="router.push('/modulo/costeo')">
          <div class="module-icon costeo"><i class="fa-solid fa-sack-dollar" /></div>
          <div class="module-body">
            <h3>Costeo de Platos</h3>
            <p>{{ totalPlatos }} platos · precio sugerido promedio {{ fmtMoney(avgSuggestedMin) }}</p>
            <span v-if="expiredPrices > 0" class="module-alert">
              <i class="fa-solid fa-triangle-exclamation" /> {{ expiredPrices }} precio(s) vencido(s), revisa
            </span>
          </div>
          <i class="fa-solid fa-chevron-right module-arrow" />
        </article>

        <article class="module-card" @click="router.push('/modulo/mantenimiento')">
          <div class="module-icon mantenimiento"><i class="fa-solid fa-screwdriver-wrench" /></div>
          <div class="module-body">
            <h3>Mantenimiento</h3>
            <p>{{ totalEquipos }} equipos registrados</p>
            <span v-if="openTickets > 0" class="module-alert">
              <i class="fa-solid fa-triangle-exclamation" /> {{ openTickets }} ticket(s) abierto(s)
            </span>
          </div>
          <i class="fa-solid fa-chevron-right module-arrow" />
        </article>

        <article class="module-card supervision-card" @click="router.push('/modulo/supervision')">
          <div class="module-icon supervision"><i class="fa-solid fa-clipboard-check" /></div>
          <div class="module-body">
            <h3>Supervisión</h3>
            <p>Checklists diarios con evidencia tomada en el lugar</p>
          </div>
          <i class="fa-solid fa-chevron-right module-arrow" />
        </article>
        </div>
      </template>
    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.page { padding: 16px 16px 80px; display: flex; flex-direction: column; gap: 20px; }
.page-head { display: flex; flex-direction: column; gap: 4px; }
.page-title { margin: 0; font-size: 1.4rem; font-weight: 900; color: $text; }
.page-sub { margin: 0; font-size: 0.85rem; color: $text-secondary; }

.loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px 0; gap: 12px; color: $text-secondary; }
.loader { width: 36px; height: 36px; border: 3px solid rgba($primary, 0.2); border-top-color: $primary; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.setup-banner {
  display: grid; grid-template-columns: 56px 1fr; align-items: center; gap: 14px;
  background: linear-gradient(135deg, $primary-dark, darken($primary-dark, 6%));
  border-radius: $radius-lg; padding: 20px; cursor: pointer;
  box-shadow: 0 8px 24px rgba($primary-dark, 0.2);
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba($primary-dark, 0.28); }
}
.setup-icon {
  width: 56px; height: 56px; border-radius: $radius-md;
  background: linear-gradient(135deg, $accent, darken($accent, 10%));
  display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: white;
  flex-shrink: 0;
}
.setup-body {
  h3 { margin: 0 0 4px; font-size: 1.05rem; font-weight: 800; color: white; }
  p { margin: 0; font-size: 0.82rem; color: rgba(255,255,255,0.75); line-height: 1.45; }
}
.setup-cta {
  display: inline-flex; align-items: center; gap: 6px; margin-top: 10px;
  font-size: 0.82rem; font-weight: 800; color: $accent-light;
}

.modules-grid { display: grid; grid-template-columns: 1fr; gap: 14px;
  @media (min-width: $bp-tablet) { grid-template-columns: 1fr 1fr; }
}
.module-card {
  display: grid; grid-template-columns: 56px 1fr 20px; align-items: center; gap: 14px;
  background: $surface; border: 1px solid $border; border-radius: $radius-lg;
  padding: 20px; cursor: pointer; box-shadow: $shadow-sm; transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: translateY(-2px); box-shadow: $shadow-md; }
}
.supervision-card { display: flex; }
.supervision-card .module-body { flex: 1; }
.module-icon {
  width: 56px; height: 56px; border-radius: $radius-md;
  display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: white;
  &.costeo { background: $primary-gradient; }
  &.mantenimiento { background: linear-gradient(135deg, $accent, darken($accent, 10%)); }
  &.supervision { background: linear-gradient(135deg, $primary-dark, lighten($primary-dark, 12%)); }
}
.module-body { min-width: 0;
  h3 { margin: 0 0 4px; font-size: 1.05rem; font-weight: 800; color: $text; }
  p { margin: 0; font-size: 0.82rem; color: $text-secondary; }
}
.module-alert {
  display: inline-flex; align-items: center; gap: 6px; margin-top: 6px;
  font-size: 0.75rem; font-weight: 700; color: darken($alert-warning, 15%);
  background: $alert-warning-bg; padding: 3px 8px; border-radius: $radius-full;
}
.module-arrow { color: $text-secondary; }
</style>
