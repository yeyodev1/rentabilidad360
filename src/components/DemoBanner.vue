<script setup lang="ts">
import { ref } from 'vue'

withDefaults(defineProps<{
  title?: string
  message?: string
  ctaLabel?: string
  ctaIcon?: string
  ctaTo?: string
  dismissible?: boolean
}>(), {
  title: 'Estás viendo datos de demostración',
  message: 'Los números, equipos y alertas son ejemplos. Conecta tu POS, ERP o llena el diagnóstico para reemplazarlos por información real.',
  ctaLabel: 'Conectar mis datos reales',
  ctaIcon: 'fa-solid fa-plug-circle-bolt',
  ctaTo: '/diagnostico',
  dismissible: true,
})

const emit = defineEmits<{ cta: []; dismiss: [] }>()

const visible = ref(true)

function dismiss() {
  visible.value = false
  emit('dismiss')
}
</script>

<template>
  <Transition name="banner">
    <aside v-if="visible" class="demo-banner" role="note">
      <span class="banner-flag">
        <i class="fa-solid fa-flask" />
        Demo
      </span>
      <div class="banner-body">
        <strong class="banner-title">{{ title }}</strong>
        <p class="banner-msg">{{ message }}</p>
      </div>
      <div class="banner-actions">
        <RouterLink v-if="ctaTo" :to="ctaTo" class="banner-cta">
          <i :class="ctaIcon" />
          {{ ctaLabel }}
        </RouterLink>
        <button v-else type="button" class="banner-cta" @click="emit('cta')">
          <i :class="ctaIcon" />
          {{ ctaLabel }}
        </button>
        <button v-if="dismissible" type="button" class="banner-x" @click="dismiss" aria-label="Ocultar aviso">
          <i class="fa-solid fa-xmark" />
        </button>
      </div>
    </aside>
  </Transition>
</template>

<style scoped lang="scss">
.demo-banner {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba($alert-warning, 0.16), rgba($alert-warning, 0.06));
  border: 1px solid rgba($alert-warning, 0.34);
  position: relative;
  overflow: hidden;
  font-family: $font-principal;

  &::before {
    content: '';
    position: absolute; inset: 0;
    background: repeating-linear-gradient(
      135deg,
      rgba($alert-warning, 0.06) 0 12px,
      transparent 12px 24px
    );
    pointer-events: none;
    opacity: 0.4;
  }

  @media (max-width: 720px) {
    grid-template-columns: auto 1fr;
    .banner-actions { grid-column: 1 / -1; justify-content: flex-end; }
  }
}

.banner-flag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #f59e0b, #fb923c);
  color: white;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.32);
  position: relative;
  z-index: 1;
}

.banner-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: relative;
  z-index: 1;
  min-width: 0;
}

.banner-title {
  font-size: 0.92rem;
  font-weight: 800;
  color: darken($alert-warning, 22%);
}

.banner-msg {
  margin: 0;
  font-size: 0.8rem;
  color: $primary-dark;
  opacity: 0.78;
  line-height: 1.45;
}

.banner-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.banner-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 12px;
  font-family: $font-principal;
  font-weight: 800;
  font-size: 0.78rem;
  color: white;
  background: linear-gradient(135deg, $primary, $secondary);
  border: none;
  cursor: pointer;
  text-decoration: none;
  box-shadow: 0 8px 20px rgba($primary, 0.28);
  transition: transform 0.2s;
  &:hover { transform: translateY(-1px); }
}

.banner-x {
  width: 32px; height: 32px; border-radius: 10px;
  border: none; background: rgba($primary-dark, 0.06);
  color: $primary-dark; cursor: pointer; font-size: 0.85rem;
  &:hover { background: rgba($primary-dark, 0.12); }
}

.banner-enter-active, .banner-leave-active { transition: opacity 0.25s, transform 0.25s; }
.banner-enter-from, .banner-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
