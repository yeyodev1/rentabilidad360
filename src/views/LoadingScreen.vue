<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingStore } from '@/stores/onboarding'

const router = useRouter()
const store = useOnboardingStore()

onMounted(() => {
  setTimeout(() => {
    store.generateDiagnosis()
    router.replace('/dashboard')
  }, 1800)
})
</script>

<template>
  <div class="loading-screen">
    <div class="loader-content">
      <div class="pulse-ring" />
      <h2 class="loader-title">Procesando algoritmos financieros...</h2>
      <p class="loader-sub">Calculando rentabilidad de tu proyecto</p>
    </div>

    <div class="skeleton-section">
      <div class="skeleton-card big" />
      <div class="skeleton-row">
        <div class="skeleton-card half" />
        <div class="skeleton-card half" />
      </div>
      <div class="skeleton-card wide" />
      <div class="skeleton-card wide" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.loading-screen {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
  background: white;
  gap: 48px;
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.pulse-ring {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: $primary;
  opacity: 0.15;
  animation: pulse-ring 1.2s ease-in-out infinite;
}

@keyframes pulse-ring {
  0%, 100% {
    transform: scale(1);
    opacity: 0.15;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.05;
  }
}

.loader-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: $primary-dark;
  margin: 0;
  text-align: center;
}

.loader-sub {
  font-size: 0.85rem;
  color: $text-secondary;
  margin: 0;
  text-align: center;
}

.skeleton-section {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-card {
  background: linear-gradient(
    90deg,
    rgba($primary-dark, 0.06) 25%,
    rgba($primary-dark, 0.02) 50%,
    rgba($primary-dark, 0.06) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 14px;

  &.big {
    height: 120px;
  }

  &.half {
    flex: 1;
    height: 90px;
  }

  &.wide {
    height: 60px;
  }
}

.skeleton-row {
  display: flex;
  gap: 16px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
