<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useOnboardingStore, PAIN_POINTS } from '@/stores/onboarding'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const store = useOnboardingStore()
const userStore = useUserStore()

onMounted(() => {
  userStore.hydrate()
})

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
  { icon: 'fa-solid fa-mobile-screen-button', title: 'Pensado para cocina y piso', desc: 'Botones gigantes, una mano, sin fricción. Listo para empleados, dueños y técnicos.' },
  { icon: 'fa-solid fa-bell', title: 'Alertas que se sienten', desc: 'Semáforos de cumplimiento, recordatorios por WhatsApp y avisos de horas críticas.' },
  { icon: 'fa-solid fa-qrcode', title: 'QR en cada equipo', desc: 'Escanea la licuadora industrial y abre su ficha técnica al instante.' },
]

const steps = [
  { icon: 'fa-solid fa-clipboard-question', title: 'Cuéntanos tu negocio', desc: 'Nombre, tipo y dolor de cabeza actual.' },
  { icon: 'fa-solid fa-calculator', title: 'Costos y ventas', desc: 'Inversión, precio promedio y clientes mensuales.' },
  { icon: 'fa-solid fa-chart-pie', title: 'Diagnóstico', desc: 'Recibe tu semáforo financiero y los módulos prioritarios.' },
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
          <button class="btn-primary" @click="goRegister">
            Crear cuenta gratis <i class="fa-solid fa-arrow-right" />
          </button>
        </template>
        <template v-else>
          <span class="user-chip"><i class="fa-solid fa-user-circle" /> {{ userStore.name || 'Mi cuenta' }}</span>
          <button class="btn-primary" @click="router.push('/modulos')">Mis módulos <i class="fa-solid fa-arrow-right" /></button>
        </template>
      </div>
    </header>

    <section class="hero">
      <div class="hero-bg" aria-hidden="true">
        <div class="blob a" />
        <div class="blob b" />
        <div class="blob c" />
      </div>

      <div class="hero-content">
        <span class="hero-eyebrow"><i class="fa-solid fa-bolt" /> Para restaurantes, cafeterías y dark kitchens</span>
        <h1 class="hero-title">
          Sabe si tu restaurante <span class="grad">gana o pierde</span><br />
          antes de que termine el mes.
        </h1>
        <p class="hero-sub">
          Rentabilidad360 mezcla un diagnóstico financiero rápido con módulos operativos para el día a día:
          inspecciones sanitarias, mantenimiento por QR, costeo de recetas y turnos del personal.
        </p>

        <div class="hero-ctas">
          <button class="cta-main" @click="startDemo">
            <i class="fa-solid fa-rocket" />
            Probar diagnóstico gratis
            <i class="fa-solid fa-arrow-right" />
          </button>
          <button v-if="hasInProgress" class="cta-secondary" @click="continueDemo">
            <i class="fa-solid fa-circle-play" />
            Continuar mi diagnóstico
          </button>
          <button v-else class="cta-secondary" @click="goLogin">
            <i class="fa-solid fa-right-to-bracket" />
            Ya tengo cuenta
          </button>
        </div>

        <div class="hero-trust">
          <i class="fa-solid fa-shield-halved" />
          Sin tarjeta. Sin instalaciones. Datos protegidos.
        </div>
      </div>

      <div class="hero-card">
        <div class="card-row top">
          <div class="card-chip"><span class="dot green" /> Diagnóstico en vivo</div>
          <div class="card-chip ghost"><i class="fa-solid fa-flask" /> Vista previa demo</div>
        </div>
        <div class="card-meter">
          <div class="meter-track"><div class="meter-fill" /></div>
          <div class="meter-labels">
            <span>Punto de equilibrio</span>
            <span class="meter-value">68%</span>
          </div>
        </div>
        <div class="card-grid">
          <div class="mini-kpi">
            <span class="mini-label">Ventas / mes</span>
            <span class="mini-value">$12,480</span>
          </div>
          <div class="mini-kpi">
            <span class="mini-label">Margen</span>
            <span class="mini-value pos">21.4%</span>
          </div>
          <div class="mini-kpi">
            <span class="mini-label">Break-even</span>
            <span class="mini-value">312 tickets</span>
          </div>
          <div class="mini-kpi alert">
            <span class="mini-label"><i class="fa-solid fa-bell" /> Hora crítica</span>
            <span class="mini-value">Mar 15-17h</span>
          </div>
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
        <h2 class="section-title">Todo lo que un dueño-operador necesita en una sola app.</h2>
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
        <h2 class="section-title">Adaptamos el diagnóstico a tu mayor dolor de cabeza.</h2>
        <p class="section-sub">Elige uno o varios durante el onboarding y priorizamos las soluciones que activamos para ti.</p>
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

    <section id="como-funciona" class="steps">
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
        <p class="final-sub">Te toma menos de 60 segundos. Y al final eliges qué dolor quieres resolver primero.</p>
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
      <span class="footer-copy">© {{ new Date().getFullYear() }} — Hecho con foco en restaurantes.</span>
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
  background: white;
  color: $primary-dark;
}

