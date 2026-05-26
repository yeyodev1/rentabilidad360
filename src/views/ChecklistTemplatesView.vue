<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import AppShell from '@/layout/AppShell.vue'
import { checklistService } from '@/services/checklistService'

interface ChecklistField {
  label: string
  type: 'checkbox' | 'slider' | 'text' | 'number' | 'photo'
  required: boolean
  order: number
}

interface ChecklistTemplate {
  _id: string
  name: string
  category: string
  description?: string
  fields: ChecklistField[]
  isActive: boolean
}

const router = useRouter()
const ui = useUIStore()

const categories = [
  { key: 'cocina_insumos', label: 'Cocina e Insumos', icon: 'fa-solid fa-kitchen-set' },
  { key: 'atencion_planta', label: 'Atención y Planta', icon: 'fa-solid fa-bell-concierge' },
  { key: 'caja_finanzas', label: 'Caja y Finanzas', icon: 'fa-solid fa-cash-register' },
] as const

const templates = ref<ChecklistTemplate[]>([])
const loading = ref(true)
const showCreateForm = ref(false)
const newTemplate = ref({ name: '', category: 'cocina_insumos', description: '' })

const templatesByCategory = computed(() => {
  const map: Record<string, ChecklistTemplate[]> = {}
  for (const t of templates.value) {
    if (!map[t.category]) map[t.category] = []
    map[t.category]!.push(t)
  }
  return map
})

function fieldCount(t: ChecklistTemplate): number {
  return t.fields?.length || 0
}

function goExecute(templateId: string) {
  router.push(`/modulo/checklists/ejecutar/${templateId}`)
}

function goReview() {
  router.push('/modulo/checklists/revision')
}

async function handleDelete(templateId: string) {
  const ok = await ui.requestConfirm({
    title: '¿Eliminar plantilla?',
    message: 'Esta acción no se puede deshacer.',
    confirmLabel: 'Sí, eliminar',
    cancelLabel: 'Cancelar',
    tone: 'danger',
    icon: 'fa-solid fa-trash',
  })
  if (!ok) return
  try {
    await checklistService.deleteTemplate(templateId)
    templates.value = templates.value.filter((t) => t._id !== templateId)
    ui.showToast({ title: 'Plantilla eliminada', tone: 'success' })
  } catch {
    templates.value = templates.value.filter((t) => t._id !== templateId)
    ui.showToast({ title: 'Plantilla eliminada (local)', tone: 'info' })
  }
}

async function handleCreate() {
  if (!newTemplate.value.name.trim()) {
    ui.showToast({ title: 'El nombre es obligatorio', tone: 'warning' })
    return
  }
  const payload = {
    name: newTemplate.value.name.trim(),
    category: newTemplate.value.category,
    description: newTemplate.value.description.trim(),
    fields: [] as ChecklistField[],
  }
  try {
    const res = await checklistService.createTemplate(payload)
    templates.value.push(res.data as unknown as ChecklistTemplate)
    ui.showToast({ title: 'Plantilla creada', tone: 'success' })
  } catch {
    const demoId = `demo_${Date.now()}`
    templates.value.push({ _id: demoId, ...payload, fields: [], isActive: true })
    ui.showToast({ title: 'Plantilla creada (offline)', tone: 'info' })
  }
  showCreateForm.value = false
  newTemplate.value = { name: '', category: 'cocina_insumos', description: '' }
}

