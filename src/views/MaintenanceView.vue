<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import DemoBanner from '@/components/DemoBanner.vue'
import DemoBadge from '@/components/DemoBadge.vue'
import TiendaContextBar from '@/components/TiendaContextBar.vue'
import AppShell from '@/layout/AppShell.vue'

const router = useRouter()

interface Repair { date: string; detail: string; cost: number; tech: string }
interface Equipment {
  id: string
  name: string
  icon: string
  purchaseDate: string // ISO
  cost: number
  lifeYears: number
  nextMaintenance: string // ISO
  status: 'ok' | 'soon' | 'urgent'
  history: Repair[]
}

const today = new Date('2026-05-23')

const equipment = ref<Equipment[]>([
  {
    id: 'eq1',
    name: 'Licuadora Industrial',
    icon: 'fa-solid fa-blender',
    purchaseDate: '2023-08-12',
    cost: 2400,
    lifeYears: 5,
    nextMaintenance: '2026-05-30',
    status: 'soon',
    history: [
      { date: '2025-11-04', detail: 'Cambio de cuchillas y empaque base', cost: 85, tech: 'J. Pérez' },
      { date: '2025-06-21', detail: 'Lubricación de eje y revisión de motor', cost: 40, tech: 'L. Andrade' },
      { date: '2024-12-09', detail: 'Reemplazo de fusible térmico', cost: 22, tech: 'J. Pérez' },
    ],
  },
  {
    id: 'eq2',
    name: 'Plancha Eléctrica',
    icon: 'fa-solid fa-fire-burner',
    purchaseDate: '2022-03-02',
    cost: 3800,
    lifeYears: 5,
    nextMaintenance: '2026-06-18',
    status: 'ok',
    history: [
      { date: '2026-02-14', detail: 'Calibración de termostato', cost: 60, tech: 'M. Salazar' },
      { date: '2025-09-28', detail: 'Recambio de resistencias laterales', cost: 180, tech: 'L. Andrade' },
      { date: '2025-04-10', detail: 'Limpieza profunda y ajuste de patas', cost: 35, tech: 'J. Pérez' },
    ],
  },
  {
    id: 'eq3',
    name: 'Freidora Doble',
    icon: 'fa-solid fa-bowl-food',
    purchaseDate: '2024-01-22',
    cost: 1850,
    lifeYears: 5,
    nextMaintenance: '2026-05-26',
    status: 'urgent',
    history: [
      { date: '2026-01-19', detail: 'Cambio de filtro de aceite y empaques', cost: 95, tech: 'M. Salazar' },
      { date: '2025-07-03', detail: 'Reemplazo de termocupla', cost: 70, tech: 'J. Pérez' },
      { date: '2025-02-17', detail: 'Revisión general anual', cost: 50, tech: 'L. Andrade' },
    ],
  },
  {
    id: 'eq4',
    name: 'Cámara Frigorífica',
    icon: 'fa-solid fa-snowflake',
    purchaseDate: '2021-10-08',
    cost: 6200,
    lifeYears: 8,
    nextMaintenance: '2026-07-04',
    status: 'ok',
    history: [
      { date: '2026-03-11', detail: 'Carga de refrigerante R-404A', cost: 220, tech: 'L. Andrade' },
      { date: '2025-10-02', detail: 'Limpieza de condensador y serpentín', cost: 95, tech: 'M. Salazar' },
      { date: '2025-05-15', detail: 'Cambio de empaques de puerta', cost: 110, tech: 'J. Pérez' },
    ],
  },
])

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

function depreciationPct(eq: Equipment): number {
  const start = new Date(eq.purchaseDate)
  const totalDays = eq.lifeYears * 365
  const used = Math.max(0, daysBetween(start, today))
  return Math.min(100, Math.round((used / totalDays) * 100))
}

function remainingValue(eq: Equipment): number {
  const pct = depreciationPct(eq)
  return Math.max(0, Math.round(eq.cost * (1 - pct / 100)))
}

