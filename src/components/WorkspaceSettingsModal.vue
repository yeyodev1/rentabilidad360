<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useOnboardingStore, type CurrencyCode, CURRENCY_SYMBOLS, PAIN_POINTS } from '@/stores/onboarding'
import { useUIStore } from '@/stores/ui'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ close: [] }>()

const store = useOnboardingStore()
const ui = useUIStore()

const projectName = ref(store.projectName)
const businessType = ref(store.businessType)
const currency = ref<CurrencyCode>(store.currency)
const painPoints = ref<string[]>([...store.painPoints])

const businessTypes = [
  { id: 'restaurante', label: 'Restaurante', icon: 'fa-solid fa-burger' },
  { id: 'cafeteria', label: 'Cafetería', icon: 'fa-solid fa-mug-hot' },
  { id: 'heladeria', label: 'Heladería', icon: 'fa-solid fa-ice-cream' },
  { id: 'pizza', label: 'Pizzería', icon: 'fa-solid fa-pizza-slice' },
  { id: 'panaderia', label: 'Panadería', icon: 'fa-solid fa-bread-slice' },
  { id: 'bar', label: 'Bar / Pub', icon: 'fa-solid fa-martini-glass-citrus' },
]

const currencies: { code: CurrencyCode; label: string }[] = [
  { code: 'USD', label: 'USD' },
  { code: 'MXN', label: 'MXN' },
  { code: 'EUR', label: 'EUR' },
  { code: 'COP', label: 'COP' },
]

const isDirty = computed(() => {
  if (projectName.value !== store.projectName) return true
  if (businessType.value !== store.businessType) return true
  if (currency.value !== store.currency) return true
  if (painPoints.value.length !== store.painPoints.length) return true
  return painPoints.value.some((p) => !store.painPoints.includes(p as any))
})

watch(
  () => props.show,
  (v) => {
    if (v) {
      projectName.value = store.projectName
      businessType.value = store.businessType
      currency.value = store.currency
      painPoints.value = [...store.painPoints]
    }
  },
)

function togglePain(id: string) {
  const idx = painPoints.value.indexOf(id)
  if (idx >= 0) painPoints.value.splice(idx, 1)
  else painPoints.value.push(id)
}

function save() {
  if (!projectName.value.trim()) {
    ui.showToast({ title: 'Falta el nombre del proyecto', tone: 'warning' })
    return
  }
  store.projectName = projectName.value.trim()
  store.businessType = businessType.value
  store.currency = currency.value
  store.painPoints = painPoints.value as any
  ui.showToast({
    title: 'Workspace actualizado',
    message: 'Tus cambios se aplicaron al instante.',
    tone: 'success',
    icon: 'fa-solid fa-circle-check',
  })
  emit('close')
}

function close() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="ws-modal">
      <div v-if="show" class="ws-backdrop" @click.self="close">
        <article class="ws-modal" role="dialog" aria-modal="true" aria-labelledby="ws-title">
          <header class="ws-head">
            <div class="ws-head-icon"><i class="fa-solid fa-gear" /></div>
            <div>
              <span class="ws-eyebrow">Workspace</span>
              <h2 id="ws-title">Configuración del restaurante</h2>
              <p>Edita los datos que definen este espacio de trabajo.</p>
            </div>
            <button class="ws-close" @click="close" aria-label="Cerrar"><i class="fa-solid fa-xmark" /></button>
          </header>

          <section class="ws-body">
            <div class="field">
              <label class="lbl"><i class="fa-solid fa-store" /> Nombre del proyecto</label>
              <input
                v-model="projectName"
                type="text"
                class="inp"
                placeholder="Ej: La Esquina del Sabor"
                maxlength="60"
              />
            </div>

            <div class="field">
              <label class="lbl"><i class="fa-solid fa-utensils" /> Tipo de negocio</label>
              <div class="biz-grid">
                <button
                  v-for="b in businessTypes"
                  :key="b.id"
                  type="button"
                  :class="['biz-chip', { active: businessType === b.id }]"
                  @click="businessType = b.id"
                >
                  <i :class="b.icon" />
                  {{ b.label }}
                </button>
              </div>
            </div>

            <div class="field">
              <label class="lbl"><i class="fa-solid fa-dollar-sign" /> Moneda</label>
              <div class="cur-grid">
                <button
                  v-for="c in currencies"
                  :key="c.code"
                  type="button"
                  :class="['cur-chip', { active: currency === c.code }]"
                  @click="currency = c.code"
                >
                  <strong>{{ CURRENCY_SYMBOLS[c.code] }}</strong>
                  {{ c.label }}
                </button>
              </div>
            </div>

            <div class="field">
              <label class="lbl"><i class="fa-solid fa-heart-pulse" /> Dolores activos</label>
              <div class="pain-list">
                <button
                  v-for="p in PAIN_POINTS"
                  :key="p.id"
                  type="button"
                  :class="['pain-chip', { active: painPoints.includes(p.id) }]"
                  @click="togglePain(p.id)"
                >
                  <span class="pain-ico"><i :class="p.icon" /></span>
                  <span class="pain-txt">
                    <strong>{{ p.title }}</strong>
                    <em>{{ p.ctaLabel }}</em>
                  </span>
                  <i :class="painPoints.includes(p.id) ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
                </button>
              </div>
            </div>
          </section>

          <footer class="ws-foot">
            <button class="btn ghost" type="button" @click="close">Cancelar</button>
            <button class="btn primary" type="button" :disabled="!isDirty" @click="save">
              <i class="fa-solid fa-check" /> Guardar cambios
            </button>
          </footer>
        </article>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.ws-backdrop {
  position: fixed; inset: 0;
  background: rgba($primary-dark, 0.55);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  z-index: 9990;
}
.ws-modal {
  width: 100%; max-width: 540px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 30px 80px rgba($primary-dark, 0.32);
  display: flex; flex-direction: column;
  max-height: 92dvh;
  overflow: hidden;
  font-family: $font-principal;
}

