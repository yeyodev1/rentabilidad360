<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppSelect from '@/components/AppSelect.vue'
import { uploadService } from '../services/uploadService'

const props = withDefaults(defineProps<{
  equipment?: any
  branches?: Array<{ id: string; name: string; address?: string; isMain?: boolean }>
  initialBranchId?: string
  saveAction?: (data: any) => Promise<any>
}>(), {
  branches: () => [],
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: any): void
  (e: 'saved', result: any): void
}>()

const locationOptions = [
  'Planta', 'Reserva', 'Cocina', 'Bar', 'Almacén',
  'Patio', 'Terraza', 'Salón principal', 'Salón privado',
  'Cava', 'Cuarto frío', 'Zona de lavado', 'Oficina'
].map((label) => ({ value: label, label, icon: 'fa-solid fa-location-dot' }))

const statusOptions = [
  { value: 'operativo', label: 'Operativo', icon: 'fa-solid fa-circle-check' },
  { value: 'mantenimiento', label: 'En mantenimiento', icon: 'fa-solid fa-screwdriver-wrench' },
  { value: 'averiado', label: 'Averiado', icon: 'fa-solid fa-triangle-exclamation' },
  { value: 'fuera_servicio', label: 'Fuera de servicio', icon: 'fa-solid fa-ban' },
]

const form = ref({
  name: props.equipment?.name || '',
  brand: props.equipment?.brand || '',
  purchaseMonth: props.equipment ? props.equipment.purchaseDate.slice(0, 7) : new Date().toISOString().slice(0, 7),
  historicalCost: props.equipment?.historicalCost || 0,
  usefulLife: props.equipment?.usefulLife || 5,
  maintenanceIntervalDays: props.equipment?.maintenanceIntervalDays || 90,
  notes: props.equipment?.notes || '',
  imageUrl: props.equipment?.imageUrl || '',
  location: props.equipment?.location || '',
  branchId: props.equipment?.branchId || props.initialBranchId || props.branches.find((branch) => branch.isMain)?.id || props.branches[0]?.id || '',
  status: props.equipment?.status || 'operativo',
})

const loading = ref(false)
const uploading = ref(false)
const saveStep = ref<'idle' | 'uploading' | 'saving' | 'done' | 'error'>('idle')
const saveMessage = ref('')
const previewUrl = ref(form.value.imageUrl)
const stagedImageFile = ref<File | null>(null)
const objectUrl = ref('')

const branchOptions = computed(() => props.branches.map((branch) => ({
  value: branch.id,
  label: branch.name,
  icon: branch.isMain ? 'fa-solid fa-star' : 'fa-solid fa-store',
  hint: branch.isMain ? 'Sucursal principal' : branch.address || 'Sucursal operativa',
})))

watch(() => props.branches, (branches) => {
  if (!form.value.branchId && branches.length) {
    form.value.branchId = branches.find((branch) => branch.isMain)?.id || branches[0]?.id || ''
  }
}, { immediate: true })

function revokeObjectUrl() {
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
  objectUrl.value = ''
}

function handleImageUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  revokeObjectUrl()
  stagedImageFile.value = file
  objectUrl.value = URL.createObjectURL(file)
  previewUrl.value = objectUrl.value
  input.value = ''
}

function removeImage() {
  revokeObjectUrl()
  stagedImageFile.value = null
  form.value.imageUrl = ''
  previewUrl.value = ''
}

async function submit() {
  loading.value = true
  saveStep.value = stagedImageFile.value ? 'uploading' : 'saving'
  saveMessage.value = stagedImageFile.value ? 'Subiendo imagen del equipo...' : isEditing ? 'Actualizando ficha del equipo...' : 'Creando equipo y preparando auditoría QR...'
  try {
    if (stagedImageFile.value) {
      uploading.value = true
      const res: any = await uploadService.uploadImage(stagedImageFile.value, 'equipos')
      form.value.imageUrl = res.data?.url || res.url || ''
      previewUrl.value = form.value.imageUrl
      stagedImageFile.value = null
      revokeObjectUrl()
      uploading.value = false
    }
    saveStep.value = 'saving'
    saveMessage.value = isEditing ? 'Actualizando ficha del equipo...' : 'Creando equipo y preparando auditoría QR...'
    const payload = { ...form.value, purchaseDate: `${form.value.purchaseMonth}-01` }
    delete (payload as any).purchaseMonth
    const result = props.saveAction ? await props.saveAction(payload) : emit('save', payload)
    saveStep.value = 'done'
    saveMessage.value = isEditing ? 'Equipo actualizado' : 'Equipo creado. Listo para auditoría con QR.'
    await new Promise((resolve) => setTimeout(resolve, 650))
    emit('saved', result)
  } catch (err: any) {
    saveStep.value = 'error'
    saveMessage.value = 'No se pudo guardar. Revisa la conexión e intenta otra vez.'
    console.error('Upload failed', err)
  } finally {
    uploading.value = false
    loading.value = false
  }
}

