<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import AppShell from '@/layout/AppShell.vue'
import { useUIStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'
import { uploadService } from '@/services/uploadService'
import {
  supervisionService,
  type SupervisionAnswerStatus,
  type SupervisionPlant,
  type SupervisionSubmission,
  type SupervisionTargetType,
  type SupervisionTemplate,
} from '@/services/supervisionService'

interface AnswerDraft {
  status: SupervisionAnswerStatus | ''
  observation: string
}

interface PhotoDraft {
  file: File
  previewUrl: string
}

const userStore = useUserStore()
const ui = useUIStore()

const loading = ref(true)
const submitting = ref(false)
const historyLoading = ref(false)
const addingPlant = ref(false)
const showPlantForm = ref(false)
const targetType = ref<SupervisionTargetType>('branch')
const branchId = ref('')
const plantId = ref('')
const templateId = ref('')
const plants = ref<SupervisionPlant[]>([])
const templates = ref<SupervisionTemplate[]>([])
const submissions = ref<SupervisionSubmission[]>([])
const openSections = ref<string[]>([])
const photos = ref<PhotoDraft[]>([])
const answers = reactive<Record<string, AnswerDraft>>({})
const plantDraft = reactive({ name: '', address: '' })
const header = reactive({
  visitorName: '',
  visitTime: '',
  mileage: '',
  managerName: '',
  kitchenLeadName: '',
})
const businessDate = ref(today())

function today() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function currentTime() {
  return new Date().toTimeString().slice(0, 5)
}

const availableTemplates = computed(() => templates.value.filter((template) => template.targetType === targetType.value))
const selectedTemplate = computed(() => templates.value.find((template) => template._id === templateId.value) || null)
const allItems = computed(() => selectedTemplate.value?.sections.flatMap((section) => section.items) || [])
const answeredCount = computed(() => allItems.value.filter((item) => answers[item.key]?.status).length)
const noCount = computed(() => allItems.value.filter((item) => answers[item.key]?.status === 'no').length)
const completion = computed(() => allItems.value.length ? Math.round((answeredCount.value / allItems.value.length) * 100) : 0)
const hasTarget = computed(() => targetType.value === 'branch' ? !!branchId.value : !!plantId.value)
const submittedByName = (submission: SupervisionSubmission) =>
  typeof submission.submittedBy === 'string'
    ? submission.submittedBy
    : submission.submittedBy?.name || submission.submittedBy?.email || 'Usuario'

function resultLabel(result: string) {
  const labels: Record<string, string> = { aprobado: 'Aprobado', observado: 'Con observaciones', reprobado: 'Reprobado' }
  return labels[result] || result
}

function frequencyLabel(frequency: string) {
  const labels: Record<string, string> = {
    daily: 'Diaria',
    monthly: 'Mensual',
    fortnightly: 'Quincenal',
    as_needed: 'Cuando se requiera',
  }
  return labels[frequency] || frequency
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function errorMessage(error: unknown) {
  return typeof error === 'object' && error !== null && 'message' in error
    ? String(error.message)
    : undefined
}

function initializeTemplate(template: SupervisionTemplate | null) {
  Object.keys(answers).forEach((key) => delete answers[key])
  openSections.value = template?.sections[0] ? [template.sections[0].key] : []
  template?.sections.forEach((section) => {
    section.items.forEach((item) => { answers[item.key] = { status: '', observation: '' } })
  })
}

function chooseTemplate(id: string) {
  templateId.value = id
  initializeTemplate(selectedTemplate.value)
}

function setStatus(itemKey: string, status: SupervisionAnswerStatus) {
  const answer = answers[itemKey]
  if (!answer) return
  answer.status = status
  if (status !== 'no') answer.observation = ''
}

function toggleSection(key: string) {
  openSections.value = openSections.value.includes(key)
    ? openSections.value.filter((sectionKey) => sectionKey !== key)
    : [...openSections.value, key]
}

function sectionProgress(section: SupervisionTemplate['sections'][number]) {
  const done = section.items.filter((item) => answers[item.key]?.status).length
  return `${done}/${section.items.length}`
}

function onPhotosSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || []).filter((file) => file.type.startsWith('image/'))
  if (!files.length) {
    ui.showToast({ title: 'La evidencia debe ser una imagen', tone: 'warning' })
    input.value = ''
    return
  }
  files.forEach((file) => photos.value.push({ file, previewUrl: URL.createObjectURL(file) }))
  input.value = ''
}

