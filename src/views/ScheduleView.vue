<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TiendaContextBar from '@/components/TiendaContextBar.vue'
import AppShell from '@/layout/AppShell.vue'
import { staffService } from '@/services/staffService'

type Demand = 'high' | 'low' | 'waste' | 'normal'

interface Cell {
  staff: number
  demand: Demand
}

interface TimeBlock {
  label: string
  hour: string
  cells: Cell[]
}

const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const blockDuration = 2
const hourlyCost = 5

const blocks = ref<TimeBlock[]>([])

const addModalOpen = ref(false)
const addHour = ref('')
const addHourError = ref('')
const customHour = ref('')

const quickHours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']

function openAddModal() {
  addHour.value = ''
  addHourError.value = ''
  customHour.value = ''
  addModalOpen.value = true
}
function closeAddModal() {
  addModalOpen.value = false
}

function selectQuickHour(h: string) {
  addHour.value = h
  customHour.value = h
  addHourError.value = ''
}

function onCustomInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, '').slice(0, 4)
  let formatted = raw
  if (raw.length > 2) formatted = raw.slice(0, 2) + ':' + raw.slice(2)
  customHour.value = formatted
  addHour.value = formatted
  addHourError.value = ''
}

function onCustomBlur() {
  if (addHour.value && !/^\d{2}:\d{2}$/.test(addHour.value)) {
    addHour.value = ''
    customHour.value = ''
  }
}

function confirmAddBlock() {
  const h = addHour.value.trim()
  if (!h) { addHourError.value = 'Ingresa una hora'; return }
  if (!/^\d{1,2}:\d{2}$/.test(h)) { addHourError.value = 'Formato: HH:MM'; return }
  const exists = blocks.value.some(b => b.hour === h)
  if (exists) { addHourError.value = 'Ese horario ya existe'; return }
  const hourNum = parseInt(h)
  if (hourNum < 6 || hourNum > 23) { addHourError.value = 'Solo horario de 06:00 a 23:00'; return }
  blocks.value.push({
    label: `${h} (${hourNum}h–${hourNum + blockDuration}h)`,
    hour: h,
    cells: days.map(() => ({ staff: 0, demand: 'normal' as Demand })),
  })
  blocks.value.sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
  addModalOpen.value = false
  showToast(`Bloque de ${h} agregado`)
}

function removeBlock(hour: string) {
  blocks.value = blocks.value.filter(b => b.hour !== hour)
  showToast(`Bloque de ${hour} eliminado`)
}

const totalStaff = computed(() =>
  blocks.value.reduce((sum, b) => sum + b.cells.reduce((s, c) => s + c.staff, 0), 0)
)
const estimatedPayroll = computed(() => totalStaff.value * blockDuration * hourlyCost)
const wasteCount = computed(() =>
  blocks.value.reduce((sum, b) => sum + b.cells.filter(c => c.demand === 'waste').length, 0)
)

function formatCurrency(v: number): string {
  return v.toLocaleString('es-EC', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  })
}

const toast = ref<string | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string) {
  toast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, 2400)
}

function adjustStaff(blockHour: string, dayIdx: number, delta: number) {
  const block = blocks.value.find(b => b.hour === blockHour)
  if (!block) return
  const cell = block.cells[dayIdx]
  if (!cell) return
  const next = cell.staff + delta
  if (next < 0 || next > 12) return
  cell.staff = next
}

function blockStatus(b: TimeBlock): 'active' | 'partial' | 'inactive' {
  const active = b.cells.filter(c => c.staff > 0).length
  if (active === 0) return 'inactive'
  if (active < days.length) return 'partial'
  return 'active'
}

function duplicateBlock(b: TimeBlock) {
  const newHour = `${parseInt(b.hour) + blockDuration}`.padStart(2, '0') + ':00'
  const exists = blocks.value.some(x => x.hour === newHour)
  if (exists || parseInt(newHour) >= 24) {
    showToast('No se puede duplicar: horario inválido o ya existe')
    return
  }
  const h = parseInt(newHour)
  blocks.value.push({
    label: `${newHour} (${h}h–${h + blockDuration}h)`,
    hour: newHour,
    cells: b.cells.map(c => ({ ...c })),
  })
  blocks.value.sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
  showToast(`Bloque duplicado a las ${newHour}`)
}

