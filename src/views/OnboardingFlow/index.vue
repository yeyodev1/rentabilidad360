<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'
import { onboardingService } from '@/services/onboardingService'

import Step1Empresa from './components/Step1Empresa.vue'
import Step2Sucursal from './components/Step2Sucursal.vue'
import Step7CostosFijos from './components/Step7CostosFijos.vue'
import Step4Recetas from './components/Step4Recetas.vue'
import Step6Equipos from './components/Step6Equipos.vue'
import Step10Finalizar from './components/Step10Finalizar.vue'

const ui = useUIStore()
const router = useRouter()
const userStore = useUserStore()

const checking = ref(true)
const currentStep = ref(1)
const completedSteps = ref<number[]>([])
const isSubmitting = ref(false)
const direction = ref<'next' | 'prev'>('next')
const onboardingType = ref<'project' | 'existing' | null>(null)

// 6 steps total, same sequence for both business types — only the copy/labels
// inside each step component adapt to "proyecto nuevo" vs "negocio existente".
const steps = [
  { n: 1, label: 'Empresa', icon: 'fa-building', desc: 'Datos legales del negocio' },
  { n: 2, label: 'Sucursal', icon: 'fa-store', desc: 'Ubicación y contacto' },
  { n: 3, label: 'Costos Fijos', icon: 'fa-receipt', desc: 'Lo mínimo para calcular tu punto de partida' },
  { n: 4, label: 'Platos', icon: 'fa-utensils', desc: 'Costo y precio sugerido de tu menú' },
  { n: 5, label: 'Equipos', icon: 'fa-screwdriver-wrench', desc: 'Maquinaria para dar mantenimiento con QR' },
  { n: 6, label: 'Finalizar', icon: 'fa-flag-checkered', desc: 'Todo listo' },
]

const activeSteps = computed(() => steps)

const stepData = ref<Record<number, any>>({
  1: { legalName: '', commercialName: '', ruc: '', country: '', city: '' },
  2: { name: '', address: '', phone: '', hasPhysicalStore: true },
  3: { skipped: false, rent: null, payroll: null, utilities: null, internet: null, insurance: null, marketing: null },
  4: { skipped: false, recipes: [] },
  5: { skipped: false, equipment: [] },
  6: {},
})

const currentStepMeta = computed(() => activeSteps.value.find(s => s.n === currentStep.value) || steps.find(s => s.n === currentStep.value) || steps[0]!)
const totalSteps = computed(() => activeSteps.value.length)
const currentStepIndex = computed(() => activeSteps.value.findIndex(s => s.n === currentStep.value))
const progress = computed(() => ((currentStepIndex.value + 1) / Math.max(1, totalSteps.value)) * 100)

const canGoNext = computed(() => {
  const d = stepData.value[currentStep.value]
  if (!d) return false
  switch (currentStep.value) {
    case 1: return !!(d.legalName && d.ruc)
    case 2: return !!d.name
    case 3: return true
    case 4: return d.skipped || !d.recipes || d.recipes.length === 0 || d.recipes.some((r: any) => r.name && r.productionCost != null)
    case 5: return d.skipped || !d.equipment || d.equipment.length === 0 || d.equipment.some((e: any) => e.name)
    default: return true
  }
})

async function checkExisting() {
  userStore.hydrate()
  if (!userStore.isAuthenticated) { checking.value = false; return }

  try {
    const res = await onboardingService.getProgress()
    const d: any = res.data

    if (d?.isComplete) {
      router.replace('/dashboard')
      return
    }
    if (d) {
      if (d.completedSteps && d.completedSteps.length > 0) {
        onboardingType.value = (d.businessStage === 'existing' ? 'existing' : 'project')
        let savedStep = d.currentStep || 1
        if (savedStep > 6) savedStep = 6
        currentStep.value = savedStep
      } else {
        onboardingType.value = null
        currentStep.value = 1
      }
      completedSteps.value = d.completedSteps || []
      if (d.data) {
        for (const key of Object.keys(d.data)) {
          const stepNum = parseInt(key.replace('step', ''))
          if (stepNum >= 1 && stepNum <= 6 && d.data[key]) {
            stepData.value[stepNum] = { ...stepData.value[stepNum], ...d.data[key] }
          }
        }
      }
    }
  } catch { /* noop */ }
  checking.value = false
}

