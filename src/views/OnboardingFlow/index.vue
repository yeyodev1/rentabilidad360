<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import TimePicker from '@/components/TimePicker.vue'
import { useUserStore } from '@/stores/user'
import { onboardingService } from '@/services/onboardingService'

const ui = useUIStore()
const router = useRouter()
const userStore = useUserStore()

const checking = ref(true)
const currentStep = ref(1)
const completedSteps = ref<number[]>([])
const isSubmitting = ref(false)
const direction = ref<'next' | 'prev'>('next')
const step3tab = ref<'cocina' | 'atencion'>('cocina')

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
  3: { cocina: Array.from({ length: 7 }, () => ({ open: '', close: '' })), atencion: Array.from({ length: 7 }, () => ({ open: '', close: '' })) },
  4: { recipes: [] },
  5: { ingredients: [] },
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

function onStepDataUpdate(step: number, data: any) { stepData.value[step] = data }

function updateHour(area: 'cocina' | 'atencion', dayIndex: number, field: 'open' | 'close', value: string) {
  const d = stepData.value[3]
  if (!d[area]) d[area] = Array.from({ length: 7 }, () => ({ open: '', close: '' }))
  if (!d[area][dayIndex]) d[area][dayIndex] = { open: '', close: '' }
  d[area][dayIndex][field] = value
  onStepDataUpdate(3, { ...d })
}

