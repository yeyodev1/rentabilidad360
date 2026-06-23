<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useOnboardingStore, PAIN_POINTS } from '@/stores/onboarding'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const store = useOnboardingStore()
const userStore = useUserStore()

onMounted(() => { userStore.hydrate() })

const hasInProgress = computed(() => !!(store.projectName || store.businessType || store.painPoints.length))

function startDemo() { router.push('/onboarding') }
function continueDemo() { router.push(store.results ? '/dashboard' : '/onboarding') }
function goLogin() { router.push('/login') }
function goRegister() { router.push('/register') }
function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const stats = [
  { value: '+30%', label: 'Margen recuperado por costeo correcto' },
  { value: '<60s', label: 'Diagnóstico instantáneo de rentabilidad' },
  { value: '4', label: 'Módulos operativos para cocina y piso' },
]

const features = [
  { icon: 'fa-solid fa-stethoscope', title: 'Diagnóstico EBITDA en 1 minuto', desc: 'Responde 5 pasos y te devolvemos margen, punto de equilibrio y semáforo de salud.' },
  { icon: 'fa-solid fa-mobile-screen-button', title: 'Pensado para cocina y piso', desc: 'Botones grandes, una mano, sin fricción. Listo para empleados y dueños.' },
  { icon: 'fa-solid fa-bell', title: 'Alertas en tu correo', desc: 'Notificaciones por email cuando algo requiere tu atención.' },
  { icon: 'fa-solid fa-qrcode', title: 'QR en cada equipo', desc: 'Escanea la licuadora industrial y abre su ficha técnica al instante.' },
]

const steps = [
  { icon: 'fa-solid fa-clipboard-question', title: 'Cuéntanos tu negocio', desc: 'Nombre, tipo y tu mayor dolor.' },
  { icon: 'fa-solid fa-calculator', title: 'Costos y ventas', desc: 'Inversión, precio promedio y clientes mensuales.' },
  { icon: 'fa-solid fa-chart-pie', title: 'Diagnóstico', desc: 'Recibe tu semáforo financiero y módulos prioritarios.' },
  { icon: 'fa-solid fa-unlock-keyhole', title: 'Operativa diaria', desc: 'Activa sanidad, mantenimiento, costeo y turnos.' },
]
</script>