async function saveCurrentStep() {
  try {
    const payload = { ...(stepData.value[currentStep.value] || {}) }
    if (currentStep.value === 1) {
      payload.businessStage = onboardingType.value === 'existing' ? 'existing' : 'new'
    }
    await onboardingService.saveStep(currentStep.value, payload)
  } catch { /* noop */ }
}

async function nextStep() {
  if (isSubmitting.value || !canGoNext.value) return
  isSubmitting.value = true; direction.value = 'next'
  try {
    if (currentStep.value < 6) {
      await saveCurrentStep()
      if (!completedSteps.value.includes(currentStep.value)) completedSteps.value.push(currentStep.value)
    }

    const nextIdx = currentStepIndex.value + 1
    if (nextIdx < activeSteps.value.length) {
      currentStep.value = activeSteps.value[nextIdx]?.n || 1
    } else {
      await finishOnboarding()
    }
  } finally { isSubmitting.value = false }
}

function prevStep() {
  if (currentStepIndex.value <= 0) return
  direction.value = 'prev'
  currentStep.value = activeSteps.value[currentStepIndex.value - 1]?.n || 1
}

async function finishOnboarding() {
  try {
    await onboardingService.completeOnboarding()
    ui.showToast({ title: '¡Todo listo! Bienvenido a Allio', tone: 'success', icon: 'fa-solid fa-check-circle' })
    router.push('/dashboard')
  } catch { ui.showToast({ title: 'Error al finalizar', tone: 'error' }) }
}

function jumpToStep(n: number) {
  if (n <= Math.max(...completedSteps.value, 1) && n !== currentStep.value) {
    direction.value = n > currentStep.value ? 'next' : 'prev'
    currentStep.value = n
  }
}

async function confirmExit() {
  const ok = await ui.requestConfirm({
    title: '¿Salir de la configuración?',
    message: 'Tu progreso se guarda automáticamente, puedes continuar más tarde.',
    confirmLabel: 'Salir',
    cancelLabel: 'Seguir aquí',
    icon: 'fa-solid fa-arrow-right-from-bracket',
  })
  if (ok) router.push('/')
}

function selectType(type: 'project' | 'existing') {
  onboardingType.value = type
  currentStep.value = 1
}

onMounted(checkExisting)
</script>

