<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import AppShell from '@/layout/AppShell.vue'
import { dashboardService, type KpiData, type CriticalAlert } from '@/services/dashboardService'

const router = useRouter()
const userStore = useUserStore()

const kpis = ref<KpiData | null>(null)
const alerts = ref<CriticalAlert[]>([])
const loading = ref(true)
const alertsExpanded = ref(false)

const demoAlerts: CriticalAlert[] = [
  { type: 'checklist', severity: 'critical', title: 'Falta de Checklist', message: 'No se ha llenado el checklist de limpieza del área de Cocina hoy' },
  { type: 'maintenance', severity: 'critical', title: 'Equipos en Riesgo', message: 'Mantenimiento pendiente: Freidora Industrial requiere revisión técnica inmediata' },
  { type: 'margin', severity: 'critical', title: 'Caída de Margen', message: 'Desviación detectada: El margen bruto consolidado cayó un 6% el día de hoy' },
  { type: 'weak_hours', severity: 'warning', title: 'Horas Débiles', message: 'Ventas bajas detectadas en la franja horaria de 3:00 PM – 5:00 PM' },
]

const demoKpis: KpiData = {
  todaySales: 2845.50,
  estimatedProfit: 876.30,
  averageTicket: 18.75,
  breakEven: { units: 142, currency: 2662.50 },
  arcsaStatus: 'yellow',
  criticalEquipment: 3,
  weakHours: ['3:00 PM – 5:00 PM', '8:00 PM – 9:00 PM'],
}