function daysToMaintenance(eq: Equipment): number {
  return daysBetween(today, new Date(eq.nextMaintenance))
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatMoney(n: number): string {
  return `$${n.toLocaleString('es-EC')}`
}

const statusLabel: Record<Equipment['status'], string> = {
  ok: 'Operativo',
  soon: 'Atención',
  urgent: 'Mantenimiento urgente',
}

// Ficha modal
const activeId = ref<string | null>(null)
const activeEquipment = computed(() => equipment.value.find((e) => e.id === activeId.value) || null)
function openFicha(id: string) { activeId.value = id }
function closeFicha() { activeId.value = null }

function registrarMantenimiento() {
  if (!activeEquipment.value) return
  const eq = activeEquipment.value
  eq.history.unshift({
    date: today.toISOString().slice(0, 10),
    detail: 'Mantenimiento preventivo registrado desde QR',
    cost: 0,
    tech: 'Pendiente',
  })
  const next = new Date(today)
  next.setMonth(next.getMonth() + 3)
  eq.nextMaintenance = next.toISOString().slice(0, 10)
  eq.status = 'ok'
}

// QR / Cámara
const videoRef = ref<HTMLVideoElement | null>(null)
const stream = ref<MediaStream | null>(null)
const cameraError = ref<string | null>(null)
const cameraActive = computed(() => stream.value !== null)

async function startCamera() {
  cameraError.value = null
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value = 'Tu navegador no permite acceder a la cámara. Usa una de las simulaciones.'
    return
  }
  try {
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    stream.value = s
    // Esperar al siguiente tick para que el video render
    await new Promise((r) => setTimeout(r, 50))
    if (videoRef.value) {
      videoRef.value.srcObject = s
      await videoRef.value.play().catch(() => {})
    }
  } catch (err) {
    cameraError.value = 'No pudimos acceder a la cámara. Revisa permisos o usa la simulación.'
    stream.value = null
  }
}

function stopCamera() {
  if (stream.value) {
    stream.value.getTracks().forEach((t) => t.stop())
    stream.value = null
  }
  if (videoRef.value) videoRef.value.srcObject = null
}

function simulateScan(id: string) {
  stopCamera()
  openFicha(id)
}

onMounted(() => {
  document.title = 'Mantenimiento Pro con QR · Rentabilidad360'
})

onUnmounted(() => {
  stopCamera()
})

function back() {
  router.push('/modulos')
}

const alerts = [
  {
    id: 'a1',
    icon: 'fa-solid fa-blender',
    title: 'Licuadora Industrial',
    text: 'Próximo mantenimiento en 7 días. WhatsApp programado al supervisor.',
    color: 'warn',
  },
  {
    id: 'a2',
    icon: 'fa-solid fa-bowl-food',
    title: 'Freidora Doble',
    text: 'Mantenimiento atrasado. Se enviará alerta al dueño hoy 18:00.',
    color: 'urgent',
  },
] as const
</script>

