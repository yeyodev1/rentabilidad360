<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import DemoBanner from '@/components/DemoBanner.vue'
import DemoBadge from '@/components/DemoBadge.vue'
import TiendaContextBar from '@/components/TiendaContextBar.vue'
import AppShell from '@/layout/AppShell.vue'

const router = useRouter()

type Demand = 'high' | 'low' | 'waste' | 'normal'

interface Cell {
  staff: number
  demand: Demand
}

const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const hours = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
// Each row represents a 2h block starting at this hour.
const blockHours = 2
const hourlyCost = 5 // USD/hr mock

// Deterministic demand pattern (rowIndex = hour block, colIndex = day index Mon..Sun)
function detectDemand(rowIndex: number, colIndex: number): Demand {
  const hour = hours[rowIndex]
  const day = days[colIndex]

  // Wasted slots: Mar/Mié 16:00 block (index row=3)
  if ((day === 'Mar' || day === 'Mié') && hour === '16:00') return 'waste'

  // High demand: Vie & Sáb at 20:00 (evening peak)
  if ((day === 'Vie' || day === 'Sáb') && (hour === '20:00' || hour === '18:00')) return 'high'

  // High demand: Dom mediodía
  if (day === 'Dom' && (hour === '12:00' || hour === '14:00')) return 'high'

  // Low demand: weekdays 14:00 - 16:00 range
  if ((day === 'Lun' || day === 'Jue') && hour === '14:00') return 'low'
  if (day === 'Mar' && hour === '10:00') return 'low'

  return 'normal'
}

function buildGrid(): Cell[][] {
  return hours.map((_, r) =>
    days.map((_, c) => {
      const demand = detectDemand(r, c)
      let baseStaff = 2
      if (demand === 'high') baseStaff = 4
      if (demand === 'waste') baseStaff = 3
      if (demand === 'low') baseStaff = 1
      return { staff: baseStaff, demand }
    }),
  )
}

const grid = ref<Cell[][]>(buildGrid())

// Modal state
const openCell = ref<{ row: number; col: number } | null>(null)

const activeCell = computed<Cell | null>(() => {
  if (!openCell.value) return null
  return grid.value[openCell.value.row][openCell.value.col]
})

function openCellModal(row: number, col: number) {
  openCell.value = { row, col }
}

function adjustStaff(row: number, col: number, delta: number) {
  const cell = grid.value[row][col]
  const next = cell.staff + delta
  if (next < 0 || next > 12) return
  cell.staff = next
}

function closePopover() {
  openCell.value = null
}

const demandMeta: Record<Demand, { label: string; icon: string; tone: string; hint: string }> = {
  high: { label: 'Alta demanda', icon: 'fa-solid fa-fire', tone: 'high', hint: 'Asegura suficiente personal para cubrir el pico.' },
  low: { label: 'Baja demanda', icon: 'fa-solid fa-feather', tone: 'low', hint: 'Considera reducir personal para optimizar costos.' },
  waste: { label: 'Desperdicio detectado', icon: 'fa-solid fa-triangle-exclamation', tone: 'waste', hint: 'Ventas muy por debajo del promedio: hay nómina ociosa.' },
  normal: { label: 'Demanda regular', icon: 'fa-solid fa-circle-check', tone: 'normal', hint: 'Turno equilibrado según histórico de ventas.' },
}

function blockCost(cell: Cell): number {
  return cell.staff * blockHours * hourlyCost
}

function cellSuggestion(cell: Cell): string | null {
  if (cell.demand === 'waste') return 'Reduce 1 mesero: horario de baja rotación.'
  if (cell.demand === 'high' && cell.staff < 4) return 'Refuerza con 1 mesero adicional.'
  if (cell.demand === 'low' && cell.staff > 1) return 'Personal sobrado para este turno.'
  return null
}

// KPIs
const totalStaff = computed(() =>
  grid.value.reduce((sum, row) => sum + row.reduce((s, c) => s + c.staff, 0), 0),
)
const estimatedPayroll = computed(() => totalStaff.value * blockHours * hourlyCost)
const wasteCount = computed(() =>
  grid.value.reduce(
    (sum, row) => sum + row.filter((c) => c.demand === 'waste').length,
    0,
  ),
)

