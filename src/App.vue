<script setup lang="ts">
import AppToasts from '@/components/AppToasts.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
</script>

<template>
  <div class="app-container">
    <RouterView />
    <AppToasts />
    <ConfirmDialog />
  </div>
</template>

<style lang="scss">
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
