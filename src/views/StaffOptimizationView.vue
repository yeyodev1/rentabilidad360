<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/layout/AppShell.vue'
import { staffService } from '@/services/staffService'

interface ShiftSlot {
  id: string
  day: string
  time: string
  staffCount: number
  requiredStaff: number
  area: string
}

interface Suggestion {
  id: string
  day: string
  time: string
  area: string
  type: 'over' | 'under'
  diff: number
  message: string
}

const router = useRouter()

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const areas = ['Cocina', 'Atención']

const shifts = ref<ShiftSlot[]>([])
const suggestions = ref<Suggestion[]>([])

const staffByAreaDay = computed(() => {
  const map: Record<string, Record<string, { current: number; required: number }>> = {}
  for (const area of areas) {
    map[area] = {}
    for (const day of days) {
      const slots = shifts.value.filter((s) => s.area === area && s.day === day)
      const current = slots.reduce((sum, s) => sum + s.staffCount, 0)
      const required = slots.reduce((sum, s) => sum + s.requiredStaff, 0)
      map[area][day] = { current, required }
    }
  }
  return map
})

const totalStaff = computed(() => shifts.value.reduce((s, sh) => s + sh.staffCount, 0))
const totalRequired = computed(() => shifts.value.reduce((s, sh) => s + sh.requiredStaff, 0))

const efficiency = computed(() => {
  if (totalRequired.value === 0) return 100
  return Math.round((1 - Math.abs(totalStaff.value - totalRequired.value) / totalRequired.value) * 100)
})



const filterType = ref<'all' | 'over' | 'under'>('all')
const filteredSuggestions = computed(() => {
  if (filterType.value === 'all') return suggestions.value
  return suggestions.value.filter((s) => s.type === filterType.value)
})

onMounted(async () => {
  try {
    const [shiftsRes, suggestionsRes] = await Promise.all([
      staffService.listShifts(),
      staffService.getOptimization(),
    ])
    shifts.value = shiftsRes.data as unknown as ShiftSlot[]
    suggestions.value = suggestionsRes.data as unknown as Suggestion[]
  } catch {
    // API unavailable — keep empty arrays, template handles empty states
  }
})
</script>

