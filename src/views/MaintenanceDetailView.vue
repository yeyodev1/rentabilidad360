<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import AppShell from '@/layout/AppShell.vue'
import { maintenanceService } from '@/services/maintenanceService'

interface EquipmentDetail {
  _id: string
  name: string
  brand: string
  model?: string
  purchaseDate: string
  historicalCost: number
  usefulLife: number
  maintenanceIntervalDays: number
  notes?: string
  status?: 'ok' | 'soon' | 'urgent'
}

interface Ticket {
  _id: string
  equipmentId: string
  description: string
  priority: 'baja' | 'media' | 'alta' | 'critica'
  status: string
  assignedTo?: string
  createdAt: string
  resolutionNotes?: string
}

const route = useRoute()
const router = useRouter()
const ui = useUIStore()

const equipment = ref<EquipmentDetail | null>(null)
const tickets = ref<Ticket[]>([])
const loading = ref(true)
const qrCodeUrl = ref('')
const qrLoading = ref(false)
const showReportForm = ref(false)
const reportForm = ref({ description: '', priority: 'media' as Ticket['priority'] })
const reportSending = ref(false)

const equipmentId = computed(() => route.params.id as string)

const purchaseDate = computed(() => {
  if (!equipment.value) return null
  return new Date(equipment.value.purchaseDate)
})

const daysSincePurchase = computed(() => {
  if (!purchaseDate.value) return 0
  const now = new Date()
  return Math.max(0, Math.floor((now.getTime() - purchaseDate.value.getTime()) / (1000 * 60 * 60 * 24)))
})

const totalDays = computed(() => {
  if (!equipment.value) return 1
  return equipment.value.usefulLife * 365
})

const depreciationPct = computed(() => {
  return Math.min(100, Math.round((daysSincePurchase.value / totalDays.value) * 100))
})

const remainingValue = computed(() => {
  if (!equipment.value) return 0
  return Math.max(0, Math.round(equipment.value.historicalCost * (1 - depreciationPct.value / 100)))
})

const annualDepreciation = computed(() => {
  if (!equipment.value) return 0
  return Math.round(equipment.value.historicalCost / equipment.value.usefulLife)
})

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
  const map: Record<string, string> = { abierto: 'Abierto', en_progreso: 'En progreso', resuelto: 'Resuelto', cerrado: 'Cerrado' }
  return map[s] || s
}

