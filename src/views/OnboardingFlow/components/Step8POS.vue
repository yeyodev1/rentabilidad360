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
      <label>Proveedor POS</label>
      <select
        :value="modelValue.provider"
        @change="updateField('provider', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">Seleccionar…</option>
        <option value="clover">Clover</option>
        <option value="square">Square</option>
        <option value="tu_mesero">Tu Mesero</option>
        <option value="otros">Otros</option>
      </select>
    </div>
    <div class="ob-field">
      <label>API Key</label>
      <input
        :value="modelValue.apiKey"
        type="password"
        placeholder="••••••••"
        @input="updateField('apiKey', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <div class="ob-field">
      <label>Webhook URL</label>
      <input
        :value="modelValue.webhookUrl"
        type="url"
        placeholder="https://…"
        @input="updateField('webhookUrl', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <p class="ob-hint">Puedes saltar este paso y configurarlo después desde el panel.</p>
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
  input, select {
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
  select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'><path fill='%236b7280' d='M6 7L0 1l1.5-1L6 4.5 10.5 0 12 1z'/></svg>");
    background-repeat: no-repeat;
    background-position: right 14px center;
    background-size: 10px 6px;
    padding-right: 32px;
  }
}
.ob-hint {
  font-size: 0.78rem;
  color: $text-secondary;
  margin: 0;
}
</style>
