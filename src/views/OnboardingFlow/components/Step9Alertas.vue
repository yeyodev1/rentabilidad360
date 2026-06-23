<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  country: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

function updateField(key: string, val: any) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: val,
  })
}

const countryPrefix = computed(() => {
  if (!props.country) return ''
  const normalized = props.country.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  if (normalized === 'ecuador') return '593'
  if (normalized === 'colombia') return '57'
  if (normalized === 'peru') return '51'
  if (normalized === 'mexico') return '52'
  return ''
})

function handleNumberInput(val: string) {
  const updated = JSON.parse(JSON.stringify(props.modelValue))
  updated.whatsappNumber = val
  if (!val || val === countryPrefix.value) {
    updated.whatsappEnabled = false
  }
  emit('update:modelValue', updated)
}

function handleEmailInput(val: string) {
  const updated = JSON.parse(JSON.stringify(props.modelValue))
  updated.emailAddress = val
  if (!val) {
    updated.emailEnabled = false
  }
  emit('update:modelValue', updated)
}

import { useUserStore } from '@/stores/user'

function prefillDefaults() {
  const userStore = useUserStore()
  if (!props.modelValue.whatsappNumber && countryPrefix.value) {
    updateField('whatsappNumber', countryPrefix.value)
  }
  if (!props.modelValue.emailAddress && userStore.email) {
    updateField('emailAddress', userStore.email)
  }
}

onMounted(prefillDefaults)
watch(() => props.country, prefillDefaults)

function skipStep() {
  emit('update:modelValue', {
    ...props.modelValue,
    skipped: true,
  })
}

function undoSkip() {
  emit('update:modelValue', {
    ...props.modelValue,
    skipped: false,
  })
}
</script>

<template>
  <div class="ob-alerts-container">
    <div class="flow-helper-banner">
      <div class="banner-intro">
        <div class="banner-icon-wrapper">
          <i class="fa-solid fa-bell" />
        </div>
        <div class="banner-body">
          <h4 class="banner-title">Recibe alertas de tu negocio</h4>
          <p class="banner-text">
            El sistema te notificará cuando algo requiera tu atención: checklists vencidos,
            márgenes bajos, mantenimiento de equipos y más. Elige cómo y cuándo recibir estas alertas.
          </p>
        </div>
      </div>
    </div>

    <div class="ob-alerts-editor">
      <div class="editor-section-title">
        <i class="fa-solid fa-tower-broadcast" />
        <span>Canales de notificación</span>
      </div>

      <div class="channels-list">
        <div class="channel-card">
          <div class="channel-head">
            <div class="channel-head-left">
              <span class="channel-icon whatsapp"><i class="fa-brands fa-whatsapp" /></span>
              <div class="channel-head-info">
                <strong>WhatsApp</strong>
                <span>Alertas directas a tu celular</span>
              </div>
            </div>
            <label class="tg">
              <input
                type="checkbox"
                :checked="modelValue.whatsappEnabled"
                @change="updateField('whatsappEnabled', ($event.target as HTMLInputElement).checked)"
              />
              <span class="tg-slider" />
            </label>
          </div>
          <div class="channel-body">
            <div class="channel-input">
              <span class="input-prefix">{{ countryPrefix || '593' }}</span>
              <input
                :value="modelValue.whatsappNumber?.replace(countryPrefix || '593', '') || ''"
                :placeholder="'995254965'"
                type="tel"
                class="phone-input"
                @input="handleNumberInput(countryPrefix + ($event.target as HTMLInputElement).value)"
              />
            </div>
            <p class="channel-hint">Tu número con código de país (sin el +)</p>
          </div>
        </div>

        <div class="channel-card">
          <div class="channel-head">
            <div class="channel-head-left">
              <span class="channel-icon email"><i class="fa-solid fa-envelope" /></span>
              <div class="channel-head-info">
                <strong>Correo electrónico</strong>
                <span>Reportes y resúmenes</span>
              </div>
            </div>
            <label class="tg">
              <input
                type="checkbox"
                :checked="modelValue.emailEnabled"
                @change="updateField('emailEnabled', ($event.target as HTMLInputElement).checked)"
              />
              <span class="tg-slider" />
            </label>
          </div>
          <div class="channel-body">
            <input
              :value="modelValue.emailAddress"
              placeholder="correo@ejemplo.com"
              type="email"
              class="email-input"
              @input="handleEmailInput(($event.target as HTMLInputElement).value)"
            />
            <p class="channel-hint">Usamos tu correo de registro por defecto</p>
          </div>
        </div>
      </div>

      <div class="editor-section-title">
        <i class="fa-solid fa-triangle-exclamation" />
        <span>¿Qué tipo de alertas quieres recibir?</span>
      </div>

      <div class="alert-types-row">
        <label class="alert-chip" :class="{ active: modelValue.checklistAlerts }">
          <input type="checkbox" :checked="modelValue.checklistAlerts" @change="updateField('checklistAlerts', ($event.target as HTMLInputElement).checked)" />
          <i class="fa-solid fa-clipboard-list" />
          <span>Checklists</span>
        </label>
        <label class="alert-chip" :class="{ active: modelValue.marginAlerts }">
          <input type="checkbox" :checked="modelValue.marginAlerts" @change="updateField('marginAlerts', ($event.target as HTMLInputElement).checked)" />
          <i class="fa-solid fa-chart-line" />
          <span>Márgenes</span>
        </label>
        <label class="alert-chip" :class="{ active: modelValue.maintenanceAlerts }">
          <input type="checkbox" :checked="modelValue.maintenanceAlerts" @change="updateField('maintenanceAlerts', ($event.target as HTMLInputElement).checked)" />
          <i class="fa-solid fa-screwdriver-wrench" />
          <span>Mantenimiento</span>
        </label>
      </div>
    </div>

    <button v-if="!modelValue.skipped" class="ob-skip-btn" @click="skipStep"><i class="fa-regular fa-circle-xmark" /> No configuraré alertas ahora, lo haré después</button>
    <div v-else class="ob-skipped-banner"><i class="fa-solid fa-forward-step" /><span>Omitiste las alertas. Puedes configurarlas después desde Configuración.</span><button class="ob-undo-btn" @click="undoSkip">Configurar ahora</button></div>
  </div>