<template>
  <div v-if="checking" class="check-screen">
    <div class="cs-spinner" /><p class="cs-text">Preparando tu configuración…</p>
  </div>

  <div v-else-if="!onboardingType" class="type-selector-screen">
    <div class="float-particle" />
    <div class="float-particle" />
    <div class="float-particle" />
    <div class="float-particle" />
    <div class="float-particle" />
    <div class="ts-card">
      <div class="ts-header">
        <div class="ts-emoji"><i class="fa-solid fa-wand-magic-sparkles" /></div>
        <h1>¿Qué vas a crear hoy?</h1>
        <p>Elige el tipo de configuración para tu negocio</p>
      </div>
      <div class="ts-options">
        <button class="ts-option" @click="selectType('project')">
          <div class="ts-icon"><i class="fa-solid fa-rocket" /></div>
          <div class="ts-info">
            <strong>Proyecto nuevo</strong>
            <span>Vas a abrir un negocio: empresa, sucursal, costos proyectados, menú planeado y equipos</span>
          </div>
          <i class="fa-solid fa-chevron-right ts-arrow" />
        </button>
        <button class="ts-option" @click="selectType('existing')">
          <div class="ts-icon"><i class="fa-solid fa-building" /></div>
          <div class="ts-info">
            <strong>Negocio existente</strong>
            <span>Ya operas: registra tu empresa, costos actuales, tu menú actual y equipos para mantenimiento</span>
          </div>
          <i class="fa-solid fa-chevron-right ts-arrow" />
        </button>
      </div>
    </div>
  </div>

  <div v-else class="ob-shell">
    <header class="ob-topbar">
      <RouterLink to="/" class="ob-brand">
        <span class="ob-brand-mark"><i class="fa-solid fa-chart-pie" /></span>
        <strong>Allio</strong>
      </RouterLink>
      <button type="button" class="ob-exit" @click="confirmExit">
        Salir <i class="fa-solid fa-xmark" />
      </button>
    </header>

    <div class="ob-progress">
      <div class="ob-progress-track">
        <div class="ob-progress-fill" :style="{ width: progress + '%' }" />
      </div>
      <div class="ob-progress-row">
        <div class="ob-dots">
          <button
            v-for="s in activeSteps" :key="s.n" type="button"
            class="ob-dot"
            :class="{ done: completedSteps.includes(s.n), active: s.n === currentStep }"
            :disabled="s.n > currentStep && !completedSteps.includes(s.n)"
            :title="s.label"
            @click="jumpToStep(s.n)"
          >
            <i v-if="completedSteps.includes(s.n)" class="fa-solid fa-check" />
          </button>
        </div>
        <span class="ob-progress-label">Paso {{ currentStepIndex + 1 }} de {{ totalSteps }}</span>
      </div>
    </div>

    <main class="ob-stage">
      <Transition :name="direction === 'next' ? 'slide-l' : 'slide-r'" mode="out-in">
        <section :key="'f-' + currentStep" class="ob-card">
          <header class="ob-card-head">
            <span class="ob-card-icon"><i :class="'fa-solid ' + currentStepMeta.icon" /></span>
            <div class="ob-card-head-text">
              <h1>{{ currentStepMeta.label }}</h1>
              <p>{{ currentStepMeta.desc }}</p>
            </div>
          </header>

          <div class="ob-card-body">
            <Step1Empresa v-if="currentStep === 1" v-model="stepData[1]" />
            <Step2Sucursal v-else-if="currentStep === 2" v-model="stepData[2]" />
            <Step7CostosFijos v-else-if="currentStep === 3" v-model="stepData[3]" />
            <Step4Recetas v-else-if="currentStep === 4" v-model="stepData[4]" :business-stage="onboardingType" />
            <Step6Equipos v-else-if="currentStep === 5" v-model="stepData[5]" />
            <Step10Finalizar v-else-if="currentStep === 6" />
          </div>
        </section>
      </Transition>
    </main>

    <footer class="ob-footer">
      <button v-if="currentStepIndex > 0" class="ob-btn ob-btn-ghost" @click="prevStep">
        <i class="fa-solid fa-arrow-left" /> Anterior
      </button>
      <span v-else class="ob-footer-spacer" />
      <button class="ob-btn ob-btn-primary" :disabled="!canGoNext || isSubmitting" @click="nextStep">
        <template v-if="isSubmitting">Guardando…</template>
        <template v-else-if="currentStep === 6"><i class="fa-solid fa-rocket" /> Ir al Inicio</template>
        <template v-else>Siguiente <i class="fa-solid fa-arrow-right" /></template>
      </button>
    </footer>
  </div>
</template>

<style scoped lang="scss">
/* ── Checking screen ── */
.check-screen {
  min-height: 100dvh; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 16px;
  background: $bg;
}
.cs-spinner { width: 40px; height: 40px; border: 3px solid rgba($primary, 0.15); border-top-color: $primary; border-radius: 50%; animation: cs-spin 0.7s linear infinite; }
@keyframes cs-spin { to { transform: rotate(360deg); } }
.cs-text { font-size: 0.95rem; color: $text-secondary; font-weight: 600; }