// Toast
const toast = ref<string | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string) {
  toast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = null
  }, 2400)
}

// Suggestion banner state
const suggestionVisible = ref(true)

function applySuggestion() {
  // Reduce 1 mesero Mié 16:00 (row index where '16:00', col '4' Mié = index 2)
  const wedRow = hours.indexOf('16:00')
  const wedCol = days.indexOf('Mié')
  if (wedRow >= 0 && wedCol >= 0) {
    const c = grid.value[wedRow][wedCol]
    if (c.staff > 0) c.staff -= 1
  }
  // Refuerza Viernes 20:00
  const friRow = hours.indexOf('20:00')
  const friCol = days.indexOf('Vie')
  if (friRow >= 0 && friCol >= 0) {
    grid.value[friRow][friCol].staff += 1
  }
  suggestionVisible.value = false
  showToast('Aplicado: ajustes en horarios sugeridos.')
}

function dismissSuggestion() {
  suggestionVisible.value = false
}

function back() {
  router.push('/modulos')
}

function formatCurrency(v: number): string {
  return v.toLocaleString('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && openCell.value) closePopover()
}

watch(openCell, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})

onMounted(() => {
  document.title = 'Optimización de Horarios · Rentabilidad360'
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <AppShell>
    <div class="mod">
      <header class="mod-top">
        <div class="mod-head">
          <h1 class="mod-title"><i class="fa-solid fa-calendar-week" /> Optimización de Horarios</h1>
          <p class="mod-sub">Calendario semanal de turnos con detección de horas críticas.</p>
        </div>
      </header>

    <div class="demo-wrap"><TiendaContextBar /></div>
    <div class="demo-wrap"><DemoBanner /></div>

    <section class="kpi-strip">
      <article class="kpi-chip">
        <div class="kpi-icon kpi-icon--primary"><i class="fa-solid fa-users" /></div>
        <div class="kpi-body">
          <span class="kpi-label">Personal total semanal</span>
          <strong class="kpi-value">{{ totalStaff }}</strong>
          <span class="kpi-sub">turnos asignados</span>
        </div>
      </article>
      <article class="kpi-chip">
        <div class="kpi-icon kpi-icon--secondary"><i class="fa-solid fa-coins" /></div>
        <div class="kpi-body">
          <span class="kpi-label">Costo estimado de nómina</span>
          <strong class="kpi-value">{{ formatCurrency(estimatedPayroll) }}</strong>
          <span class="kpi-sub">basado en ${{ hourlyCost }}/hr</span>
        </div>
      </article>
      <article class="kpi-chip">
        <div class="kpi-icon kpi-icon--warning"><i class="fa-solid fa-triangle-exclamation" /></div>
        <div class="kpi-body">
          <span class="kpi-label">Slots con desperdicio</span>
          <strong class="kpi-value">{{ wasteCount }}</strong>
          <span class="kpi-sub">turnos con baja rentabilidad</span>
        </div>
      </article>
    </section>

    <transition name="fade">
      <section v-if="suggestionVisible" class="suggestion" @click.stop>
        <div class="suggestion-icon"><i class="fa-solid fa-lightbulb" /></div>
        <div class="suggestion-body">
          <span class="suggestion-tag">Sugerencia basada en tu ERP simulado <DemoBadge tone="soft" /></span>
          <h2 class="suggestion-title">Optimiza la rotación de meseros</h2>
          <p class="suggestion-msg">
            Reduce 1 mesero en el turno de 4:00 PM a 6:00 PM los miércoles y refuérzalo el viernes por la noche.
          </p>
          <div class="suggestion-actions">
            <button class="btn btn-primary" @click="applySuggestion">
              <i class="fa-solid fa-check" /> Aplicar sugerencia
            </button>
            <button class="btn btn-ghost" @click="dismissSuggestion">
              <i class="fa-solid fa-xmark" /> Descartar
            </button>
          </div>
        </div>
      </section>
    </transition>

    <section class="grid-card">
      <header class="grid-head">
        <h3 class="grid-title">Calendario semanal de turnos <DemoBadge /></h3>
        <span class="grid-hint"><i class="fa-solid fa-hand-pointer" /> Toca una celda para ajustar personal</span>
      </header>

      <div class="grid-scroll">
        <div class="schedule">
          <div class="sched-corner">Hora</div>
          <div v-for="d in days" :key="d" class="sched-day-head">{{ d }}</div>

          <template v-for="(row, rIdx) in grid" :key="rIdx">
            <div class="sched-hour-head">
              <strong>{{ hours[rIdx] }}</strong>
              <span>+{{ blockHours }}h</span>
            </div>
            <button
              v-for="(cell, cIdx) in row"
              :key="`${rIdx}-${cIdx}`"
              :class="['sched-cell', `is-${cell.demand}`, { active: openCell?.row === rIdx && openCell?.col === cIdx }]"
              type="button"
              :aria-label="`${days[cIdx]} ${hours[rIdx]}, ${cell.staff} meseros, ${demandMeta[cell.demand].label}`"
              @click="openCellModal(rIdx, cIdx)"
            >
              <span class="cell-staff">{{ cell.staff }}</span>
              <span class="cell-staff-label">meseros</span>
            </button>
          </template>
        </div>
      </div>

      <footer class="legend">
        <span class="legend-chip legend-high"><span class="dot" /> Alta demanda</span>
        <span class="legend-chip legend-low"><span class="dot" /> Baja demanda</span>
        <span class="legend-chip legend-waste"><span class="dot" /> Desperdicio</span>
        <span class="legend-chip legend-normal"><span class="dot" /> Regular</span>
      </footer>
    </section>

    <Teleport to="body">
      <Transition name="shift-modal">
        <div
          v-if="openCell && activeCell"
          class="shift-backdrop"
          @click.self="closePopover"
          @keyup.esc="closePopover"
        >
          <article class="shift-modal" role="dialog" aria-modal="true" aria-labelledby="shift-title">
            <header :class="['shift-head', demandMeta[activeCell.demand].tone]">
              <span class="shift-demand">
                <i :class="demandMeta[activeCell.demand].icon" />
                {{ demandMeta[activeCell.demand].label }}
              </span>
              <button class="shift-close" type="button" @click="closePopover" aria-label="Cerrar">
                <i class="fa-solid fa-xmark" />
              </button>
              <h2 id="shift-title" class="shift-title">
                {{ days[openCell.col] }} · {{ hours[openCell.row] }}
                <span class="shift-range">+ {{ blockHours }}h</span>
              </h2>
              <p class="shift-hint">{{ demandMeta[activeCell.demand].hint }}</p>
            </header>

            <section class="shift-body">
              <div class="counter">
                <button
                  class="counter-btn"
                  type="button"
                  :disabled="activeCell.staff <= 0"
                  @click="adjustStaff(openCell.row, openCell.col, -1)"
                  aria-label="Quitar un mesero"
                >
                  <i class="fa-solid fa-minus" />
                </button>
                <div class="counter-value">
                  <strong>{{ activeCell.staff }}</strong>
                  <span>meseros asignados</span>
                </div>
                <button
                  class="counter-btn"
                  type="button"
                  :disabled="activeCell.staff >= 12"
                  @click="adjustStaff(openCell.row, openCell.col, 1)"
                  aria-label="Agregar un mesero"
                >
                  <i class="fa-solid fa-plus" />
                </button>
              </div>

              <ul class="shift-stats">
                <li>
                  <span><i class="fa-solid fa-clock" /> Duración</span>
                  <strong>{{ blockHours }} h</strong>
                </li>
                <li>
                  <span><i class="fa-solid fa-coins" /> Costo del bloque</span>
                  <strong>{{ formatCurrency(blockCost(activeCell)) }}</strong>
                </li>
                <li>
                  <span><i class="fa-solid fa-users" /> Hora/mesero</span>
                  <strong>{{ formatCurrency(hourlyCost) }}</strong>
                </li>
              </ul>

              <p v-if="cellSuggestion(activeCell)" class="shift-tip">
                <i class="fa-solid fa-lightbulb" /> {{ cellSuggestion(activeCell) }}
              </p>
            </section>

            <footer class="shift-foot">
              <button class="btn-ghost" type="button" @click="closePopover">Cerrar</button>
              <button
                class="btn-primary"
                type="button"
                @click="() => { closePopover(); showToast('Cambios guardados en este turno.') }"
              >
                <i class="fa-solid fa-check" /> Guardar cambios
              </button>
            </footer>
          </article>
        </div>
      </Transition>
    </Teleport>

    <section class="info-row">
      <article class="info-card">
        <div class="info-icon"><i class="fa-solid fa-wand-magic-sparkles" /></div>
        <h4>Sugerencias inteligentes</h4>
        <p>Nuestro motor cruza ventas históricas con tu ERP para detectar turnos con desperdicio de nómina.</p>
      </article>
      <article class="info-card">
        <div class="info-icon"><i class="fa-solid fa-arrows-rotate" /></div>
        <h4>Reasignación dinámica</h4>
        <p>Mueve personal de horas valle a picos de demanda y reduce hasta 18% del costo semanal de meseros.</p>
      </article>
    </section>

    <transition name="toast">
      <div v-if="toast" class="toast"><i class="fa-solid fa-check" /> {{ toast }}</div>
    </transition>
    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.mod { padding: 0 0 60px; }
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
  position: sticky; top: 0; z-index: 20;
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

/* KPI strip */
.kpi-strip {
  display: grid; gap: 12px; margin: 20px;
  grid-template-columns: 1fr;
  @media (min-width: 720px) { grid-template-columns: repeat(3, 1fr); }
}
.kpi-chip {
  display: flex; align-items: center; gap: 14px;
  background: white; border: 1px solid rgba($primary-dark, 0.06);
  border-radius: 22px; padding: 16px 18px;
}
.kpi-icon {
  width: 46px; height: 46px; border-radius: 14px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1.1rem;
  &--primary { background: rgba($primary, 0.12); color: $primary; }
  &--secondary { background: rgba($secondary, 0.16); color: darken($secondary, 6%); }
  &--warning { background: rgba($alert-warning, 0.18); color: darken($alert-warning, 12%); }
}
.kpi-body { display: flex; flex-direction: column; gap: 2px; }
.kpi-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase; color: $text-secondary; }
.kpi-value { font-size: 1.35rem; font-weight: 800; color: $primary-dark; font-variant-numeric: tabular-nums; }
.kpi-sub { font-size: 0.74rem; color: $text-secondary; }

/* Suggestion banner */
.suggestion {
  margin: 0 20px 20px;
  padding: 18px 20px;
  border-radius: 22px;
  display: grid; grid-template-columns: 56px 1fr; gap: 18px; align-items: flex-start;
  background: linear-gradient(135deg, #fffbeb, white);
  border: 1px solid rgba($alert-warning, 0.35);
}
.suggestion-icon {
  width: 56px; height: 56px; border-radius: 16px;
  background: rgba($alert-warning, 0.18); color: darken($alert-warning, 14%);
  display: inline-flex; align-items: center; justify-content: center; font-size: 1.4rem;
}
.suggestion-body { display: flex; flex-direction: column; gap: 6px; }
.suggestion-tag {
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.4px;
  text-transform: uppercase; color: darken($alert-warning, 18%);
}
.suggestion-title { margin: 0; font-size: 1.05rem; font-weight: 800; color: $primary-dark; }
.suggestion-msg { margin: 0; font-size: 0.9rem; color: $primary-dark; line-height: 1.5; }
.suggestion-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 16px; border-radius: 12px;
  font-family: $font-principal; font-weight: 700; font-size: 0.85rem;
  border: none; cursor: pointer; transition: transform 0.15s, background 0.15s;
  &:active { transform: scale(0.97); }
}
.btn-primary {
  color: white; background: linear-gradient(135deg, $primary, #1678b0);
  box-shadow: 0 10px 20px rgba($primary, 0.28);
}
.btn-ghost {
  background: rgba($primary-dark, 0.06); color: $primary-dark;
  &:hover { background: rgba($primary-dark, 0.1); }
}

/* Grid card */
.grid-card {
  margin: 0 20px;
  background: white;
  border: 1px solid rgba($primary-dark, 0.06);
  border-radius: 22px;
  padding: 18px;
}
.grid-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap; margin-bottom: 14px;
}
.grid-title { margin: 0; font-size: 1rem; font-weight: 800; color: $primary-dark; }
.grid-hint {
  font-size: 0.75rem; font-weight: 600; color: $text-secondary;
  display: inline-flex; align-items: center; gap: 6px;
  i { color: $primary; }
}

.grid-scroll {
  overflow-x: auto;
  margin: 0 -4px;
  padding: 0 4px 6px;
  scrollbar-width: thin;
}
.schedule {
  display: grid;
  grid-template-columns: 84px repeat(7, minmax(64px, 1fr));
  gap: 6px;
  min-width: 560px;
}
.sched-corner {
  font-size: 0.7rem; font-weight: 700; color: $text-secondary;
  display: inline-flex; align-items: center; justify-content: center;
  text-transform: uppercase; letter-spacing: 0.4px;
}
.sched-day-head {
  font-size: 0.78rem; font-weight: 800; color: $primary-dark;
  text-align: center; padding: 10px 4px;
  background: rgba($primary, 0.06); border-radius: 10px;
}
.sched-hour-head {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 6px;
  font-family: $font-principal;
  strong { font-size: 0.82rem; color: $primary-dark; font-weight: 800; }
  span { font-size: 0.66rem; color: $text-secondary; font-weight: 600; }
}
.sched-cell {
  position: relative;
  height: 60px;
  border-radius: 12px;
  border: 1px solid rgba($primary-dark, 0.07);
  background: #fcfcfd;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
  user-select: none;
  font-family: $font-principal;
  padding: 0;

  &:hover { transform: translateY(-1px); box-shadow: 0 8px 16px rgba($primary-dark, 0.06); }
  &:active { transform: scale(0.97); }
  &:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba($primary, 0.35); }

  &.active {
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba($primary, 0.18);
  }

  &.is-high {
    background: linear-gradient(135deg, rgba($alert-success, 0.22), rgba($alert-success, 0.08));
    border-color: rgba($alert-success, 0.5);
  }
  &.is-low {
    background: linear-gradient(135deg, rgba($primary-dark, 0.08), rgba($primary-dark, 0.03));
    border-color: rgba($primary-dark, 0.12);
  }
  &.is-waste {
    background: linear-gradient(135deg, rgba($alert-error, 0.22), rgba($alert-error, 0.08));
    border-color: rgba($alert-error, 0.5);
  }
}
.cell-staff {
  font-size: 1.05rem; font-weight: 800; color: $primary-dark;
  font-variant-numeric: tabular-nums; line-height: 1;
}
.cell-staff-label {
  font-size: 0.62rem; color: $text-secondary; font-weight: 600;
  margin-top: 2px;
}
.is-high .cell-staff { color: darken($alert-success, 16%); }
.is-waste .cell-staff { color: darken($alert-error, 8%); }