</template>

<style lang="scss" scoped>
.ob-alerts-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.flow-helper-banner {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgba($primary, 0.05) 0%, rgba($secondary, 0.03) 100%);
  border: 1.5px solid rgba($primary, 0.12);
  border-radius: 16px;
  padding: 16px 20px;
  gap: 12px;
}
.banner-intro {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.banner-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: white;
  border: 1px solid rgba($primary, 0.15);
  color: $primary;
  font-size: 1.05rem;
  box-shadow: 0 4px 8px rgba($primary, 0.05);
  flex-shrink: 0;
}
.banner-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.banner-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: $primary-dark;
}
.banner-text {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: $text-secondary;
}

.ob-alerts-editor {
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba($primary-dark, 0.02);
}

.editor-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1.5px solid rgba($primary-dark, 0.04);
  font-size: 0.82rem;
  font-weight: 800;
  color: $primary-dark;
  i {
    color: $primary;
    font-size: 1rem;
  }
}

.channels-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.channel-card {
  display: flex;
  flex-direction: column;
  background: #fbfcfd;
  border: 1.5px solid rgba($primary-dark, 0.06);
  border-radius: 18px;
  padding: 18px;
  gap: 14px;
  transition: all 0.2s;
  &:hover { border-color: rgba($primary, 0.15); background: white; }
}

.channel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.channel-head-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.channel-head-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  strong { font-size: 0.88rem; font-weight: 800; color: $primary-dark; }
  span { font-size: 0.75rem; color: $text-secondary; }
}

.channel-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  font-size: 1.1rem;
  flex-shrink: 0;
  &.whatsapp { color: #25d366; background: rgba(#25d366, 0.1); }
  &.email { color: $primary; background: rgba($primary, 0.1); }
}

.channel-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.channel-input {
  display: flex;
  align-items: center;
  background: white;
  border: 1.5px solid rgba($primary-dark, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s;
  &:focus-within { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary,0.08); }
}
.input-prefix {
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: rgba($primary-dark, 0.04);
  color: $primary-dark;
  font-weight: 700;
  font-size: 0.9rem;
  height: 100%;
  min-height: 44px;
  border-right: 1px solid rgba($primary-dark, 0.06);
}
.phone-input, .email-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 14px;
  font-size: 0.92rem;
  font-weight: 600;
  color: $primary-dark;
  outline: none;
  font-family: inherit;
  &::placeholder { color: rgba($primary-dark, 0.2); }
}
.channel-hint {
  margin: 0;
  font-size: 0.72rem;
  color: $text-secondary;
  display: flex;
  align-items: center;
  gap: 4px;
}

.alert-types-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.alert-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 14px;
  background: #f8f9fa;
  border: 1.5px solid rgba($primary-dark, 0.06);
  cursor: pointer;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.82rem;
  color: $text-secondary;
  transition: all 0.2s;
  user-select: none;
  input { display: none; }
  i { font-size: 0.9rem; color: rgba($primary-dark, 0.3); transition: color 0.2s; }
  &:hover { border-color: rgba($primary, 0.2); background: white; }
  &.active {
    border-color: $primary;
    background: rgba($primary, 0.04);
    color: $primary-dark;
    i { color: $primary; }
  }
}

.tg {
  position: relative;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
  input { opacity: 0; width: 0; height: 0; }
  .tg-slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: #e2e8f0;
    border-radius: 24px;
    transition: 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    &::before {
      content: '';
      position: absolute;
      width: 18px;
      height: 18px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
      transition: 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
  }
  input:checked + .tg-slider { background: $primary; }
  input:checked + .tg-slider::before { transform: translateX(20px); }
}

.ob-skip-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 14px; margin-top: 8px;
  border-radius: 14px; background: transparent;
  border: 1.5px dashed rgba($primary-dark, 0.15); color: $text-secondary;
  font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: $primary; color: $primary; background: rgba($primary,0.03); }
}
.ob-skipped-banner {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px; margin-top: 12px;
  background: rgba($primary,0.04); border: 1.5px solid rgba($primary,0.12);
  border-radius: 14px; font-size: 0.85rem; color: $primary-dark; font-weight: 600;
  flex-wrap: wrap;
  i { font-size: 1.2rem; color: $primary; }
  .ob-undo-btn {
    margin-left: auto; padding: 8px 16px; border-radius: 10px;
    background: white; border: 1.5px solid $primary; color: $primary;
    font-family: inherit; font-weight: 800; font-size: 0.8rem; cursor: pointer;
    transition: all 0.2s;
    &:hover { background: $primary; color: white; }
  }
}
</style>