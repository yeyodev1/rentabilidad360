<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DemoBanner from '@/components/DemoBanner.vue'
import DemoBadge from '@/components/DemoBadge.vue'
import TiendaContextBar from '@/components/TiendaContextBar.vue'
import AppShell from '@/layout/AppShell.vue'

interface Task { id: string; label: string; done: boolean | null }

const limitHour = 11
const now = ref(new Date())
setInterval(() => { now.value = new Date() }, 30_000)

const tasks = ref<Task[]>([
  { id: 't1', label: 'Limpieza profunda de plancha y freidoras', done: null },
  { id: 't2', label: 'Higienizado de mesones, tablas y utensilios', done: null },
  { id: 't3', label: 'Control de temperaturas de cámaras frías', done: null },
  { id: 't4', label: 'Registro de proveedores recibidos', done: null },
  { id: 't5', label: 'Aseo y desinfección de baños', done: null },
  { id: 't6', label: 'Trampas de grasa revisadas', done: null },
])

const completed = computed(() => tasks.value.filter((t) => t.done === true).length)
const total = computed(() => tasks.value.length)
const ratio = computed(() => (total.value === 0 ? 0 : completed.value / total.value))

const lateForLimit = computed(() => {
  const cutoff = new Date(now.value)
  cutoff.setHours(limitHour, 0, 0, 0)
  return now.value > cutoff && ratio.value < 1
})

const semaforo = computed<'green' | 'yellow' | 'red'>(() => {
  if (ratio.value >= 1) return 'green'
  if (lateForLimit.value) return 'red'
  if (ratio.value >= 0.5) return 'yellow'
  return 'yellow'
})

const semaforoLabel = computed(() => ({
  green: 'Cumplido',
  yellow: 'En progreso',
  red: 'Fuera de hora',
}[semaforo.value]))

const semaforoMsg = computed(() => {
  if (semaforo.value === 'green') return 'Todo el equipo cumplió antes del corte. Listos para inspección.'
  if (semaforo.value === 'red') return `Pasaron las ${limitHour}:00 y faltan ${total.value - completed.value} tareas. Se envió alerta al dueño.`
  return `Faltan ${total.value - completed.value} tareas antes de las ${limitHour}:00 AM.`
})

function setDone(t: Task, value: boolean) {
  t.done = value
}

function printReport() {
  window.print()
}

onMounted(() => {
  document.title = 'Control Sanitario · Rentabilidad360'
})
</script>

<template>
  <AppShell>
    <div class="mod">
      <header class="mod-top">
        <div class="mod-head">
          <h1 class="mod-title"><i class="fa-solid fa-clipboard-list" /> Control Sanitario</h1>
          <p class="mod-sub">Semáforo de cumplimiento, checklist y formatos para Arcsa.</p>
        </div>
      </header>

    <div class="demo-wrap"><TiendaContextBar /></div>
    <div class="demo-wrap"><DemoBanner /></div>

    <section :class="['traffic', semaforo]">
      <div class="traffic-lights">
        <span :class="['light', 'green', { on: semaforo === 'green' }]" />
        <span :class="['light', 'yellow', { on: semaforo === 'yellow' }]" />
        <span :class="['light', 'red', { on: semaforo === 'red', blink: semaforo === 'red' }]" />
      </div>
      <div class="traffic-body">
        <span class="traffic-label">Semáforo de cumplimiento</span>
        <h2 class="traffic-status">{{ semaforoLabel }}</h2>
        <p class="traffic-msg">{{ semaforoMsg }}</p>
        <div class="traffic-meta">
          <span><i class="fa-solid fa-clock" /> Corte: {{ limitHour }}:00 AM</span>
          <span><i class="fa-solid fa-list-check" /> {{ completed }} / {{ total }} tareas</span>
        </div>
      </div>
    </section>

    <section class="employee-card">
      <header class="emp-head">
        <span class="emp-chip"><i class="fa-solid fa-user-helmet-safety" /> Modo empleado</span>
        <span class="emp-time">{{ now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) }}</span>
      </header>
      <h3 class="emp-title">Checklist de limpieza diario <DemoBadge label="Demo" /></h3>

      <ul class="task-list">
        <li v-for="t in tasks" :key="t.id" :class="['task', { done: t.done === true, no: t.done === false }]">
          <span class="task-label">{{ t.label }}</span>
          <div class="task-actions">
            <button
              :class="['big-btn yes', { active: t.done === true }]"
              @click="setDone(t, true)"
              type="button"
            >
              <i class="fa-solid fa-check" /> Sí
            </button>
            <button
              :class="['big-btn no', { active: t.done === false }]"
              @click="setDone(t, false)"
              type="button"
            >
              <i class="fa-solid fa-xmark" /> No
            </button>
          </div>
        </li>
      </ul>

      <button class="print-fab" @click="printReport">
        <i class="fa-solid fa-print" />
        Imprimir formatos para inspección
      </button>
    </section>

    <section class="info-row">
      <article class="info-card">
        <div class="info-icon"><i class="fa-solid fa-bell" /></div>
        <h4>Alerta automática</h4>
        <p>Si no se llena antes de las {{ limitHour }}:00, enviamos push al dueño y WhatsApp al supervisor.</p>
      </article>
      <article class="info-card">
        <div class="info-icon"><i class="fa-solid fa-file-pdf" /></div>
        <h4>PDF normativo</h4>
        <p>Tu impresión genera un formato A4 listo para Arcsa, con fechas, firmas y bitácora.</p>
      </article>
    </section>
    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.mod { padding: 0 0 60px; }
