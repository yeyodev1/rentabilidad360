<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppShell from '@/layout/AppShell.vue'
import { onboardingService } from '@/services/onboardingService'
import { tiendaService } from '@/services/tiendaService'
import { workspaceService } from '@/services/workspaceService'
import { useUserStore } from '@/stores/user'
import { useUIStore } from '@/stores/ui'
import AppSelect from '@/components/AppSelect.vue'
import type { WorkspaceMember } from '@/services/workspaceService'

const userStore = useUserStore()
const ui = useUIStore()

const editing = ref(false)
const loading = ref(true)
const saving = ref(false)
const loadError = ref(false)
const members = ref<WorkspaceMember[]>([])
const membersLoading = ref(true)

const editForm = ref({
  legalName: '',
  commercialName: '',
  ruc: '',
  country: '',
  city: '',
})

const hasData = computed(() => !!editForm.value?.legalName)

const countryOptions = [
  { value: 'Ecuador', label: 'Ecuador', icon: 'fa-solid fa-earth-americas' },
  { value: 'Colombia', label: 'Colombia', icon: 'fa-solid fa-earth-americas' },
  { value: 'Perú', label: 'Perú', icon: 'fa-solid fa-earth-americas' },
  { value: 'México', label: 'México', icon: 'fa-solid fa-earth-americas' },
]

const roleOptions = [
  { value: 'supervisor', label: 'Supervisor', icon: 'fa-solid fa-user-shield', hint: 'Crea y edita equipos, reporta y completa checklists' },
  { value: 'operador', label: 'Operador', icon: 'fa-solid fa-user-gear', hint: 'Consulta equipos, reporta y completa checklists' },
]

onMounted(async () => {
  userStore.hydrate()
  document.title = 'Workspace · Allio'
  await Promise.all([loadWorkspace(), loadMembers()])
})

async function loadWorkspace() {
  loading.value = true
  loadError.value = false
  const timeout = setTimeout(() => {
    loading.value = false
    loadError.value = true
  }, 8000)
  try {
    if (userStore.workspaceIds.length && !userStore.workspaceName) {
      await userStore.fetchWorkspace()
    }
    const res = await workspaceService.getCurrentWorkspace()
    const ws = res.data?.workspace
    if (ws) {
      editForm.value = {
        legalName: ws.legalName || '',
        commercialName: ws.commercialName || '',
        ruc: ws.ruc || '',
        country: ws.country || '',
        city: ws.city || '',
      }
      userStore.workspaceName = ws.commercialName || ws.legalName
      userStore.workspaceRuc = ws.ruc
    }
    loadError.value = false
  } catch {
    loadError.value = true
  }
  clearTimeout(timeout)
  loading.value = false
}

async function loadMembers() {
  membersLoading.value = true
  try {
    const res = await workspaceService.listMembers()
    members.value = res.data.members || []
  } catch {
    members.value = []
    ui.showToast({ title: 'No se pudo cargar el equipo', tone: 'error' })
  } finally {
    membersLoading.value = false
  }
}

const memberDrawerOpen = ref(false)
const savingMember = ref(false)
const showMemberPassword = ref(false)
const memberForm = ref({ name: '', email: '', password: '', role: 'supervisor' as 'supervisor' | 'operador' })

function openMemberDrawer() {
  memberForm.value = { name: '', email: '', password: '', role: 'supervisor' }
  showMemberPassword.value = false
  memberDrawerOpen.value = true
}

function closeMemberDrawer() {
  memberDrawerOpen.value = false
}

async function saveMember() {
  const form = memberForm.value
  if (!form.name.trim() || !form.email.trim() || !form.password || !form.role) {
    ui.showToast({ title: 'Completa nombre, correo, contraseña y rol', tone: 'warning' })
    return
  }
  savingMember.value = true
  try {
    await workspaceService.createMember({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase() })
    await loadMembers()
    closeMemberDrawer()
    ui.showToast({ title: 'Persona agregada al equipo', message: `${form.email} ya puede iniciar sesión.`, tone: 'success', icon: 'fa-solid fa-user-check' })
  } catch (error: any) {
    ui.showToast({ title: error?.response?.data?.message || 'No se pudo agregar la persona', tone: 'error' })
  } finally {
    savingMember.value = false
  }
}

async function changeMemberRole(member: WorkspaceMember, role: string) {
  if (member.isOwner || member.role === role) return
  try {
    await workspaceService.updateMemberRole(member.id, role as 'supervisor' | 'operador')
    member.role = role as WorkspaceMember['role']
    ui.showToast({ title: 'Rol actualizado', message: `${member.name} deberá volver a iniciar sesión.`, tone: 'success' })
  } catch (error: any) {
    ui.showToast({ title: error?.response?.data?.message || 'No se pudo actualizar el rol', tone: 'error' })
    await loadMembers()
  }
}

async function removeMember(member: WorkspaceMember) {
  if (member.isOwner) return
  const ok = await ui.requestConfirm({
    title: `¿Retirar a ${member.name}?`,
    message: `${member.email} dejará de tener acceso a este workspace.`,
    confirmLabel: 'Retirar acceso',
    cancelLabel: 'Conservar',
    tone: 'danger',
    icon: 'fa-solid fa-user-minus',
  })
  if (!ok) return
  try {
    await workspaceService.removeMember(member.id)
    await loadMembers()
    ui.showToast({ title: 'Acceso retirado', tone: 'info' })
  } catch (error: any) {
    ui.showToast({ title: error?.response?.data?.message || 'No se pudo retirar el acceso', tone: 'error' })
  }
}

function roleLabel(role: string) {
  if (role === 'admin') return 'Administrador'
  return roleOptions.find((option) => option.value === role)?.label || role
}

function startEditing() {
  editing.value = true
}

function cancelEditing() {
  editing.value = false
  loadWorkspace()
}

async function saveWorkspace() {
  if (!editForm.value.legalName.trim() || !editForm.value.ruc.trim()) {
    ui.showToast({ title: 'Nombre legal y RUC son obligatorios', tone: 'warning' })
    return
  }
  saving.value = true
  try {
    await onboardingService.saveStep(1, editForm.value)
    userStore.workspaceName = editForm.value.commercialName || editForm.value.legalName
    userStore.workspaceRuc = editForm.value.ruc
    editing.value = false
    ui.showToast({ title: 'Workspace actualizado', tone: 'success', icon: 'fa-solid fa-circle-check' })
  } catch {
    ui.showToast({     title: 'Error al guardar', tone: 'error' })
  } finally {
    saving.value = false
  }
}

