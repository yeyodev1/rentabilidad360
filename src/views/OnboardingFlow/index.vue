<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'
import { onboardingService } from '@/services/onboardingService'

// Import Step Subcomponents
import Step1Empresa from './components/Step1Empresa.vue'
import Step2Sucursal from './components/Step2Sucursal.vue'
import Step3Horarios from './components/Step3Horarios.vue'
import Step4Recetas from './components/Step4Recetas.vue'
import Step5Ingredientes from './components/Step5Ingredientes.vue'
import Step6Equipos from './components/Step6Equipos.vue'
import Step7CostosFijos from './components/Step7CostosFijos.vue'
import Step8POS from './components/Step8POS.vue'
import Step9Alertas from './components/Step9Alertas.vue'
import Step10Finalizar from './components/Step10Finalizar.vue'

const ui = useUIStore()
const router = useRouter()
const userStore = useUserStore()

const checking = ref(true)
const currentStep = ref(1)
const completedSteps = ref<number[]>([])
const isSubmitting = ref(false)
const direction = ref<'next' | 'prev'>('next')

const steps = [
  { n: 1, label: 'Empresa', icon: 'fa-building', desc: 'Datos legales del negocio', tag: 'Paso 1' },
  { n: 2, label: 'Sucursal', icon: 'fa-store', desc: 'Ubicación y contacto', tag: 'Paso 2' },
  { n: 3, label: 'Horarios', icon: 'fa-clock', desc: 'Cocina y atención al cliente', tag: 'Paso 3' },
  { n: 4, label: 'Recetas', icon: 'fa-utensils', desc: 'Platos e ingredientes', tag: 'Paso 4' },
  { n: 5, label: 'Ingredientes', icon: 'fa-basket-shopping', desc: 'Insumos y costos', tag: 'Paso 5' },
  { n: 6, label: 'Equipos', icon: 'fa-screwdriver-wrench', desc: 'Maquinaria y depreciación', tag: 'Paso 6' },
  { n: 7, label: 'Costos Fijos', icon: 'fa-file-invoice-dollar', desc: 'Gastos mensuales', tag: 'Paso 7' },
  { n: 8, label: 'POS', icon: 'fa-plug', desc: 'Integración opcional', tag: 'Paso 8' },
  { n: 9, label: 'Alertas', icon: 'fa-bell', desc: 'Notificaciones automáticas', tag: 'Paso 9' },
  { n: 10, label: 'Finalizar', icon: 'fa-flag-checkered', desc: 'Todo listo', tag: 'Paso 10' },
]

const stepData = ref<Record<number, any>>({
  1: { legalName: '', commercialName: '', ruc: '', country: '', city: '' },
  2: { name: '', address: '', phone: '' },
  3: {
    cocina: [
      { open: '08:00', close: '22:00' },
      { open: '08:00', close: '22:00' },
      { open: '08:00', close: '22:00' },
      { open: '08:00', close: '22:00' },
      { open: '08:00', close: '22:00' },
      { open: '', close: '' },
      { open: '', close: '' }
    ],
    atencion: [
      { open: '08:00', close: '22:00' },
      { open: '08:00', close: '22:00' },
      { open: '08:00', close: '22:00' },
      { open: '08:00', close: '22:00' },
      { open: '08:00', close: '22:00' },
      { open: '', close: '' },
      { open: '', close: '' }
    ]
  },
  4: { recipes: [{ name: '', sellingPrice: null }] },
  5: { ingredients: [{ name: '', unitOfMeasure: 'unidad', costPrice: null, wastePercentage: null }] },
  6: { equipment: [] },
  7: { rent: null, payroll: null, utilities: null, insurance: null, marketing: null },
  8: { provider: '', apiKey: '', webhookUrl: '' },
  9: { whatsappEnabled: false, emailEnabled: false, pushEnabled: false, checklistAlerts: false, marginAlerts: false, maintenanceAlerts: false, whatsappNumber: '', emailAddress: '' },
  10: {},
})