.ws-head {
  display: grid;
  grid-template-columns: 56px 1fr 36px;
  align-items: center; gap: 14px;
  padding: 22px;
  background: linear-gradient(135deg, rgba($primary, 0.08), white);
  border-bottom: 1px solid rgba($primary-dark, 0.05);
}
.ws-head-icon {
  width: 56px; height: 56px; border-radius: 16px;
  background: linear-gradient(135deg, $primary, $secondary);
  color: white; display: inline-flex; align-items: center; justify-content: center;
  font-size: 1.35rem;
  box-shadow: 0 10px 24px rgba($primary, 0.32);
}
.ws-eyebrow {
  display: inline-block;
  font-size: 0.62rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;
  color: $primary;
}
.ws-head h2 { margin: 2px 0 2px; font-size: 1.1rem; font-weight: 800; color: $primary-dark; }
.ws-head p { margin: 0; font-size: 0.82rem; color: $text-secondary; line-height: 1.45; }
.ws-close {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba($primary-dark, 0.06); color: $primary-dark;
  border: none; cursor: pointer; font-size: 0.85rem;
  &:hover { background: rgba($primary-dark, 0.12); }
}

.ws-body {
  padding: 22px;
  display: flex; flex-direction: column; gap: 22px;
  overflow-y: auto;
}

.field { display: flex; flex-direction: column; gap: 8px; }
.lbl {
  font-size: 0.7rem; font-weight: 800; letter-spacing: 0.4px;
  text-transform: uppercase; color: $text-secondary;
  display: inline-flex; align-items: center; gap: 6px;
  i { color: $primary; }
}
.inp {
  width: 100%; padding: 14px 16px;
  border: 2px solid rgba($primary-dark, 0.08); border-radius: 12px;
  font-size: 0.95rem; font-family: $font-principal;
  outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
}

.biz-grid {
  display: grid; gap: 8px;
  grid-template-columns: repeat(2, 1fr);
  @media (min-width: 520px) { grid-template-columns: repeat(3, 1fr); }
}
.biz-chip {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px; border-radius: 12px;
  background: white; border: 2px solid rgba($primary-dark, 0.08);
  cursor: pointer; font-family: $font-principal; font-weight: 700;
  color: $primary-dark; font-size: 0.82rem;
  transition: all 0.2s;
  i { color: $primary; font-size: 1rem; }
  &:hover { border-color: rgba($primary, 0.4); }
  &.active {
    border-color: $primary;
    background: rgba($primary, 0.06);
    box-shadow: 0 0 0 3px rgba($primary, 0.12);
  }
}

.cur-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
}
.cur-chip {
  display: inline-flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 12px; border-radius: 12px;
  background: white; border: 2px solid rgba($primary-dark, 0.08);
  cursor: pointer; font-family: $font-principal;
  color: $primary-dark; font-size: 0.78rem; font-weight: 700;
  transition: all 0.2s;
  strong { font-size: 1.1rem; color: $primary; }
  &.active {
    border-color: $primary;
    background: rgba($primary, 0.06);
    box-shadow: 0 0 0 3px rgba($primary, 0.12);
  }
}

.pain-list { display: flex; flex-direction: column; gap: 8px; }
.pain-chip {
  display: grid;
  grid-template-columns: 42px 1fr 20px;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  background: white;
  border: 2px solid rgba($primary-dark, 0.08);
  cursor: pointer;
  font-family: $font-principal;
  text-align: left;
  transition: all 0.2s;

  &.active {
    border-color: $primary;
    background: rgba($primary, 0.05);
    .pain-ico { background: $primary; color: white; }
    > i:last-child { color: $primary; }
  }
  > i:last-child { color: rgba($primary-dark, 0.2); }
}
.pain-ico {
  width: 42px; height: 42px; border-radius: 12px;
  background: rgba($primary, 0.08); color: $primary;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1.05rem;
  transition: background 0.2s, color 0.2s;
}
.pain-txt {
  display: inline-flex; flex-direction: column; line-height: 1.2;
  strong { font-size: 0.85rem; color: $primary-dark; font-weight: 700; }
  em { font-style: normal; font-size: 0.72rem; color: $text-secondary; }
}

.ws-foot {
  display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px;
  padding: 16px 22px 22px;
  border-top: 1px solid rgba($primary-dark, 0.05);
}
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px;
  border-radius: 12px;
  border: none; cursor: pointer;
  font-family: $font-principal; font-weight: 800; font-size: 0.92rem;
  transition: transform 0.15s;
  &:active:not(:disabled) { transform: scale(0.97); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.btn.ghost { background: rgba($primary-dark, 0.06); color: $primary-dark; &:hover { background: rgba($primary-dark, 0.12); } }
.btn.primary {
  background: linear-gradient(135deg, $primary, #1678b0); color: white;
  box-shadow: 0 10px 24px rgba($primary, 0.3);
}

.ws-modal-enter-active, .ws-modal-leave-active { transition: opacity 0.22s; }
.ws-modal-enter-from, .ws-modal-leave-to { opacity: 0; }
.ws-modal-enter-active .ws-modal, .ws-modal-leave-active .ws-modal {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s;
}
.ws-modal-enter-from .ws-modal, .ws-modal-leave-to .ws-modal {
  transform: translateY(24px) scale(0.96); opacity: 0;
}
</style>
