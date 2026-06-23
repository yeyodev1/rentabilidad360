<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import AppShell from '@/layout/AppShell.vue'
import EquipmentForm from '@/components/EquipmentForm.vue'
import { maintenanceService } from '@/services/maintenanceService'

const router = useRouter()
const ui = useUIStore()

const equipments = ref<any[]>([])
const allTickets = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const editingEq = ref<any | null>(null)
const deletingId = ref<string | null>(null)
const selectedStatus = ref('')
const stickerData = ref<{ qrUrl: string; name: string } | null>(null)

const equipmentStatusCounts = computed(() => {
  const counts: Record<string, number> = { operativo: 0, averiado: 0, mantenimiento: 0, fuera_servicio: 0 }
  equipments.value.forEach((e: any) => {
    const s = e.status as string
    if (counts[s] !== undefined) counts[s]++
  })
  return counts
})

const totalValue = computed(() => equipments.value.reduce((sum, e) => sum + (e.historicalCost || 0), 0))

const overdueCount = computed(() => {
  return equipments.value.filter(e => {
    if (!e.lastMaintenanceDate) return true
    const daysSince = Math.floor((Date.now() - new Date(e.lastMaintenanceDate).getTime()) / 86400000)
    return daysSince > e.maintenanceIntervalDays
  }).length
})

const ticketsByEquipment = computed(() => {
  const map: Record<string, any[]> = {}
  allTickets.value.forEach((t: any) => {
    const eid = typeof t.equipmentId === 'string' ? t.equipmentId : t.equipmentId?._id || t.equipmentId
    if (!map[eid]) map[eid] = []
    map[eid].push(t)
  })
  return map
})

const openTicketCount = computed(() => {
  return allTickets.value.filter((t: any) => t.status === 'abierto' || t.status === 'en_progreso').length
})

const equipStatus = computed(() => {
  if (overdueCount.value > 3) return 'danger'
  if (overdueCount.value > 0 || openTicketCount.value > 0) return 'warning'
  return 'good'
})

function statusClass(s: string): string {
  if (s === 'operativo') return 'green'
  if (s === 'averiado') return 'red'
  if (s === 'mantenimiento') return 'yellow'
  return 'gray'
}

function statusLabel(s: string): string {
  const m: Record<string, string> = { operativo: 'Operativo', averiado: 'Averiado', mantenimiento: 'En mantenimiento', fuera_servicio: 'Fuera de servicio' }
  return m[s] || s
}

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatMoney(n: number) {
  return `$${n.toLocaleString('es-EC')}`
}

function daysSince(equip: any): number | null {
  if (!equip.lastMaintenanceDate) return null
  return Math.floor((Date.now() - new Date(equip.lastMaintenanceDate).getTime()) / 86400000)
}

function daysUntil(equip: any): number | null {
  if (!equip.lastMaintenanceDate) return null
  const next = new Date(equip.lastMaintenanceDate)
  next.setDate(next.getDate() + equip.maintenanceIntervalDays)
  return Math.ceil((next.getTime() - Date.now()) / 86400000)
}

function maintenanceLabel(equip: any): string {
  const ds = daysSince(equip)
  const du = daysUntil(equip)
  if (ds === null) return 'Sin historial'
  if (du !== null && du <= 0) return `Vencido hace ${Math.abs(du)} días`
  if (du !== null && du <= 7) return `Vence en ${du} días`
  if (du !== null) return `Próximo: ${du} días`
  return ''
}

function maintenanceClass(equip: any): string {
  const du = daysUntil(equip)
  if (du === null) return 'warn'
  if (du <= 0) return 'critical'
  if (du <= 7) return 'warn'
  return 'ok'
}

function ticketCount(equipId: string): number {
  return (ticketsByEquipment.value[equipId] || []).length
}

async function loadData() {
  try {
    const [eqRes, ticketRes] = await Promise.all([
      maintenanceService.listEquipment(),
      maintenanceService.listTickets().catch(() => ({ data: [] })),
    ])
    equipments.value = eqRes.data as any[]
    allTickets.value = (ticketRes as any).data || []
  } catch {
    equipments.value = []
    ui.showToast({ title: 'Error al cargar equipos', tone: 'error' })
  } finally {
    loading.value = false
  }
}

