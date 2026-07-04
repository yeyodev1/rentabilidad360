<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, RouterLink, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useUIStore } from '@/stores/ui'
import NavPreview from '@/components/NavPreview.vue'
import WorkspaceSettingsModal from '@/components/WorkspaceSettingsModal.vue'
import AccountSettingsModal from '@/components/AccountSettingsModal.vue'

type NavKind = 'diagnostico' | 'mantenimiento' | 'costeo'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const ui = useUIStore()

const sidebarOpen = ref(false)
const wsModalOpen = ref(false)
const acModalOpen = ref(false)
const userMenuOpen = ref(false)
const tiendaMenuOpen = ref(false)

function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.user-pill-wrap')) userMenuOpen.value = false
  if (!target.closest('.tienda-switcher')) tiendaMenuOpen.value = false
}

function goWorkspace() {
  tiendaMenuOpen.value = false
  router.push('/configuracion/workspace')
}

function pickTienda(id: string) {
  const t = userStore.branches.find((x) => x.id === id)
  if (t) {
    tiendaMenuOpen.value = false
    ui.showToast({ title: `Mostrando ${t.name}`, tone: 'info', icon: 'fa-solid fa-store' })
  }
}

onMounted(() => {
  userStore.hydrate()
  if (userStore.isAuthenticated && !userStore.workspaceName) {
    userStore.fetchWorkspace()
  }
  document.addEventListener('click', onDocClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
})

const initials = computed(() => {
  const n = (userStore.name || userStore.email || 'Operador').trim()
  const parts = n.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
  return (parts[0]?.slice(0, 2) || 'OP').toUpperCase()
})

interface NavItem {
  to: string
  matches: string[]
  icon: string
  label: string
  kind: NavKind
  hint: string
  ribbon?: string
}

const nav = computed<NavItem[]>(() => [
  userStore.hasWorkspace
    ? {
        to: '/dashboard',
        matches: ['/dashboard', '/modulos'],
        icon: 'fa-solid fa-house',
        label: 'Inicio',
        kind: 'diagnostico',
        hint: 'Resumen del negocio',
      }
    : {
        to: '/onboarding',
        matches: ['/onboarding'],
        icon: 'fa-solid fa-plug-circle-bolt',
        label: 'Diagnóstico',
        kind: 'diagnostico',
        hint: 'Configurar mi negocio',
        ribbon: 'Empezar',
      },
  { to: '/modulo/costeo', matches: ['/modulo/costeo'], icon: 'fa-solid fa-sack-dollar', label: 'Costeo', kind: 'costeo', hint: 'Platos y precios' },
  { to: '/modulo/mantenimiento', matches: ['/modulo/mantenimiento'], icon: 'fa-solid fa-screwdriver-wrench', label: 'Mantenimiento', kind: 'mantenimiento', hint: 'QR · tickets' },
])

const activeNav = computed(() => {
  const items = [...nav.value].sort((a, b) => b.to.length - a.to.length)
  return items.find((n) => n.matches.some((m) => route.path.startsWith(m)))
})

async function logout() {
  const ok = await ui.requestConfirm({
    title: '¿Cerrar sesión?',
    message: 'Tu diagnóstico se conserva en este dispositivo.',
    confirmLabel: 'Sí, cerrar sesión',
    cancelLabel: 'Quedarme',
    tone: 'danger',
    icon: 'fa-solid fa-right-from-bracket',
  })
  if (!ok) return
  userStore.clear()
  ui.showToast({ title: 'Sesión cerrada', tone: 'success', icon: 'fa-solid fa-door-closed' })
  router.replace('/')
}

function connectData() {
  ui.requestConfirm({
    title: 'Conectar tus datos reales',
    message: 'Abrimos el diagnóstico para reemplazar los números demo por los tuyos.',
    confirmLabel: 'Empezar',
    cancelLabel: 'Más tarde',
    icon: 'fa-solid fa-plug-circle-bolt',
  }).then((ok) => { if (ok) router.push('/diagnostico') })
}

function upgrade() {
  ui.showToast({
    title: 'Te avisaremos cuando esté listo',
    message: 'El plan Premium se libera muy pronto.',
    tone: 'info',
    icon: 'fa-solid fa-crown',
  })
}
</script>

<template>
  <div class="shell">
    <!-- ═══ SIDEBAR (desktop) ═══ -->
    <aside :class="['sidebar', { open: sidebarOpen }]">
      <div class="sidebar-inner">
        <RouterLink to="/" class="brand">
          <span class="brand-mark"><i class="fa-solid fa-chart-pie" /></span>
          <span class="brand-text">
            <strong>Allio</strong>
          </span>
        </RouterLink>

        <div class="workspace">
          <span class="section-label">Workspace</span>
          <button type="button" class="workspace-card" @click="goWorkspace" title="Configurar workspace">
            <span class="ws-avatar">{{ initials }}</span>
            <div class="ws-meta">
              <strong>{{ userStore.workspaceName || 'Mi restaurante' }}</strong>
              <span>{{ userStore.workspaceBranchCount }} {{ userStore.workspaceBranchCount === 1 ? 'sucursal' : 'sucursales' }}</span>
            </div>
            <i class="fa-solid fa-gear ws-gear" />
          </button>

          <!-- Tienda switcher -->
          <div class="tienda-switcher">
            <template v-if="userStore.branches.length > 0">
              <button type="button" :class="['tienda-current', { open: tiendaMenuOpen }]" @click.stop="tiendaMenuOpen = !tiendaMenuOpen">
                <span class="tienda-flag"><i class="fa-solid fa-store" /></span>
                <span class="tienda-text">
                  <em>Viendo</em>
                  <strong>{{ userStore.mainBranch?.name || 'Sin sucursal' }}</strong>
                </span>
                <i class="fa-solid fa-chevron-down chev" />
              </button>
              <Transition name="menu">
                <div v-if="tiendaMenuOpen" class="dropdown-menu" @click.stop>
                  <span class="dropdown-label">Sucursales</span>
                  <button v-for="b in userStore.branches" :key="b.id" type="button" :class="['drop-item', { active: userStore.mainBranch?.id === b.id }]" @click="pickTienda(b.id)">
                    <span class="drop-ico"><i class="fa-solid fa-store" /></span>
                    <span class="drop-meta">
                      <strong>{{ b.name }}</strong>
                      <em>{{ b.address || (b.isMain ? 'Principal' : 'Sucursal') }}</em>
                    </span>
                    <i v-if="userStore.mainBranch?.id === b.id" class="fa-solid fa-circle-check ok" />
                  </button>
                  <div class="drop-divider" />
                  <button type="button" class="drop-action" @click="goWorkspace">
                    <i class="fa-solid fa-gear" /> Gestionar sucursales
                  </button>
                </div>
              </Transition>
            </template>
            <button v-else type="button" class="tienda-empty" @click="goWorkspace">
              <span class="tienda-flag empty"><i class="fa-solid fa-lightbulb" /></span>
              <span class="tienda-text">
                <em>Sin sucursales</em>
                <strong>Configurar</strong>
              </span>
              <i class="fa-solid fa-plus add" />
            </button>
          </div>
        </div>

        <!-- Nav label -->
        <span class="section-label">Módulos</span>
        <nav class="nav">
          <RouterLink
            v-for="n in nav"
            :key="n.kind"
            :to="n.to"
            :class="['nav-item', { active: activeNav?.kind === n.kind }]"
            @click="sidebarOpen = false"
          >
            <NavPreview :kind="n.kind" class="nav-thumb" />
            <span class="nav-text">
              <strong>{{ n.label }}</strong>
              <em>{{ n.hint }}</em>
            </span>
            <span v-if="n.ribbon" class="nav-ribbon">
              <i class="fa-solid fa-bolt" /> {{ n.ribbon }}
            </span>
            <i v-else class="fa-solid fa-chevron-right nav-chev" />
          </RouterLink>
        </nav>

        <!-- Upgrade card -->
        <div class="upgrade-card">
          <span class="upgrade-eyebrow"><i class="fa-solid fa-crown" /> Premium</span>
          <h4>Desbloquea todo</h4>
          <p>Reportes ilimitados, alertas y más.</p>
          <button class="btn-upgrade" @click="upgrade">
            Mejorar plan <i class="fa-solid fa-arrow-right" />
          </button>
        </div>

        <div class="sidebar-foot">
          <button class="foot-btn" @click="connectData">
            <i class="fa-solid fa-plug-circle-bolt" /> Conectar datos
          </button>
          <button class="foot-btn danger" @click="logout">
            <i class="fa-solid fa-right-from-bracket" /> Cerrar sesión
          </button>
        </div>
      </div>
    </aside>

    <!-- Scrim -->
    <div v-if="sidebarOpen" class="scrim" @click="sidebarOpen = false" />

    <!-- ═══ MAIN CONTENT ═══ -->
    <main class="main">
      <header class="topbar">
        <button class="burger" @click="sidebarOpen = true" aria-label="Abrir menú">
          <i class="fa-solid fa-bars" />
        </button>

        <div class="crumbs">
          <RouterLink to="/modulos" class="crumb-home" aria-label="Inicio">
            <i class="fa-solid fa-house" />
          </RouterLink>
          <i class="fa-solid fa-chevron-right sep" />
          <span class="crumb-current">
            <i :class="activeNav?.icon || 'fa-solid fa-grid-2'" />
            {{ activeNav?.label || 'Panel' }}
          </span>
          <span class="ea-badge" title="Algunos módulos están en desarrollo y pueden no estar completamente funcionales.">
            <i class="fa-solid fa-flask" /> Acceso Anticipado
          </span>
          <span v-if="userStore.mainBranch" class="crumb-tienda">
            <i class="fa-solid fa-store" /> {{ userStore.mainBranch.name }}
          </span>
        </div>

        <div class="top-actions">
          <button class="icon-btn" title="Notificaciones" @click="ui.showToast({ title: '3 alertas activas', message: 'Revisa el detalle en cada módulo.', tone: 'warning' })">
            <i class="fa-solid fa-bell" />
            <span class="dot" />
          </button>
          <div class="user-pill-wrap">
            <button type="button" :class="['user-pill', { active: userMenuOpen }]" @click.stop="userMenuOpen = !userMenuOpen">
              <span class="user-avatar">{{ initials }}</span>
              <i class="fa-solid fa-chevron-down user-chev" :class="{ open: userMenuOpen }" />
            </button>
            <Transition name="menu">
              <div v-if="userMenuOpen" class="dropdown-menu right" @click.stop>
                <div class="menu-card">
                  <span class="menu-avatar">{{ initials }}</span>
                  <div class="menu-meta">
                    <strong>{{ userStore.name || 'Operador' }}</strong>
                    <span>{{ userStore.email || 'cuenta demo' }}</span>
                  </div>
                </div>
                <div class="menu-section">
                  <button class="menu-item" type="button" @click="acModalOpen = true; userMenuOpen = false">
                    <i class="fa-solid fa-user-pen" /> Editar perfil
                  </button>
                  <button class="menu-item" type="button" @click="userMenuOpen = false; goWorkspace()">
                    <i class="fa-solid fa-building" /> Configurar workspace
                  </button>
                </div>
                <div class="menu-section">
                  <button class="menu-item danger" type="button" @click="logout(); userMenuOpen = false">
                    <i class="fa-solid fa-right-from-bracket" /> Cerrar sesión
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <div class="page">
        <slot />
      </div>
    </main>

    <!-- ═══ BOTTOM NAV (mobile) ═══ -->
    <nav class="bottom-nav">
      <RouterLink
        v-for="n in nav.slice(0, 5)"
        :key="n.kind"
        :to="n.to"
        :class="['bnav-item', { active: activeNav?.kind === n.kind }]"
      >
        <i :class="n.icon" />
        <span>{{ n.label }}</span>
      </RouterLink>
    </nav>

    <WorkspaceSettingsModal :show="wsModalOpen" @close="wsModalOpen = false" />
    <AccountSettingsModal :show="acModalOpen" @close="acModalOpen = false" />
  </div>
</template>

<style scoped lang="scss">
.shell {
  min-height: 100dvh;
  background: $bg;
  display: grid;
  grid-template-columns: 1fr;
  @media (min-width: $bp-desktop) {
    grid-template-columns: 260px 1fr;
  }
}

/* ═══ SIDEBAR ═══ */
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 260px;
  background: $primary-dark;
  color: $text-light;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 40;
  display: flex;

  &.open { transform: translateX(0); }

  @media (min-width: $bp-desktop) {
    position: sticky;
    top: 0;
    height: 100dvh;
    transform: none;
  }
}