const currentStepMeta = computed(() => steps.find(s => s.n === currentStep.value)!)
const progress = computed(() => ((currentStep.value - 1) / 9) * 100)

const canGoNext = computed(() => {
  const d = stepData.value[currentStep.value]
  if (!d) return false
  switch (currentStep.value) {
    case 1: return !!(d.legalName && d.ruc)
    case 2: return !!d.name
    case 3:
      const hasCocina = d.cocina?.some((h: any) => h.open && h.close)
      const hasAtencion = d.atencion?.some((h: any) => h.open && h.close)
      return hasCocina && hasAtencion
    case 4: return d.recipes?.length > 0
    case 5: return d.ingredients?.length > 0
    case 6: return d.equipment?.length > 0
    case 7: return d.rent != null
    default: return true
  }
})

const sidebarStep = (s: typeof steps[0]) => {
  if (completedSteps.value.includes(s.n)) return 'done'
  if (s.n === currentStep.value) return 'active'
  return 'locked'
}

async function checkExisting() {
  userStore.hydrate()
  if (!userStore.isAuthenticated) { checking.value = false; return }

  try {
    const res = await onboardingService.getProgress()
    const d = res.data

    if (d?.isComplete) {
      router.replace('/dashboard')
      return
    }
    if (d) {
      currentStep.value = d.currentStep || 1
      completedSteps.value = d.completedSteps || []
      if (d.data) {
        for (const key of Object.keys(d.data)) {
          const stepNum = parseInt(key.replace('step', ''))
          if (stepNum >= 1 && stepNum <= 10 && d.data[key]) {
            stepData.value[stepNum] = { ...stepData.value[stepNum], ...d.data[key] }
          }
        }
      }
    }
  } catch { /* noop */ }
  checking.value = false
}

async function saveCurrentStep() {
  try { await onboardingService.saveStep(currentStep.value, stepData.value[currentStep.value] || {}) } catch { /* noop */ }
}

async function nextStep() {
  if (isSubmitting.value || !canGoNext.value) return
  isSubmitting.value = true; direction.value = 'next'
  try {
    await saveCurrentStep()
    if (!completedSteps.value.includes(currentStep.value)) completedSteps.value.push(currentStep.value)
    currentStep.value < 10 ? currentStep.value++ : await finishOnboarding()
  } finally { isSubmitting.value = false }
}

function prevStep() {
  if (currentStep.value <= 1) return
  direction.value = 'prev'; currentStep.value--
}

async function finishOnboarding() {
  try {
    await onboardingService.completeOnboarding()
    ui.showToast({ title: '¡Configuración completada!', tone: 'success', icon: 'fa-solid fa-check-circle' })
    router.push('/dashboard')
  } catch { ui.showToast({ title: 'Error al finalizar', tone: 'error' }) }
}

function jumpToStep(n: number) {
  if (n <= Math.max(...completedSteps.value, 1) && n !== currentStep.value) {
    direction.value = n > currentStep.value ? 'next' : 'prev'
    currentStep.value = n
  }
}
onMounted(checkExisting)
</script>

