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
      <label>Nombre legal <span class="req">*</span></label>
      <input
        :value="modelValue.legalName"
        @input="updateField('legalName', ($event.target as HTMLInputElement).value)"
        placeholder="Ej: Restaurantes del Sur S.A."
      />
    </div>
    <div class="ob-field">
      <label>Nombre comercial</label>
      <input
        :value="modelValue.commercialName"
        @input="updateField('commercialName', ($event.target as HTMLInputElement).value)"
        placeholder="Ej: La Casa del Ceviche"
      />
    </div>
    <div class="ob-row">
      <div class="ob-field">
        <label>RUC / ID Tributario <span class="req">*</span></label>
        <input
          :value="modelValue.ruc"
          @input="updateField('ruc', ($event.target as HTMLInputElement).value)"
          placeholder="1234567890001"
        />
      </div>
      <div class="ob-field">
        <label>País</label>
        <select
          :value="modelValue.country"
          @change="updateField('country', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Seleccionar</option>
          <option value="Ecuador">Ecuador</option>
          <option value="Colombia">Colombia</option>
          <option value="Perú">Perú</option>
          <option value="México">México</option>
        </select>
      </div>
    </div>
    <div class="ob-field">
      <label>Ciudad</label>
      <input
        :value="modelValue.city"
        @input="updateField('city', ($event.target as HTMLInputElement).value)"
        placeholder="Guayaquil"
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
.ob-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  @media (min-width: 600px) {
    grid-template-columns: 1fr 1fr;
  }
}
.req {
  color: $alert-error;
}
</style>
