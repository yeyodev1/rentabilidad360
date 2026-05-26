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

// Compute the prefix code based on Step 1 country input (without the '+')
const countryPrefix = computed(() => {
  if (!props.country) return ''
  const normalized = props.country.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  if (normalized === 'ecuador') return '593'
  if (normalized === 'colombia') return '57'
  if (normalized === 'peru') return '51'
  if (normalized === 'mexico') return '52'
  return ''
})

// Automatically turn off toggle if input is cleared or only contains prefix
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

// Prefill country prefix if number is empty on load or when country updates
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
</script>

<template>
  <div class="ob-alerts-container">
    <!-- Step Helper Info Banner -->
    <div class="flow-helper-banner">
      <div class="banner-intro">
        <div class="banner-icon-wrapper">
          <i class="fa-solid fa-bell" />
        </div>
        <div class="banner-body">
          <h4 class="banner-title">Configuración de Alertas y Canales</h4>
          <p class="banner-text">
            Ingresa tu información de contacto para activar las notificaciones. 
            Define cómo y cuándo deseas recibir alertas automáticas sobre tu operación.
          </p>
        </div>
      </div>
    </div>

    <!-- Main Editor Box -->
    <div class="ob-alerts-editor">
      
      <!-- Section 1: Notification Channels (WhatsApp & Email side-by-side) -->
      <div class="editor-section-title">
        <i class="fa-solid fa-tower-broadcast" />
        <span>1. Canales de Notificación</span>
      </div>

      <div class="channels-grid">
        <!-- WhatsApp Setup Card -->
        <div class="channel-row-card" :class="{ 'is-active': modelValue.whatsappEnabled && modelValue.whatsappNumber && modelValue.whatsappNumber !== countryPrefix }">
          <div class="channel-row-header">
            <div class="channel-header-left">
              <span class="channel-icon-wrap whatsapp">
                <i class="fa-brands fa-whatsapp" />
              </span>
              <div class="channel-title-info">
                <strong>Notificaciones por WhatsApp</strong>
                <span class="channel-desc">Alertas directas a tu celular</span>
              </div>
            </div>

            <!-- Switch aligned to the right of the header -->
            <label class="tg" :class="{ 'is-locked': !modelValue.whatsappNumber || modelValue.whatsappNumber === countryPrefix }">
              <input
                type="checkbox"
                :disabled="!modelValue.whatsappNumber || modelValue.whatsappNumber === countryPrefix"
                :checked="modelValue.whatsappEnabled && !!modelValue.whatsappNumber && modelValue.whatsappNumber !== countryPrefix"
                @change="updateField('whatsappEnabled', ($event.target as HTMLInputElement).checked)"
              />
              <span class="tg-slider" />
            </label>
          </div>

          <!-- Input field below -->
          <div class="channel-input-wrapper">
            <label class="field-label">Número de WhatsApp</label>
            <div class="premium-input-wrapper prefix">
              <i class="fa-brands fa-whatsapp field-icon whatsapp-active" />
              <input
                :value="modelValue.whatsappNumber"
                :placeholder="'Ej: ' + (countryPrefix || '593') + '995254965'"
                type="tel"
                class="premium-input"
                @input="handleNumberInput(($event.target as HTMLInputElement).value)"
              />
            </div>
            <!-- Instruction to copy exactly as in WhatsApp without the '+' -->
            <span class="micro-hint whatsapp-copy-hint">
              <i class="fa-solid fa-circle-info" /> Copia tu número tal cual lo tienes en WhatsApp (con código de país, pero sin el signo +).
            </span>
            
            <!-- Feedback lock status -->
            <div class="lock-status-row">
              <span class="toggle-instruction" v-if="!modelValue.whatsappNumber || modelValue.whatsappNumber === countryPrefix">
                <i class="fa-solid fa-lock" /> Escribe tu número completo para activar
              </span>
              <span class="toggle-instruction success" v-else>
                <i class="fa-solid fa-unlock" /> Listo para activar
              </span>
            </div>
          </div>
        </div>

        <!-- Email Setup Card -->
        <div class="channel-row-card" :class="{ 'is-active': modelValue.emailEnabled && modelValue.emailAddress }">
          <div class="channel-row-header">
            <div class="channel-header-left">
              <span class="channel-icon-wrap email">
                <i class="fa-solid fa-envelope" />
              </span>
              <div class="channel-title-info">
                <strong>Notificaciones por Email</strong>
                <span class="channel-desc">Reportes de rendimiento</span>
              </div>
            </div>

            <!-- Switch aligned to the right of the header -->
            <label class="tg" :class="{ 'is-locked': !modelValue.emailAddress }">
              <input
                type="checkbox"
                :disabled="!modelValue.emailAddress"
                :checked="modelValue.emailEnabled && !!modelValue.emailAddress"
                @change="updateField('emailEnabled', ($event.target as HTMLInputElement).checked)"
              />
              <span class="tg-slider" />
            </label>
          </div>

          <!-- Input field below -->
          <div class="channel-input-wrapper">
            <label class="field-label">Correo Electrónico de Alertas</label>
            <div class="premium-input-wrapper prefix">
              <i class="fa-solid fa-envelope field-icon email-active" />
              <input
                :value="modelValue.emailAddress"
                placeholder="correo@ejemplo.com"
                type="email"
                class="premium-input"
                @input="handleEmailInput(($event.target as HTMLInputElement).value)"
              />
            </div>
            <!-- Feedback msg -->
            <span class="micro-hint email-notice">
              <i class="fa-solid fa-circle-info" /> Por defecto usamos tu correo de registro. Puedes cambiarlo o agregar múltiples correos separados por comas (,).
            </span>

            <div class="lock-status-row">
              <span class="toggle-instruction" v-if="!modelValue.emailAddress">
                <i class="fa-solid fa-lock" /> Ingresa un correo para activar
              </span>
              <span class="toggle-instruction success" v-else>
                <i class="fa-solid fa-unlock" /> Listo para activar
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Alert Types (Horizontal Grid below) -->
      <div class="editor-section-title border-top-dashed">
        <i class="fa-solid fa-triangle-exclamation" />
        <span>2. Tipos de Alerta a Recibir</span>
      </div>

      <div class="alert-types-grid">
        <!-- Checklist Toggle -->
        <div class="toggle-row-item" :class="{ 'is-active': modelValue.checklistAlerts }">
          <div class="toggle-label-wrap">
            <span class="channel-icon-wrap checklist">
              <i class="fa-solid fa-clipboard-list" />
            </span>
            <div class="toggle-text-info">
              <strong>Checklist</strong>
              <span class="toggle-desc">Tareas incompletas</span>
            </div>
          </div>
          <label class="tg">
            <input
              type="checkbox"
              :checked="modelValue.checklistAlerts"
              @change="updateField('checklistAlerts', ($event.target as HTMLInputElement).checked)"
            />
            <span class="tg-slider" />
          </label>
        </div>

        <!-- Margin Alert Toggle -->
        <div class="toggle-row-item" :class="{ 'is-active': modelValue.marginAlerts }">
          <div class="toggle-label-wrap">
            <span class="channel-icon-wrap margins">
              <i class="fa-solid fa-chart-line" />
            </span>
            <div class="toggle-text-info">
              <strong>Márgenes</strong>
              <span class="toggle-desc">Caídas de margen</span>
            </div>
          </div>
          <label class="tg">
            <input
              type="checkbox"
              :checked="modelValue.marginAlerts"
              @change="updateField('marginAlerts', ($event.target as HTMLInputElement).checked)"
            />
            <span class="tg-slider" />
          </label>
        </div>

        <!-- Maintenance Toggle -->
        <div class="toggle-row-item" :class="{ 'is-active': modelValue.maintenanceAlerts }">
          <div class="toggle-label-wrap">
            <span class="channel-icon-wrap maintenance">
              <i class="fa-solid fa-screwdriver-wrench" />
            </span>
            <div class="toggle-text-info">
              <strong>Mantenimiento</strong>
              <span class="toggle-desc">Alertas de equipos</span>
            </div>
          </div>
          <label class="tg">
            <input
              type="checkbox"
              :checked="modelValue.maintenanceAlerts"
              @change="updateField('maintenanceAlerts', ($event.target as HTMLInputElement).checked)"
            />
            <span class="tg-slider" />
          </label>
        </div>
      </div>

    </div>
  </div>