/* ── Type Selector Screen ── */
.type-selector-screen {
  min-height: 100dvh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(160deg, #2F243A 0%, #3d3050 30%, #588B8B 70%, #4a7373 100%);
  padding: 24px; position: relative; overflow: hidden;
}
.type-selector-screen::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(circle at 20% 50%, rgba(88,139,139,0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(138,201,38,0.1) 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, rgba(123,163,163,0.1) 0%, transparent 50%);
  pointer-events: none;
}
.type-selector-screen .float-particle {
  position: absolute; border-radius: 50%; pointer-events: none;
  animation: float-up linear infinite;
}
.type-selector-screen .float-particle:nth-child(1) {
  width: 6px; height: 6px; background: rgba(255,255,255,0.08);
  left: 10%; bottom: -10px; animation-duration: 12s; animation-delay: 0s;
}
.type-selector-screen .float-particle:nth-child(2) {
  width: 4px; height: 4px; background: rgba(255,255,255,0.06);
  left: 30%; bottom: -10px; animation-duration: 15s; animation-delay: 2s;
}
.type-selector-screen .float-particle:nth-child(3) {
  width: 8px; height: 8px; background: rgba(88,139,139,0.2);
  left: 50%; bottom: -10px; animation-duration: 18s; animation-delay: 4s;
}
.type-selector-screen .float-particle:nth-child(4) {
  width: 5px; height: 5px; background: rgba(138,201,38,0.15);
  left: 70%; bottom: -10px; animation-duration: 14s; animation-delay: 1s;
}
.type-selector-screen .float-particle:nth-child(5) {
  width: 7px; height: 7px; background: rgba(255,255,255,0.05);
  left: 90%; bottom: -10px; animation-duration: 16s; animation-delay: 3s;
}
@keyframes float-up {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 0.5; }
  100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
}
.ts-card {
  background: rgba(255,255,255,0.97); border-radius: 28px; padding: 48px 40px;
  max-width: 520px; width: 100%; position: relative; z-index: 1;
  box-shadow: 0 40px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05);
  display: flex; flex-direction: column; gap: 32px;
  animation: card-in 0.6s cubic-bezier(0.16,1,0.3,1);
}
@keyframes card-in { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
.ts-header {
  text-align: center;
  .ts-emoji {
    width: 64px; height: 64px; border-radius: 20px;
    background: linear-gradient(135deg, $primary, $secondary);
    color: white; font-size: 1.5rem;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px; box-shadow: 0 8px 24px rgba($primary,0.3);
    animation: bounce-icon 2s ease-in-out infinite;
  }
  @keyframes bounce-icon { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  h1 { font-size: 1.7rem; font-weight: 800; color: $primary-dark; margin: 0 0 10px; letter-spacing: -0.3px; }
  p { font-size: 0.9rem; color: $text-secondary; margin: 0; line-height: 1.6; }
}
.ts-options { display: flex; flex-direction: column; gap: 12px; }
.ts-option {
  display: flex; align-items: center; gap: 18px; padding: 22px 24px;
  background: white; border: 2px solid rgba($primary-dark, 0.06); border-radius: 18px;
  cursor: pointer; text-align: left; transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
  position: relative; overflow: hidden;
  &::before { content: ''; position: absolute; inset: 0; opacity: 0; background: linear-gradient(135deg, rgba($primary,0.03), rgba($secondary,0.02)); transition: opacity 0.3s; }
  &:hover { border-color: $primary; box-shadow: 0 12px 32px rgba($primary, 0.15); transform: translateY(-3px) scale(1.01);
    &::before { opacity: 1; }
    .ts-icon { background: linear-gradient(135deg, $primary, $secondary); color: white; transform: scale(1.08) rotate(-5deg); }
    .ts-arrow { color: $primary; transform: translateX(4px); }
  }
  &:active { transform: translateY(-1px) scale(0.99); }
}
.ts-icon {
  width: 54px; height: 54px; border-radius: 16px;
  background: linear-gradient(135deg, rgba($primary,0.08), rgba($secondary,0.04)); color: $primary;
  display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.16,1,0.3,1); position: relative; z-index: 1;
}
.ts-info {
  flex: 1; display: flex; flex-direction: column; gap: 4px; position: relative; z-index: 1;
  strong { font-size: 1.05rem; font-weight: 700; color: $primary-dark; }
  span { font-size: 0.82rem; color: $text-secondary; line-height: 1.35; }
}
.ts-arrow { color: rgba($primary-dark, 0.15); font-size: 0.9rem; transition: all 0.3s; position: relative; z-index: 1; }

/* ══════════════════════════════════════════════
   NEW SHELL — single-column, focused, premium
   ══════════════════════════════════════════════ */
.ob-shell {
  min-height: 100dvh;
  background: $bg;
  display: flex;
  flex-direction: column;
}

/* ── Topbar ── */
.ob-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px;
  max-width: 720px; width: 100%; margin: 0 auto;
  @media (min-width: 700px) { padding: 28px 24px 12px; }
}
.ob-brand {
  display: inline-flex; align-items: center; gap: 8px;
  text-decoration: none; color: $primary-dark; font-size: 0.95rem;
}
.ob-brand-mark {
  width: 30px; height: 30px; border-radius: 9px;
  background: linear-gradient(135deg, $primary, $secondary); color: white;
  display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem;
  box-shadow: 0 4px 12px rgba($primary, 0.3);
}
.ob-exit {
  display: inline-flex; align-items: center; gap: 6px;
  background: transparent; border: none; cursor: pointer;
  color: $text-secondary; font-family: inherit; font-weight: 700; font-size: 0.82rem;
  padding: 8px 12px; border-radius: 10px; transition: all 0.2s;
  &:hover { background: rgba($primary-dark, 0.05); color: $primary-dark; }
}

