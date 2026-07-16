<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'
import AppShell from '@/layout/AppShell.vue'
import { maintenanceService } from '@/services/maintenanceService'
import EquipmentForm from '@/components/EquipmentForm.vue'
import PrintButton from '@/components/PrintButton.vue'

interface Ticket {
  _id: string
  equipmentId: string
  title?: string
  description: string
  priority: 'baja' | 'media' | 'alta' | 'critica'
  status: string
  assignedTo?: string
  createdAt: string
  updatedAt?: string
  resolutionNotes?: string
  reportedByName?: string
}

interface EquipmentChecklist {
  _id: string
  items: Array<{ key: string; label: string; checked: boolean; notes?: string }>
  generalNotes?: string
  result: 'completo' | 'requiere_atencion'
  completedBy?: { name?: string }
  createdAt: string
}

const checklistTemplate = [
  { key: 'limpieza', label: 'Limpieza general y superficies', checked: false },
  { key: 'funcionamiento', label: 'Encendido y funcionamiento normal', checked: false },
  { key: 'conexiones', label: 'Conexiones eléctricas o de gas seguras', checked: false },
  { key: 'fugas', label: 'Sin fugas, ruidos ni vibraciones', checked: false },
  { key: 'protecciones', label: 'Guardas y protecciones instaladas', checked: false },
  { key: 'entorno', label: 'Área despejada y ventilada', checked: false },
]

const route = useRoute()
const router = useRouter()
const ui = useUIStore()
const userStore = useUserStore()

const equipment = ref<any>(null)
const tickets = ref<Ticket[]>([])
const loading = ref(true)
const qrCodeUrl = ref('')
const qrPublicUrl = ref('')
const qrLoading = ref(false)
const showReportForm = ref(false)
const reportForm = ref({ description: '', priority: 'media' as Ticket['priority'] })
const reportSending = ref(false)
const showEditForm = ref(false)
const deleting = ref(false)
const selectedTicket = ref<Ticket | null>(null)
const resolutionNotes = ref('')
const hasSession = ref(false)
const checklists = ref<EquipmentChecklist[]>([])
const showChecklistForm = ref(false)
const checklistItems = ref(checklistTemplate.map((item) => ({ ...item })))
const checklistNotes = ref('')
const checklistSending = ref(false)

const equipmentId = computed(() => route.params.id as string)
const isPublicAudit = computed(() => !hasSession.value)
const branches = computed(() => userStore.branches)
const branchDisplay = computed(() => {
  if (!equipment.value) return ''
  return equipment.value.branchName || branches.value.find((branch) => branch.id === equipment.value.branchId)?.name || ''
})

const purchaseDate = computed(() => equipment.value ? new Date(equipment.value.purchaseDate) : null)

const daysSincePurchase = computed(() => {
  if (!purchaseDate.value) return 0
  return Math.max(0, Math.floor((Date.now() - purchaseDate.value.getTime()) / 86400000))
})

const totalDays = computed(() => equipment.value ? equipment.value.usefulLife * 365 : 1)

const depreciationPct = computed(() => Math.min(100, Math.round((daysSincePurchase.value / totalDays.value) * 100)))

const remainingValue = computed(() => equipment.value ? Math.max(0, Math.round(equipment.value.historicalCost * (1 - depreciationPct.value / 100))) : 0)

const annualDepreciation = computed(() => equipment.value ? Math.round(equipment.value.historicalCost / equipment.value.usefulLife) : 0)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatMoney(n: number): string {
  return `$${n.toLocaleString('es-EC')}`
}

function priorityClass(p: string): string {
  if (p === 'critica') return 'red'
  if (p === 'alta') return 'orange'
  if (p === 'media') return 'yellow'
  return 'green'
}

function statusLabel(s: string): string {
  const map: Record<string, string> = { abierto: 'Abierto', en_progreso: 'En progreso', resuelto: 'Resuelto', cerrado: 'Cerrado', operativo: 'Operativo', averiado: 'Averiado', mantenimiento: 'En mantenimiento', fuera_servicio: 'Fuera de servicio' }
  return map[s] || s
}

function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
}

function actorName(ticket: Ticket): string {
  return ticket.reportedByName || 'Equipo Allio'
}

async function requireAccess() {
  const ok = await ui.requestConfirm({
    title: 'Acceso requerido',
    message: 'Puedes ver la auditoría del equipo sin login. Para registrar movimientos, fallas o cierres necesitas iniciar sesión o pedir a un administrador que te registre.',
    confirmLabel: 'Iniciar sesión',
    cancelLabel: 'Solo ver historial',
    icon: 'fa-solid fa-lock',
  })
  if (ok) router.push({ name: 'Login', query: { next: route.fullPath } })
}

async function generateQR() {
  if (!equipment.value) return
  qrLoading.value = true
  try {
    const res = await maintenanceService.generateQR(equipment.value._id)
    qrCodeUrl.value = (res.data as any).qrCode || ''
    qrPublicUrl.value = (res.data as any).url || `${window.location.origin}/modulo/mantenimiento/${equipment.value._id}`
    equipment.value.qrCode = qrCodeUrl.value
  } catch {
    ui.showToast({ title: 'Error al generar QR', tone: 'error' })
  } finally {
    qrLoading.value = false
  }
}