async function loadShifts() {
  try {
    const res = await staffService.listShifts()
    const data = (res.data as any) ?? []
    if (data.length === 0) return
    const grouped = new Map<string, Cell[]>()
    for (const shift of data) {
      const hour = shift.startTime?.slice(0, 5)
      if (!hour) continue
      if (!grouped.has(hour)) grouped.set(hour, days.map(() => ({ staff: 0, demand: 'normal' as Demand })))
      const dayIdx = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(
        ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][shift.dayOfWeek] || ''
      )
      const cell = grouped.get(hour)![dayIdx >= 0 ? dayIdx : shift.dayOfWeek]
      if (cell) {
        cell.staff = shift.staffCount ?? 0
      }
    }
    blocks.value = Array.from(grouped.entries())
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([hour, cells]) => {
        const hourNum = parseInt(hour)
        return { label: `${hour} (${hourNum}h–${hourNum + blockDuration}h)`, hour, cells }
      })
  } catch {
    // No shifts yet — user will add them manually
  }
}

onMounted(() => {
  document.title = 'Optimización de Horarios · Rentabilidad360'
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAddModal() })
  loadShifts()
})
</script>

<template>
  <AppShell>
    <div class="mod">
      <div class="mod-top">
        <div class="mod-head">
          <h1 class="mod-title"><i class="fa-solid fa-calendar-week" /> Optimización de Horarios</h1>
          <p class="mod-sub">Asigna cuántas personas trabajan en cada turno, de lunes a domingo.</p>
        </div>
        <button class="mod-add-btn" @click="openAddModal"><i class="fa-solid fa-plus" /> Añadir turno</button>
      </div>

      <div class="demo-wrap"><TiendaContextBar /></div>

      <section class="kpi-bar">
        <span class="kpi-item"><i class="fa-solid fa-users" /> {{ totalStaff }} personas · {{ formatCurrency(estimatedPayroll) }}/sem</span>
        <span v-if="wasteCount > 0" class="kpi-item kpi-item--warn"><i class="fa-solid fa-triangle-exclamation" /> {{ wasteCount }} turno{{ wasteCount > 1 ? 's' : '' }} con alerta</span>
      </section>

      <div v-if="blocks.length === 0" class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-calendar-plus" /></div>
        <h3 class="empty-title">No hay turnos todavía</h3>
        <p class="empty-text">Agrega un horario para empezar a asignar personal.</p>
        <button class="btn btn-primary empty-cta" @click="openAddModal"><i class="fa-solid fa-plus" /> Crear primer turno</button>
      </div>

      <section v-else class="sched-wrap">
        <div class="sched-scroll">
          <div class="sched">
            <div class="sched-head">
              <div class="sched-corner">Horario</div>
              <div v-for="d in days" :key="d" class="sched-day">{{ d }}</div>
            </div>
            <TransitionGroup name="row" tag="div" class="sched-body">
              <div v-for="(block, bi) in blocks" :key="block.hour" class="sched-row" :style="{ '--i': bi }">
                <div :class="['sched-info', `info-${blockStatus(block)}`]">
                  <strong class="sched-time">{{ block.hour }}</strong>
                  <span class="sched-dur">{{ blockDuration }}h</span>
                  <div class="sched-acts">
                    <button title="Duplicar" @click="duplicateBlock(block)"><i class="fa-solid fa-copy" /></button>
                    <button title="Eliminar" @click="removeBlock(block.hour)"><i class="fa-solid fa-trash-can" /></button>
                  </div>
                </div>
                <div v-for="(cell, ci) in block.cells" :key="`${bi}-${ci}`"
                  :class="['sched-cell', `is-${cell.demand}`]">
                  <button class="sc-btn" :disabled="cell.staff <= 0" @click="adjustStaff(block.hour, ci, -1)"><i class="fa-solid fa-minus" /></button>
                  <span class="sc-num" :key="cell.staff">{{ cell.staff }}</span>
                  <button class="sc-btn" :disabled="cell.staff >= 12" @click="adjustStaff(block.hour, ci, 1)"><i class="fa-solid fa-plus" /></button>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </div>

        <div class="sched-legend">
          <span><span class="dot dot--high" /> Bien</span>
          <span><span class="dot dot--normal" /> Normal</span>
          <span><span class="dot dot--waste" /> Alerta</span>
        </div>
      </section>

      <Teleport to="body">
        <Transition name="modal">
          <div v-if="addModalOpen" class="modal-backdrop" @click.self="closeAddModal">
            <article class="add-modal" role="dialog" aria-modal="true">
              <header class="add-modal-head">
                <h3><i class="fa-solid fa-plus" /> Añadir bloque horario</h3>
                <button class="add-modal-close" @click="closeAddModal"><i class="fa-solid fa-xmark" /></button>
              </header>
              <div class="add-modal-body">
                <label class="add-field">
                  <span>Hora de inicio</span>
                  <div class="time-input-wrap">
                    <input
                      :value="customHour"
                      type="text"
                      inputmode="numeric"
                      placeholder="HH:MM"
                      maxlength="5"
                      autocomplete="off"
                      @input="onCustomInput"
                      @blur="onCustomBlur"
                      @keyup.enter="confirmAddBlock"
                    />
                    <span class="time-input-icon"><i class="fa-regular fa-clock" /></span>
                  </div>
                </label>
                <div class="quick-hours">
                  <button
                    v-for="h in quickHours"
                    :key="h"
                    :class="['qh-chip', { active: addHour === h }]"
                    @click="selectQuickHour(h)"
                  >{{ h }}</button>
                </div>
                <p v-if="addHourError" class="add-field-error">{{ addHourError }}</p>
                <p class="add-hint">Se creará un bloque de {{ blockDuration }} horas para los 7 días con 0 personas asignadas.</p>
              </div>
              <footer class="add-modal-foot">
                <button class="btn btn-ghost" @click="closeAddModal">Cancelar</button>
                <button class="btn btn-primary" @click="confirmAddBlock"><i class="fa-solid fa-check" /> Añadir</button>
              </footer>
            </article>
          </div>
        </Transition>
      </Teleport>

      <Transition name="toast">
        <div v-if="toast" class="toast"><i class="fa-solid fa-check" /> {{ toast }}</div>
      </Transition>
    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.mod { padding: 0 0 60px; }