const isEditing = !!props.equipment

onBeforeUnmount(revokeObjectUrl)
</script>

<template>
  <div class="modal-back" @click.self="emit('close')">
    <div class="modal" role="dialog" aria-modal="true">
      <header class="modal-head">
        <h3 class="modal-title">
          <i class="fa-solid" :class="isEditing ? 'fa-pen-to-square' : 'fa-plus'" />
          {{ isEditing ? 'Editar Equipo' : 'Registrar Nuevo Equipo' }}
        </h3>
        <button class="close-btn" type="button" @click="emit('close')">
          <i class="fa-solid fa-xmark" />
        </button>
      </header>

      <form class="eq-form" @submit.prevent="submit">
        <label class="field">
          <span class="field-label">
            Nombre del Equipo *
            <span class="hint-icon" data-tip="Nombre o identificación del equipo. Ej: Freidora Industrial, Homo Rational, Licuadora.">ⓘ</span>
          </span>
          <input v-model="form.name" type="text" required placeholder="Ej: Freidora Industrial" />
        </label>

        <label class="field">
          <span class="field-label">
            Marca
            <span class="hint-icon" data-tip="Marca o fabricante del equipo. Opcional pero útil para identificar repuestos.">ⓘ</span>
          </span>
          <input v-model="form.brand" type="text" placeholder="Ej: Vulcan" />
        </label>

        <div class="grid-2">
          <label class="field">
          <span class="field-label">
              Mes aproximado de compra *
              <span class="hint-icon" data-tip="No necesitas el día exacto. Elige el mes aproximado para calcular depreciación y auditoría del activo.">ⓘ</span>
            </span>
            <input v-model="form.purchaseMonth" type="month" required />
          </label>
          <label class="field">
            <span class="field-label">
              Costo Histórico ($) *
              <span class="hint-icon" data-tip="Monto total pagado por el equipo (incluye impuestos y flete). Base para calcular depreciación.">ⓘ</span>
            </span>
            <input v-model.number="form.historicalCost" type="number" required min="0" step="0.01" />
          </label>
        </div>

        <div class="grid-2">
          <label class="field">
            <span class="field-label">
              Vida Útil (Años) *
              <span class="hint-icon" data-tip="Años que este equipo puede funcionar antes de necesitar reemplazo. Ej: 5 para maquinaria de cocina. Afecta la depreciación anual.">ⓘ</span>
            </span>
            <input v-model.number="form.usefulLife" type="number" required min="1" />
          </label>
          <label class="field">
            <span class="field-label">
              Mantenimiento cada (Días) *
              <span class="hint-icon" data-tip="Cada cuántos días debe recibir mantenimiento este equipo. Ej: 90 para freidora, 30 para horno.">ⓘ</span>
            </span>
            <input v-model.number="form.maintenanceIntervalDays" type="number" required min="1" />
          </label>
        </div>

        <label class="field">
          <span class="field-label">
            Sucursal *
            <span class="hint-icon" data-tip="Sucursal responsable del equipo. Esta relación se muestra al escanear el QR para auditoría.">ⓘ</span>
          </span>
          <AppSelect v-model="form.branchId" :options="branchOptions" placeholder="Seleccionar sucursal" icon="fa-solid fa-store" required />
        </label>

        <label class="field">
          <span class="field-label">
            Ubicación interna
            <span class="hint-icon" data-tip="Dónde está instalado dentro de la sucursal. Ej: Cocina, Bar, Cava.">ⓘ</span>
          </span>
          <AppSelect v-model="form.location" :options="locationOptions" placeholder="Seleccionar ubicación" icon="fa-solid fa-location-dot" allow-custom custom-placeholder="Ej: Entrada principal" />
        </label>

        <label v-if="isEditing" class="field">
          <span class="field-label">Estado actual del equipo</span>
          <AppSelect v-model="form.status" :options="statusOptions" placeholder="Seleccionar estado" icon="fa-solid fa-gauge-high" required />
        </label>

        <label class="field">
          <span class="field-label">
            Foto del Equipo
            <span class="hint-icon" data-tip="Sube una foto del equipo para identificarlo visualmente en la lista.">ⓘ</span>
          </span>
          <div class="image-upload" v-if="!previewUrl" :class="{ uploading }">
            <label class="upload-btn">
              <input type="file" accept="image/*" hidden @change="handleImageUpload" />
              <i class="fa-solid fa-folder-image" />
              <span class="btn-label">Galería</span>
            </label>
            <label class="upload-btn cam">
              <input type="file" accept="image/*" capture="environment" hidden @change="handleImageUpload" />
              <i class="fa-solid fa-camera" />
              <span class="btn-label">Cámara</span>
            </label>
            <span class="uploading-msg">Se subirá recién al guardar</span>
          </div>
          <div class="image-preview" v-else>
            <img :src="previewUrl" alt="Foto del equipo" />
            <span v-if="stagedImageFile" class="staged-pill">Pendiente</span>
            <button type="button" class="remove-img" @click="removeImage">
              <i class="fa-solid fa-xmark" />
            </button>
          </div>
        </label>

        <label class="field">
          <span class="field-label">
            Notas
            <span class="hint-icon" data-tip="Información adicional útil: ubicación, proveedor, fecha de última reparación, etc.">ⓘ</span>
          </span>
          <textarea v-model="form.notes" rows="2" placeholder="Ej: Ubicado en cocina principal, junto a la freidora #2"></textarea>
        </label>

        <footer class="form-actions">
          <button type="button" class="btn ghost" @click="emit('close')">Cancelar</button>
          <button type="submit" class="btn primary" :disabled="loading || uploading">
            <i class="fa-solid fa-floppy-disk" /> {{ saveStep === 'uploading' ? 'Subiendo foto...' : saveStep === 'saving' ? 'Guardando...' : 'Guardar' }}
          </button>
        </footer>
      </form>

      <Transition name="save-flow">
        <div v-if="saveStep !== 'idle'" class="save-overlay" :class="saveStep">
          <div class="save-card">
            <span class="save-spinner" v-if="saveStep === 'uploading' || saveStep === 'saving'">
              <i class="fa-solid" :class="saveStep === 'uploading' ? 'fa-cloud-arrow-up' : 'fa-qrcode'" />
            </span>
            <span class="save-done" v-else-if="saveStep === 'done'"><i class="fa-solid fa-circle-check" /></span>
            <span class="save-error" v-else><i class="fa-solid fa-triangle-exclamation" /></span>
            <strong>{{ saveMessage }}</strong>
            <small v-if="saveStep === 'uploading'">La imagen se está vinculando al equipo, no se guarda por separado.</small>
            <small v-else-if="saveStep === 'saving'">Se está creando la ficha, sucursal, historial inicial y QR de auditoría.</small>
            <small v-else-if="saveStep === 'done'">Ya puedes imprimir el ticket QR o abrir la ficha técnica.</small>
            <button v-else type="button" class="btn ghost" @click="saveStep = 'idle'">Volver al formulario</button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped lang="scss">
