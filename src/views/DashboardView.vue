<script setup lang="ts">
import { useOnboardingStore, PAIN_POINTS } from '@/stores/onboarding'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import RegisterModal from './RegisterModal.vue'
import DemoBadge from '@/components/DemoBadge.vue'
import TiendaContextBar from '@/components/TiendaContextBar.vue'
import AppShell from '@/layout/AppShell.vue'
import { useUIStore } from '@/stores/ui'

const store = useOnboardingStore()
const userStore = useUserStore()
const router = useRouter()
const ui = useUIStore()
const showModal = ref(false)
const entered = ref(false)

onMounted(() => {
  userStore.hydrate()
  if (!store.results) {
    router.replace('/diagnostico')
    return
  }
  requestAnimationFrame(() => {
    entered.value = true
  })
})

function formatCurrency(value: number): string {
  return `${store.currencySymbol}${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const healthIcon = computed(() => {
  if (!store.results) return 'fa-solid fa-circle-question'
  if (store.results.healthStatus === 'green') return 'fa-solid fa-circle-check'
  if (store.results.healthStatus === 'yellow') return 'fa-solid fa-triangle-exclamation'
  return 'fa-solid fa-circle-xmark'
})

const recommendedModules = computed(() => {
  if (!store.painPoints.length) return PAIN_POINTS
  return [
    ...PAIN_POINTS.filter((p) => store.painPoints.includes(p.id)),
    ...PAIN_POINTS.filter((p) => !store.painPoints.includes(p.id)),
  ]
})

function openModule(route: string) {
  router.push(route)
}

async function logout() {
  const ok = await ui.requestConfirm({
    title: '¿Cerrar sesión?',
    message: 'Conservaremos tu diagnóstico actual en este dispositivo.',
    confirmLabel: 'Sí, cerrar sesión',
    cancelLabel: 'Quedarme',
    tone: 'danger',
    icon: 'fa-solid fa-right-from-bracket',
  })
  if (!ok) return
  userStore.clear()
  ui.showToast({
    title: 'Sesión cerrada',
    tone: 'success',
    icon: 'fa-solid fa-door-closed',
  })
}

function goLogin() {
  router.push('/login')
}

async function newAnalysis() {
  const ok = await ui.requestConfirm({
    title: '¿Reiniciar diagnóstico?',
    message: 'Se borrarán los datos del onboarding actual. Los datos del usuario y módulos no se afectan.',
    confirmLabel: 'Sí, empezar de nuevo',
    cancelLabel: 'Cancelar',
    tone: 'danger',
    icon: 'fa-solid fa-rotate-left',
  })
  if (!ok) return
  store.reset()
  ui.showToast({
    title: 'Diagnóstico reiniciado',
    message: 'Llena los pasos para generar tu próximo diagnóstico.',
    tone: 'info',
  })
  router.push('/')
}
</script>

<template>
  <AppShell>
    <div v-if="store.results" :class="['dashboard', { entered }]">
      <header class="dash-head">
        <div>
          <h1 class="dash-title"><i class="fa-solid fa-chart-pie" /> Diagnóstico financiero</h1>
          <p class="dash-sub">Resultado de tu onboarding. Conserva tu semáforo y KPIs principales.</p>
        </div>
        <button v-if="!userStore.isAuthenticated" class="topbar-btn ghost" @click="goLogin">
          <i class="fa-solid fa-right-to-bracket" /> Iniciar sesión
        </button>
      </header>

      <div class="dashboard-scroll">
      <TiendaContextBar />
      <div v-if="store.primaryPain" class="pain-banner">
        <span class="pain-banner-icon"><i :class="store.primaryPain.icon" /></span>
        <div class="pain-banner-body">
          <span class="pain-banner-label">Personalizado para ti</span>
          <p class="pain-banner-text">
            Priorizamos soluciones para tu dolor:
            <strong>{{ store.primaryPain.title }}</strong>.
          </p>
        </div>
      </div>

      <div :class="['health-card', store.results.healthStatus]">
        <div class="health-icon">
          <i :class="healthIcon" />
        </div>
        <p class="health-diagnosis">{{ store.results.diagnosis }}</p>
        <div class="health-badge">
          <span class="badge-dot" />
          {{
            store.results.healthStatus === 'green' ? 'Saludable' :
            store.results.healthStatus === 'yellow' ? 'Riesgo' : 'No rentable'
          }}
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card">
          <span class="kpi-label"><i class="fa-solid fa-money-bill-trend-up" /> Ventas Mensuales</span>
          <span class="kpi-value">{{ formatCurrency(store.results.monthlySales) }}</span>
          <span class="kpi-sub">Ingresos estimados</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label"><i class="fa-solid fa-bullseye" /> Punto de Equilibrio</span>
          <span class="kpi-value">{{ store.results.breakEvenClients }}</span>
          <span class="kpi-sub">clientes / mes</span>
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card">
          <span class="kpi-label"><i class="fa-solid fa-percent" /> Margen</span>
          <span class="kpi-value" :class="store.results.profitMargin >= 0 ? 'positive' : 'negative'">
            {{ store.results.profitMargin.toFixed(1) }}%
          </span>
          <span class="kpi-sub">EBITDA / Ventas</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label"><i class="fa-solid fa-coins" /> EBITDA</span>
          <span class="kpi-value" :class="store.results.ebitda >= 0 ? 'positive' : 'negative'">
            {{ formatCurrency(store.results.ebitda) }}
          </span>
          <span class="kpi-sub">Ganancia operativa</span>
        </div>
      </div>

      <section class="modules-section">
        <div class="section-head">
          <h3 class="section-title">
            <i class="fa-solid fa-bolt" /> Módulos recomendados para ti
            <DemoBadge label="Datos demo" />
          </h3>
          <p class="section-sub">Pensados para usarse en cocina o piso del restaurante. Los contadores internos se reemplazan cuando conectes tu POS/ERP.</p>
        </div>

        <div class="modules-grid">
          <button
            v-for="m in recommendedModules"
            :key="m.id"
            :class="['module-card', { primary: store.painPoints.includes(m.id) }]"
            @click="openModule(m.route)"
          >
            <span class="module-icon"><i :class="m.icon" /></span>
            <span class="module-body">
              <span class="module-title">{{ m.ctaLabel }}</span>
              <span class="module-desc">{{ m.title }}</span>
            </span>
            <span class="module-go">
              <i class="fa-solid fa-arrow-right" />
            </span>
            <span v-if="store.painPoints.includes(m.id)" class="module-pin">
              <i class="fa-solid fa-star" /> Prioritario
            </span>
          </button>
        </div>
      </section>

      <section class="premium-section">
        <div class="premium-overlay">
          <div class="lock-icon"><i class="fa-solid fa-lock" /></div>
          <h3 class="premium-title">Desbloquea tu análisis completo</h3>
          <p class="premium-desc">Obtén gráficos, proyecciones y los módulos operativos sin restricciones.</p>
        </div>
        <div class="premium-items">
          <div class="premium-item">
            <span class="premium-item-icon"><i class="fa-solid fa-chart-column" /></span>
            <span class="premium-item-label">Gráfico de Flujo de Caja</span>
            <span class="premium-item-lock"><i class="fa-solid fa-lock" /></span>
          </div>
          <div class="premium-item">
            <span class="premium-item-icon"><i class="fa-solid fa-chart-line" /></span>
            <span class="premium-item-label">Cálculo de VAN / TIR</span>
            <span class="premium-item-lock"><i class="fa-solid fa-lock" /></span>
          </div>
          <div class="premium-item">
            <span class="premium-item-icon"><i class="fa-solid fa-screwdriver-wrench" /></span>
            <span class="premium-item-label">Mantenimiento Pro con QR</span>
            <span class="premium-item-lock"><i class="fa-solid fa-lock" /></span>
          </div>
        </div>
      </section>

      <button class="ghost-link" @click="newAnalysis">
        <i class="fa-solid fa-rotate-left" /> Hacer un nuevo diagnóstico
      </button>

      <div class="bottom-spacer" />
    </div>

    <div class="sticky-footer">
      <button class="cta-button" @click="showModal = true">
        <i class="fa-solid fa-unlock-keyhole" />
        Desbloquear Análisis 360 Gratis
        <i class="fa-solid fa-arrow-right cta-arrow" />
      </button>
    </div>

      <Teleport to="body">
        <RegisterModal :show="showModal" @close="showModal = false" />
      </Teleport>
    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.dash-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; padding: 24px 28px 0;
}
.dash-title {
  margin: 0; font-size: 1.3rem; font-weight: 800; color: $primary-dark;
  display: inline-flex; align-items: center; gap: 10px;
  i { color: $primary; }
}
.dash-sub { margin: 2px 0 0; color: $text-secondary; font-size: 0.9rem; }
.topbar-btn.ghost {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba($primary, 0.08); color: $primary;
  border: none; padding: 10px 14px; border-radius: 12px;
  font-family: $font-principal; font-weight: 700; font-size: 0.85rem;
  cursor: pointer;
  &:hover { background: rgba($primary, 0.15); }
}
@media (max-width: 720px) {
  .dash-head { padding: 18px 16px 0; }
}

.dashboard {
  min-height: auto;
  background: transparent;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);

  &.entered {
    opacity: 1;
    transform: translateY(0);
  }
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: white;
  border-bottom: 1px solid rgba($primary-dark, 0.06);
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-dot {
  width: 9px;
  height: 9px;
  background: $primary;
  border-radius: 50%;
}

.brand-text {
  font-weight: 700;
  font-size: 0.95rem;
  color: $primary-dark;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: $primary-dark;
  background: rgba($primary, 0.08);
  padding: 6px 10px;
  border-radius: 20px;

  i { color: $primary; }
}

.topbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  font-family: $font-principal;
  font-weight: 600;
  font-size: 0.85rem;
  color: $primary;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 10px;

  &.ghost:hover { background: rgba($primary, 0.08); }
}

.dashboard-scroll {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.pain-banner {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba($primary, 0.08), rgba($secondary, 0.08));
  border: 1px solid rgba($primary, 0.18);
  border-radius: 16px;
}

.pain-banner-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  color: $primary;
  border-radius: 12px;
  font-size: 1.25rem;
  box-shadow: 0 2px 8px rgba($primary, 0.12);
}

.pain-banner-body { display: flex; flex-direction: column; gap: 2px; }

.pain-banner-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
  color: $primary;
}

.pain-banner-text {
  font-size: 0.85rem;
  color: $primary-dark;
  margin: 0;
  line-height: 1.4;
}

.health-card {
  padding: 24px 20px;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;

  &.green { background: linear-gradient(135deg, #ecfdf5, #d1fae5); }
  &.yellow { background: linear-gradient(135deg, #fffbeb, #fef3c7); }
  &.red { background: linear-gradient(135deg, #fef2f2, #fee2e2); }
}

.health-icon {
  font-size: 2.2rem;

  .health-card.green & { color: $alert-success; }
  .health-card.yellow & { color: $alert-warning; }
  .health-card.red & { color: $alert-error; }
}

.health-diagnosis {
  font-size: 0.95rem;
  font-weight: 600;
  color: $primary-dark;
  line-height: 1.5;
  margin: 0;
}

.health-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 14px;
  border-radius: 20px;

  .health-card.green & { background: rgba($alert-success, 0.15); color: $alert-success; }
  .health-card.yellow & { background: rgba($alert-warning, 0.15); color: darken($alert-warning, 10%); }
  .health-card.red & { background: rgba($alert-error, 0.15); color: $alert-error; }
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;

  .health-card.green & { background: $alert-success; }
  .health-card.yellow & { background: $alert-warning; }
  .health-card.red & { background: $alert-error; }
}

.kpi-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.kpi-card {
  background: white;
  border-radius: 16px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.kpi-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: $text-secondary;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  i { color: $primary; }
}

.kpi-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: $primary-dark;
  font-variant-numeric: tabular-nums;

  &.positive { color: $alert-success; }
  &.negative { color: $alert-error; }
}

.kpi-sub { font-size: 0.7rem; color: #aaa; }

.modules-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-head { display: flex; flex-direction: column; gap: 2px; }

.section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: $primary-dark;
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  i { color: $primary; }
}

.section-sub {
  font-size: 0.78rem;
  color: $text-secondary;
  margin: 0;
}

.modules-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }

.module-card {
  position: relative;
  display: grid;
  grid-template-columns: 52px 1fr 22px;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: white;
  border: 2px solid rgba($primary-dark, 0.06);
  cursor: pointer;
  text-align: left;
  font-family: $font-principal;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:active { transform: scale(0.98); }
  &.primary {
    border-color: $primary;
    box-shadow: 0 6px 22px rgba($primary, 0.16);
    background: linear-gradient(180deg, rgba($primary, 0.04), white);

    .module-icon { background: $primary; color: white; }
  }
}

.module-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba($primary, 0.08);
  color: $primary;
  font-size: 1.35rem;
}

.module-body { display: flex; flex-direction: column; gap: 2px; }
.module-title { font-size: 0.95rem; font-weight: 700; color: $primary-dark; }
.module-desc { font-size: 0.75rem; color: $text-secondary; }
.module-go { color: $primary; font-size: 1rem; }

.module-pin {
  position: absolute;
  top: -10px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: $primary;
  color: white;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  padding: 3px 8px;
  border-radius: 10px;
}

.premium-section {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.premium-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 2;
  padding: 24px;
  text-align: center;
}

.lock-icon { font-size: 1.6rem; color: $primary; }
.premium-title { font-size: 1.1rem; font-weight: 700; color: $primary-dark; margin: 0; }
.premium-desc { font-size: 0.8rem; color: $text-secondary; margin: 0; }

.premium-items {
  filter: blur(6px);
  pointer-events: none;
  user-select: none;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 140px;
}

.premium-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: rgba($primary-dark, 0.03);
  border-radius: 12px;
}

.premium-item-icon { font-size: 1.1rem; color: $primary; }
.premium-item-label { flex: 1; font-size: 0.85rem; font-weight: 600; color: $primary-dark; }
.premium-item-lock { font-size: 0.85rem; opacity: 0.5; }

.ghost-link {
  align-self: center;
  background: none;
  border: none;
  color: $primary;
  font-weight: 700;
  font-size: 0.85rem;
  font-family: $font-principal;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 8px;
}

.bottom-spacer { height: 80px; }

.sticky-footer {
  position: sticky;
  bottom: 0;
  padding: 16px 20px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  background: linear-gradient(to top, #f8f9fb 60%, transparent);
}

.cta-button {
  width: 100%;
  padding: 18px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, $primary, #1678b0);
  color: white;
  font-size: 1rem;
  font-weight: 700;
  font-family: $font-principal;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 20px rgba($primary, 0.35);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  -webkit-tap-highlight-color: transparent;

  &:active { transform: scale(0.97); }
}

.cta-arrow { font-size: 1rem; }
</style>
