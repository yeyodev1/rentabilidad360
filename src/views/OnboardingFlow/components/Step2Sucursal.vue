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
        placeholder="Ej: Mall del Sol"
      />
    </div>
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
</style>