<template>
  <div class="home">
    <header class="nav">
      <div class="nav-brand">
        <span class="brand-mark"><i class="fa-solid fa-chart-pie" /></span>
        <span class="brand-name">Rentabilidad360</span>
      </div>
      <nav class="nav-links">
        <button class="nav-link" @click="scrollTo('caracteristicas')">Características</button>
        <button class="nav-link" @click="scrollTo('dolores')">Dolores</button>
        <button class="nav-link" @click="scrollTo('como-funciona')">Cómo funciona</button>
      </nav>
      <div class="nav-actions">
        <template v-if="!userStore.isAuthenticated">
          <button class="btn-ghost" @click="goLogin"><i class="fa-solid fa-right-to-bracket" /> Ingresar</button>
          <button class="btn-primary" @click="goRegister">Crear cuenta gratis <i class="fa-solid fa-arrow-right" /></button>
        </template>
        <template v-else>
          <span class="user-chip"><i class="fa-solid fa-user-circle" /> {{ userStore.name || 'Mi cuenta' }}</span>
          <button class="btn-primary" @click="router.push('/modulos')">Mis módulos <i class="fa-solid fa-arrow-right" /></button>
        </template>
      </div>
    </header>

    <section class="hero">
      <div class="hero-bg" aria-hidden="true">
        <div class="blob a" /><div class="blob b" /><div class="blob c" />
      </div>
      <div class="hero-content">
        <span class="hero-eyebrow"><i class="fa-solid fa-bolt" /> Para restaurantes y dark kitchens</span>
        <h1 class="hero-title">
          Sabe si tu restaurante <span class="grad">gana o pierde</span><br />
          antes de que termine el mes.
        </h1>
        <p class="hero-sub">
          Diagnóstico financiero rápido + módulos operativos: inspecciones sanitarias,
          mantenimiento por QR, costeo de recetas y turnos del personal.
        </p>
        <div class="hero-ctas">
          <button class="cta-main" @click="startDemo">
            <i class="fa-solid fa-rocket" /> Probar diagnóstico gratis <i class="fa-solid fa-arrow-right" />
          </button>
          <button v-if="hasInProgress" class="cta-secondary" @click="continueDemo">
            <i class="fa-solid fa-circle-play" /> Continuar
          </button>
          <button v-else class="cta-secondary" @click="goLogin">
            <i class="fa-solid fa-right-to-bracket" /> Ya tengo cuenta
          </button>
        </div>
        <div class="hero-trust">
          <i class="fa-solid fa-shield-halved" /> Sin tarjeta. Sin instalaciones.
        </div>
      </div>
      <div class="hero-card">
        <div class="card-row top">
          <div class="card-chip"><span class="dot green" /> Diagnóstico en vivo</div>
          <div class="card-chip ghost"><i class="fa-solid fa-flask" /> Demo</div>
        </div>
        <div class="card-meter">
          <div class="meter-track"><div class="meter-fill" /></div>
          <div class="meter-labels">
            <span>Punto de equilibrio</span>
            <span class="meter-value">68%</span>
          </div>
        </div>
        <div class="card-grid">
          <div class="mini-kpi"><span class="mini-label">Ventas / mes</span><span class="mini-value">$12,480</span></div>
          <div class="mini-kpi"><span class="mini-label">Margen</span><span class="mini-value pos">21.4%</span></div>
          <div class="mini-kpi"><span class="mini-label">Break-even</span><span class="mini-value">312 tickets</span></div>
          <div class="mini-kpi alert"><span class="mini-label"><i class="fa-solid fa-bell" /> Alerta</span><span class="mini-value">Mar 15-17h</span></div>
        </div>
      </div>
    </section>

    <section class="stats">
      <div v-for="s in stats" :key="s.label" class="stat">
        <span class="stat-value">{{ s.value }}</span>
        <span class="stat-label">{{ s.label }}</span>
      </div>
    </section>

    <section id="caracteristicas" class="features">
      <div class="section-head">
        <span class="section-eyebrow"><i class="fa-solid fa-wand-magic-sparkles" /> Características</span>
        <h2 class="section-title">Todo en una sola app.</h2>
      </div>
      <div class="features-grid">
        <article v-for="f in features" :key="f.title" class="feature-card">
          <div class="feature-icon"><i :class="f.icon" /></div>
          <h3 class="feature-title">{{ f.title }}</h3>
          <p class="feature-desc">{{ f.desc }}</p>
        </article>
      </div>
    </section>

    <section id="dolores" class="pains">
      <div class="section-head">
        <span class="section-eyebrow"><i class="fa-solid fa-heart-pulse" /> ¿Cuál es tu dolor?</span>
        <h2 class="section-title">Adaptamos el diagnóstico a tu mayor dolor.</h2>
        <p class="section-sub">Elige uno o varios y priorizamos las soluciones.</p>
      </div>
      <div class="pains-grid">
        <article v-for="p in PAIN_POINTS" :key="p.id" class="pain-tile">
          <div class="pain-tile-head">
            <span class="pain-tile-icon"><i :class="p.icon" /></span>
            <h3 class="pain-tile-title">{{ p.title }}</h3>
          </div>
          <p class="pain-tile-desc">"{{ p.description }}"</p>
          <div class="pain-tile-foot">
            <span class="pain-tile-cta">{{ p.ctaLabel }}</span>
            <i class="fa-solid fa-arrow-right" />
          </div>
        </article>
      </div>
    </section>

    <section id="como-funciona" class="steps-section">
      <div class="section-head">
        <span class="section-eyebrow"><i class="fa-solid fa-list-check" /> Cómo funciona</span>
        <h2 class="section-title">De diagnóstico a operación, en 4 pasos.</h2>
      </div>
      <ol class="steps-list">
        <li v-for="(s, i) in steps" :key="s.title" class="step-item">
          <div class="step-num">{{ i + 1 }}</div>
          <div class="step-icon"><i :class="s.icon" /></div>
          <div class="step-body">
            <h3 class="step-title">{{ s.title }}</h3>
            <p class="step-desc">{{ s.desc }}</p>
          </div>
        </li>
      </ol>
    </section>

    <section class="final-cta">
      <div class="final-content">
        <h2 class="final-title">Empieza con tu diagnóstico gratuito.</h2>
        <p class="final-sub">Te toma menos de 60 segundos.</p>
        <div class="final-ctas">
          <button class="cta-main inverse" @click="startDemo">
            <i class="fa-solid fa-stethoscope" /> Hacer diagnóstico
          </button>
          <RouterLink to="/register" class="cta-secondary outline">
            <i class="fa-solid fa-user-plus" /> Crear cuenta
          </RouterLink>
        </div>
      </div>
    </section>

    <footer class="footer">
      <span class="footer-brand">
        <span class="brand-mark sm"><i class="fa-solid fa-chart-pie" /></span>
        Rentabilidad360
      </span>
      <span class="footer-copy">© {{ new Date().getFullYear() }}</span>
      <span class="footer-links">
        <a href="#">Términos</a>
        <a href="#">Privacidad</a>
        <a href="#">Contacto</a>
      </span>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.home {
  min-height: 100dvh;
  background: $surface;
  color: $text;
}

