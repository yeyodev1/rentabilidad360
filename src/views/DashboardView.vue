<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import AppShell from '@/layout/AppShell.vue'
import PrintButton from '@/components/PrintButton.vue'
import DashboardSetupGuide from '@/components/DashboardSetupGuide.vue'
import { dashboardService, type KpiData, type CriticalAlert } from '@/services/dashboardService'
import { posService } from '@/services/posService'
import { costingService } from '@/services/costingService'
import { maintenanceService } from '@/services/maintenanceService'

const router = useRouter()
const userStore = useUserStore()

const kpis = ref<KpiData | null>(null)
const alerts = ref<CriticalAlert[]>([])
const loading = ref(true)
const alertsExpanded = ref(false)
const connectError = ref(false)

const connections = ref({ pos: false, recipes: false, equipment: false })

async function checkConnections() {
  try {
    const [posRes, recipesRes, eqRes] = await Promise.all([
      posService.getConnections().then(r => (r.data as any)?.length > 0).catch(() => false),
      costingService.listRecipes().then(r => (r.data as any)?.length > 0).catch(() => false),
      maintenanceService.listEquipment().then(r => (r.data as any)?.length > 0).catch(() => false),
    ])
    connections.value = { pos: posRes, recipes: recipesRes, equipment: eqRes }
  } catch {
    // no-op
  }
}

const hasData = ref(false)

async function loadData() {
  try {
    const res = await dashboardService.getDashboardData()
    kpis.value = res.data.kpis
    alerts.value = res.data.alerts
    hasData.value = true
    connectError.value = false
  } catch {
    hasData.value = false
    connectError.value = true
    await checkConnections()
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  userStore.hydrate()
  await loadData()
})

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function arcsaColor(status: string): string {
  if (status === 'green') return '#10b981'
  if (status === 'yellow') return '#f59e0b'
  return '#ef4444'
}

function arcsaLabel(status: string): string {
  if (status === 'green') return 'Cumplimiento óptimo'
  if (status === 'yellow') return 'Cumplimiento parcial'
  return 'Incumplimiento crítico'
}

function navigateTo(path: string) {
  router.push(path)
}

function alertRoute(type: string): string {
  if (type === 'checklist') return '/modulo/checklists'
  if (type === 'maintenance') return '/modulo/mantenimiento'
  if (type === 'margin') return '/modulo/costeo'
  if (type === 'weak_hours') return '/modulo/horarios/optimizacion'
  return '#'
}

async function retry() {
  loading.value = true
  connectError.value = false
  await loadData()
}
</script>

