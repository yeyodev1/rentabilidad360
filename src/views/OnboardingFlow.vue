<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useOnboardingStore } from '@/stores/onboarding'
import { useUIStore } from '@/stores/ui'
import { useRouter, RouterLink } from 'vue-router'
import OnboardingStep1 from './OnboardingStep1.vue'
import OnboardingPainPoints from './OnboardingPainPoints.vue'
import OnboardingStep2 from './OnboardingStep2.vue'
import OnboardingStep3 from './OnboardingStep3.vue'
import OnboardingStep4 from './OnboardingStep4.vue'
import LoadingScreen from './LoadingScreen.vue'

const store = useOnboardingStore()
const ui = useUIStore()
const router = useRouter()

const totalSteps = 5

const steps = [
  { n: 1, label: 'Negocio', icon: 'fa-solid fa-store' },
  { n: 2, label: 'Dolores', icon: 'fa-solid fa-heart-pulse' },
  { n: 3, label: 'Inversión', icon: 'fa-solid fa-sack-dollar' },
  { n: 4, label: 'Ventas', icon: 'fa-solid fa-money-bill-trend-up' },
  { n: 5, label: 'Costos', icon: 'fa-solid fa-receipt' },
]

const progress = computed(() => {
  const current = store.currentStep
  return Math.min(100, Math.max(0, ((current - 1) / (totalSteps - 1)) * 100))
})

const stepLabel = computed(() => steps.find((s) => s.n === store.currentStep)?.label || '')

onMounted(() => {
  if (store.results) {
    router.replace('/dashboard')
  }
})

async function exitFlow() {
  const ok = await ui.requestConfirm({
    title: '¿Salir del diagnóstico?',
    message: 'Tu progreso quedará guardado en este dispositivo. Puedes continuar cuando quieras.',
    confirmLabel: 'Sí, salir',
    cancelLabel: 'Seguir aquí',
    icon: 'fa-solid fa-door-open',
  })
  if (ok) router.push('/')
}

async function resetFlow() {
  const ok = await ui.requestConfirm({
    title: '¿Reiniciar diagnóstico?',
    message: 'Se borrará lo que llevas y empezarás desde el paso 1.',
    confirmLabel: 'Sí, reiniciar',
    cancelLabel: 'Cancelar',
    tone: 'danger',
    icon: 'fa-solid fa-rotate-left',
  })
  if (!ok) return
  store.reset()
  ui.showToast({ title: 'Diagnóstico reiniciado', tone: 'info', icon: 'fa-solid fa-rotate-left' })
}

function jumpTo(n: number) {
  // Only allow going BACK or to current; future steps stay locked
  if (n <= store.currentStep) {
    store.goToStep(n)
  }
}
</script>