.nav {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 28px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba($primary-dark, 0.06);
}

.nav-brand { display: inline-flex; align-items: center; gap: 10px; }
.brand-mark {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, $primary, $secondary);
  color: white; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 10px; box-shadow: 0 6px 18px rgba($primary, 0.35);
  font-size: 0.95rem;
  &.sm { width: 24px; height: 24px; font-size: 0.75rem; }
}
.brand-name { font-weight: 700; font-size: 1rem; }

.nav-links {
  display: none;
  gap: 6px;
  @media (min-width: 900px) { display: inline-flex; }
}
.nav-link {
  border: none; background: transparent; color: $primary-dark;
  font-family: $font-principal; font-weight: 600; font-size: 0.88rem;
  padding: 6px 12px; border-radius: 10px; cursor: pointer;
  &:hover { background: rgba($primary, 0.08); color: $primary; }
}

.nav-actions { display: inline-flex; align-items: center; gap: 8px; }

.btn-ghost {
  border: none; background: transparent; color: $primary-dark;
  font-family: $font-principal; font-weight: 600; font-size: 0.85rem;
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
  padding: 8px 12px; border-radius: 10px;
  &:hover { background: rgba($primary, 0.08); color: $primary; }
}
.btn-primary {
  border: none; cursor: pointer; font-family: $font-principal; font-weight: 700; font-size: 0.85rem;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 14px; border-radius: 12px;
  color: white; background: linear-gradient(135deg, $primary, #1678b0);
  box-shadow: 0 6px 18px rgba($primary, 0.28);
  &:active { transform: scale(0.97); }
}
.user-chip {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.82rem; font-weight: 700; color: $primary;
  background: rgba($primary, 0.1); padding: 6px 10px; border-radius: 20px;
}

.hero {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 36px;
  padding: 48px 28px 32px;
  max-width: 1200px;
  margin: 0 auto;
  align-items: center;
  @media (min-width: 960px) { grid-template-columns: 1.05fr 0.95fr; padding: 64px 32px 56px; }
}
.hero-bg { position: absolute; inset: 0; pointer-events: none; }
.hero-bg .blob {
  position: absolute; filter: blur(70px); opacity: 0.4; border-radius: 50%;
  &.a { width: 360px; height: 360px; background: $primary; top: -120px; left: -100px; }
  &.b { width: 320px; height: 320px; background: $secondary; bottom: -120px; right: -80px; }
  &.c { width: 220px; height: 220px; background: #ffd66b; top: 50%; left: 38%; opacity: 0.25; }
}
.hero-content { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 18px; }
.hero-eyebrow {
  display: inline-flex; align-items: center; gap: 6px; align-self: flex-start;
  background: rgba($primary, 0.1); color: $primary;
  padding: 6px 12px; border-radius: 14px;
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase;
}
.hero-title {
  font-size: clamp(1.9rem, 2.5vw + 1rem, 3rem);
  line-height: 1.15; font-weight: 800; color: $primary-dark; margin: 0;
}
.grad {
  background: linear-gradient(120deg, $primary, $secondary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-sub {
  font-size: 1.02rem; color: $text-secondary; line-height: 1.6; max-width: 540px; margin: 0;
}
.hero-ctas { display: flex; flex-wrap: wrap; gap: 12px; }
.cta-main {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 16px 22px; border: none; border-radius: 14px;
  font-family: $font-principal; font-weight: 700; font-size: 1rem;
  color: white; background: linear-gradient(135deg, $primary, #1678b0);
  cursor: pointer; box-shadow: 0 12px 30px rgba($primary, 0.32);
  transition: transform 0.2s, box-shadow 0.2s;
  &:active { transform: scale(0.97); }
  &.inverse { background: white; color: $primary; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18); }
}
.cta-secondary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 16px 22px; border: 2px solid rgba($primary, 0.18); background: white;
  border-radius: 14px; font-family: $font-principal; font-weight: 700;
  color: $primary-dark; cursor: pointer;
  &:hover { border-color: $primary; color: $primary; }
  &.outline { border-color: rgba(255, 255, 255, 0.6); background: transparent; color: white;
    &:hover { background: rgba(255, 255, 255, 0.12); border-color: white; color: white; } }
}
.hero-trust {
  display: inline-flex; align-items: center; gap: 6px;
  color: $text-secondary; font-size: 0.85rem;
  i { color: $secondary; }
}

.hero-card {
  position: relative;
  background: white;
  border-radius: 24px;
  padding: 22px;
  box-shadow: 0 30px 80px rgba($primary-dark, 0.15);
  border: 1px solid rgba($primary-dark, 0.06);
  display: flex; flex-direction: column; gap: 18px;
  transform: rotate(-1deg);
  z-index: 1;
}
.card-row.top { display: flex; justify-content: space-between; }
.card-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba($primary, 0.08); color: $primary;
  padding: 5px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700;
  &.ghost { background: rgba($primary-dark, 0.06); color: $primary-dark; }
}
.dot {
  width: 8px; height: 8px; border-radius: 50%;
  &.green { background: $alert-success; box-shadow: 0 0 0 4px rgba($alert-success, 0.18); }
}

.card-meter { display: flex; flex-direction: column; gap: 8px; }
.meter-track { width: 100%; height: 8px; background: rgba($primary, 0.12); border-radius: 99px; overflow: hidden; }
.meter-fill { width: 68%; height: 100%; background: linear-gradient(90deg, $primary, $secondary); border-radius: 99px; }
.meter-labels { display: flex; justify-content: space-between; font-size: 0.78rem; color: $text-secondary; }
.meter-value { color: $primary; font-weight: 700; }

.card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.mini-kpi {
  background: #f8fafc;
  border-radius: 14px;
  padding: 12px 14px;
  display: flex; flex-direction: column; gap: 4px;
  border: 1px solid rgba($primary-dark, 0.04);
  &.alert {
    background: linear-gradient(135deg, rgba($alert-warning, 0.14), rgba($alert-warning, 0.05));
    border-color: rgba($alert-warning, 0.3);
  }
}
.mini-label {
  font-size: 0.72rem; font-weight: 600; color: $text-secondary;
  display: inline-flex; align-items: center; gap: 4px;
}
.mini-value {
  font-size: 1.05rem; font-weight: 700; color: $primary-dark;
  &.pos { color: $alert-success; }
}

.stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 28px 12px;
  @media (min-width: 720px) { grid-template-columns: repeat(3, 1fr); }
}
.stat {
  background: linear-gradient(135deg, rgba($primary, 0.06), white);
  border: 1px solid rgba($primary, 0.12);
  border-radius: 18px; padding: 18px 22px;
  display: flex; flex-direction: column; gap: 4px;
}
.stat-value { font-size: 1.8rem; font-weight: 800; color: $primary; }
.stat-label { font-size: 0.85rem; color: $text-secondary; line-height: 1.4; }

.features, .pains, .steps {
  max-width: 1100px; margin: 0 auto; padding: 48px 28px;
}
.section-head { display: flex; flex-direction: column; gap: 6px; margin-bottom: 26px; max-width: 720px; }
.section-eyebrow {
  display: inline-flex; align-items: center; gap: 6px; align-self: flex-start;
  background: rgba($primary, 0.1); color: $primary;
  padding: 5px 12px; border-radius: 14px;
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase;
}
.section-title { margin: 0; font-size: clamp(1.4rem, 1.5vw + 1rem, 2rem); font-weight: 800; color: $primary-dark; line-height: 1.25; }
.section-sub { margin: 0; color: $text-secondary; font-size: 0.95rem; line-height: 1.5; }

.features-grid {
  display: grid; gap: 14px;
  grid-template-columns: 1fr;
  @media (min-width: 640px) { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1000px) { grid-template-columns: repeat(4, 1fr); }
}
.feature-card {
  background: white; border: 1px solid rgba($primary-dark, 0.06);
  border-radius: 18px; padding: 18px;
  display: flex; flex-direction: column; gap: 10px;
  box-shadow: 0 1px 0 rgba($primary-dark, 0.02);
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: translateY(-3px); box-shadow: 0 18px 36px rgba($primary, 0.12); }
}
.feature-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: rgba($primary, 0.1); color: $primary;
  display: inline-flex; align-items: center; justify-content: center; font-size: 1.15rem;
}
.feature-title { font-size: 1rem; font-weight: 700; margin: 0; color: $primary-dark; }
.feature-desc { font-size: 0.85rem; color: $text-secondary; margin: 0; line-height: 1.5; }

