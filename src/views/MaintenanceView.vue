<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'
import AppShell from '@/layout/AppShell.vue'
import EquipmentForm from '@/components/EquipmentForm.vue'
import { maintenanceService } from '@/services/maintenanceService'

const router = useRouter()
const ui = useUIStore()
const userStore = useUserStore()

const equipments = ref<any[]>([])
const allTickets = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const editingEq = ref<any | null>(null)
const deletingId = ref<string | null>(null)
const postCreateAction = ref<{ eq: any; qrUrl: string; publicUrl?: string; branchName?: string; location?: string } | null>(null)
const selectedStatus = ref('')
const selectedBranchId = ref('all')
const stickerData = ref<{ qrUrl: string; name: string; publicUrl?: string; branchName?: string; location?: string } | null>(null)

const branches = computed(() => userStore.branches)
const selectedBranchLabel = computed(() => {
  if (selectedBranchId.value === 'all') return 'Todas las sucursales'
  return branches.value.find((branch) => branch.id === selectedBranchId.value)?.name || 'Sucursal'
})

function branchName(branchId: string) {
  return branches.value.find((branch) => branch.id === branchId)?.name || 'Sucursal'
}

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

const healthLabel = computed(() => {
  if (equipStatus.value === 'danger') return 'Crítico'
  if (equipStatus.value === 'warning') return 'Atención'
  return 'Controlado'
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
    const branchIds = selectedBranchId.value === 'all'
      ? branches.value.map((branch) => branch.id)
      : [selectedBranchId.value]

    const targetBranchIds = branchIds.length ? branchIds : [undefined]
    const [equipmentResponses, ticketResponses] = await Promise.all([
      Promise.all(targetBranchIds.map((branchId) => maintenanceService.listEquipment(branchId).catch(() => ({ data: [] })))),
      Promise.all(targetBranchIds.map((branchId) => maintenanceService.listTickets(undefined, branchId).catch(() => ({ data: [] })))),
    ])

    equipments.value = equipmentResponses.flatMap((res: any) => (res.data || []).map((eq: any) => ({
      ...eq,
      branchName: eq.branchName || branchName(eq.branchId),
    })))
    allTickets.value = ticketResponses.flatMap((res: any) => res.data || [])
  } catch {
    equipments.value = []
    ui.showToast({ title: 'Error al cargar equipos', tone: 'error' })
  } finally {
    loading.value = false
  }
}

async function handleSave(data: any) {
  if (editingEq.value) {
    const res = await maintenanceService.updateEquipment(editingEq.value._id, data)
    await loadData()
    return { mode: 'edit', eq: res.data }
  }

  const res = await maintenanceService.createEquipment(data)
  const eq = res.data as any
  const qrRes = await maintenanceService.generateQR(eq._id)
  const qrUrl = (qrRes.data as any).qrCode || ''
  const publicUrl = (qrRes.data as any).url || `${window.location.origin}/modulo/mantenimiento/${eq._id}`
  await loadData()
  return {
    mode: 'create',
    eq,
    qrUrl,
    publicUrl,
    branchName: eq.branchName || branchName(data.branchId),
    location: data.location,
  }
}

