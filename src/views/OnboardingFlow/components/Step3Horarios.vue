<script setup lang="ts">
import { ref } from 'vue'
import TimePicker from '@/components/TimePicker.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const step3tab = ref<'cocina' | 'atencion'>('cocina')

function updateHour(area: 'cocina' | 'atencion', dayIndex: number, field: 'open' | 'close', value: string) {
  const updatedValue = JSON.parse(JSON.stringify(props.modelValue))
  if (!updatedValue[area]) updatedValue[area] = Array.from({ length: 7 }, () => ({ open: '', close: '' }))
  if (!updatedValue[area][dayIndex]) updatedValue[area][dayIndex] = { open: '', close: '' }
  updatedValue[area][dayIndex][field] = value
  emit('update:modelValue', updatedValue)
}

function toggleDay(area: 'cocina' | 'atencion', dayIndex: number) {
  const updatedValue = JSON.parse(JSON.stringify(props.modelValue))
  if (!updatedValue[area]) updatedValue[area] = Array.from({ length: 7 }, () => ({ open: '', close: '' }))
  if (!updatedValue[area][dayIndex]) updatedValue[area][dayIndex] = { open: '', close: '' }
  const day = updatedValue[area][dayIndex]
  if (day.open || day.close) {
    day.open = ''
    day.close = ''
  } else {
    day.open = '08:00'
    day.close = '22:00'
  }
  emit('update:modelValue', updatedValue)
}

function copyToAllDays(area: 'cocina' | 'atencion', dayIndex: number) {
  const updatedValue = JSON.parse(JSON.stringify(props.modelValue))
  if (!updatedValue[area] || !updatedValue[area][dayIndex]) return
  const source = updatedValue[area][dayIndex]
  if (!source.open || !source.close) return
  for (let i = 0; i < 7; i++) {
    updatedValue[area][i].open = source.open
    updatedValue[area][i].close = source.close
  }
  emit('update:modelValue', updatedValue)
}

function getTimelineStyle(open: string, close: string) {
  if (!open || !close) return { width: '0%', left: '0%', display: 'none' }
  const [h1, m1] = open.split(':').map(Number)
  const [h2, m2] = close.split(':').map(Number)
  const t1 = (h1 ?? 0) + (m1 ?? 0) / 60
  const t2 = (h2 ?? 0) + (m2 ?? 0) / 60
  const startPercent = (t1 / 24) * 100
  let widthPercent = ((t2 - t1) / 24) * 100
  if (widthPercent < 0) {
    widthPercent = ((24 - t1) + t2) / 24 * 100
  }
  return {
    left: `${startPercent}%`,
    width: `${widthPercent}%`,
    display: 'block',
  }
}
</script>