.mod-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 24px 28px 0; flex-wrap: wrap; }
.mod-head { display: flex; flex-direction: column; gap: 4px; }
.mod-title { margin: 0; font-size: 1.3rem; font-weight: 800; color: $primary-dark; display: inline-flex; align-items: center; gap: 10px; i { color: $primary; } }
.mod-sub { margin: 0; color: $text-secondary; font-size: 0.9rem; }
.mod-add-btn {
  display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border: none;
  border-radius: 12px; background: $primary; color: white; font-family: $font-principal;
  font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.15s;
  box-shadow: 0 8px 20px rgba($primary, 0.25);
  i { font-size: 0.85rem; }
  &:hover { background: $primary-dark; transform: translateY(-1px); box-shadow: 0 10px 24px rgba($primary, 0.3); }
  &:active { transform: scale(0.97); }
}
@media (max-width: 720px) { .mod-top { padding: 18px 16px 0; flex-direction: column; } .mod-add-btn { width: 100%; justify-content: center; } }
.demo-wrap { margin: 18px 28px 0; }

.empty-state {
  margin: 0 20px; padding: 60px 20px; display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 10px; background: white; border-radius: 22px;
  border: 1.5px dashed rgba($primary, 0.2);
}
.empty-icon { width: 56px; height: 56px; border-radius: 16px; background: rgba($primary, 0.1); color: $primary; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
.empty-title { margin: 0; font-size: 1.1rem; font-weight: 800; color: $primary-dark; }
.empty-text { margin: 0; font-size: 0.9rem; color: $text-secondary; max-width: 360px; line-height: 1.5; }
.empty-cta { margin-top: 8px; }

.kpi-bar { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 20px 0; }
.kpi-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; font-weight: 700; color: $primary-dark; background: white; border: 1px solid rgba($primary-dark, 0.06); border-radius: 999px; padding: 7px 14px; i { color: $primary; font-size: 0.75rem; } &--warn { border-color: rgba($alert-warning, 0.25); i { color: $alert-warning; } } }