/* Popover */
.popover {
  position: absolute;
  z-index: 30;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  width: 220px;
  background: white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba($primary-dark, 0.18);
  padding: 12px;
  display: flex; flex-direction: column; gap: 10px;

  &::before {
    content: '';
    position: absolute; top: -6px; left: 50%; transform: translateX(-50%) rotate(45deg);
    width: 10px; height: 10px;
    background: white;
    border-top: 1px solid rgba($primary-dark, 0.08);
    border-left: 1px solid rgba($primary-dark, 0.08);
  }
}
.pop-head {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 0.78rem; color: $primary-dark;
  strong { font-weight: 800; }
}
.pop-close {
  background: transparent; border: none; cursor: pointer;
  color: $text-secondary; padding: 4px; border-radius: 6px;
  &:hover { background: rgba($primary-dark, 0.06); color: $primary-dark; }
}
.pop-controls {
  display: grid; grid-template-columns: 44px 1fr 44px; gap: 10px; align-items: center;
}
.pop-btn {
  width: 44px; height: 44px; border-radius: 12px;
  border: 1px solid rgba($primary, 0.25);
  background: rgba($primary, 0.08); color: $primary;
  font-size: 0.95rem; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background 0.15s, transform 0.15s;
  &:hover:not(:disabled) { background: rgba($primary, 0.18); }
  &:active:not(:disabled) { transform: scale(0.94); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}
.pop-count {
  display: flex; flex-direction: column; align-items: center; line-height: 1;
  strong { font-size: 1.4rem; font-weight: 800; color: $primary-dark; font-variant-numeric: tabular-nums; }
  span { font-size: 0.66rem; color: $text-secondary; font-weight: 600; margin-top: 4px; }
}
.pop-tip {
  margin: 0; font-size: 0.74rem; line-height: 1.4;
  background: rgba($alert-warning, 0.14);
  color: darken($alert-warning, 22%);
  padding: 8px 10px; border-radius: 10px;
  display: flex; align-items: flex-start; gap: 6px;
  i { margin-top: 2px; }
}

/* Legend */
.legend {
  display: flex; flex-wrap: wrap; gap: 10px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed rgba($primary-dark, 0.08);
}
.legend-chip {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 12px; border-radius: 999px;
  font-size: 0.74rem; font-weight: 700; color: $primary-dark;
  background: rgba($primary-dark, 0.05);
  .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  &.legend-high {
    background: rgba($alert-success, 0.14);
    color: darken($alert-success, 18%);
    .dot { background: $alert-success; }
  }
  &.legend-low {
    background: rgba($primary-dark, 0.08);
    color: $primary-dark;
    .dot { background: $primary-dark; }
  }
  &.legend-waste {
    background: rgba($alert-error, 0.14);
    color: darken($alert-error, 8%);
    .dot { background: $alert-error; }
  }
  &.legend-normal {
    background: #f1f5f9;
    color: $primary-dark;
    .dot { background: rgba($primary-dark, 0.45); }
  }
}

/* ===== Shift modal ===== */
.shift-backdrop {
  position: fixed; inset: 0;
  background: rgba($primary-dark, 0.55);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  z-index: 9990;
}
.shift-modal {
  width: 100%;
  max-width: 460px;
  background: white;
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba($primary-dark, 0.32);
  font-family: $font-principal;
  display: flex; flex-direction: column;
}
.shift-head {
  position: relative;
  padding: 22px 22px 18px;
  background: linear-gradient(135deg, rgba($primary, 0.08), white);

  &.high { background: linear-gradient(135deg, rgba($alert-success, 0.16), white); }
  &.low { background: linear-gradient(135deg, rgba($primary-dark, 0.08), white); }
  &.waste { background: linear-gradient(135deg, rgba($alert-error, 0.18), white); }
  &.normal { background: linear-gradient(135deg, rgba($primary, 0.06), white); }
}
.shift-demand {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.7rem; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase;
  padding: 5px 10px; border-radius: 999px;
  background: rgba($primary-dark, 0.08); color: $primary-dark;

  .shift-head.high & { background: rgba($alert-success, 0.2); color: darken($alert-success, 18%); }
  .shift-head.low & { background: rgba($primary-dark, 0.1); color: $primary-dark; }
  .shift-head.waste & { background: rgba($alert-error, 0.18); color: darken($alert-error, 8%); }
  .shift-head.normal & { background: rgba($primary, 0.12); color: $primary; }
}
.shift-close {
  position: absolute; top: 14px; right: 14px;
  width: 36px; height: 36px; border-radius: 10px;
  border: none; cursor: pointer;
  background: rgba($primary-dark, 0.06); color: $primary-dark;
  font-size: 0.85rem;
  &:hover { background: rgba($primary-dark, 0.12); }
}
.shift-title {
  margin: 12px 0 4px;
  font-size: 1.4rem; font-weight: 800; color: $primary-dark;
  display: inline-flex; align-items: baseline; gap: 8px;
}
.shift-range {
  font-size: 0.78rem; font-weight: 700; color: $text-secondary;
  background: rgba($primary-dark, 0.06);
  padding: 2px 8px; border-radius: 10px;
}
.shift-hint {
  margin: 6px 0 0;
  font-size: 0.88rem; color: $text-secondary; line-height: 1.5;
}

.shift-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 16px; }