<template>
  <div v-if="checking" class="check-screen">
    <div class="cs-spinner" /><p class="cs-text">Preparando tu configuración…</p>
  </div>
  <div v-else class="ob-root">
    <!-- ─── LEFT SIDEBAR ─── -->
    <aside class="ob-sidebar">
      <div class="ob-sidebar-inner">
        <RouterLink to="/" class="ob-logo">
          <span class="ob-logo-mark"><i class="fa-solid fa-chart-pie" /></span>
          <span class="ob-logo-text">Rentabilidad<strong>360</strong></span>
        </RouterLink>

        <div class="ob-side-progress">
          <div class="ob-side-progress-track">
            <div class="ob-side-progress-fill" :style="{ width: progress + '%' }" />
          </div>
          <span class="ob-side-progress-label">{{ Math.round(progress) }}% completado</span>
        </div>

        <nav class="ob-side-nav">
          <button v-for="s in steps" :key="s.n" type="button"
            :class="['ob-side-item', sidebarStep(s)]"
            :disabled="s.n > currentStep"
            @click="jumpToStep(s.n)">
            <span class="ob-side-dot">
              <i v-if="sidebarStep(s) === 'done'" class="fa-solid fa-check" />
              <i v-else :class="'fa-solid ' + s.icon" />
            </span>
            <div class="ob-side-text">
              <span class="ob-side-tag">{{ s.tag }}</span>
              <strong class="ob-side-label">{{ s.label }}</strong>
              <span class="ob-side-desc">{{ s.desc }}</span>
            </div>
            <i v-if="sidebarStep(s) === 'done'" class="fa-solid fa-circle-check ob-side-ok" />
          </button>
        </nav>

        <div class="ob-side-foot">
          <RouterLink to="/" class="ob-side-back">
            <i class="fa-solid fa-arrow-left" /> Salir
          </RouterLink>
        </div>
      </div>
    </aside>

    <!-- ─── RIGHT CONTENT ─── -->
    <main class="ob-main">
      <header class="ob-main-head">
        <div class="ob-main-head-left">
          <span class="ob-main-eyebrow">{{ currentStepMeta.tag }}</span>
          <h1 class="ob-main-title">
            <i :class="'fa-solid ' + currentStepMeta.icon" />
            {{ currentStepMeta.label }}
          </h1>
          <p class="ob-main-desc">{{ currentStepMeta.desc }}</p>
        </div>
        <span class="ob-main-badge">{{ currentStep }}/10</span>
      </header>

      <div class="ob-main-body">
        <Transition :name="direction === 'next' ? 'slide-l' : 'slide-r'" mode="out-in">
          <div :key="'f-'+currentStep" class="ob-form-wrap">
            <Step1Empresa v-if="currentStep === 1" v-model="stepData[1]" />
            <Step2Sucursal v-else-if="currentStep === 2" v-model="stepData[2]" />
            <Step3Horarios v-else-if="currentStep === 3" v-model="stepData[3]" />
            <Step4Recetas v-else-if="currentStep === 4" v-model="stepData[4]" />
            <Step5Ingredientes v-else-if="currentStep === 5" v-model="stepData[5]" />
            <Step6Equipos v-else-if="currentStep === 6" v-model="stepData[6]" />
            <Step7CostosFijos v-else-if="currentStep === 7" v-model="stepData[7]" />
            <Step8POS v-else-if="currentStep === 8" v-model="stepData[8]" />
            <Step9Alertas v-else-if="currentStep === 9" v-model="stepData[9]" />
            <Step10Finalizar v-else-if="currentStep === 10" />
          </div>
        </Transition>
      </div>

      <footer class="ob-main-foot">
        <div class="ob-main-foot-left">
          <button v-if="currentStep > 1" class="ob-btn ob-btn-ghost" @click="prevStep">
            <i class="fa-solid fa-arrow-left" /> Anterior
          </button>
        </div>
        <button class="ob-btn ob-btn-primary" :disabled="!canGoNext || isSubmitting" @click="nextStep">
          <template v-if="isSubmitting">Guardando…</template>
          <template v-else-if="currentStep === 10">Ir al Dashboard <i class="fa-solid fa-rocket" /></template>
          <template v-else>Siguiente <i class="fa-solid fa-arrow-right" /></template>
        </button>
      </footer>
    </main>
  </div>
</template>

<style scoped lang="scss">
/* ── Checking screen ── */
.check-screen {
  min-height: 100dvh; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 16px;
  background: #f4f6fb;
}
.cs-spinner { width: 40px; height: 40px; border: 3px solid rgba($primary, 0.15); border-top-color: $primary; border-radius: 50%; animation: cs-spin 0.7s linear infinite; }
@keyframes cs-spin { to { transform: rotate(360deg); } }
.cs-text { font-size: 0.95rem; color: $text-secondary; font-weight: 600; }