<template>
  <AppShell>
    <div class="dashboard">
      <div v-if="loading" class="loading-state">
        <div class="loader" />
        <p>Cargando dashboard...</p>
      </div>

      <template v-else-if="connectError && !hasData">
        <div class="page-head">
          <h1 class="page-title">Dashboard</h1>
        </div>

        <div class="connect-prompt">
          <div class="cp-header">
            <div class="cp-icon"><i class="fa-solid fa-cloud-arrow-down" /></div>
            <h2 class="cp-title">Conecta tus datos</h2>
            <p class="cp-desc">No pudimos obtener datos del servidor. Conecta tus fuentes para ver métricas reales de tu restaurante.</p>
          </div>

          <div class="cp-steps">
            <div class="cp-step" :class="{ done: connections.pos }">
              <div class="cp-step-status"><i :class="connections.pos ? 'fa-solid fa-circle-check' : 'fa-solid fa-plug'" /></div>
              <div class="cp-step-body">
                <strong>Conectar POS</strong>
                <span>Sincroniza tus ventas en tiempo real</span>
              </div>
              <button v-if="!connections.pos" class="cp-step-cta" @click="navigateTo('/settings/integrations')">Ir</button>
              <span v-else class="cp-step-done">Conectado</span>
            </div>
            <div class="cp-step" :class="{ done: connections.recipes }">
              <div class="cp-step-status"><i :class="connections.recipes ? 'fa-solid fa-circle-check' : 'fa-solid fa-utensils'" /></div>
              <div class="cp-step-body">
                <strong>Registrar recetas</strong>
                <span>Agrega tus platos para calcular márgenes</span>
              </div>
              <button v-if="!connections.recipes" class="cp-step-cta" @click="navigateTo('/modulo/costeo')">Ir</button>
              <span v-else class="cp-step-done">Completado</span>
            </div>
            <div class="cp-step" :class="{ done: connections.equipment }">
              <div class="cp-step-status"><i :class="connections.equipment ? 'fa-solid fa-circle-check' : 'fa-solid fa-screwdriver-wrench'" /></div>
              <div class="cp-step-body">
                <strong>Inventariar equipos</strong>
                <span>Registra tu maquinaria de cocina</span>
              </div>
              <button v-if="!connections.equipment" class="cp-step-cta" @click="navigateTo('/modulo/mantenimiento')">Ir</button>
              <span v-else class="cp-step-done">Completado</span>
            </div>
          </div>

          <button class="cp-retry" @click="retry"><i class="fa-solid fa-rotate" /> Intentar de nuevo</button>
        </div>
      </template>

      <template v-else>
        <div class="page-head">
          <h1 class="page-title">Dashboard</h1>
          <PrintButton title="Dashboard - Rentabilidad360" />
        </div>

        <DashboardSetupGuide />

        <section v-if="alerts.length" class="alert-stack">
          <div class="alert-head">
            <i class="fa-solid fa-bell" />
            <span>Alertas activas</span>
          </div>
          <div v-for="(alert, i) in (alertsExpanded ? alerts : alerts.slice(0, 2))" :key="i"
            :class="['alert-card', alert.severity]" @click="navigateTo(alertRoute(alert.type))">
            <div class="alert-icon">
              <i v-if="alert.type === 'checklist'" class="fa-solid fa-clipboard-list" />
              <i v-else-if="alert.type === 'maintenance'" class="fa-solid fa-screwdriver-wrench" />
              <i v-else-if="alert.type === 'margin'" class="fa-solid fa-chart-line" />
              <i v-else class="fa-solid fa-clock" />
            </div>
            <div class="alert-body">
              <strong>{{ alert.title }}</strong>
              <p>{{ alert.message }}</p>
            </div>
            <i class="fa-solid fa-chevron-right alert-arrow" />
          </div>
          <button v-if="alerts.length > 2" class="alert-toggle" @click.stop="alertsExpanded = !alertsExpanded">
            {{ alertsExpanded ? 'Mostrar menos' : `+${alerts.length - 2} alertas más` }}
            <i :class="['fa-solid', alertsExpanded ? 'fa-chevron-up' : 'fa-chevron-down']" />
          </button>
        </section>

        <section class="kpi-grid" v-if="kpis">
          <div class="kpi-card highlight" @click="navigateTo('/modulo/costeo')">
            <div class="kpi-header">
              <span class="kpi-label"><i class="fa-solid fa-money-bill-wave" /> Ventas Hoy</span>
              <span class="kpi-trend up"><i class="fa-solid fa-arrow-trend-up" /> +12%</span>
            </div>
            <span class="kpi-value">{{ formatCurrency(kpis.todaySales) }}</span>
            <span class="kpi-sub">Acumulado del día</span>
          </div>
          <div class="kpi-card" @click="navigateTo('/modulo/costeo')">
            <div class="kpi-header">
              <span class="kpi-label"><i class="fa-solid fa-coins" /> Utilidad</span>
            </div>
            <span :class="['kpi-value', kpis.estimatedProfit >= 0 ? 'positive' : 'negative']">{{ formatCurrency(kpis.estimatedProfit) }}</span>
            <span class="kpi-sub">Margen neto del día</span>
          </div>
          <div class="kpi-card" @click="navigateTo('/modulo/costeo')">
            <div class="kpi-header">
              <span class="kpi-label"><i class="fa-solid fa-receipt" /> Ticket Prom.</span>
            </div>
            <span class="kpi-value">{{ formatCurrency(kpis.averageTicket) }}</span>
            <span class="kpi-sub">Por transacción</span>
          </div>
          <div class="kpi-card" @click="navigateTo('/modulo/sanitario')">
            <div class="kpi-header">
              <span class="kpi-label"><i class="fa-solid fa-shield-halved" /> ARCSA</span>
            </div>
            <div class="arcsa-display">
              <div class="arcsa-light" :style="{ background: arcsaColor(kpis.arcsaStatus) }" />
              <span class="arcsa-label">{{ arcsaLabel(kpis.arcsaStatus) }}</span>
            </div>
          </div>
          <div class="kpi-card" @click="navigateTo('/modulo/costeo')">
            <div class="kpi-header">
              <span class="kpi-label"><i class="fa-solid fa-bullseye" /> Punto de Equilibrio</span>
            </div>
            <div class="pe-display">
              <div class="pe-thermometer">
                <div class="pe-fill" :style="{ width: kpis.breakEven.units > 0 ? Math.min(100, (kpis.todaySales / kpis.breakEven.currency) * 100) + '%' : '0%' }" />
              </div>
              <div class="pe-stats">
                <span class="pe-current">{{ formatCurrency(kpis.todaySales) }}</span>
                <span class="pe-target">Meta: {{ formatCurrency(kpis.breakEven.currency) }}</span>
              </div>
            </div>
          </div>
          <div class="kpi-card" @click="navigateTo('/modulo/mantenimiento')">
            <div class="kpi-header">
              <span class="kpi-label"><i class="fa-solid fa-screwdriver-wrench" /> Equipos Críticos</span>
            </div>
            <span class="kpi-value error-color">{{ kpis.criticalEquipment }}</span>
            <span class="kpi-sub">Requieren mantenimiento</span>
          </div>
          <div class="kpi-card wide" @click="navigateTo('/modulo/horarios/optimizacion')">
            <div class="kpi-header">
              <span class="kpi-label"><i class="fa-solid fa-clock" /> Horas Débiles</span>
            </div>
            <div class="weak-hours">
              <div v-for="(h, i) in kpis.weakHours" :key="i" class="weak-hour-item">
                <i class="fa-solid fa-triangle-exclamation warning-color" />
                <span>{{ h }}</span>
              </div>
              <span v-if="!kpis.weakHours.length" class="kpi-sub">Sin horas débiles detectadas</span>
            </div>
          </div>
        </section>

        <section class="quick-actions">
          <div class="qa-label"><i class="fa-solid fa-link" /> Accesos directos</div>
          <div class="qa-grid">
            <button class="action-btn" @click="navigateTo('/modulo/checklists')"><i class="fa-solid fa-clipboard-check" /> Checklists</button>
            <button class="action-btn" @click="navigateTo('/modulo/mantenimiento')"><i class="fa-solid fa-screwdriver-wrench" /> Mantenimiento</button>
            <button class="action-btn" @click="navigateTo('/modulo/costeo')"><i class="fa-solid fa-sack-dollar" /> Costeo</button>
            <button class="action-btn" @click="navigateTo('/modulo/sanitario')"><i class="fa-solid fa-shield-virus" /> Sanitario</button>
            <button class="action-btn" @click="navigateTo('/modulo/horarios')"><i class="fa-solid fa-calendar-week" /> Horarios</button>
            <button class="action-btn" @click="navigateTo('/settings/integrations')"><i class="fa-solid fa-plug" /> Integraciones</button>
          </div>
        </section>
      </template>
    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.dashboard {
  padding: 24px 16px 80px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
  @media (min-width: $bp-tablet) { padding: 32px 24px 40px; }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 16px;
  color: $text-secondary;
}
.loader {
  width: 36px; height: 36px;
  border: 3px solid rgba($primary, 0.15);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-title {
  font-family: $font-secondary;
  font-size: 1.35rem;
  font-weight: 800;
  color: $text;
}

/* Connect prompt */
.connect-prompt {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: white;
  border-radius: 24px;
  padding: 40px 24px;
  border: 1.5px solid rgba($primary, 0.12);
  align-items: center;
  text-align: center;
}
.cp-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: 400px;
}
.cp-icon {
  width: 60px; height: 60px;
  border-radius: 18px;
  background: rgba($primary, 0.1);
  color: $primary;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem;
}
.cp-title { margin: 0; font-size: 1.25rem; font-weight: 800; color: $primary-dark; }
.cp-desc { margin: 0; font-size: 0.9rem; color: $text-secondary; line-height: 1.6; }

