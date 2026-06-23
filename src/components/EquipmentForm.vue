<script setup lang="ts">
import { ref } from 'vue'
import { uploadService } from '../services/uploadService'

const props = withDefaults(defineProps<{
  equipment?: any
}>(), {})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: any): void
}>()

const locationOptions = [
  'Planta', 'Reserva', 'Cocina', 'Bar', 'Almacén',
  'Patio', 'Terraza', 'Salón principal', 'Salón privado',
  'Cava', 'Cuarto frío', 'Zona de lavado', 'Oficina'
]

const form = ref({
  name: props.equipment?.name || '',
  brand: props.equipment?.brand || '',
  purchaseDate: props.equipment ? props.equipment.purchaseDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
  historicalCost: props.equipment?.historicalCost || 0,
  usefulLife: props.equipment?.usefulLife || 5,
  maintenanceIntervalDays: props.equipment?.maintenanceIntervalDays || 90,
  notes: props.equipment?.notes || '',
  imageUrl: props.equipment?.imageUrl || '',
  location: props.equipment?.location || ''
})

const showCustomLocation = ref(locationOptions.includes(form.value.location) ? false : !!form.value.location)

const loading = ref(false)
const uploading = ref(false)
const previewUrl = ref(form.value.imageUrl)

async function handleImageUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const res: any = await uploadService.uploadImage(file, 'equipos')
    form.value.imageUrl = res.data?.url || res.url || ''
    previewUrl.value = form.value.imageUrl
  } catch (err: any) {
    console.error('Upload failed', err)
  } finally {
    uploading.value = false
  }
}

function removeImage() {
  form.value.imageUrl = ''
  previewUrl.value = ''
}

async function submit() {
  loading.value = true
  try {
    emit('save', { ...form.value })
  } finally {
    loading.value = false
  }
}

const isEditing = !!props.equipment
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
              Fecha de Compra *
              <span class="hint-icon" data-tip="Fecha en que se adquirió el equipo. Se usa para calcular depreciación lineal.">ⓘ</span>
            </span>
            <input v-model="form.purchaseDate" type="date" required />
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
            Ubicación
            <span class="hint-icon" data-tip="Dónde está instalado el equipo. Ej: Planta, Reserva, Cocina, Bar.">ⓘ</span>
          </span>
          <div class="location-row">
            <select v-model="form.location" class="location-select" @change="showCustomLocation = form.location === '__custom__'">
              <option value="" disabled>Seleccionar ubicación</option>
              <option v-for="opt in locationOptions" :key="opt" :value="opt">{{ opt }}</option>
              <option value="__custom__">Otra...</option>
            </select>
            <input v-if="showCustomLocation" v-model="form.location" type="text" placeholder="Ej: Entrada principal" class="location-input" />
          </div>
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
            <span v-if="uploading" class="uploading-msg">Subiendo…</span>
          </div>
          <div class="image-preview" v-else>
            <img :src="previewUrl" alt="Foto del equipo" />
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
          <button type="submit" class="btn primary" :disabled="loading">
            <i class="fa-solid fa-floppy-disk" /> {{ loading ? 'Guardando...' : 'Guardar' }}
          </button>
        </footer>
      </form>
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
  width: 100%; max-width: 500px;
  background: white; border-radius: 22px;
  padding: 24px; display: flex; flex-direction: column; gap: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
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
    background: #1e293b; color: white;
    padding: 8px 12px; border-radius: 8px;
    font-size: 0.75rem; font-weight: 500; line-height: 1.4;
    white-space: normal; width: 220px; text-align: left;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    pointer-events: none;
  }
}

.field input, .field textarea {
  padding: 12px; border-radius: 12px; border: 1.5px solid rgba($primary-dark, 0.1);
  background: #f8fafc; font-family: $font-principal; font-size: 0.95rem; color: $primary-dark;
  &:focus { outline: none; border-color: $primary; background: white; }
}

.image-upload { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.upload-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 16px; border-radius: 12px;
  background: #f0f4f8; cursor: pointer; font-size: 0.85rem; font-weight: 600;
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
  background: #f8fafc; font-family: $font-principal; font-size: 0.95rem; color: $primary-dark;
  &:focus { outline: none; border-color: $primary; background: white; }
}
.location-input {
  flex: 1; padding: 12px; border-radius: 12px; border: 1.5px solid rgba($primary-dark, 0.1);
  background: #f8fafc; font-family: $font-principal; font-size: 0.95rem; color: $primary-dark;
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