.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 12px; font-family: $font-principal; font-weight: 700; font-size: 0.85rem; border: none; cursor: pointer; transition: transform 0.15s, background 0.15s; &:active { transform: scale(0.97); } }
.btn-primary { color: white; background: linear-gradient(135deg, $primary, $secondary); box-shadow: 0 10px 20px rgba($primary, 0.28); }
.btn-ghost { background: rgba($primary-dark, 0.06); color: $primary-dark; &:hover { background: rgba($primary-dark, 0.1); } }

.sched-wrap { margin: 16px 20px 0; background: white; border: 1px solid rgba($primary-dark, 0.06); border-radius: 22px; padding: 16px; }
.sched-scroll { overflow-x: auto; margin: 0 -4px; padding: 0 4px 6px; scrollbar-width: thin; }
.sched { display: flex; flex-direction: column; gap: 6px; min-width: 540px; }
.sched-body { display: flex; flex-direction: column; gap: 6px; position: relative; }

.sched-head { display: grid; grid-template-columns: 90px repeat(7, 1fr); gap: 4px; }
.sched-corner { font-size: 0.7rem; font-weight: 700; color: $text-secondary; display: flex; align-items: center; justify-content: center; text-transform: uppercase; letter-spacing: 0.4px; }
.sched-day { font-size: 0.78rem; font-weight: 800; color: $primary-dark; text-align: center; padding: 8px 4px; background: rgba($primary, 0.06); border-radius: 8px; }

.sched-row { display: grid; grid-template-columns: 90px repeat(7, 1fr); gap: 4px; background: white; border-radius: 12px; border: 1px solid rgba($primary-dark, 0.05); padding: 5px; transition: border-color 0.2s; &:hover { border-color: rgba($primary, 0.15); } }

.sched-info { display: flex; align-items: center; justify-content: center; gap: 3px; border-radius: 8px; padding: 4px; flex-wrap: wrap; font-family: $font-principal; &.info-inactive { opacity: 0.4; } &.info-active { background: rgba($alert-success, 0.08); } &.info-partial { background: rgba($alert-warning, 0.07); } }
.sched-time { font-size: 0.82rem; font-weight: 800; color: $primary-dark; }
.sched-dur { font-size: 0.6rem; font-weight: 600; color: $text-secondary; width: 100%; text-align: center; }
.sched-acts { display: flex; gap: 2px; width: 100%; justify-content: center; button { width: 18px; height: 18px; border-radius: 3px; border: none; background: transparent; cursor: pointer; color: $text-secondary; font-size: 0.55rem; padding: 0; display: inline-flex; align-items: center; justify-content: center; &:hover { background: rgba($primary-dark, 0.08); color: $primary-dark; } &:last-child:hover { background: rgba($alert-error, 0.1); color: $alert-error; } } }

.sched-cell { height: 42px; border-radius: 8px; border: 1px solid rgba($primary-dark, 0.07); background: #fcfcfd; display: flex; align-items: center; justify-content: center; gap: 3px; transition: border-color 0.15s; user-select: none; font-family: $font-principal;
  &.is-high { background: rgba($alert-success, 0.12); border-color: rgba($alert-success, 0.3); }
  &.is-low { background: rgba($primary-dark, 0.04); border-color: rgba($primary-dark, 0.07); }
  &.is-waste { background: rgba($alert-error, 0.12); border-color: rgba($alert-error, 0.35); animation: pulse-waste 2s ease-in-out infinite; }
  &:hover { border-color: rgba($primary, 0.25); background: rgba($primary, 0.03); }
}
.sc-num { font-size: 1rem; font-weight: 800; color: $primary-dark; font-variant-numeric: tabular-nums; min-width: 16px; text-align: center; }
.is-high .sc-num { color: darken($alert-success, 14%); }
.is-waste .sc-num { color: darken($alert-error, 8%); }
.sc-btn { width: 24px; height: 24px; border-radius: 6px; border: 1px solid rgba($primary, 0.15); background: white; color: $primary; font-size: 0.55rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.1s; box-shadow: 0 1px 3px rgba($primary-dark, 0.04); padding: 0;
  &:hover:not(:disabled) { background: $primary; color: white; border-color: $primary; }
  &:active:not(:disabled) { transform: scale(0.88); }
  &:disabled { opacity: 0.25; cursor: not-allowed; }
}

