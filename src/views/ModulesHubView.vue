<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useOnboardingStore, PAIN_POINTS, type PainPointId } from '@/stores/onboarding'
import { useUIStore } from '@/stores/ui'
import AppShell from '@/layout/AppShell.vue'
import DemoBanner from '@/components/DemoBanner.vue'
import DemoBadge from '@/components/DemoBadge.vue'
import TiendaContextBar from '@/components/TiendaContextBar.vue'

const router = useRouter()
const userStore = useUserStore()
const store = useOnboardingStore()
const ui = useUIStore()

onMounted(() => {
  userStore.hydrate()
  document.title = 'Panel · Rentabilidad360'
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
})

const firstName = computed(() => (userStore.name || '').split(' ')[0] || '')

const moduleStats: Record<PainPointId, { label: string; value: string; trend: string; trendUp?: boolean }> = {
  sanitary: { label: 'Cumplimiento hoy', value: '4 / 6', trend: '+2 vs ayer', trendUp: true },
  maintenance: { label: 'Equipos en alerta', value: '1', trend: 'Freidora vencida', trendUp: false },
  costing: { label: 'Margen receta tipo', value: '21.4%', trend: '+1.2 pp', trendUp: true },
  schedule: { label: 'Horas desperdicio', value: '6 h', trend: 'Mar 15-17h', trendUp: false },
}

const sortedModules = computed(() => {
  if (!store.painPoints.length) return PAIN_POINTS
  return [
    ...PAIN_POINTS.filter((p) => store.painPoints.includes(p.id)),
    ...PAIN_POINTS.filter((p) => !store.painPoints.includes(p.id)),
  ]
})

