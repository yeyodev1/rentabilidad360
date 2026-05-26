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
      <label>Alquiler <span class="req">*</span></label>
      <input
        :value="modelValue.rent"
        type="number"
        step="0.01"
        placeholder="0.00"
        @input="updateField('rent', parseFloat(($event.target as HTMLInputElement).value || '0'))"
      />
    </div>
    <div class="ob-row">
      <div class="ob-field">
        <label>Nómina administrativa</label>
        <input
          :value="modelValue.payroll"
          type="number"
          step="0.01"
          placeholder="0.00"
          @input="updateField('payroll', parseFloat(($event.target as HTMLInputElement).value || '0'))"
        />
      </div>
      <div class="ob-field">
        <label>Servicios básicos</label>
        <input
          :value="modelValue.utilities"
          type="number"
          step="0.01"
          placeholder="0.00"
          @input="updateField('utilities', parseFloat(($event.target as HTMLInputElement).value || '0'))"
        />
      </div>
    </div>
    <div class="ob-row">
      <div class="ob-field">
        <label>Seguros</label>
        <input
          :value="modelValue.insurance"
          type="number"
          step="0.01"
          placeholder="0.00"
          @input="updateField('insurance', parseFloat(($event.target as HTMLInputElement).value || '0'))"
        />
      </div>
      <div class="ob-field">
        <label>Marketing</label>
        <input
          :value="modelValue.marketing"
          type="number"
          step="0.01"
          placeholder="0.00"
          @input="updateField('marketing', parseFloat(($event.target as HTMLInputElement).value || '0'))"
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
.req {
  color: $alert-error;
}
</style>