.modal-back {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.modal {
  position: relative;
  width: 100%; max-width: 500px;
  background: white; border-radius: 22px;
  padding: 24px; display: flex; flex-direction: column; gap: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  max-height: calc(100dvh - 48px); overflow-y: auto;
}
.modal-head { display: flex; justify-content: space-between; align-items: center; }
.modal-title { margin: 0; font-size: 1.2rem; font-weight: 800; color: $primary-dark; display: flex; align-items: center; gap: 8px; i { color: $primary; } }
.close-btn { width: 32px; height: 32px; border-radius: 10px; border: none; background: rgba($primary-dark, 0.05); cursor: pointer; &:hover { background: rgba($primary-dark, 0.1); } }

.eq-form { display: flex; flex-direction: column; gap: 16px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }

.field-label {
  font-size: 0.8rem; font-weight: 700; color: $text-secondary;
  display: inline-flex; align-items: center; gap: 4px;
}
.hint-icon {
  position: relative; display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 50%;
  background: rgba($primary-dark, 0.08); color: $text-secondary;
  font-size: 0.6rem; cursor: help; flex-shrink: 0;
  transition: all 0.15s;
  &:hover {
    background: $primary; color: white;
    &::after {
      visibility: visible; opacity: 1; transform: translateX(-50%) translateY(0);
    }
  }
  &::after {
    content: attr(data-tip);
    position: absolute; z-index: 200;
    bottom: calc(100% + 8px); left: 50%;
    transform: translateX(-50%) translateY(4px);
    visibility: hidden; opacity: 0;
    transition: all 0.2s ease;
    background: $primary-dark; color: white;
    padding: 8px 12px; border-radius: 8px;
    font-size: 0.75rem; font-weight: 500; line-height: 1.4;
    white-space: normal; width: 220px; text-align: left;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    pointer-events: none;
  }
}

.field input, .field textarea {
  padding: 12px; border-radius: 12px; border: 1.5px solid rgba($primary-dark, 0.1);
  background: rgba($bg, 0.64); font-family: $font-principal; font-size: 0.95rem; color: $primary-dark;
  &:focus { outline: none; border-color: $primary; background: white; }
}

.image-upload { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.upload-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 16px; border-radius: 12px;
  background: rgba($primary, 0.08); cursor: pointer; font-size: 0.85rem; font-weight: 600;
  border: 2px dashed rgba($primary-dark, 0.15);
  color: $text-secondary; transition: all 0.2s; flex: 0 1 auto;
  i { color: $primary; font-size: 1rem; }
  &:hover { border-color: $primary; background: rgba($primary, 0.05); }
  &.cam { i { color: #16a34a; } &:hover { border-color: #16a34a; background: rgba(#16a34a, 0.05); } }
}
.uploading-msg { font-size: 0.8rem; color: $primary; font-weight: 600; }
.image-upload.uploading .upload-btn { opacity: 0.5; pointer-events: none; }
.image-preview {
  position: relative; width: 120px; height: 120px;
  border-radius: 14px; overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; }
}
.staged-pill {
  position: absolute; left: 6px; bottom: 6px; padding: 4px 7px; border-radius: 999px;
  background: rgba($primary-dark, 0.74); color: white; font-size: 0.62rem; font-weight: 800;
}
.save-overlay {
  position: absolute; inset: 0; z-index: 20; display: grid; place-items: center; padding: 22px;
  background: rgba(white, 0.82); backdrop-filter: blur(7px); border-radius: 22px;
}
.save-card {
  width: min(100%, 340px); padding: 24px; border-radius: 24px; text-align: center;
  background: radial-gradient(circle at 50% 0%, rgba($primary, 0.16), transparent 48%), white;
  border: 1px solid rgba($primary-dark, 0.08); box-shadow: 0 24px 70px rgba($primary-dark, 0.18);
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  strong { color: $primary-dark; font-size: 1rem; line-height: 1.35; }
  small { color: $text-secondary; font-size: 0.82rem; line-height: 1.45; max-width: 280px; }
}
.save-spinner, .save-done, .save-error {
  width: 64px; height: 64px; border-radius: 22px; display: grid; place-items: center;
  font-size: 1.6rem; color: white; margin-bottom: 4px;
}
.save-spinner {
  position: relative; background: linear-gradient(135deg, $primary-dark, $primary);
  box-shadow: 0 18px 36px rgba($primary, 0.28);
  &::after { content: ''; position: absolute; inset: -7px; border-radius: 27px; border: 2px solid rgba($primary, 0.18); border-top-color: $accent; animation: spin 0.8s linear infinite; }
}
.save-done { background: linear-gradient(135deg, $alert-success, $accent); box-shadow: 0 18px 36px rgba($alert-success, 0.24); }
.save-error { background: linear-gradient(135deg, $alert-error, #dc2626); box-shadow: 0 18px 36px rgba($alert-error, 0.24); }
.save-flow-enter-active, .save-flow-leave-active { transition: opacity 0.2s; }
.save-flow-enter-from, .save-flow-leave-to { opacity: 0; }
.save-flow-enter-active .save-card, .save-flow-leave-active .save-card { transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s; }
.save-flow-enter-from .save-card, .save-flow-leave-to .save-card { transform: translateY(14px) scale(0.96); opacity: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
.remove-img {
  position: absolute; top: 4px; right: 4px;
  width: 24px; height: 24px; border-radius: 50%;
  border: none; background: rgba(0,0,0,0.5); color: white;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  &:hover { background: rgba(0,0,0,0.7); }
}

.location-row { display: flex; gap: 8px; }
.location-select {
  flex: 1; padding: 12px; border-radius: 12px; border: 1.5px solid rgba($primary-dark, 0.1);
  background: rgba($bg, 0.64); font-family: $font-principal; font-size: 0.95rem; color: $primary-dark;
  &:focus { outline: none; border-color: $primary; background: white; }
}
.location-input {
  flex: 1; padding: 12px; border-radius: 12px; border: 1.5px solid rgba($primary-dark, 0.1);
  background: rgba($bg, 0.64); font-family: $font-principal; font-size: 0.95rem; color: $primary-dark;
  &:focus { outline: none; border-color: $primary; background: white; }
}

.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
.btn {
  padding: 12px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; font-family: $font-principal; font-size: 0.95rem; border: 2px solid transparent; transition: all 0.2s;
  &.primary { background: $primary; color: white; &:hover:not(:disabled) { box-shadow: 0 6px 16px rgba($primary, 0.3); transform: translateY(-1px); } }
  &.ghost { background: transparent; color: $primary-dark; &:hover { background: rgba($primary-dark, 0.05); } }
  &:disabled { opacity: 0.7; cursor: not-allowed; }
}
</style>