/* ── Root Layout ── */
.ob-root {
  min-height: 100dvh; display: flex;
  background: #f4f6fb;
}

/* ══════ SIDEBAR ══════ */
.ob-sidebar {
  width: 300px; flex-shrink: 0;
  background: $primary-dark;
  color: white;
  display: flex; flex-direction: column;
  position: sticky; top: 0; height: 100dvh;
  overflow-y: auto;
}
.ob-sidebar-inner {
  flex: 1; display: flex; flex-direction: column; gap: 24px;
  padding: 28px 20px;
}

.ob-logo {
  display: inline-flex; align-items: center; gap: 10px;
  text-decoration: none; color: white;
}
.ob-logo-mark {
  width: 34px; height: 34px; border-radius: 10px;
  background: linear-gradient(135deg, $primary, $secondary);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.95rem; box-shadow: 0 6px 14px rgba($primary, 0.35);
}
.ob-logo-text { font-size: 0.92rem; font-weight: 600; strong { color: $primary; font-weight: 800; } }

.ob-side-progress { display: flex; flex-direction: column; gap: 6px; }
.ob-side-progress-track { height: 4px; background: rgba(255,255,255,0.1); border-radius: 99px; overflow: hidden; }
.ob-side-progress-fill { height: 100%; background: linear-gradient(90deg, $primary, $secondary); border-radius: 99px; transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.ob-side-progress-label { font-size: 0.7rem; font-weight: 700; color: rgba(255,255,255,0.5); letter-spacing: 0.3px; }

.ob-side-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.ob-side-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 12px;
  background: transparent; border: none; cursor: pointer;
  text-align: left; font-family: inherit;
  transition: all 0.2s;
  &:hover:not(:disabled) { background: rgba(255,255,255,0.06); }
  &.active {
    background: linear-gradient(135deg, rgba($primary, 0.25), rgba($secondary, 0.15));
    .ob-side-dot { background: linear-gradient(135deg, $primary, $secondary); color: white; border-color: transparent; }
    .ob-side-label { color: white; }
    .ob-side-desc { color: rgba(255,255,255,0.7); }
  }
  &.done {
    .ob-side-dot { background: $alert-success; color: white; border-color: transparent; }
    .ob-side-ok { color: $alert-success; opacity: 1; }
  }
  &.locked { opacity: 0.4; cursor: not-allowed; }
  &:disabled { cursor: not-allowed; }
}
.ob-side-dot {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5);
  font-size: 0.75rem; flex-shrink: 0;
  border: 1.5px solid rgba(255,255,255,0.12);
  transition: all 0.25s;
}
.ob-side-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; line-height: 1.2; }
.ob-side-tag { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: rgba(255,255,255,0.35); }
.ob-side-label { font-size: 0.88rem; font-weight: 700; color: rgba(255,255,255,0.85); transition: color 0.2s; }
.ob-side-desc { font-size: 0.7rem; color: rgba(255,255,255,0.35); transition: color 0.2s; }
.ob-side-ok { font-size: 0.85rem; opacity: 0; transition: opacity 0.3s; }

.ob-side-foot { padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); }
.ob-side-back {
  display: inline-flex; align-items: center; gap: 6px;
  color: rgba(255,255,255,0.5); text-decoration: none;
  font-size: 0.82rem; font-weight: 700; padding: 6px 10px; border-radius: 8px;
  &:hover { color: white; background: rgba(255,255,255,0.06); }
}

/* ══════ MAIN ══════ */
.ob-main {
  flex: 1; display: flex; flex-direction: column;
  min-width: 0; max-width: 680px; margin: 0 auto;
  padding: 0 32px; width: 100%;
}