.sidebar-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
  gap: 18px;
  overflow-y: auto;

  &::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
  }
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.brand-mark {
  width: 36px;
  height: 36px;
  background: $primary-gradient;
  color: white;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  box-shadow: 0 6px 16px rgba($primary, 0.35);
}

.brand-text {
  display: inline-flex;
  flex-direction: column;
  line-height: 1;

  strong { font-size: 0.95rem; font-weight: 800; letter-spacing: 0.3px; }
  span { font-size: 0.68rem; color: rgba(255,255,255,0.5); letter-spacing: 1px; }
}

.section-label {
  font-size: 0.6rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  font-weight: 700;
}

/* ── Workspace ── */
.workspace {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.workspace-card {
  display: grid;
  grid-template-columns: 32px 1fr 16px;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: rgba(255,255,255,0.05);
  padding: 10px 12px;
  border-radius: $radius-md;
  border: 1px solid rgba(255,255,255,0.06);
  color: $text-light;
  text-align: left;
  cursor: pointer;
  font-family: $font-principal;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.14);
  }
}

.ws-avatar {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: $primary-gradient;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
}

.ws-meta {
  min-width: 0;
  strong { display: block; font-size: 0.82rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  span { font-size: 0.68rem; color: rgba(255,255,255,0.5); }
}

.ws-gear {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.35);
  transition: opacity 0.2s;
}