/* ── Nav ── */
.nav {
  position: sticky; top: 0; z-index: 30;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 12px 20px;
  background: rgba(255,255,255,0.82);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid $border;

  @media (min-width: $bp-tablet) { padding: 14px 32px; }
}

.nav-brand { display: inline-flex; align-items: center; gap: 10px; }
.brand-mark {
  width: 30px; height: 30px;
  background: $primary-gradient;
  color: white; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 8px; box-shadow: 0 4px 12px rgba($primary, 0.3);
  font-size: 0.9rem;
  &.sm { width: 22px; height: 22px; font-size: 0.7rem; }
}
.brand-name { font-weight: 800; font-size: 0.95rem; }

.nav-links {
  display: none; gap: 4px;
  @media (min-width: 900px) { display: inline-flex; }
}
.nav-link {
  border: none; background: transparent; color: $text;
  font-family: $font-principal; font-weight: 600; font-size: 0.85rem;
  padding: 6px 12px; border-radius: $radius-sm; cursor: pointer;
  &:hover { background: $primary-bg; color: $primary; }
}

.nav-actions { display: inline-flex; align-items: center; gap: 6px;
  @media (max-width: $bp-mobile) { .btn-ghost span, .btn-primary span { display: none; } }
}

.btn-ghost {
  border: none; background: transparent; color: $text;
  font-family: $font-principal; font-weight: 600; font-size: 0.82rem;
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
  padding: 8px 12px; border-radius: $radius-sm;
  &:hover { background: $primary-bg; color: $primary; }
}
.btn-primary {
  border: none; cursor: pointer; font-family: $font-principal; font-weight: 700; font-size: 0.82rem;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 14px; border-radius: $radius-sm;
  color: white; background: $primary-gradient;
  box-shadow: 0 4px 14px rgba($primary, 0.25);
  &:active { transform: scale(0.97); }
}
.user-chip {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.8rem; font-weight: 700; color: $primary;
  background: $primary-bg; padding: 6px 10px; border-radius: $radius-full;
}

/* ── Hero ── */
.hero {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  padding: 40px 20px 28px;
  max-width: 1100px;
  margin: 0 auto;
  align-items: center;

  @media (min-width: 860px) {
    grid-template-columns: 1.05fr 0.95fr;
    padding: 56px 32px 48px;
  }
}

.hero-bg { position: absolute; inset: 0; pointer-events: none; }
.hero-bg .blob {
  position: absolute; filter: blur(80px); opacity: 0.15; border-radius: 50%;
  &.a { width: 320px; height: 320px; background: $primary; top: -100px; left: -80px; }
  &.b { width: 280px; height: 280px; background: $accent; bottom: -100px; right: -60px; }
  &.c { width: 200px; height: 200px; background: $accent-light; top: 50%; left: 38%; opacity: 0.1; }
}

.hero-content { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 16px; }

.hero-eyebrow {
  display: inline-flex; align-items: center; gap: 6px; align-self: flex-start;
  background: $primary-bg; color: $primary;
  padding: 5px 10px; border-radius: $radius-full;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase;
}

.hero-title {
  font-size: clamp(1.7rem, 2.5vw + 0.8rem, 2.6rem);
  line-height: 1.15; font-weight: 800; color: $text; margin: 0;
}

