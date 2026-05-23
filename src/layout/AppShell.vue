<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, RouterLink, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useOnboardingStore } from '@/stores/onboarding'
import { useUIStore } from '@/stores/ui'
import NavPreview from '@/components/NavPreview.vue'
import WorkspaceSettingsModal from '@/components/WorkspaceSettingsModal.vue'
import AccountSettingsModal from '@/components/AccountSettingsModal.vue'

type NavKind = 'panel' | 'diagnostico' | 'sanitario' | 'mantenimiento' | 'costeo' | 'horarios'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const store = useOnboardingStore()
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
  store.setActiveTienda(id)
  tiendaMenuOpen.value = false
  const t = store.tiendas.find((x) => x.id === id)
  if (t) ui.showToast({ title: `Mostrando ${t.name}`, tone: 'info', icon: 'fa-solid fa-store' })
}

onMounted(() => {
  userStore.hydrate()
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

const firstName = computed(() => (userStore.name || '').split(' ')[0] || '')

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
  {
    to: '/modulos',
    matches: ['/modulos'],
    icon: 'fa-solid fa-grid-2',
    label: 'Panel',
    kind: 'panel',
    hint: 'Resumen y atajos',
  },
  store.results
    ? {
        to: '/dashboard',
        matches: ['/dashboard', '/diagnostico'],
        icon: 'fa-solid fa-chart-pie',
        label: 'Diagnóstico',
        kind: 'diagnostico',
        hint: 'EBITDA · margen · break-even',
      }
    : {
        to: '/diagnostico',
        matches: ['/diagnostico', '/dashboard'],
        icon: 'fa-solid fa-plug-circle-bolt',
        label: 'Diagnóstico',
        kind: 'diagnostico',
        hint: 'Conecta tus datos reales',
        ribbon: 'Conectar',
      },
  { to: '/modulo/sanitario', matches: ['/modulo/sanitario'], icon: 'fa-solid fa-clipboard-list', label: 'Sanitario', kind: 'sanitario', hint: 'Semáforo Arcsa · checklist' },
  { to: '/modulo/mantenimiento', matches: ['/modulo/mantenimiento'], icon: 'fa-solid fa-screwdriver-wrench', label: 'Mantenimiento', kind: 'mantenimiento', hint: 'QR · fichas · alertas' },
  { to: '/modulo/costeo', matches: ['/modulo/costeo'], icon: 'fa-solid fa-sack-dollar', label: 'Costeo', kind: 'costeo', hint: 'Recetas · termómetro' },
  { to: '/modulo/horarios', matches: ['/modulo/horarios'], icon: 'fa-solid fa-calendar-week', label: 'Horarios', kind: 'horarios', hint: 'Turnos · horas críticas' },
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
    <aside :class="['sidebar', { open: sidebarOpen }]">
      <div class="sidebar-inner">
        <RouterLink to="/" class="brand">
          <span class="brand-mark"><i class="fa-solid fa-chart-pie" /></span>
          <span class="brand-text">
            <strong>Rentabilidad</strong>
            <span>360</span>
          </span>
        </RouterLink>

        <div class="workspace">
          <span class="workspace-label">Workspace</span>
          <button
            type="button"
            class="workspace-card"
            @click="goWorkspace"
            title="Configurar workspace"
          >
            <span class="ws-avatar">{{ initials }}</span>
            <div class="ws-meta">
              <strong>{{ store.projectName || 'Mi restaurante' }}</strong>
              <span>{{ store.tiendas.length }} {{ store.tiendas.length === 1 ? 'tienda' : 'tiendas' }} · Plan Free</span>
            </div>
            <i class="fa-solid fa-gear ws-gear" />
          </button>

          <div class="tienda-switcher">
            <template v-if="store.tiendas.length > 0">
              <button
                type="button"
                :class="['tienda-current', { open: tiendaMenuOpen }]"
                @click.stop="tiendaMenuOpen = !tiendaMenuOpen"
                aria-haspopup="menu"
                :aria-expanded="tiendaMenuOpen"
              >
                <span class="tienda-flag">
                  <i class="fa-solid fa-store" />
                </span>
                <span class="tienda-text">
                  <em>Viendo datos de</em>
                  <strong>{{ store.activeTienda?.name || 'Sin tienda' }}</strong>
                </span>
                <i class="fa-solid fa-chevron-down chev" />
              </button>

              <Transition name="menu">
                <div v-if="tiendaMenuOpen" class="tienda-menu" role="menu" @click.stop>
                  <span class="menu-label">Tiendas del workspace</span>
                  <button
                    v-for="t in store.tiendas"
                    :key="t.id"
                    type="button"
                    :class="['t-item', { active: store.activeTiendaId === t.id }]"
                    @click="pickTienda(t.id)"
                  >
                    <span class="t-ico"><i class="fa-solid fa-store" /></span>
                    <span class="t-meta">
                      <strong>{{ t.name }}</strong>
                      <em>{{ t.city || (t.isMain ? 'Principal' : 'Sucursal') }}</em>
                    </span>
                    <i v-if="store.activeTiendaId === t.id" class="fa-solid fa-circle-check ok" />
                  </button>

                  <div class="menu-divider" />

                  <button type="button" class="t-action" @click="goWorkspace">
                    <i class="fa-solid fa-gear" /> Gestionar tiendas
                  </button>
                </div>
              </Transition>
            </template>

            <button
              v-else
              type="button"
              class="tienda-empty"
              @click="goWorkspace"
              title="Agregar tu primera tienda"
            >
              <span class="tienda-flag empty"><i class="fa-solid fa-lightbulb" /></span>
              <span class="tienda-text">
                <em>Modo proyecto · sin tienda</em>
                <strong>Agregar primera tienda</strong>
              </span>
              <i class="fa-solid fa-plus add" />
            </button>
          </div>
        </div>

        <nav class="nav">
          <span class="nav-label">Navegación</span>
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
              <i class="fa-solid fa-bolt" />
              {{ n.ribbon }}
            </span>
            <i v-else class="fa-solid fa-chevron-right nav-chev" />
          </RouterLink>
        </nav>

        <div class="upgrade-card">
          <span class="upgrade-eyebrow"><i class="fa-solid fa-crown" /> Premium</span>
          <h4>Desbloquea el módulo completo</h4>
          <p>Reportes ilimitados, alertas por WhatsApp y orden de trabajo al técnico.</p>
          <button class="btn-upgrade" @click="upgrade">
            Mejorar plan <i class="fa-solid fa-arrow-right" />
          </button>
        </div>

        <div class="sidebar-foot">
          <button class="foot-btn" @click="connectData">
            <i class="fa-solid fa-plug-circle-bolt" /> Conectar datos reales
          </button>
          <button class="foot-btn danger" @click="logout">
            <i class="fa-solid fa-right-from-bracket" /> Cerrar sesión
          </button>
        </div>
      </div>
    </aside>

    <div v-if="sidebarOpen" class="scrim" @click="sidebarOpen = false" />

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
          <span
            v-if="store.activeTienda"
            class="crumb-tienda"
            :title="`Filtrando por ${store.activeTienda.name}`"
          >
            <i class="fa-solid fa-store" />
            {{ store.activeTienda.name }}
          </span>
          <span v-else class="crumb-tienda empty" title="Modo proyecto · sin tienda">
            <i class="fa-solid fa-lightbulb" />
            Modo proyecto
          </span>
        </div>

        <div class="search">
          <i class="fa-solid fa-magnifying-glass" />
          <input type="text" placeholder="Buscar módulo, equipo, receta…" />
          <span class="kbd">⌘K</span>
        </div>

        <div class="top-actions">
          <button class="icon-btn" title="Notificaciones" @click="ui.showToast({ title: '3 alertas activas', message: 'Mira el detalle dentro de cada módulo.', tone: 'warning' })">
            <i class="fa-solid fa-bell" />
            <span class="dot" />
          </button>
          <button class="icon-btn" title="Ayuda" @click="ui.showToast({ title: 'Soporte', message: 'Escríbenos a soporte@rentabilidad360.app', tone: 'info', icon: 'fa-solid fa-headset' })">
            <i class="fa-solid fa-circle-question" />
          </button>
          <div class="user-pill-wrap">
            <button
              type="button"
              :class="['user-pill', { active: userMenuOpen }]"
              @click.stop="userMenuOpen = !userMenuOpen"
              aria-haspopup="menu"
              :aria-expanded="userMenuOpen"
            >
              <span class="user-avatar">{{ initials }}</span>
              <div class="user-meta">
                <strong>{{ firstName || 'Operador' }}</strong>
                <span>{{ userStore.email || 'Cuenta demo' }}</span>
              </div>
              <i class="fa-solid fa-chevron-down user-chev" :class="{ open: userMenuOpen }" />
            </button>

            <Transition name="menu">
              <div v-if="userMenuOpen" class="user-menu" role="menu" @click.stop>
                <div class="menu-card">
                  <span class="menu-avatar">{{ initials }}</span>
                  <div class="menu-meta">
                    <strong>{{ userStore.name || 'Operador' }}</strong>
                    <span>{{ userStore.email || 'cuenta demo' }}</span>
                  </div>
                </div>

                <div class="menu-section">
                  <span class="menu-label">Cuenta</span>
                  <button class="menu-item" type="button" @click="acModalOpen = true; userMenuOpen = false">
                    <i class="fa-solid fa-user-pen" /> Editar perfil
                  </button>
                  <button class="menu-item" type="button" @click="userMenuOpen = false; goWorkspace()">
                    <i class="fa-solid fa-building" /> Configurar workspace
                  </button>
                </div>

                <div class="menu-section">
                  <span class="menu-label">Plan</span>
                  <button class="menu-item premium" type="button" @click="upgrade(); userMenuOpen = false">
                    <i class="fa-solid fa-crown" /> Mejorar a Premium
                    <span class="chip-soon">Próximamente</span>
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

    <WorkspaceSettingsModal :show="wsModalOpen" @close="wsModalOpen = false" />
    <AccountSettingsModal :show="acModalOpen" @close="acModalOpen = false" />
  </div>
</template>

<style scoped lang="scss">
.shell {
  min-height: 100dvh;
  background: #f4f6fb;
  display: grid;
  grid-template-columns: 1fr;
  color: $primary-dark;
  @media (min-width: 1024px) { grid-template-columns: 280px 1fr; }
}

/* ============ SIDEBAR ============ */
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 280px;
  background: $primary-dark;
  color: white;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 40;
  display: flex;
  &.open { transform: translateX(0); }
  @media (min-width: 1024px) { position: sticky; top: 0; height: 100dvh; transform: none; }
}
.sidebar-inner {
  flex: 1;
  display: flex; flex-direction: column;
  padding: 22px 18px;
  gap: 22px;
  overflow-y: auto;
}
.brand {
  display: inline-flex; align-items: center; gap: 10px;
  text-decoration: none;
}
.brand-mark {
  width: 38px; height: 38px;
  background: linear-gradient(135deg, $primary, $secondary);
  color: white; border-radius: 12px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1.05rem;
  box-shadow: 0 8px 20px rgba($primary, 0.4);
}
.brand-text {
  display: inline-flex; flex-direction: column; line-height: 1;
  strong { font-size: 1rem; font-weight: 800; letter-spacing: 0.3px; }
  span { font-size: 0.72rem; color: rgba(255,255,255,0.55); letter-spacing: 1px; }
}

.workspace { display: flex; flex-direction: column; gap: 8px; }
.workspace-label, .nav-label {
  font-size: 0.65rem; letter-spacing: 1.5px; text-transform: uppercase;
  color: rgba(255,255,255,0.4); font-weight: 700;
}
.workspace-card {
  display: grid;
  grid-template-columns: 36px 1fr 18px;
  align-items: center; gap: 10px;
  width: 100%;
  background: rgba(255,255,255,0.06);
  padding: 12px; border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  color: white;
  text-align: left;
  cursor: pointer;
  font-family: $font-principal;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;

  &:hover {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.18);
    transform: translateY(-1px);
    .ws-gear { opacity: 1; color: white; }
  }
}
.ws-meta { min-width: 0;
  strong { display: block; font-size: 0.88rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  span { font-size: 0.72rem; color: rgba(255,255,255,0.55); }
}
.ws-gear {
  font-size: 0.8rem; color: rgba(255,255,255,0.45);
  opacity: 0.7;
  transition: opacity 0.2s, color 0.2s;
}

.tienda-switcher {
  position: relative;
  margin-top: 8px;
}
.tienda-current {
  display: grid;
  grid-template-columns: 32px 1fr 14px;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 11px;
  border-radius: 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: white;
  font-family: $font-principal;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s, border-color 0.2s;
  &:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.18); }
  &.open { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.22); }
}
.tienda-flag {
  width: 32px; height: 32px; border-radius: 9px;
  background: linear-gradient(135deg, $secondary, #1caf86);
  color: white;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 0.85rem;
}
.tienda-text {
  display: inline-flex; flex-direction: column; line-height: 1.15; min-width: 0;
  em {
    font-style: normal; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.6px;
    text-transform: uppercase; color: rgba(255,255,255,0.55);
  }
  strong { font-size: 0.85rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
.tienda-current .chev {
  font-size: 0.7rem; color: rgba(255,255,255,0.5);
  transition: transform 0.2s;
}
.tienda-current.open .chev { transform: rotate(180deg); color: white; }

.tienda-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0; right: 0;
  background: white;
  border-radius: 14px;
  box-shadow: 0 24px 50px rgba(0,0,0,0.35);
  padding: 8px;
  z-index: 60;
  font-family: $font-principal;
  display: flex; flex-direction: column; gap: 4px;
}
.tienda-menu .menu-label {
  font-size: 0.62rem; font-weight: 800; letter-spacing: 0.7px; text-transform: uppercase;
  color: $text-secondary;
  padding: 6px 10px 4px;
}
.t-item {
  display: grid;
  grid-template-columns: 32px 1fr 18px;
  align-items: center;
  gap: 10px;
  padding: 9px 10px; border-radius: 10px;
  border: none; background: transparent;
  cursor: pointer; text-align: left; font-family: $font-principal;
  color: $primary-dark;
  &:hover { background: rgba($primary, 0.07); }
  &.active {
    background: linear-gradient(135deg, rgba($primary, 0.12), rgba($secondary, 0.08));
    .t-ico { background: $primary; color: white; }
  }
}
.t-ico {
  width: 32px; height: 32px; border-radius: 9px;
  background: rgba($primary, 0.1); color: $primary;
  display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem;
}
.t-meta { display: inline-flex; flex-direction: column; line-height: 1.2; min-width: 0;
  strong { font-size: 0.85rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  em { font-style: normal; font-size: 0.7rem; color: $text-secondary; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
.ok { color: $primary; font-size: 0.85rem; }
.menu-divider { height: 1px; background: rgba($primary-dark, 0.06); margin: 4px 6px; }
.t-action {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 12px; border-radius: 10px;
  border: none; background: rgba($primary, 0.1); color: $primary;
  font-family: $font-principal; font-weight: 700; font-size: 0.82rem;
  cursor: pointer;
  &:hover { background: rgba($primary, 0.16); }
}

.crumb-tienda {
  display: inline-flex; align-items: center; gap: 6px;
  margin-left: 8px;
  background: rgba($secondary, 0.14); color: darken($secondary, 12%);
  padding: 4px 10px; border-radius: 999px;
  font-size: 0.78rem; font-weight: 700;
  i { font-size: 0.72rem; }
  &.empty {
    background: rgba(245, 158, 11, 0.14);
    color: #b45309;
    i { color: #f59e0b; }
  }
}

.tienda-empty {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 11px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(245, 158, 11, 0.06));
  border: 1px dashed rgba(245, 158, 11, 0.5);
  color: #fff7ed;
  font-family: $font-principal;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
  &:hover {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.28), rgba(245, 158, 11, 0.1));
    border-color: #f59e0b;
    transform: translateY(-1px);
  }
  .tienda-flag.empty {
    background: linear-gradient(135deg, #f59e0b, #fb923c);
    color: white;
  }
  .add { color: #ffd66b; font-size: 0.85rem; }
}
.ws-avatar {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, $primary, $secondary);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 0.82rem; font-weight: 800; letter-spacing: 0.4px;
}

.nav { display: flex; flex-direction: column; gap: 6px; }
.nav-item {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px; border-radius: 14px;
  color: rgba(255,255,255,0.78);
  text-decoration: none;
  transition: background 0.2s, color 0.2s, transform 0.2s;

  &:hover {
    background: rgba(255,255,255,0.06);
    color: white;
    transform: translateX(2px);
    .nav-thumb { transform: scale(1.04); }
  }
  &.active {
    background: linear-gradient(135deg, rgba($primary, 0.5), rgba($secondary, 0.35));
    color: white; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12);
    .nav-chev { color: white; }
  }
}
.nav-thumb { transition: transform 0.25s; }
.nav-text {
  display: flex; flex-direction: column; line-height: 1.2;
  min-width: 0;
  strong {
    font-size: 0.88rem; font-weight: 700; color: inherit;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    display: block;
  }
  em {
    font-style: normal; font-size: 0.7rem; color: rgba(255,255,255,0.45);
    margin-top: 2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    display: block;
  }
}
.nav-chev {
  color: rgba(255,255,255,0.3);
  font-size: 0.72rem;
}
.nav-ribbon {
  display: inline-flex; align-items: center; gap: 4px;
  background: linear-gradient(135deg, #f59e0b, #fb923c);
  color: white;
  font-size: 0.6rem; font-weight: 800; letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 3px 8px; border-radius: 10px;
  box-shadow: 0 4px 10px rgba(245, 158, 11, 0.4);
  i { font-size: 0.65rem; color: #fff7ed; }
}

.upgrade-card {
  margin-top: auto;
  background: linear-gradient(135deg, $primary, #1a5fa5);
  border-radius: 18px; padding: 18px;
  display: flex; flex-direction: column; gap: 8px;
  position: relative; overflow: hidden;
  h4 { margin: 0; font-size: 0.98rem; font-weight: 800; }
  p { margin: 0; font-size: 0.78rem; opacity: 0.88; line-height: 1.45; }
}
.upgrade-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.65rem; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;
  background: rgba(255,255,255,0.18); padding: 4px 8px; border-radius: 10px;
  align-self: flex-start;
  i { color: #ffd66b; }
}
.btn-upgrade {
  margin-top: 4px;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  background: white; color: $primary;
  border: none; padding: 10px; border-radius: 10px;
  font-family: $font-principal; font-weight: 800; font-size: 0.82rem;
  cursor: pointer;
}

.sidebar-foot { padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 4px; }
.foot-btn {
  display: inline-flex; align-items: center; gap: 8px;
  width: 100%; padding: 10px;
  background: transparent; border: none; color: rgba(255,255,255,0.7);
  font-family: $font-principal; font-weight: 600; font-size: 0.85rem;
  cursor: pointer; border-radius: 10px; text-align: left;
  &:hover { background: rgba(255,255,255,0.06); color: white; }
  &.danger:hover { background: rgba($alert-error, 0.16); color: white; }
  &.danger { color: rgba(255, 200, 200, 0.85); }
  i { width: 16px; text-align: center; }
}

.scrim {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  z-index: 35; @media (min-width: 1024px) { display: none; }
}

/* ============ MAIN ============ */
.main {
  min-width: 0;
  display: flex; flex-direction: column;
  min-height: 100dvh;
}

.topbar {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 20px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba($primary-dark, 0.05);
  position: sticky; top: 0; z-index: 20;
}
.burger {
  border: none; background: rgba($primary, 0.08);
  color: $primary; width: 38px; height: 38px;
  border-radius: 12px; cursor: pointer; font-size: 1rem;
  @media (min-width: 1024px) { display: none; }
}

.crumbs {
  display: none;
  align-items: center; gap: 8px;
  @media (min-width: 720px) { display: inline-flex; }
}
.crumb-home {
  width: 32px; height: 32px; border-radius: 10px;
  background: rgba($primary, 0.08); color: $primary;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 0.85rem;
  &:hover { background: rgba($primary, 0.18); }
}
.sep { color: rgba($primary-dark, 0.3); font-size: 0.7rem; }
.crumb-current {
  display: inline-flex; align-items: center; gap: 6px;
  font-weight: 700; color: $primary-dark; font-size: 0.88rem;
  i { color: $primary; }
}

.search {
  position: relative;
  flex: 1; min-width: 0;
  display: flex; align-items: center; gap: 8px;
  background: rgba($primary-dark, 0.04);
  border-radius: 12px; padding: 0 12px;
  border: 1px solid transparent;
  &:focus-within { border-color: $primary; background: white; box-shadow: 0 0 0 4px rgba($primary, 0.08); }
  i { color: $text-secondary; }
  input {
    flex: 1; min-width: 0;
    height: 40px;
    border: none; background: transparent; outline: none;
    font-family: $font-principal; font-size: 0.9rem; color: $primary-dark;
    &::placeholder { color: rgba($primary-dark, 0.4); }
  }
  .kbd {
    font-size: 0.7rem; padding: 2px 6px; border-radius: 6px;
    background: rgba($primary-dark, 0.06); color: $text-secondary;
    border: 1px solid rgba($primary-dark, 0.08);
  }
  @media (max-width: 720px) {
    display: none;
  }
}

.top-actions { display: inline-flex; align-items: center; gap: 8px; margin-left: auto; }
.icon-btn {
  position: relative;
  width: 38px; height: 38px; border-radius: 12px;
  background: rgba($primary-dark, 0.04); border: none; cursor: pointer;
  color: $primary-dark; font-size: 0.95rem;
  &:hover { background: rgba($primary, 0.1); color: $primary; }
  .dot {
    position: absolute; top: 8px; right: 9px;
    width: 8px; height: 8px; background: $alert-error;
    border-radius: 50%; border: 2px solid white;
  }
}
.user-pill-wrap { position: relative; }
.user-pill {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 4px 12px 4px 4px; border-radius: 999px;
  background: rgba($primary-dark, 0.04);
  border: 1px solid transparent;
  font-family: $font-principal;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  &:hover { background: rgba($primary, 0.08); }
  &.active {
    background: white;
    border-color: rgba($primary-dark, 0.08);
    box-shadow: 0 6px 16px rgba($primary-dark, 0.08);
  }
}
.user-chev {
  font-size: 0.7rem;
  color: $text-secondary;
  transition: transform 0.2s;
  &.open { transform: rotate(180deg); color: $primary; }
}

.user-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: white;
  border-radius: 18px;
  border: 1px solid rgba($primary-dark, 0.06);
  box-shadow: 0 30px 60px rgba($primary-dark, 0.18);
  z-index: 50;
  overflow: hidden;
  font-family: $font-principal;
  @media (max-width: 520px) {
    position: fixed;
    top: auto; bottom: 12px; left: 12px; right: 12px;
    width: auto;
  }
}
.menu-card {
  display: grid; grid-template-columns: 44px 1fr; gap: 12px; align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, rgba($primary, 0.07), white);
  border-bottom: 1px solid rgba($primary-dark, 0.05);
}
.menu-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: linear-gradient(135deg, $primary, $secondary);
  color: white; display: inline-flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 0.9rem;
}
.menu-meta {
  display: flex; flex-direction: column; min-width: 0;
  strong { font-size: 0.9rem; color: $primary-dark; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  span { font-size: 0.74rem; color: $text-secondary; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
.menu-section {
  padding: 8px;
  border-bottom: 1px solid rgba($primary-dark, 0.05);
  display: flex; flex-direction: column; gap: 2px;
  &:last-child { border-bottom: none; }
}
.menu-label {
  font-size: 0.62rem; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase;
  color: $text-secondary;
  padding: 6px 10px 2px;
}
.menu-item {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 10px;
  background: transparent; border: none; cursor: pointer;
  font-family: $font-principal; font-weight: 600; font-size: 0.88rem;
  color: $primary-dark;
  text-align: left;
  i { color: $primary; width: 18px; text-align: center; }
  &:hover { background: rgba($primary, 0.08); }
  &.danger {
    color: $alert-error;
    i { color: $alert-error; }
    &:hover { background: rgba($alert-error, 0.08); }
  }
  &.premium {
    justify-content: flex-start;
    i { color: #f59e0b; }
  }
}
.chip-soon {
  margin-left: auto;
  font-size: 0.62rem; font-weight: 800; letter-spacing: 0.5px;
  background: linear-gradient(135deg, #f59e0b, #fb923c);
  color: white;
  padding: 3px 8px; border-radius: 999px;
}

.menu-enter-active, .menu-leave-active { transition: opacity 0.2s, transform 0.2s; }
.menu-enter-from, .menu-leave-to { opacity: 0; transform: translateY(-6px) scale(0.96); }
.user-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: linear-gradient(135deg, $primary, $secondary);
  color: white; font-size: 0.78rem; font-weight: 800;
  display: inline-flex; align-items: center; justify-content: center;
}
.user-meta {
  display: none; line-height: 1.2;
  strong { font-size: 0.85rem; }
  span { font-size: 0.72rem; color: $text-secondary; }
  @media (min-width: 800px) { display: inline-flex; flex-direction: column; }
}

.page {
  flex: 1;
  min-width: 0;
}
</style>