function addItem(step: number, key: string, template: any) {
  const d = stepData.value[step]
  if (!d[key]) d[key] = []
  d[key].push({ ...template })
  onStepDataUpdate(step, { ...d })
}
function removeItem(step: number, key: string, i: number) {
  const d = stepData.value[step]; d[key].splice(i, 1); onStepDataUpdate(step, { ...d })
}
function updateItem(step: number, key: string, i: number, field: string, value: any) {
  const d = stepData.value[step]; if (d[key][i]) { d[key][i][field] = value; onStepDataUpdate(step, { ...d }) }
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
            <!-- STEP 1: Empresa -->
            <div v-if="currentStep === 1" class="ob-fields">
              <div class="ob-field">
                <label>Nombre legal <span class="req">*</span></label>
                <input v-model="stepData[1].legalName" @input="onStepDataUpdate(1, {...stepData[1]})" placeholder="Ej: Restaurantes del Sur S.A." />
              </div>
              <div class="ob-field">
                <label>Nombre comercial</label>
                <input v-model="stepData[1].commercialName" @input="onStepDataUpdate(1, {...stepData[1]})" placeholder="Ej: La Casa del Ceviche" />
              </div>
              <div class="ob-row">
                <div class="ob-field">
                  <label>RUC / ID Tributario <span class="req">*</span></label>
                  <input v-model="stepData[1].ruc" @input="onStepDataUpdate(1, {...stepData[1]})" placeholder="1234567890001" />
                </div>
                <div class="ob-field">
                  <label>País</label>
                  <select v-model="stepData[1].country" @change="onStepDataUpdate(1, {...stepData[1]})">
                    <option value="">Seleccionar</option>
                    <option value="Ecuador">Ecuador</option>
                    <option value="Colombia">Colombia</option>
                    <option value="Perú">Perú</option>
                    <option value="México">México</option>
                  </select>
                </div>
              </div>
              <div class="ob-field">
                <label>Ciudad</label>
                <input v-model="stepData[1].city" @input="onStepDataUpdate(1, {...stepData[1]})" placeholder="Guayaquil" />
              </div>
            </div>

            <!-- STEP 2: Sucursal -->
            <div v-else-if="currentStep === 2" class="ob-fields">
              <div class="ob-field">
                <label>Nombre de sucursal <span class="req">*</span></label>
                <input v-model="stepData[2].name" @input="onStepDataUpdate(2, {...stepData[2]})" placeholder="Ej: Mall del Sol" />
              </div>
              <div class="ob-field">
                <label>Dirección</label>
                <input v-model="stepData[2].address" @input="onStepDataUpdate(2, {...stepData[2]})" placeholder="Av. Principal y calle 3" />
              </div>
              <div class="ob-field">
                <label>Teléfono</label>
                <input v-model="stepData[2].phone" @input="onStepDataUpdate(2, {...stepData[2]})" placeholder="+593 99 999 9999" type="tel" />
              </div>
            </div>

            <!-- STEP 3: Horarios -->
            <div v-else-if="currentStep === 3" class="ob-fields">
              <div class="ob-tabs">
                <button type="button" :class="['ob-tab', { active: step3tab === 'cocina' }]" @click="step3tab = 'cocina'">
                  <i class="fa-solid fa-fire" /> Cocina
                </button>
                <button type="button" :class="['ob-tab', { active: step3tab === 'atencion' }]" @click="step3tab = 'atencion'">
                  <i class="fa-solid fa-users" /> Atención
                </button>
              </div>

              <div class="ob-schedule">
                <div class="ob-sch-head">
                  <span class="ob-sch-cell day">Día</span>
                  <span class="ob-sch-cell">Apertura</span>
                  <span class="ob-sch-cell sep" />
                  <span class="ob-sch-cell">Cierre</span>
                </div>
                <div v-for="day in 7" :key="'h-'+day"
                  :class="['ob-sch-row', { off: !stepData[3]?.[step3tab]?.[day-1]?.open }]">
                  <span class="ob-sch-cell day">{{ ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][day-1] }}</span>
                  <div class="ob-sch-cell">
                    <TimePicker :model-value="stepData[3]?.[step3tab]?.[day-1]?.open || ''" @update:model-value="updateHour(step3tab, day-1, 'open', $event)" />
                  </div>
                  <span class="ob-sch-cell sep"><i class="fa-solid fa-arrow-right" /></span>
                  <div class="ob-sch-cell">
                    <TimePicker :model-value="stepData[3]?.[step3tab]?.[day-1]?.close || ''" @update:model-value="updateHour(step3tab, day-1, 'close', $event)" />
                  </div>
                </div>
              </div>
              <p class="ob-hint">Deja vacío si el área no opera ese día.</p>
            </div>

            <!-- STEP 4: Recetas -->
            <div v-else-if="currentStep === 4" class="ob-fields">
              <div v-for="(r, i) in (stepData[4]?.recipes || [])" :key="i" class="ob-array-row">
                <input v-model="r.name" placeholder="Nombre del plato" @input="updateItem(4, 'recipes', Number(i), 'name', ($event.target as HTMLInputElement).value)" />
                <input v-model.number="r.sellingPrice" placeholder="PVP $" type="number" step="0.01" class="ob-sm" @input="updateItem(4, 'recipes', Number(i), 'sellingPrice', parseFloat(($event.target as HTMLInputElement).value || '0'))" />
                <button class="ob-rm" @click="removeItem(4, 'recipes', Number(i))"><i class="fa-solid fa-xmark" /></button>
              </div>
              <button class="ob-add" @click="addItem(4, 'recipes', { name: '', sellingPrice: null })">
                <i class="fa-solid fa-plus" /> Agregar plato
              </button>
            </div>

            <!-- STEP 5: Ingredientes -->
            <div v-else-if="currentStep === 5" class="ob-fields">
              <div v-for="(ing, i) in (stepData[5]?.ingredients || [])" :key="i" class="ob-array-row">
                <input v-model="ing.name" placeholder="Nombre" @input="updateItem(5, 'ingredients', Number(i), 'name', ($event.target as HTMLInputElement).value)" />
                <select v-model="ing.unitOfMeasure" class="ob-sm" @change="updateItem(5, 'ingredients', Number(i), 'unitOfMeasure', ($event.target as HTMLSelectElement).value)">
                  <option value="kg">Kg</option>
                  <option value="l">L</option>
                  <option value="unidad">Unidad</option>
                </select>
                <input v-model.number="ing.costPrice" placeholder="Costo" type="number" step="0.01" class="ob-sm" @input="updateItem(5, 'ingredients', Number(i), 'costPrice', parseFloat(($event.target as HTMLInputElement).value || '0'))" />
                <input v-model.number="ing.wastePercentage" placeholder="Merma %" type="number" min="0" max="100" class="ob-xs" @input="updateItem(5, 'ingredients', Number(i), 'wastePercentage', parseFloat(($event.target as HTMLInputElement).value || '0'))" />
                <button class="ob-rm" @click="removeItem(5, 'ingredients', Number(i))"><i class="fa-solid fa-xmark" /></button>
              </div>
              <button class="ob-add" @click="addItem(5, 'ingredients', { name: '', unitOfMeasure: 'unidad', costPrice: null, wastePercentage: null })">
                <i class="fa-solid fa-plus" /> Agregar ingrediente
              </button>
            </div>

            <!-- STEP 6: Equipos -->
            <div v-else-if="currentStep === 6" class="ob-fields">
              <div v-for="(eq, i) in (stepData[6]?.equipment || [])" :key="i" class="ob-array-row">
                <input v-model="eq.name" placeholder="Nombre" @input="updateItem(6, 'equipment', Number(i), 'name', ($event.target as HTMLInputElement).value)" />
                <input v-model="eq.brand" placeholder="Marca" class="ob-sm" @input="updateItem(6, 'equipment', Number(i), 'brand', ($event.target as HTMLInputElement).value)" />
                <input v-model="eq.purchaseDate" type="date" class="ob-sm" @change="updateItem(6, 'equipment', Number(i), 'purchaseDate', ($event.target as HTMLInputElement).value)" />
                <input v-model.number="eq.historicalCost" placeholder="Costo $" type="number" class="ob-sm" @input="updateItem(6, 'equipment', Number(i), 'historicalCost', parseFloat(($event.target as HTMLInputElement).value || '0'))" />
                <button class="ob-rm" @click="removeItem(6, 'equipment', Number(i))"><i class="fa-solid fa-xmark" /></button>
              </div>
              <button class="ob-add" @click="addItem(6, 'equipment', { name: '', brand: '', purchaseDate: '', historicalCost: null, usefulLife: null, maintenanceIntervalDays: null })">
                <i class="fa-solid fa-plus" /> Agregar equipo
              </button>
              <p class="ob-hint">La depreciación y ciclos de mantenimiento se calculan automáticamente.</p>
            </div>

            <!-- STEP 7: Costos Fijos -->
            <div v-else-if="currentStep === 7" class="ob-fields">
              <div class="ob-field">
                <label>Alquiler <span class="req">*</span></label>
                <input v-model.number="stepData[7].rent" type="number" step="0.01" placeholder="0.00" @input="onStepDataUpdate(7, {...stepData[7]})" />
              </div>
              <div class="ob-row">
                <div class="ob-field">
                  <label>Nómina administrativa</label>
                  <input v-model.number="stepData[7].payroll" type="number" step="0.01" placeholder="0.00" @input="onStepDataUpdate(7, {...stepData[7]})" />
                </div>
                <div class="ob-field">
                  <label>Servicios básicos</label>
                  <input v-model.number="stepData[7].utilities" type="number" step="0.01" placeholder="0.00" @input="onStepDataUpdate(7, {...stepData[7]})" />
                </div>
              </div>
              <div class="ob-row">
                <div class="ob-field">
                  <label>Seguros</label>
                  <input v-model.number="stepData[7].insurance" type="number" step="0.01" placeholder="0.00" @input="onStepDataUpdate(7, {...stepData[7]})" />
                </div>
                <div class="ob-field">
                  <label>Marketing</label>
                  <input v-model.number="stepData[7].marketing" type="number" step="0.01" placeholder="0.00" @input="onStepDataUpdate(7, {...stepData[7]})" />
                </div>
              </div>
            </div>

            <!-- STEP 8: POS -->
            <div v-else-if="currentStep === 8" class="ob-fields">
              <div class="ob-field">
                <label>Proveedor POS</label>
                <select v-model="stepData[8].provider" @change="onStepDataUpdate(8, {...stepData[8]})">
                  <option value="">Seleccionar…</option>
                  <option value="clover">Clover</option>
                  <option value="square">Square</option>
                  <option value="tu_mesero">Tu Mesero</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
              <div class="ob-field">
                <label>API Key</label>
                <input v-model="stepData[8].apiKey" type="password" placeholder="••••••••" @input="onStepDataUpdate(8, {...stepData[8]})" />
              </div>
              <div class="ob-field">
                <label>Webhook URL</label>
                <input v-model="stepData[8].webhookUrl" type="url" placeholder="https://…" @input="onStepDataUpdate(8, {...stepData[8]})" />
              </div>
              <p class="ob-hint">Puedes saltar este paso y configurarlo después desde el panel.</p>
            </div>

            <!-- STEP 9: Alertas -->
            <div v-else-if="currentStep === 9" class="ob-fields">
              <div class="ob-subsection">
                <h3 class="ob-subtitle"><i class="fa-solid fa-bell" /> Canales de notificación</h3>
                <div class="ob-tog">
                  <span><i class="fa-brands fa-whatsapp" /> WhatsApp</span>
                  <label class="tg"><input type="checkbox" v-model="stepData[9].whatsappEnabled" @change="onStepDataUpdate(9, {...stepData[9]})" /><span class="tg-slider" /></label>
                </div>
                <div class="ob-tog">
                  <span><i class="fa-solid fa-envelope" /> Email</span>
                  <label class="tg"><input type="checkbox" v-model="stepData[9].emailEnabled" @change="onStepDataUpdate(9, {...stepData[9]})" /><span class="tg-slider" /></label>
                </div>
                <div class="ob-tog">
                  <span><i class="fa-solid fa-mobile-screen-button" /> Push</span>
                  <label class="tg"><input type="checkbox" v-model="stepData[9].pushEnabled" @change="onStepDataUpdate(9, {...stepData[9]})" /><span class="tg-slider" /></label>
                </div>
              </div>
              <div class="ob-subsection">
                <h3 class="ob-subtitle"><i class="fa-solid fa-triangle-exclamation" /> Tipos de alerta</h3>
                <div class="ob-tog">
                  <span><i class="fa-solid fa-clipboard-list" /> Checklist</span>
                  <label class="tg"><input type="checkbox" v-model="stepData[9].checklistAlerts" @change="onStepDataUpdate(9, {...stepData[9]})" /><span class="tg-slider" /></label>
                </div>
                <div class="ob-tog">
                  <span><i class="fa-solid fa-chart-line" /> Caída de margen</span>
                  <label class="tg"><input type="checkbox" v-model="stepData[9].marginAlerts" @change="onStepDataUpdate(9, {...stepData[9]})" /><span class="tg-slider" /></label>
                </div>
                <div class="ob-tog">
                  <span><i class="fa-solid fa-screwdriver-wrench" /> Mantenimiento</span>
                  <label class="tg"><input type="checkbox" v-model="stepData[9].maintenanceAlerts" @change="onStepDataUpdate(9, {...stepData[9]})" /><span class="tg-slider" /></label>
                </div>
              </div>
              <div class="ob-row">
                <div class="ob-field">
                  <label>Número WhatsApp</label>
                  <input v-model="stepData[9].whatsappNumber" placeholder="+593 99 999 9999" @input="onStepDataUpdate(9, {...stepData[9]})" />
                </div>
                <div class="ob-field">
                  <label>Email notificaciones</label>
                  <input v-model="stepData[9].emailAddress" type="email" placeholder="correo@ejemplo.com" @input="onStepDataUpdate(9, {...stepData[9]})" />
                </div>
              </div>
            </div>

            <!-- STEP 10: Finalizar -->
            <div v-else-if="currentStep === 10" class="ob-fields ob-done">
              <div class="ob-done-icon"><i class="fa-solid fa-circle-check" /></div>
              <h2 class="ob-done-title">Todo listo</h2>
              <p class="ob-done-desc">Tu restaurante está configurado. Accede al dashboard en tiempo real.</p>
              <div class="ob-done-grid">
                <div class="ob-done-item"><i class="fa-solid fa-chart-line" /> Dashboard en vivo</div>
                <div class="ob-done-item"><i class="fa-solid fa-bell" /> Alertas automáticas</div>
                <div class="ob-done-item"><i class="fa-solid fa-clipboard-check" /> Control de checklists</div>
                <div class="ob-done-item"><i class="fa-solid fa-qrcode" /> QR de equipos</div>
              </div>
            </div>
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
</style>