.tienda-switcher { position: relative; }

.tienda-current {
  display: grid;
  grid-template-columns: 28px 1fr 12px;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border-radius: $radius-sm;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  color: $text-light;
  font-family: $font-principal;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;

  &:hover { background: rgba(255,255,255,0.07); }
  &.open { background: rgba(255,255,255,0.09); }
}

.tienda-flag {
  width: 28px; height: 28px;
  border-radius: 7px;
  background: rgba($accent, 0.2);
  color: $accent-light;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.tienda-text {
  display: inline-flex;
  flex-direction: column;
  line-height: 1.15;
  min-width: 0;

  em { font-style: normal; font-size: 0.58rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: rgba(255,255,255,0.45); }
  strong { font-size: 0.8rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

.chev { font-size: 0.65rem; color: rgba(255,255,255,0.35); transition: transform 0.2s; }
.tienda-current.open .chev { transform: rotate(180deg); color: white; }

.tienda-empty {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border-radius: $radius-sm;
  background: rgba($accent, 0.08);
  border: 1px dashed rgba($accent, 0.35);
  color: $text-light;
  font-family: $font-principal;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;

  &:hover { background: rgba($accent, 0.15); border-color: $accent; }
  .tienda-flag.empty { background: $accent; color: white; }
  .add { color: $accent-light; font-size: 0.8rem; }
}

/* ── Dropdown menus ── */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0; right: 0;
  background: $surface;
  border-radius: $radius-md;
  box-shadow: $shadow-xl;
  padding: 6px;
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: $font-principal;

  &.right { left: auto; right: 0; width: 240px; }
}

.dropdown-label {
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: $text-secondary;
  padding: 6px 8px 4px;
}

.drop-item {
  display: grid;
  grid-template-columns: 28px 1fr 16px;
  align-items: center;
  gap: 8px;
  padding: 8px 8px;
  border-radius: $radius-sm;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-family: $font-principal;
  color: $text;

  &:hover { background: $primary-bg; }
  &.active { background: $primary-bg; }
}

.drop-ico {
  width: 28px; height: 28px;
  border-radius: 7px;
  background: $primary-bg;
  color: $primary;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.drop-meta {
  display: inline-flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;

  strong { font-size: 0.82rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  em { font-style: normal; font-size: 0.68rem; color: $text-secondary; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

.ok { color: $primary; font-size: 0.8rem; }
.drop-divider { height: 1px; background: $border; margin: 4px 6px; }

.drop-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: $radius-sm;
  border: none;
  background: $primary-bg;
  color: $primary;
  font-family: $font-principal;
  font-weight: 700;
  font-size: 0.78rem;
  cursor: pointer;

  &:hover { background: rgba($primary, 0.14); }
}

/* ── Navigation ── */
.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: $radius-md;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: rgba(255,255,255,0.05);
    color: white;
  }

  &.active {
    background: rgba($primary, 0.35);
    color: white;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
    .nav-chev { color: white; }
  }
}

.nav-thumb { width: 44px; height: 32px; border-radius: 8px; }
.nav-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;

  strong { font-size: 0.82rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  em { font-style: normal; font-size: 0.65rem; color: rgba(255,255,255,0.4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}

.nav-chev { color: rgba(255,255,255,0.2); font-size: 0.68rem; }

.nav-ribbon {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: $accent;
  color: white;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  padding: 3px 7px;
  border-radius: 8px;
  box-shadow: 0 3px 8px rgba($accent, 0.35);

  i { font-size: 0.6rem; }
}

/* ── Upgrade ── */
.upgrade-card {
  margin-top: auto;
  background: linear-gradient(135deg, $primary, darken($primary, 8%));
  border-radius: $radius-lg;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  h4 { margin: 0; font-size: 0.9rem; font-weight: 800; color: white; }
  p { margin: 0; font-size: 0.74rem; opacity: 0.8; line-height: 1.4; color: white; }
}

.upgrade-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: rgba(255,255,255,0.15);
  padding: 3px 8px;
  border-radius: 8px;
  align-self: flex-start;
  color: white;

  i { color: $accent-light; }
}

.btn-upgrade {
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: white;
  color: $primary;
  border: none;
  padding: 9px;
  border-radius: $radius-sm;
  font-family: $font-principal;
  font-weight: 800;
  font-size: 0.78rem;
  cursor: pointer;
  transition: transform 0.15s;

  &:active { transform: scale(0.97); }
}

/* ── Sidebar foot ── */
.sidebar-foot {
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.foot-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px;
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.6);
  font-family: $font-principal;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  border-radius: $radius-sm;
  text-align: left;

  &:hover { background: rgba(255,255,255,0.05); color: white; }
  &.danger:hover { background: rgba($alert-error, 0.15); color: white; }
  i { width: 16px; text-align: center; }
}

/* ── Scrim ── */
.scrim {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 35;
  @media (min-width: $bp-desktop) { display: none; }
}

/* ═══ MAIN ═══ */
.main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding-bottom: 68px;

  @media (min-width: $bp-desktop) {
    padding-bottom: 0;
  }
}

/* ── Topbar ── */
.topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid $border;
  position: sticky;
  top: 0;
  z-index: 20;
}

.burger {
  border: none;
  background: $primary-bg;
  color: $primary;
  width: 36px;
  height: 36px;
  border-radius: $radius-sm;
  cursor: pointer;
  font-size: 0.95rem;

  @media (min-width: $bp-desktop) { display: none; }
}

.crumbs {
  display: none;
  align-items: center;
  gap: 8px;

  @media (min-width: $bp-tablet) { display: inline-flex; }
}

.crumb-home {
  width: 30px; height: 30px;
  border-radius: $radius-sm;
  background: $primary-bg;
  color: $primary;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;

  &:hover { background: rgba($primary, 0.16); }
}

.sep { color: $text-secondary; font-size: 0.65rem; }

.crumb-current {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: $text;
  font-size: 0.85rem;

  i { color: $primary; }
}

.ea-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba($alert-warning, 0.14);
  color: darken($alert-warning, 12%);
  padding: 3px 8px;
  border-radius: $radius-full;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: help;
  i { font-size: 0.6rem; }
}

