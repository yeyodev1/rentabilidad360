<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useOnboardingStore } from '@/stores/onboarding'

const store = useOnboardingStore()

type Scope = 'project' | 'tienda'

const businessTypes = [
  { id: 'restaurante', label: 'Restaurante', icon: 'fa-solid fa-burger' },
  { id: 'cafeteria', label: 'Cafetería', icon: 'fa-solid fa-mug-hot' },
  { id: 'heladeria', label: 'Heladería', icon: 'fa-solid fa-ice-cream' },
  { id: 'pizza', label: 'Pizzería', icon: 'fa-solid fa-pizza-slice' },
  { id: 'panaderia', label: 'Panadería', icon: 'fa-solid fa-bread-slice' },
  { id: 'bar', label: 'Bar / Pub', icon: 'fa-solid fa-martini-glass-citrus' },
]

const hasTiendas = computed(() => store.tiendas.length > 0)

const scope = ref<Scope>(hasTiendas.value ? 'tienda' : 'project')

onMounted(() => {
  if (hasTiendas.value && store.activeTienda) {
    store.projectName = store.activeTienda.name
    if (store.activeTienda.businessType) store.businessType = store.activeTienda.businessType
  }
})

watch(scope, (s) => {
  if (s === 'tienda' && store.activeTienda) {
    store.projectName = store.activeTienda.name
    if (store.activeTienda.businessType) store.businessType = store.activeTienda.businessType
  }
  if (s === 'project') {
    if (navigator.vibrate) navigator.vibrate(8)
  }
})

function pickTienda(id: string) {
  store.setActiveTienda(id)
  const t = store.activeTienda
  if (t) {
    store.projectName = t.name
    if (t.businessType) store.businessType = t.businessType
  }
  if (navigator.vibrate) navigator.vibrate(8)
}

function selectBusiness(type: string) {
  store.businessType = type
  if (navigator.vibrate) navigator.vibrate(10)
}

const canContinue = computed(() => {
  if (scope.value === 'tienda') return !!store.activeTienda && store.businessType !== null
  return store.projectName.trim().length > 0 && store.businessType !== null
})

function next() {
  if (!canContinue.value) return
  store.goToStep(2)
}
</script>

