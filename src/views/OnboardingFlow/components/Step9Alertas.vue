<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

function updateField(key: string, val: any) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: val,
  })
}
</script>

<template>
  <div class="ob-fields">
    <div class="ob-subsection">
      <h3 class="ob-subtitle"><i class="fa-solid fa-bell" /> Canales de notificación</h3>
      <div class="ob-tog">
        <span><i class="fa-brands fa-whatsapp" /> WhatsApp</span>
        <label class="tg">
          <input
            type="checkbox"
            :checked="modelValue.whatsappEnabled"
            @change="updateField('whatsappEnabled', ($event.target as HTMLInputElement).checked)"
          />
          <span class="tg-slider" />
        </label>
      </div>
      <div class="ob-tog">
        <span><i class="fa-solid fa-envelope" /> Email</span>
        <label class="tg">
          <input
            type="checkbox"
            :checked="modelValue.emailEnabled"
            @change="updateField('emailEnabled', ($event.target as HTMLInputElement).checked)"
          />
          <span class="tg-slider" />
        </label>
      </div>
      <div class="ob-tog">
        <span><i class="fa-solid fa-mobile-screen-button" /> Push</span>
        <label class="tg">
          <input
            type="checkbox"
            :checked="modelValue.pushEnabled"
            @change="updateField('pushEnabled', ($event.target as HTMLInputElement).checked)"
          />
          <span class="tg-slider" />
        </label>
      </div>
    </div>
    <div class="ob-subsection">
      <h3 class="ob-subtitle"><i class="fa-solid fa-triangle-exclamation" /> Tipos de alerta</h3>
      <div class="ob-tog">
        <span><i class="fa-solid fa-clipboard-list" /> Checklist</span>
        <label class="tg">
          <input
            type="checkbox"
            :checked="modelValue.checklistAlerts"
            @change="updateField('checklistAlerts', ($event.target as HTMLInputElement).checked)"
          />
          <span class="tg-slider" />
        </label>
      </div>
      <div class="ob-tog">
        <span><i class="fa-solid fa-chart-line" /> Caída de margen</span>
        <label class="tg">
          <input
            type="checkbox"
            :checked="modelValue.marginAlerts"
            @change="updateField('marginAlerts', ($event.target as HTMLInputElement).checked)"
          />
          <span class="tg-slider" />
        </label>
      </div>
      <div class="ob-tog">
        <span><i class="fa-solid fa-screwdriver-wrench" /> Mantenimiento</span>
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
    <div class="ob-row">
      <div class="ob-field">
        <label>Número WhatsApp</label>
        <input
          :value="modelValue.whatsappNumber"
          placeholder="+593 99 999 9999"
          @input="updateField('whatsappNumber', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="ob-field">
        <label>Email notificaciones</label>
        <input
          :value="modelValue.emailAddress"
          type="email"
          placeholder="correo@ejemplo.com"
          @input="updateField('emailAddress', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ob-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ob-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  label {
    font-size: 0.8rem;
    font-weight: 700;
    color: $primary-dark;
  }
  input {
    padding: 12px 14px;
    font-size: 0.9rem;
    border: 1.5px solid rgba($primary-dark, 0.1);
    border-radius: 10px;
    background: white;
    outline: none;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;
    &:focus {
      border-color: $primary;
      box-shadow: 0 0 0 3px rgba($primary, 0.1);
    }
    &::placeholder {
      color: rgba($primary-dark, 0.2);
    }
  }
}
.ob-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  @media (min-width: 600px) {
    grid-template-columns: 1fr 1fr;
  }
}
.ob-subsection {
  background: rgba($primary-dark, 0.02);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ob-subtitle {
  margin: 0 0 4px;
  font-size: 0.88rem;
  font-weight: 800;
  color: $primary-dark;
  display: flex;
  align-items: center;
  gap: 8px;
  i {
    color: $primary;
  }
}
.ob-tog {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  span {
    font-size: 0.85rem;
    font-weight: 600;
    color: $primary-dark;
    display: flex;
    align-items: center;
    gap: 8px;
    i, .fa-brands {
      color: $primary;
      width: 16px;
      text-align: center;
    }
  }
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
</style>