<template>
  <AppShell>
    <div class="page">
      <header class="page-head">
        <div>
          <h1 class="page-title"><i class="fa-solid fa-users-gear" /> Optimización de Personal</h1>
          <p class="page-sub">Distribución de turnos por área y día de la semana</p>
        </div>
        <button class="back" @click="router.push('/modulo/horarios')">
          <i class="fa-solid fa-arrow-left" /> Volver
        </button>
      </header>

      <section class="stats-row">
        <div class="stat-card">
          <span class="stat-label">Personal total</span>
          <strong class="stat-value">{{ totalStaff }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Requerido</span>
          <strong class="stat-value">{{ totalRequired }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Eficiencia</span>
          <strong :class="['stat-value', efficiency >= 80 ? 'green' : efficiency >= 60 ? 'yellow' : 'red']">{{ efficiency }}%</strong>
        </div>
      </section>

      <section class="area" v-for="area in areas" :key="area">
        <h2 class="area-title"><i :class="area === 'Cocina' ? 'fa-solid fa-kitchen-set' : 'fa-solid fa-bell-concierge'" /> {{ area }}</h2>
        <div class="day-grid">
          <div v-for="day in days" :key="day" class="day-column">
            <header class="day-head">
              <span class="day-name">{{ day.slice(0, 3) }}</span>
              <div class="day-staff">
                <span :class="['staff-num', { over: (staffByAreaDay[area]?.[day]?.current ?? 0) > (staffByAreaDay[area]?.[day]?.required ?? 0), under: (staffByAreaDay[area]?.[day]?.current ?? 0) < (staffByAreaDay[area]?.[day]?.required ?? 0) }]">
                  {{ staffByAreaDay[area]?.[day]?.current ?? 0 }}/{{ staffByAreaDay[area]?.[day]?.required ?? 0 }}
                </span>
              </div>
            </header>
            <div class="day-slots">
              <div v-for="slot in shifts.filter((s) => s.area === area && s.day === day)" :key="slot.id"
                :class="['slot', { over: slot.staffCount > slot.requiredStaff, under: slot.staffCount < slot.requiredStaff }]">
                <span class="slot-time">{{ slot.time }}</span>
                <span class="slot-count">
                  <i class="fa-solid fa-user" /> {{ slot.staffCount }}
                  <span v-if="slot.staffCount !== slot.requiredStaff" class="slot-diff">
                    ({{ slot.staffCount > slot.requiredStaff ? '+' : '' }}{{ slot.staffCount - slot.requiredStaff }})
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="suggestions-section">
        <header class="sec-head">
          <h2><i class="fa-solid fa-lightbulb" /> Sugerencias de optimización</h2>
          <div class="filter-group">
            <button v-for="f in ([{ key: 'all', label: 'Todas' }, { key: 'over', label: 'Exceso' }, { key: 'under', label: 'Faltante' }] as const)" :key="f.key"
              :class="['filter-chip', { active: filterType === f.key }]"
              @click="filterType = f.key"
            >{{ f.label }}</button>
          </div>
        </header>

        <div v-if="!filteredSuggestions.length" class="empty-state">
          <i class="fa-solid fa-circle-check" />
          <p>Distribución óptima de personal</p>
        </div>

        <div v-else class="suggestions-list">
          <div v-for="s in filteredSuggestions" :key="s.id" :class="['suggestion', s.type]">
            <div class="sug-icon">
              <i :class="s.type === 'over' ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'" />
            </div>
            <div class="sug-body">
              <span class="sug-badge" :class="s.type">
                {{ s.type === 'over' ? `+${s.diff} exceso` : `-${s.diff} faltante` }}
              </span>
              <span class="sug-message">{{ s.message }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.page {
  padding: 24px 28px 60px;
  display: flex; flex-direction: column; gap: 20px;
  @media (max-width: 720px) { padding: 18px 16px 60px; }
}

.page-head {
  display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap;
}
.page-title {
  margin: 0; font-size: clamp(1.2rem, 1.2vw + 0.8rem, 1.6rem); font-weight: 800; color: $primary-dark;
  display: inline-flex; align-items: center; gap: 10px;
  i { color: $primary; }
}
.page-sub { margin: 4px 0 0; font-size: 0.85rem; color: $text-secondary; }
.back {
  border: none; background: rgba($primary-dark, 0.06); cursor: pointer; color: $primary-dark;
  font-family: $font-principal; font-weight: 700; font-size: 0.85rem;
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px;
  &:hover { background: rgba($primary-dark, 0.12); }
}

.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.stat-card { background: white; border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 4px; border: 1px solid rgba($primary-dark, 0.05); align-items: center; text-align: center; }
.stat-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 700; color: $text-secondary; }
.stat-value { font-size: 1.3rem; font-weight: 800; color: $primary-dark;
  &.green { color: $alert-success; }
  &.yellow { color: $alert-warning; }
  &.red { color: $alert-error; }
}

.area { display: flex; flex-direction: column; gap: 10px; }
.area-title {
  margin: 0; font-size: 0.95rem; font-weight: 800; color: $primary-dark;
  display: inline-flex; align-items: center; gap: 8px;
  i { color: $primary; }
}

.day-grid {
  display: grid; gap: 8px;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  @media (max-width: 640px) { grid-template-columns: repeat(4, 1fr); }
  @media (max-width: 420px) { grid-template-columns: repeat(2, 1fr); }
}
.day-column { background: white; border-radius: 14px; padding: 10px; border: 1px solid rgba($primary-dark, 0.05); display: flex; flex-direction: column; gap: 8px; }
.day-head { display: flex; justify-content: space-between; align-items: center; }
.day-name { font-size: 0.78rem; font-weight: 800; color: $primary-dark; text-transform: uppercase; }
.staff-num { font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 8px; background: rgba($primary, 0.08); color: $primary;
  &.over { background: rgba($alert-error, 0.1); color: $alert-error; }
  &.under { background: rgba($alert-warning, 0.15); color: darken($alert-warning, 10%); }
}

.day-slots { display: flex; flex-direction: column; gap: 6px; }
.slot {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 8px; border-radius: 8px; font-size: 0.7rem; background: #f8fafc;
  border: 1px solid rgba($primary-dark, 0.04);
  &.over { background: rgba($alert-error, 0.06); border-color: rgba($alert-error, 0.15); }
  &.under { background: rgba($alert-warning, 0.08); border-color: rgba($alert-warning, 0.2); }
}
.slot-time { font-weight: 600; color: $primary-dark; }
.slot-count { font-weight: 700; color: $text-secondary; display: inline-flex; align-items: center; gap: 4px; i { color: $primary; font-size: 0.6rem; } }
.slot-diff { font-size: 0.65rem; font-weight: 800; &.over { color: $alert-error; } &.under { color: $alert-warning; } }

.suggestions-section { display: flex; flex-direction: column; gap: 12px; }
.sec-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;
  h2 { margin: 0; font-size: 0.95rem; font-weight: 800; color: $primary-dark; i { color: $primary; } }
}
.filter-group { display: flex; gap: 6px; }
.filter-chip {
  padding: 6px 12px; border-radius: 999px; border: 1px solid rgba($primary-dark, 0.1);
  background: white; font-family: $font-principal; font-size: 0.72rem; font-weight: 700;
  color: $text-secondary; cursor: pointer;
  &.active { background: $primary; color: white; border-color: $primary; }
}

.empty-state { padding: 30px; text-align: center; color: $text-secondary; font-size: 0.88rem; background: white; border-radius: 16px; border: 1px dashed rgba($primary-dark, 0.15);
  i { font-size: 1.5rem; color: $alert-success; display: block; margin-bottom: 8px; }
}

.suggestions-list { display: flex; flex-direction: column; gap: 8px; }
.suggestion {
  display: grid; grid-template-columns: 40px 1fr; gap: 12px; align-items: center;
  padding: 12px; border-radius: 14px; background: white; border: 1px solid rgba($primary-dark, 0.06);
  &.over { border-left: 3px solid $alert-error; }
  &.under { border-left: 3px solid $alert-warning; }
}
.sug-icon {
  width: 40px; height: 40px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;
  background: rgba($primary, 0.08); color: $primary; font-size: 1rem;
  .suggestion.over & { background: rgba($alert-error, 0.1); color: $alert-error; }
  .suggestion.under & { background: rgba($alert-warning, 0.15); color: darken($alert-warning, 10%); }
}
.sug-body { display: flex; flex-direction: column; gap: 4px; }
.sug-badge {
  align-self: flex-start; font-size: 0.68rem; font-weight: 800; padding: 2px 8px; border-radius: 8px; text-transform: uppercase;
  &.over { background: rgba($alert-error, 0.1); color: $alert-error; }
  &.under { background: rgba($alert-warning, 0.15); color: darken($alert-warning, 10%); }
}
.sug-message { font-size: 0.82rem; font-weight: 600; color: $primary-dark; line-height: 1.4; }
</style>
