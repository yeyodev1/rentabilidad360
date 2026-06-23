<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { costingService } from '@/services/costingService'
import { maintenanceService } from '@/services/maintenanceService'
import { posService } from '@/services/posService'
import { checklistService } from '@/services/checklistService'
import { staffService } from '@/services/staffService'
import { onboardingService } from '@/services/onboardingService'

export interface SetupTask {
  id: string
  icon: string
  label: string
  desc: string
  benefit: string
  route: string
  check: () => Promise<boolean>
  done: boolean
  loading: boolean
}

const router = useRouter()
const userStore = useUserStore()

const tasks = ref<SetupTask[]>([
  {
    id: 'company',
    icon: 'fa-building',
    label: 'Completar datos de la empresa',
    desc: 'Nombre legal, RUC y ubicación del negocio',
    benefit: 'Necesario para facturación, reportes oficiales y cumplimiento legal. Sin estos datos el sistema no puede generar documentos válidos.',
    route: '/configuracion/workspace',
    done: false,
    loading: false,
    check: async () => {
      userStore.hydrate()
      return !!userStore.workspaceName
    },
  },
  {
    id: 'schedules',
    icon: 'fa-clock',
    label: 'Configurar horarios',
    desc: 'Turnos de cocina y atención al cliente',
    benefit: 'El sistema detectará horas débiles y sugerirá ajustes de personal para reducir costos operativos sin afectar el servicio.',
    route: '/modulo/horarios',
    done: false,
    loading: false,
    check: async () => {
      try {
        const res = await staffService.listShifts()
        return (res.data as any)?.length > 0
      } catch { return false }
    },
  },
  {
    id: 'recipes',
    icon: 'fa-utensils',
    label: 'Registrar recetas',
    desc: 'Agrega tus platos con precios de venta',
    benefit: 'Cada receta te dará el costo real por plato, margen de ganancia y te alertará si los precios de insumos suben. Es la base del módulo de costeo.',
    route: '/modulo/costeo',
    done: false,
    loading: false,
    check: async () => {
      try {
        const res = await costingService.listRecipes()
        return (res.data as any)?.length > 0
      } catch { return false }
    },
  },
  {
    id: 'ingredients',
    icon: 'fa-basket-shopping',
    label: 'Registrar ingredientes',
    desc: 'Insumos con costos unitarios',
    benefit: 'Llevar el control de costos de insumos te permite ver tu margen real, ajustar precios a tiempo y reducir desperdicios.',
    route: '/modulo/costeo',
    done: false,
    loading: false,
    check: async () => {
      try {
        const res = await costingService.listIngredients()
        return (res.data as any)?.length > 0
      } catch { return false }
    },
  },
  {
    id: 'equipment',
    icon: 'fa-screwdriver-wrench',
    label: 'Inventariar equipos',
    desc: 'Maquinaria y electrodomésticos de cocina',
    benefit: 'El sistema programará mantenimientos preventivos, evitará paradas inesperadas y alargará la vida útil de tus activos.',
    route: '/modulo/mantenimiento',
    done: false,
    loading: false,
    check: async () => {
      try {
        const res = await maintenanceService.listEquipment()
        return (res.data as any)?.length > 0
      } catch { return false }
    },
  },
  {
    id: 'fixed-costs',
    icon: 'fa-receipt',
    label: 'Registrar costos fijos',
    desc: 'Renta, nómina, servicios y gastos operativos',
    benefit: 'Conocer tus costos fijos mensuales es clave para calcular el punto de equilibrio y saber cuánto necesitas vender para no perder.',
    route: '/modulo/costeo',
    done: false,
    loading: false,
    check: async () => {
      try {
        const res = await onboardingService.getProgress()
        return !!(res.data as any)?.data?.['7']?.rent
      } catch { return false }
    },
  },
  {
    id: 'pos',
    icon: 'fa-plug',
    label: 'Conectar POS',
    desc: 'Integrar sistema de punto de venta',
    benefit: 'Las ventas se sincronizarán automáticamente. Verás tus KPIs en tiempo real sin capturar datos manualmente.',
    route: '/settings/integrations',
    done: false,
    loading: false,
    check: async () => {
      try {
        const res = await posService.getConnections()
        return (res.data as any)?.length > 0
      } catch { return false }
    },
  },
  {
    id: 'checklists',
    icon: 'fa-clipboard-check',
    label: 'Crear checklists',
    desc: 'Plantillas de inspección diaria',
    benefit: 'Automatiza el control sanitario y de limpieza. El sistema te recordará cuándo llenarlos y alertará si se omiten.',
    route: '/modulo/checklists',
    done: false,
    loading: false,
    check: async () => {
      try {
        const res = await checklistService.listTemplates()
        return (res.data as any)?.length > 0
      } catch { return false }
    },
  },
])