function removePhoto(index: number) {
  const photo = photos.value[index]
  if (photo) URL.revokeObjectURL(photo.previewUrl)
  photos.value.splice(index, 1)
}

function clearPhotos() {
  photos.value.forEach((photo) => URL.revokeObjectURL(photo.previewUrl))
  photos.value = []
}

async function loadHistory() {
  if (!hasTarget.value) {
    submissions.value = []
    return
  }
  historyLoading.value = true
  try {
    const filters = targetType.value === 'branch'
      ? { branchId: branchId.value, limit: 20 }
      : { plantId: plantId.value, limit: 20 }
    const response = await supervisionService.listSubmissions(filters)
    submissions.value = response.data
  } catch {
    ui.showToast({ title: 'No se pudo actualizar el historial', tone: 'warning' })
  } finally {
    historyLoading.value = false
  }
}

async function loadBootstrap() {
  loading.value = true
  try {
    if (!userStore.branches.length) await userStore.fetchWorkspace()
    branchId.value = userStore.mainBranch?.id || ''
    const response = await supervisionService.getBootstrap(branchId.value)
    plants.value = response.data.plants
    templates.value = response.data.templates
    submissions.value = response.data.submissions
  } catch (error: unknown) {
    ui.showToast({ title: 'No se pudo cargar Supervisión', message: errorMessage(error), tone: 'error' })
  } finally {
    loading.value = false
  }
}

async function createPlant() {
  if (!plantDraft.name.trim()) return
  addingPlant.value = true
  try {
    const response = await supervisionService.createPlant({
      name: plantDraft.name.trim(),
      address: plantDraft.address.trim() || undefined,
    })
    plants.value.push(response.data)
    plantId.value = response.data._id
    plantDraft.name = ''
    plantDraft.address = ''
    showPlantForm.value = false
    ui.showToast({ title: 'Planta agregada', tone: 'success' })
  } catch (error: unknown) {
    ui.showToast({ title: 'No se pudo agregar la planta', message: errorMessage(error), tone: 'error' })
  } finally {
    addingPlant.value = false
  }
}

function validateSubmission() {
  if (!hasTarget.value) return 'Selecciona el local o la planta a supervisar.'
  if (!selectedTemplate.value) return 'Selecciona una plantilla.'
  if (!businessDate.value || !header.visitorName.trim() || !header.visitTime) return 'Completa fecha, visitante y hora de visita.'
  if (answeredCount.value !== allItems.value.length) return 'Responde todos los puntos del checklist.'
  const noWithoutObservation = allItems.value.some((item) => answers[item.key]?.status === 'no' && !answers[item.key]?.observation.trim())
  if (noWithoutObservation) return 'Describe la observación de cada respuesta NO.'
  if (!photos.value.length) return 'Toma al menos una foto de evidencia con la cámara.'
  return ''
}

function resetForm() {
  templateId.value = ''
  initializeTemplate(null)
  businessDate.value = today()
  Object.assign(header, {
    visitorName: '',
    visitTime: currentTime(),
    mileage: '',
    managerName: '',
    kitchenLeadName: '',
  })
  clearPhotos()
}