<template>
  <AppShell>
    <div class="mod">
      <header class="mod-top">
        <div class="mod-head">
          <h1 class="mod-title"><i class="fa-solid fa-screwdriver-wrench" /> Mantenimiento Pro con QR</h1>
          <p class="mod-sub">Escanea el QR de cada equipo y abre su ficha técnica al instante.</p>
        </div>
      </header>

    <div class="demo-wrap"><TiendaContextBar /></div>
    <div class="demo-wrap"><DemoBanner /></div>

    <section class="scan-card">
      <div class="scan-head">
        <div class="scan-icon"><i class="fa-solid fa-qrcode" /></div>
        <div class="scan-text">
          <h2>Escanea el QR del equipo</h2>
          <p>Pega un QR en cada máquina. Al escanear, abrimos su ficha técnica al instante.</p>
        </div>
      </div>

      <div class="scan-body">
        <div v-if="cameraActive" class="cam-wrap">
          <video ref="videoRef" class="cam-video" muted playsinline autoplay />
          <div class="cam-mask"><span class="cam-corner tl" /><span class="cam-corner tr" /><span class="cam-corner bl" /><span class="cam-corner br" /></div>
        </div>
        <div v-else class="cam-placeholder">
          <i class="fa-solid fa-camera" />
          <span>La cámara se mostrará aquí</span>
        </div>

        <div v-if="cameraError" class="cam-banner error">
          <i class="fa-solid fa-circle-exclamation" /> {{ cameraError }}
        </div>

        <div class="scan-actions">
          <button v-if="!cameraActive" class="btn primary" @click="startCamera">
            <i class="fa-solid fa-qrcode" /> Escanear QR del equipo
          </button>
          <button v-else class="btn ghost" @click="stopCamera">
            <i class="fa-solid fa-stop" /> Cerrar cámara
          </button>

          <div class="sim-row">
            <span class="sim-label">¿Sin QR físico? Simula:</span>
            <button class="chip" @click="simulateScan('eq1')"><i class="fa-solid fa-blender" /> Licuadora</button>
            <button class="chip" @click="simulateScan('eq2')"><i class="fa-solid fa-fire-burner" /> Plancha</button>
          </div>
        </div>
      </div>
    </section>

    <section class="list-section">
      <header class="sec-head">
        <h3><i class="fa-solid fa-toolbox" /> Equipos registrados <DemoBadge /></h3>
        <span class="sec-meta">{{ equipment.length }} activos</span>
      </header>

      <div class="eq-grid">
        <article
          v-for="eq in equipment"
          :key="eq.id"
          :class="['eq-card', eq.status]"
          @click="openFicha(eq.id)"
          role="button"
          tabindex="0"
          @keyup.enter="openFicha(eq.id)"
        >
          <div class="eq-top">
            <div class="eq-ico"><i :class="eq.icon" /></div>
            <span :class="['status-dot', eq.status]" :title="statusLabel[eq.status]" />
          </div>

          <h4 class="eq-name">{{ eq.name }}</h4>

          <dl class="eq-meta">
            <div>
              <dt>Compra</dt>
              <dd>{{ formatDate(eq.purchaseDate) }}</dd>
            </div>
            <div>
              <dt>Costo</dt>
              <dd>{{ formatMoney(eq.cost) }}</dd>
            </div>
          </dl>

          <div class="depr">
            <div class="depr-head">
              <span>Depreciación</span>
              <strong>{{ depreciationPct(eq) }}%</strong>
            </div>
            <div class="depr-bar">
              <span class="depr-fill" :style="{ width: depreciationPct(eq) + '%' }" />
            </div>
            <small>Valor restante {{ formatMoney(remainingValue(eq)) }}</small>
          </div>

          <footer class="eq-foot">
            <span class="next-pill">
              <i class="fa-solid fa-calendar-day" />
              Próx: {{ formatDate(eq.nextMaintenance) }}
            </span>
            <span :class="['days-pill', eq.status]">
              {{ daysToMaintenance(eq) >= 0 ? `en ${daysToMaintenance(eq)} d` : `vencido ${Math.abs(daysToMaintenance(eq))} d` }}
            </span>
          </footer>
        </article>
      </div>
    </section>

    <section class="alert-card">
      <header class="sec-head">
        <h3><i class="fa-solid fa-bell" /> Alertas automatizadas <DemoBadge /></h3>
        <span class="sec-meta">Notificación 7 días antes</span>
      </header>

      <ul class="alert-list">
        <li v-for="a in alerts" :key="a.id" :class="['alert-item', a.color]">
          <div class="alert-ico"><i :class="a.icon" /></div>
          <div class="alert-body">
            <strong>{{ a.title }}</strong>
            <p>{{ a.text }}</p>
            <div class="alert-tags">
              <span class="tag wa"><i class="fa-brands fa-whatsapp" /> WhatsApp</span>
              <span class="tag lock" title="Plan Premium">
                <i class="fa-solid fa-lock" /> Asignar técnico (Premium)
              </span>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <!-- Ficha modal -->
    <div v-if="activeEquipment" class="modal-back" @click.self="closeFicha">
      <div class="modal" role="dialog" aria-modal="true">
        <header class="modal-head">
          <div class="modal-title">
            <div class="eq-ico lg"><i :class="activeEquipment.icon" /></div>
            <div>
              <h3>{{ activeEquipment.name }}</h3>
              <span :class="['status-chip', activeEquipment.status]">
                <i class="fa-solid fa-circle" /> {{ statusLabel[activeEquipment.status] }}
              </span>
            </div>
          </div>
          <button class="close-btn" @click="closeFicha"><i class="fa-solid fa-xmark" /></button>
        </header>

        <div class="modal-grid">
          <div class="kpi">
            <span class="kpi-label">Costo</span>
            <strong>{{ formatMoney(activeEquipment.cost) }}</strong>
          </div>
          <div class="kpi">
            <span class="kpi-label">Depreciación</span>
            <strong>{{ depreciationPct(activeEquipment) }}%</strong>
          </div>
          <div class="kpi">
            <span class="kpi-label">Valor restante</span>
            <strong>{{ formatMoney(remainingValue(activeEquipment)) }}</strong>
          </div>
          <div class="kpi">
            <span class="kpi-label">Compra</span>
            <strong>{{ formatDate(activeEquipment.purchaseDate) }}</strong>
          </div>
        </div>

        <div class="depr modal-depr">
          <div class="depr-head">
            <span>Línea de depreciación lineal {{ activeEquipment.lifeYears }} años</span>
            <strong>{{ depreciationPct(activeEquipment) }}%</strong>
          </div>
          <div class="depr-bar">
            <span class="depr-fill" :style="{ width: depreciationPct(activeEquipment) + '%' }" />
          </div>
        </div>

        <section class="modal-section">
          <h4><i class="fa-solid fa-clock-rotate-left" /> Historial de reparaciones</h4>
          <ul class="hist-list">
            <li v-for="(r, idx) in activeEquipment.history" :key="idx" class="hist-item">
              <span class="hist-date">{{ formatDate(r.date) }}</span>
              <div class="hist-body">
                <span class="hist-detail">{{ r.detail }}</span>
                <div class="hist-meta">
                  <span><i class="fa-solid fa-user-gear" /> {{ r.tech }}</span>
                  <span><i class="fa-solid fa-dollar-sign" /> {{ formatMoney(r.cost) }}</span>
                </div>
              </div>
            </li>
          </ul>
        </section>

        <section class="modal-section premium">
          <h4><i class="fa-solid fa-user-gear" /> Técnico asignado</h4>
          <div class="lock-field">
            <input type="text" placeholder="Selecciona un técnico verificado" disabled />
            <span class="lock-badge" title="Plan Premium">
              <i class="fa-solid fa-lock" /> Premium
            </span>
          </div>
          <small>Desbloquea técnicos verificados y agenda automática con el Plan Premium.</small>
        </section>

        <footer class="modal-foot">
          <button class="btn ghost" @click="closeFicha">Cerrar</button>
          <button class="btn primary" @click="registrarMantenimiento">
            <i class="fa-solid fa-clipboard-check" /> Registrar mantenimiento
          </button>
        </footer>
      </div>
    </div>
    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.mod { padding: 0 0 60px; font-family: $font-principal; }