// === Tienda editor drawer ===
const drawerOpen = ref(false)
const drawerMode = ref<'create' | 'edit'>('create')
const editingId = ref<string | null>(null)
const savingTienda = ref(false)

interface Tienda {
  id: string
  name: string
  businessType: string | null
  address: string
  city: string
  manager: string
  phone: string
  status: 'active' | 'paused' | 'opening'
  staff: number
  monthlyClients: number
  notes: string
  createdAt?: string
  isMain: boolean
}

const businessTypes = [
  { id: 'restaurante', label: 'Restaurante', icon: 'fa-solid fa-burger' },
  { id: 'cafeteria', label: 'Cafetería', icon: 'fa-solid fa-mug-hot' },
  { id: 'heladeria', label: 'Heladería', icon: 'fa-solid fa-ice-cream' },
  { id: 'pizza', label: 'Pizzería', icon: 'fa-solid fa-pizza-slice' },
  { id: 'panaderia', label: 'Panadería', icon: 'fa-solid fa-bread-slice' },
  { id: 'bar', label: 'Bar / Pub', icon: 'fa-solid fa-martini-glass-citrus' },
]

const statusOptions = [
  { id: 'active', label: 'Activa', icon: 'fa-solid fa-circle-check', tone: 'green' },
  { id: 'paused', label: 'En pausa', icon: 'fa-solid fa-circle-pause', tone: 'yellow' },
  { id: 'opening', label: 'En apertura', icon: 'fa-solid fa-rocket', tone: 'blue' },
] as const

const tiendaForm = ref<Partial<Tienda>>({
  name: '',
  businessType: null,
  address: '',
  city: '',
  manager: '',
  phone: '',
  status: 'opening',
  staff: 4,
  monthlyClients: 800,
  notes: '',
})

const tiendas = computed<Tienda[]>(() =>
  userStore.branches.map((b) => ({
    id: b.id,
    name: b.name,
    businessType: null,
    address: b.address || '',
    city: '',
    manager: '',
    phone: b.phone || '',
    status: 'active',
    staff: 0,
    monthlyClients: 0,
    notes: '',
    isMain: b.isMain,
  })),
)

const activeTiendaId = computed(() => userStore.mainBranch?.id ?? tiendas.value[0]?.id ?? null)

function openCreate() {
  drawerMode.value = 'create'
  editingId.value = null
  tiendaForm.value = {
    name: '',
    businessType: null,
    address: '',
    city: '',
    manager: '',
    phone: '',
    status: 'opening',
    staff: 4,
    monthlyClients: 800,
    notes: '',
  }
  drawerOpen.value = true
}

function openEdit(t: Tienda) {
  drawerMode.value = 'edit'
  editingId.value = t.id
  tiendaForm.value = { ...t }
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
}

async function saveTienda() {
  const f = tiendaForm.value
  if (!f.name?.trim()) {
    ui.showToast({ title: 'Necesitas un nombre para la tienda', tone: 'warning' })
    return
  }
  savingTienda.value = true
  try {
    if (drawerMode.value === 'create') {
      const res = await tiendaService.create({
        name: f.name,
        businessType: f.businessType,
        address: f.address,
        city: f.city,
        manager: f.manager,
        phone: f.phone,
        status: f.status,
        staff: f.staff,
        monthlyClients: f.monthlyClients,
        notes: f.notes,
      })
      await userStore.fetchWorkspace()
      const t = res.data
      ui.showToast({
        title: 'Tienda agregada',
        message: `${t.name} ya está activa en tu workspace.`,
        tone: 'success',
        icon: 'fa-solid fa-store',
      })
    } else if (editingId.value) {
      await tiendaService.update(editingId.value, {
        name: f.name,
        businessType: f.businessType,
        address: f.address,
        city: f.city,
        manager: f.manager,
        phone: f.phone,
        status: f.status,
        staff: f.staff,
        monthlyClients: f.monthlyClients,
        notes: f.notes,
      })
      await userStore.fetchWorkspace()
      ui.showToast({ title: 'Tienda actualizada', tone: 'success' })
    }
    closeDrawer()
  } catch {
    ui.showToast({
      title: 'No se pudo guardar la tienda',
      tone: 'error',
    })
  } finally {
    savingTienda.value = false
  }
}

async function deleteTienda(t: Tienda) {
  if (tiendas.value.length <= 1) {
    ui.showToast({
      title: 'No puedes eliminar la única tienda',
      message: 'Crea otra antes de borrar esta.',
      tone: 'warning',
    })
    return
  }
  const ok = await ui.requestConfirm({
    title: `¿Eliminar "${t.name}"?`,
    message: 'Se perderán sus datos demo de operación. Esta acción no se puede deshacer.',
    confirmLabel: 'Sí, eliminar',
    cancelLabel: 'Cancelar',
    tone: 'danger',
    icon: 'fa-solid fa-trash',
  })
  if (!ok) return
  try {
    await tiendaService.remove(t.id)
    await userStore.fetchWorkspace()
    ui.showToast({ title: 'Tienda eliminada', tone: 'info' })
  } catch {
    ui.showToast({ title: 'No se pudo eliminar la tienda', tone: 'error' })
  }
}

async function setMain(t: Tienda) {
  try {
    await tiendaService.setMain(t.id)
    await userStore.fetchWorkspace()
    ui.showToast({ title: `${t.name} es ahora tu tienda principal`, tone: 'success' })
  } catch {
    ui.showToast({ title: 'No se pudo cambiar la tienda principal', tone: 'error' })
  }
}

function activate(t: Tienda) {
  ui.showToast({ title: `Mostrando datos de ${t.name}`, tone: 'info', icon: 'fa-solid fa-store' })
}

const totals = computed(() => ({
  count: tiendas.value.length,
  staff: tiendas.value.reduce((sum, t) => sum + (t.staff || 0), 0),
  clients: tiendas.value.reduce((sum, t) => sum + (t.monthlyClients || 0), 0),
  active: tiendas.value.filter((t) => t.status === 'active').length,
}))

function statusMeta(s: Tienda['status']) {
  return statusOptions.find((x) => x.id === s) || statusOptions[0]
}
</script>