<template>
  <div class="ob-fields">
    <div class="ob-tabs">
      <button
        type="button"
        :class="['ob-tab', { active: step3tab === 'cocina' }]"
        @click="step3tab = 'cocina'"
      >
        <i class="fa-solid fa-fire" /> Cocina
      </button>
      <button
        type="button"
        :class="['ob-tab', { active: step3tab === 'atencion' }]"
        @click="step3tab = 'atencion'"
      >
        <i class="fa-solid fa-users" /> Atención
      </button>
    </div>

    <div class="ob-schedule-premium">
      <div
        v-for="day in 7"
        :key="'h-' + day"
        :class="['ob-sch-card', { off: !modelValue?.[step3tab]?.[day - 1]?.open }]"
      >
        <div class="ob-sch-row-main">
          <!-- Day name & switch toggle -->
          <div class="ob-sch-day-toggle">
            <span class="ob-sch-day-name">{{
              ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][day - 1]
            }}</span>
            <label class="tg">
              <input
                type="checkbox"
                :checked="!!modelValue?.[step3tab]?.[day - 1]?.open"
                @change="toggleDay(step3tab, day - 1)"
              />
              <span class="tg-slider" />
            </label>
          </div>

          <!-- Status or inputs -->
          <div class="ob-sch-controls">
            <div v-if="modelValue?.[step3tab]?.[day - 1]?.open" class="ob-sch-inputs-wrap">
              <TimePicker
                :model-value="modelValue[step3tab][day - 1].open || ''"
                @update:model-value="updateHour(step3tab, day - 1, 'open', $event)"
              />
              <span class="to-text">a</span>
              <TimePicker
                :model-value="modelValue[step3tab][day - 1].close || ''"
                @update:model-value="updateHour(step3tab, day - 1, 'close', $event)"
              />

              <button
                type="button"
                class="ob-copy-btn"
                title="Copiar horario a todos los días"
                @click="copyToAllDays(step3tab, day - 1)"
              >
                <i class="fa-solid fa-copy" />
                <span>Copiar</span>
              </button>
            </div>
            <div v-else class="ob-sch-closed-badge">
              <i class="fa-solid fa-circle-minus" /> Cerrado
            </div>
          </div>
        </div>

        <!-- Visual Timeline Bar -->
        <div v-if="modelValue?.[step3tab]?.[day - 1]?.open" class="ob-sch-timeline-wrapper">
          <div class="ob-sch-timeline-hours">
            <span>00h</span>
            <span>06h</span>
            <span>12h</span>
            <span>18h</span>
            <span>24h</span>
          </div>
          <div class="ob-sch-timeline-track">
            <div
              class="ob-sch-timeline-bar"
              :style="getTimelineStyle(modelValue[step3tab][day - 1].open, modelValue[step3tab][day - 1].close)"
            >
              <span class="bar-label"
                >{{ modelValue[step3tab][day - 1].open }} -
                {{ modelValue[step3tab][day - 1].close }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
    <p class="ob-hint">
      Activa los días de operación y ajusta sus horas. Puedes copiar las horas de un día al resto
      rápidamente.
    </p>
  </div>
</template>

<style lang="scss" scoped>
.ob-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ob-tabs {
  display: flex;
  gap: 6px;
  button {
    flex: 1;
  }
}
.ob-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border-radius: 10px;
  border: 1.5px solid rgba($primary-dark, 0.08);
  background: white;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.85rem;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s;
  i {
    font-size: 0.8rem;
  }
  &.active {
    border-color: $primary;
    color: $primary;
    background: rgba($primary, 0.05);
    i {
      color: $primary;
    }
  }
  &:hover:not(.active) {
    border-color: rgba($primary, 0.3);
    color: $primary-dark;
  }
}
.ob-hint {
  font-size: 0.78rem;
  color: $text-secondary;
  margin: 0;
}
.tg {
  position: relative;
  width: 42px;
  height: 24px;
  flex-shrink: 0;
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .tg-slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: #d1d5db;
    border-radius: 24px;
    transition: 0.25s;
    &::before {
      content: '';
      position: absolute;
      width: 18px;
      height: 18px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.25s;
    }
  }
  input:checked + .tg-slider {
    background: $primary;
  }
  input:checked + .tg-slider::before {
    transform: translateX(18px);
  }
}

.ob-schedule-premium {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
}
.ob-sch-card {
  background: white;
  border: 1.5px solid rgba($primary-dark, 0.08);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba($primary-dark, 0.02);

  &.off {
    background: rgba($primary-dark, 0.02);
    border-color: rgba($primary-dark, 0.04);
    opacity: 0.75;
    .ob-sch-day-name {
      color: $text-secondary;
    }
  }
}
.ob-sch-row-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
  @media (min-width: 600px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
}
.ob-sch-day-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  @media (min-width: 600px) {
    justify-content: flex-start;
    gap: 12px;
    min-width: 140px;
  }
}
.ob-sch-day-name {
  font-size: 1rem;
  font-weight: 700;
  color: $primary-dark;
  @media (min-width: 600px) {
    font-size: 0.95rem;
    min-width: 90px;
  }
}
.ob-sch-controls {
  display: flex;
  justify-content: flex-start;
  @media (min-width: 600px) {
    flex: 1;
    justify-content: flex-end;
    min-width: 240px;
  }
}
.ob-sch-inputs-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: space-between;
  @media (min-width: 600px) {
    width: auto;
    justify-content: flex-end;
    gap: 10px;
  }
}

.to-text {
  font-size: 0.85rem;
  font-weight: 700;
  color: $text-secondary;
}
.ob-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1.5px solid rgba($primary, 0.15);
  border-radius: 10px;
  background: rgba($primary, 0.04);
  color: $primary;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: $primary;
    color: white;
    border-color: $primary;
  }
}
.ob-sch-closed-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  color: $text-secondary;
  background: rgba($primary-dark, 0.06);
  padding: 6px 12px;
  border-radius: 20px;
  margin-left: auto;
  @media (min-width: 600px) {
    margin-left: 0;
  }
}
.ob-sch-timeline-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 6px;
  border-top: 1px dashed rgba($primary-dark, 0.06);
}
.ob-sch-timeline-hours {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: $text-secondary;
  font-weight: 600;
  padding: 0 4px;
}
.ob-sch-timeline-track {
  height: 20px;
  background: #f1f3f7;
  border-radius: 99px;
  position: relative;
  overflow: hidden;
}
.ob-sch-timeline-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  background: linear-gradient(90deg, $primary, $secondary);
  border-radius: 99px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba($primary, 0.2);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.bar-label {
  font-size: 0.65rem;
  color: white;
  font-weight: 800;
  letter-spacing: 0.2px;
  pointer-events: none;
  white-space: nowrap;
}
</style>