function handleFormSaved(result: any) {
  showForm.value = false
  editingEq.value = null
  if (result?.mode === 'create') {
    stickerData.value = {
      qrUrl: result.qrUrl,
      name: result.eq.name,
      publicUrl: result.publicUrl,
      branchName: result.branchName,
      location: result.location,
    }
    postCreateAction.value = result
    return
  }
  ui.showToast({ title: 'Equipo actualizado', tone: 'success', icon: 'fa-solid fa-circle-check' })
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
      .sticker .loc { font-size: 11px; color: #666; margin-bottom: 6px; }
      .sticker img { width: 200px; height: 200px; display: block; margin: 0 auto 8px; }
      .sticker p { font-size: 11px; color: #666; }
      .sticker .url { font-size: 8px; color: #888; overflow-wrap: anywhere; margin-top: 6px; }
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
        <img src="${d.qrUrl}" alt="QR" />
        <p>Escanea para ver ficha técnica</p>
        ${d.publicUrl ? `<p class="url">${d.publicUrl}</p>` : ''}
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
  const ok = await ui.requestConfirm({
    title: 'Confirmar eliminación',
    message: 'Este equipo saldrá del control de mantenimiento. Confirma solo si ya no necesitas su ficha ni su QR activo.',
    confirmLabel: 'Sí, eliminar',
    cancelLabel: 'Conservar equipo',
    tone: 'danger',
    icon: 'fa-solid fa-trash-can',
  })
  if (!ok) return
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

function printCreatedSticker() {
  printSticker()
  postCreateAction.value = null
}

function openCreatedEquipment() {
  const id = postCreateAction.value?.eq?._id
  postCreateAction.value = null
  if (id) goDetail(id)
}

const activeMaintenance = computed(() => equipments.value.filter(e => e.status === 'mantenimiento' || e.status === 'averiado').length)
const needsAttention = computed(() => overdueCount.value + openTicketCount.value)

const filteredEquipments = computed(() => {
  if (!selectedStatus.value) return equipments.value
  return equipments.value.filter((e: any) => e.status === selectedStatus.value)
})

async function selectBranch(branchId: string) {
  selectedBranchId.value = branchId
  loading.value = true
  await loadData()
}

onMounted(async () => {
  if (!userStore.branches.length) await userStore.fetchWorkspace()
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
          <span class="eyebrow"><i class="fa-solid fa-qrcode" /> QR · historial · tickets</span>
          <h1 class="page-title">Mantenimiento inteligente</h1>
          <p class="page-sub">Registra equipos, pega su QR y consulta el historial técnico desde cualquier celular.</p>
          <div class="hero-pills">
            <span :class="['hero-status', equipStatus]"><i class="fa-solid fa-heart-pulse" /> {{ healthLabel }}</span>
            <span><i class="fa-solid fa-mobile-screen" /> Escaneo con cámara nativa</span>
            <span><i class="fa-solid fa-store" /> {{ selectedBranchLabel }}</span>
          </div>
        </div>
        <button class="btn primary" @click="openNewForm">
          <i class="fa-solid fa-plus" /> <span class="btn-text">Nuevo Equipo</span>
        </button>
        <div class="hero-device" aria-hidden="true">
          <i class="fa-solid fa-screwdriver-wrench" />
          <span class="qr-mini"><i class="fa-solid fa-qrcode" /></span>
        </div>
      </header>

      <section class="stats-row">
        <div class="stat-card" :class="equipStatus">
          <span class="stat-icon"><i class="fa-solid fa-kitchen-set" /></span>
          <div>
            <span class="stat-label">Equipos</span>
            <span class="stat-value">{{ equipments.length }}</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon cyan"><i class="fa-solid fa-vault" /></span>
          <div>
            <span class="stat-label">Valor total</span>
            <span class="stat-value">{{ formatMoney(totalValue) }}</span>
          </div>
        </div>
        <div class="stat-card" :class="overdueCount > 0 ? 'warn' : ''">
          <span class="stat-icon amber"><i class="fa-solid fa-calendar-xmark" /></span>
          <div>
            <span class="stat-label">Vencidos</span>
            <span class="stat-value">{{ overdueCount }}</span>
          </div>
        </div>
        <div class="stat-card" :class="openTicketCount > 0 ? 'warn' : ''">
          <span class="stat-icon violet"><i class="fa-solid fa-ticket" /></span>
          <div>
            <span class="stat-label">Tickets abiertos</span>
            <span class="stat-value">{{ openTicketCount }}</span>
          </div>
        </div>
      </section>

      <section class="alerts-bar" v-if="needsAttention > 0">
        <strong class="alerts-title"><i class="fa-solid fa-bell" /> Prioridad de hoy</strong>
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

      <section v-if="branches.length" class="status-filter branch-filter" aria-label="Filtrar por sucursal">
        <span class="filter-chip" :class="{ active: selectedBranchId === 'all' }" @click="selectBranch('all')">
          Todas <small>({{ branches.length }})</small>
        </span>
        <span
          v-for="branch in branches"
          :key="branch.id"
          class="filter-chip"
          :class="{ active: selectedBranchId === branch.id }"
          @click="selectBranch(branch.id)"
        >
          <i :class="branch.isMain ? 'fa-solid fa-star' : 'fa-solid fa-store'" /> {{ branch.name }}
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
          <div class="eq-glow" :class="statusClass(eq.status)" />
          <div class="eq-card-top">
            <div class="eq-icon" v-if="!eq.imageUrl">
              <i class="fa-solid fa-screwdriver-wrench" />
            </div>
            <img v-else :src="eq.imageUrl" class="eq-thumb" />
            <div class="eq-info">
              <h3 class="eq-name">{{ eq.name }}</h3>
              <span class="eq-brand">{{ eq.brand || 'Equipo sin marca' }}</span>
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
              <span v-if="eq.branchName" class="eq-branch"><i class="fa-solid fa-store" /> {{ eq.branchName }}</span>
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
    <EquipmentForm
      v-if="showForm"
      :equipment="editingEq || undefined"
      :branches="branches"
      :initial-branch-id="selectedBranchId !== 'all' ? selectedBranchId : undefined"
      :save-action="handleSave"
      @close="showForm = false; editingEq = null"
      @saved="handleFormSaved"
    />

    <Transition name="success-pop">
      <div v-if="postCreateAction" class="created-backdrop">
        <section class="created-card" role="dialog" aria-modal="true">
          <span class="created-icon"><i class="fa-solid fa-circle-check" /></span>
          <p class="created-eyebrow">Equipo creado</p>
          <h2>{{ postCreateAction.eq.name }}</h2>
          <p class="created-copy">La ficha quedó lista para auditoría: sucursal, ubicación, historial inicial y QR quedan vinculados al equipo.</p>
          <div class="created-tags">
            <span v-if="postCreateAction.branchName"><i class="fa-solid fa-store" /> {{ postCreateAction.branchName }}</span>
            <span v-if="postCreateAction.location"><i class="fa-solid fa-location-dot" /> {{ postCreateAction.location }}</span>
            <span><i class="fa-solid fa-qrcode" /> QR listo</span>
          </div>
          <a v-if="postCreateAction.publicUrl" class="created-link" :href="postCreateAction.publicUrl" target="_blank" rel="noopener">{{ postCreateAction.publicUrl }}</a>
          <div class="created-actions">
            <button class="btn primary" type="button" @click="printCreatedSticker"><i class="fa-solid fa-print" /> Imprimir ticket QR</button>
            <button class="btn ghost" type="button" @click="openCreatedEquipment"><i class="fa-solid fa-arrow-up-right-from-square" /> Ver ficha</button>
            <button class="link-btn" type="button" @click="postCreateAction = null">Después</button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
  </div>
</template>

<style scoped lang="scss">
.page { padding: 0 0 88px; display: flex; flex-direction: column; gap: 16px; }

.page-head {
  position: relative;
  overflow: hidden;
  margin: 0 16px;
  padding: 26px;
  min-height: 210px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  border-radius: 30px;
  border: 1px solid rgba($primary-dark, 0.07);
  background:
    radial-gradient(circle at 86% 16%, rgba($accent, 0.26), transparent 30%),
    radial-gradient(circle at 14% 84%, rgba($primary, 0.16), transparent 34%),
    linear-gradient(135deg, white, $bg 58%, white);
  box-shadow: 0 26px 70px rgba($primary-dark, 0.09);
  @media (max-width: 680px) { min-height: 0; padding: 22px; flex-direction: column; }
}
.eyebrow {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 7px 12px; border-radius: 999px;
  background: rgba(white, 0.78); color: $primary;
  font-size: 0.68rem; font-weight: 900; letter-spacing: 0.85px; text-transform: uppercase;
  box-shadow: inset 0 0 0 1px rgba($primary, 0.1);
}
.page-title { margin: 12px 0 6px; max-width: 620px; font-size: clamp(1.75rem, 3.2vw, 3rem); line-height: 1.02; font-weight: 950; letter-spacing: -1.2px; color: $primary-dark; }
.page-sub { margin: 0; max-width: 540px; font-size: 0.98rem; color: rgba($primary-dark, 0.68); line-height: 1.55; }
.hero-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px;
  span { display: inline-flex; align-items: center; gap: 7px; padding: 8px 11px; border-radius: 999px; background: rgba(white, 0.78); color: $primary-dark; font-size: 0.78rem; font-weight: 800; }
}
.hero-status.good { color: darken($alert-success, 12%); }
.hero-status.warning { color: darken($alert-warning, 14%); }
.hero-status.danger { color: $alert-error; }
.hero-device {
  position: absolute; right: 34px; bottom: -22px; width: 150px; height: 150px; border-radius: 42px;
  display: grid; place-items: center; transform: rotate(-8deg);
  color: white; font-size: 3.25rem;
  background: linear-gradient(135deg, $primary-dark, $primary);
  box-shadow: 0 34px 70px rgba($primary, 0.24);
  pointer-events: none;
  @media (max-width: 760px) { display: none; }
}
.qr-mini { position: absolute; right: 18px; top: 18px; width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; color: $primary-dark; background: rgba(white, 0.9); font-size: 1.25rem; }

.btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 18px; border-radius: 15px; font-family: $font-principal; font-weight: 850; font-size: 0.9rem; border: none; cursor: pointer; transition: transform 0.15s, box-shadow 0.2s; white-space: nowrap; min-height: 48px; &:active:not(:disabled) { transform: scale(0.97); } }
.btn.primary { background: linear-gradient(135deg, $primary-dark, $primary); color: white; box-shadow: 0 14px 34px rgba($primary, 0.3); &:hover { box-shadow: 0 18px 42px rgba($primary, 0.34); } }
.btn.ghost { background: rgba($primary-dark, 0.06); color: $primary-dark; &:hover { background: rgba($primary-dark, 0.12); } }
@media (max-width: 374px) { .btn-text { display: none; } }

.stats-row { padding: 0 16px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; @media (min-width: 980px) { grid-template-columns: repeat(4, 1fr); } @media (max-width: 560px) { grid-template-columns: 1fr; } }
.stat-card { background: rgba(white, 0.94); border-radius: 22px; padding: 16px; display: flex; align-items: center; gap: 13px; border: 1px solid rgba($primary-dark, 0.06); box-shadow: 0 16px 36px rgba($primary-dark, 0.055); &.warn { border-color: rgba($alert-warning, 0.24); } &.danger { border-color: rgba($alert-error, 0.24); } &.good { border-color: rgba($alert-success, 0.18); } }
.stat-icon { width: 48px; height: 48px; border-radius: 16px; display: grid; place-items: center; flex-shrink: 0; color: darken($alert-success, 10%); background: rgba($alert-success, 0.12); &.cyan { color: $primary; background: rgba($primary, 0.12); } &.amber { color: darken($alert-warning, 10%); background: rgba($alert-warning, 0.14); } &.violet { color: $primary-dark; background: rgba($primary-dark, 0.08); } }
.stat-card > div { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.stat-value { font-size: 1.24rem; font-weight: 950; color: $primary-dark; letter-spacing: -0.45px; }
.stat-label { font-size: 0.66rem; font-weight: 850; color: $text-secondary; text-transform: uppercase; letter-spacing: 0.45px; }

.alerts-bar { margin: 0 16px; padding: 16px; background: linear-gradient(135deg, rgba($alert-warning, 0.12), rgba(white, 0.86)); border: 1px solid rgba($alert-warning, 0.22); border-radius: 22px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 16px 36px rgba($primary-dark, 0.045); }
.alerts-title { display: inline-flex; align-items: center; gap: 8px; color: $primary-dark; font-size: 0.88rem; }
.alert-item { font-size: 0.84rem; color: $primary-dark; display: flex; align-items: center; gap: 9px; i { color: $alert-warning; font-size: 0.95rem; flex-shrink: 0; } }

.status-filter { margin: 0 16px; padding: 6px; display: flex; gap: 6px; overflow-x: auto; -webkit-overflow-scrolling: touch; background: rgba(white, 0.78); border: 1px solid rgba($primary-dark, 0.06); border-radius: 999px; box-shadow: 0 12px 30px rgba($primary-dark, 0.04); &::-webkit-scrollbar { display: none; } }
.branch-filter { margin-top: -8px; background: rgba($primary, 0.06); }
.filter-chip { padding: 10px 16px; border-radius: 999px; font-size: 0.82rem; font-weight: 850; cursor: pointer; white-space: nowrap; color: $text-secondary; flex-shrink: 0; transition: all 0.18s; small { font-weight: 700; opacity: 0.72; } &:hover { color: $primary; } &.active { background: $primary-dark; color: white; box-shadow: 0 10px 24px rgba($primary-dark, 0.16); } &.green.active { background: $alert-success; } &.yellow.active { background: $alert-warning; } &.red.active { background: $alert-error; } }

.loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px 0; gap: 12px; color: $text-secondary; }
.loader { width: 36px; height: 36px; border: 3px solid rgba($primary, 0.2); border-top-color: $primary; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { margin: 0 16px; padding: 58px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; border-radius: 28px; background: radial-gradient(circle at 50% 0%, rgba($primary, 0.12), transparent 42%), white; border: 1px solid rgba($primary-dark, 0.06); box-shadow: 0 22px 50px rgba($primary-dark, 0.055); .empty-icon { font-size: 2.8rem; color: rgba($primary, 0.36); } h3 { margin: 0; font-size: 1.22rem; font-weight: 900; color: $primary-dark; } p { margin: 0; font-size: 0.9rem; color: $text-secondary; max-width: 330px; line-height: 1.5; } }

.eq-grid { padding: 0 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; }
.eq-card { position: relative; overflow: hidden; background: rgba(white, 0.95); border-radius: 24px; padding: 16px; border: 1px solid rgba($primary-dark, 0.06); cursor: pointer; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 18px 44px rgba($primary-dark, 0.055); transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s; &:hover { transform: translateY(-3px); border-color: rgba($primary, 0.24); box-shadow: 0 24px 54px rgba($primary-dark, 0.08); } }
.eq-glow { position: absolute; inset: 0 0 auto; height: 5px; background: $text-secondary; &.green { background: $alert-success; } &.red { background: $alert-error; } &.yellow { background: $alert-warning; } }
.eq-card-top { display: flex; align-items: center; gap: 12px; padding-top: 4px; }
.eq-icon { width: 54px; height: 54px; border-radius: 18px; background: linear-gradient(135deg, rgba($primary, 0.16), rgba($primary, 0.06)); color: $primary; display: flex; align-items: center; justify-content: center; font-size: 1.28rem; flex-shrink: 0; }
.eq-thumb { width: 54px; height: 54px; border-radius: 18px; object-fit: cover; flex-shrink: 0; border: 1px solid rgba($primary-dark, 0.08); }
.eq-info { flex: 1; min-width: 0; }
.eq-name { margin: 0; font-size: 1rem; font-weight: 900; color: $primary-dark; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.eq-brand { font-size: 0.78rem; color: $text-secondary; font-weight: 700; }
.eq-actions { display: flex; gap: 6px; flex-shrink: 0; }
.action-btn { width: 36px; height: 36px; border-radius: 12px; border: none; background: rgba($primary-dark, 0.05); cursor: pointer; display: flex; align-items: center; justify-content: center; color: $text-secondary; font-size: 0.88rem; transition: all 0.15s; &:hover { background: rgba($primary, 0.1); color: $primary; } &.danger:hover { background: rgba($alert-error, 0.1); color: $alert-error; } &:disabled { opacity: 0.4; cursor: wait; } }

.eq-card-body { display: flex; flex-direction: column; gap: 10px; }
.eq-meta-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.eq-status { font-size: 0.66rem; font-weight: 900; padding: 5px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.35px; &.green { background: rgba($alert-success, 0.11); color: darken($alert-success, 14%); } &.red { background: rgba($alert-error, 0.1); color: $alert-error; } &.yellow { background: rgba($alert-warning, 0.13); color: darken($alert-warning, 16%); } &.gray { background: rgba($text-secondary, 0.1); color: $text-secondary; } }
.eq-value { margin-left: auto; font-size: 0.9rem; font-weight: 900; color: $primary-dark; }
.eq-location { font-size: 0.76rem; color: $text-secondary; display: flex; align-items: center; gap: 4px; font-weight: 700; i { font-size: 0.68rem; } }
.eq-branch { font-size: 0.76rem; color: $primary; display: flex; align-items: center; gap: 4px; font-weight: 850; padding: 5px 9px; border-radius: 999px; background: rgba($primary, 0.08); i { font-size: 0.68rem; } }
.eq-maint-info { display: flex; gap: 6px; align-items: center; }
.maint-badge { font-size: 0.76rem; font-weight: 800; padding: 7px 10px; border-radius: 12px; display: inline-flex; align-items: center; gap: 6px; i { font-size: 0.74rem; } &.ok { background: rgba($alert-success, 0.08); color: darken($alert-success, 12%); } &.warn { background: rgba($alert-warning, 0.12); color: darken($alert-warning, 15%); } &.critical { background: rgba($alert-error, 0.1); color: $alert-error; } }
.eq-tickets { width: fit-content; font-size: 0.77rem; color: $primary; font-weight: 850; padding: 6px 10px; border-radius: 999px; background: rgba($primary, 0.08); i { margin-right: 4px; } }
.eq-last-maint { font-size: 0.74rem; color: $text-secondary; font-weight: 700; i { color: $text-secondary; margin-right: 4px; } }

.created-backdrop {
  position: fixed; inset: 0; z-index: 120; display: grid; place-items: center; padding: 22px;
  background: rgba($primary-dark, 0.58); backdrop-filter: blur(6px);
}
.created-card {
  width: min(100%, 460px); padding: 28px; border-radius: 30px; text-align: center;
  background: radial-gradient(circle at 50% 0%, rgba($accent, 0.24), transparent 42%), linear-gradient(135deg, white, $bg);
  border: 1px solid rgba(white, 0.78); box-shadow: 0 34px 90px rgba($primary-dark, 0.32);
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  h2 { margin: 0; color: $primary-dark; font-size: 1.45rem; font-weight: 950; letter-spacing: -0.4px; }
}
.created-icon { width: 70px; height: 70px; border-radius: 24px; display: grid; place-items: center; color: white; font-size: 2rem; background: linear-gradient(135deg, $alert-success, $accent); box-shadow: 0 20px 42px rgba($alert-success, 0.26); }
.created-eyebrow { margin: 4px 0 -8px; color: $primary; font-size: 0.72rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.9px; }
.created-copy { margin: 0; color: $text-secondary; line-height: 1.55; font-size: 0.92rem; max-width: 360px; }
.created-tags { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; span { display: inline-flex; align-items: center; gap: 6px; padding: 7px 10px; border-radius: 999px; background: rgba(white, 0.74); color: $primary-dark; font-size: 0.76rem; font-weight: 850; } i { color: $primary; } }
.created-link { max-width: 100%; padding: 8px 10px; border-radius: 12px; background: rgba($primary-dark, 0.05); color: $primary; font-size: 0.72rem; font-weight: 800; overflow-wrap: anywhere; text-decoration: none; &:hover { background: rgba($primary, 0.1); } }
.created-actions { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; .btn { justify-content: center; } @media (max-width: 520px) { grid-template-columns: 1fr; } }
.link-btn { grid-column: 1 / -1; border: none; background: transparent; color: $text-secondary; font-weight: 800; cursor: pointer; padding: 6px; &:hover { color: $primary; } }
.success-pop-enter-active, .success-pop-leave-active { transition: opacity 0.2s; }
.success-pop-enter-from, .success-pop-leave-to { opacity: 0; }
.success-pop-enter-active .created-card, .success-pop-leave-active .created-card { transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s; }
.success-pop-enter-from .created-card, .success-pop-leave-to .created-card { transform: translateY(18px) scale(0.96); opacity: 0; }
</style>
