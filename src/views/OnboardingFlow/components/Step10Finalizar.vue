<script setup lang="ts">
// Final confirmation screen
</script>

<template>
  <div class="ob-fields ob-done">
    <div class="ob-done-icon"><i class="fa-solid fa-circle-check" /></div>
    <h2 class="ob-done-title">Todo listo</h2>
    <p class="ob-done-desc">Tu negocio está configurado. Ya puedes usar Allio.</p>
    <div class="ob-done-grid">
      <div class="ob-done-item"><i class="fa-solid fa-sack-dollar" /> Precio sugerido por plato</div>
      <div class="ob-done-item"><i class="fa-solid fa-bullseye" /> Meta de venta mensual</div>
      <div class="ob-done-item"><i class="fa-solid fa-qrcode" /> QR de equipos</div>
      <div class="ob-done-item"><i class="fa-solid fa-screwdriver-wrench" /> Historial de mantenimiento</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ob-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ob-done {
  align-items: center;
  text-align: center;
  padding: 40px 0;
}
.ob-done-icon {
  font-size: 3.5rem;
  color: $alert-success;
  margin-bottom: 8px;
}
.ob-done-title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 800;
  color: $primary-dark;
}
.ob-done-desc {
  font-size: 0.88rem;
  color: $text-secondary;
  margin: 4px 0 24px;
}
.ob-done-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  width: 100%;
  max-width: 400px;
  @media (min-width: 600px) {
    grid-template-columns: 1fr 1fr;
  }
}
.ob-done-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 10px;
  background: rgba($primary, 0.04);
  font-size: 0.82rem;
  font-weight: 600;
  color: $primary-dark;
  i {
    color: $alert-success;
  }
}
</style>