.ob-main-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
  padding: 40px 0 20px;
}
.ob-main-head-left { min-width: 0; }
.ob-main-eyebrow {
  display: inline-block;
  font-size: 0.65rem; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;
  color: $primary; background: rgba($primary, 0.1);
  padding: 4px 10px; border-radius: 999px; margin-bottom: 8px;
}
.ob-main-title {
  margin: 0; font-size: 1.5rem; font-weight: 800; color: $primary-dark;
  display: flex; align-items: center; gap: 10px;
  i { color: $primary; }
}
.ob-main-desc { margin: 4px 0 0; font-size: 0.9rem; color: $text-secondary; }
.ob-main-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 44px; height: 44px; border-radius: 14px;
  background: linear-gradient(135deg, $primary, $secondary);
  color: white; font-weight: 800; font-size: 0.85rem;
  flex-shrink: 0; box-shadow: 0 6px 16px rgba($primary, 0.25);
}

.ob-main-body {
  flex: 1; display: flex; flex-direction: column;
  overflow-y: auto; padding-bottom: 10px;
}

.ob-form-wrap { flex: 1; }
.ob-fields { display: flex; flex-direction: column; gap: 14px; }

.ob-field {
  display: flex; flex-direction: column; gap: 5px;
  label { font-size: 0.8rem; font-weight: 700; color: $primary-dark; }
  input, select {
    padding: 12px 14px; font-size: 0.9rem;
    border: 1.5px solid rgba($primary-dark, 0.1); border-radius: 10px;
    background: white; outline: none; font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;
    &:focus { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
    &::placeholder { color: rgba($primary-dark, 0.2); }
  }
  select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'><path fill='%236b7280' d='M6 7L0 1l1.5-1L6 4.5 10.5 0 12 1z'/></svg>"); background-repeat: no-repeat; background-position: right 14px center; background-size: 10px 6px; padding-right: 32px; }
}

.ob-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.req { color: $alert-error; }
.ob-hint { font-size: 0.78rem; color: $text-secondary; margin: 0; }

/* ── Subsections (hours, toggles) ── */
.ob-subsection {
  background: rgba($primary-dark, 0.02); border-radius: 14px; padding: 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.ob-subtitle {
  margin: 0 0 4px; font-size: 0.88rem; font-weight: 800; color: $primary-dark;
  display: flex; align-items: center; gap: 8px;
  i { color: $primary; }
}

.ob-tabs {
  display: flex; gap: 6px;
  button { flex: 1; }
}
.ob-tab {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px; border-radius: 10px;
  border: 1.5px solid rgba($primary-dark, 0.08); background: white;
  font-family: inherit; font-weight: 700; font-size: 0.85rem;
  color: $text-secondary; cursor: pointer;
  transition: all 0.2s;
  i { font-size: 0.8rem; }
  &.active {
    border-color: $primary; color: $primary; background: rgba($primary, 0.05);
    i { color: $primary; }
  }
  &:hover:not(.active) { border-color: rgba($primary, 0.3); color: $primary-dark; }
}

.ob-schedule {
  border: 1px solid rgba($primary-dark, 0.06);
  border-radius: 12px; overflow: hidden;
  background: white;
}
.ob-sch-head {
  display: grid;
  grid-template-columns: 44px 1fr 24px 1fr;
  gap: 6px; align-items: center;
  padding: 8px 12px;
  background: rgba($primary-dark, 0.03);
  border-bottom: 1px solid rgba($primary-dark, 0.06);
}
.ob-sch-row {
  display: grid;
  grid-template-columns: 44px 1fr 24px 1fr;
  gap: 6px; align-items: center;
  padding: 6px 12px;
  border-bottom: 1px solid rgba($primary-dark, 0.04);
  transition: background 0.15s;
  &:hover { background: rgba($primary, 0.03); }
  &:last-child { border-bottom: none; }
  &.off { opacity: 0.5; }
}
.ob-sch-cell {
  font-size: 0.8rem; font-weight: 700; color: $primary-dark;
  &.day { font-size: 0.78rem; color: $text-secondary; }
  &.sep { display: flex; align-items: center; justify-content: center; color: rgba($primary-dark, 0.15); font-size: 0.7rem; }
}

/* ── Array rows ── */
.ob-array-row {
  display: flex; gap: 8px; align-items: center;
  background: white; padding: 10px 12px; border-radius: 10px;
  border: 1px solid rgba($primary-dark, 0.07);
  input, select { padding: 9px 10px; font-size: 0.85rem; border: 1.5px solid rgba($primary-dark, 0.08); border-radius: 8px; background: #fafbfc; outline: none; flex: 1; min-width: 0; &:focus { border-color: $primary; background: white; } }
}
.ob-sm { max-width: 130px !important; }
.ob-xs { max-width: 80px !important; }
.ob-rm {
  width: 28px; height: 28px; border-radius: 8px; border: none;
  display: flex; align-items: center; justify-content: center;
  background: transparent; color: rgba($primary-dark, 0.2); cursor: pointer; flex-shrink: 0;
  &:hover { background: rgba($alert-error, 0.1); color: $alert-error; }
}
.ob-add {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 16px; border-radius: 10px;
  background: rgba($primary, 0.08); color: $primary;
  border: 1.5px dashed rgba($primary, 0.3);
  font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
  &:hover { background: rgba($primary, 0.15); border-color: $primary; }
}

/* ── Toggles ── */
.ob-tog {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 0;
  span { font-size: 0.85rem; font-weight: 600; color: $primary-dark; display: flex; align-items: center; gap: 8px; i, .fa-brands { color: $primary; width: 16px; text-align: center; } }
}
.tg {
  position: relative; width: 42px; height: 24px; flex-shrink: 0;
  input { opacity: 0; width: 0; height: 0; }
  .tg-slider {
    position: absolute; cursor: pointer; inset: 0; background: #d1d5db; border-radius: 24px; transition: 0.25s;
    &::before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.25s; }
  }
  input:checked + .tg-slider { background: $primary; }
  input:checked + .tg-slider::before { transform: translateX(18px); }
}

/* ── Done screen ── */
.ob-done { align-items: center; text-align: center; padding: 40px 0; }
.ob-done-icon { font-size: 3.5rem; color: $alert-success; margin-bottom: 8px; }
.ob-done-title { margin: 0; font-size: 1.3rem; font-weight: 800; color: $primary-dark; }
.ob-done-desc { font-size: 0.88rem; color: $text-secondary; margin: 4px 0 24px; }
.ob-done-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; max-width: 400px; }
.ob-done-item {
  display: flex; align-items: center; gap: 8px; padding: 12px;
  border-radius: 10px; background: rgba($primary, 0.04);
  font-size: 0.82rem; font-weight: 600; color: $primary-dark;
  i { color: $alert-success; }
}

/* ── Footer ── */
.ob-main-foot {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 0; padding-bottom: max(20px, env(safe-area-inset-bottom));
  border-top: 1px solid rgba($primary-dark, 0.06);
  margin-top: 16px;
}
.ob-main-foot-left { min-width: 120px; }

.ob-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 24px; border-radius: 12px;
  font-family: inherit; font-weight: 800; font-size: 0.88rem;
  cursor: pointer; border: none; transition: all 0.2s;
  &:active:not(:disabled) { transform: scale(0.97); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
}
.ob-btn-primary {
  background: linear-gradient(135deg, $primary, $secondary); color: white;
  box-shadow: 0 4px 14px rgba($primary, 0.3);
  &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px rgba($primary, 0.35); }
}
.ob-btn-ghost {
  background: transparent; color: $text-secondary;
  &:hover { color: $primary-dark; background: rgba($primary-dark, 0.04); }
}