.mod-top {
  display: block;
  background: transparent;
  border-bottom: none;
  position: static;
  padding: 24px 28px 0;
}
.mod-head { display: flex; flex-direction: column; gap: 4px; }
.mod-title {
  margin: 0; font-size: 1.3rem; font-weight: 800; color: $primary-dark;
  display: inline-flex; align-items: center; gap: 10px;
  i { color: $primary; }
}
.mod-sub { margin: 0; color: $text-secondary; font-size: 0.9rem; }
.demo-wrap { margin: 18px 28px 0; }
@media (max-width: 720px) {
  .mod-top { padding: 18px 16px 0; }
  .demo-wrap { margin: 14px 16px 0; }
}

.mod-top-old-was {
  display: grid; grid-template-columns: auto 1fr auto; align-items: center;
  gap: 14px; padding: 14px 20px; background: white;
  border-bottom: 1px solid rgba($primary-dark, 0.06);
  position: sticky; top: 0; z-index: 10;
}
.back {
  border: none; background: transparent; cursor: pointer; color: $primary;
  font-family: $font-principal; font-weight: 700; font-size: 0.85rem;
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 10px;
  &:hover { background: rgba($primary, 0.08); }
}
.mod-title {
  margin: 0; font-size: 1.02rem; font-weight: 800; color: $primary-dark;
  display: inline-flex; align-items: center; gap: 8px;
  i { color: $primary; }
}
.brand-mini {
  width: 32px; height: 32px;
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba($primary, 0.1); color: $primary; border-radius: 10px;
}