const doneCount = computed(() => tasks.value.filter(t => t.done).length)
const totalCount = computed(() => tasks.value.length)
const progress = computed(() => Math.round((doneCount.value / totalCount.value) * 100))
const isComplete = computed(() => doneCount.value === totalCount.value)
const focusedId = ref<string | null>(null)

function toggleFocus(id: string) {
  focusedId.value = focusedId.value === id ? null : id
}

async function checkAll() {
  for (const task of tasks.value) {
    task.loading = true
    try {
      task.done = await task.check()
    } catch {
      task.done = false
    }
    task.loading = false
  }
  if (isComplete.value) {
    emit('complete')
  }
}

function goTo(task: SetupTask) {
  if (!task.done) {
    router.push(task.route)
  }
}

const emit = defineEmits<{ complete: [] }>()

onMounted(checkAll)
</script>

<template>
  <section class="setup-guide" :class="{ complete: isComplete }">
    <div class="sg-header">
      <div class="sg-title-block">
        <span class="sg-eyebrow">Configuración guiada</span>
        <h2 class="sg-title">
          <template v-if="isComplete">¡Restaurante configurado!</template>
          <template v-else>Completa tu restaurante</template>
        </h2>
      </div>
      <div class="sg-progress-wrap">
        <span class="sg-pct">{{ doneCount }}/{{ totalCount }}</span>
        <div class="sg-track"><div class="sg-fill" :style="{ width: progress + '%' }" /></div>
      </div>
    </div>

    <p v-if="isComplete" class="sg-done-msg">
      <i class="fa-solid fa-circle-check" />
      Todos los módulos están listos. Revisa tus KPIs y accesos directos abajo.
    </p>
    <p v-else class="sg-intro">
      Completa estos pasos para que Rentabilidad360 pueda ayudarte a reducir costos,
      evitar multas sanitarias y optimizar tu operación.
    </p>

    <div class="sg-tasks">
      <div v-for="task in tasks" :key="task.id"
        :class="['sg-task', { done: task.done, loading: task.loading, focused: focusedId === task.id }]">
        <div class="sg-task-main" @click="task.done ? null : toggleFocus(task.id)">
          <div class="sg-task-icon">
            <i v-if="task.loading" class="fa-solid fa-spinner fa-spin" />
            <i v-else :class="['fa-solid', task.icon]" />
          </div>
          <div class="sg-task-info">
            <div class="sg-task-label">{{ task.label }}</div>
            <div class="sg-task-desc">{{ task.desc }}</div>
          </div>
          <div class="sg-task-status">
            <i v-if="task.done" class="fa-solid fa-circle-check done-icon" />
            <i v-else class="fa-solid fa-circle-info info-icon" />
          </div>
        </div>

        <div :class="['sg-task-detail', { 'sg-open': focusedId === task.id && !task.done }]">
          <div class="sg-detail-inner">
            <div class="sg-task-benefit">
              <i class="fa-solid fa-lightbulb" />
              <span>{{ task.benefit }}</span>
            </div>
            <button class="sg-task-cta" @click="goTo(task)">
              <i class="fa-solid fa-arrow-right" /> Ir a configurar
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.setup-guide {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba($primary-dark, 0.05);
  border: 1.5px solid rgba($primary, 0.15);
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, $primary, $secondary);
  }

  &.complete::before {
    background: linear-gradient(90deg, $alert-success, $primary);
  }
}