async function submit() {
  const validationMessage = validateSubmission()
  if (validationMessage) {
    ui.showToast({ title: 'Falta información', message: validationMessage, tone: 'warning' })
    return
  }
  submitting.value = true
  const uploadedPublicIds: string[] = []
  try {
    const evidence: Array<{ url: string; publicId: string }> = []
    for (const photo of photos.value) {
      const response = await uploadService.uploadImage(photo.file, 'supervision')
      const data = response.data as { url: string; publicId: string }
      uploadedPublicIds.push(data.publicId)
      evidence.push({ url: data.url, publicId: data.publicId })
    }
    await supervisionService.createSubmission({
      templateId: templateId.value,
      targetType: targetType.value,
      branchId: targetType.value === 'branch' ? branchId.value : undefined,
      plantId: targetType.value === 'plant' ? plantId.value : undefined,
      businessDate: businessDate.value,
      header: {
        visitorName: header.visitorName.trim(),
        visitTime: header.visitTime,
        mileage: header.mileage === '' ? undefined : Number(header.mileage),
        managerName: header.managerName.trim() || undefined,
        kitchenLeadName: header.kitchenLeadName.trim() || undefined,
      },
      answers: allItems.value.map((item) => ({
        itemKey: item.key,
        status: answers[item.key]!.status as SupervisionAnswerStatus,
        observation: answers[item.key]!.observation.trim() || undefined,
      })),
      evidence,
    })
    ui.showToast({ title: 'Supervisión guardada', message: 'La evidencia y el checklist quedaron registrados.', tone: 'success' })
    resetForm()
    await loadHistory()
  } catch (error: unknown) {
    await Promise.allSettled(uploadedPublicIds.map((publicId) => uploadService.deleteImage(publicId)))
    ui.showToast({ title: 'No se pudo guardar la supervisión', message: errorMessage(error), tone: 'error' })
  } finally {
    submitting.value = false
  }
}

watch(targetType, () => {
  templateId.value = ''
  initializeTemplate(null)
  loadHistory()
})
watch([branchId, plantId], () => loadHistory())

onMounted(() => {
  userStore.hydrate()
  header.visitorName = userStore.name || ''
  header.visitTime = currentTime()
  loadBootstrap()
})

onBeforeUnmount(clearPhotos)
</script>