<template>
  <div class="workspace-view">
    <AppShell>
    <div class="ws-page">
      <header class="page-head">
        <div>
          <span class="eyebrow"><i class="fa-solid fa-building" /> Workspace</span>
          <h1>Configuración general</h1>
          <p>Edita tu empresa, administra tiendas y controla quién puede entrar con cada rol.</p>
        </div>
        <div class="head-actions">
          <RouterLink to="/modulos" class="btn ghost">
            <i class="fa-solid fa-arrow-left" /> Volver al panel
          </RouterLink>
          <button class="btn ghost" type="button" @click="openCreate">
            <i class="fa-solid fa-store" /> Agregar tienda
          </button>
          <button class="btn primary" type="button" @click="openMemberDrawer">
            <i class="fa-solid fa-user-plus" /> Agregar persona
          </button>
        </div>
      </header>

      <section class="stat-strip">
        <article class="stat">
          <span class="stat-icon primary"><i class="fa-solid fa-store" /></span>
          <div>
            <span>Tiendas totales</span>
            <strong>{{ totals.count }}</strong>
          </div>
        </article>
        <article class="stat">
          <span class="stat-icon success"><i class="fa-solid fa-circle-check" /></span>
          <div>
            <span>Tiendas activas</span>
            <strong>{{ totals.active }}</strong>
          </div>
        </article>
        <article class="stat">
          <span class="stat-icon secondary"><i class="fa-solid fa-users" /></span>
          <div>
            <span>Usuarios con acceso</span>
            <strong>{{ members.length }}</strong>
          </div>
        </article>
        <article class="stat">
          <span class="stat-icon warning"><i class="fa-solid fa-people-group" /></span>
          <div>
            <span>Clientes / mes</span>
            <strong>{{ totals.clients.toLocaleString('en-US') }}</strong>
          </div>
        </article>
      </section>

      <section class="ws-grid">
        <article class="ws-card">
          <header class="card-head">
            <div>
              <h2><i class="fa-solid fa-building" /> Datos del workspace</h2>
              <p>Información legal de tu empresa.</p>
            </div>
            <button v-if="!editing" class="btn ghost sm" type="button" @click="startEditing">
              <i class="fa-solid fa-pen" /> Editar
            </button>
          </header>

          <div v-if="loading" class="ws-loading">
            <div class="ws-spinner" />
            <span>Cargando workspace…</span>
          </div>

          <div v-else-if="loadError && !hasData" class="ws-error">
            <i class="fa-solid fa-circle-exclamation" />
            <span>No se pudo cargar la información del workspace.</span>
            <button class="btn ghost sm" type="button" @click="loadWorkspace">
              <i class="fa-solid fa-rotate" /> Reintentar
            </button>
          </div>

          <div v-else-if="!editing && hasData" class="ws-detail">
            <div class="ws-detail-row">
              <span class="ws-detail-label"><i class="fa-solid fa-tag" /> Nombre legal</span>
              <span class="ws-detail-value">{{ editForm?.legalName }}</span>
            </div>
            <div v-if="editForm?.commercialName" class="ws-detail-row">
              <span class="ws-detail-label"><i class="fa-solid fa-store" /> Nombre comercial</span>
              <span class="ws-detail-value">{{ editForm?.commercialName }}</span>
            </div>
            <div class="ws-detail-row">
              <span class="ws-detail-label"><i class="fa-solid fa-receipt" /> RUC</span>
              <span class="ws-detail-value mono">{{ editForm?.ruc }}</span>
            </div>
            <div class="ws-detail-row">
              <span class="ws-detail-label"><i class="fa-solid fa-globe" /> País</span>
              <span class="ws-detail-value">{{ editForm?.country || '—' }}</span>
            </div>
            <div class="ws-detail-row">
              <span class="ws-detail-label"><i class="fa-solid fa-city" /> Ciudad</span>
              <span class="ws-detail-value">{{ editForm?.city || '—' }}</span>
            </div>
          </div>

          <div v-else class="ws-edit-form">
            <div v-if="editForm" class="ws-edit-fields">
              <div class="field">
                <label class="lbl">Nombre legal <span class="req">*</span></label>
                <input v-model="editForm.legalName" type="text" class="inp" placeholder="Ej: Restaurantes del Sur S.A." />
              </div>
              <div class="field">
                <label class="lbl">Nombre comercial</label>
                <input v-model="editForm.commercialName" type="text" class="inp" placeholder="Ej: La Casa del Ceviche" />
              </div>
              <div class="row-2">
                <div class="field">
                  <label class="lbl">RUC <span class="req">*</span></label>
                  <input v-model="editForm.ruc" type="text" class="inp" placeholder="1234567890001" />
                </div>
                <div class="field">
                  <label class="lbl">País</label>
                  <AppSelect v-model="editForm.country" :options="countryOptions" placeholder="Seleccionar país" icon="fa-solid fa-earth-americas" />
                </div>
              </div>
              <div class="field">
                <label class="lbl">Ciudad</label>
                <input v-model="editForm.city" type="text" class="inp" placeholder="Guayaquil" />
              </div>
              <div class="card-actions">
                <button class="btn ghost" type="button" @click="cancelEditing">Cancelar</button>
                <button class="btn primary" type="button" :disabled="saving" @click="saveWorkspace">
                  <i v-if="saving" class="fa-solid fa-spinner fa-spin" />
                  <i v-else class="fa-solid fa-check" />
                  {{ saving ? 'Guardando…' : 'Guardar cambios' }}
                </button>
              </div>
            </div>
          </div>
        </article>

        <article class="tiendas-card">
          <header class="card-head">
            <div>
              <h2><i class="fa-solid fa-store" /> Tiendas del workspace</h2>
              <p>Cambia entre tiendas para filtrar el contenido del resto del app.</p>
            </div>
            <button v-if="tiendas.length > 0" class="btn primary sm" type="button" @click="openCreate">
              <i class="fa-solid fa-plus" /> Agregar
            </button>
          </header>

          <section v-if="tiendas.length === 0" class="empty-state">
            <div class="es-illust" aria-hidden="true">
              <i class="fa-solid fa-store" />
              <i class="fa-solid fa-lightbulb" />
              <i class="fa-solid fa-plus" />
            </div>
            <h3 class="es-title">Aún no agregaste tiendas</h3>
            <p class="es-msg">
              Tu workspace puede vivir <strong>sin tiendas</strong> mientras es un proyecto en planeación.
              Cuando estés listo para operar, agrega tu primera tienda y desbloquea los módulos.
            </p>
            <div class="es-options">
              <button class="es-card primary" type="button" @click="openCreate">
                <span class="es-card-ico"><i class="fa-solid fa-plus" /></span>
                <div>
                  <strong>Agregar mi primera tienda</strong>
                  <em>Sucursal, dark kitchen, food truck…</em>
                </div>
                <i class="fa-solid fa-arrow-right" />
              </button>
              <div class="es-card ghost">
                <span class="es-card-ico ghost"><i class="fa-solid fa-lightbulb" /></span>
                <div>
                  <strong>Mantener como proyecto</strong>
                  <em>Sigue explorando con datos demo. No bloquea nada.</em>
                </div>
                <span class="es-tag">Activo</span>
              </div>
            </div>
          </section>

          <ul v-else class="tienda-list">
            <li
              v-for="t in tiendas"
              :key="t.id"
              :class="['tienda-row', { active: activeTiendaId === t.id }]"
            >
              <button class="tienda-pick" type="button" @click="activate(t)" :title="`Activar ${t.name}`">
                <span :class="['tienda-ico', t.status]">
                  <i :class="t.businessType === 'cafeteria' ? 'fa-solid fa-mug-hot' : t.businessType === 'pizza' ? 'fa-solid fa-pizza-slice' : t.businessType === 'heladeria' ? 'fa-solid fa-ice-cream' : t.businessType === 'panaderia' ? 'fa-solid fa-bread-slice' : t.businessType === 'bar' ? 'fa-solid fa-martini-glass-citrus' : 'fa-solid fa-store'" />
                </span>
                <div class="tienda-body">
                  <div class="tienda-title">
                    <strong>{{ t.name }}</strong>
                    <span v-if="t.isMain" class="badge main"><i class="fa-solid fa-star" /> Principal</span>
                    <span v-if="activeTiendaId === t.id" class="badge active-b"><i class="fa-solid fa-eye" /> Viendo</span>
                  </div>
                  <div class="tienda-meta">
                    <span><i class="fa-solid fa-location-dot" /> {{ t.address || 'Sin dirección' }}{{ t.city ? ', ' + t.city : '' }}</span>
                    <span><i class="fa-solid fa-user-tie" /> {{ t.manager || 'Sin responsable' }}</span>
                    <span :class="['status-chip', statusMeta(t.status).tone]">
                      <i :class="statusMeta(t.status).icon" /> {{ statusMeta(t.status).label }}
                    </span>
                  </div>
                  <div class="tienda-stats">
                    <span><i class="fa-solid fa-users" /> {{ t.staff }} personal</span>
                    <span><i class="fa-solid fa-people-group" /> {{ t.monthlyClients.toLocaleString('en-US') }} clientes/mes</span>
                  </div>
                </div>
              </button>
              <div class="tienda-actions">
                <button
                  v-if="!t.isMain"
                  type="button"
                  class="row-btn"
                  @click="setMain(t)"
                  title="Marcar como principal"
                >
                  <i class="fa-regular fa-star" />
                </button>
                <button type="button" class="row-btn" @click="openEdit(t)" title="Editar">
                  <i class="fa-solid fa-pen" />
                </button>
                <button
                  type="button"
                  class="row-btn danger"
                  @click="deleteTienda(t)"
                  title="Eliminar"
                  :disabled="tiendas.length <= 1"
                >
                  <i class="fa-solid fa-trash" />
                </button>
              </div>
            </li>
          </ul>

          <button v-if="tiendas.length > 0" class="add-btn" type="button" @click="openCreate">
            <i class="fa-solid fa-plus" />
            <span>
              <strong>Agregar otra tienda</strong>
              <em>Sucursal, dark kitchen, food truck, etc.</em>
            </span>
            <i class="fa-solid fa-arrow-right" />
          </button>
        </article>
      </section>

      <section class="team-card">
        <header class="card-head team-head">
          <div>
            <span class="team-kicker">Accesos del negocio</span>
            <h2><i class="fa-solid fa-people-group" /> Equipo y roles</h2>
            <p>Cada persona inicia sesión con su propio correo. Define qué puede hacer desde su rol.</p>
          </div>
          <button class="btn primary" type="button" @click="openMemberDrawer">
            <i class="fa-solid fa-user-plus" /> Agregar persona
          </button>
        </header>

        <div class="role-guide">
          <span><i class="fa-solid fa-crown" /><strong>Administrador</strong> controla empresa, tiendas y accesos.</span>
          <span><i class="fa-solid fa-user-shield" /><strong>Supervisor</strong> crea y edita equipos.</span>
          <span><i class="fa-solid fa-user-gear" /><strong>Operador</strong> reporta y llena checklists.</span>
        </div>

        <div v-if="membersLoading" class="ws-loading"><div class="ws-spinner" /><span>Cargando equipo…</span></div>
        <div v-else-if="!members.length" class="team-empty">
          <i class="fa-solid fa-user-plus" />
          <strong>Aún no hay personas registradas</strong>
          <button class="btn primary sm" type="button" @click="openMemberDrawer">Agregar la primera</button>
        </div>
        <div v-else class="member-list">
          <article v-for="member in members" :key="member.id" class="member-row">
            <span class="member-avatar">{{ member.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() }}</span>
            <div class="member-info">
              <div class="member-name">
                <strong>{{ member.name }}</strong>
                <span v-if="member.isOwner" class="owner-badge"><i class="fa-solid fa-crown" /> Propietario</span>
              </div>
              <a :href="`mailto:${member.email}`"><i class="fa-solid fa-envelope" /> {{ member.email }}</a>
            </div>
            <div class="member-role">
              <span class="member-role-label">Rol</span>
              <span v-if="member.isOwner" class="admin-role"><i class="fa-solid fa-shield-halved" /> {{ roleLabel(member.role) }}</span>
              <AppSelect
                v-else
                :model-value="member.role"
                :options="roleOptions"
                placeholder="Seleccionar rol"
                icon="fa-solid fa-user-shield"
                @update:model-value="changeMemberRole(member, $event)"
              />
            </div>
            <button v-if="!member.isOwner" class="member-remove" type="button" title="Retirar acceso" @click="removeMember(member)">
              <i class="fa-solid fa-user-minus" />
            </button>
          </article>
        </div>
      </section>
    </div>

    </AppShell>

    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="drawerOpen" class="drawer-backdrop" @click.self="closeDrawer">
          <aside class="drawer" role="dialog" aria-modal="true">
            <header class="drawer-head">
              <span class="drawer-eyebrow">{{ drawerMode === 'create' ? 'Nueva tienda' : 'Editar tienda' }}</span>
              <h2>{{ drawerMode === 'create' ? 'Agregar tienda al workspace' : tiendaForm.name }}</h2>
              <button class="drawer-close" @click="closeDrawer" aria-label="Cerrar"><i class="fa-solid fa-xmark" /></button>
            </header>

            <section class="drawer-body">
              <div class="field">
                <label class="lbl"><i class="fa-solid fa-tag" /> Nombre de la tienda</label>
                <input v-model="tiendaForm.name" type="text" class="inp" placeholder="Sucursal Centro / Dark Kitchen Norte" />
              </div>

              <div class="row-2">
                <div class="field">
                  <label class="lbl"><i class="fa-solid fa-location-dot" /> Dirección</label>
                  <input v-model="tiendaForm.address" type="text" class="inp" placeholder="Av. Amazonas 123" />
                </div>
                <div class="field">
                  <label class="lbl"><i class="fa-solid fa-city" /> Ciudad</label>
                  <input v-model="tiendaForm.city" type="text" class="inp" placeholder="Quito" />
                </div>
              </div>

              <div class="row-2">
                <div class="field">
                  <label class="lbl"><i class="fa-solid fa-user-tie" /> Responsable</label>
                  <input v-model="tiendaForm.manager" type="text" class="inp" placeholder="Nombre del manager" />
                </div>
                <div class="field">
                  <label class="lbl"><i class="fa-solid fa-phone" /> Contacto</label>
                  <input v-model="tiendaForm.phone" type="tel" class="inp" placeholder="+593 ..." />
                </div>
              </div>

              <div class="field">
                <label class="lbl"><i class="fa-solid fa-utensils" /> Tipo de operación</label>
                <div class="biz-grid">
                  <button
                    v-for="b in businessTypes"
                    :key="b.id"
                    type="button"
                    :class="['biz-chip', { active: tiendaForm.businessType === b.id }]"
                    @click="tiendaForm.businessType = b.id"
                  >
                    <i :class="b.icon" />
                    {{ b.label }}
                  </button>
                </div>
              </div>

              <div class="row-2">
                <div class="field">
                  <label class="lbl"><i class="fa-solid fa-users" /> Personal</label>
                  <input v-model.number="tiendaForm.staff" type="number" min="0" class="inp" />
                </div>
                <div class="field">
                  <label class="lbl"><i class="fa-solid fa-people-group" /> Clientes / mes</label>
                  <input v-model.number="tiendaForm.monthlyClients" type="number" min="0" class="inp" />
                </div>
              </div>

              <div class="field">
                <label class="lbl"><i class="fa-solid fa-signal" /> Estado</label>
                <div class="status-grid">
                  <button
                    v-for="s in statusOptions"
                    :key="s.id"
                    type="button"
                    :class="['status-pill', s.tone, { active: tiendaForm.status === s.id }]"
                    @click="tiendaForm.status = s.id"
                  >
                    <i :class="s.icon" /> {{ s.label }}
                  </button>
                </div>
              </div>

              <div class="field">
                <label class="lbl"><i class="fa-solid fa-note-sticky" /> Notas</label>
                <textarea
                  v-model="tiendaForm.notes"
                  class="inp"
                  rows="3"
                  placeholder="Detalles, horarios especiales, observaciones..."
                />
              </div>
            </section>

            <footer class="drawer-foot">
              <button class="btn ghost" type="button" @click="closeDrawer">Cancelar</button>
              <button class="btn primary" type="button" :disabled="savingTienda" @click="saveTienda">
                <i v-if="savingTienda" class="fa-solid fa-spinner fa-spin" />
                <i v-else :class="drawerMode === 'create' ? 'fa-solid fa-plus' : 'fa-solid fa-check'" />
                {{ savingTienda ? 'Guardando…' : drawerMode === 'create' ? 'Crear tienda' : 'Guardar cambios' }}
              </button>
            </footer>
          </aside>
        </div>
      </Transition>

      <Transition name="drawer">
        <div v-if="memberDrawerOpen" class="drawer-backdrop" @click.self="closeMemberDrawer">
          <aside class="drawer member-drawer" role="dialog" aria-modal="true">
            <header class="drawer-head member-drawer-head">
              <span class="drawer-eyebrow">Nuevo acceso</span>
              <h2>Agregar persona al equipo</h2>
              <p>Crearemos una cuenta individual para este workspace.</p>
              <button class="drawer-close" type="button" @click="closeMemberDrawer" aria-label="Cerrar"><i class="fa-solid fa-xmark" /></button>
            </header>
            <section class="drawer-body">
              <div class="member-callout">
                <i class="fa-solid fa-envelope-circle-check" />
                <div><strong>Un correo por persona</strong><span>Este será su usuario para iniciar sesión en Allio.</span></div>
              </div>
              <div class="field">
                <label class="lbl"><i class="fa-solid fa-user" /> Nombre completo</label>
                <input v-model="memberForm.name" type="text" class="inp" placeholder="Ej: Jonathan Pareja" autocomplete="off" />
              </div>
              <div class="field">
                <label class="lbl"><i class="fa-solid fa-envelope" /> Correo electrónico</label>
                <input v-model="memberForm.email" type="email" class="inp" placeholder="persona@restaurante.com" autocomplete="off" />
              </div>
              <div class="field">
                <label class="lbl"><i class="fa-solid fa-key" /> Contraseña inicial</label>
                <div class="password-field">
                  <input v-model="memberForm.password" :type="showMemberPassword ? 'text' : 'password'" class="inp" placeholder="Mínimo 6 caracteres" autocomplete="new-password" />
                  <button type="button" @click="showMemberPassword = !showMemberPassword" :aria-label="showMemberPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                    <i :class="showMemberPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" />
                  </button>
                </div>
              </div>
              <div class="field">
                <label class="lbl"><i class="fa-solid fa-user-shield" /> Rol y permisos</label>
                <AppSelect v-model="memberForm.role" :options="roleOptions" placeholder="Seleccionar rol" icon="fa-solid fa-user-shield" required />
              </div>
              <div class="selected-role-note">
                <i :class="memberForm.role === 'supervisor' ? 'fa-solid fa-user-shield' : 'fa-solid fa-user-gear'" />
                <span>{{ roleOptions.find((option) => option.value === memberForm.role)?.hint }}</span>
              </div>
            </section>
            <footer class="drawer-foot">
              <button class="btn ghost" type="button" @click="closeMemberDrawer">Cancelar</button>
              <button class="btn primary" type="button" :disabled="savingMember" @click="saveMember">
                <i :class="savingMember ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-user-plus'" />
                {{ savingMember ? 'Creando acceso…' : 'Crear acceso' }}
              </button>
            </footer>
          </aside>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.ws-page {
  padding: 24px 28px 60px;
  display: flex; flex-direction: column; gap: 22px;
  @media (max-width: 720px) { padding: 18px 16px 60px; }
}

.eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.68rem; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;
  color: $primary;
  background: rgba($primary, 0.1);
  padding: 4px 10px; border-radius: 999px;
}

.page-head {
  display: flex; justify-content: space-between; align-items: flex-end;
  gap: 16px; flex-wrap: wrap;
  h1 { margin: 6px 0 4px; font-size: clamp(1.4rem, 1.5vw + 1rem, 1.9rem); font-weight: 800; color: $primary-dark; }
  p { margin: 0; font-size: 0.92rem; color: $text-secondary; line-height: 1.5; max-width: 540px; }
}
.head-actions { display: inline-flex; gap: 8px; flex-wrap: wrap; }
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 16px; border-radius: 12px;
  font-family: $font-principal; font-weight: 700; font-size: 0.88rem;
  border: none; cursor: pointer; text-decoration: none;
  transition: transform 0.15s, background 0.2s;
  &:active:not(:disabled) { transform: scale(0.97); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &.sm { padding: 8px 12px; font-size: 0.8rem; }
}
.btn.primary {
  background: linear-gradient(135deg, $primary, $secondary); color: white;
  box-shadow: 0 8px 20px rgba($primary, 0.28);
}
.btn.ghost {
  background: rgba($primary-dark, 0.06); color: $primary-dark;
  &:hover { background: rgba($primary-dark, 0.12); }
}