.cp-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 400px;
}
.cp-step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba($primary-dark, 0.02);
  border: 1px solid rgba($primary-dark, 0.06);
  border-radius: 14px;
  text-align: left;
  &.done { background: rgba($alert-success, 0.04); border-color: rgba($alert-success, 0.15); }
}
.cp-step-status {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem;
  color: $text-secondary;
  background: rgba($primary-dark, 0.04);
  flex-shrink: 0;
  .cp-step.done & { color: $alert-success; background: rgba($alert-success, 0.1); }
}
.cp-step-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  strong { font-size: 0.85rem; font-weight: 700; color: $primary-dark; }
  span { font-size: 0.74rem; color: $text-secondary; }
}
.cp-step-cta {
  padding: 6px 14px;
  border-radius: 8px;
  border: none;
  background: $primary;
  color: white;
  font-family: $font-principal;
  font-weight: 700;
  font-size: 0.78rem;
  cursor: pointer;
  white-space: nowrap;
}
.cp-step-done {
  font-size: 0.75rem;
  font-weight: 700;
  color: $alert-success;
  white-space: nowrap;
}
.cp-retry {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 12px;
  border: 1.5px solid rgba($primary, 0.2);
  background: transparent;
  color: $primary;
  font-family: $font-principal;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: rgba($primary, 0.04); border-color: $primary; }
}