<template>
  <AppShell>
    <main class="supervision-page">
      <header class="hero">
        <div class="hero-copy">
          <span class="eyebrow"><i class="fa-solid fa-clipboard-check" /> Control operativo diario</span>
          <h1>Supervisión</h1>
          <p>Documenta la visita, completa el checklist y deja evidencia verificable desde el lugar.</p>
        </div>
        <div class="hero-progress" aria-live="polite">
          <strong>{{ completion }}%</strong>
          <span>{{ answeredCount }} de {{ allItems.length }} puntos</span>
          <div class="progress-track"><span :style="{ width: `${completion}%` }" /></div>
        </div>
      </header>

      <div v-if="loading" class="loading-panel"><span class="spinner" /> Cargando supervisión…</div>

      <template v-else>
        <section class="panel context-panel">
          <div class="section-heading">
            <span class="step-number">1</span>
            <div><h2>Destino y visita</h2><p>Define dónde y cuándo se realiza la supervisión.</p></div>
          </div>

          <div class="mode-switch" aria-label="Tipo de supervisión">
            <button type="button" :class="{ active: targetType === 'branch' }" @click="targetType = 'branch'">
              <i class="fa-solid fa-store" /> Local
            </button>
            <button type="button" :class="{ active: targetType === 'plant' }" @click="targetType = 'plant'">
              <i class="fa-solid fa-industry" /> Planta
            </button>
          </div>

          <div class="field-row">
            <label v-if="targetType === 'branch'" class="field">
              <span>Local <b>*</b></span>
              <select v-model="branchId" required>
                <option value="" disabled>Selecciona un local</option>
                <option v-for="branch in userStore.branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
              </select>
            </label>
            <label v-else class="field">
              <span>Planta <b>*</b></span>
              <select v-model="plantId" required>
                <option value="" disabled>Selecciona una planta</option>
                <option v-for="plant in plants" :key="plant._id" :value="plant._id">{{ plant.name }}</option>
              </select>
            </label>
            <button v-if="targetType === 'plant' && userStore.canManageWorkspace" type="button" class="secondary-button add-plant" @click="showPlantForm = !showPlantForm">
              <i class="fa-solid fa-plus" /> Agregar planta
            </button>
          </div>

          <form v-if="showPlantForm && userStore.canManageWorkspace" class="plant-form" @submit.prevent="createPlant">
            <label class="field"><span>Nombre de la planta <b>*</b></span><input v-model="plantDraft.name" required placeholder="Ej. Planta central" /></label>
            <label class="field"><span>Dirección</span><input v-model="plantDraft.address" placeholder="Dirección opcional" /></label>
            <button class="primary-button compact" :disabled="addingPlant">{{ addingPlant ? 'Guardando…' : 'Guardar planta' }}</button>
          </form>

          <div class="field-row header-fields">
            <label class="field"><span>Fecha operativa <b>*</b></span><input v-model="businessDate" type="date" required /></label>
            <label class="field"><span>Visitante <b>*</b></span><input v-model="header.visitorName" required placeholder="Nombre del supervisor" /></label>
            <label class="field"><span>Hora de visita <b>*</b></span><input v-model="header.visitTime" type="time" required /></label>
            <label class="field"><span>Kilometraje</span><input v-model="header.mileage" type="number" min="0" step="0.1" placeholder="Opcional" /></label>
            <label class="field"><span>Administrador/a del local</span><input v-model="header.managerName" placeholder="Nombre del responsable" /></label>
            <label class="field"><span>Jefe/a de cocina</span><input v-model="header.kitchenLeadName" placeholder="Nombre del responsable" /></label>
          </div>
        </section>

        <section class="panel template-panel">
          <div class="section-heading">
            <span class="step-number">2</span>
            <div><h2>Plantilla y checklist</h2><p>Selecciona el control adecuado y responde todos sus puntos.</p></div>
          </div>

          <div v-if="!availableTemplates.length" class="empty-state">No hay plantillas disponibles para {{ targetType === 'branch' ? 'locales' : 'plantas' }}.</div>
          <div v-else class="template-list">
            <button v-for="template in availableTemplates" :key="template._id" type="button" class="template-card" :class="{ active: templateId === template._id }" @click="chooseTemplate(template._id)">
              <span class="template-icon"><i :class="template.targetType === 'branch' ? 'fa-solid fa-store' : 'fa-solid fa-industry'" /></span>
              <span class="template-copy"><strong>{{ template.name }}</strong><small>{{ template.description }}</small><em>{{ frequencyLabel(template.frequency) }}<span v-if="template.recommended"> · Recomendada</span></em></span>
              <i :class="templateId === template._id ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
            </button>
          </div>

          <div v-if="selectedTemplate" class="checklist">
            <article v-for="section in selectedTemplate.sections" :key="section.key" class="check-section">
              <button type="button" class="section-toggle" :aria-expanded="openSections.includes(section.key)" @click="toggleSection(section.key)">
                <span><strong>{{ section.title }}</strong><small>{{ sectionProgress(section) }} respondidos</small></span>
                <i class="fa-solid fa-chevron-down" :class="{ open: openSections.includes(section.key) }" />
              </button>
              <div v-if="openSections.includes(section.key)" class="item-list">
                <div v-for="(item, itemIndex) in section.items" :key="item.key" class="check-item" :class="{ negative: answers[item.key]?.status === 'no' }">
                  <div class="item-copy"><span>{{ itemIndex + 1 }}</span><div><strong>{{ item.label }}</strong><small v-if="item.helpText">{{ item.helpText }}</small></div></div>
                  <div class="status-options">
                    <button type="button" :class="{ active: answers[item.key]?.status === 'si' }" @click="setStatus(item.key, 'si')">SI</button>
                    <button type="button" class="no-option" :class="{ active: answers[item.key]?.status === 'no' }" @click="setStatus(item.key, 'no')">NO</button>
                    <button type="button" :class="{ active: answers[item.key]?.status === 'no_aplica' }" @click="setStatus(item.key, 'no_aplica')">NO APLICA</button>
                  </div>
                  <label v-if="answers[item.key]?.status === 'no'" class="observation-field">
                    <span><i class="fa-solid fa-triangle-exclamation" /> Observación obligatoria</span>
                    <textarea v-model="answers[item.key]!.observation" required rows="2" placeholder="Describe qué encontraste y qué debe corregirse" />
                  </label>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="panel evidence-panel">
          <div class="section-heading">
            <span class="step-number">3</span>
            <div><h2>Evidencia del momento</h2><p>Se requiere al menos una fotografía antes de enviar.</p></div>
          </div>

          <div class="camera-notice">
            <i class="fa-solid fa-camera" />
            <div><strong>La evidencia debe tomarse ahora con la cámara del dispositivo.</strong><span>El atributo de captura del navegador es una solicitud de mejor esfuerzo; algunos navegadores pueden ofrecer opciones adicionales según el dispositivo.</span></div>
          </div>

          <label class="camera-button">
            <input type="file" accept="image/*" capture="environment" @change="onPhotosSelected" />
            <i class="fa-solid fa-camera-retro" />
            <span><strong>Tomar foto de evidencia</strong><small>{{ photos.length ? `${photos.length} foto(s) lista(s)` : 'Abrir cámara trasera' }}</small></span>
          </label>

          <div v-if="photos.length" class="photo-list">
            <figure v-for="(photo, index) in photos" :key="photo.previewUrl" class="photo-preview">
              <img :src="photo.previewUrl" :alt="`Evidencia ${index + 1}`" />
              <figcaption>Foto {{ index + 1 }}</figcaption>
              <button type="button" aria-label="Eliminar foto" @click="removePhoto(index)"><i class="fa-solid fa-trash" /></button>
            </figure>
          </div>
        </section>

        <aside class="submit-bar">
          <div class="submit-summary">
            <strong>{{ answeredCount }}/{{ allItems.length }} puntos · {{ photos.length }} foto(s)</strong>
            <span v-if="noCount">{{ noCount }} respuesta(s) NO requieren seguimiento</span>
            <span v-else>Completa el checklist y adjunta evidencia actual.</span>
          </div>
          <button type="button" class="primary-button submit-button" :disabled="submitting" @click="submit">
            <i class="fa-solid fa-cloud-arrow-up" /> {{ submitting ? 'Subiendo y guardando…' : 'Enviar supervisión' }}
          </button>
        </aside>

        <section class="panel history-panel">
          <div class="section-heading history-heading">
            <span class="step-number muted"><i class="fa-solid fa-clock-rotate-left" /></span>
            <div><h2>Historial reciente</h2><p>Últimas supervisiones del destino seleccionado.</p></div>
            <button type="button" class="icon-button" :disabled="historyLoading" aria-label="Actualizar historial" @click="loadHistory"><i class="fa-solid fa-rotate" /></button>
          </div>
          <div v-if="historyLoading" class="empty-state">Actualizando historial…</div>
          <div v-else-if="!submissions.length" class="empty-state">Todavía no hay supervisiones registradas aquí.</div>
          <div v-else class="history-list">
            <article v-for="submission in submissions" :key="submission._id" class="history-item">
              <span class="score" :class="submission.result">{{ Math.round(submission.score) }}%</span>
              <div class="history-copy"><strong>{{ submission.templateName }}</strong><span>{{ submission.targetName }} · {{ formatDate(submission.createdAt) }}</span><small>Por {{ submittedByName(submission) }}</small></div>
              <span class="result-pill" :class="submission.result">{{ resultLabel(submission.result) }}</span>
            </article>
          </div>
        </section>
      </template>
    </main>
  </AppShell>
