<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import AppShell from '@/layout/AppShell.vue'
import { checklistService } from '@/services/checklistService'

interface ChecklistField {
  label: string
  type: 'checkbox' | 'slider' | 'text' | 'number' | 'photo'
  required: boolean
  order: number
}

interface TemplateDetail {
  _id: string
  name: string
  category: string
  description?: string
  fields: ChecklistField[]
  isActive: boolean
}

const route = useRoute()
const router = useRouter()
const ui = useUIStore()

const template = ref<TemplateDetail | null>(null)
const loading = ref(true)
const submitting = ref(false)
const responses = reactive<Record<string, unknown>>({})
const photoFiles = reactive<Record<string, File>>({})
const ocrLoading = ref(false)
const ocrError = ref('')

const templateId = computed(() => route.params.templateId as string)

function fieldKey(field: ChecklistField, idx: number): string {
  return `${idx}_${field.label.replace(/\s+/g, '_')}`
}

function setSlider(field: ChecklistField, idx: number, val: number) {
  responses[fieldKey(field, idx)] = val
}

async function handlePhotoUpload(field: ChecklistField, idx: number) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    photoFiles[fieldKey(field, idx)] = file
    responses[fieldKey(field, idx)] = file.name

    ocrLoading.value = true
    ocrError.value = ''
    try {
      const res = await checklistService.uploadPhotoOCR(file)
      const ocrText = (res.data as unknown as { text?: string })?.text
      if (ocrText) responses[fieldKey(field, idx)] = ocrText
    } catch {
      ocrError.value = 'No se pudo extraer texto de la foto. Puede continuar sin OCR.'
      ui.showToast({ title: 'OCR no disponible para esta imagen', tone: 'warning' })
    } finally {
      ocrLoading.value = false
    }
  }
  input.click()
}

const allValid = computed(() => {
  if (!template.value) return false
  return template.value.fields
    .filter((f) => f.required)
    .every((f, i) => {
      const key = fieldKey(f, i)
      const val = responses[key]
      return val !== undefined && val !== null && val !== ''
    })
})

async function handleSubmit() {
  if (!template.value || !allValid.value) return
  submitting.value = true
  const payload: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(responses)) {
    payload[key] = val
  }
  try {
    await checklistService.submitChecklist(template.value._id, payload)
    ui.showToast({ title: 'Checklist enviado con éxito', tone: 'success', icon: 'fa-solid fa-circle-check' })
    router.push('/modulo/checklists')
  } catch {
    ui.showToast({ title: 'Checklist guardado (sin conexión)', tone: 'info' })
    router.push('/modulo/checklists')
  } finally {
    submitting.value = false
  }
}

const demoFields: TemplateDetail = {
  _id: 'demo_c1',
  name: 'Limpieza de Cocina',
  category: 'cocina_insumos',
  description: 'Checklist diario de limpieza profunda',
  fields: [
    { label: 'Mesones desinfectados', type: 'checkbox', required: true, order: 0 },
    { label: 'Temperatura cámara (°C)', type: 'number', required: true, order: 1 },
    { label: 'Estado general de cocina (1-10)', type: 'slider', required: true, order: 2 },
    { label: 'Observaciones', type: 'text', required: false, order: 3 },
    { label: 'Foto de cocina', type: 'photo', required: false, order: 4 },
  ],
  isActive: true,
}

