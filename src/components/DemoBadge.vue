<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  tone?: 'default' | 'soft' | 'solid'
  size?: 'sm' | 'md'
  icon?: string
  title?: string
}>(), {
  label: 'Demo',
  tone: 'default',
  size: 'sm',
  icon: 'fa-solid fa-flask',
  title: 'Contenido de demostración. Se reemplaza al conectar tus datos reales.',
})
</script>

<template>
  <span :class="['demo-badge', tone, size]" :title="title" role="status" aria-label="Contenido de demostración">
    <i :class="icon" />
    {{ label }}
  </span>
</template>

<style scoped lang="scss">
.demo-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: $font-principal;
  font-weight: 800;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  border-radius: 999px;
  white-space: nowrap;
  vertical-align: middle;
  line-height: 1;

  &.sm { font-size: 0.6rem; padding: 3px 8px; }
  &.md { font-size: 0.72rem; padding: 5px 10px; }

  i {
    font-size: 0.62em;
  }

  &.default {
    background: rgba($alert-warning, 0.14);
    color: darken($alert-warning, 8%);
    border: 1px solid rgba($alert-warning, 0.3);
    i { color: darken($alert-warning, 8%); }
  }
  &.soft {
    background: rgba(255, 255, 255, 0.14);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.22);
    i { color: #ffd66b; }
  }
  &.solid {
    background: linear-gradient(135deg, #f59e0b, #fb923c);
    color: white;
    border: none;
    box-shadow: 0 6px 16px rgba(245, 158, 11, 0.3);
  }
}
</style>