.grad {
  background: $primary-gradient;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-sub {
  font-size: 0.95rem; color: $text-secondary; line-height: 1.6; max-width: 500px; margin: 0;
}

.hero-ctas { display: flex; flex-wrap: wrap; gap: 10px; }

.cta-main {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 20px; border: none; border-radius: $radius-md;
  font-family: $font-principal; font-weight: 700; font-size: 0.95rem;
  color: white; background: $primary-gradient;
  cursor: pointer; box-shadow: 0 8px 24px rgba($primary, 0.3);
  transition: transform 0.15s, box-shadow 0.2s;
  &:active { transform: scale(0.97); }
  &.inverse { background: $surface; color: $primary; box-shadow: $shadow-lg; }
}

.cta-secondary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 14px 20px; border: 1.5px solid $border; background: $surface;
  border-radius: $radius-md; font-family: $font-principal; font-weight: 700;
  color: $text; cursor: pointer;
  &:hover { border-color: $primary; color: $primary; }
  &.outline { border-color: rgba(255,255,255,0.5); background: transparent; color: white;
    &:hover { background: rgba(255,255,255,0.1); border-color: white; } }
}

.hero-trust {
  display: inline-flex; align-items: center; gap: 6px;
  color: $text-secondary; font-size: 0.8rem;
  i { color: $primary; }
}

/* ── Hero card ── */
.hero-card {
  position: relative;
  background: $surface;
  border-radius: $radius-xl;
  padding: 20px;
  box-shadow: $shadow-xl;
  border: 1px solid $border;
  display: flex; flex-direction: column; gap: 16px;
  transform: rotate(-1deg);
  z-index: 1;
}

.card-row.top { display: flex; justify-content: space-between; }
.card-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: $primary-bg; color: $primary;
  padding: 4px 8px; border-radius: $radius-full; font-size: 0.7rem; font-weight: 700;
  &.ghost { background: $border; color: $text; }
}
.dot {
  width: 7px; height: 7px; border-radius: 50%;
  &.green { background: $alert-success; box-shadow: 0 0 0 3px rgba($alert-success, 0.18); }
}

.card-meter { display: flex; flex-direction: column; gap: 6px; }
.meter-track { height: 7px; background: $border; border-radius: $radius-full; overflow: hidden; }
.meter-fill { width: 68%; height: 100%; background: $primary-gradient; border-radius: $radius-full; }
.meter-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: $text-secondary; }
.meter-value { color: $primary; font-weight: 700; }

.card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.mini-kpi {
  background: $bg;
  border-radius: $radius-md;
  padding: 10px 12px;
  display: flex; flex-direction: column; gap: 3px;
  border: 1px solid $border;
  &.alert { background: $alert-warning-bg; border-color: rgba($alert-warning, 0.25); }
}
.mini-label { font-size: 0.68rem; font-weight: 600; color: $text-secondary; display: inline-flex; align-items: center; gap: 4px; }
.mini-value { font-size: 1rem; font-weight: 700; color: $text; &.pos { color: $alert-success; } }

/* ── Stats ── */
.stats {
  display: grid; grid-template-columns: 1fr; gap: 12px;
  max-width: 1100px; margin: 0 auto;
  padding: 20px 20px 8px;
  @media (min-width: $bp-tablet) { grid-template-columns: repeat(3, 1fr); padding: 20px 32px 8px; }
}
.stat {
  background: $surface; border: 1px solid $border; border-radius: $radius-lg;
  padding: 16px 20px; display: flex; flex-direction: column; gap: 3px;
  box-shadow: $shadow-sm;
}
.stat-value { font-size: 1.6rem; font-weight: 800; color: $primary; }
.stat-label { font-size: 0.82rem; color: $text-secondary; line-height: 1.4; }

/* ── Sections ── */
.features, .pains, .steps-section {
  max-width: 1100px; margin: 0 auto; padding: 40px 20px;
  @media (min-width: $bp-tablet) { padding: 48px 32px; }
}
.section-head { display: flex; flex-direction: column; gap: 6px; margin-bottom: 22px; max-width: 640px; }
.section-eyebrow {
  display: inline-flex; align-items: center; gap: 6px; align-self: flex-start;
  background: $primary-bg; color: $primary;
  padding: 4px 10px; border-radius: $radius-full;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase;
}
.section-title { margin: 0; font-size: clamp(1.3rem, 1.5vw + 0.8rem, 1.8rem); font-weight: 800; color: $text; line-height: 1.25; font-family: $font-secondary; }
.section-sub { margin: 0; color: $text-secondary; font-size: 0.9rem; line-height: 1.5; }