.crumb-tienda {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 6px;
  background: rgba($primary, 0.1);
  color: $primary;
  padding: 3px 8px;
  border-radius: $radius-full;
  font-size: 0.72rem;
  font-weight: 700;

  i { font-size: 0.68rem; }
}

/* ── Top actions ── */
.top-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.icon-btn {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: $radius-sm;
  background: transparent;
  border: none;
  cursor: pointer;
  color: $text-secondary;
  font-size: 1rem;

  &:hover { background: $primary-bg; color: $primary; }

  .dot {
    position: absolute;
    top: 6px;
    right: 7px;
    width: 7px;
    height: 7px;
    background: $alert-error;
    border-radius: 50%;
    border: 2px solid white;
  }
}

.user-pill-wrap { position: relative; }

.user-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px 3px 3px;
  border-radius: $radius-full;
  background: transparent;
  border: 1px solid transparent;
  font-family: $font-principal;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { background: $primary-bg; }
  &.active { background: $surface; border-color: $border; box-shadow: $shadow-sm; }
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: $primary-gradient;
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.user-chev {
  font-size: 0.65rem;
  color: $text-secondary;
  transition: transform 0.2s;

  &.open { transform: rotate(180deg); color: $primary; }
}

.menu-card {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 10px;
  align-items: center;
  padding: 14px;
  background: $primary-bg;
  border-radius: $radius-sm;
  margin-bottom: 4px;
}