/* SCAN */
.scan-card {
  margin: 20px; background: white; border-radius: 22px; padding: 20px;
  border: 1px solid rgba($primary-dark, 0.06);
  display: flex; flex-direction: column; gap: 16px;
}
.scan-head { display: flex; gap: 14px; align-items: flex-start; }
.scan-icon {
  width: 52px; height: 52px; border-radius: 16px;
  background: linear-gradient(135deg, rgba($primary, 0.12), rgba($secondary, 0.18));
  color: $primary; display: inline-flex; align-items: center; justify-content: center;
  font-size: 1.4rem;
}
.scan-text h2 { margin: 0 0 4px; font-size: 1.05rem; font-weight: 800; color: $primary-dark; }
.scan-text p { margin: 0; font-size: 0.85rem; color: $text-secondary; line-height: 1.45; }

.scan-body { display: flex; flex-direction: column; gap: 14px; }
.cam-wrap {
  position: relative; width: 100%; aspect-ratio: 4 / 3;
  border-radius: 18px; overflow: hidden; background: #000;
}
.cam-video { width: 100%; height: 100%; object-fit: cover; }
.cam-mask { position: absolute; inset: 24px; pointer-events: none; }
.cam-corner {
  position: absolute; width: 28px; height: 28px; border: 3px solid $secondary;
  &.tl { top: 0; left: 0; border-right: none; border-bottom: none; border-top-left-radius: 8px; }
  &.tr { top: 0; right: 0; border-left: none; border-bottom: none; border-top-right-radius: 8px; }
  &.bl { bottom: 0; left: 0; border-right: none; border-top: none; border-bottom-left-radius: 8px; }
  &.br { bottom: 0; right: 0; border-left: none; border-top: none; border-bottom-right-radius: 8px; }
}
.cam-placeholder {
  width: 100%; aspect-ratio: 4 / 3; border-radius: 18px;
  background: #eef2f7; border: 2px dashed rgba($primary-dark, 0.18);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  color: $text-secondary;
  i { font-size: 1.8rem; color: $primary; }
  span { font-size: 0.85rem; font-weight: 600; }
}
.cam-banner {
  padding: 10px 12px; border-radius: 12px; font-size: 0.82rem; font-weight: 600;
  display: inline-flex; align-items: center; gap: 8px;
  &.error { background: rgba($alert-error, 0.1); color: $alert-error; border: 1px solid rgba($alert-error, 0.25); }
}

.scan-actions { display: flex; flex-direction: column; gap: 12px; }
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px 16px; border-radius: 14px;
  font-family: $font-principal; font-weight: 800; font-size: 0.95rem; cursor: pointer;
  border: 2px solid transparent; transition: transform 0.15s, background 0.15s;
  &.primary {
    color: white; background: linear-gradient(135deg, $primary, #1678b0);
    box-shadow: 0 12px 24px rgba($primary, 0.3);
  }
  &.ghost { background: white; color: $primary-dark; border-color: rgba($primary-dark, 0.12); }
  &:active { transform: scale(0.97); }
}
.sim-row {
  display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
  font-size: 0.78rem; color: $text-secondary;
}
.sim-label { font-weight: 600; }
.chip {
  border: 1px solid rgba($primary, 0.25); background: rgba($primary, 0.06);
  color: $primary; font-weight: 700; font-size: 0.78rem;
  padding: 7px 12px; border-radius: 20px; cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px;
  font-family: $font-principal;
  &:hover { background: rgba($primary, 0.12); }
}

/* LIST */
.list-section { margin: 0 20px; }
.sec-head {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
  h3 {
    margin: 0; font-size: 0.95rem; font-weight: 800; color: $primary-dark;
    display: inline-flex; align-items: center; gap: 8px;
    i { color: $primary; }
  }
  .sec-meta { font-size: 0.75rem; color: $text-secondary; font-weight: 600; }
}

