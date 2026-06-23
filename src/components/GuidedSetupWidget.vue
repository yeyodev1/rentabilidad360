<script setup lang="ts">
import { useRouter } from 'vue-router'

export interface SetupStep {
  id: string
  icon: string
  title: string
  desc: string
  done: boolean
  route: string
}

const props = defineProps({
  steps: {
    type: Array as () => SetupStep[],
    required: true
  },
  progress: {
    type: Number,
    required: true
  }
})

const router = useRouter()
</script>

<template>
  <section v-if="progress < 100" class="setup-guide">
    <div class="sg-header">
      <div class="sg-title-block">
        <span class="sg-eyebrow">Primeros Pasos</span>
        <h2 class="sg-title">Completa tu Restaurante</h2>
      </div>
      <div class="sg-progress-wrap">
        <span class="sg-pct">{{ progress }}%</span>
        <div class="sg-track"><div class="sg-fill" :style="{ width: progress + '%' }" /></div>
      </div>
    </div>
    <div class="sg-steps">
      <button v-for="step in steps" :key="step.id" 
        :class="['sg-step', { done: step.done }]" 
        @click="step.route ? router.push(step.route) : null"
        :disabled="step.done">
        <div class="sg-step-icon"><i :class="['fa-solid', step.icon]" /></div>
        <div class="sg-step-info">
          <strong>{{ step.title }}</strong>
          <span>{{ step.desc }}</span>
        </div>
        <i v-if="step.done" class="fa-solid fa-circle-check sg-status-icon done-icon" />
        <i v-else class="fa-solid fa-chevron-right sg-status-icon" />
      </button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.setup-guide {
  background: white; border-radius: 16px; padding: 20px;
  box-shadow: 0 4px 20px rgba($primary-dark, 0.05);
  border: 1.5px solid rgba($primary, 0.15);
  display: flex; flex-direction: column; gap: 16px;
  position: relative; overflow: hidden;
  &::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, $primary, $secondary); }
}
.sg-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.sg-title-block { display: flex; flex-direction: column; gap: 4px; }
.sg-eyebrow { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: $primary; }
.sg-title { margin: 0; font-size: 1.15rem; font-weight: 800; color: $primary-dark; }
.sg-progress-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; width: 100px; }
.sg-pct { font-size: 0.8rem; font-weight: 800; color: $primary; }
.sg-track { width: 100%; height: 6px; background: rgba($primary, 0.1); border-radius: 99px; overflow: hidden; }
.sg-fill { height: 100%; background: linear-gradient(90deg, $primary, $secondary); border-radius: 99px; transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1); }

.sg-steps { display: flex; flex-direction: column; gap: 8px; }
.sg-step {
  display: flex; align-items: center; gap: 14px; padding: 12px 14px;
  background: rgba($primary-dark, 0.02); border: 1px solid rgba($primary-dark, 0.05); border-radius: 12px;
  cursor: pointer; text-align: left; transition: all 0.2s;
  font-family: inherit;
  &:hover:not(:disabled) { background: white; border-color: $primary; box-shadow: 0 4px 12px rgba($primary, 0.08); transform: translateY(-1px); .sg-step-icon { background: rgba($primary, 0.1); color: $primary; } }
  &:disabled { cursor: default; }
  &.done { background: white; border-color: rgba($alert-success, 0.3); opacity: 0.8; }
}
.sg-step-icon { width: 36px; height: 36px; border-radius: 10px; background: white; color: $text-secondary; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; transition: all 0.2s; border: 1px solid rgba($primary-dark, 0.08);
  .sg-step.done & { background: $alert-success; color: white; border-color: $alert-success; }
}
.sg-step-info { flex: 1; display: flex; flex-direction: column; gap: 2px;
  strong { font-size: 0.85rem; font-weight: 700; color: $primary-dark; white-space: normal; }
  span { font-size: 0.75rem; color: $text-secondary; line-height: 1.3; white-space: normal; }
}
.sg-status-icon { color: rgba($primary-dark, 0.2); font-size: 0.85rem;
  &.done-icon { color: $alert-success; font-size: 1.1rem; }
}
</style>
