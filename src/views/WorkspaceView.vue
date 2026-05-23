<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import AppShell from '@/layout/AppShell.vue'
import { useOnboardingStore, type Tienda, type CurrencyCode, CURRENCY_SYMBOLS, PAIN_POINTS } from '@/stores/onboarding'
import { useUserStore } from '@/stores/user'
import { useUIStore } from '@/stores/ui'

const router = useRouter()
const store = useOnboardingStore()
const userStore = useUserStore()
const ui = useUIStore()

onMounted(() => {
  store.ensureMainTienda()
  userStore.hydrate()
  document.title = 'Workspace · Rentabilidad360'
})

// === Workspace form ===
const projectName = ref(store.projectName)
const currency = ref<CurrencyCode>(store.currency)
const painPoints = ref<string[]>([...store.painPoints])

watch(() => store.projectName, (v) => { projectName.value = v })
watch(() => store.currency, (v) => { currency.value = v })

const currencies: { code: CurrencyCode; label: string }[] = [
  { code: 'USD', label: 'USD' },
  { code: 'MXN', label: 'MXN' },
  { code: 'EUR', label: 'EUR' },
  { code: 'COP', label: 'COP' },
]

function togglePain(id: string) {
  const idx = painPoints.value.indexOf(id)
  if (idx >= 0) painPoints.value.splice(idx, 1)
  else painPoints.value.push(id)
}

function saveWorkspace() {
  if (!projectName.value.trim()) {
    ui.showToast({ title: 'El nombre del workspace es obligatorio', tone: 'warning' })
    return
  }
  store.projectName = projectName.value.trim()
  store.currency = currency.value
  store.painPoints = painPoints.value as any
  ui.showToast({ title: 'Workspace actualizado', tone: 'success', icon: 'fa-solid fa-circle-check' })
}

// === Tienda editor drawer ===
const drawerOpen = ref(false)
const drawerMode = ref<'create' | 'edit'>('create')
const editingId = ref<string | null>(null)

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
  businessType: store.businessType,
  address: '',
  city: '',
  manager: '',
  phone: '',
  status: 'opening',
  staff: 4,
  monthlyClients: 800,
  notes: '',
})

