<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useUIStore } from '@/stores/ui'
import AppShell from '@/layout/AppShell.vue'
import { checklistService } from '@/services/checklistService'

interface ChecklistInstance {
  _id: string
  templateName: string
  operatorName: string
  branchName?: string
  status: 'pending' | 'reviewed' | 'approved'
  responses: Record<string, unknown>
  comments?: string
  createdAt: string
  reviewedAt?: string
}

const router = useRouter()
const userStore = useUserStore()
const ui = useUIStore()

const instances = ref<ChecklistInstance[]>([])
const loading = ref(true)
const showDetail = ref<ChecklistInstance | null>(null)
const reviewComment = ref('')
const reviewing = ref(false)
const downloading = ref(false)

const isAdmin = computed(() => {
  const role = localStorage.getItem('user_role')
  return role === 'admin'
})

const pendingInstances = computed(() => instances.value.filter((i) => i.status === 'pending'))
const reviewedInstances = computed(() => instances.value.filter((i) => i.status !== 'pending'))

function statusClass(s: string): string {
  if (s === 'approved') return 'green'
  if (s === 'reviewed') return 'yellow'
  return 'red'
}

function statusLabel(s: string): string {
  if (s === 'approved') return 'Aprobado'
  if (s === 'reviewed') return 'Revisado'
  return 'Pendiente'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function openDetail(inst: ChecklistInstance) {
  showDetail.value = inst
  reviewComment.value = inst.comments || ''
}

function closeDetail() {
  showDetail.value = null
  reviewComment.value = ''
}

async function handleApprove() {
  if (!showDetail.value) return
  const currentId = showDetail.value._id
  reviewing.value = true
  try {
    await checklistService.reviewChecklist(currentId, reviewComment.value, true)
    const idx = instances.value.findIndex((i) => i._id === currentId)
    if (idx >= 0 && instances.value[idx]) {
      instances.value[idx]!.status = 'approved'
    }
    ui.showToast({ title: 'Checklist aprobado', tone: 'success', icon: 'fa-solid fa-circle-check' })
    closeDetail()
  } catch {
    ui.showToast({ title: 'Error al aprobar (modo offline)', tone: 'warning' })
    const idx = instances.value.findIndex((i) => i._id === currentId)
    if (idx >= 0 && instances.value[idx]) {
      instances.value[idx]!.status = 'approved'
    }
    closeDetail()
  } finally {
    reviewing.value = false
  }
}

async function handleDownload(id: string) {
  downloading.value = true
  try {
    const res = await checklistService.downloadPDF(id)
    const blob = new Blob([(res as unknown as { data: Blob }).data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `checklist_${id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    ui.showToast({ title: 'PDF descargado', tone: 'success' })
  } catch {
    ui.showToast({ title: 'Error al descargar PDF', tone: 'error' })
  } finally {
    downloading.value = false
  }
}

const demoInstances: ChecklistInstance[] = [
  { _id: 'demo_i1', templateName: 'Limpieza de Cocina', operatorName: 'Carlos Mendoza', branchName: 'Centro', status: 'pending', responses: { Mesones_desinfectados: true, Temperatura_cámara: 4 }, createdAt: '2026-05-25T09:30:00' },
  { _id: 'demo_i2', templateName: 'Apertura de Sala', operatorName: 'María López', branchName: 'Norte', status: 'pending', responses: { Mesas_limpias: true }, createdAt: '2026-05-25T08:15:00' },
  { _id: 'demo_i3', templateName: 'Arqueo de Caja', operatorName: 'Pedro Ramírez', branchName: 'Centro', status: 'reviewed', responses: { Efectivo: 1240.50 }, comments: 'Revisar diferencia de $2.50', createdAt: '2026-05-24T18:00:00', reviewedAt: '2026-05-24T19:30:00' },
  { _id: 'demo_i4', templateName: 'Revisión de Insumos', operatorName: 'Lucía Fernández', branchName: 'Centro', status: 'approved', responses: { Aceite_filtrado: true, Cantidad_pollo: 45 }, comments: 'Ok, todo en orden', createdAt: '2026-05-24T07:00:00', reviewedAt: '2026-05-24T08:00:00' },
]

onMounted(async () => {
  userStore.hydrate()
  try {
    const res = await checklistService.getDailyChecklists()
    instances.value = res.data as unknown as ChecklistInstance[]
  } catch {
    try {
      const res = await checklistService.getPendingReviews()
      instances.value = res.data as unknown as ChecklistInstance[]
    } catch {
      instances.value = demoInstances
    }
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
        <h1 class="top-title">Revisión de Checklists</h1>
      </header>

      <div v-if="!isAdmin" class="no-admin">
        <i class="fa-solid fa-lock" />
        <strong>Solo administradores</strong>
        <p>Necesitas rol de administrador para revisar checklists.</p>
        <button class="btn primary" @click="router.push('/modulo/checklists')">
          Volver a plantillas
        </button>
      </div>

      <template v-else>
        <div v-if="loading" class="loading-state">
          <div class="loader" />
          <p>Cargando revisiones...</p>
        </div>

        <template v-else>
          <section class="list-section">
            <header class="sec-head">
              <h2><i class="fa-solid fa-clock" /> Pendientes</h2>
              <span class="sec-badge">{{ pendingInstances.length }}</span>
            </header>

            <div v-if="!pendingInstances.length" class="empty-state">
              <i class="fa-solid fa-circle-check" />
              <p>Todos los checklists están revisados</p>
            </div>

            <div v-else class="inst-list">
              <article v-for="inst in pendingInstances" :key="inst._id" class="inst-card" @click="openDetail(inst)">
                <div class="inst-top">
                  <strong class="inst-name">{{ inst.templateName }}</strong>
                  <span :class="['status-badge', statusClass(inst.status)]">{{ statusLabel(inst.status) }}</span>
                </div>
                <div class="inst-meta">
                  <span><i class="fa-solid fa-user" /> {{ inst.operatorName }}</span>
                  <span v-if="inst.branchName"><i class="fa-solid fa-store" /> {{ inst.branchName }}</span>
                  <span><i class="fa-solid fa-clock" /> {{ formatDate(inst.createdAt) }}</span>
                </div>
              </article>
            </div>
          </section>

          <section class="list-section">
            <header class="sec-head">
              <h2><i class="fa-solid fa-check-double" /> Revisados</h2>
              <span class="sec-badge">{{ reviewedInstances.length }}</span>
            </header>

            <div v-if="!reviewedInstances.length" class="empty-state">
              <p>Ningún checklist revisado aún</p>
            </div>

            <div v-else class="inst-list">
              <article v-for="inst in reviewedInstances" :key="inst._id" class="inst-card reviewed" @click="openDetail(inst)">
                <div class="inst-top">
                  <strong class="inst-name">{{ inst.templateName }}</strong>
                  <span :class="['status-badge', statusClass(inst.status)]">{{ statusLabel(inst.status) }}</span>
                </div>
                <div class="inst-meta">
                  <span><i class="fa-solid fa-user" /> {{ inst.operatorName }}</span>
                  <span v-if="inst.branchName"><i class="fa-solid fa-store" /> {{ inst.branchName }}</span>
                  <span><i class="fa-solid fa-clock" /> {{ formatDate(inst.createdAt) }}</span>
                </div>
                <div class="inst-actions">
                  <button class="btn ghost xs" @click.stop="handleDownload(inst._id)" :disabled="downloading">
                    <i class="fa-solid fa-file-pdf" /> PDF
                  </button>
                </div>
              </article>
            </div>
          </section>
        </template>
      </template>

      <Teleport to="body">
        <div v-if="showDetail" class="modal-back" @click.self="closeDetail">
          <div class="modal" role="dialog" aria-modal="true">
            <header class="modal-head">
              <div>
                <h3>{{ showDetail.templateName }}</h3>
                <span class="modal-operator"><i class="fa-solid fa-user" /> {{ showDetail.operatorName }}</span>
              </div>
              <button class="close-btn" @click="closeDetail"><i class="fa-solid fa-xmark" /></button>
            </header>

            <div class="modal-body">
              <div class="response-group">
                <span class="response-label" v-for="(val, key, idx) in showDetail.responses" :key="idx">
                  <strong>{{ key.replace(/_/g, ' ') }}:</strong>
                  <span>{{ String(val) }}</span>
                </span>
              </div>

              <div class="field">
                <label class="lbl"><i class="fa-solid fa-comment" /> Comentario de revisión</label>
                <textarea v-model="reviewComment" class="inp" rows="3" placeholder="Agrega un comentario..." />
              </div>
            </div>

            <footer class="modal-foot">
              <button class="btn ghost" @click="closeDetail">Cerrar</button>
              <div class="modal-foot-right">
                <button class="btn ghost" @click="handleDownload(showDetail._id)" :disabled="downloading">
                  <i class="fa-solid fa-file-pdf" /> PDF
                </button>
                <button class="btn primary" @click="handleApprove" :disabled="reviewing">
                  <i class="fa-solid fa-check" /> {{ reviewing ? 'Aprobando...' : 'Dar OK Final' }}
                </button>
              </div>
            </footer>
          </div>
        </div>
      </Teleport>
    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.page { padding: 0 0 60px; display: flex; flex-direction: column; }

.top-bar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: white; border-bottom: 1px solid rgba($primary-dark, 0.06);
  position: sticky; top: 0; z-index: 10;
}
.top-title { margin: 0; font-size: 1rem; font-weight: 800; color: $primary-dark; }
.back {
  border: none; background: transparent; cursor: pointer; color: $primary;
  font-family: $font-principal; font-weight: 700; font-size: 0.85rem;
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 10px;
  &:hover { background: rgba($primary, 0.08); }
}

.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 16px; border-radius: 12px;
  font-family: $font-principal; font-weight: 700; font-size: 0.88rem;
  border: none; cursor: pointer; transition: transform 0.15s, background 0.2s;
  &:active:not(:disabled) { transform: scale(0.97); }
  &.xs { padding: 8px 12px; font-size: 0.78rem; }
}
.btn.primary { background: linear-gradient(135deg, $primary, #1678b0); color: white; box-shadow: 0 8px 20px rgba($primary, 0.28); }
.btn.ghost { background: rgba($primary-dark, 0.06); color: $primary-dark; &:hover { background: rgba($primary-dark, 0.12); } }

.loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px 0; gap: 12px; color: $text-secondary; }
.loader { width: 36px; height: 36px; border: 3px solid rgba($primary, 0.2); border-top-color: $primary; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.no-admin {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 60px 20px; text-align: center;
  i { font-size: 2rem; color: $text-secondary; }
  strong { font-size: 1.1rem; color: $primary-dark; }
  p { margin: 0; font-size: 0.88rem; color: $text-secondary; }
}

.list-section { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.sec-head { display: flex; align-items: center; gap: 8px;
  h2 { margin: 0; font-size: 0.95rem; font-weight: 800; color: $primary-dark; i { color: $primary; } }
}
.sec-badge { font-size: 0.72rem; font-weight: 800; background: rgba($primary, 0.1); color: $primary; padding: 3px 10px; border-radius: 999px; }

.empty-state { padding: 30px; text-align: center; color: $text-secondary; font-size: 0.88rem; background: white; border-radius: 16px; border: 1px dashed rgba($primary-dark, 0.15);
  i { font-size: 1.5rem; color: $alert-success; display: block; margin-bottom: 8px; }
}

.inst-list { display: flex; flex-direction: column; gap: 10px; }
.inst-card {
  background: white; border: 1px solid rgba($primary-dark, 0.06); border-radius: 14px; padding: 14px;
  display: flex; flex-direction: column; gap: 8px; cursor: pointer;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 6px 16px rgba($primary-dark, 0.08); }
  &.reviewed { opacity: 0.8; }
}
.inst-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.inst-name { font-size: 0.9rem; font-weight: 700; color: $primary-dark; }
.status-badge {
  font-size: 0.68rem; font-weight: 800; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.3px;
  &.green { background: rgba($alert-success, 0.12); color: darken($alert-success, 8%); }
  &.yellow { background: rgba($alert-warning, 0.15); color: darken($alert-warning, 10%); }
  &.red { background: rgba($alert-error, 0.1); color: $alert-error; }
}
.inst-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.78rem; color: $text-secondary; i { color: $primary; margin-right: 4px; } }
.inst-actions { display: flex; gap: 8px; margin-top: 4px; }

.modal-back {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; justify-content: center;
  @media (min-width: 640px) { align-items: center; padding: 24px; }
}
.modal {
  width: 100%; max-width: 560px; max-height: 90dvh; overflow-y: auto;
  background: white; border-radius: 22px 22px 0 0;
  padding: 20px; display: flex; flex-direction: column; gap: 16px;
  @media (min-width: 640px) { border-radius: 22px; }
}
.modal-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
  h3 { margin: 0 0 2px; font-size: 1.05rem; font-weight: 800; color: $primary-dark; }
}
.modal-operator { font-size: 0.82rem; color: $text-secondary; i { color: $primary; margin-right: 4px; } }
.close-btn { width: 36px; height: 36px; border-radius: 12px; border: none; background: rgba($primary-dark, 0.06); color: $primary-dark; cursor: pointer; font-size: 1rem; &:hover { background: rgba($primary-dark, 0.12); } }

.modal-body { display: flex; flex-direction: column; gap: 14px; }
.response-group { display: flex; flex-direction: column; gap: 8px; }
.response-label {
  display: flex; justify-content: space-between; gap: 8px;
  padding: 10px; background: #f8fafc; border-radius: 10px;
  font-size: 0.85rem;
  strong { color: $primary-dark; font-weight: 700; text-transform: capitalize; }
  span { color: $text-secondary; font-weight: 600; }
}

.field { display: flex; flex-direction: column; gap: 4px; }
.lbl { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; color: $text-secondary; i { color: $primary; margin-right: 4px; } }
.inp {
  width: 100%; padding: 12px 14px; border: 2px solid rgba($primary-dark, 0.08); border-radius: 12px;
  font-size: 0.9rem; font-family: $font-principal; background: white; outline: none; box-sizing: border-box; resize: vertical;
  &:focus { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
}

.modal-foot {
  display: flex; align-items: center; gap: 10px; margin-top: 4px;
  .btn { white-space: nowrap; }
}
.modal-foot-right { display: flex; gap: 8px; margin-left: auto; }
</style>