.sched-legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed rgba($primary-dark, 0.07); font-size: 0.74rem; font-weight: 600; color: $text-secondary; span { display: inline-flex; align-items: center; gap: 5px; } }
.dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; &--high { background: $alert-success; } &--normal { background: rgba($primary-dark, 0.3); } &--waste { background: $alert-error; } }

.row-enter-active { animation: row-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); animation-delay: calc(var(--i, 0) * 0.04s); animation-fill-mode: both; }
.row-leave-active { animation: row-out 0.2s ease-in; position: absolute; }
.row-move { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes row-in { from { opacity: 0; transform: translateY(-12px) scale(0.97); } }
@keyframes row-out { to { opacity: 0; transform: translateX(-20px) scale(0.96); } }
@keyframes pulse-waste { 0%, 100% { opacity: 1; } 50% { opacity: 0.75; } }

.modal-backdrop { position: fixed; inset: 0; background: rgba($primary-dark, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 9990; }
.add-modal { width: 100%; max-width: 400px; background: white; border-radius: 20px; box-shadow: 0 30px 80px rgba($primary-dark, 0.3); overflow: hidden; }
.add-modal-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 22px 0; h3 { margin: 0; font-size: 1.05rem; font-weight: 800; color: $primary-dark; display: inline-flex; align-items: center; gap: 8px; i { color: $primary; } } }
.add-modal-close { width: 32px; height: 32px; border-radius: 8px; border: none; background: rgba($primary-dark, 0.06); color: $primary-dark; cursor: pointer; font-size: 0.85rem; &:hover { background: rgba($primary-dark, 0.12); } }
.add-modal-body { padding: 16px 22px 0; display: flex; flex-direction: column; gap: 12px; }
.add-field { display: flex; flex-direction: column; gap: 6px; span { font-size: 0.78rem; font-weight: 700; color: $primary-dark; } }
.time-input-wrap { display: flex; align-items: center; background: white; border: 1.5px solid rgba($primary-dark, 0.1); border-radius: 12px; transition: border-color 0.15s, box-shadow 0.15s; overflow: hidden; &:focus-within { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.08); } input { flex: 1; border: none; background: transparent; padding: 12px 0 12px 14px; font-family: $font-principal; font-size: 1.1rem; font-weight: 800; color: $primary-dark; outline: none; letter-spacing: 1px; &::placeholder { color: rgba($primary-dark, 0.15); font-weight: 700; } } .time-input-icon { display: flex; align-items: center; padding: 0 14px; color: rgba($primary-dark, 0.2); font-size: 1rem; } }
.quick-hours { display: flex; flex-wrap: wrap; gap: 6px; }
.qh-chip { display: inline-flex; align-items: center; justify-content: center; padding: 8px 14px; border-radius: 10px; border: 1.5px solid rgba($primary-dark, 0.06); background: #f8f9fa; font-family: $font-principal; font-size: 0.82rem; font-weight: 700; color: $text-secondary; cursor: pointer; transition: all 0.12s; &:hover { border-color: rgba($primary, 0.25); background: white; color: $primary-dark; } &.active { border-color: $primary; background: rgba($primary, 0.08); color: $primary; } }
.add-field-error { margin: 0; font-size: 0.75rem; color: $alert-error; font-weight: 600; }
.add-hint { margin: 0; font-size: 0.78rem; color: $text-secondary; line-height: 1.5; }
.add-modal-foot { display: flex; gap: 10px; justify-content: flex-end; padding: 16px 22px 20px; }
.add-modal-foot .btn { padding: 10px 18px; }

.toast { position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); display: inline-flex; align-items: center; gap: 8px; padding: 12px 18px; border-radius: 999px; background: $primary-dark; color: white; font-family: $font-principal; font-weight: 700; font-size: 0.85rem; box-shadow: 0 18px 32px rgba($primary-dark, 0.35); z-index: 40; i { color: $alert-success; } }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .add-modal, .modal-leave-active .add-modal { transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s; }
.modal-enter-from .add-modal, .modal-leave-to .add-modal { transform: translateY(20px) scale(0.96); opacity: 0; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.25s, transform 0.25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 12px); }
</style>