/* ── Alertas ── */
.alert-stack { display: flex; flex-direction: column; gap: 8px; }
.alert-head {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: $text-secondary;
  i { color: $alert-error; }
}
.alert-card {
  display: flex; gap: 10px; padding: 12px; border-radius: $radius-md;
  align-items: flex-start; cursor: pointer; transition: all 0.15s;
  .alert-arrow {
    margin-left: auto; font-size: 0.7rem;
    color: rgba($primary-dark, 0.15); align-self: center;
    transition: all 0.15s; flex-shrink: 0;
  }
  &:hover .alert-arrow { color: $primary; transform: translateX(3px); }
  &.critical { background: $alert-error-bg; border: 1px solid rgba($alert-error, 0.2); &:hover { border-color: rgba($alert-error, 0.4); box-shadow: 0 2px 8px rgba($alert-error, 0.08); } }
  &.warning { background: $alert-warning-bg; border: 1px solid rgba($alert-warning, 0.2); &:hover { border-color: rgba($alert-warning, 0.4); box-shadow: 0 2px 8px rgba($alert-warning, 0.08); } }
}
.alert-icon {
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  border-radius: $radius-sm; font-size: 0.8rem; flex-shrink: 0;
  .alert-card.critical & { background: rgba($alert-error, 0.12); color: $alert-error; }
  .alert-card.warning & { background: rgba($alert-warning, 0.12); color: $accent-dark; }
}
.alert-body { flex: 1; min-width: 0;
  strong { font-size: 0.8rem; font-weight: 700; color: $text; display: block; }
  p { font-size: 0.76rem; color: $text-secondary; margin: 2px 0 0; line-height: 1.4; }
}
.alert-toggle {
  background: transparent; border: none; font-family: $font-principal;
  font-weight: 600; font-size: 0.76rem; color: $primary;
  cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 8px; border-radius: $radius-sm;
  &:hover { background: $primary-bg; }
}

/* ── KPIs ── */
.kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.kpi-card {
  background: $surface; border-radius: $radius-lg; padding: 14px;
  display: flex; flex-direction: column; gap: 6px;
  box-shadow: $shadow-sm; border: 1px solid $border;
  cursor: pointer; transition: all 0.15s;
  &:hover { border-color: $primary; box-shadow: $shadow-md; transform: translateY(-1px); }
  &.highlight { border-color: rgba($primary, 0.2); background: linear-gradient(135deg, $primary-bg, $surface); &:hover { border-color: $primary; } }
  &.wide { grid-column: 1 / -1; }
}
.kpi-header { display: flex; align-items: center; justify-content: space-between; }
.kpi-label {
  font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.3px; color: $text-secondary;
  display: inline-flex; align-items: center; gap: 6px;
  i { color: $primary; }
}
.kpi-trend { font-size: 0.65rem; font-weight: 700; display: inline-flex; align-items: center; gap: 3px; &.up { color: $alert-success; } &.down { color: $alert-error; } }
.kpi-value {
  font-size: 1.5rem; font-weight: 800; color: $text; font-variant-numeric: tabular-nums;
  &.positive { color: $alert-success; } &.negative { color: $alert-error; }
}
.error-color { color: $alert-error; }
.warning-color { color: $alert-warning; }
.kpi-sub { font-size: 0.68rem; color: $text-secondary; }
.pe-display { display: flex; flex-direction: column; gap: 8px; }
.pe-thermometer { height: 6px; background: $border; border-radius: $radius-full; overflow: hidden; }
.pe-fill { height: 100%; background: $primary-gradient; border-radius: $radius-full; transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.pe-stats { display: flex; justify-content: space-between; font-size: 0.76rem; }
.pe-current { font-weight: 800; color: $text; }
.pe-target { color: $text-secondary; }
.arcsa-display { display: flex; align-items: center; gap: 8px; }
.arcsa-light { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 3px rgba(0,0,0,0.04); }
.arcsa-label { font-size: 0.78rem; font-weight: 600; color: $text; }
.weak-hours { display: flex; flex-direction: column; gap: 4px; }
.weak-hour-item { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 600; color: $text; i { font-size: 0.7rem; } }

/* ── Accesos directos ── */
.quick-actions { display: flex; flex-direction: column; gap: 10px; }
.qa-label {
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: $text-secondary;
  display: inline-flex; align-items: center; gap: 6px;
  i { color: $primary; }
}
.qa-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.action-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px; border-radius: $radius-md;
  background: $surface; border: 1.5px solid $border;
  font-family: $font-principal; font-weight: 700; font-size: 0.78rem;
  color: $text; cursor: pointer; transition: all 0.15s;
  i { color: $primary; font-size: 0.85rem; }
  &:hover { border-color: $primary; background: $primary-bg; color: $primary; }
  &:active { transform: scale(0.97); }
}
</style>