</template>

<style scoped lang="scss">
.supervision-page { width: 100%; max-width: 1440px; margin: 0 auto; padding: 18px 16px 110px; display: flex; flex-direction: column; gap: 18px; color: $text; }
.hero { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 20px; padding: 24px; border-radius: $radius-xl; background: linear-gradient(135deg, $primary-dark, lighten($primary-dark, 8%)); color: white; box-shadow: $shadow-lg; }
.hero-copy { flex: 1 1 420px; display: flex; flex-direction: column; gap: 6px; }
.hero h1 { margin: 0; font-size: clamp(1.75rem, 4vw, 2.7rem); line-height: 1; }
.hero p { margin: 0; max-width: 680px; color: rgba(255,255,255,.7); line-height: 1.5; }
.eyebrow { align-self: flex-start; display: inline-flex; align-items: center; gap: 7px; padding: 5px 9px; border-radius: $radius-full; background: rgba($accent,.18); color: $accent-light; font-size: .7rem; font-weight: 850; letter-spacing: .05em; text-transform: uppercase; }
.hero-progress { flex: 0 1 230px; min-width: min(100%, 210px); display: flex; flex-direction: column; gap: 5px; padding: 14px; border-radius: $radius-md; background: rgba(255,255,255,.08); }
.hero-progress strong { font-size: 1.6rem; }
.hero-progress span { color: rgba(255,255,255,.65); font-size: .75rem; }
.progress-track { height: 6px; overflow: hidden; border-radius: $radius-full; background: rgba(255,255,255,.13); }
.progress-track span { display: block; height: 100%; border-radius: inherit; background: $accent; transition: width .2s; }
.panel { padding: 20px; border: 1px solid $border; border-radius: $radius-xl; background: $surface; box-shadow: $shadow-sm; display: flex; flex-direction: column; gap: 18px; }
.loading-panel, .empty-state { min-height: 100px; display: flex; align-items: center; justify-content: center; gap: 10px; color: $text-secondary; text-align: center; }
.spinner { width: 24px; height: 24px; border: 3px solid rgba($primary,.15); border-top-color: $primary; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.section-heading { display: flex; align-items: center; gap: 12px; }
.section-heading > div { min-width: 0; }
.section-heading h2 { margin: 0; font-size: 1.05rem; }
.section-heading p { margin: 3px 0 0; color: $text-secondary; font-size: .8rem; }
.step-number { width: 36px; height: 36px; flex: 0 0 36px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; background: $primary; color: white; font-weight: 900; }
.step-number.muted { background: $primary-bg; color: $primary; }
.mode-switch { align-self: flex-start; display: flex; flex-wrap: wrap; gap: 5px; padding: 5px; border-radius: 14px; background: $primary-bg; }
.mode-switch button { min-width: 120px; padding: 10px 16px; border: 0; border-radius: 10px; background: transparent; color: $text-secondary; font: 800 .84rem $font-principal; cursor: pointer; }
.mode-switch button.active { background: white; color: $primary; box-shadow: $shadow-sm; }
.mode-switch i { margin-right: 6px; }
.field-row, .plant-form { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 14px; }
.field { flex: 1 1 220px; min-width: 0; display: flex; flex-direction: column; gap: 6px; color: $text-secondary; font-size: .76rem; font-weight: 800; }
.field b { color: $alert-error; }
.field input, .field select, .observation-field textarea { width: 100%; min-height: 46px; padding: 10px 12px; border: 1.5px solid rgba($primary-dark,.12); border-radius: 12px; outline: none; background: #f8fafc; color: $text; font: 600 .88rem $font-principal; transition: border-color .2s, background .2s; }
.field select { appearance: auto; cursor: pointer; }
.field input:focus, .field select:focus, .observation-field textarea:focus { border-color: $primary; background: white; }
.header-fields .field { flex-basis: 180px; }
.plant-form { padding: 16px; border-radius: $radius-lg; background: $primary-bg; }
.primary-button, .secondary-button, .icon-button { border: 0; border-radius: 12px; font-family: $font-principal; font-weight: 850; cursor: pointer; }
.primary-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 46px; padding: 11px 18px; background: $primary; color: white; box-shadow: 0 7px 18px rgba($primary,.22); }
.primary-button:hover { background: darken($primary, 6%); }
.primary-button:disabled, .icon-button:disabled { opacity: .55; cursor: wait; }
.primary-button.compact { flex: 0 1 auto; }
.secondary-button { min-height: 46px; padding: 10px 15px; background: $primary-bg; color: $primary; }
.add-plant { flex: 0 1 auto; }
.template-list { display: flex; flex-wrap: wrap; gap: 12px; }
.template-card { flex: 1 1 280px; min-width: 0; display: flex; align-items: center; gap: 12px; padding: 14px; border: 1.5px solid $border; border-radius: $radius-lg; background: white; color: $text; text-align: left; cursor: pointer; font-family: $font-principal; }
.template-card:hover, .template-card.active { border-color: $primary; background: $primary-bg; }
.template-card > i { margin-left: auto; color: $primary; }
.template-icon { width: 40px; height: 40px; flex: 0 0 40px; display: inline-flex; align-items: center; justify-content: center; border-radius: 12px; background: $primary-dark; color: white; }
.template-copy { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.template-copy strong { font-size: .9rem; }
.template-copy small { color: $text-secondary; font-size: .72rem; line-height: 1.35; }
.template-copy em { color: $primary; font-size: .65rem; font-style: normal; font-weight: 800; text-transform: capitalize; }
.checklist, .item-list { display: flex; flex-direction: column; gap: 10px; }
.check-section { border: 1px solid $border; border-radius: $radius-lg; overflow: hidden; }
.section-toggle { width: 100%; display: flex; align-items: center; gap: 12px; padding: 15px; border: 0; background: rgba($primary,.04); color: $text; text-align: left; cursor: pointer; font-family: $font-principal; }
.section-toggle > span { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.section-toggle small { color: $text-secondary; }
.section-toggle i { color: $primary; transition: transform .2s; }
.section-toggle i.open { transform: rotate(180deg); }
.item-list { padding: 12px; }
.check-item { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; padding: 14px; border: 1px solid $border; border-radius: $radius-md; background: white; }
.check-item.negative { border-color: rgba($alert-error,.3); background: $alert-error-bg; }
.item-copy { flex: 1 1 340px; min-width: 0; display: flex; align-items: flex-start; gap: 10px; }
.item-copy > span { width: 25px; height: 25px; flex: 0 0 25px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; background: $primary-bg; color: $primary; font-size: .7rem; font-weight: 900; }
.item-copy > div { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.item-copy strong { font-size: .86rem; line-height: 1.4; }
.item-copy small { color: $text-secondary; font-size: .72rem; line-height: 1.4; }
.status-options { flex: 0 1 auto; display: flex; flex-wrap: wrap; gap: 5px; }
.status-options button { min-height: 38px; padding: 8px 12px; border: 1px solid $border; border-radius: 10px; background: white; color: $text-secondary; font: 850 .7rem $font-principal; cursor: pointer; }
.status-options button.active { border-color: $primary; background: $primary; color: white; }
.status-options .no-option.active { border-color: $alert-error; background: $alert-error; }
.observation-field { flex: 1 0 100%; display: flex; flex-direction: column; gap: 6px; color: $alert-error; font-size: .72rem; font-weight: 850; }
.observation-field textarea { min-height: 70px; resize: vertical; background: white; }
.camera-notice { display: flex; align-items: flex-start; gap: 12px; padding: 14px; border-radius: $radius-lg; background: $alert-info-bg; color: darken($alert-info, 12%); }
.camera-notice > i { padding-top: 2px; font-size: 1.1rem; }
.camera-notice div { display: flex; flex-direction: column; gap: 4px; }
.camera-notice strong { font-size: .82rem; }
.camera-notice span { font-size: .72rem; line-height: 1.45; }
.camera-button { align-self: flex-start; display: inline-flex; align-items: center; gap: 12px; padding: 13px 17px; border-radius: $radius-lg; background: $primary-dark; color: white; cursor: pointer; box-shadow: $shadow-md; }
.camera-button input { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none; }
.camera-button > i { font-size: 1.35rem; color: $accent-light; }
.camera-button > span { display: flex; flex-direction: column; gap: 2px; }
.camera-button strong { font-size: .85rem; }
.camera-button small { color: rgba(255,255,255,.58); }
.photo-list { display: flex; flex-wrap: wrap; gap: 12px; }
.photo-preview { position: relative; flex: 0 1 180px; min-width: 130px; margin: 0; overflow: hidden; border: 1px solid $border; border-radius: $radius-lg; background: $surface; }
.photo-preview img { display: block; width: 100%; aspect-ratio: 4/3; object-fit: cover; }
.photo-preview figcaption { padding: 8px 10px; color: $text-secondary; font-size: .7rem; font-weight: 700; }
.photo-preview button { position: absolute; top: 7px; right: 7px; width: 32px; height: 32px; border: 0; border-radius: 10px; background: rgba($primary-dark,.86); color: white; cursor: pointer; }
.submit-bar { position: sticky; bottom: 74px; z-index: 10; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 16px; border: 1px solid rgba($primary,.2); border-radius: $radius-lg; background: rgba(255,255,255,.94); box-shadow: $shadow-xl; backdrop-filter: blur(12px); }
.submit-summary { flex: 1 1 260px; display: flex; flex-direction: column; gap: 3px; }
.submit-summary strong { font-size: .84rem; }
.submit-summary span { color: $text-secondary; font-size: .7rem; }
.submit-button { flex: 0 1 auto; }
.history-heading .icon-button { margin-left: auto; }
.icon-button { width: 38px; height: 38px; background: $primary-bg; color: $primary; }
.history-list { display: flex; flex-direction: column; gap: 9px; }
.history-item { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 13px; border: 1px solid $border; border-radius: $radius-md; }
.score { width: 48px; height: 48px; flex: 0 0 48px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: $primary-bg; color: $primary; font-size: .78rem; font-weight: 900; }
.score.reprobado { background: $alert-error-bg; color: $alert-error; }
.score.observado { background: $alert-warning-bg; color: darken($alert-warning, 12%); }
.history-copy { flex: 1 1 250px; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.history-copy strong { font-size: .84rem; }
.history-copy span, .history-copy small { color: $text-secondary; font-size: .7rem; }
.result-pill { padding: 5px 9px; border-radius: $radius-full; background: $alert-success-bg; color: $alert-success; font-size: .66rem; font-weight: 850; }
.result-pill.reprobado { background: $alert-error-bg; color: $alert-error; }
.result-pill.observado { background: $alert-warning-bg; color: darken($alert-warning, 12%); }
@media (min-width: $bp-desktop) { .supervision-page { padding: 28px 28px 80px; } .submit-bar { bottom: 18px; } }
@media (max-width: $bp-mobile) { .panel, .hero { padding: 16px; border-radius: $radius-lg; } .mode-switch { align-self: stretch; } .mode-switch button { flex: 1; min-width: 0; } .status-options { flex: 1 0 100%; } .status-options button { flex: 1; padding-inline: 7px; } .camera-button, .submit-button { width: 100%; } .photo-preview { flex: 1 1 130px; } }
</style>