.pains-grid {
  display: grid; gap: 14px;
  grid-template-columns: 1fr;
  @media (min-width: 640px) { grid-template-columns: repeat(2, 1fr); }
}
.pain-tile {
  background: linear-gradient(180deg, rgba($primary, 0.04), white);
  border: 1px solid rgba($primary, 0.12); border-radius: 20px; padding: 20px;
  display: flex; flex-direction: column; gap: 10px;
}
.pain-tile-head { display: flex; align-items: center; gap: 12px; }
.pain-tile-icon {
  width: 50px; height: 50px; border-radius: 14px;
  background: white; color: $primary;
  display: inline-flex; align-items: center; justify-content: center; font-size: 1.35rem;
  box-shadow: 0 8px 22px rgba($primary, 0.16);
}
.pain-tile-title { margin: 0; font-size: 1.05rem; font-weight: 700; color: $primary-dark; }
.pain-tile-desc { margin: 0; font-style: italic; color: $primary-dark; font-size: 0.92rem; line-height: 1.5; }
.pain-tile-foot {
  display: inline-flex; align-items: center; gap: 6px;
  color: $primary; font-weight: 700; font-size: 0.85rem;
  margin-top: 4px;
}

.steps-list {
  list-style: none; padding: 0; margin: 0;
  display: grid; gap: 12px;
  grid-template-columns: 1fr;
  @media (min-width: 720px) { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1000px) { grid-template-columns: repeat(4, 1fr); }
}
.step-item {
  position: relative;
  background: white; border: 1px solid rgba($primary-dark, 0.06);
  border-radius: 18px; padding: 18px;
  display: flex; flex-direction: column; gap: 10px;
}
.step-num {
  position: absolute; top: -10px; right: 14px;
  background: $primary; color: white;
  width: 30px; height: 30px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 0.9rem;
  box-shadow: 0 6px 16px rgba($primary, 0.4);
}
.step-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: rgba($primary, 0.1); color: $primary;
  display: inline-flex; align-items: center; justify-content: center; font-size: 1.15rem;
}
.step-title { margin: 0; font-size: 1rem; font-weight: 700; color: $primary-dark; }
.step-desc { margin: 0; font-size: 0.85rem; color: $text-secondary; line-height: 1.5; }

.final-cta {
  margin: 40px auto;
  max-width: 1100px;
  padding: 0 28px;
}
.final-content {
  background: linear-gradient(135deg, $primary-dark, #102a4f);
  color: white; border-radius: 26px;
  padding: 42px 32px; display: flex; flex-direction: column; gap: 18px; align-items: flex-start;
  box-shadow: 0 24px 60px rgba($primary-dark, 0.32);
}
.final-title { font-size: clamp(1.5rem, 1.6vw + 1rem, 2.1rem); font-weight: 800; margin: 0; line-height: 1.2; color: white; }
.final-sub { font-size: 1rem; line-height: 1.5; margin: 0; opacity: 0.85; }
.final-ctas { display: flex; gap: 12px; flex-wrap: wrap; }

.footer {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;
  padding: 22px 28px;
  border-top: 1px solid rgba($primary-dark, 0.06);
  font-size: 0.82rem; color: $text-secondary;
}
.footer-brand { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; color: $primary-dark; }
.footer-links { display: inline-flex; gap: 14px;
  a { color: $text-secondary; }
  a:hover { color: $primary; }
}
</style>