.counter {
  display: grid;
  grid-template-columns: 56px 1fr 56px;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 16px;
}
.counter-btn {
  width: 56px; height: 56px;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  background: white;
  color: $primary;
  font-size: 1.1rem;
  box-shadow: 0 6px 16px rgba($primary-dark, 0.08);
  transition: transform 0.15s, background 0.2s;
  &:hover:not(:disabled) { background: rgba($primary, 0.08); }
  &:active:not(:disabled) { transform: scale(0.94); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}
.counter-value {
  display: flex; flex-direction: column; align-items: center; line-height: 1.1;
  strong { font-size: 2.4rem; font-weight: 800; color: $primary-dark; font-variant-numeric: tabular-nums; }
  span { font-size: 0.75rem; color: $text-secondary; font-weight: 600; }
}

.shift-stats {
  list-style: none; margin: 0; padding: 0;
  display: grid; gap: 8px;
  grid-template-columns: 1fr 1fr 1fr;

  li {
    background: #f8fafc;
    border-radius: 12px;
    padding: 10px;
    display: flex; flex-direction: column; gap: 2px;
    line-height: 1.2;
    span {
      font-size: 0.66rem; font-weight: 700; color: $text-secondary;
      text-transform: uppercase; letter-spacing: 0.4px;
      display: inline-flex; align-items: center; gap: 4px;
      i { color: $primary; }
    }
    strong { font-size: 0.95rem; font-weight: 800; color: $primary-dark; }
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    li:last-child { grid-column: 1 / -1; }
  }
}

.shift-tip {
  margin: 0;
  background: rgba($alert-warning, 0.12);
  color: darken($alert-warning, 22%);
  font-size: 0.85rem;
  padding: 12px 14px;
  border-radius: 12px;
  display: flex; align-items: flex-start; gap: 8px;
  line-height: 1.5;
  i { margin-top: 2px; color: darken($alert-warning, 12%); }
}

.shift-foot {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 10px;
  padding: 0 22px 22px;
}
.btn-ghost, .btn-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px 16px;
  border-radius: 12px;
  font-family: $font-principal; font-weight: 800; font-size: 0.92rem;
  cursor: pointer;
  border: none;
  transition: transform 0.15s;
  &:active { transform: scale(0.97); }
}
.btn-ghost {
  background: rgba($primary-dark, 0.06);
  color: $primary-dark;
  &:hover { background: rgba($primary-dark, 0.12); }
}
.btn-primary {
  background: linear-gradient(135deg, $primary, #1678b0);
  color: white;
  box-shadow: 0 10px 24px rgba($primary, 0.3);
}

.shift-modal-enter-active, .shift-modal-leave-active { transition: opacity 0.22s; }
.shift-modal-enter-from, .shift-modal-leave-to { opacity: 0; }
.shift-modal-enter-active .shift-modal,
.shift-modal-leave-active .shift-modal {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s;
}
.shift-modal-enter-from .shift-modal,
.shift-modal-leave-to .shift-modal {
  transform: translateY(24px) scale(0.96);
  opacity: 0;
}

/* Info row */
.info-row {
  display: grid; gap: 12px; margin: 20px;
  grid-template-columns: 1fr;
  @media (min-width: 640px) { grid-template-columns: 1fr 1fr; }
}
.info-card {
  background: white; border: 1px solid rgba($primary-dark, 0.06);
  border-radius: 18px; padding: 18px;
  display: flex; flex-direction: column; gap: 6px;
  h4 { margin: 0; font-size: 0.95rem; font-weight: 700; color: $primary-dark; }
  p { margin: 0; font-size: 0.82rem; color: $text-secondary; line-height: 1.5; }
}
.info-icon {
  width: 40px; height: 40px; border-radius: 12px;
  background: rgba($primary, 0.1); color: $primary;
  display: inline-flex; align-items: center; justify-content: center;
}

/* Toast */
.toast {
  position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%);
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 18px; border-radius: 999px;
  background: $primary-dark; color: white;
  font-family: $font-principal; font-weight: 700; font-size: 0.85rem;
  box-shadow: 0 18px 32px rgba($primary-dark, 0.35);
  z-index: 40;
  i { color: $alert-success; }
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s, transform 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }

.toast-enter-active, .toast-leave-active { transition: opacity 0.25s, transform 0.25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 12px); }
</style>