<template>
  <div class="ob-shell">
    <div class="ob-bg" aria-hidden="true">
      <div class="blob a" />
      <div class="blob b" />
      <div class="blob c" />
    </div>

    <header class="ob-top">
      <RouterLink to="/" class="ob-brand">
        <span class="brand-mark"><i class="fa-solid fa-chart-pie" /></span>
        <span class="brand-name">Rentabilidad<strong>360</strong></span>
      </RouterLink>

      <div class="ob-progress">
        <div class="ob-track">
          <div class="ob-fill" :style="{ width: progress + '%' }" />
        </div>
        <div class="ob-steps">
          <button
            v-for="s in steps"
            :key="s.n"
            type="button"
            :class="[
              'ob-step',
              {
                done: s.n < store.currentStep,
                active: s.n === store.currentStep,
                locked: s.n > store.currentStep,
              },
            ]"
            :disabled="s.n > store.currentStep || store.showDashboard"
            :aria-label="`Paso ${s.n}: ${s.label}`"
            @click="jumpTo(s.n)"
          >
            <span class="ob-step-dot">
              <i v-if="s.n < store.currentStep" class="fa-solid fa-check" />
              <i v-else :class="s.icon" />
            </span>
            <span class="ob-step-text">
              <em>Paso {{ s.n }}</em>
              <strong>{{ s.label }}</strong>
            </span>
          </button>
        </div>
      </div>

      <div class="ob-actions">
        <button
          type="button"
          class="ob-icon-btn"
          @click="resetFlow"
          title="Reiniciar"
          aria-label="Reiniciar"
        >
          <i class="fa-solid fa-rotate-left" />
        </button>
        <button
          type="button"
          class="ob-icon-btn primary"
          @click="exitFlow"
          title="Salir"
          aria-label="Salir"
        >
          <i class="fa-solid fa-xmark" />
        </button>
      </div>
    </header>

    <div class="ob-current-row">
      <div class="ob-current-pill">
        <span class="cp-eyebrow"><i class="fa-solid fa-bolt" /> Diagnóstico</span>
        <span class="cp-text">
          Paso {{ store.currentStep }} de {{ totalSteps }} · <strong>{{ stepLabel }}</strong>
        </span>
      </div>

      <div v-if="store.tiendas.length > 0" class="ob-tienda-pill">
        <span class="tp-eyebrow"><i class="fa-solid fa-store" /> Diagnóstico para</span>
        <select
          class="tp-select"
          :value="store.activeTiendaId"
          @change="(e) => store.setActiveTienda((e.target as HTMLSelectElement).value)"
        >
          <option v-for="t in store.tiendas" :key="t.id" :value="t.id">
            {{ t.name }}{{ t.isMain ? ' · Principal' : '' }}
          </option>
        </select>
      </div>
      <div v-else class="ob-tienda-pill new">
        <span class="tp-eyebrow"><i class="fa-solid fa-lightbulb" /> Nuevo proyecto</span>
        <span class="tp-text">Crearemos tu primera tienda al terminar</span>
      </div>
    </div>

    <main class="ob-stage">
      <Transition name="slide-fade" mode="out-in">
        <LoadingScreen v-if="store.showDashboard && !store.results" key="loading" />
        <OnboardingStep1 v-else-if="store.currentStep === 1" key="step1" />
        <OnboardingPainPoints v-else-if="store.currentStep === 2" key="pain" />
        <OnboardingStep2 v-else-if="store.currentStep === 3" key="step2" />
        <OnboardingStep3 v-else-if="store.currentStep === 4" key="step3" />
        <OnboardingStep4 v-else-if="store.currentStep === 5" key="step4" />
      </Transition>
    </main>

    <footer class="ob-foot">
      <span class="ob-foot-left">
        <i class="fa-solid fa-shield-halved" /> Tus datos quedan en este dispositivo hasta que crees una cuenta.
      </span>
      <RouterLink to="/login" class="ob-foot-link">
        <i class="fa-solid fa-right-to-bracket" /> Ya tengo cuenta
      </RouterLink>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.ob-shell {
  position: relative;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #f4f6fb;
  overflow: hidden;
}

.ob-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.ob-bg .blob {
  position: absolute; filter: blur(80px); opacity: 0.4; border-radius: 50%;
  &.a { width: 360px; height: 360px; background: $primary; top: -150px; left: -120px; }
  &.b { width: 320px; height: 320px; background: $secondary; bottom: -120px; right: -80px; }
  &.c { width: 220px; height: 220px; background: #ffd66b; top: 30%; right: 18%; opacity: 0.18; }
}

.ob-top {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 18px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba($primary-dark, 0.05);

  @media (max-width: 720px) {
    grid-template-columns: auto auto;
    .ob-progress { grid-column: 1 / -1; order: 3; }
  }
}

.ob-brand {
  display: inline-flex; align-items: center; gap: 10px;
  text-decoration: none;
}
.brand-mark {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, $primary, $secondary);
  color: white; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 11px; font-size: 1rem;
  box-shadow: 0 8px 20px rgba($primary, 0.35);
}
.brand-name {
  font-size: 0.95rem; font-weight: 600; color: $primary-dark;
  strong { color: $primary; font-weight: 800; }
}