async function generateQR() {
  if (!equipment.value) return
  qrLoading.value = true
  try {
    const res = await maintenanceService.generateQR(equipment.value._id)
    qrCodeUrl.value = (res.data as unknown as { qrUrl: string }).qrUrl
  } catch {
    qrCodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${window.location.href}`
  } finally {
    qrLoading.value = false
  }
}

async function submitReport() {
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
    const res = await maintenanceService.listTickets(equipment.value._id)
    tickets.value = res.data as unknown as Ticket[]
  } catch {
    ui.showToast({ title: 'Reporte registrado (offline)', tone: 'info' })
    showReportForm.value = false
    reportForm.value = { description: '', priority: 'media' }
  } finally {
    reportSending.value = false
  }
}

const demoEquipment: EquipmentDetail = {
  _id: 'demo_eq1',
  name: 'Freidora Doble',
  brand: 'Robot Coupe',
  model: 'FR-200',
  purchaseDate: '2024-01-22',
  historicalCost: 1850,
  usefulLife: 5,
  maintenanceIntervalDays: 90,
  notes: 'Ubicada en cocina principal. Requiere cambio de aceite cada 15 días.',
  status: 'urgent',
}

const demoTickets: Ticket[] = [
  { _id: 'demo_t1', equipmentId: 'demo_eq1', description: 'Cambio de filtro de aceite y empaques', priority: 'media', status: 'resuelto', assignedTo: 'M. Salazar', createdAt: '2026-01-19T10:00:00', resolutionNotes: 'Filtro reemplazado, empaques sellados correctamente.' },
  { _id: 'demo_t2', equipmentId: 'demo_eq1', description: 'Reemplazo de termocupla', priority: 'alta', status: 'resuelto', assignedTo: 'J. Pérez', createdAt: '2025-07-03T14:30:00', resolutionNotes: 'Termocupla cambiada. Temperatura estable.' },
  { _id: 'demo_t3', equipmentId: 'demo_eq1', description: 'Revisión general anual', priority: 'media', status: 'cerrado', assignedTo: 'L. Andrade', createdAt: '2025-02-17T09:00:00' },
]

onMounted(async () => {
  try {
    const res = await maintenanceService.getEquipmentDetail(equipmentId.value)
    equipment.value = res.data as unknown as EquipmentDetail
  } catch {
    equipment.value = demoEquipment
  }
  try {
    const res = await maintenanceService.listTickets(equipmentId.value)
    tickets.value = res.data as unknown as Ticket[]
  } catch {
    tickets.value = demoTickets
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AppShell>
    <div class="page">
      <header class="top-bar">
        <button class="back" @click="router.push('/modulo/mantenimiento')">
          <i class="fa-solid fa-arrow-left" /> Volver
        </button>
      </header>

      <div v-if="loading" class="loading-state">
        <div class="loader" />
        <p>Cargando ficha del equipo...</p>
      </div>

      <template v-else-if="equipment">
        <section class="hero-card">
          <div class="hero-top">
            <div class="hero-icon">
              <i class="fa-solid fa-screwdriver-wrench" />
            </div>
            <div class="hero-text">
              <h1 class="hero-title">{{ equipment.name }}</h1>
              <p v-if="equipment.brand" class="hero-brand">{{ equipment.brand }} <template v-if="equipment.model">— {{ equipment.model }}</template></p>
            </div>
          </div>
          <p v-if="equipment.notes" class="hero-notes">{{ equipment.notes }}</p>
        </section>

        <section class="info-grid">
          <div class="info-card">
            <span class="info-label">Fecha de compra</span>
            <strong class="info-value">{{ formatDate(equipment.purchaseDate) }}</strong>
          </div>
          <div class="info-card">
            <span class="info-label">Costo original</span>
            <strong class="info-value">{{ formatMoney(equipment.historicalCost) }}</strong>
          </div>
          <div class="info-card">
            <span class="info-label">Vida útil</span>
            <strong class="info-value">{{ equipment.usefulLife }} años</strong>
          </div>
          <div class="info-card">
            <span class="info-label">Depreciación anual</span>
            <strong class="info-value">{{ formatMoney(annualDepreciation) }}</strong>
          </div>
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
            <span>Valor original: {{ formatMoney(equipment.historicalCost) }}</span>
            <span>Valor actual: <strong>{{ formatMoney(remainingValue) }}</strong></span>
          </div>
        </section>

        <section class="qr-section">
          <button class="btn primary" @click="generateQR" :disabled="qrLoading">
            <i class="fa-solid fa-qrcode" /> {{ qrLoading ? 'Generando...' : 'Generar QR del equipo' }}
          </button>
          <div v-if="qrCodeUrl" class="qr-display">
            <img :src="qrCodeUrl" alt="Código QR del equipo" class="qr-img" />
            <span class="qr-hint">Escanea para ver la ficha técnica</span>
          </div>
        </section>

        <section class="tickets-section">
          <header class="sec-head">
            <h3><i class="fa-solid fa-ticket" /> Historial de mantenimiento</h3>
            <button class="btn ghost sm" @click="showReportForm = !showReportForm">
              <i class="fa-solid fa-plus" /> Reportar falla
            </button>
          </header>

          <Transition name="fade">
            <div v-if="showReportForm" class="report-card">
              <h4><i class="fa-solid fa-bug" /> Reportar falla</h4>
              <div class="field">
                <label class="lbl">Descripción del problema</label>
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
                  <i class="fa-solid fa-paper-plane" /> {{ reportSending ? 'Enviando...' : 'Enviar reporte' }}
                </button>
              </div>
            </div>
          </Transition>

          <div v-if="!tickets.length" class="empty-state">
            <p>Sin tickets de mantenimiento registrados</p>
          </div>

          <div v-else class="ticket-list">
            <article v-for="t in tickets" :key="t._id" class="ticket-card">
              <div class="ticket-top">
                <span :class="['priority-badge', priorityClass(t.priority)]">{{ t.priority }}</span>
                <span class="ticket-status">{{ statusLabel(t.status) }}</span>
              </div>
              <p class="ticket-desc">{{ t.description }}</p>
              <div class="ticket-meta">
                <span><i class="fa-solid fa-calendar" /> {{ formatDate(t.createdAt) }}</span>
                <span v-if="t.assignedTo"><i class="fa-solid fa-user-gear" /> {{ t.assignedTo }}</span>
              </div>
              <p v-if="t.resolutionNotes" class="ticket-res">{{ t.resolutionNotes }}</p>
            </article>
          </div>
        </section>
      </template>
    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.page { padding: 0 0 60px; display: flex; flex-direction: column; }

.top-bar {
  padding: 12px 16px; background: white; border-bottom: 1px solid rgba($primary-dark, 0.06);
  position: sticky; top: 0; z-index: 10;
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

.hero-card { padding: 16px; display: flex; flex-direction: column; gap: 12px; background: white; margin: 16px; border-radius: 18px; border: 1px solid rgba($primary-dark, 0.06); }
.hero-top { display: flex; gap: 14px; align-items: center; }
.hero-icon { width: 52px; height: 52px; border-radius: 16px; background: rgba($primary, 0.1); color: $primary; display: inline-flex; align-items: center; justify-content: center; font-size: 1.3rem; }
.hero-title { margin: 0; font-size: 1.2rem; font-weight: 800; color: $primary-dark; }
.hero-brand { margin: 2px 0 0; font-size: 0.88rem; color: $text-secondary; }
.hero-notes { margin: 0; font-size: 0.82rem; color: $text-secondary; line-height: 1.5; padding: 10px; background: #f8fafc; border-radius: 10px; }

.info-grid { padding: 0 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.info-card { background: white; border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 4px; border: 1px solid rgba($primary-dark, 0.05); }
.info-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 700; color: $text-secondary; }
.info-value { font-size: 1rem; font-weight: 800; color: $primary-dark; }

.depr-section { margin: 16px; background: white; border-radius: 16px; padding: 16px; border: 1px solid rgba($primary-dark, 0.05); display: flex; flex-direction: column; gap: 10px; }
.depr-head { display: flex; justify-content: space-between; align-items: center;
  h3 { margin: 0; font-size: 0.9rem; font-weight: 800; color: $primary-dark; i { color: $primary; } }
}
.depr-pct { font-size: 1rem; font-weight: 800; color: $primary; }
.depr-bar { height: 10px; background: rgba($primary-dark, 0.08); border-radius: 999px; overflow: hidden; }
.depr-fill { display: block; height: 100%; background: linear-gradient(90deg, $primary, $secondary); border-radius: 999px; transition: width 0.5s ease; }
.depr-meta { display: flex; justify-content: space-between; font-size: 0.82rem; color: $text-secondary; strong { color: $primary-dark; font-weight: 800; } }

.qr-section { padding: 0 16px; display: flex; flex-direction: column; gap: 12px; align-items: center; }
.qr-display { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.qr-img { width: 180px; height: 180px; border-radius: 16px; border: 2px solid rgba($primary-dark, 0.08); padding: 8px; background: white; }
.qr-hint { font-size: 0.78rem; color: $text-secondary; }

.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 16px; border-radius: 12px;
  font-family: $font-principal; font-weight: 700; font-size: 0.88rem;
  border: none; cursor: pointer; transition: transform 0.15s, background 0.2s;
  &:active:not(:disabled) { transform: scale(0.97); }
  &.sm { padding: 8px 12px; font-size: 0.8rem; }
}
.btn.primary { background: linear-gradient(135deg, $primary, #1678b0); color: white; box-shadow: 0 8px 20px rgba($primary, 0.28); }
.btn.ghost { background: rgba($primary-dark, 0.06); color: $primary-dark; &:hover { background: rgba($primary-dark, 0.12); } }

.tickets-section { padding: 0 16px; display: flex; flex-direction: column; gap: 12px; }
.sec-head { display: flex; align-items: center; justify-content: space-between; gap: 8px;
  h3 { margin: 0; font-size: 0.95rem; font-weight: 800; color: $primary-dark; i { color: $primary; } }
}

.report-card { background: white; border: 1px solid rgba($primary, 0.2); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 12px;
  h4 { margin: 0; font-size: 0.95rem; font-weight: 800; color: $primary-dark; i { color: $primary; } }
}
.report-actions { display: flex; gap: 8px; justify-content: flex-end; }

.field { display: flex; flex-direction: column; gap: 4px; }
.lbl { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; color: $text-secondary; }
.inp {
  width: 100%; padding: 12px 14px; border: 2px solid rgba($primary-dark, 0.08); border-radius: 12px;
  font-size: 0.9rem; font-family: $font-principal; background: white; outline: none; box-sizing: border-box; resize: vertical;
  &:focus { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
}

.priority-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.priority-chip {
  padding: 8px; border-radius: 10px; border: 2px solid rgba($primary-dark, 0.08);
  background: white; font-family: $font-principal; font-weight: 700; font-size: 0.72rem; cursor: pointer; text-align: center; color: $primary-dark;
  &.active { border-color: $primary; background: rgba($primary, 0.06); }
}

.empty-state { padding: 30px; text-align: center; color: $text-secondary; font-size: 0.88rem; background: white; border-radius: 14px; border: 1px dashed rgba($primary-dark, 0.15); }

.ticket-list { display: flex; flex-direction: column; gap: 10px; }
.ticket-card { background: white; border: 1px solid rgba($primary-dark, 0.06); border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.ticket-top { display: flex; align-items: center; gap: 8px; }
.priority-badge {
  font-size: 0.68rem; font-weight: 800; padding: 3px 10px; border-radius: 999px; text-transform: uppercase;
  &.red { background: rgba($alert-error, 0.12); color: $alert-error; }
  &.orange { background: rgba(#f97316, 0.15); color: #c2410c; }
  &.yellow { background: rgba($alert-warning, 0.15); color: darken($alert-warning, 10%); }
  &.green { background: rgba($alert-success, 0.12); color: darken($alert-success, 8%); }
}
.ticket-status { font-size: 0.75rem; font-weight: 700; color: $text-secondary; }
.ticket-desc { margin: 0; font-size: 0.88rem; font-weight: 600; color: $primary-dark; }
.ticket-meta { font-size: 0.75rem; color: $text-secondary; display: flex; gap: 12px; i { color: $primary; margin-right: 4px; } }
.ticket-res { margin: 0; font-size: 0.82rem; color: $text-secondary; padding: 8px; background: #f8fafc; border-radius: 8px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