const topStats = computed(() => {
  const margin = store.results ? `${store.results.profitMargin.toFixed(1)}%` : '21.4%'
  const sales = store.results
    ? `${store.currencySymbol}${store.results.monthlySales.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : '$12,480'
  const status = store.results?.healthStatus || 'yellow'
  const statusLabel = status === 'green' ? 'Saludable' : status === 'yellow' ? 'En riesgo' : 'Crítico'
  return [
    { icon: 'fa-solid fa-money-bill-trend-up', label: 'Ventas estimadas / mes', value: sales, accent: 'primary' },
    { icon: 'fa-solid fa-percent', label: 'Margen actual', value: margin, accent: 'secondary' },
    { icon: 'fa-solid fa-stethoscope', label: 'Estado financiero', value: statusLabel, accent: status },
    { icon: 'fa-solid fa-bell', label: 'Alertas activas', value: '3', accent: 'warning' },
  ]
})

const activity = [
  { icon: 'fa-solid fa-clipboard-check', tone: 'success', title: 'Marisol completó la limpieza de freidoras', time: 'Hace 12 min' },
  { icon: 'fa-solid fa-triangle-exclamation', tone: 'warning', title: 'Freidora industrial: mantenimiento vencido', time: 'Hace 2 h' },
  { icon: 'fa-solid fa-clock', tone: 'info', title: 'Detectada hora crítica martes 15:00–17:00', time: 'Hoy' },
  { icon: 'fa-solid fa-utensils', tone: 'primary', title: 'Receta "Burger Andina" actualizada', time: 'Ayer' },
]

function disconnectData() {
  ui.requestConfirm({
    title: 'Conectar tus datos reales',
    message: 'Vamos a abrir el diagnóstico para reemplazar los números demo por los tuyos.',
    confirmLabel: 'Conectar ahora',
    cancelLabel: 'Más tarde',
    icon: 'fa-solid fa-plug-circle-bolt',
  }).then((ok) => { if (ok) router.push('/diagnostico') })
}
</script>

<template>
  <AppShell>
    <div class="hub">
      <TiendaContextBar />
      <DemoBanner :ctaTo="''" @cta="disconnectData" />

      <section class="hero-row">
        <div class="hero-card">
          <span class="eyebrow"><i class="fa-solid fa-hand" /> {{ greeting }}{{ firstName ? `, ${firstName}` : '' }}</span>
          <h1>Tu centro de control operativo</h1>
          <p>Resuelve hoy los dolores que detectamos en tu diagnóstico y vigila la salud de tu negocio en tiempo real.</p>
          <div class="hero-ctas">
            <RouterLink v-if="store.results" to="/dashboard" class="cta primary">
              <i class="fa-solid fa-chart-pie" /> Ver mi diagnóstico
            </RouterLink>
            <RouterLink v-else to="/diagnostico" class="cta primary">
              <i class="fa-solid fa-stethoscope" /> Hacer diagnóstico
            </RouterLink>
            <RouterLink to="/modulo/sanitario" class="cta ghost">
              <i class="fa-solid fa-clipboard-check" /> Empezar checklist
            </RouterLink>
          </div>
          <div class="hero-orbit" aria-hidden="true">
            <span class="orb a"><i class="fa-solid fa-clipboard-list" /></span>
            <span class="orb b"><i class="fa-solid fa-screwdriver-wrench" /></span>
            <span class="orb c"><i class="fa-solid fa-sack-dollar" /></span>
            <span class="orb d"><i class="fa-solid fa-calendar-week" /></span>
          </div>
        </div>

        <aside class="health-card">
          <header>
            <span class="eyebrow soft"><i class="fa-solid fa-heart-pulse" /> Salud financiera <DemoBadge v-if="!store.results" /></span>
            <span :class="['pill', store.results?.healthStatus || 'yellow']">
              {{ store.results?.healthStatus === 'green' ? 'Saludable' : store.results?.healthStatus === 'red' ? 'Crítico' : 'En riesgo' }}
            </span>
          </header>
          <div class="health-ring">
            <svg viewBox="0 0 120 120" width="140" height="140">
              <circle cx="60" cy="60" r="50" stroke="rgba(32,148,210,0.12)" stroke-width="12" fill="none" />
              <circle
                cx="60" cy="60" r="50" fill="none" stroke-width="12" stroke-linecap="round"
                :stroke="store.results?.healthStatus === 'green' ? '#10b981' : store.results?.healthStatus === 'red' ? '#ef4444' : '#f59e0b'"
                stroke-dasharray="314"
                :stroke-dashoffset="314 - (store.results ? Math.min(100, Math.max(0, store.results.profitMargin)) : 60) * 3.14"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div class="ring-center">
              <strong>{{ store.results ? store.results.profitMargin.toFixed(1) + '%' : '21.4%' }}</strong>
              <span>Margen</span>
            </div>
          </div>
          <ul class="health-list">
            <li><span>EBITDA</span><strong>{{ store.results ? store.currencySymbol + store.results.ebitda.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '$2,420' }}</strong></li>
            <li><span>Break-even</span><strong>{{ store.results?.breakEvenClients || 312 }} tickets</strong></li>
            <li><span>Dolores activos</span><strong>{{ store.painPoints.length || 0 }}</strong></li>
          </ul>
        </aside>
      </section>

      <section class="stats-row">
        <article v-for="s in topStats" :key="s.label" :class="['stat', s.accent]">
          <span class="stat-icon"><i :class="s.icon" /></span>
          <div>
            <span class="stat-label">
              {{ s.label }}
              <DemoBadge v-if="!store.results" />
            </span>
            <strong class="stat-value">{{ s.value }}</strong>
          </div>
        </article>
      </section>

      <section class="modules-block">
        <header class="block-head">
          <div>
            <span class="eyebrow"><i class="fa-solid fa-bolt" /> Tus módulos</span>
            <h2>Optimizado por dolor de cabeza</h2>
          </div>
          <RouterLink to="/diagnostico" class="link">
            Cambiar mis dolores <i class="fa-solid fa-arrow-right" />
          </RouterLink>
        </header>

        <div class="modules-grid">
          <RouterLink
            v-for="m in sortedModules"
            :key="m.id"
            :to="m.route"
            :class="['module-card', { primary: store.painPoints.includes(m.id) }]"
          >
            <div class="module-top">
              <span class="module-icon"><i :class="m.icon" /></span>
              <span v-if="store.painPoints.includes(m.id)" class="badge"><i class="fa-solid fa-star" /> Prioritario</span>
            </div>
            <h3>{{ m.ctaLabel }}</h3>
            <p>{{ m.title }}</p>
            <div class="module-foot">
              <div class="mini-stat">
                <span>{{ moduleStats[m.id].label }} <DemoBadge /></span>
                <strong>{{ moduleStats[m.id].value }}</strong>
              </div>
              <span :class="['trend', moduleStats[m.id].trendUp ? 'up' : 'down']">
                <i :class="moduleStats[m.id].trendUp ? 'fa-solid fa-arrow-trend-up' : 'fa-solid fa-arrow-trend-down'" />
                {{ moduleStats[m.id].trend }}
              </span>
            </div>
            <span class="module-go">Abrir módulo <i class="fa-solid fa-arrow-right" /></span>
          </RouterLink>
        </div>
      </section>

      <section class="split-row">
        <article class="activity">
          <header class="block-head">
            <div>
              <span class="eyebrow"><i class="fa-solid fa-clock-rotate-left" /> Actividad reciente <DemoBadge /></span>
              <h2>Lo que pasó en tu operación</h2>
            </div>
            <button class="link"><i class="fa-solid fa-filter" /> Filtrar</button>
          </header>
          <ul class="timeline">
            <li v-for="(a, i) in activity" :key="i" :class="['tl-item', a.tone]">
              <span class="tl-icon"><i :class="a.icon" /></span>
              <div class="tl-body">
                <strong>{{ a.title }}</strong>
                <span>{{ a.time }}</span>
              </div>
            </li>
          </ul>
        </article>

        <article class="onboarding-card">
          <span class="eyebrow"><i class="fa-solid fa-list-check" /> Activación</span>
          <h2>Termina de configurar tu cuenta</h2>
          <ul class="checklist">
            <li :class="{ done: !!store.projectName }">
              <i :class="store.projectName ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
              <span>Define tu restaurante</span>
            </li>
            <li :class="{ done: store.painPoints.length > 0 }">
              <i :class="store.painPoints.length > 0 ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
              <span>Selecciona tus dolores</span>
            </li>
            <li :class="{ done: !!store.results }">
              <i :class="store.results ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
              <span>Genera diagnóstico financiero</span>
            </li>
            <li :class="{ done: userStore.isAuthenticated }">
              <i :class="userStore.isAuthenticated ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
              <span>Crea tu cuenta</span>
            </li>
            <li>
              <i class="fa-regular fa-circle" />
              <span>Invita a tu equipo (Premium)</span>
            </li>
          </ul>
          <RouterLink to="/diagnostico" class="cta primary block">
            Continuar configuración <i class="fa-solid fa-arrow-right" />
          </RouterLink>
        </article>
      </section>
    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.hub {
  padding: 24px 28px 60px;
  display: flex; flex-direction: column; gap: 22px;
  @media (max-width: 720px) { padding: 18px 16px 56px; }
}

.eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.68rem; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;
  color: $secondary;
  i { font-size: 0.8rem; }
  &.soft { color: $primary; }
}

.hero-row {
  display: grid; gap: 18px;
  grid-template-columns: 1fr;
  @media (min-width: 1100px) { grid-template-columns: 1.4fr 0.9fr; }
}
.hero-card {
  position: relative;
  background:
    radial-gradient(circle at 110% 0%, rgba($secondary, 0.22), transparent 55%),
    radial-gradient(circle at -10% 100%, rgba($primary, 0.4), transparent 55%),
    linear-gradient(135deg, $primary-dark, #0b1a36);
  color: white; border-radius: 22px;
  padding: 28px;
  overflow: hidden;
  display: flex; flex-direction: column; gap: 12px;
  min-height: 240px;
  h1 { margin: 0; font-size: clamp(1.4rem, 2vw + 1rem, 2rem); line-height: 1.2; color: white; }
  p { margin: 0; font-size: 0.95rem; color: rgba(255,255,255,0.78); line-height: 1.55; max-width: 520px; }
}
.hero-card .eyebrow i { color: #ffd66b; }
.hero-ctas { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
.cta {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 16px; border-radius: 12px;
  font-family: $font-principal; font-weight: 700; font-size: 0.88rem;
  text-decoration: none; cursor: pointer; border: none;
  transition: transform 0.2s;
  &.primary {
    background: white; color: $primary;
    box-shadow: 0 10px 24px rgba(0,0,0,0.18);
    &:hover { transform: translateY(-1px); }
  }
  &.ghost {
    background: rgba(255,255,255,0.08); color: white;
    border: 1px solid rgba(255,255,255,0.18);
    &:hover { background: rgba(255,255,255,0.14); }
  }
  &.block { width: 100%; justify-content: center; }
}
.hero-orbit {
  position: absolute; right: -50px; bottom: -50px;
  width: 280px; height: 280px;
  pointer-events: none;
  .orb {
    position: absolute;
    width: 56px; height: 56px;
    border-radius: 18px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    backdrop-filter: blur(6px);
    display: inline-flex; align-items: center; justify-content: center;
    color: white; font-size: 1.3rem;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  }
  .a { top: 0; left: 30px; transform: rotate(-6deg); }
  .b { top: 30px; right: 0; transform: rotate(4deg); }
  .c { bottom: 70px; right: 80px; transform: rotate(-3deg); }
  .d { bottom: 0; left: 50px; transform: rotate(8deg); }
}

.health-card {
  background: white; border-radius: 22px;
  padding: 22px;
  border: 1px solid rgba($primary-dark, 0.06);
  display: flex; flex-direction: column; gap: 18px;
  header { display: flex; align-items: center; justify-content: space-between; }
}
.pill {
  font-size: 0.7rem; font-weight: 800;
  padding: 4px 10px; border-radius: 12px;
  text-transform: uppercase; letter-spacing: 0.5px;
  &.green { background: rgba($alert-success, 0.15); color: $alert-success; }
  &.yellow { background: rgba($alert-warning, 0.18); color: darken($alert-warning, 8%); }
  &.red { background: rgba($alert-error, 0.15); color: $alert-error; }
}
.health-ring { position: relative; align-self: center; width: 140px; height: 140px; }
.ring-center {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  strong { font-size: 1.6rem; font-weight: 800; color: $primary-dark; }
  span { font-size: 0.72rem; color: $text-secondary; text-transform: uppercase; letter-spacing: 1px; }
}
.health-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px;
  li {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 12px; background: #f8fafc; border-radius: 12px;
    font-size: 0.85rem;
    span { color: $text-secondary; }
    strong { color: $primary-dark; }
  }
}

.stats-row {
  display: grid; gap: 12px;
  grid-template-columns: 1fr 1fr;
  @media (min-width: 720px) { grid-template-columns: repeat(4, 1fr); }
}
.stat {
  display: flex; align-items: center; gap: 12px;
  background: white; border: 1px solid rgba($primary-dark, 0.05);
  border-radius: 16px; padding: 14px 16px;
  position: relative; overflow: hidden;
  &::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
  }
  &.primary::before { background: $primary; }
  &.secondary::before { background: $secondary; }
  &.warning::before { background: $alert-warning; }
  &.green::before { background: $alert-success; }
  &.yellow::before { background: $alert-warning; }
  &.red::before { background: $alert-error; }
}
.stat-icon {
  width: 38px; height: 38px; border-radius: 12px;
  background: rgba($primary, 0.08); color: $primary;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1rem;
  .stat.secondary & { background: rgba($secondary, 0.12); color: darken($secondary, 8%); }
  .stat.warning & { background: rgba($alert-warning, 0.15); color: darken($alert-warning, 8%); }
  .stat.green & { background: rgba($alert-success, 0.15); color: $alert-success; }
  .stat.red & { background: rgba($alert-error, 0.15); color: $alert-error; }
}
.stat-label { font-size: 0.72rem; color: $text-secondary; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; display: block; }
.stat-value { font-size: 1.15rem; font-weight: 800; color: $primary-dark; }

.block-head {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 14px; margin-bottom: 14px;
  h2 { margin: 2px 0 0; font-size: 1.1rem; font-weight: 800; color: $primary-dark; }
}
.link {
  display: inline-flex; align-items: center; gap: 6px;
  background: transparent; border: none; color: $primary;
  font-family: $font-principal; font-weight: 700; font-size: 0.85rem;
  cursor: pointer; padding: 6px 8px; border-radius: 10px; text-decoration: none;
  &:hover { background: rgba($primary, 0.08); }
}

.modules-block {
  background: white; border: 1px solid rgba($primary-dark, 0.05);
  border-radius: 22px; padding: 22px;
}
.modules-grid {
  display: grid; gap: 14px;
  grid-template-columns: 1fr;
  @media (min-width: 720px) { grid-template-columns: 1fr 1fr; }
}
.module-card {
  position: relative;
  background: linear-gradient(180deg, #fbfcfe, white);
  border: 1px solid rgba($primary-dark, 0.06);
  border-radius: 18px; padding: 18px;
  display: flex; flex-direction: column; gap: 10px;
  text-decoration: none; color: $primary-dark;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 36px rgba($primary, 0.12);
    border-color: rgba($primary, 0.25);
  }
  &.primary {
    border-color: rgba($primary, 0.35);
    background: linear-gradient(180deg, rgba($primary, 0.06), white 70%);
    box-shadow: 0 14px 30px rgba($primary, 0.14);
    .module-icon { background: linear-gradient(135deg, $primary, $secondary); color: white; }
  }
  h3 { margin: 0; font-size: 1.05rem; font-weight: 800; }
  p { margin: 0; font-size: 0.82rem; color: $text-secondary; line-height: 1.4; }
}
.module-top { display: flex; justify-content: space-between; align-items: flex-start; }
.module-icon {
  width: 52px; height: 52px; border-radius: 14px;
  background: rgba($primary, 0.1); color: $primary;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1.35rem; transition: background 0.2s, color 0.2s;
}
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.62rem; font-weight: 800; letter-spacing: 0.6px;
  background: linear-gradient(135deg, $primary, $secondary);
  color: white; padding: 4px 10px; border-radius: 10px;
}
.module-foot {
  display: flex; align-items: center; justify-content: space-between;
  background: rgba($primary-dark, 0.03); border-radius: 12px;
  padding: 10px 12px; margin-top: 4px;
}
.mini-stat {
  display: flex; flex-direction: column; line-height: 1.2;
  span { font-size: 0.68rem; color: $text-secondary; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 700; }
  strong { font-size: 1rem; color: $primary-dark; font-weight: 800; }
}
.trend {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.72rem; font-weight: 800;
  padding: 4px 8px; border-radius: 10px;
  &.up { background: rgba($alert-success, 0.12); color: $alert-success; }
  &.down { background: rgba($alert-error, 0.12); color: $alert-error; }
}
.module-go {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.82rem; font-weight: 700; color: $primary;
  margin-top: 2px;
}

.split-row {
  display: grid; gap: 14px;
  grid-template-columns: 1fr;
  @media (min-width: 980px) { grid-template-columns: 1.4fr 1fr; }
}
.activity, .onboarding-card {
  background: white; border: 1px solid rgba($primary-dark, 0.05);
  border-radius: 22px; padding: 22px;
}
.timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.tl-item {
  display: grid; grid-template-columns: 44px 1fr; gap: 12px; align-items: center;
  background: #f8fafc; border-radius: 14px; padding: 12px;
  border-left: 4px solid transparent;
  &.success { border-left-color: $alert-success; }
  &.warning { border-left-color: $alert-warning; }
  &.info { border-left-color: $primary; }
  &.primary { border-left-color: $secondary; }
}
.tl-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: white; color: $primary;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1rem;
  .tl-item.success & { color: $alert-success; }
  .tl-item.warning & { color: darken($alert-warning, 8%); }
  .tl-item.primary & { color: darken($secondary, 8%); }
}
.tl-body { display: flex; flex-direction: column; line-height: 1.3;
  strong { font-size: 0.88rem; color: $primary-dark; font-weight: 700; }
  span { font-size: 0.72rem; color: $text-secondary; }
}
.onboarding-card { display: flex; flex-direction: column; gap: 14px;
  h2 { margin: 0; font-size: 1.05rem; font-weight: 800; }
}
.checklist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px;
  li {
    display: inline-flex; align-items: center; gap: 10px;
    background: #f8fafc; padding: 10px 12px; border-radius: 12px;
    font-size: 0.88rem; color: $primary-dark;
    i { color: rgba($primary-dark, 0.3); font-size: 1rem; }
    &.done {
      background: rgba($alert-success, 0.08);
      color: rgba($primary-dark, 0.75);
      i { color: $alert-success; }
      span { text-decoration: line-through; text-decoration-color: rgba($primary-dark, 0.18); }
    }
  }
}
</style>