<template>
  <div class="step-container">
    <div class="step-content">
      <div class="brand-badge">
        <span class="brand-dot" />
        Rentabilidad360
      </div>

      <h1 class="step-title">
        Analiza la rentabilidad<br>
        <span class="highlight">{{ scope === 'tienda' ? 'de tu tienda' : 'de tu proyecto' }}</span>
        en 1 minuto
      </h1>

      <!-- Scope chooser -->
      <div class="scope-row" v-if="hasTiendas">
        <button
          type="button"
          :class="['scope-card', { active: scope === 'tienda' }]"
          @click="scope = 'tienda'"
        >
          <span class="scope-ico"><i class="fa-solid fa-store" /></span>
          <span class="scope-body">
            <em>Diagnóstico para</em>
            <strong>Una tienda existente</strong>
            <span class="scope-hint">Usa los datos reales de una de tus {{ store.tiendas.length }} tiendas</span>
          </span>
          <i :class="scope === 'tienda' ? 'fa-solid fa-circle-check on' : 'fa-regular fa-circle'" />
        </button>
        <button
          type="button"
          :class="['scope-card', { active: scope === 'project' }]"
          @click="scope = 'project'"
        >
          <span class="scope-ico amber"><i class="fa-solid fa-lightbulb" /></span>
          <span class="scope-body">
            <em>Diagnóstico para</em>
            <strong>Un nuevo proyecto</strong>
            <span class="scope-hint">Aún no es una tienda real, estás validando una idea</span>
          </span>
          <i :class="scope === 'project' ? 'fa-solid fa-circle-check on' : 'fa-regular fa-circle'" />
        </button>
      </div>

      <div v-else class="scope-banner">
        <span class="sb-ico"><i class="fa-solid fa-lightbulb" /></span>
        <div>
          <strong>Estás diagnosticando un proyecto nuevo</strong>
          <p>Aún no tienes tiendas registradas. Cuando termines, crearemos tu primera tienda automáticamente con estos datos.</p>
        </div>
      </div>

      <!-- TIENDA mode: picker + readonly summary -->
      <template v-if="scope === 'tienda' && hasTiendas">
        <div class="input-group">
          <label class="input-label">
            <i class="fa-solid fa-store" />
            ¿Para cuál tienda?
          </label>
          <div class="tienda-row">
            <button
              v-for="t in store.tiendas"
              :key="t.id"
              type="button"
              :class="['tienda-pick', { active: store.activeTiendaId === t.id }]"
              @click="pickTienda(t.id)"
            >
              <span class="tp-ico"><i class="fa-solid fa-store" /></span>
              <span class="tp-meta">
                <strong>{{ t.name }}</strong>
                <em>{{ t.isMain ? 'Principal' : t.city || 'Sucursal' }}</em>
              </span>
              <i v-if="store.activeTiendaId === t.id" class="fa-solid fa-circle-check ok" />
            </button>
          </div>
        </div>

        <div class="active-card" v-if="store.activeTienda">
          <span class="ac-eyebrow"><i class="fa-solid fa-eye" /> Estás llenando datos de</span>
          <strong class="ac-name">{{ store.activeTienda.name }}</strong>
          <span class="ac-meta">
            <span v-if="store.activeTienda.city"><i class="fa-solid fa-location-dot" /> {{ store.activeTienda.city }}</span>
            <span v-if="store.activeTienda.manager"><i class="fa-solid fa-user-tie" /> {{ store.activeTienda.manager }}</span>
            <span><i class="fa-solid fa-users" /> {{ store.activeTienda.staff }} personal</span>
          </span>
        </div>
      </template>

      <!-- PROJECT mode: name input -->
      <div v-else class="input-group">
        <label class="input-label">
          <i class="fa-solid fa-tag" />
          Nombre del proyecto
        </label>
        <input
          v-model="store.projectName"
          type="text"
          class="text-input"
          placeholder="Ej: La Esquina del Sabor"
          maxlength="50"
        />
        <span class="input-hint">
          <i class="fa-solid fa-circle-info" /> Cuando termines, este nombre se convertirá en tu primera tienda.
        </span>
      </div>

      <!-- Business type (always shown) -->
      <div class="input-group">
        <label class="input-label">
          <i class="fa-solid fa-utensils" />
          Tipo de negocio
        </label>
        <div class="business-grid">
          <button
            v-for="type in businessTypes"
            :key="type.id"
            :class="['business-chip', { active: store.businessType === type.id }]"
            @click="selectBusiness(type.id)"
          >
            <span class="chip-icon"><i :class="type.icon" /></span>
            <span class="chip-label">{{ type.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="step-footer">
      <Transition name="fade" mode="out-in">
        <button
          v-if="canContinue"
          key="active"
          class="btn-primary"
          @click="next"
        >
          {{ scope === 'tienda' ? 'Seguir con esta tienda' : 'Empezar diagnóstico' }}
          <i class="fa-solid fa-arrow-right btn-arrow" />
        </button>
        <button
          v-else
          key="disabled"
          class="btn-primary disabled"
          disabled
        >
          {{ scope === 'tienda' ? 'Elige una tienda y el tipo de negocio' : 'Completa los campos para continuar' }}
        </button>
      </Transition>
    </div>
  </div>
</template>

<style scoped lang="scss">
.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: $primary;
  background: rgba($primary, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 16px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.brand-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: $primary;
}

.step-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 20px 0;
  min-height: 100dvh;
}

.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-top: 24px;
}

.step-title {
  font-size: 1.55rem;
  font-weight: 700;
  line-height: 1.3;
  color: $primary-dark;
  margin: 0;
}

.highlight {
  color: $primary;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: $primary-dark;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  i { color: $primary; }
}

.input-hint {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.78rem; color: $text-secondary;
  i { color: $primary; }
}

.text-input {
  width: 100%;
  padding: 16px;
  border: 2px solid rgba($primary-dark, 0.08);
  border-radius: 14px;
  font-size: 1rem;
  font-family: $font-principal;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: white;

  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba($primary, 0.12);
  }

  &::placeholder { color: #b0b0b0; }
}

.business-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.business-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border: 2px solid rgba($primary-dark, 0.08);
  border-radius: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  -webkit-tap-highlight-color: transparent;
  font-family: $font-principal;

  &:active { transform: scale(0.95); }

  &.active {
    border-color: $primary;
    background: rgba($primary, 0.06);
    box-shadow: 0 0 0 3px rgba($primary, 0.12);
    .chip-icon { color: $primary; }
  }
}

.chip-icon { font-size: 1.5rem; line-height: 1; color: $primary-dark; }
.chip-label { font-size: 0.72rem; font-weight: 600; color: $primary-dark; text-align: center; }