.features-grid {
  display: grid; gap: 12px; grid-template-columns: 1fr;
  @media (min-width: 640px) { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1000px) { grid-template-columns: repeat(4, 1fr); }
}
.feature-card {
  background: $surface; border: 1px solid $border;
  border-radius: $radius-lg; padding: 18px;
  display: flex; flex-direction: column; gap: 8px;
  box-shadow: $shadow-sm;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: translateY(-2px); box-shadow: $shadow-md; }
}
.feature-icon {
  width: 40px; height: 40px; border-radius: $radius-sm;
  background: $primary-bg; color: $primary;
  display: inline-flex; align-items: center; justify-content: center; font-size: 1.05rem;
}
.feature-title { font-size: 0.95rem; font-weight: 700; margin: 0; color: $text; }
.feature-desc { font-size: 0.82rem; color: $text-secondary; margin: 0; line-height: 1.5; }

.pains-grid {
  display: grid; gap: 12px; grid-template-columns: 1fr;
  @media (min-width: 640px) { grid-template-columns: repeat(2, 1fr); }
}
.pain-tile {
  background: $surface; border: 1px solid $border;
  border-radius: $radius-lg; padding: 18px;
  display: flex; flex-direction: column; gap: 8px;
  box-shadow: $shadow-sm;
}
.pain-tile-head { display: flex; align-items: center; gap: 10px; }
.pain-tile-icon {
  width: 44px; height: 44px; border-radius: $radius-sm;
  background: $primary-bg; color: $primary;
  display: inline-flex; align-items: center; justify-content: center; font-size: 1.2rem;
}
.pain-tile-title { margin: 0; font-size: 0.95rem; font-weight: 700; color: $text; }
.pain-tile-desc { margin: 0; font-style: italic; color: $text; font-size: 0.88rem; line-height: 1.5; }
.pain-tile-foot {
  display: inline-flex; align-items: center; gap: 6px;
  color: $primary; font-weight: 700; font-size: 0.82rem;
  margin-top: 4px;
}

.steps-list {
  list-style: none; padding: 0; margin: 0;
  display: grid; gap: 10px; grid-template-columns: 1fr;
  @media (min-width: $bp-tablet) { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1000px) { grid-template-columns: repeat(4, 1fr); }
}
.step-item {
  position: relative;
  background: $surface; border: 1px solid $border;
  border-radius: $radius-lg; padding: 16px;
  display: flex; flex-direction: column; gap: 8px;
  box-shadow: $shadow-sm;
}
.step-num {
  position: absolute; top: -8px; right: 12px;
  background: $primary; color: white;
  width: 26px; height: 26px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 0.82rem;
  box-shadow: 0 4px 12px rgba($primary, 0.35);
}
.step-icon {
  width: 40px; height: 40px; border-radius: $radius-sm;
  background: $primary-bg; color: $primary;
  display: inline-flex; align-items: center; justify-content: center; font-size: 1.05rem;
}
.step-title { margin: 0; font-size: 0.95rem; font-weight: 700; color: $text; }
.step-desc { margin: 0; font-size: 0.82rem; color: $text-secondary; line-height: 1.5; }

.final-cta {
  margin: 32px auto; max-width: 1100px; padding: 0 20px;
  @media (min-width: $bp-tablet) { padding: 0 32px; }
}
.final-content {
  background: linear-gradient(135deg, $primary-dark, darken($primary, 5%));
  color: white; border-radius: $radius-xl;
  padding: 36px 28px; display: flex; flex-direction: column; gap: 16px; align-items: flex-start;
  box-shadow: $shadow-xl;
}
.final-title { font-size: clamp(1.3rem, 1.5vw + 0.8rem, 1.8rem); font-weight: 800; margin: 0; line-height: 1.2; color: white; font-family: $font-secondary; }
.final-sub { font-size: 0.95rem; line-height: 1.5; margin: 0; opacity: 0.85; }
.final-ctas { display: flex; gap: 10px; flex-wrap: wrap; }

.footer {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px;
  padding: 18px 20px;
  border-top: 1px solid $border;
  font-size: 0.8rem; color: $text-secondary;
  @media (min-width: $bp-tablet) { padding: 18px 32px; }
}
.footer-brand { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; color: $text; }
.footer-links { display: inline-flex; gap: 12px;
  a { color: $text-secondary; &:hover { color: $primary; } }
}
</style>
