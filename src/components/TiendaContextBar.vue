<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingStore } from '@/stores/onboarding'

const router = useRouter()
const store = useOnboardingStore()

const tienda = computed(() => store.activeTienda)
const others = computed(() => store.tiendas.filter((t) => t.id !== store.activeTiendaId))

function goManage() {
  router.push('/configuracion/workspace')
}

function pick(id: string) {
  store.setActiveTienda(id)
}
</script>

<template>
  <div v-if="tienda" class="tcb">
    <div class="tcb-left">
      <span class="tcb-ico"><i class="fa-solid fa-store" /></span>
      <div class="tcb-info">
        <span class="tcb-eyebrow">Mostrando datos de</span>
        <strong class="tcb-name">
          {{ tienda.name }}
          <span v-if="tienda.isMain" class="tcb-main"><i class="fa-solid fa-star" /> Principal</span>
        </strong>
        <span v-if="tienda.address || tienda.city" class="tcb-meta">
          <i class="fa-solid fa-location-dot" />
          {{ tienda.address }}{{ tienda.city ? ', ' + tienda.city : '' }}
        </span>
      </div>
    </div>

    <div class="tcb-right">
      <div v-if="others.length" class="tcb-quick">
        <span class="qk-label">Cambiar a:</span>
        <button
          v-for="t in others.slice(0, 3)"
          :key="t.id"
          type="button"
          class="qk-btn"
          @click="pick(t.id)"
        >
          <i class="fa-solid fa-store" />
          {{ t.name }}
        </button>
      </div>
      <button type="button" class="tcb-manage" @click="goManage">
        <i class="fa-solid fa-gear" /> Gestionar
      </button>
    </div>
  </div>

  <div v-else class="tcb empty">
    <div class="tcb-left">
      <span class="tcb-ico amber"><i class="fa-solid fa-lightbulb" /></span>
      <div class="tcb-info">
        <span class="tcb-eyebrow amber">Modo proyecto</span>
        <strong class="tcb-name">Workspace sin tiendas todavía</strong>
        <span class="tcb-meta">
          <i class="fa-solid fa-circle-info" />
          Estás explorando la herramienta. Cuando estés listo, agrega tu primera tienda para activar la operación real.
        </span>
      </div>
    </div>
    <div class="tcb-right">
      <button type="button" class="tcb-add" @click="goManage">
        <i class="fa-solid fa-plus" /> Agregar primera tienda
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tcb {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; flex-wrap: wrap;
  background: white;
  border: 1px solid rgba($primary-dark, 0.06);
  border-left: 4px solid $primary;
  border-radius: 14px;
  padding: 12px 14px;
  font-family: $font-principal;
  box-shadow: 0 2px 6px rgba($primary-dark, 0.04);
}
.tcb-left { display: inline-flex; align-items: center; gap: 12px; min-width: 0; }
.tcb-ico {
  width: 42px; height: 42px; border-radius: 12px;
  background: linear-gradient(135deg, $primary, $secondary);
  color: white;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1.05rem;
  box-shadow: 0 6px 16px rgba($primary, 0.28);
}
.tcb-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; line-height: 1.2; }
.tcb-eyebrow {
  font-size: 0.62rem; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase;
  color: $text-secondary;
}
.tcb-name {
  font-size: 1rem; color: $primary-dark; font-weight: 800;
  display: inline-flex; align-items: center; gap: 8px;
}
.tcb-main {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.62rem; font-weight: 800; letter-spacing: 0.5px;
  background: rgba(245, 158, 11, 0.18); color: #b45309;
  padding: 3px 7px; border-radius: 8px;
}
.tcb-meta {
  font-size: 0.74rem; color: $text-secondary;
  i { color: $primary; margin-right: 4px; }
}

.tcb-right { display: inline-flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.tcb-quick { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.qk-label { font-size: 0.7rem; color: $text-secondary; font-weight: 700; }
.qk-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 6px 10px; border-radius: 999px;
  background: rgba($primary, 0.08); color: $primary;
  border: 1px solid rgba($primary, 0.18);
  font-family: $font-principal; font-size: 0.74rem; font-weight: 700; cursor: pointer;
  &:hover { background: rgba($primary, 0.16); }
}
.tcb-manage {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 12px; border-radius: 10px;
  background: $primary-dark; color: white;
  border: none; font-family: $font-principal; font-weight: 700; font-size: 0.78rem;
  cursor: pointer;
  &:hover { background: #0e1e3c; }
}

.tcb.empty {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), white);
  .tcb-ico.amber {
    background: linear-gradient(135deg, #f59e0b, #fb923c);
    box-shadow: 0 6px 16px rgba(245, 158, 11, 0.28);
  }
  .tcb-eyebrow.amber { color: #b45309; }
}
.tcb-add {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 14px; border-radius: 10px;
  background: linear-gradient(135deg, #f59e0b, #fb923c); color: white;
  border: none; font-family: $font-principal; font-weight: 800; font-size: 0.82rem;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.35);
}
</style>