.sg-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.sg-title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sg-eyebrow {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: $primary;
}

.sg-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: $primary-dark;
}

.sg-progress-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  width: 80px;
}

.sg-pct {
  font-size: 0.8rem;
  font-weight: 800;
  color: $primary;
}

.sg-track {
  width: 100%;
  height: 6px;
  background: rgba($primary, 0.1);
  border-radius: 99px;
  overflow: hidden;
}

.sg-fill {
  height: 100%;
  background: linear-gradient(90deg, $primary, $secondary);
  border-radius: 99px;
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.sg-done-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: $alert-success;
  padding: 10px 14px;
  background: rgba($alert-success, 0.06);
  border-radius: 10px;
  i { font-size: 1.1rem; }
}

.sg-intro {
  margin: 0;
  font-size: 0.82rem;
  color: $text-secondary;
  line-height: 1.5;
}

.sg-tasks {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sg-task {
  display: flex;
  flex-direction: column;
  background: rgba($primary-dark, 0.02);
  border: 1px solid rgba($primary-dark, 0.05);
  border-radius: 10px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &.loading {
    opacity: 0.6;
    pointer-events: none;
  }

  &.done {
    background: rgba($alert-success, 0.03);
    border-color: rgba($alert-success, 0.15);
    opacity: 0.65;
  }

  &.focused:not(.done) {
    border-color: $primary;
    box-shadow: 0 2px 12px rgba($primary, 0.08);
    .sg-task-status .info-icon {
      color: $primary;
      transform: rotate(-90deg);
    }
  }
}

.sg-task-main {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  font-family: inherit;
  text-align: left;

  .sg-task:not(.done):not(.focused):hover & {
    .sg-task-status .info-icon { color: $primary; }
    .sg-task-icon { border-color: rgba($primary, 0.2); }
    .sg-task-desc { color: $primary-dark; }
  }
}

.sg-task-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: $text-secondary;
  flex-shrink: 0;
  border: 1px solid rgba($primary-dark, 0.06);
  transition: border-color 0.15s;

  .sg-task.done & {
    background: rgba($alert-success, 0.1);
    color: $alert-success;
    border-color: rgba($alert-success, 0.2);
  }
}

.sg-task-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.sg-task-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: $primary-dark;
}

.sg-task-desc {
  font-size: 0.72rem;
  color: $text-secondary;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sg-task-status {
  flex-shrink: 0;
  display: flex;
  align-items: center;

  .done-icon {
    color: $alert-success;
    font-size: 1.05rem;
  }

  .info-icon {
    color: rgba($primary-dark, 0.15);
    font-size: 0.85rem;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.sg-detail-enter-active,
.sg-detail-leave-active,
.sg-detail-enter-from,
.sg-detail-leave-to {
  /* kept for compatibility */
}

.sg-task-detail {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.25s ease;
  opacity: 0;
  overflow: hidden;

  &.sg-open {
    grid-template-rows: 1fr;
    opacity: 1;
  }
}

.sg-detail-inner {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  padding: 0 12px;
  padding-top: 10px;
  padding-bottom: 12px;
  border-top: 1px solid transparent;
  transition: border-color 0.3s ease;

  .sg-task-detail.sg-open & {
    border-top-color: rgba($primary, 0.08);
  }
}

.sg-task-benefit {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 0.78rem;
  line-height: 1.5;
  color: $text;
  padding: 8px 10px;
  background: rgba($primary, 0.04);
  border-radius: 8px;

  i {
    color: $accent;
    font-size: 0.85rem;
    flex-shrink: 0;
    margin-top: 2px;
  }
}

.sg-task-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: $primary;
  color: white;
  border: none;
  border-radius: 8px;
  font-family: $font-principal;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s;
  align-self: flex-start;

  &:hover {
    background: $primary-dark;
    gap: 8px;
  }
}
</style>