/* Scope chooser */
.scope-row {
  display: grid; gap: 10px;
  grid-template-columns: 1fr;
  @media (min-width: 600px) { grid-template-columns: 1fr 1fr; }
}
.scope-card {
  display: grid; grid-template-columns: 50px 1fr 22px; align-items: center; gap: 12px;
  padding: 14px 16px;
  border: 2px solid rgba($primary-dark, 0.08);
  border-radius: 18px;
  background: white;
  font-family: $font-principal; cursor: pointer; text-align: left;
  transition: all 0.2s;
  &:hover { border-color: rgba($primary, 0.4); }
  &.active {
    border-color: $primary;
    background: linear-gradient(180deg, rgba($primary, 0.06), white);
    box-shadow: 0 8px 22px rgba($primary, 0.14);
    .scope-ico { background: $primary; color: white; }
    .scope-ico.amber { background: linear-gradient(135deg, #f59e0b, #fb923c); }
    .on { color: $primary; }
  }
  > i:last-child { color: rgba($primary-dark, 0.22); font-size: 1.2rem; }
  .on { color: $primary; }
}
.scope-ico {
  width: 50px; height: 50px; border-radius: 14px;
  background: rgba($primary, 0.1); color: $primary;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1.25rem; transition: background 0.2s, color 0.2s;
  &.amber {
    background: rgba(245, 158, 11, 0.18); color: #b45309;
  }
}
.scope-body { display: inline-flex; flex-direction: column; line-height: 1.25;
  em { font-style: normal; font-size: 0.62rem; font-weight: 800; letter-spacing: 0.6px;
    text-transform: uppercase; color: $text-secondary; }
  strong { font-size: 0.95rem; font-weight: 800; color: $primary-dark; margin-top: 2px; }
  .scope-hint { font-size: 0.74rem; color: $text-secondary; margin-top: 2px; }
}

.scope-banner {
  display: grid; grid-template-columns: 44px 1fr; gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), white);
  border: 1px dashed rgba(245, 158, 11, 0.5);
  border-radius: 16px;
  strong { font-size: 0.92rem; color: $primary-dark; display: block; line-height: 1.3; }
  p { margin: 4px 0 0; font-size: 0.78rem; color: $text-secondary; line-height: 1.5; }
}
.sb-ico {
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg, #f59e0b, #fb923c); color: white;
  display: inline-flex; align-items: center; justify-content: center; font-size: 1.05rem;
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.32);
}

/* Tienda picker */
.tienda-row { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;
  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba($primary, 0.2); border-radius: 4px; }
}
.tienda-pick {
  display: inline-grid; grid-template-columns: 36px auto 18px; gap: 10px; align-items: center;
  padding: 10px 14px; border-radius: 12px;
  background: white; border: 2px solid rgba($primary-dark, 0.08);
  cursor: pointer; font-family: $font-principal; text-align: left;
  flex-shrink: 0;
  transition: all 0.2s;
  &.active {
    border-color: $primary;
    background: rgba($primary, 0.06);
    .tp-ico { background: $primary; color: white; }
    .ok { color: $primary; }
  }
}
.tp-ico {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba($primary, 0.1); color: $primary;
  display: inline-flex; align-items: center; justify-content: center; font-size: 0.95rem;
}
.tp-meta {
  display: inline-flex; flex-direction: column; line-height: 1.15;
  strong { font-size: 0.85rem; font-weight: 700; color: $primary-dark; }
  em { font-style: normal; font-size: 0.7rem; color: $text-secondary; }
}
.ok { color: $primary; font-size: 0.9rem; }

.active-card {
  position: relative;
  display: flex; flex-direction: column; gap: 4px;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba($primary, 0.08), rgba($secondary, 0.05));
  border: 1px solid rgba($primary, 0.22);
  border-radius: 16px;
}
.ac-eyebrow {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.62rem; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase;
  color: $primary;
  i { color: $primary; }
}
.ac-name { font-size: 1.05rem; font-weight: 800; color: $primary-dark; }
.ac-meta { display: inline-flex; flex-wrap: wrap; gap: 10px; font-size: 0.78rem; color: $text-secondary;
  i { color: $primary; margin-right: 2px; }
}

/* Footer */
.step-footer {
  padding: 16px 0;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

.btn-primary {
  width: 100%;
  padding: 18px;
  border: none;
  border-radius: 14px;
  background: $primary;
  color: white;
  font-size: 1rem;
  font-weight: 700;
  font-family: $font-principal;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 6px 20px rgba($primary, 0.28);
  -webkit-tap-highlight-color: transparent;

  &:not(.disabled):active { transform: scale(0.97); }

  &.disabled {
    background: #d0d0d0;
    cursor: not-allowed;
    box-shadow: none;
  }
}

.btn-arrow { font-size: 1rem; transition: transform 0.2s; }
.btn-primary:not(.disabled):hover .btn-arrow { transform: translateX(3px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