/* ── Transitions ── */
.slide-l-enter-active, .slide-l-leave-active,
.slide-r-enter-active, .slide-r-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-l-enter-from { opacity: 0; transform: translateX(30px); }
.slide-l-leave-to { opacity: 0; transform: translateX(-30px); }
.slide-r-enter-from { opacity: 0; transform: translateX(-30px); }
.slide-r-leave-to { opacity: 0; transform: translateX(30px); }

/* ══════ RESPONSIVE ══════ */
@media (max-width: 820px) {
  .ob-root { flex-direction: column; }
  .ob-sidebar {
    position: static; width: 100%; height: auto; min-height: auto;
  }
  .ob-sidebar-inner { padding: 16px; gap: 16px; }
  .ob-side-nav { flex-direction: row; flex-wrap: wrap; gap: 4px; }
  .ob-side-item { flex: 1; min-width: 80px; padding: 8px 10px; flex-direction: column; align-items: center; text-align: center; gap: 6px; }
  .ob-side-text { align-items: center; }
  .ob-side-ok { display: none; }
  .ob-side-foot { display: none; }
  .ob-main { padding: 0 16px; }
  .ob-main-head { padding: 24px 0 16px; flex-wrap: wrap; }
  .ob-main-title { font-size: 1.2rem; }
  .ob-row { grid-template-columns: 1fr; }
  .ob-sch-head, .ob-sch-row { grid-template-columns: 36px 1fr 20px 1fr; gap: 4px; padding: 6px 8px; }
  .ob-done-grid { grid-template-columns: 1fr; }
  .ob-main-foot { flex-direction: column-reverse; gap: 10px; align-items: stretch; }
  .ob-main-foot-left { min-width: 0; }
  .ob-btn { justify-content: center; }
}

