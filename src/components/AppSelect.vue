<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

export interface AppSelectOption {
  value: string
  label: string
  icon?: string
  hint?: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  label?: string
  placeholder?: string
  icon?: string
  options: AppSelectOption[]
  required?: boolean
  allowCustom?: boolean
  customPlaceholder?: string
}>(), {
  placeholder: 'Seleccionar',
  customPlaceholder: 'Escribe una opción',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const open = ref(false)
const openUp = ref(false)
const customValue = ref('')
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

const selected = computed(() => props.options.find((option) => option.value === props.modelValue))
const isCustom = computed(() => props.allowCustom && props.modelValue && !selected.value)
const displayLabel = computed(() => selected.value?.label || props.modelValue || props.placeholder)

async function toggle() {
  if (open.value) {
    open.value = false
    return
  }
  open.value = true
  await nextTick()
  const trigger = triggerRef.value?.getBoundingClientRect()
  const menu = menuRef.value
  if (!trigger || !menu) return
  const menuHeight = Math.min(menu.scrollHeight, 260) + 12
  const spaceBelow = window.innerHeight - trigger.bottom
  const spaceAbove = trigger.top
  openUp.value = spaceBelow < menuHeight && spaceAbove > spaceBelow
}

function choose(value: string) {
  emit('update:modelValue', value)
  open.value = false
}

function chooseCustom() {
  customValue.value = isCustom.value ? props.modelValue : ''
  open.value = false
  if (!props.modelValue || selected.value) emit('update:modelValue', customValue.value)
}

function updateCustom(value: string) {
  customValue.value = value
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="app-select" :class="{ open, 'open-up': openUp }">
    <span v-if="label" class="app-select-label">{{ label }}</span>
    <button ref="triggerRef" type="button" class="select-trigger" :aria-expanded="open" @click="toggle">
      <span class="trigger-icon"><i :class="selected?.icon || icon || 'fa-solid fa-chevron-down'" /></span>
      <span class="trigger-text" :class="{ muted: !modelValue }">{{ displayLabel }}</span>
      <i class="fa-solid fa-chevron-down chevron" />
    </button>

    <Transition name="select-pop">
      <div v-if="open" ref="menuRef" class="select-menu">
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="select-option"
          :class="{ active: option.value === modelValue }"
          @click="choose(option.value)"
        >
          <i :class="option.icon || 'fa-solid fa-circle-dot'" />
          <span>
            <strong>{{ option.label }}</strong>
            <small v-if="option.hint">{{ option.hint }}</small>
          </span>
          <i v-if="option.value === modelValue" class="fa-solid fa-check check" />
        </button>
        <button v-if="allowCustom" type="button" class="select-option custom" @click="chooseCustom">
          <i class="fa-solid fa-pen" />
          <span><strong>Otra...</strong><small>Define una ubicación propia</small></span>
        </button>
      </div>
    </Transition>

    <input
      v-if="isCustom || (allowCustom && customValue && !selected)"
      class="custom-input"
      :value="modelValue"
      :required="required"
      :placeholder="customPlaceholder"
      @input="updateCustom(($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<style scoped lang="scss">
.app-select { position: relative; display: flex; flex-direction: column; gap: 6px; }
.app-select-label { font-size: 0.8rem; font-weight: 800; color: $text-secondary; }
.select-trigger {
  width: 100%; min-height: 48px; padding: 8px 12px; display: flex; align-items: center; gap: 10px;
  border-radius: 14px; border: 1.5px solid rgba($primary-dark, 0.1); background: rgba($bg, 0.64);
  color: $primary-dark; font-family: $font-principal; font-weight: 800; cursor: pointer; text-align: left;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  &:hover, .open & { border-color: rgba($primary, 0.5); background: white; box-shadow: 0 10px 26px rgba($primary-dark, 0.06); }
}
.trigger-icon { width: 32px; height: 32px; border-radius: 11px; display: grid; place-items: center; flex-shrink: 0; background: rgba($primary, 0.1); color: $primary; }
.trigger-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; &.muted { color: $text-secondary; font-weight: 700; } }
.chevron { color: $text-secondary; font-size: 0.76rem; transition: transform 0.18s; .open & { transform: rotate(180deg); } }
.select-menu {
  position: absolute; z-index: 30; top: calc(100% + 8px); left: 0; right: 0; max-height: 260px; overflow-y: auto;
  padding: 8px; border-radius: 18px; border: 1px solid rgba($primary-dark, 0.08); background: white;
  box-shadow: 0 22px 52px rgba($primary-dark, 0.16);
}
.open-up .select-menu { top: auto; bottom: calc(100% + 8px); }
.select-option {
  width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px; border: none; border-radius: 13px;
  background: transparent; color: $primary-dark; font-family: $font-principal; text-align: left; cursor: pointer;
  i { width: 18px; color: $primary; text-align: center; }
  span { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  strong { font-size: 0.86rem; }
  small { font-size: 0.72rem; color: $text-secondary; }
  &:hover, &.active { background: rgba($primary, 0.08); }
  &.custom { border-top: 1px solid rgba($primary-dark, 0.06); margin-top: 4px; }
}
.check { color: $accent !important; }
.custom-input {
  padding: 12px; border-radius: 12px; border: 1.5px solid rgba($primary-dark, 0.1); background: rgba($bg, 0.64);
  font-family: $font-principal; font-size: 0.95rem; color: $primary-dark;
  &:focus { outline: none; border-color: $primary; background: white; }
}
.select-pop-enter-active, .select-pop-leave-active { transition: opacity 0.16s, transform 0.16s; }
.select-pop-enter-from, .select-pop-leave-to { opacity: 0; transform: translateY(-6px); }
.open-up .select-pop-enter-from, .open-up .select-pop-leave-to { transform: translateY(6px); }
</style>