onMounted(async () => {
  userStore.hydrate()
  try {
    const res = await dashboardService.getDashboardData()
    kpis.value = res.data.kpis
    alerts.value = res.data.alerts
  } catch {
    kpis.value = demoKpis
    alerts.value = demoAlerts
  } finally {
    loading.value = false
  }
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
</script>

<template>
  <AppShell>
    <div class="dashboard">
      <div v-if="loading" class="loading-state">
        <div class="loader" />
        <p>Cargando dashboard...</p>
      </div>

      <template v-else>
        <section class="alert-stack">
          <div v-for="(alert, i) in (alertsExpanded ? alerts : alerts.slice(0, 2))" :key="i"
            :class="['alert-card', alert.severity]">
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
          </div>
          <button v-if="alerts.length > 2" class="alert-toggle" @click="alertsExpanded = !alertsExpanded">
            {{ alertsExpanded ? 'Mostrar menos' : `+${alerts.length - 2} alertas más` }}
            <i :class="['fa-solid', alertsExpanded ? 'fa-chevron-up' : 'fa-chevron-down']" />
          </button>
        </section>

        <section class="kpi-grid" v-if="kpis">
          <div class="kpi-card highlight">
            <div class="kpi-header">
              <span class="kpi-label"><i class="fa-solid fa-money-bill-wave" /> Ventas Hoy</span>
              <span class="kpi-trend up"><i class="fa-solid fa-arrow-trend-up" /> +12%</span>
            </div>
            <span class="kpi-value">{{ formatCurrency(kpis.todaySales) }}</span>
            <span class="kpi-sub">Acumulado del día</span>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-label"><i class="fa-solid fa-coins" /> Utilidad Estimada</span>
            </div>
            <span :class="['kpi-value', kpis.estimatedProfit >= 0 ? 'positive' : 'negative']">
              {{ formatCurrency(kpis.estimatedProfit) }}
            </span>
            <span class="kpi-sub">Margen neto del día</span>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-label"><i class="fa-solid fa-receipt" /> Ticket Promedio</span>
            </div>
            <span class="kpi-value">{{ formatCurrency(kpis.averageTicket) }}</span>
            <span class="kpi-sub">Por transacción</span>
          </div>

          <div class="kpi-card">
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

          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-label"><i class="fa-solid fa-shield-halved" /> Estado ARCSA</span>
            </div>
            <div class="arcsa-display">
              <div class="arcsa-light" :style="{ background: arcsaColor(kpis.arcsaStatus) }" />
              <span class="arcsa-label">{{ arcsaLabel(kpis.arcsaStatus) }}</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-label"><i class="fa-solid fa-screwdriver-wrench" /> Equipos Críticos</span>
            </div>
            <span class="kpi-value" style="color: $alert-error">{{ kpis.criticalEquipment }}</span>
            <span class="kpi-sub">Requieren mantenimiento</span>
          </div>

          <div class="kpi-card wide">
            <div class="kpi-header">
              <span class="kpi-label"><i class="fa-solid fa-clock" /> Horas Débiles</span>
            </div>
            <div class="weak-hours">
              <div v-for="(h, i) in kpis.weakHours" :key="i" class="weak-hour-item">
                <i class="fa-solid fa-triangle-exclamation" style="color: $alert-warning" />
                <span>{{ h }}</span>
              </div>
              <span v-if="!kpis.weakHours.length" class="kpi-sub">Sin horas débiles detectadas</span>
            </div>
          </div>
        </section>

        <section class="quick-actions">
          <button class="action-btn" @click="router.push('/modulo/checklists')">
            <i class="fa-solid fa-clipboard-check" /> Checklist diario
          </button>
          <button class="action-btn" @click="router.push('/modulo/mantenimiento')">
            <i class="fa-solid fa-screwdriver-wrench" /> Mantenimiento
          </button>
          <button class="action-btn" @click="router.push('/modulo/costeo')">
            <i class="fa-solid fa-sack-dollar" /> Costeo
          </button>
          <button class="action-btn" @click="router.push('/modulo/horarios')">
            <i class="fa-solid fa-calendar-week" /> Horarios
          </button>
        </section>
      </template>
    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.dashboard {
  padding: 16px; display: flex; flex-direction: column; gap: 16px;
  max-width: 640px; margin: 0 auto; width: 100%;
}

.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 0; gap: 16px; color: $text-secondary; }
.loader { width: 40px; height: 40px; border: 3px solid rgba($primary, 0.2); border-top-color: $primary; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.alert-stack { display: flex; flex-direction: column; gap: 8px; }
.alert-card {
  display: flex; gap: 12px; padding: 12px 14px; border-radius: 12px;
  align-items: flex-start;
  &.critical { background: linear-gradient(135deg, #fef2f2, #fee2e2); border: 1px solid #fecaca; }
  &.warning { background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 1px solid #fde68a; }
}
.alert-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 10px; font-size: 0.85rem; flex-shrink: 0;
  .alert-card.critical & { background: rgba($alert-error, 0.15); color: $alert-error; }
  .alert-card.warning & { background: rgba($alert-warning, 0.15); color: darken($alert-warning, 10%); }
}
.alert-body { flex: 1; min-width: 0;
  strong { font-size: 0.82rem; font-weight: 700; color: $primary-dark; display: block; }
  p { font-size: 0.78rem; color: $text-secondary; margin: 2px 0 0; line-height: 1.4; }
}
.alert-toggle {
  background: transparent; border: none; font-family: $font-principal; font-weight: 600; font-size: 0.78rem;
  color: $primary; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
  margin-top: 4px; padding: 4px 8px; border-radius: 8px;
  &:hover { background: rgba($primary, 0.08); }
}

.kpi-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
.kpi-card {
  background: white; border-radius: 14px; padding: 16px;
  display: flex; flex-direction: column; gap: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  &.highlight { border: 1.5px solid rgba($primary, 0.2); background: linear-gradient(135deg, rgba($primary, 0.04), white); }
  &.wide { grid-column: 1 / -1; }
}
.kpi-header { display: flex; align-items: center; justify-content: space-between; }
.kpi-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: $text-secondary; display: inline-flex; align-items: center; gap: 6px; i { color: $primary; } }
.kpi-trend { font-size: 0.68rem; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;
  &.up { color: $alert-success; }
  &.down { color: $alert-error; }
}
.kpi-value { font-size: 1.6rem; font-weight: 800; color: $primary-dark; font-variant-numeric: tabular-nums;
  &.positive { color: $alert-success; }
  &.negative { color: $alert-error; }
}
.kpi-sub { font-size: 0.7rem; color: $text-secondary; }

.pe-display { display: flex; flex-direction: column; gap: 8px; }
.pe-thermometer { height: 8px; background: rgba($primary-dark, 0.08); border-radius: 99px; overflow: hidden; }
.pe-fill { height: 100%; background: linear-gradient(90deg, $primary, $secondary); border-radius: 99px; transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.pe-stats { display: flex; justify-content: space-between; font-size: 0.78rem; }
.pe-current { font-weight: 800; color: $primary-dark; }
.pe-target { color: $text-secondary; }

.arcsa-display { display: flex; align-items: center; gap: 10px; }
.arcsa-light { width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 0 4px rgba(0,0,0,0.06); }
.arcsa-label { font-size: 0.82rem; font-weight: 600; color: $primary-dark; }

.weak-hours { display: flex; flex-direction: column; gap: 6px; }
.weak-hour-item { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 600; color: $primary-dark; i { font-size: 0.75rem; } }

.quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.action-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px; border-radius: 12px;
  background: white; border: 1.5px solid rgba($primary-dark, 0.08);
  font-family: $font-principal; font-weight: 700; font-size: 0.8rem; color: $primary-dark;
  cursor: pointer; transition: all 0.2s;
  i { color: $primary; font-size: 0.9rem; }
  &:hover { border-color: $primary; background: rgba($primary, 0.04); }
  &:active { transform: scale(0.97); }
}
</style>