.ob-progress {
  display: flex; flex-direction: column; gap: 10px;
  min-width: 0;
}
.ob-track {
  position: relative;
  height: 4px;
  background: rgba($primary-dark, 0.08);
  border-radius: 99px;
  overflow: hidden;
}
.ob-fill {
  height: 100%;
  background: linear-gradient(90deg, $primary, $secondary);
  border-radius: 99px;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.ob-steps {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}
.ob-step {
  display: inline-flex; align-items: center; gap: 8px;
  background: transparent; border: none;
  font-family: $font-principal; cursor: pointer;
  padding: 6px 8px; border-radius: 10px;
  color: $text-secondary; transition: background 0.2s, color 0.2s, transform 0.2s;
  min-width: 0;

  &:hover:not(:disabled) {
    background: rgba($primary, 0.06);
    color: $primary;
    transform: translateY(-1px);
  }
  &.active { color: $primary; }
  &.done .ob-step-dot {
    background: linear-gradient(135deg, $alert-success, #16a34a);
    color: white; border-color: transparent;
  }
  &.active .ob-step-dot {
    background: linear-gradient(135deg, $primary, $secondary);
    color: white; border-color: transparent;
    box-shadow: 0 6px 14px rgba($primary, 0.35);
  }
  &.locked { cursor: not-allowed; opacity: 0.55; }
  &:disabled { cursor: not-allowed; }
}
.ob-step-dot {
  width: 28px; height: 28px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  background: white; color: $primary; font-size: 0.72rem;
  border: 1.5px solid rgba($primary-dark, 0.12);
  flex-shrink: 0;
}
.ob-step-text {
  display: inline-flex; flex-direction: column; line-height: 1.1;
  min-width: 0;
  em {
    font-style: normal; font-size: 0.62rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px;
    color: rgba($primary-dark, 0.45);
  }
  strong {
    font-size: 0.82rem; font-weight: 700;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  @media (max-width: 900px) {
    em { display: none; }
    strong { font-size: 0.75rem; }
  }
  @media (max-width: 520px) {
    display: none;
  }
}

.ob-actions {
  display: inline-flex; gap: 8px; align-items: center;
}
.ob-icon-btn {
  width: 38px; height: 38px; border-radius: 12px;
  background: rgba($primary-dark, 0.05);
  color: $primary-dark;
  border: none; cursor: pointer; font-size: 0.95rem;
  transition: background 0.2s, color 0.2s;
  &:hover { background: rgba($primary-dark, 0.12); }
  &.primary {
    background: rgba($alert-error, 0.1); color: $alert-error;
    &:hover { background: rgba($alert-error, 0.18); }
  }
}

.ob-current-row {
  position: relative; z-index: 2;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.ob-current-pill {
  display: inline-flex; align-items: center; gap: 10px;
  background: white;
  padding: 8px 14px;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba($primary-dark, 0.08);
  border: 1px solid rgba($primary-dark, 0.04);
}
.ob-tienda-pill {
  display: inline-flex; align-items: center; gap: 8px;
  background: white;
  padding: 6px 10px 6px 14px;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba($primary-dark, 0.08);
  border: 1px solid rgba($primary, 0.18);
  &.new {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), white);
    border-color: rgba(245, 158, 11, 0.4);
    padding: 8px 14px;
    .tp-eyebrow { color: #b45309;
      i { color: #f59e0b; }
    }
  }
}
.tp-eyebrow {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.62rem; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase;
  color: $primary;
  background: rgba($primary, 0.1);
  padding: 3px 8px; border-radius: 999px;
  i { font-size: 0.7rem; }
}
.ob-tienda-pill.new .tp-eyebrow { background: rgba(245, 158, 11, 0.18); }
.tp-select {
  font-family: $font-principal; font-weight: 700; font-size: 0.82rem;
  color: $primary-dark;
  border: none; background: transparent;
  outline: none; cursor: pointer;
  padding: 4px 4px 4px 0;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'><path fill='%232094D2' d='M6 7L0 1l1.5-1L6 4.5 10.5 0 12 1z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 4px center;
  padding-right: 18px;
}
.tp-text { font-size: 0.82rem; font-weight: 700; color: $primary-dark; }
.cp-eyebrow {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.62rem; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase;
  color: $primary;
  background: rgba($primary, 0.1);
  padding: 3px 8px; border-radius: 999px;
}
.cp-text {
  font-size: 0.82rem; color: $primary-dark;
  strong { color: $primary; }
}

.ob-stage {
  position: relative; z-index: 1;
  flex: 1;
  display: flex; flex-direction: column;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  padding: 6px 0 0;
}

.ob-foot {
  position: relative; z-index: 2;
  display: flex; flex-wrap: wrap;
  align-items: center; justify-content: space-between;
  gap: 12px;
  padding: 14px 24px;
  font-size: 0.78rem; color: $text-secondary;
  border-top: 1px solid rgba($primary-dark, 0.05);
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(8px);
}
.ob-foot-left { display: inline-flex; align-items: center; gap: 6px; i { color: $secondary; } }
.ob-foot-link {
  display: inline-flex; align-items: center; gap: 6px;
  color: $primary; font-weight: 700; text-decoration: none;
  padding: 4px 10px; border-radius: 8px;
  &:hover { background: rgba($primary, 0.08); }
}

.slide-fade-enter-active { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-fade-leave-active { transition: all 0.2s ease-out; }
.slide-fade-enter-from { opacity: 0; transform: translateX(30px); }
.slide-fade-leave-to { opacity: 0; transform: translateX(-30px); }
</style>