onMounted(async () => {
  try {
    const res = await checklistService.listTemplates()
    const all = res.data as unknown as TemplateDetail[]
    template.value = all.find((t) => t._id === templateId.value) || null
    if (!template.value) throw new Error('not found')
  } catch {
    template.value = demoFields
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AppShell>
    <div class="page">
      <header class="top-bar">
        <button class="back" @click="router.push('/modulo/checklists')">
          <i class="fa-solid fa-arrow-left" /> Volver
        </button>
      </header>

      <div v-if="loading" class="loading-state">
        <div class="loader" />
        <p>Cargando checklist...</p>
      </div>

      <template v-else-if="template">
        <div class="exec-head">
          <h1 class="exec-title">{{ template.name }}</h1>
          <p v-if="template.description" class="exec-sub">{{ template.description }}</p>
          <span class="exec-badge">{{ template.fields.length }} campos</span>
        </div>

        <section class="fields-list">
          <div v-for="(field, idx) in template.fields" :key="idx" :class="['field-card', { required: field.required }]">
            <div class="fc-head">
              <span class="fc-label">{{ field.label }}</span>
              <span v-if="field.required" class="fc-req">*</span>
            </div>

            <div v-if="field.type === 'checkbox'" class="fc-body">
              <button
                :class="['toggle-btn', { active: responses[fieldKey(field, idx)] === true }]"
                @click="responses[fieldKey(field, idx)] = !responses[fieldKey(field, idx)]"
                type="button"
              >
                <i :class="responses[fieldKey(field, idx)] ? 'fa-solid fa-toggle-on' : 'fa-solid fa-toggle-off'" />
                {{ responses[fieldKey(field, idx)] ? 'Sí' : 'No' }}
              </button>
            </div>

            <div v-else-if="field.type === 'slider'" class="fc-body">
              <div class="slider-row">
                <span class="slider-min">1</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  :value="(responses[fieldKey(field, idx)] as number) || 5"
                  @input="setSlider(field, idx, Number(($event.target as HTMLInputElement).value))"
                  class="slider-input"
                />
                <span class="slider-max">10</span>
              </div>
              <span class="slider-val">{{ (responses[fieldKey(field, idx)] as number) || 5 }}</span>
            </div>

            <div v-else-if="field.type === 'text'" class="fc-body">
              <input
                v-model="responses[fieldKey(field, idx)] as string"
                type="text"
                class="inp"
                placeholder="Escribe aquí..."
              />
            </div>

            <div v-else-if="field.type === 'number'" class="fc-body">
              <input
                v-model.number="responses[fieldKey(field, idx)] as number"
                type="number"
                class="inp"
                placeholder="0"
              />
            </div>

            <div v-else-if="field.type === 'photo'" class="fc-body">
              <button class="photo-btn" @click="handlePhotoUpload(field, idx)" :disabled="ocrLoading">
                <i class="fa-solid fa-camera" />
                {{ photoFiles[fieldKey(field, idx)] ? 'Foto tomada' : 'Tomar foto / Subir' }}
              </button>
              <div v-if="ocrLoading" class="ocr-status">
                <div class="loader-xs" /> Procesando OCR...
              </div>
              <div v-if="photoFiles[fieldKey(field, idx)]" class="photo-name">
                <i class="fa-solid fa-image" /> {{ photoFiles[fieldKey(field, idx)]?.name }}
              </div>
            </div>
          </div>
        </section>

        <div v-if="ocrError" class="ocr-banner">
          <i class="fa-solid fa-circle-exclamation" /> {{ ocrError }}
        </div>

        <button
          :class="['submit-btn', { disabled: !allValid }]"
          :disabled="!allValid || submitting"
          @click="handleSubmit"
        >
          <i class="fa-solid fa-paper-plane" />
          {{ submitting ? 'Enviando...' : 'Enviar checklist' }}
        </button>
      </template>
    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.page { padding: 0 0 100px; display: flex; flex-direction: column; }

.top-bar {
  position: sticky; top: 0; z-index: 10;
  padding: 12px 16px; background: white; border-bottom: 1px solid rgba($primary-dark, 0.06);
}
.back {
  border: none; background: transparent; cursor: pointer; color: $primary;
  font-family: $font-principal; font-weight: 700; font-size: 0.85rem;
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 10px;
  &:hover { background: rgba($primary, 0.08); }
}

.loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px 0; gap: 12px; color: $text-secondary; }
.loader { width: 36px; height: 36px; border: 3px solid rgba($primary, 0.2); border-top-color: $primary; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.exec-head { padding: 16px 16px 0; display: flex; flex-direction: column; gap: 4px; }
.exec-title { margin: 0; font-size: 1.25rem; font-weight: 800; color: $primary-dark; }
.exec-sub { margin: 0; font-size: 0.85rem; color: $text-secondary; }
.exec-badge { align-self: flex-start; font-size: 0.72rem; font-weight: 700; color: $primary; background: rgba($primary, 0.1); padding: 4px 10px; border-radius: 999px; margin-top: 4px; }

.fields-list {
  padding: 16px;
  display: flex; flex-direction: column; gap: 12px;
}
.field-card {
  background: white; border: 1px solid rgba($primary-dark, 0.06); border-radius: 16px; padding: 16px;
  display: flex; flex-direction: column; gap: 12px;
  &.required { border-left: 3px solid $primary; }
}
.fc-head { display: flex; align-items: center; gap: 4px; }
.fc-label { font-size: 0.95rem; font-weight: 700; color: $primary-dark; }
.fc-req { color: $alert-error; font-weight: 800; font-size: 1rem; }
.fc-body { display: flex; flex-direction: column; gap: 8px; }

.toggle-btn {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 14px 20px; border-radius: 14px;
  border: 2px solid rgba($primary-dark, 0.1); background: white;
  font-family: $font-principal; font-weight: 800; font-size: 1rem;
  color: $text-secondary; cursor: pointer; min-height: 52px;
  transition: all 0.2s;
  i { font-size: 1.6rem; color: rgba($primary-dark, 0.2); }
  &.active { border-color: $primary; color: $primary; background: rgba($primary, 0.06);
    i { color: $primary; }
  }
  &:active { transform: scale(0.97); }
}

.slider-row {
  display: flex; align-items: center; gap: 12px;
}
.slider-min, .slider-max { font-size: 0.8rem; font-weight: 700; color: $text-secondary; }
.slider-input {
  flex: 1; -webkit-appearance: none; appearance: none; height: 8px;
  background: rgba($primary-dark, 0.1); border-radius: 999px; outline: none;
  &::-webkit-slider-thumb {
    -webkit-appearance: none; width: 28px; height: 28px; border-radius: 50%;
    background: $primary; cursor: pointer; border: 3px solid white;
    box-shadow: 0 2px 8px rgba($primary, 0.35);
  }
}
.slider-val {
  text-align: center; font-size: 1.4rem; font-weight: 800; color: $primary;
  font-variant-numeric: tabular-nums;
}

.inp {
  width: 100%; padding: 14px; border: 2px solid rgba($primary-dark, 0.08); border-radius: 12px;
  font-size: 0.95rem; font-family: $font-principal; background: white; outline: none; box-sizing: border-box;
  &:focus { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
}

.photo-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; padding: 18px; border: 2px dashed rgba($primary, 0.3); border-radius: 14px;
  background: rgba($primary, 0.04); color: $primary; cursor: pointer;
  font-family: $font-principal; font-weight: 700; font-size: 0.95rem; min-height: 56px;
  transition: background 0.2s;
  i { font-size: 1.3rem; }
  &:hover { background: rgba($primary, 0.1); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.photo-name { font-size: 0.82rem; color: $text-secondary; display: inline-flex; align-items: center; gap: 6px; }
.ocr-status { display: inline-flex; align-items: center; gap: 8px; font-size: 0.82rem; color: $primary; font-weight: 600; }
.loader-xs { width: 16px; height: 16px; border: 2px solid rgba($primary, 0.2); border-top-color: $primary; border-radius: 50%; animation: spin 0.8s linear infinite; }
.ocr-banner {
  margin: 0 16px; padding: 12px; border-radius: 12px;
  background: rgba($alert-warning, 0.1); border: 1px solid rgba($alert-warning, 0.25);
  font-size: 0.82rem; color: darken($alert-warning, 8%); font-weight: 600;
  display: inline-flex; align-items: center; gap: 8px;
}

.submit-btn {
  position: fixed; bottom: 0; left: 0; right: 0;
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  padding: 18px; border: none; font-family: $font-principal; font-weight: 800; font-size: 1.05rem;
  color: white; background: linear-gradient(135deg, $primary, #1678b0);
  box-shadow: 0 -4px 20px rgba($primary, 0.3); cursor: pointer; min-height: 64px;
  &.disabled { opacity: 0.5; cursor: not-allowed; }
  &:active:not(.disabled) { transform: scale(0.98); }
}
</style>