.menu-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: $primary-gradient;
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.85rem;
}

.menu-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong { font-size: 0.85rem; color: $text; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  span { font-size: 0.7rem; color: $text-secondary; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border-radius: $radius-sm;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: $font-principal;
  font-weight: 600;
  font-size: 0.82rem;
  color: $text;
  text-align: left;

  i { color: $primary; width: 16px; text-align: center; }
  &:hover { background: $primary-bg; }

  &.danger { color: $alert-error; i { color: $alert-error; } }
}

/* ── Menu transition ── */
.menu-enter-active, .menu-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.menu-enter-from, .menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.96);
}

/* ── Page ── */
.page {
  flex: 1;
  min-width: 0;
}

/* ═══ BOTTOM NAV (mobile) ═══ */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid $border;
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  z-index: 30;
  padding-bottom: env(safe-area-inset-bottom, 0px);

  @media (min-width: $bp-desktop) {
    display: none;
  }
}

.bnav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 8px;
  flex: 1;
  min-width: 0;
  color: $text-secondary;
  text-decoration: none;
  font-family: $font-principal;
  transition: color 0.2s;
  position: relative;

  i {
    font-size: 1.15rem;
    transition: transform 0.2s;
  }

  span {
    font-size: 0.6rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  &.active {
    color: $primary;
    i { transform: translateY(-1px); }
  }

  &.active::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 3px;
    background: $primary;
    border-radius: 0 0 3px 3px;
  }
}
</style>
