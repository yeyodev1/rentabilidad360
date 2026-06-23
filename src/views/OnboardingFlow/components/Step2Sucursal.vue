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
    <div class="ob-field">
      <label>Nombre de sucursal <span class="req">*</span></label>
      <input
        :value="modelValue.name"
        @input="updateField('name', ($event.target as HTMLInputElement).value)"
        placeholder="Ej: Cocina Central"
      />
    </div>

    <div class="ob-field">
      <div class="toggle-row">
        <label class="toggle-label">
          <input
            type="checkbox"
            class="toggle-input"
            :checked="modelValue.hasPhysicalStore !== false"
            @change="updateField('hasPhysicalStore', ($event.target as HTMLInputElement).checked)"
          />
          <span class="toggle-track">
            <span class="toggle-thumb" />
          </span>
          <span class="toggle-text">Tengo un punto de venta físico (local, restaurant, kiosco)</span>
        </label>
      </div>
    </div>

    <template v-if="modelValue.hasPhysicalStore !== false">
      <div class="ob-field">
        <label>Dirección</label>
        <input
          :value="modelValue.address"
          @input="updateField('address', ($event.target as HTMLInputElement).value)"
          placeholder="Av. Principal y calle 3"
        />
      </div>
      <div class="ob-field">
        <label>Teléfono</label>
        <input
          :value="modelValue.phone"
          @input="updateField('phone', ($event.target as HTMLInputElement).value)"
          placeholder="+593 99 999 9999"
          type="tel"
        />
      </div>
    </template>

    <div v-else class="ob-online-badge">
      <i class="fa-solid fa-cloud" />
      <span>Venta online / Dark kitchen — sin dirección física</span>
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
.req {
  color: $alert-error;
}

.toggle-row {
  padding: 8px 0;
}
.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}
.toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-track {
  position: relative;
  width: 44px;
  height: 26px;
  background: #d1d5db;
  border-radius: 99px;
  transition: background 0.25s;
  flex-shrink: 0;
}
.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.25s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.toggle-input:checked + .toggle-track {
  background: $primary;
}
.toggle-input:checked + .toggle-track .toggle-thumb {
  transform: translateX(18px);
}
.toggle-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: $primary-dark;
  line-height: 1.3;
}

.ob-online-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 18px;
  background: linear-gradient(135deg, rgba($primary,0.06), rgba($secondary,0.03));
  border: 1.5px solid rgba($primary,0.15);
  border-radius: 14px;
  font-size: 0.85rem;
  font-weight: 700;
  color: $primary-dark;
  i {
    font-size: 1.2rem;
    color: $primary;
  }
}
</style>