async function handleSave(data: any) {
  try {
    if (editingEq.value) {
      await maintenanceService.updateEquipment(editingEq.value._id, data)
      ui.showToast({ title: 'Equipo actualizado', tone: 'success', icon: 'fa-solid fa-circle-check' })
    } else {
      const res = await maintenanceService.createEquipment(data)
      const eq = res.data as any
      ui.showToast({ title: 'Equipo registrado', tone: 'success', icon: 'fa-solid fa-circle-check' })
      try {
        const qrRes = await maintenanceService.generateQR(eq._id)
        const qrUrl = (qrRes.data as any).qrCode || ''
        stickerData.value = { qrUrl, name: eq.name }
        const ok = await ui.requestConfirm({
          title: '¿Imprimir sticker?',
          message: 'Pega el código QR en el equipo para escanearlo con tu celular.',
          confirmLabel: 'Imprimir sticker',
          cancelLabel: 'Ahora no',
        })
        if (ok) printSticker()
      } catch { /* QR opcional */ }
    }
    showForm.value = false
    editingEq.value = null
    await loadData()
  } catch {
    ui.showToast({ title: 'Error al guardar', tone: 'error' })
  }
}

function printSticker() {
  const d = stickerData.value
  if (!d) return
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
      .sticker h2 { font-size: 14px; color: #333; margin-bottom: 12px; }
      .sticker img { width: 200px; height: 200px; display: block; margin: 0 auto 8px; }
      .sticker p { font-size: 11px; color: #666; }
      @media print {
        @page { margin: 6mm; size: 57mm 57mm; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
    </head>
    <body>
      <div class="sticker">
        <h2>${d.name}</h2>
        <img src="${d.qrUrl}" alt="QR" />
        <p>Escanea para ver mantenimiento</p>
      </div>
      <script>window.print();window.close();<\/script>
    </body>
    </html>
  `)
  win.document.close()
}

function openNewForm() {
  editingEq.value = null
  showForm.value = true
}

function openEdit(eq: any) {
  editingEq.value = eq
  showForm.value = true
}

async function handleDelete(id: string) {
  if (!confirm('¿Eliminar este equipo? Esta acción no se puede deshacer.')) return
  deletingId.value = id
  try {
    await maintenanceService.deleteEquipment(id)
    ui.showToast({ title: 'Equipo eliminado', tone: 'info' })
    await loadData()
  } catch {
    ui.showToast({ title: 'Error al eliminar', tone: 'error' })
  } finally {
    deletingId.value = null
  }
}

function goDetail(id: string) {
  router.push(`/modulo/mantenimiento/${id}`)
}

const activeMaintenance = computed(() => equipments.value.filter(e => e.status === 'mantenimiento' || e.status === 'averiado').length)
const needsAttention = computed(() => overdueCount.value + openTicketCount.value)

const filteredEquipments = computed(() => {
  if (!selectedStatus.value) return equipments.value
  return equipments.value.filter((e: any) => e.status === selectedStatus.value)
})

onMounted(async () => {
  await loadData()
  maintenanceService.checkOverdue().catch(() => {})
})
</script>

<template>
  <div>
  <AppShell>
    <div class="page">
      <header class="page-head">
        <div>
          <h1 class="page-title">Mantenimiento</h1>
          <p class="page-sub">Gestión de equipos y activos</p>
        </div>
        <button class="btn primary" @click="openNewForm">
          <i class="fa-solid fa-plus" /> <span class="btn-text">Nuevo Equipo</span>
        </button>
      </header>

      <section class="stats-row">
        <div class="stat-card" :class="equipStatus">
          <span class="stat-value">{{ equipments.length }}</span>
          <span class="stat-label">Equipos</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ formatMoney(totalValue) }}</span>
          <span class="stat-label">Valor total</span>
        </div>
        <div class="stat-card" :class="overdueCount > 0 ? 'warn' : ''">
          <span class="stat-value">{{ overdueCount }}</span>
          <span class="stat-label">Vencidos</span>
        </div>
        <div class="stat-card" :class="openTicketCount > 0 ? 'warn' : ''">
          <span class="stat-value">{{ openTicketCount }}</span>
          <span class="stat-label">Tickets abiertos</span>
        </div>
      </section>

      <section class="alerts-bar" v-if="needsAttention > 0">
        <div class="alert-item" v-if="overdueCount > 0">
          <i class="fa-solid fa-circle-exclamation" />
          <span><strong>{{ overdueCount }}</strong> equipo{{ overdueCount !== 1 ? 's' : '' }} con mantenimiento vencido</span>
        </div>
        <div class="alert-item" v-if="activeMaintenance > 0">
          <i class="fa-solid fa-gear" />
          <span><strong>{{ activeMaintenance }}</strong> equipo{{ activeMaintenance !== 1 ? 's' : '' }} en mantenimiento</span>
        </div>
        <div class="alert-item" v-if="openTicketCount > 0">
          <i class="fa-solid fa-ticket" />
          <span><strong>{{ openTicketCount }}</strong> ticket{{ openTicketCount !== 1 ? 's' : '' }} abierto{{ openTicketCount !== 1 ? 's' : '' }}</span>
        </div>
      </section>

      <section class="status-filter">
        <span class="filter-chip" :class="{ active: !selectedStatus }" @click="selectedStatus = ''">
          Todos <small>({{ equipments.length }})</small>
        </span>
        <span class="filter-chip green" :class="{ active: selectedStatus === 'operativo' }" @click="selectedStatus = 'operativo'">
          Operativos <small>({{ equipmentStatusCounts.operativo }})</small>
        </span>
        <span class="filter-chip yellow" :class="{ active: selectedStatus === 'mantenimiento' }" @click="selectedStatus = 'mantenimiento'">
          Mantenimiento <small>({{ equipmentStatusCounts.mantenimiento }})</small>
        </span>
        <span class="filter-chip red" :class="{ active: selectedStatus === 'averiado' }" @click="selectedStatus = 'averiado'">
          Averiados <small>({{ equipmentStatusCounts.averiado }})</small>
        </span>
      </section>

      <div v-if="loading" class="loading-state">
        <div class="loader" />
        <p>Cargando equipos...</p>
      </div>

      <section v-else-if="!equipments.length" class="empty-state">
        <i class="fa-solid fa-screwdriver-wrench empty-icon" />
        <h3>Sin equipos registrados</h3>
        <p>Registra tu primer equipo para comenzar el control de mantenimiento.</p>
        <button class="btn primary" @click="openNewForm"><i class="fa-solid fa-plus" /> Registrar Equipo</button>
      </section>

      <section v-else class="eq-grid">
        <article v-for="eq in filteredEquipments" :key="eq._id" class="eq-card" @click="goDetail(eq._id)">
          <div class="eq-card-top">
            <div class="eq-icon" v-if="!eq.imageUrl">
              <i class="fa-solid fa-screwdriver-wrench" />
            </div>
            <img v-else :src="eq.imageUrl" class="eq-thumb" />
            <div class="eq-info">
              <h3 class="eq-name">{{ eq.name }}</h3>
              <span v-if="eq.brand" class="eq-brand">{{ eq.brand }}</span>
            </div>
            <div class="eq-actions" @click.stop>
              <button class="action-btn" @click="openEdit(eq)" title="Editar">
                <i class="fa-solid fa-pen-to-square" />
              </button>
              <button class="action-btn danger" @click="handleDelete(eq._id)" :disabled="deletingId === eq._id" title="Eliminar">
                <i class="fa-solid fa-trash-can" />
              </button>
            </div>
          </div>
          <div class="eq-card-body">
            <div class="eq-meta-row">
              <span :class="['eq-status', statusClass(eq.status)]">{{ statusLabel(eq.status) }}</span>
              <span v-if="eq.location" class="eq-location"><i class="fa-solid fa-location-dot" /> {{ eq.location }}</span>
              <span class="eq-value">{{ formatMoney(eq.historicalCost) }}</span>
            </div>
            <div class="eq-maint-info">
              <span :class="['maint-badge', maintenanceClass(eq)]">
                <i class="fa-solid fa-calendar-check" /> {{ maintenanceLabel(eq) }}
              </span>
            </div>
            <div class="eq-tickets" v-if="ticketCount(eq._id) > 0" @click.stop="goDetail(eq._id)">
              <i class="fa-solid fa-ticket" /> {{ ticketCount(eq._id) }} ticket{{ ticketCount(eq._id) !== 1 ? 's' : '' }}
            </div>
            <div class="eq-last-maint" v-if="eq.lastMaintenanceDate">
              <i class="fa-solid fa-wrench" /> Último: {{ formatDate(eq.lastMaintenanceDate) }}
            </div>
          </div>
        </article>
      </section>
    </div>
  </AppShell>
  <Teleport to="body">
    <EquipmentForm v-if="showForm" :equipment="editingEq || undefined" @close="showForm = false; editingEq = null" @save="handleSave" />
  </Teleport>
  </div>
</template>

<style scoped lang="scss">
.page { padding: 0 0 80px; display: flex; flex-direction: column; gap: 12px; }

.page-head {
  padding: 16px 16px 0; display: flex; justify-content: space-between; align-items: center; gap: 8px;
}
.page-title { margin: 0; font-size: 1.25rem; font-weight: 900; color: $primary-dark; }
.page-sub { margin: 2px 0 0; font-size: 0.85rem; color: $text-secondary; }

.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 14px 18px; border-radius: 12px;
  font-family: $font-principal; font-weight: 700; font-size: 0.9rem;
  border: none; cursor: pointer; transition: transform 0.15s, background 0.2s; white-space: nowrap;
  min-height: 48px;
  &:active:not(:disabled) { transform: scale(0.97); }
}
.btn.primary { background: linear-gradient(135deg, $primary, $secondary); color: white; box-shadow: 0 8px 20px rgba($primary, 0.28); }
.btn.ghost { background: rgba($primary-dark, 0.06); color: $primary-dark; &:hover { background: rgba($primary-dark, 0.12); } }
@media (max-width: 374px) { .btn-text { display: none; } }

.stats-row { padding: 0 16px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
  @media (min-width: $bp-mobile) { grid-template-columns: repeat(4, 1fr); gap: 10px; }
}
.stat-card {
  background: white; border-radius: 14px; padding: 12px 10px;
  display: flex; flex-direction: column; gap: 2px;
  border: 1px solid rgba($primary-dark, 0.05); text-align: center;
  &.warn { border-color: rgba($alert-warning, 0.25); background: rgba($alert-warning, 0.04); }
  &.danger { border-color: rgba($alert-error, 0.25); background: rgba($alert-error, 0.04); }
  &.good { border-color: rgba($alert-success, 0.2); background: rgba($alert-success, 0.04); }
}
.stat-value { font-size: 1.1rem; font-weight: 900; color: $primary-dark; }
.stat-label { font-size: 0.6rem; font-weight: 700; color: $text-secondary; text-transform: uppercase; letter-spacing: 0.3px; }

.alerts-bar { margin: 0 16px; padding: 12px 14px; background: rgba($alert-warning, 0.08); border: 1px solid rgba($alert-warning, 0.2); border-radius: 14px; display: flex; flex-direction: column; gap: 8px; }
.alert-item { font-size: 0.82rem; color: $primary-dark; display: flex; align-items: center; gap: 8px;
  i { color: $alert-warning; font-size: 0.9rem; flex-shrink: 0; }
}

.status-filter { padding: 0 16px; display: flex; gap: 8px; overflow-x: auto; -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar { display: none; }
}
.filter-chip {
  padding: 10px 18px; border-radius: 999px; background: white; font-size: 0.82rem; font-weight: 700;
  border: 1.5px solid rgba($primary-dark, 0.08); cursor: pointer; white-space: nowrap; color: $text-secondary; flex-shrink: 0;
  small { font-weight: 600; opacity: 0.7; }
  &:hover { border-color: $primary; }
  &.active { border-color: $primary; background: rgba($primary, 0.08); color: $primary; }
  &.green { &:hover, &.active { border-color: $alert-success; color: darken($alert-success, 10%); background: rgba($alert-success, 0.08); } }
  &.yellow { &:hover, &.active { border-color: $alert-warning; color: darken($alert-warning, 10%); background: rgba($alert-warning, 0.08); } }
  &.red { &:hover, &.active { border-color: $alert-error; color: $alert-error; background: rgba($alert-error, 0.08); } }
}

.loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px 0; gap: 12px; color: $text-secondary; }
.loader { width: 36px; height: 36px; border: 3px solid rgba($primary, 0.2); border-top-color: $primary; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { padding: 60px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;
  .empty-icon { font-size: 2.5rem; color: rgba($primary-dark, 0.12); }
  h3 { margin: 0; font-size: 1.1rem; font-weight: 800; color: $primary-dark; }
  p { margin: 0; font-size: 0.88rem; color: $text-secondary; max-width: 280px; }
}

.eq-grid { padding: 0 16px; display: flex; flex-direction: column; gap: 10px; }
.eq-card {
  background: white; border-radius: 16px; padding: 14px;
  border: 1px solid rgba($primary-dark, 0.06); cursor: pointer;
  display: flex; flex-direction: column; gap: 10px;
  transition: all 0.15s;
  &:active { background: rgba($primary, 0.03); }
  @media (min-width: $bp-mobile) { padding: 16px; &:hover { border-color: $primary; box-shadow: 0 4px 16px rgba($primary, 0.08); } }
}
.eq-card-top { display: flex; align-items: center; gap: 12px; }
.eq-icon {
  width: 44px; height: 44px; border-radius: 12px; background: rgba($primary, 0.1);
  color: $primary; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;
}
.eq-thumb { width: 44px; height: 44px; border-radius: 12px; object-fit: cover; flex-shrink: 0; border: 1px solid rgba($primary-dark, 0.08); }
.eq-info { flex: 1; min-width: 0; }
.eq-name { margin: 0; font-size: 0.95rem; font-weight: 800; color: $primary-dark; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.eq-brand { font-size: 0.78rem; color: $text-secondary; }
.eq-actions { display: flex; gap: 6px; flex-shrink: 0; }
.action-btn {
  width: 36px; height: 36px; border-radius: 10px; border: none;
  background: rgba($primary-dark, 0.05); cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: $text-secondary; font-size: 0.88rem; transition: all 0.15s;
  @media (min-width: $bp-mobile) { width: 30px; height: 30px; font-size: 0.82rem; }
  &:hover { background: rgba($primary, 0.1); color: $primary; }
  &.danger:hover { background: rgba($alert-error, 0.1); color: $alert-error; }
  &:disabled { opacity: 0.4; cursor: wait; }
}

.eq-card-body { display: flex; flex-direction: column; gap: 6px; }
.eq-meta-row { display: flex; justify-content: space-between; align-items: center; }
.eq-status {
  font-size: 0.68rem; font-weight: 800; padding: 4px 12px; border-radius: 999px; text-transform: uppercase;
  &.green { background: rgba($alert-success, 0.1); color: darken($alert-success, 12%); }
  &.red { background: rgba($alert-error, 0.1); color: $alert-error; }
  &.yellow { background: rgba($alert-warning, 0.12); color: darken($alert-warning, 15%); }
  &.gray { background: rgba($text-secondary, 0.1); color: $text-secondary; }
}
.eq-value { font-size: 0.88rem; font-weight: 800; color: $primary-dark; }
.eq-location { font-size: 0.72rem; color: $text-secondary; display: flex; align-items: center; gap: 4px; i { font-size: 0.68rem; } }

.eq-maint-info { display: flex; gap: 6px; align-items: center; }
.maint-badge {
  font-size: 0.72rem; font-weight: 600; padding: 5px 10px; border-radius: 8px;
  display: inline-flex; align-items: center; gap: 4px;
  i { font-size: 0.72rem; }
  &.ok { background: rgba($alert-success, 0.08); color: darken($alert-success, 12%); }
  &.warn { background: rgba($alert-warning, 0.1); color: darken($alert-warning, 15%); }
  &.critical { background: rgba($alert-error, 0.1); color: $alert-error; }
}
.eq-tickets { font-size: 0.75rem; color: $text-secondary; i { color: $primary; margin-right: 4px; } }
.eq-last-maint { font-size: 0.72rem; color: $text-secondary; i { color: $text-secondary; margin-right: 4px; } }
</style>