async function printSticker() {
  if (!equipment.value) return
  await generateQR()
  if (!equipment.value.qrCode) return
  const d = equipment.value
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head><title>Sticker QR</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial, sans-serif; }
      .sticker { text-align: center; padding: 24px; max-width: 300px; }
      .sticker h2 { font-size: 14px; color: #2F243A; margin-bottom: 12px; }
      .sticker .loc { font-size: 11px; color: #588B8B; margin-bottom: 8px; }
      .sticker img { width: 200px; height: 200px; display: block; margin: 0 auto 8px; }
      .sticker p { font-size: 11px; color: #2F243A; }
      .sticker .url { font-size: 8px; color: #588B8B; overflow-wrap: anywhere; margin-top: 6px; }
      @media print {
        @page { margin: 6mm; size: 57mm 57mm; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
    </head>
    <body>
      <div class="sticker">
        <h2>${d.name}</h2>
        ${d.branchName ? `<p class="loc">${d.branchName}</p>` : ''}
        ${d.location ? `<p class="loc">${d.location}</p>` : ''}
        <img src="${d.qrCode}" alt="QR" />
        <p>Escanea para ver ficha técnica</p>
        ${qrPublicUrl.value ? `<p class="url">${qrPublicUrl.value}</p>` : ''}
      </div>
      <script>window.print();window.close();<\/script>
    </body>
    </html>
  `)
  win.document.close()
}

async function submitReport() {
  if (isPublicAudit.value) {
    await requireAccess()
    return
  }
  if (!equipment.value || !reportForm.value.description.trim()) {
    ui.showToast({ title: 'Describe el problema', tone: 'warning' })
    return
  }
  reportSending.value = true
  try {
    await maintenanceService.createTicket({
      equipmentId: equipment.value._id,
      description: reportForm.value.description.trim(),
      priority: reportForm.value.priority,
    })
    ui.showToast({ title: 'Reporte enviado', tone: 'success', icon: 'fa-solid fa-circle-check' })
    showReportForm.value = false
    reportForm.value = { description: '', priority: 'media' }
    await loadTickets()
  } catch {
    ui.showToast({ title: 'Error al enviar reporte', tone: 'error' })
  } finally {
    reportSending.value = false
  }
}

async function handleSave(data: any) {
  if (!equipment.value) return
  await maintenanceService.updateEquipment(equipment.value._id, data)
  const res = await maintenanceService.getEquipmentDetail(equipmentId.value)
  equipment.value = res.data
  await loadTickets()
  return { mode: 'edit', eq: equipment.value }
}

function handleFormSaved() {
  showEditForm.value = false
  ui.showToast({ title: 'Equipo actualizado', tone: 'success' })
}

async function handleDelete() {
  if (!equipment.value) return
  const ok = await ui.requestConfirm({
    title: 'Confirmar eliminación',
    message: 'Este equipo saldrá del control de mantenimiento. Confirma solo si ya no necesitas su ficha ni su QR activo.',
    confirmLabel: 'Sí, eliminar',
    cancelLabel: 'Conservar equipo',
    tone: 'danger',
    icon: 'fa-solid fa-trash-can',
  })
  if (!ok) return
  deleting.value = true
  try {
    await maintenanceService.deleteEquipment(equipment.value._id)
    ui.showToast({ title: 'Equipo eliminado', tone: 'info' })
    router.push('/modulo/mantenimiento')
  } catch {
    ui.showToast({ title: 'Error al eliminar', tone: 'error' })
  } finally {
    deleting.value = false
  }
}

async function openTicket(t: Ticket) {
  selectedTicket.value = t
  resolutionNotes.value = t.resolutionNotes || ''
}

async function closeTicket() {
  if (isPublicAudit.value) {
    await requireAccess()
    return
  }
  if (!selectedTicket.value) return
  const transitions: Record<string, string> = { abierto: 'en_progreso', en_progreso: 'resuelto', resuelto: 'cerrado' }
  const nextStatus = transitions[selectedTicket.value.status]
  if (!nextStatus) return
  try {
    await maintenanceService.updateTicket(selectedTicket.value._id, { status: nextStatus, resolutionNotes: resolutionNotes.value || 'Sin notas' })
    ui.showToast({ title: nextStatus === 'cerrado' ? 'Ticket cerrado' : 'Estado actualizado', tone: 'success' })
    selectedTicket.value = null
    await loadTickets()
  } catch {
    ui.showToast({ title: 'Error al cerrar ticket', tone: 'error' })
  }
}

function ticketActionLabel(status: string) {
  const labels: Record<string, string> = { abierto: 'Iniciar mantenimiento', en_progreso: 'Marcar como resuelto', resuelto: 'Cerrar ticket' }
  return labels[status] || ''
}

async function loadChecklists() {
  if (isPublicAudit.value) return
  try {
    const res = await maintenanceService.listChecklists(equipmentId.value)
    checklists.value = res.data as EquipmentChecklist[]
  } catch {
    checklists.value = []
  }
}

async function submitChecklist() {
  checklistSending.value = true
  try {
    await maintenanceService.createChecklist(equipmentId.value, {
      items: checklistItems.value,
      generalNotes: checklistNotes.value.trim(),
    })
    ui.showToast({ title: 'Checklist guardado', tone: 'success', icon: 'fa-solid fa-clipboard-check' })
    checklistItems.value = checklistTemplate.map((item) => ({ ...item }))
    checklistNotes.value = ''
    showChecklistForm.value = false
    await loadChecklists()
  } catch {
    ui.showToast({ title: 'No se pudo guardar el checklist', tone: 'error' })
  } finally {
    checklistSending.value = false
  }
}

async function loadTickets() {
  if (isPublicAudit.value) return
  try {
    const res = await maintenanceService.listTickets(equipmentId.value)
    tickets.value = res.data as Ticket[]
  } catch {
    tickets.value = []
  }
}

onMounted(async () => {
  hasSession.value = !!localStorage.getItem('access_token')
  try {
    if (hasSession.value) {
      if (!userStore.branches.length) await userStore.fetchWorkspace()
      const res = await maintenanceService.getEquipmentDetail(equipmentId.value)
      equipment.value = res.data
      await generateQR()
      await loadTickets()
      await loadChecklists()
    } else {
      const res = await maintenanceService.getPublicEquipmentAudit(equipmentId.value)
      const audit = res.data as any
      equipment.value = audit.equipment
      tickets.value = audit.history || []
    }
  } catch {
    // API unavailable
  }
  loading.value = false
})
</script>

<template>
  <AppShell>
    <div class="page">
      <header class="top-bar">
        <button class="back" @click="isPublicAudit ? router.push('/') : router.push('/modulo/mantenimiento')">
          <i class="fa-solid fa-arrow-left" /> {{ isPublicAudit ? 'Allio' : 'Volver' }}
        </button>
        <div class="top-actions" v-if="equipment && !isPublicAudit">
          <PrintButton title="Ficha de equipo" />
          <button v-if="userStore.canManageEquipment" class="btn icon ghost" @click="showEditForm = true" title="Editar equipo">
            <i class="fa-solid fa-pen-to-square" />
          </button>
          <button v-if="userStore.canDeleteEquipment" class="btn icon danger-ghost" @click="handleDelete" :disabled="deleting" title="Eliminar">
            <i class="fa-solid fa-trash-can" />
          </button>
        </div>
      </header>

      <div v-if="loading" class="loading-state">
        <div class="loader" />
        <p>Cargando ficha del equipo...</p>
      </div>

      <template v-else-if="equipment">
        <section class="hero-card">
          <div class="hero-top">
            <div class="hero-icon" v-if="!equipment.imageUrl">
              <i class="fa-solid fa-screwdriver-wrench" />
            </div>
            <img v-else :src="equipment.imageUrl" class="hero-img" />
            <div class="hero-text">
              <h1 class="hero-title">{{ equipment.name }}</h1>
              <p v-if="equipment.brand" class="hero-brand">{{ equipment.brand }}</p>
              <div class="hero-tags">
                <span v-if="isPublicAudit" class="audit-badge"><i class="fa-solid fa-eye" /> Auditoría pública</span>
                <span :class="['status-badge', equipment.status]">{{ statusLabel(equipment.status) }}</span>
                <span v-if="branchDisplay" class="branch-badge"><i class="fa-solid fa-store" /> {{ branchDisplay }}</span>
                <span v-if="equipment.location" class="location-badge"><i class="fa-solid fa-location-dot" /> {{ equipment.location }}</span>
              </div>
            </div>
          </div>
          <p v-if="equipment.notes" class="hero-notes">{{ equipment.notes }}</p>
        </section>

        <section class="info-grid">
          <div class="info-card">
            <span class="info-label">Compra aprox.</span>
            <strong class="info-value">{{ formatMonth(equipment.purchaseDate) }}</strong>
          </div>
          <div class="info-card">
            <span class="info-label">Costo</span>
            <strong class="info-value">{{ formatMoney(equipment.historicalCost) }}</strong>
          </div>
          <div class="info-card">
            <span class="info-label">Vida útil</span>
            <strong class="info-value">{{ equipment.usefulLife }} años</strong>
          </div>
          <div class="info-card">
            <span class="info-label">Dep. anual</span>
            <strong class="info-value">{{ formatMoney(annualDepreciation) }}</strong>
          </div>
          <div class="info-card" v-if="equipment.location">
            <span class="info-label">Ubicación</span>
            <strong class="info-value" style="font-size: .85rem">{{ equipment.location }}</strong>
          </div>
          <div class="info-card" v-if="branchDisplay">
            <span class="info-label">Sucursal</span>
            <strong class="info-value" style="font-size: .85rem">{{ branchDisplay }}</strong>
          </div>
          <div class="info-card" v-if="equipment.createdAt">
            <span class="info-label">Registrado</span>
            <strong class="info-value" style="font-size: .85rem">{{ formatDate(equipment.createdAt) }}</strong>
          </div>
        </section>

        <section v-if="isPublicAudit" class="public-audit-card">
          <span class="public-icon"><i class="fa-solid fa-shield-halved" /></span>
          <div>
            <strong>Historial visible por QR</strong>
            <p>Esta ficha es de solo lectura. Para registrar movimientos, fallas o mantenimientos, inicia sesión o solicita a un administrador que te registre.</p>
          </div>
          <button class="btn primary sm" @click="requireAccess"><i class="fa-solid fa-right-to-bracket" /> Registrar movimiento</button>
        </section>

        <section class="depr-section">
          <div class="depr-head">
            <h3><i class="fa-solid fa-chart-line" /> Depreciación lineal</h3>
            <strong class="depr-pct">{{ depreciationPct }}%</strong>
          </div>
          <div class="depr-bar">
            <span class="depr-fill" :style="{ width: depreciationPct + '%' }" />
          </div>
          <div class="depr-meta">
            <span>Original: {{ formatMoney(equipment.historicalCost) }}</span>
            <span>Actual: <strong>{{ formatMoney(remainingValue) }}</strong></span>
          </div>
        </section>

        <section class="qr-section">
          <div class="qr-display" v-if="equipment.qrCode && !isPublicAudit">
            <img :src="equipment.qrCode" alt="QR del equipo" class="qr-img" />
            <span class="qr-hint">Escanea para ver la ficha técnica</span>
            <a v-if="qrPublicUrl" class="qr-link" :href="qrPublicUrl" target="_blank" rel="noopener">{{ qrPublicUrl }}</a>
            <button class="btn ghost sm" @click="printSticker">
              <i class="fa-solid fa-tag" /> Imprimir sticker
            </button>
          </div>
          <button v-else-if="!isPublicAudit" class="btn primary" @click="generateQR" :disabled="qrLoading">
            <i class="fa-solid fa-qrcode" /> {{ qrLoading ? 'Generando...' : 'Generar QR' }}
          </button>
        </section>

        <section v-if="!isPublicAudit" class="checklist-section">
          <header class="sec-head">
            <div>
              <span class="section-kicker">Control operativo</span>
              <h3><i class="fa-solid fa-clipboard-check" /> Checklist del equipo</h3>
            </div>
            <button class="btn primary sm" @click="showChecklistForm = !showChecklistForm">
              <i class="fa-solid fa-list-check" /> {{ showChecklistForm ? 'Ocultar' : 'Llenar checklist' }}
            </button>
          </header>

          <Transition name="fade">
            <form v-if="showChecklistForm" class="checklist-form" @submit.prevent="submitChecklist">
              <p>Marca cada punto que se encuentre correcto. Los puntos pendientes quedarán visibles como atención requerida.</p>
              <label v-for="item in checklistItems" :key="item.key" class="check-row">
                <input v-model="item.checked" type="checkbox" />
                <span class="check-box"><i class="fa-solid fa-check" /></span>
                <strong>{{ item.label }}</strong>
              </label>
              <label class="field">
                <span class="lbl">Observaciones</span>
                <textarea v-model="checklistNotes" class="inp" rows="3" placeholder="Novedades, acciones pendientes o recomendaciones..." />
              </label>
              <div class="report-actions">
                <button type="button" class="btn ghost sm" @click="showChecklistForm = false">Cancelar</button>
                <button type="submit" class="btn primary sm" :disabled="checklistSending">
                  <i class="fa-solid fa-floppy-disk" /> {{ checklistSending ? 'Guardando...' : 'Guardar checklist' }}
                </button>
              </div>
            </form>
          </Transition>

          <div v-if="checklists.length" class="checklist-history">
            <article v-for="checklist in checklists.slice(0, 5)" :key="checklist._id" class="checklist-record">
              <span :class="['check-result', checklist.result]">
                <i :class="checklist.result === 'completo' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'" />
                {{ checklist.result === 'completo' ? 'Completo' : 'Requiere atención' }}
              </span>
              <strong>{{ checklist.items.filter((item) => item.checked).length }}/{{ checklist.items.length }} puntos correctos</strong>
              <span>{{ formatDate(checklist.createdAt) }} · {{ checklist.completedBy?.name || 'Supervisor' }}</span>
              <p v-if="checklist.generalNotes">{{ checklist.generalNotes }}</p>
            </article>
          </div>
          <div v-else-if="!showChecklistForm" class="checklist-empty">
            <i class="fa-solid fa-clipboard" />
            <span>Aún no hay controles. Completa el primer checklist de este equipo.</span>
          </div>
        </section>

        <section class="tickets-section">
          <header class="sec-head">
            <h3><i class="fa-solid fa-clock-rotate-left" /> Historial ({{ tickets.length }})</h3>
            <button v-if="!isPublicAudit" class="btn ghost sm" @click="showReportForm = !showReportForm">
              <i class="fa-solid fa-plus" /> Reportar
            </button>
            <button v-else class="btn ghost sm" @click="requireAccess">
              <i class="fa-solid fa-lock" /> Registrar movimiento
            </button>
          </header>

          <Transition name="fade">
            <div v-if="showReportForm" class="report-card">
              <h4><i class="fa-solid fa-bug" /> Reportar falla</h4>
              <div class="field">
                <label class="lbl">Descripción</label>
                <textarea v-model="reportForm.description" class="inp" rows="3" placeholder="Describe el problema..." />
              </div>
              <div class="field">
                <label class="lbl">Prioridad</label>
                <div class="priority-grid">
                  <button v-for="p in (['baja', 'media', 'alta', 'critica'] as const)" :key="p"
                    :class="['priority-chip', p, { active: reportForm.priority === p }]"
                    @click="reportForm.priority = p"
                  >{{ p.charAt(0).toUpperCase() + p.slice(1) }}</button>
                </div>
              </div>
              <div class="report-actions">
                <button class="btn ghost sm" @click="showReportForm = false">Cancelar</button>
                <button class="btn primary sm" @click="submitReport" :disabled="reportSending">
                  <i class="fa-solid fa-paper-plane" /> {{ reportSending ? 'Enviando...' : 'Enviar' }}
                </button>
              </div>
            </div>
          </Transition>

          <div v-if="!tickets.length" class="empty-state">
            <i class="fa-solid fa-circle-check empty-icon" />
              <p>Sin movimientos registrados</p>
          </div>

          <div v-else class="ticket-list">
            <article v-for="t in tickets" :key="t._id" class="ticket-card" @click="openTicket(t)">
              <div class="ticket-top">
                <span :class="['priority-badge', priorityClass(t.priority)]">{{ t.priority }}</span>
                <span :class="['ticket-status', t.status]">{{ statusLabel(t.status) }}</span>
              </div>
              <p class="ticket-desc">{{ t.title || t.description }}</p>
              <div class="ticket-meta">
                <span><i class="fa-solid fa-calendar" /> {{ formatDate(t.createdAt) }}</span>
                <span><i class="fa-solid fa-user" /> {{ actorName(t) }}</span>
              </div>
            </article>
          </div>
        </section>
      </template>
    </div>

    <EquipmentForm v-if="showEditForm && equipment" :equipment="equipment" :branches="branches" :save-action="handleSave" @close="showEditForm = false" @saved="handleFormSaved" />

    <Teleport to="body">
      <div v-if="selectedTicket" class="modal-back" @click.self="selectedTicket = null">
        <div class="modal ticket-modal">
          <header class="modal-head">
            <h3 class="modal-title"><i class="fa-solid fa-ticket" /> Detalle del ticket</h3>
            <button class="close-btn" @click="selectedTicket = null"><i class="fa-solid fa-xmark" /></button>
          </header>
          <div class="ticket-detail">
            <div class="td-row">
              <span class="lbl">Prioridad</span>
              <span :class="['priority-badge', priorityClass(selectedTicket.priority)]">{{ selectedTicket.priority }}</span>
            </div>
            <div class="td-row">
              <span class="lbl">Estado</span>
              <span class="ticket-status">{{ statusLabel(selectedTicket.status) }}</span>
            </div>
            <div class="td-row">
              <span class="lbl">Creado</span>
              <span>{{ formatDate(selectedTicket.createdAt) }}</span>
            </div>
            <div class="td-row">
              <span class="lbl">Registrado por</span>
              <span>{{ actorName(selectedTicket) }}</span>
            </div>
            <div class="td-desc">
              <span class="lbl">Descripción</span>
              <p>{{ selectedTicket.description }}</p>
            </div>
            <div class="td-desc" v-if="selectedTicket.resolutionNotes">
              <span class="lbl">Resolución</span>
              <p class="res-text">{{ selectedTicket.resolutionNotes }}</p>
            </div>
            <div class="td-desc" v-if="!isPublicAudit && selectedTicket.status !== 'cerrado'">
              <label class="lbl">Notas del mantenimiento</label>
              <textarea v-model="resolutionNotes" class="inp" rows="2" placeholder="Describe cómo se resolvió..." />
            </div>
            <button v-if="!isPublicAudit && selectedTicket.status !== 'cerrado'" class="btn primary" @click="closeTicket">
              <i class="fa-solid fa-check" /> {{ ticketActionLabel(selectedTicket.status) }}
            </button>
            <button v-else-if="isPublicAudit" class="btn primary" @click="requireAccess">
              <i class="fa-solid fa-lock" /> Iniciar sesión para registrar cambios
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppShell>
</template>

<style scoped lang="scss">
.page { flex: 1; min-height: 0; padding: 0 0 60px; display: flex; flex-direction: column; gap: 12px; }

.top-bar {
  padding: 10px 12px; background: white; border-bottom: 1px solid rgba($primary-dark, 0.06);
  position: sticky; top: 0; z-index: 10;
  display: flex; justify-content: space-between; align-items: center;
  min-height: 52px;
  @media (min-width: $bp-mobile) { padding: 12px 16px; }
}
.top-actions { display: flex; gap: 8px; }
.back {
  border: none; background: transparent; cursor: pointer; color: $primary;
  font-family: $font-principal; font-weight: 700; font-size: 0.88rem;
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 10px; min-height: 40px;
  &:hover { background: rgba($primary, 0.08); }
}

.loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px 0; gap: 12px; color: $text-secondary; }
.loader { width: 36px; height: 36px; border: 3px solid rgba($primary, 0.2); border-top-color: $primary; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.hero-card { padding: 14px; display: flex; flex-direction: column; gap: 12px; background: white; margin: 12px; border-radius: 18px; border: 1px solid rgba($primary-dark, 0.06);
  @media (min-width: $bp-mobile) { padding: 16px; margin: 16px; }
}
.hero-top { display: flex; gap: 14px; align-items: center; }
.hero-icon { width: 48px; height: 48px; border-radius: 14px; background: rgba($primary, 0.1); color: $primary; display: inline-flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;
  @media (min-width: $bp-mobile) { width: 52px; height: 52px; font-size: 1.3rem; }
}
.hero-img { width: 48px; height: 48px; border-radius: 12px; object-fit: cover; flex-shrink: 0; border: 1px solid rgba($primary-dark, 0.08);
  @media (min-width: $bp-mobile) { width: 52px; height: 52px; }
}
.hero-title { margin: 0; font-size: 1.1rem; font-weight: 800; color: $primary-dark;
  @media (min-width: $bp-mobile) { font-size: 1.2rem; }
}
.hero-brand { margin: 2px 0 0; font-size: 0.85rem; color: $text-secondary; }
.hero-notes { margin: 0; font-size: 0.82rem; color: $primary-dark; line-height: 1.5; padding: 10px; background: rgba($bg, 0.7); border-radius: 10px; }

.hero-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
.status-badge {
  display: inline-block; font-size: 0.68rem; font-weight: 800; padding: 4px 12px; border-radius: 999px; text-transform: uppercase;
  &.operativo { background: rgba($alert-success, 0.12); color: darken($alert-success, 10%); }
  &.averiado { background: rgba($alert-error, 0.12); color: $alert-error; }
  &.mantenimiento { background: rgba($alert-warning, 0.15); color: darken($alert-warning, 15%); }
  &.fuera_servicio { background: rgba($primary-dark, 0.12); color: $primary-dark; }
}
.location-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.7rem; font-weight: 700; padding: 4px 10px; border-radius: 999px;
  background: rgba($primary, 0.08); color: $primary-dark;
  i { font-size: 0.65rem; color: $primary; }
}
.branch-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 999px;
  background: rgba($accent, 0.16); color: $primary-dark;
  i { font-size: 0.65rem; color: $primary; }
}
.audit-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.7rem; font-weight: 850; padding: 4px 10px; border-radius: 999px;
  background: rgba($primary-dark, 0.08); color: $primary-dark;
  i { font-size: 0.65rem; color: $primary; }
}

.public-audit-card {
  margin: 0 12px; padding: 14px; border-radius: 18px;
  display: grid; grid-template-columns: 44px 1fr; gap: 12px; align-items: center;
  background: linear-gradient(135deg, rgba($primary, 0.1), rgba(white, 0.92));
  border: 1px solid rgba($primary, 0.16);
  box-shadow: 0 14px 32px rgba($primary-dark, 0.055);
  @media (min-width: $bp-mobile) { margin: 0 16px; grid-template-columns: 48px 1fr auto; padding: 16px; }
  strong { color: $primary-dark; font-size: 0.92rem; }
  p { margin: 3px 0 0; color: $text-secondary; font-size: 0.82rem; line-height: 1.45; }
  .btn { grid-column: 1 / -1; justify-content: center; @media (min-width: $bp-mobile) { grid-column: auto; } }
}
.public-icon { width: 44px; height: 44px; border-radius: 15px; display: grid; place-items: center; color: white; background: linear-gradient(135deg, $primary-dark, $primary); box-shadow: 0 12px 24px rgba($primary, 0.2); }

.info-grid { padding: 0 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  @media (min-width: $bp-mobile) { padding: 0 16px; gap: 10px; }
}
.info-card { background: white; border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 4px; border: 1px solid rgba($primary-dark, 0.05);
  @media (min-width: $bp-mobile) { padding: 14px; }
}
.info-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 700; color: $text-secondary; }
.info-value { font-size: 0.95rem; font-weight: 800; color: $primary-dark;
  @media (min-width: $bp-mobile) { font-size: 1rem; }
}

.depr-section { margin: 12px; background: white; border-radius: 16px; padding: 14px; border: 1px solid rgba($primary-dark, 0.05); display: flex; flex-direction: column; gap: 10px;
  @media (min-width: $bp-mobile) { margin: 16px; padding: 16px; }
}
.depr-head { display: flex; justify-content: space-between; align-items: center;
  h3 { margin: 0; font-size: 0.9rem; font-weight: 800; color: $primary-dark; i { color: $primary; } }
}
.depr-pct { font-size: 1rem; font-weight: 800; color: $primary; }
.depr-bar { height: 10px; background: rgba($primary-dark, 0.08); border-radius: 999px; overflow: hidden; }
.depr-fill { display: block; height: 100%; background: linear-gradient(90deg, $primary, $secondary); border-radius: 999px; transition: width 0.5s ease; }
.depr-meta { display: flex; justify-content: space-between; font-size: 0.82rem; color: $text-secondary; strong { color: $primary-dark; font-weight: 800; } }

.qr-section { padding: 0 16px; display: flex; flex-direction: column; gap: 12px; align-items: center; }
.qr-display { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.qr-img { width: 160px; height: 160px; border-radius: 16px; border: 2px solid rgba($primary-dark, 0.08); padding: 8px; background: white;
  @media (min-width: $bp-mobile) { width: 180px; height: 180px; }
}
.qr-hint { font-size: 0.78rem; color: $text-secondary; }
.qr-link { max-width: min(100%, 360px); padding: 8px 10px; border-radius: 12px; background: rgba($primary-dark, 0.05); color: $primary; font-size: 0.72rem; font-weight: 800; overflow-wrap: anywhere; text-align: center; text-decoration: none; &:hover { background: rgba($primary, 0.1); } }

.checklist-section { margin: 0 12px; padding: 16px; border-radius: 22px; background: linear-gradient(145deg, white, rgba($bg, 0.78)); border: 1px solid rgba($primary, 0.2); display: flex; flex-direction: column; gap: 14px; box-shadow: 0 18px 42px rgba($primary-dark, 0.07); @media (min-width: $bp-mobile) { margin: 0 16px; padding: 20px; } }
.section-kicker { display: block; margin-bottom: 3px; color: $primary; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; }
.checklist-form { padding: 16px; border-radius: 18px; background: white; border: 1px solid rgba($accent, 0.36); display: flex; flex-direction: column; gap: 10px; p { margin: 0 0 4px; color: $primary-dark; font-size: 0.82rem; line-height: 1.5; } }
.check-row { position: relative; min-height: 48px; padding: 10px 12px; border-radius: 14px; background: rgba($primary, 0.07); display: flex; align-items: center; gap: 11px; cursor: pointer; color: $primary-dark; input { position: absolute; opacity: 0; pointer-events: none; } strong { font-size: 0.84rem; line-height: 1.35; } }
.check-box { width: 26px; height: 26px; border-radius: 8px; border: 2px solid rgba($primary, 0.45); display: grid; place-items: center; color: transparent; flex-shrink: 0; background: white; transition: all 0.16s; }
.check-row:has(input:checked) { background: rgba($accent, 0.16); .check-box { border-color: $accent; background: $accent; color: $primary-dark; } }
.checklist-history { display: flex; flex-direction: column; gap: 8px; }
.checklist-record { padding: 13px; border-radius: 16px; background: white; border: 1px solid rgba($primary-dark, 0.07); display: flex; align-items: center; gap: 10px; flex-wrap: wrap; strong { color: $primary-dark; font-size: 0.82rem; } > span:not(.check-result) { color: $primary; font-size: 0.76rem; font-weight: 700; margin-left: auto; } p { flex-basis: 100%; margin: 0; padding-top: 7px; border-top: 1px solid rgba($primary, 0.1); color: $primary-dark; font-size: 0.8rem; } }
.check-result { display: inline-flex; align-items: center; gap: 6px; padding: 6px 9px; border-radius: 999px; font-size: 0.69rem; font-weight: 900; text-transform: uppercase; &.completo { background: rgba($alert-success, 0.13); color: darken($alert-success, 13%); } &.requiere_atencion { background: rgba($alert-warning, 0.16); color: darken($alert-warning, 18%); } }
.checklist-empty { min-height: 92px; padding: 16px; border-radius: 16px; background: rgba($primary, 0.07); display: flex; align-items: center; justify-content: center; gap: 10px; color: $primary-dark; font-size: 0.84rem; text-align: center; i { color: $primary; font-size: 1.4rem; } }

.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 18px; border-radius: 12px;
  font-family: $font-principal; font-weight: 700; font-size: 0.9rem;
  border: none; cursor: pointer; transition: transform 0.15s, background 0.2s; min-height: 48px;
  &:active:not(:disabled) { transform: scale(0.97); }
  &.sm { padding: 10px 14px; font-size: 0.82rem; min-height: 40px; }
  &.icon { width: 40px; height: 40px; padding: 0; justify-content: center; font-size: 0.95rem; min-height: 40px; }
  @media (min-width: $bp-mobile) { padding: 12px 16px; font-size: 0.88rem; &.sm { padding: 8px 12px; } &.icon { width: 36px; height: 36px; } }
}
.btn.primary { background: linear-gradient(135deg, $primary, $secondary); color: white; box-shadow: 0 8px 20px rgba($primary, 0.28); &:hover:not(:disabled) { box-shadow: 0 10px 24px rgba($primary, 0.35); } }
.btn.ghost { background: rgba($primary-dark, 0.06); color: $primary-dark; &:hover { background: rgba($primary-dark, 0.12); } }
.btn.danger-ghost { background: rgba($alert-error, 0.08); color: $alert-error; &:hover { background: rgba($alert-error, 0.15); } }

.tickets-section { padding: 0 12px; display: flex; flex-direction: column; gap: 12px;
  @media (min-width: $bp-mobile) { padding: 0 16px; }
}
.sec-head { display: flex; align-items: center; justify-content: space-between; gap: 8px;
  h3 { margin: 0; font-size: 0.95rem; font-weight: 800; color: $primary-dark; i { color: $primary; } }
}

.report-card { background: white; border: 1px solid rgba($primary, 0.2); border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 12px;
  @media (min-width: $bp-mobile) { padding: 16px; }
  h4 { margin: 0; font-size: 0.95rem; font-weight: 800; color: $primary-dark; i { color: $primary; } }
}
.report-actions { display: flex; gap: 8px; justify-content: flex-end; }

.field { display: flex; flex-direction: column; gap: 4px; }
.lbl { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; color: $text-secondary; }
.inp {
  width: 100%; padding: 14px; border: 2px solid rgba($primary-dark, 0.08); border-radius: 12px;
  font-size: 0.95rem; font-family: $font-principal; background: white; outline: none; box-sizing: border-box; resize: vertical;
  &:focus { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
  @media (min-width: $bp-mobile) { padding: 12px 14px; font-size: 0.9rem; }
}

.priority-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
  @media (min-width: $bp-mobile) { grid-template-columns: repeat(4, 1fr); }
}
.priority-chip {
  padding: 12px; border-radius: 10px; border: 2px solid rgba($primary-dark, 0.08);
  background: white; font-family: $font-principal; font-weight: 700; font-size: 0.78rem; cursor: pointer; text-align: center; color: $primary-dark; min-height: 44px;
  &.active { border-color: $primary; background: rgba($primary, 0.06); }
  @media (min-width: $bp-mobile) { padding: 8px; font-size: 0.72rem; min-height: auto; }
}

.empty-state { padding: 30px 16px; text-align: center; color: $text-secondary; font-size: 0.88rem; background: white; border-radius: 14px; border: 1px dashed rgba($primary-dark, 0.15);
  p { margin: 8px 0 0; } .empty-icon { font-size: 2rem; color: $alert-success; opacity: 0.4; }
}

.ticket-list { display: flex; flex-direction: column; gap: 10px; }
.ticket-card { background: white; border: 1px solid rgba($primary-dark, 0.06); border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 8px; cursor: pointer; transition: all 0.15s; min-height: 60px;
  &:active { background: rgba($primary, 0.03); }
  @media (min-width: $bp-mobile) { &:hover { border-color: $primary; box-shadow: 0 2px 12px rgba($primary, 0.08); } }
}
.ticket-top { display: flex; align-items: center; gap: 8px; }
.priority-badge {
  font-size: 0.68rem; font-weight: 800; padding: 4px 12px; border-radius: 999px; text-transform: uppercase;
  &.red { background: rgba($alert-error, 0.12); color: $alert-error; }
  &.orange { background: rgba(#f97316, 0.15); color: #c2410c; }
  &.yellow { background: rgba($alert-warning, 0.15); color: darken($alert-warning, 10%); }
  &.green { background: rgba($alert-success, 0.12); color: darken($alert-success, 8%); }
}
.ticket-status {
  font-size: 0.75rem; font-weight: 700; color: $text-secondary;
  &.abierto { color: $primary; }
  &.en_progreso { color: #c2410c; }
  &.resuelto { color: darken($alert-success, 8%); }
  &.cerrado { color: $text-secondary; }
}
.ticket-desc { margin: 0; font-size: 0.88rem; font-weight: 600; color: $primary-dark; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ticket-meta { font-size: 0.75rem; color: $text-secondary; display: flex; gap: 12px; i { color: $primary; margin-right: 4px; } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-8px); }

.modal-back {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; justify-content: center;
  padding: 16px;
  @media (min-width: $bp-mobile) { align-items: center; padding: 24px; }
}
.modal {
  width: 100%; max-width: 460px;
  background: white; border-radius: 22px 22px 0 0;
  padding: 20px; display: flex; flex-direction: column; gap: 20px;
  box-shadow: 0 -8px 30px rgba(0,0,0,0.15); max-height: 85vh; overflow-y: auto;
  @media (min-width: $bp-mobile) { border-radius: 22px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
}
.modal-head { display: flex; justify-content: space-between; align-items: center; }
.modal-title { margin: 0; font-size: 1.1rem; font-weight: 800; color: $primary-dark; display: flex; align-items: center; gap: 8px; i { color: $primary; }
  @media (min-width: $bp-mobile) { font-size: 1.2rem; }
}
.close-btn { width: 36px; height: 36px; border-radius: 10px; border: none; background: rgba($primary-dark, 0.05); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
  @media (min-width: $bp-mobile) { width: 32px; height: 32px; font-size: 1rem; }
  &:hover { background: rgba($primary-dark, 0.1); }
}

.ticket-detail { display: flex; flex-direction: column; gap: 14px; }
.td-row { display: flex; justify-content: space-between; align-items: center; }
.td-desc {
  display: flex; flex-direction: column; gap: 4px;
  p { margin: 0; font-size: 0.9rem; color: $primary-dark; line-height: 1.5; }
}
.res-text { padding: 8px; background: #f0fdf4; border-radius: 8px; }
</style>