/* ── Progress ── */
.ob-progress {
  max-width: 720px; width: 100%; margin: 0 auto;
  padding: 0 24px 20px;
  display: flex; flex-direction: column; gap: 10px;
}
.ob-progress-track {
  height: 6px; border-radius: 99px; background: rgba($primary-dark, 0.08); overflow: hidden;
}
.ob-progress-fill {
  height: 100%; border-radius: 99px;
  background: linear-gradient(90deg, $primary, $accent);
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.ob-progress-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ob-dots { display: flex; gap: 6px; }
.ob-dot {
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid rgba($primary-dark, 0.12); background: white;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 0.6rem; color: transparent; cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  &:disabled { cursor: not-allowed; }
  &.active { border-color: $primary; box-shadow: 0 0 0 4px rgba($primary, 0.15); transform: scale(1.1); }
  &.done { background: $primary; border-color: $primary; color: white; }
}
.ob-progress-label { font-size: 0.78rem; font-weight: 700; color: $text-secondary; white-space: nowrap; }

/* ── Stage / Card ── */
.ob-stage {
  flex: 1; display: flex; flex-direction: column;
  max-width: 720px; width: 100%; margin: 0 auto;
  padding: 0 24px 16px;
}
.ob-card {
  background: white; border-radius: 24px;
  box-shadow: 0 4px 24px rgba($primary-dark, 0.05), 0 1px 0 rgba($primary-dark, 0.02);
  padding: 32px 28px;
  display: flex; flex-direction: column; gap: 24px;
  @media (min-width: 700px) { padding: 40px 44px; }
}
.ob-card-head {
  display: flex; align-items: flex-start; gap: 16px;
}
.ob-card-icon {
  width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
  background: rgba($primary, 0.1); color: $primary;
  display: inline-flex; align-items: center; justify-content: center; font-size: 1.2rem;
}
.ob-card-head-text {
  h1 { margin: 0; font-size: 1.4rem; font-weight: 800; color: $primary-dark; letter-spacing: -0.3px; }
  p { margin: 4px 0 0; font-size: 0.88rem; color: $text-secondary; line-height: 1.4; }
}
.ob-card-body { display: flex; flex-direction: column; }

/* Deep overrides so child step components blend into the card instead of
   drawing their own nested white box. */
.ob-card-body :deep(.ob-fields) { display: flex; flex-direction: column; gap: 18px; }
.ob-card-body :deep(.ob-field label) { font-size: 0.85rem; font-weight: 700; color: $primary-dark; }
.ob-card-body :deep(.ob-field input),
.ob-card-body :deep(.ob-field select) {
  padding: 14px 16px; font-size: 0.95rem; border-radius: 12px;
  border: 1.5px solid rgba($primary-dark, 0.1); background: white; outline: none; font-family: inherit;
  transition: all 0.2s;
  &:focus { border-color: $primary; box-shadow: 0 0 0 4px rgba($primary, 0.1); }
}
.ob-card-body :deep(.ob-row) { gap: 16px; }

/* Step components that used to render their own outer "editor" card —
   flatten them so there's no box-inside-a-box. */
.ob-card-body :deep(.ob-recipes-editor),
.ob-card-body :deep(.ob-fixed-costs-editor),
.ob-card-body :deep(.ob-equipment-editor) {
  background: transparent; border: none; box-shadow: none; padding: 0;
}

/* ── Footer ── */
.ob-footer {
  max-width: 720px; width: 100%; margin: 0 auto;
  padding: 4px 24px 32px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.ob-footer-spacer { flex: 1; }

.ob-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 26px; border-radius: 14px;
  font-family: inherit; font-weight: 800; font-size: 0.9rem;
  cursor: pointer; border: none;
  transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
  &:active:not(:disabled) { transform: scale(0.96); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}
.ob-btn-primary {
  background: linear-gradient(135deg, $primary, $secondary); color: white;
  box-shadow: 0 6px 20px rgba($primary, 0.3);
  margin-left: auto;
  &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba($primary, 0.4); }
  &:active:not(:disabled) { transform: translateY(0) scale(0.97); }
  i { transition: transform 0.25s; }
  &:hover:not(:disabled) i { transform: translateX(3px); }
}
.ob-btn-ghost {
  background: transparent; color: $text-secondary;
  &:hover { color: $primary-dark; background: rgba($primary-dark, 0.05); }
}

/* ── Transitions ── */
.slide-l-enter-active, .slide-l-leave-active,
.slide-r-enter-active, .slide-r-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-l-enter-from { opacity: 0; transform: translateY(16px) scale(0.99); }
.slide-l-leave-to { opacity: 0; transform: translateY(-16px) scale(0.99); }
.slide-r-enter-from { opacity: 0; transform: translateY(-16px) scale(0.99); }
.slide-r-leave-to { opacity: 0; transform: translateY(16px) scale(0.99); }

/* ── Done screen ── */
.ob-card-body :deep(.ob-done) {
  align-items: center; text-align: center; padding: 12px 0;
}
.ob-card-body :deep(.ob-done-icon) { font-size: 3.5rem; color: $alert-success; margin-bottom: 4px; }
.ob-card-body :deep(.ob-done-title) { margin: 0; font-size: 1.2rem; font-weight: 800; color: $primary-dark; }
.ob-card-body :deep(.ob-done-desc) { font-size: 0.88rem; color: $text-secondary; margin: 4px 0 20px; }
.ob-card-body :deep(.ob-done-grid) { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
.ob-card-body :deep(.ob-done-item) {
  display: flex; align-items: center; gap: 8px; padding: 12px;
  border-radius: 10px; background: rgba($primary, 0.05);
  font-size: 0.8rem; font-weight: 600; color: $primary-dark;
  i { color: $alert-success; }
}

/* ══════ RESPONSIVE ══════ */
@media (max-width: 700px) {
  .ob-card { padding: 24px 20px; border-radius: 20px; }
  .ob-card-head { gap: 12px; }
  .ob-card-icon { width: 40px; height: 40px; font-size: 1rem; }
  .ob-card-head-text h1 { font-size: 1.2rem; }
  .ob-card-body :deep(.ob-row) { grid-template-columns: 1fr; }
  .ob-card-body :deep(.ob-done-grid) { grid-template-columns: 1fr; }
  .ob-footer { flex-direction: column-reverse; align-items: stretch; }
  .ob-btn { justify-content: center; margin-left: 0; }
}
</style>