const demoTemplates: ChecklistTemplate[] = [
  { _id: 'demo_c1', name: 'Limpieza de Cocina', category: 'cocina_insumos', description: 'Checklist diario de limpieza profunda', fields: [
    { label: 'Mesones desinfectados', type: 'checkbox', required: true, order: 0 },
    { label: 'Temperatura cámara', type: 'number', required: true, order: 1 },
    { label: 'Estado de freidoras', type: 'slider', required: true, order: 2 },
  ], isActive: true },
  { _id: 'demo_c2', name: 'Revisión de Insumos', category: 'cocina_insumos', description: 'Control de inventario de insumos diarios', fields: [
    { label: 'Aceite filtrado', type: 'checkbox', required: true, order: 0 },
    { label: 'Cantidad de pollo (kg)', type: 'number', required: true, order: 1 },
    { label: 'Foto de almacén', type: 'photo', required: false, order: 2 },
  ], isActive: true },
  { _id: 'demo_a1', name: 'Apertura de Sala', category: 'atencion_planta', description: 'Verificaciones antes de abrir', fields: [
    { label: 'Mesas limpias y puestas', type: 'checkbox', required: true, order: 0 },
    { label: 'Baños abastecidos', type: 'checkbox', required: true, order: 1 },
    { label: 'Estado general del salón', type: 'slider', required: true, order: 2 },
  ], isActive: true },
  { _id: 'demo_a2', name: 'Cierre de Atención', category: 'atencion_planta', description: 'Checklist de cierre de turno atención', fields: [
    { label: 'Sillas apiladas', type: 'checkbox', required: true, order: 0 },
    { label: 'Basura retirada', type: 'checkbox', required: true, order: 1 },
    { label: 'Observaciones', type: 'text', required: false, order: 2 },
  ], isActive: true },
  { _id: 'demo_f1', name: 'Arqueo de Caja', category: 'caja_finanzas', description: 'Cierre de caja diario', fields: [
    { label: 'Efectivo en caja ($)', type: 'number', required: true, order: 0 },
    { label: 'Tarjetas procesadas', type: 'number', required: true, order: 1 },
    { label: 'Diferencias detectadas', type: 'text', required: false, order: 2 },
  ], isActive: true },
  { _id: 'demo_f2', name: 'Depósito Bancario', category: 'caja_finanzas', description: 'Registro de depósito del día', fields: [
    { label: 'Monto depositado', type: 'number', required: true, order: 0 },
    { label: 'Foto del comprobante', type: 'photo', required: true, order: 1 },
  ], isActive: true },
]