function openCreate() {
  drawerMode.value = 'create'
  editingId.value = null
  tiendaForm.value = {
    name: '',
    businessType: store.businessType,
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

function saveTienda() {
  const f = tiendaForm.value
  if (!f.name?.trim()) {
    ui.showToast({ title: 'Necesitas un nombre para la tienda', tone: 'warning' })
    return
  }
  if (drawerMode.value === 'create') {
    const t = store.addTienda(f)
    ui.showToast({
      title: 'Tienda agregada',
      message: `${t.name} ya está activa en tu workspace.`,
      tone: 'success',
      icon: 'fa-solid fa-store',
    })
  } else if (editingId.value) {
    store.updateTienda(editingId.value, f)
    ui.showToast({ title: 'Tienda actualizada', tone: 'success' })
  }
  closeDrawer()
}

async function deleteTienda(t: Tienda) {
  if (store.tiendas.length <= 1) {
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
  store.removeTienda(t.id)
  ui.showToast({ title: 'Tienda eliminada', tone: 'info' })
}

function setMain(t: Tienda) {
  store.tiendas.forEach((x) => store.updateTienda(x.id, { isMain: x.id === t.id }))
  ui.showToast({ title: `${t.name} es ahora tu tienda principal`, tone: 'success' })
}

function activate(t: Tienda) {
  store.setActiveTienda(t.id)
  ui.showToast({ title: `Mostrando datos de ${t.name}`, tone: 'info', icon: 'fa-solid fa-store' })
}

const totals = computed(() => ({
  count: store.tiendas.length,
  staff: store.tiendas.reduce((s, t) => s + (t.staff || 0), 0),
  clients: store.tiendas.reduce((s, t) => s + (t.monthlyClients || 0), 0),
  active: store.tiendas.filter((t) => t.status === 'active').length,
}))

function statusMeta(s: Tienda['status']) {
  return statusOptions.find((x) => x.id === s) || statusOptions[0]
}
</script>

<template>
  <AppShell>
    <div class="ws-page">
      <header class="page-head">
        <div>
          <span class="eyebrow"><i class="fa-solid fa-building" /> Workspace</span>
          <h1>Configuración general</h1>
          <p>Edita los datos de tu empresa, gestiona tus tiendas y elige qué dolores priorizar.</p>
        </div>
        <div class="head-actions">
          <RouterLink to="/modulos" class="btn ghost">
            <i class="fa-solid fa-arrow-left" /> Volver al panel
          </RouterLink>
          <button class="btn primary" type="button" @click="openCreate">
            <i class="fa-solid fa-plus" /> Agregar tienda
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
            <span>Personal estimado</span>
            <strong>{{ totals.staff }}</strong>
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
            <h2><i class="fa-solid fa-gear" /> Datos del workspace</h2>
            <p>Estos datos se aplican a todas tus tiendas.</p>
          </header>

          <div class="field">
            <label class="lbl"><i class="fa-solid fa-tag" /> Nombre del workspace</label>
            <input v-model="projectName" type="text" class="inp" placeholder="Ej: Grupo La Esquina" />
          </div>

          <div class="field">
            <label class="lbl"><i class="fa-solid fa-dollar-sign" /> Moneda principal</label>
            <div class="cur-grid">
              <button
                v-for="c in currencies"
                :key="c.code"
                type="button"
                :class="['cur-chip', { active: currency === c.code }]"
                @click="currency = c.code"
              >
                <strong>{{ CURRENCY_SYMBOLS[c.code] }}</strong>
                {{ c.label }}
              </button>
            </div>
          </div>

          <div class="field">
            <label class="lbl"><i class="fa-solid fa-heart-pulse" /> Dolores activos</label>
            <div class="pain-list">
              <button
                v-for="p in PAIN_POINTS"
                :key="p.id"
                type="button"
                :class="['pain-chip', { active: painPoints.includes(p.id) }]"
                @click="togglePain(p.id)"
              >
                <span class="p-ico"><i :class="p.icon" /></span>
                <span class="p-txt">
                  <strong>{{ p.title }}</strong>
                  <em>{{ p.ctaLabel }}</em>
                </span>
                <i :class="painPoints.includes(p.id) ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
              </button>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn primary" type="button" @click="saveWorkspace">
              <i class="fa-solid fa-check" /> Guardar workspace
            </button>
          </div>
        </article>

        <article class="tiendas-card">
          <header class="card-head">
            <div>
              <h2><i class="fa-solid fa-store" /> Tiendas del workspace</h2>
              <p>Cambia entre tiendas para filtrar el contenido del resto del app.</p>
            </div>
            <button class="btn primary sm" type="button" @click="openCreate">
              <i class="fa-solid fa-plus" /> Agregar
            </button>
          </header>

          <ul class="tienda-list">
            <li
              v-for="t in store.tiendas"
              :key="t.id"
              :class="['tienda-row', { active: store.activeTiendaId === t.id }]"
            >
              <button class="tienda-pick" type="button" @click="activate(t)" :title="`Activar ${t.name}`">
                <span :class="['tienda-ico', t.status]">
                  <i :class="t.businessType === 'cafeteria' ? 'fa-solid fa-mug-hot' : t.businessType === 'pizza' ? 'fa-solid fa-pizza-slice' : t.businessType === 'heladeria' ? 'fa-solid fa-ice-cream' : t.businessType === 'panaderia' ? 'fa-solid fa-bread-slice' : t.businessType === 'bar' ? 'fa-solid fa-martini-glass-citrus' : 'fa-solid fa-store'" />
                </span>
                <div class="tienda-body">
                  <div class="tienda-title">
                    <strong>{{ t.name }}</strong>
                    <span v-if="t.isMain" class="badge main"><i class="fa-solid fa-star" /> Principal</span>
                    <span v-if="store.activeTiendaId === t.id" class="badge active-b"><i class="fa-solid fa-eye" /> Viendo</span>
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
                  :disabled="store.tiendas.length <= 1"
                >
                  <i class="fa-solid fa-trash" />
                </button>
              </div>
            </li>
          </ul>

          <button class="add-btn" type="button" @click="openCreate">
            <i class="fa-solid fa-plus" />
            <span>
              <strong>Agregar otra tienda</strong>
              <em>Sucursal, dark kitchen, food truck, etc.</em>
            </span>
            <i class="fa-solid fa-arrow-right" />
          </button>
        </article>
      </section>
    </div>

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
              <button class="btn primary" type="button" @click="saveTienda">
                <i :class="drawerMode === 'create' ? 'fa-solid fa-plus' : 'fa-solid fa-check'" />
                {{ drawerMode === 'create' ? 'Crear tienda' : 'Guardar cambios' }}
              </button>
            </footer>
          </aside>
        </div>
      </Transition>
    </Teleport>
  </AppShell>
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
  background: linear-gradient(135deg, $primary, #1678b0); color: white;
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
  span { font-size: 0.7rem; color: $text-secondary; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; display: block; }
  strong { font-size: 1.2rem; font-weight: 800; color: $primary-dark; }
}
.stat-icon {
  width: 38px; height: 38px; border-radius: 12px;
  display: inline-flex; align-items: center; justify-content: center; font-size: 1rem;
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

.ws-card, .tiendas-card {
  background: white;
  border: 1px solid rgba($primary-dark, 0.05);
  border-radius: 22px;
  padding: 22px;
  display: flex; flex-direction: column; gap: 18px;
}
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

.cur-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
}
.cur-chip {
  display: inline-flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 10px 8px; border-radius: 12px;
  background: white; border: 2px solid rgba($primary-dark, 0.08);
  font-family: $font-principal; font-weight: 700; font-size: 0.78rem;
  color: $primary-dark; cursor: pointer; transition: all 0.2s;
  strong { font-size: 1.05rem; color: $primary; }
  &.active { border-color: $primary; background: rgba($primary, 0.06); }
}

.pain-list { display: flex; flex-direction: column; gap: 8px; }
.pain-chip {
  display: grid; grid-template-columns: 38px 1fr 18px; gap: 10px; align-items: center;
  padding: 10px 12px; border-radius: 12px; background: white;
  border: 2px solid rgba($primary-dark, 0.08);
  cursor: pointer; font-family: $font-principal; text-align: left;
  &.active {
    border-color: $primary; background: rgba($primary, 0.05);
    .p-ico { background: $primary; color: white; }
    > i:last-child { color: $primary; }
  }
  > i:last-child { color: rgba($primary-dark, 0.2); }
}
.p-ico {
  width: 38px; height: 38px; border-radius: 11px;
  background: rgba($primary, 0.1); color: $primary;
  display: inline-flex; align-items: center; justify-content: center; font-size: 1rem;
  transition: background 0.2s, color 0.2s;
}
.p-txt { display: inline-flex; flex-direction: column; line-height: 1.2;
  strong { font-size: 0.85rem; font-weight: 700; color: $primary-dark; }
  em { font-style: normal; font-size: 0.7rem; color: $text-secondary; }
}

.card-actions { display: flex; justify-content: flex-end; }

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
