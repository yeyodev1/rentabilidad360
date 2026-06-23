<script setup lang="ts">
import { usePrint } from '@/composables/usePrint'

const props = defineProps<{
  title?: string
}>()

const { printElement } = usePrint()
</script>

<template>
  <button class="print-btn" @click="printElement(title || 'Reporte')" title="Imprimir">
    <i class="fa-solid fa-print" />
    <span>Imprimir</span>
  </button>
</template>

<style scoped lang="scss">
.print-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: $radius-sm;
  background: $surface;
  border: 1.5px solid $border;
  font-family: $font-principal;
  font-weight: 600;
  font-size: 0.8rem;
  color: $text;
  cursor: pointer;
  transition: all 0.2s;

  i { color: $primary; font-size: 0.85rem; }
  &:hover { border-color: $primary; background: $primary-bg; color: $primary; }
  &:active { transform: scale(0.97); }

  @media print { display: none !important; }

  span {
    @media (max-width: $bp-mobile) { display: none; }
  }
}
</style>
