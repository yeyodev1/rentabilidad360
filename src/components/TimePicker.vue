<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  minuteStep?: 15 | 30
}>(), {
  modelValue: '',
  minuteStep: 15,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)

const hours = Array.from({ length: 24 }, (_, i) => {
  const v = String(i).padStart(2, '0')
  return { value: v, label: v }
})

const minutes = computed(() => {
  const step = props.minuteStep
  const result: { value: string; label: string }[] = []
  for (let i = 0; i < 60; i += step) {
    const v = String(i).padStart(2, '0')
    result.push({ value: v, label: v })
  }
  return result
})

const selectedHour = computed(() => {
  if (!props.modelValue) return ''
  return props.modelValue.split(':')[0] || ''
})

const selectedMinute = computed(() => {
  if (!props.modelValue) return ''
  return props.modelValue.split(':')[1] || ''
})

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const [h, m] = props.modelValue.split(':')
  const hour = parseInt(h || '0')
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${String(hour12).padStart(2, ' ')}:${m} ${ampm}`
})

function selectHour(h: string) {
  emit('update:modelValue', `${h}:${selectedMinute.value || '00'}`)
}

function selectMinute(m: string) {
  emit('update:modelValue', `${selectedHour.value || '00'}:${m}`)
}

function togglePopover(e: MouseEvent) {
  e.stopPropagation()
  open.value = !open.value
}

function onClickOutside() {
  open.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div class="tp-wrap">
    <button type="button" class="tp-trigger" :class="{ active: open, empty: !modelValue }" @click="togglePopover">
      <i class="fa-regular fa-clock" />
      <span v-if="modelValue" class="tp-display">{{ displayValue }}</span>
      <span v-else class="tp-placeholder">HH:MM</span>
      <i class="fa-solid fa-chevron-down tp-chev" />
    </button>

    <Transition name="pop">
      <div v-if="open" class="tp-popover" @click.stop>
        <div class="tp-pop-head">
          <button type="button" class="tp-pop-close" @click="open = false">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>
        <div class="tp-columns">
          <div class="tp-col">
            <div class="tp-col-label">Hora</div>
            <div class="tp-col-list">
              <button v-for="h in hours" :key="h.value" type="button"
                :class="['tp-opt', { active: h.value === selectedHour }]"
                @click="selectHour(h.value); open = false">
                {{ h.label }}
              </button>
            </div>
          </div>
          <div class="tp-col-sep" />
          <div class="tp-col">
            <div class="tp-col-label">Min</div>
            <div class="tp-col-list">
              <button v-for="m in minutes" :key="m.value" type="button"
                :class="['tp-opt', { active: m.value === selectedMinute }]"
                @click="selectMinute(m.value); open = false">
                {{ m.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.tp-wrap {
  position: relative;
  display: inline-block;
}

.tp-trigger {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 12px;
  border: 1.5px solid rgba($primary-dark, 0.1); border-radius: 9px;
  background: white;
  font-family: inherit; font-size: 0.85rem; font-weight: 700;
  color: $primary-dark;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 110px;
  &.empty { color: rgba($primary-dark, 0.3); font-weight: 600; }
  &:hover { border-color: rgba($primary, 0.3); background: rgba($primary, 0.03); }
  &.active, &:focus { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
  i:first-child { color: $primary; font-size: 0.78rem; }
}
.tp-display { font-variant-numeric: tabular-nums; letter-spacing: 0.3px; }
.tp-placeholder { font-size: 0.8rem; }
.tp-chev { font-size: 0.6rem; color: rgba($primary-dark, 0.25); margin-left: auto; transition: transform 0.2s; .tp-trigger.active & { transform: rotate(180deg); } }

.tp-popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%; transform: translateX(-50%);
  z-index: 100;
  background: white;
  border-radius: 16px;
  border: 1px solid rgba($primary-dark, 0.06);
  box-shadow: 0 20px 60px rgba($primary-dark, 0.2);
  width: 230px;
  overflow: hidden;
}

.tp-pop-head {
  display: flex; justify-content: flex-end;
  padding: 6px 6px 0;
}
.tp-pop-close {
  width: 26px; height: 26px; border-radius: 8px;
  border: none; background: transparent;
  cursor: pointer; color: $text-secondary; font-size: 0.8rem;
  display: flex; align-items: center; justify-content: center;
  &:hover { background: rgba($primary-dark, 0.06); color: $primary-dark; }
}

.tp-columns {
  display: flex; padding: 0 8px 10px;
}
.tp-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.tp-col-sep { width: 1px; background: rgba($primary-dark, 0.06); margin: 0 4px; }
.tp-col-label {
  font-size: 0.6rem; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase;
  color: $text-secondary; padding: 4px 0 2px;
}
.tp-col-list {
  display: flex; flex-direction: column; gap: 2px;
  overflow-y: auto; max-height: 200px;
  width: 100%; padding: 0 2px;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: rgba($primary-dark, 0.1); border-radius: 99px; }
}
.tp-opt {
  padding: 6px 0; border-radius: 8px;
  border: none; background: transparent;
  font-family: inherit; font-size: 0.85rem; font-weight: 700;
  color: $primary-dark; cursor: pointer;
  text-align: center;
  transition: all 0.15s;
  font-variant-numeric: tabular-nums;
  &:hover { background: rgba($primary, 0.06); color: $primary; }
  &.active {
    background: linear-gradient(135deg, $primary, $secondary);
    color: white;
    box-shadow: 0 4px 10px rgba($primary, 0.3);
  }
}

.pop-enter-active { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.pop-leave-active { transition: all 0.15s ease-out; }
.pop-enter-from { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.95); }
.pop-leave-to { opacity: 0; transform: translateX(-50%) translateY(-4px) scale(0.97); }
</style>