.stat-strip {
  display: grid; gap: 12px;
  grid-template-columns: 1fr 1fr;
  @media (min-width: 720px) { grid-template-columns: repeat(4, 1fr); }
}
.stat {
  display: flex; align-items: center; gap: 12px;
  background: white; border: 1px solid rgba($primary-dark, 0.05);
  border-radius: 16px; padding: 14px 16px;
  > div {
    display: flex; flex-direction: column;
    span { font-size: 0.7rem; color: $text-secondary; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
    strong { font-size: 1.2rem; font-weight: 800; color: $primary-dark; line-height: 1.2; }
  }
}
.stat-icon {
  width: 42px; height: 42px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; font-size: 1.05rem;
  flex-shrink: 0;
  &.primary { background: rgba($primary, 0.1); color: $primary; }
  &.secondary { background: rgba($secondary, 0.14); color: darken($secondary, 8%); }
  &.success { background: rgba($alert-success, 0.14); color: $alert-success; }
  &.warning { background: rgba($alert-warning, 0.16); color: darken($alert-warning, 8%); }
}

.ws-grid {
  display: grid; gap: 16px;
  grid-template-columns: 1fr;
  @media (min-width: 1024px) { grid-template-columns: 0.85fr 1.15fr; }
}

.ws-card, .tiendas-card, .team-card {
  background: white;
  border: 1px solid rgba($primary-dark, 0.05);
  border-radius: 22px;
  padding: 22px;
  display: flex; flex-direction: column; gap: 18px;
}
.team-card { background: linear-gradient(145deg, white, rgba($bg, 0.68)); border-color: rgba($primary, 0.18); }
.team-head { align-items: center; }
.team-kicker { display: block; margin-bottom: 5px; color: $primary; font-size: 0.64rem; font-weight: 900; letter-spacing: 0.9px; text-transform: uppercase; }
.role-guide { display: flex; gap: 10px; flex-wrap: wrap; span { flex: 1 1 220px; min-height: 46px; padding: 10px 12px; border-radius: 14px; background: rgba($primary, 0.07); color: $primary-dark; display: flex; align-items: center; gap: 7px; font-size: 0.76rem; line-height: 1.35; i { color: $primary; } strong { white-space: nowrap; } } }
.member-list { display: flex; flex-direction: column; gap: 10px; }
.member-row { position: relative; padding: 14px; border-radius: 17px; border: 1px solid rgba($primary-dark, 0.08); background: white; display: grid; grid-template-columns: 48px minmax(180px, 1fr) minmax(250px, 330px) 40px; align-items: center; gap: 12px; @media (max-width: 760px) { grid-template-columns: 44px 1fr 40px; .member-role { grid-column: 1 / -1; } } }
.member-avatar { width: 48px; height: 48px; border-radius: 16px; display: grid; place-items: center; background: linear-gradient(135deg, $primary-dark, $primary); color: white; font-size: 0.82rem; font-weight: 900; }
.member-info { min-width: 0; display: flex; flex-direction: column; gap: 5px; a { width: fit-content; max-width: 100%; color: $primary; font-size: 0.78rem; font-weight: 750; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; i { margin-right: 4px; } } }
.member-name { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; strong { color: $primary-dark; font-size: 0.92rem; font-weight: 900; } }
.owner-badge { padding: 4px 7px; border-radius: 999px; background: rgba($accent, 0.2); color: $primary-dark; font-size: 0.62rem; font-weight: 900; text-transform: uppercase; i { color: darken($accent, 15%); } }
.member-role { min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.member-role-label { color: $primary; font-size: 0.62rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.6px; }
.admin-role { min-height: 48px; padding: 10px 13px; border-radius: 14px; background: rgba($primary-dark, 0.08); color: $primary-dark; display: flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 850; i { color: $primary; } }
.member-remove { width: 40px; height: 40px; border: none; border-radius: 13px; background: rgba($alert-error, 0.08); color: $alert-error; cursor: pointer; &:hover { background: rgba($alert-error, 0.16); } }
.team-empty { min-height: 140px; padding: 24px; border-radius: 18px; background: rgba($primary, 0.07); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: $primary-dark; i { color: $primary; font-size: 1.8rem; } }
.card-head {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
  h2 { margin: 0; font-size: 1rem; font-weight: 800; color: $primary-dark; display: inline-flex; align-items: center; gap: 8px;
    i { color: $primary; }
  }
  p { margin: 4px 0 0; font-size: 0.82rem; color: $text-secondary; line-height: 1.45; }
}

.field { display: flex; flex-direction: column; gap: 6px; }
.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  @media (max-width: 540px) { grid-template-columns: 1fr; }
}
.lbl {
  font-size: 0.7rem; font-weight: 800; letter-spacing: 0.4px; text-transform: uppercase;
  color: $text-secondary;
  display: inline-flex; align-items: center; gap: 6px;
  i { color: $primary; }
}
.inp {
  width: 100%; padding: 13px 14px;
  border: 2px solid rgba($primary-dark, 0.08); border-radius: 12px;
  font-size: 0.9rem; font-family: $font-principal; background: white;
  outline: none; resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
}

.card-actions { display: flex; justify-content: flex-end; gap: 8px; }

.ws-loading { display: flex; align-items: center; gap: 10px; padding: 20px 0; color: $text-secondary; font-size: 0.88rem; }
.ws-spinner { width: 20px; height: 20px; border: 2px solid rgba($primary, 0.15); border-top-color: $primary; border-radius: 50%; animation: ws-spin 0.7s linear infinite; }
@keyframes ws-spin { to { transform: rotate(360deg); } }

.ws-error { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 20px 0; color: $text-secondary; font-size: 0.88rem; i { font-size: 1.3rem; color: $alert-warning; } }

.ws-edit-fields { display: flex; flex-direction: column; gap: 14px; }

.ws-detail { display: flex; flex-direction: column; gap: 0; }
.ws-detail-row {
  display: flex; align-items: center; padding: 10px 0;
  border-bottom: 1px solid rgba($primary-dark, 0.04);
  &:last-child { border-bottom: none; }
}
.ws-detail-label {
  width: 140px; flex-shrink: 0;
  font-size: 0.75rem; font-weight: 700; color: $text-secondary;
  display: flex; align-items: center; gap: 6px;
  i { color: $primary; width: 14px; text-align: center; }
}
.ws-detail-value {
  font-size: 0.9rem; font-weight: 700; color: $primary-dark;
  &.mono { font-family: monospace; letter-spacing: 1px; }
}

.ws-edit-form { display: flex; flex-direction: column; gap: 14px; }

/* ===== Tiendas list ===== */
.tienda-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.tienda-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  background: #fbfcfe;
  border: 1px solid rgba($primary-dark, 0.06);
  border-radius: 16px;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;

  &:hover { border-color: rgba($primary, 0.3); box-shadow: 0 14px 28px rgba($primary, 0.08); }
  &.active {
    border-color: $primary;
    background: linear-gradient(180deg, rgba($primary, 0.05), white);
    box-shadow: 0 12px 28px rgba($primary, 0.14);
  }
}
.tienda-pick {
  display: grid; grid-template-columns: 52px 1fr; gap: 12px; align-items: center;
  padding: 14px; border: none; background: transparent;
  cursor: pointer; font-family: $font-principal; text-align: left;
}
.tienda-ico {
  width: 52px; height: 52px; border-radius: 14px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1.3rem; background: rgba($primary, 0.1); color: $primary;
  &.active { background: rgba($alert-success, 0.15); color: darken($alert-success, 10%); }
  &.paused { background: rgba($alert-warning, 0.18); color: darken($alert-warning, 10%); }
  &.opening { background: rgba($secondary, 0.18); color: darken($secondary, 10%); }
}
.tienda-body { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.tienda-title { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap;
  strong { font-size: 0.98rem; color: $primary-dark; font-weight: 800; }
}
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.62rem; font-weight: 800; letter-spacing: 0.5px;
  padding: 3px 8px; border-radius: 8px;
  &.main { background: rgba(245, 158, 11, 0.15); color: #b45309; }
  &.active-b { background: linear-gradient(135deg, $primary, $secondary); color: white; }
}
.tienda-meta, .tienda-stats { display: inline-flex; gap: 10px; flex-wrap: wrap;
  span { font-size: 0.74rem; color: $text-secondary; display: inline-flex; gap: 4px; align-items: center;
    i { color: $primary; }
  }
}
.status-chip {
  font-weight: 700;
  padding: 2px 8px; border-radius: 10px;
  &.green { background: rgba($alert-success, 0.14); color: darken($alert-success, 16%); }
  &.yellow { background: rgba($alert-warning, 0.18); color: darken($alert-warning, 10%); }
  &.blue { background: rgba($primary, 0.14); color: $primary; }
}
.tienda-actions { display: inline-flex; gap: 4px; padding: 12px; align-items: center; }
.row-btn {
  width: 36px; height: 36px; border-radius: 10px;
  border: none; background: white; color: $primary-dark;
  cursor: pointer; font-size: 0.85rem;
  border: 1px solid rgba($primary-dark, 0.08);
  transition: background 0.2s, color 0.2s, border-color 0.2s;
  &:hover { background: rgba($primary, 0.08); color: $primary; border-color: rgba($primary, 0.3); }
  &.danger:hover { background: rgba($alert-error, 0.1); color: $alert-error; border-color: rgba($alert-error, 0.3); }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
}

.add-btn {
  display: grid; grid-template-columns: 36px 1fr 20px; align-items: center; gap: 12px;
  padding: 14px; border-radius: 16px;
  border: 2px dashed rgba($primary, 0.4);
  background: rgba($primary, 0.04);
  color: $primary-dark;
  font-family: $font-principal; cursor: pointer; text-align: left;
  &:hover { background: rgba($primary, 0.08); }
  > i:first-child {
    width: 36px; height: 36px; border-radius: 10px;
    background: $primary; color: white;
    display: inline-flex; align-items: center; justify-content: center;
  }
  > span { display: flex; flex-direction: column; line-height: 1.2;
    strong { font-size: 0.92rem; font-weight: 800; }
    em { font-style: normal; font-size: 0.74rem; color: $text-secondary; }
  }
  > i:last-child { color: $primary; }
}

/* ===== Empty state ===== */
.empty-state {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  gap: 14px; padding: 32px 18px;
  background: linear-gradient(180deg, rgba(245, 158, 11, 0.06), white);
  border: 1px dashed rgba(245, 158, 11, 0.5);
  border-radius: 18px;
}
.es-illust {
  position: relative;
  width: 72px; height: 72px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 22px;
  background: linear-gradient(135deg, #f59e0b, #fb923c);
  color: white;
  font-size: 1.8rem;
  box-shadow: 0 12px 28px rgba(245, 158, 11, 0.35);
  > i:nth-child(2) {
    position: absolute; top: -6px; right: -6px;
    width: 28px; height: 28px;
    background: white; color: #f59e0b;
    border-radius: 50%; font-size: 0.75rem;
    display: inline-flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
  }
  > i:nth-child(3) {
    position: absolute; bottom: -4px; right: -4px;
    width: 22px; height: 22px;
    background: $primary; color: white;
    border-radius: 50%; font-size: 0.62rem;
    display: inline-flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 10px rgba($primary, 0.45);
  }
  > i:nth-child(1) {
    position: relative;
  }
}
.es-title { margin: 0; font-size: 1.1rem; font-weight: 800; color: $primary-dark; }
.es-msg {
  margin: 0; font-size: 0.88rem; color: $text-secondary; line-height: 1.55; max-width: 460px;
  strong { color: $primary-dark; }
}
.es-options {
  width: 100%; max-width: 540px;
  display: grid; gap: 10px; margin-top: 4px;
}
.es-card {
  display: grid; grid-template-columns: 44px 1fr auto;
  align-items: center; gap: 12px;
  padding: 14px 16px; border-radius: 14px;
  border: none; cursor: pointer;
  font-family: $font-principal; text-align: left;
  strong { font-size: 0.95rem; font-weight: 800; display: block; line-height: 1.2; }
  em { font-style: normal; font-size: 0.78rem; color: $text-secondary; }

  &.primary {
    background: linear-gradient(135deg, $primary, $secondary);
    color: white;
    box-shadow: 0 12px 26px rgba($primary, 0.3);
    transition: transform 0.2s;
    em { color: rgba(255,255,255,0.78); }
    &:hover { transform: translateY(-1px); }
  }
  &.ghost {
    background: white; color: $primary-dark;
    border: 1.5px dashed rgba($primary-dark, 0.18);
    cursor: default;
  }
}
.es-card-ico {
  width: 44px; height: 44px; border-radius: 12px;
  background: rgba(255,255,255,0.18); color: white;
  display: inline-flex; align-items: center; justify-content: center; font-size: 1.05rem;
  &.ghost {
    background: rgba(245, 158, 11, 0.12); color: #b45309;
  }
}
.es-tag {
  font-size: 0.62rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;
  background: rgba($alert-success, 0.14); color: $alert-success;
  padding: 4px 8px; border-radius: 999px;
}

/* ===== Drawer ===== */
.drawer-backdrop {
  position: fixed; inset: 0;
  background: rgba($primary-dark, 0.55);
  backdrop-filter: blur(4px);
  display: flex; justify-content: flex-end;
  z-index: 9990;
}
.drawer {
  width: 100%; max-width: 520px;
  height: 100%;
  background: white;
  display: flex; flex-direction: column;
  box-shadow: -20px 0 60px rgba($primary-dark, 0.25);
  font-family: $font-principal;
}
.drawer-head {
  padding: 22px;
  border-bottom: 1px solid rgba($primary-dark, 0.05);
  background: linear-gradient(135deg, rgba($primary, 0.08), white);
  position: relative;
  h2 { margin: 6px 0 0; font-size: 1.2rem; font-weight: 800; color: $primary-dark; }
}
.member-drawer-head p { margin: 6px 48px 0 0; color: $primary-dark; font-size: 0.8rem; line-height: 1.4; }
.member-callout { padding: 14px; border-radius: 16px; background: rgba($accent, 0.17); color: $primary-dark; display: flex; align-items: center; gap: 12px; > i { width: 42px; height: 42px; border-radius: 13px; display: grid; place-items: center; background: $accent; font-size: 1.1rem; } div { display: flex; flex-direction: column; gap: 3px; } strong { font-size: 0.86rem; } span { font-size: 0.76rem; line-height: 1.4; } }
.password-field { position: relative; display: flex; .inp { padding-right: 50px; } button { position: absolute; right: 6px; top: 6px; width: 38px; height: 38px; border: none; border-radius: 10px; background: rgba($primary, 0.09); color: $primary; cursor: pointer; } }
.selected-role-note { padding: 12px; border-radius: 14px; background: rgba($primary, 0.08); color: $primary-dark; display: flex; align-items: center; gap: 10px; font-size: 0.78rem; line-height: 1.45; i { color: $primary; font-size: 1rem; } }
.drawer-eyebrow {
  display: inline-block;
  font-size: 0.62rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: $primary;
}
.drawer-close {
  position: absolute; top: 18px; right: 18px;
  width: 36px; height: 36px; border-radius: 10px;
  border: none; cursor: pointer;
  background: rgba($primary-dark, 0.06); color: $primary-dark;
  font-size: 0.85rem;
  &:hover { background: rgba($primary-dark, 0.12); }
}
.drawer-body {
  flex: 1; overflow-y: auto;
  padding: 22px;
  display: flex; flex-direction: column; gap: 16px;
}

.biz-grid {
  display: grid; gap: 8px;
  grid-template-columns: repeat(2, 1fr);
  @media (min-width: 480px) { grid-template-columns: repeat(3, 1fr); }
}
.biz-chip {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 11px; border-radius: 12px;
  background: white; border: 2px solid rgba($primary-dark, 0.08);
  cursor: pointer; font-family: $font-principal; font-weight: 700;
  color: $primary-dark; font-size: 0.8rem;
  i { color: $primary; }
  &.active { border-color: $primary; background: rgba($primary, 0.06); }
}

.status-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.status-pill {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px; border-radius: 12px;
  border: 2px solid rgba($primary-dark, 0.08); background: white;
  cursor: pointer; font-family: $font-principal; font-weight: 700; font-size: 0.78rem;
  color: $primary-dark;
  &.active {
    &.green { border-color: $alert-success; background: rgba($alert-success, 0.1); color: darken($alert-success, 14%); }
    &.yellow { border-color: $alert-warning; background: rgba($alert-warning, 0.12); color: darken($alert-warning, 10%); }
    &.blue { border-color: $primary; background: rgba($primary, 0.1); color: $primary; }
  }
}

.drawer-foot {
  display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px;
  padding: 16px 22px 22px;
  border-top: 1px solid rgba($primary-dark, 0.05);
}

.drawer-enter-active, .drawer-leave-active { transition: opacity 0.25s; }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-active .drawer, .drawer-leave-active .drawer {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.drawer-enter-from .drawer, .drawer-leave-to .drawer { transform: translateX(40px); }
</style>
