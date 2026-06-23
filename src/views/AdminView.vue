<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/layout/AppShell.vue'
import { adminService, type AdminStats } from '@/services/adminService'

const router = useRouter()
const stats = ref<AdminStats | null>(null)
const loading = ref(true)
const userRole = localStorage.getItem('user_role')

onMounted(async () => {
  if (userRole !== 'admin') {
    router.replace('/dashboard')
    return
  }
  try {
    const res = await adminService.getHistory()
    stats.value = res.data.stats
  } catch {
    // fallback
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AppShell>
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1>Panel de Administración</h1>
          <p>Historial general y métricas del sistema</p>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loader" />
        <p>Cargando...</p>
      </div>

      <template v-else-if="stats">
        <section class="stats-grid">
          <div class="stat-card">
            <i class="fa-solid fa-users" />
            <div>
              <strong>{{ stats.users }}</strong>
              <span>Usuarios</span>
            </div>
          </div>
          <div class="stat-card">
            <i class="fa-solid fa-building" />
            <div>
              <strong>{{ stats.companies }}</strong>
              <span>Empresas</span>
            </div>
          </div>
          <div class="stat-card">
            <i class="fa-solid fa-chart-pie" />
            <div>
              <strong>{{ stats.analyses }}</strong>
              <span>Diagnósticos</span>
            </div>
          </div>
          <div class="stat-card">
            <i class="fa-solid fa-clipboard-check" />
            <div>
              <strong>{{ stats.checklists }}</strong>
              <span>Checklists</span>
            </div>
          </div>
          <div class="stat-card">
            <i class="fa-solid fa-screwdriver-wrench" />
            <div>
              <strong>{{ stats.maintenanceTickets }}</strong>
              <span>Mantenimientos</span>
            </div>
          </div>
          <div class="stat-card">
            <i class="fa-solid fa-utensils" />
            <div>
              <strong>{{ stats.ingredients }}</strong>
              <span>Insumos</span>
            </div>
          </div>
        </section>
      </template>

      <section class="admin-info">
        <p>Solo tú como administrador puedes ver esta sección. Aquí podrás gestionar usuarios y enviar alertas desde el sistema.</p>
      </section>
    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.admin-page {
  padding: 24px 16px 80px;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (min-width: $bp-tablet) {
    padding: 32px 24px 40px;
  }
}

.page-head {
  h1 {
    font-family: $font-secondary;
    font-size: 1.35rem;
    font-weight: 800;
    color: $text;
  }
  p {
    font-size: 0.85rem;
    color: $text-secondary;
    margin-top: 4px;
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
  gap: 12px;
  color: $text-secondary;
}

.loader {
  width: 32px;
  height: 32px;
  border: 3px solid rgba($primary, 0.15);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stat-card {
  background: $surface;
  border-radius: $radius-lg;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: $shadow-sm;
  border: 1px solid $border;

  i {
    font-size: 1.3rem;
    color: $primary;
    width: 32px;
    text-align: center;
  }

  div {
    display: flex;
    flex-direction: column;

    strong {
      font-size: 1.2rem;
      font-weight: 800;
      color: $text;
    }
    span {
      font-size: 0.72rem;
      color: $text-secondary;
    }
  }
}

.admin-info {
  background: $primary-bg;
  border: 1px solid rgba($primary, 0.15);
  border-radius: $radius-md;
  padding: 14px;

  p {
    font-size: 0.82rem;
    color: $text;
    line-height: 1.5;
    margin: 0;
  }
}
</style>