/* ── Redesigned Premium Schedule UI ── */
.ob-schedule-premium {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
}
.ob-sch-card {
  background: white;
  border: 1.5px solid rgba($primary-dark, 0.08);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba($primary-dark, 0.02);

  &.off {
    background: rgba($primary-dark, 0.02);
    border-color: rgba($primary-dark, 0.04);
    opacity: 0.75;
    .ob-sch-day-name {
      color: $text-secondary;
    }
  }
}
.ob-sch-row-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.ob-sch-day-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 140px;
}
.ob-sch-day-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: $primary-dark;
  min-width: 90px;
}
.ob-sch-controls {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  min-width: 240px;
}
.ob-sch-inputs-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  justify-content: flex-end;
}
.time-input-group {
  position: relative;
  display: flex;
  align-items: center;
  background: #fafbfc;
  border: 1.5px solid rgba($primary-dark, 0.1);
  border-radius: 10px;
  padding: 0 10px;
  transition: all 0.2s;
  
  &:focus-within {
    border-color: $primary;
    background: white;
    box-shadow: 0 0 0 3px rgba($primary, 0.1);
  }
}
.icon-clock {
  color: $primary;
  font-size: 0.85rem;
  margin-right: 6px;
}
.ob-time-input {
  border: none;
  background: transparent;
  padding: 8px 0;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  color: $primary-dark;
  outline: none;
  width: 70px;
}
.to-text {
  font-size: 0.85rem;
  font-weight: 700;
  color: $text-secondary;
}
.ob-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1.5px solid rgba($primary, 0.15);
  border-radius: 10px;
  background: rgba($primary, 0.04);
  color: $primary;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 8px;

  &:hover {
    background: $primary;
    color: white;
    border-color: $primary;
  }
}
.ob-sch-closed-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  color: $text-secondary;
  background: rgba($primary-dark, 0.06);
  padding: 6px 12px;
  border-radius: 20px;
}
.ob-sch-timeline-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 6px;
  border-top: 1px dashed rgba($primary-dark, 0.06);
}
.ob-sch-timeline-hours {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: $text-secondary;
  font-weight: 600;
  padding: 0 4px;
}
.ob-sch-timeline-track {
  height: 20px;
  background: #f1f3f7;
  border-radius: 99px;
  position: relative;
  overflow: hidden;
}
.ob-sch-timeline-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  background: linear-gradient(90deg, $primary, $secondary);
  border-radius: 99px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba($primary, 0.2);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.bar-label {
  font-size: 0.65rem;
  color: white;
  font-weight: 800;
  letter-spacing: 0.2px;
  pointer-events: none;
  white-space: nowrap;
}
</style>