onMounted(async () => {
  try {
    const res = await checklistService.listTemplates()
    templates.value = res.data as unknown as ChecklistTemplate[]
  } catch {
    templates.value = demoTemplates
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AppShell>
    <div class="page">
      <header class="page-head">
        <div>
          <h1 class="page-title"><i class="fa-solid fa-clipboard-list" /> Checklists</h1>
          <p class="page-sub">Plantillas de checklist agrupadas por área de operación</p>
        </div>
        <div class="head-actions">
          <button class="btn ghost" @click="goReview">
            <i class="fa-solid fa-check-double" /> Pendientes
          </button>
          <button class="btn primary" @click="showCreateForm = !showCreateForm">
            <i class="fa-solid fa-plus" /> Crear plantilla
          </button>
        </div>
      </header>

      <Transition name="fade">
        <div v-if="showCreateForm" class="create-card">
          <h3><i class="fa-solid fa-pen" /> Nueva plantilla</h3>
          <div class="create-fields">
            <div class="field">
              <label class="lbl">Nombre</label>
              <input v-model="newTemplate.name" type="text" class="inp" placeholder="Ej: Limpieza matutina" />
            </div>
            <div class="field">
              <label class="lbl">Categoría</label>
              <select v-model="newTemplate.category" class="inp">
                <option v-for="c in categories" :key="c.key" :value="c.key">{{ c.label }}</option>
              </select>
            </div>
            <div class="field">
              <label class="lbl">Descripción</label>
              <input v-model="newTemplate.description" type="text" class="inp" placeholder="Opcional" />
            </div>
          </div>
          <div class="create-actions">
            <button class="btn ghost sm" @click="showCreateForm = false">Cancelar</button>
            <button class="btn primary sm" @click="handleCreate"><i class="fa-solid fa-check" /> Crear</button>
          </div>
        </div>
      </Transition>

      <div v-if="loading" class="loading-state">
        <div class="loader" />
        <p>Cargando plantillas...</p>
      </div>

      <template v-else>
        <section v-for="cat in categories" :key="cat.key" class="cat-section">
          <header class="cat-head">
            <i :class="cat.icon" class="cat-icon" />
            <h2 class="cat-title">{{ cat.label }}</h2>
            <span class="cat-count">{{ (templatesByCategory[cat.key] || []).length }} plantillas</span>
          </header>

          <div v-if="!(templatesByCategory[cat.key] || []).length" class="empty-cat">
            <p>No hay plantillas en esta categoría</p>
          </div>

          <div v-else class="template-grid">
            <article v-for="t in (templatesByCategory[cat.key] || [])" :key="t._id" class="template-card">
              <div class="tc-head">
                <h3 class="tc-name">{{ t.name }}</h3>
                <span v-if="t.description" class="tc-desc">{{ t.description }}</span>
              </div>
              <div class="tc-meta">
                <span><i class="fa-solid fa-list" /> {{ fieldCount(t) }} campos</span>
              </div>
              <div class="tc-actions">
                <button class="btn primary sm" @click="goExecute(t._id)">
                  <i class="fa-solid fa-play" /> Ejecutar
                </button>
                <button class="btn ghost sm" @click="handleDelete(t._id)">
                  <i class="fa-solid fa-trash" />
                </button>
              </div>
            </article>
          </div>
        </section>
      </template>
    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.page {
  padding: 24px 28px 60px;
  display: flex; flex-direction: column; gap: 20px;
  @media (max-width: 720px) { padding: 18px 16px 60px; }
}

.page-head {
  display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap;
}
.page-title {
  margin: 0; font-size: clamp(1.3rem, 1.2vw + 0.8rem, 1.7rem); font-weight: 800; color: $primary-dark;
  display: inline-flex; align-items: center; gap: 10px;
  i { color: $primary; }
}
.page-sub { margin: 4px 0 0; font-size: 0.88rem; color: $text-secondary; }
.head-actions { display: inline-flex; gap: 8px; flex-wrap: wrap; }

.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 16px; border-radius: 12px;
  font-family: $font-principal; font-weight: 700; font-size: 0.88rem;
  border: none; cursor: pointer; text-decoration: none;
  transition: transform 0.15s, background 0.2s;
  &:active:not(:disabled) { transform: scale(0.97); }
  &.sm { padding: 8px 12px; font-size: 0.8rem; }
}
.btn.primary {
  background: linear-gradient(135deg, $primary, #1678b0); color: white;
  box-shadow: 0 8px 20px rgba($primary, 0.28);
}
.btn.ghost {
  background: rgba($primary-dark, 0.06); color: $primary-dark;
  &:hover { background: rgba($primary-dark, 0.12); }
}

.loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px 0; gap: 12px; color: $text-secondary; }
.loader { width: 36px; height: 36px; border: 3px solid rgba($primary, 0.2); border-top-color: $primary; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.create-card {
  background: white; border: 1px solid rgba($primary, 0.25); border-radius: 18px; padding: 18px;
  display: flex; flex-direction: column; gap: 14px;
  h3 { margin: 0; font-size: 1rem; font-weight: 800; color: $primary-dark; i { color: $primary; } }
}
.create-fields { display: flex; flex-direction: column; gap: 12px; }
.create-actions { display: flex; gap: 10px; justify-content: flex-end; }

.field { display: flex; flex-direction: column; gap: 4px; }
.lbl { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; color: $text-secondary; }
.inp {
  width: 100%; padding: 12px 14px; border: 2px solid rgba($primary-dark, 0.08); border-radius: 12px;
  font-size: 0.9rem; font-family: $font-principal; background: white; outline: none; box-sizing: border-box;
  &:focus { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
}

.cat-section { display: flex; flex-direction: column; gap: 12px; }
.cat-head { display: flex; align-items: center; gap: 10px; }
.cat-icon { color: $primary; font-size: 1.1rem; }
.cat-title { margin: 0; font-size: 1.05rem; font-weight: 800; color: $primary-dark; }
.cat-count { margin-left: auto; font-size: 0.75rem; font-weight: 600; color: $text-secondary; background: rgba($primary-dark, 0.06); padding: 4px 10px; border-radius: 999px; }

.empty-cat { padding: 20px; text-align: center; color: $text-secondary; font-size: 0.88rem; background: white; border-radius: 16px; border: 1px dashed rgba($primary-dark, 0.15); }

.template-grid {
  display: grid; gap: 10px;
  grid-template-columns: 1fr;
  @media (min-width: 640px) { grid-template-columns: 1fr 1fr; }
}
.template-card {
  background: white; border: 1px solid rgba($primary-dark, 0.06); border-radius: 16px; padding: 16px;
  display: flex; flex-direction: column; gap: 10px;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 8px 20px rgba($primary-dark, 0.08); }
}
.tc-head { display: flex; flex-direction: column; gap: 2px; }
.tc-name { margin: 0; font-size: 0.95rem; font-weight: 800; color: $primary-dark; }
.tc-desc { font-size: 0.78rem; color: $text-secondary; }
.tc-meta { font-size: 0.78rem; color: $text-secondary; display: inline-flex; gap: 12px; i { color: $primary; margin-right: 4px; } }
.tc-actions { display: flex; gap: 8px; margin-top: 4px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
