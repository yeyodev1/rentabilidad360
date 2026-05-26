<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

function addItem() {
  const updatedValue = JSON.parse(JSON.stringify(props.modelValue))
  if (!updatedValue.equipment) updatedValue.equipment = []
  updatedValue.equipment.push({
    name: '',
    brand: '',
    purchaseDate: '',
    historicalCost: null,
    usefulLife: null,
    maintenanceIntervalDays: null,
  })
  emit('update:modelValue', updatedValue)
}

function removeItem(i: string | number) {
  const updatedValue = JSON.parse(JSON.stringify(props.modelValue))
  updatedValue.equipment.splice(Number(i), 1)
  emit('update:modelValue', updatedValue)
}

function updateItem(i: string | number, field: string, value: any) {
  const updatedValue = JSON.parse(JSON.stringify(props.modelValue))
  const idx = Number(i)
  if (updatedValue.equipment[idx]) {
    updatedValue.equipment[idx][field] = value
    emit('update:modelValue', updatedValue)
  }
}
</script>

<template>
  <div class="ob-fields">
    <div v-for="(eq, i) in (modelValue.equipment || [])" :key="i" class="ob-array-row">
      <input
        :value="eq.name"
        placeholder="Nombre"
        @input="updateItem(i, 'name', ($event.target as HTMLInputElement).value)"
      />
      <input
        :value="eq.brand"
        placeholder="Marca"
        class="ob-sm"
        @input="updateItem(i, 'brand', ($event.target as HTMLInputElement).value)"
      />
      <input
        :value="eq.purchaseDate"
        type="date"
        class="ob-sm"
        @change="updateItem(i, 'purchaseDate', ($event.target as HTMLInputElement).value)"
      />
      <input
        :value="eq.historicalCost"
        placeholder="Costo $"
        type="number"
        class="ob-sm"
        @input="updateItem(i, 'historicalCost', parseFloat(($event.target as HTMLInputElement).value || '0'))"
      />
      <button type="button" class="ob-rm" @click="removeItem(i)">
        <i class="fa-solid fa-xmark" />
      </button>
    </div>
    <button type="button" class="ob-add" @click="addItem">
      <i class="fa-solid fa-plus" /> Agregar equipo
    </button>
    <p class="ob-hint">La depreciación y ciclos de mantenimiento se calculan automáticamente.</p>
  </div>
</template>

<style lang="scss" scoped>
.ob-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ob-array-row {
  display: flex;
  gap: 8px;
  align-items: center;
  background: white;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba($primary-dark, 0.07);
  input {
    padding: 9px 10px;
    font-size: 0.85rem;
    border: 1.5px solid rgba($primary-dark, 0.08);
    border-radius: 8px;
    background: #fafbfc;
    outline: none;
    flex: 1;
    min-width: 0;
    &:focus {
      border-color: $primary;
      background: white;
    }
  }
}
.ob-sm {
  max-width: 130px !important;
}
.ob-rm {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: rgba($primary-dark, 0.2);
  cursor: pointer;
  flex-shrink: 0;
  &:hover {
    background: rgba($alert-error, 0.1);
    color: $alert-error;
  }
}
.ob-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  background: rgba($primary, 0.08);
  color: $primary;
  border: 1.5px dashed rgba($primary, 0.3);
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: rgba($primary, 0.15);
    border-color: $primary;
  }
}
.ob-hint {
  font-size: 0.78rem;
  color: $text-secondary;
  margin: 0;
}
</style>