.mod-top { padding: 24px 28px 0; }
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

.mod-top { display: block; background: transparent; border-bottom: none; position: static; }
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

.traffic {
  margin: 20px; padding: 20px;
  border-radius: 22px;
  display: grid; grid-template-columns: 84px 1fr; gap: 18px; align-items: center;
  background: white; border: 1px solid rgba($primary-dark, 0.06);
  &.green { background: linear-gradient(135deg, #ecfdf5, white); border-color: rgba($alert-success, 0.3); }
  &.yellow { background: linear-gradient(135deg, #fffbeb, white); border-color: rgba($alert-warning, 0.3); }
  &.red { background: linear-gradient(135deg, #fef2f2, white); border-color: rgba($alert-error, 0.4); }
}
.traffic-lights {
  display: flex; flex-direction: column; gap: 8px;
  background: $primary-dark; padding: 14px 10px;
  border-radius: 16px; align-items: center;
}
.light {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255,255,255,0.08);
  &.on.green { background: $alert-success; box-shadow: 0 0 18px rgba($alert-success, 0.7); }
  &.on.yellow { background: $alert-warning; box-shadow: 0 0 18px rgba($alert-warning, 0.7); }
  &.on.red { background: $alert-error; box-shadow: 0 0 22px rgba($alert-error, 0.8); }
  &.blink { animation: blink 1s ease-in-out infinite; }
}
@keyframes blink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(0.92); }
}
.traffic-body { display: flex; flex-direction: column; gap: 4px; }
.traffic-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase; color: $text-secondary; }
.traffic-status { margin: 0; font-size: 1.3rem; font-weight: 800; color: $primary-dark; }
.traffic-msg { margin: 0; font-size: 0.88rem; color: $primary-dark; line-height: 1.45; }
.traffic-meta { display: flex; flex-wrap: wrap; gap: 14px; font-size: 0.78rem; color: $text-secondary; margin-top: 4px;
  i { color: $primary; margin-right: 4px; }
}

.employee-card {
  margin: 0 20px;
  background: white;
  border-radius: 22px;
  padding: 18px;
  border: 1px solid rgba($primary-dark, 0.06);
  position: relative;
}
.emp-head { display: flex; align-items: center; justify-content: space-between; }
.emp-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba($secondary, 0.12); color: darken($secondary, 8%);
  padding: 5px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700;
}
.emp-time { font-size: 0.85rem; font-weight: 700; color: $primary; font-variant-numeric: tabular-nums; }
.emp-title { margin: 12px 0 14px; font-size: 1rem; font-weight: 700; color: $primary-dark; }

.task-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.task {
  display: flex; flex-direction: column; gap: 12px;
  padding: 14px; border-radius: 16px; background: #f8fafc;
  border: 1px solid rgba($primary-dark, 0.05);

  &.done { background: rgba($alert-success, 0.08); border-color: rgba($alert-success, 0.25); }
  &.no { background: rgba($alert-error, 0.08); border-color: rgba($alert-error, 0.25); }
}
.task-label { font-size: 0.92rem; font-weight: 600; color: $primary-dark; line-height: 1.4; }
.task-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.big-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 16px; border-radius: 14px;
  border: 2px solid rgba($primary-dark, 0.08); background: white;
  font-family: $font-principal; font-weight: 800; font-size: 1rem; cursor: pointer;
  transition: transform 0.15s, background 0.15s, color 0.15s, border-color 0.15s;

  &.yes { color: $alert-success; }
  &.no { color: $alert-error; }
  &.active.yes { background: $alert-success; color: white; border-color: $alert-success; }
  &.active.no { background: $alert-error; color: white; border-color: $alert-error; }
  &:active { transform: scale(0.97); }
}

.print-fab {
  position: sticky;
  bottom: 16px;
  left: 0; right: 0;
  margin-top: 16px;
  display: inline-flex; width: 100%;
  align-items: center; justify-content: center; gap: 10px;
  padding: 16px; border: none; border-radius: 16px;
  font-family: $font-principal; font-weight: 800; font-size: 1rem;
  color: white;   background: linear-gradient(135deg, $primary, $secondary);
  box-shadow: 0 14px 30px rgba($primary, 0.35); cursor: pointer;
}

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

@media print {
  .mod-top, .print-fab, .info-row { display: none; }
  .mod { background: white; }
}
</style>