.eq-grid {
  display: grid; gap: 14px;
  grid-template-columns: 1fr;
  @media (min-width: 640px) { grid-template-columns: 1fr 1fr; }
  @media (min-width: 960px) { grid-template-columns: repeat(2, 1fr); }
}
.eq-card {
  background: white; border: 1px solid rgba($primary-dark, 0.06);
  border-radius: 22px; padding: 16px;
  display: flex; flex-direction: column; gap: 12px;
  cursor: pointer; transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
  &:hover { transform: translateY(-2px); box-shadow: 0 16px 32px rgba($primary-dark, 0.08); border-color: rgba($primary, 0.2); }
  &.urgent { border-color: rgba($alert-error, 0.3); }
  &.soon { border-color: rgba($alert-warning, 0.3); }
}
.eq-top { display: flex; align-items: center; justify-content: space-between; }
.eq-ico {
  width: 44px; height: 44px; border-radius: 14px;
  background: rgba($primary, 0.1); color: $primary;
  display: inline-flex; align-items: center; justify-content: center; font-size: 1.1rem;
  &.lg { width: 52px; height: 52px; font-size: 1.3rem; border-radius: 16px; }
}
.status-dot {
  width: 14px; height: 14px; border-radius: 50%;
  &.ok { background: $alert-success; box-shadow: 0 0 0 4px rgba($alert-success, 0.18); }
  &.soon { background: $alert-warning; box-shadow: 0 0 0 4px rgba($alert-warning, 0.18); }
  &.urgent { background: $alert-error; box-shadow: 0 0 0 4px rgba($alert-error, 0.2); animation: pulse 1.4s ease-in-out infinite; }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
.eq-name { margin: 0; font-size: 1rem; font-weight: 800; color: $primary-dark; }
.eq-meta {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 0;
  div { display: flex; flex-direction: column; gap: 2px; }
  dt { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.4px; color: $text-secondary; font-weight: 700; margin: 0; }
  dd { margin: 0; font-size: 0.88rem; font-weight: 700; color: $primary-dark; }
}

.depr { display: flex; flex-direction: column; gap: 6px; }
.depr-head {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 0.78rem; color: $text-secondary; font-weight: 600;
  strong { color: $primary-dark; font-weight: 800; }
}
.depr-bar {
  width: 100%; height: 8px; border-radius: 999px;
  background: rgba($primary-dark, 0.08); overflow: hidden;
}
.depr-fill {
  display: block; height: 100%;
  background: linear-gradient(90deg, $primary, $secondary);
  border-radius: 999px; transition: width 0.4s ease;
}
.depr small { font-size: 0.72rem; color: $text-secondary; }

.eq-foot { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; }
.next-pill {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba($primary, 0.08); color: $primary;
  font-size: 0.74rem; font-weight: 700; padding: 6px 10px; border-radius: 12px;
}
.days-pill {
  font-size: 0.74rem; font-weight: 800; padding: 6px 10px; border-radius: 12px;
  background: rgba($alert-success, 0.12); color: darken($alert-success, 10%);
  &.soon { background: rgba($alert-warning, 0.15); color: darken($alert-warning, 12%); }
  &.urgent { background: rgba($alert-error, 0.15); color: $alert-error; }
}

/* ALERTS */
.alert-card {
  margin: 20px; background: white; border-radius: 22px; padding: 20px;
  border: 1px solid rgba($primary-dark, 0.06);
}
.alert-list { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.alert-item {
  display: grid; grid-template-columns: 44px 1fr; gap: 12px;
  padding: 14px; border-radius: 16px; background: #f8fafc;
  border: 1px solid rgba($primary-dark, 0.06);
  &.warn { background: rgba($alert-warning, 0.08); border-color: rgba($alert-warning, 0.25); }
  &.urgent { background: rgba($alert-error, 0.08); border-color: rgba($alert-error, 0.25); }
}
.alert-ico {
  width: 44px; height: 44px; border-radius: 14px;
  background: white; color: $primary;
  display: inline-flex; align-items: center; justify-content: center; font-size: 1.1rem;
  border: 1px solid rgba($primary-dark, 0.06);
}
.alert-body { display: flex; flex-direction: column; gap: 4px; }
.alert-body strong { font-size: 0.95rem; color: $primary-dark; }
.alert-body p { margin: 0; font-size: 0.82rem; color: $text-secondary; line-height: 1.45; }
.alert-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.tag {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.72rem; font-weight: 700; padding: 5px 10px; border-radius: 20px;
  &.wa { background: rgba(37, 211, 102, 0.15); color: #128c4a; }
  &.lock { background: rgba($primary-dark, 0.08); color: $primary-dark; cursor: help; }
}

/* MODAL */
.modal-back {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; justify-content: center;
  @media (min-width: 640px) { align-items: center; padding: 24px; }
}
.modal {
  width: 100%; max-width: 560px; max-height: 92dvh; overflow-y: auto;
  background: white; border-radius: 22px 22px 0 0;
  padding: 20px; display: flex; flex-direction: column; gap: 16px;
  @media (min-width: 640px) { border-radius: 22px; }
}
.modal-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.modal-title { display: flex; gap: 12px; align-items: center;
  h3 { margin: 0 0 4px; font-size: 1.05rem; font-weight: 800; color: $primary-dark; }
}
.status-chip {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.72rem; font-weight: 700; padding: 4px 10px; border-radius: 20px;
  i { font-size: 0.5rem; }
  &.ok { background: rgba($alert-success, 0.12); color: darken($alert-success, 8%); }
  &.soon { background: rgba($alert-warning, 0.15); color: darken($alert-warning, 12%); }
  &.urgent { background: rgba($alert-error, 0.12); color: $alert-error; }
}
.close-btn {
  width: 36px; height: 36px; border-radius: 12px;
  border: none; background: rgba($primary-dark, 0.06); color: $primary-dark;
  cursor: pointer; font-size: 1rem;
  &:hover { background: rgba($primary-dark, 0.12); }
}
.modal-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
.kpi {
  background: #f6f8fb; border-radius: 14px; padding: 12px;
  display: flex; flex-direction: column; gap: 2px;
  border: 1px solid rgba($primary-dark, 0.05);
  .kpi-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.4px; color: $text-secondary; font-weight: 700; }
  strong { font-size: 0.95rem; color: $primary-dark; font-weight: 800; }
}
.modal-depr {
  background: #f6f8fb; border-radius: 14px; padding: 12px;
  border: 1px solid rgba($primary-dark, 0.05);
}
.modal-section {
  display: flex; flex-direction: column; gap: 8px;
  h4 {
    margin: 0; font-size: 0.9rem; font-weight: 800; color: $primary-dark;
    display: inline-flex; align-items: center; gap: 8px;
    i { color: $primary; }
  }
  small { color: $text-secondary; font-size: 0.74rem; }
}
.hist-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.hist-item {
  display: grid; grid-template-columns: 96px 1fr; gap: 10px;
  background: #f6f8fb; border-radius: 12px; padding: 10px;
  border: 1px solid rgba($primary-dark, 0.05);
}
.hist-date {
  font-size: 0.74rem; font-weight: 800; color: $primary;
  display: inline-flex; align-items: flex-start;
}
.hist-detail { font-size: 0.85rem; color: $primary-dark; font-weight: 600; }
.hist-meta {
  display: flex; gap: 12px; margin-top: 4px;
  font-size: 0.72rem; color: $text-secondary;
  i { color: $primary; margin-right: 4px; }
}

.premium .lock-field {
  display: flex; gap: 8px; align-items: center;
  background: #f6f8fb; padding: 10px 12px; border-radius: 12px;
  border: 1px dashed rgba($primary-dark, 0.18);
  input {
    flex: 1; border: none; background: transparent; outline: none;
    font-family: $font-principal; font-size: 0.85rem; color: $text-secondary;
  }
}
.lock-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: linear-gradient(135deg, $secondary, #f59e0b);
  color: white; font-size: 0.7rem; font-weight: 800;
  padding: 5px 10px; border-radius: 20px; cursor: help;
}

.modal-foot {
  display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px; margin-top: 4px;
  .btn { width: 100%; }
}
</style>