</template>

<style lang="scss" scoped>
.ob-alerts-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-height: 75dvh;
  overflow-y: auto;
  padding-right: 6px;
  padding-bottom: 20px;
}

/* Premium Info Banner (Compact & Spacious) */
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
  align-items: center;
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
  font-size: 0.8rem;
  line-height: 1.4;
  color: $text-secondary;
}

/* Main Editor Box */
.ob-alerts-editor {
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba($primary-dark, 0.02);

  @media (min-width: 600px) {
    padding: 24px;
  }
}

.editor-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1.5px solid rgba($primary-dark, 0.04);
  font-size: 0.85rem;
  font-weight: 800;
  color: $primary-dark;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  i {
    color: $primary;
    font-size: 1.05rem;
  }

  &.border-top-dashed {
    margin-top: 8px;
    border-top: 1px dashed rgba($primary-dark, 0.08);
    padding-top: 24px;
  }
}

/* Channels Horizontal Grid */
.channels-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media (min-width: 850px) {
    grid-template-columns: 1fr 1fr;
  }
}

.channel-row-card {
  display: flex;
  flex-direction: column;
  background: #fbfcfd;
  border: 1.5px solid rgba($primary-dark, 0.05);
  border-radius: 20px;
  padding: 20px;
  gap: 16px;
  transition: all 0.25s ease;

  &:hover {
    border-color: rgba($primary, 0.15);
    background: white;
    box-shadow: 0 6px 16px rgba($primary-dark, 0.02);
  }

  &.is-active {
    border-color: rgba($primary, 0.3);
    background: white;
    box-shadow: 0 8px 24px rgba($primary, 0.04);
  }
}

.channel-row-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.channel-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.channel-title-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.35;

  strong {
    font-size: 0.82rem;
    font-weight: 800;
    color: $primary-dark;
  }

  .channel-desc {
    font-size: 0.72rem;
    color: $text-secondary;
  }
}

.channel-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Alert Types Horizontal Grid */
.alert-types-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;

  @media (min-width: 680px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Toggle rows */
.toggle-row-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fbfcfd;
  border: 1.5px solid rgba($primary-dark, 0.05);
  border-radius: 16px;
  padding: 14px;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba($primary, 0.15);
    background: white;
    box-shadow: 0 4px 12px rgba($primary-dark, 0.02);
  }

  &.is-active {
    border-color: rgba($primary, 0.25);
    background: white;
    box-shadow: 0 4px 14px rgba($primary, 0.02);
  }
}

.toggle-label-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Clean, non-overlapping icon wrappers */
.channel-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #f1f3f5;
  font-size: 0.95rem;
  flex-shrink: 0;
  margin: 0;

  &.whatsapp {
    color: #25d366;
    background: rgba(#25d366, 0.08);
  }
  &.email {
    color: $primary;
    background: rgba($primary, 0.08);
  }
  &.checklist {
    color: #4dabf7;
    background: rgba(#4dabf7, 0.08);
  }
  &.margins {
    color: #fcc419;
    background: rgba(#fcc419, 0.08);
  }
  &.maintenance {
    color: #ff8787;
    background: rgba(#ff8787, 0.08);
  }
}

.toggle-text-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.3;

  strong {
    font-size: 0.78rem;
    font-weight: 800;
    color: $primary-dark;
  }

  .toggle-desc {
    font-size: 0.68rem;
    color: $text-secondary;
  }
}

/* Premium Switches (tg) */
.tg {
  position: relative;
  width: 44px;
  height: 24px;
  flex-shrink: 0;

  &.is-locked {
    opacity: 0.4;
    cursor: not-allowed;

    .tg-slider {
      cursor: not-allowed;
      background: #e9ecef;
    }
  }

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

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

  input:checked + .tg-slider {
    background: $primary;
  }

  input:checked + .tg-slider::before {
    transform: translateX(20px);
  }
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: $primary-dark;
}

/* Premium Inputs with Icons */
.premium-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #fafbfc;
  border: 1.5px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  padding: 0 12px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:focus-within {
    border-color: $primary;
    background: white;
    box-shadow: 0 0 0 4px rgba($primary, 0.08);
  }

  .field-icon {
    position: absolute;
    left: 12px;
    color: rgba($primary-dark, 0.35);
    font-size: 0.85rem;
    pointer-events: none;
    transition: color 0.2s;

    &.whatsapp-active {
      color: #25d366;
    }

    &.email-active {
      color: $primary;
    }
  }

  &.prefix {
    .premium-input {
      padding-left: 24px;
    }
  }
}

.premium-input {
  width: 100%;
  border: none;
  background: transparent;
  padding: 12px 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: $primary-dark;
  outline: none;
  font-family: inherit;

  &::placeholder {
    color: rgba($primary-dark, 0.2);
  }
}

.lock-status-row {
  margin-top: 4px;
}

.toggle-instruction {
  font-size: 0.7rem;
  font-weight: 700;
  color: $text-secondary;
  display: flex;
  align-items: center;
  gap: 6px;

  i {
    font-size: 0.75rem;
    color: rgba($primary-dark, 0.3);
  }

  &.success {
    color: $primary;

    i {
      color: $primary;
    }
  }
}

.micro-hint {
  font-size: 0.7rem;
  color: $text-secondary;
  margin-top: 2px;
  line-height: 1.35;

  &.whatsapp-copy-hint {
    display: flex;
    gap: 4px;
    align-items: flex-start;
    color: rgba($primary-dark, 0.65);
    font-weight: 500;

    i {
      color: $primary;
      margin-top: 2px;
      flex-shrink: 0;
    }
  }

  &.email-notice {
    display: flex;
    gap: 4px;
    align-items: flex-start;
    color: $primary;

    i {
      margin-top: 2px;
      flex-shrink: 0;
    }
  }
}
</style>
