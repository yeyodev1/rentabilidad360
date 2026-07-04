<script setup lang="ts">
defineProps<{ kind: 'diagnostico' | 'mantenimiento' | 'costeo' }>()
</script>

<template>
  <span class="np" :class="kind" aria-hidden="true">
    <!-- Diagnóstico / Inicio -->
    <svg v-if="kind === 'diagnostico'" viewBox="0 0 64 40" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="np-diag-g" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stop-color="#588B8B" />
          <stop offset="100%" stop-color="#7BA3A3" />
        </linearGradient>
      </defs>
      <rect width="64" height="40" rx="6" fill="#2F243A" />
      <circle cx="20" cy="22" r="11" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="3" />
      <circle cx="20" cy="22" r="11" fill="none" stroke="url(#np-diag-g)" stroke-width="3" stroke-linecap="round" stroke-dasharray="50 100" transform="rotate(-90 20 22)" />
      <text x="20" y="25" text-anchor="middle" fill="white" font-size="8" font-weight="800">21%</text>
      <rect x="36" y="10" width="22" height="3" rx="1.5" fill="rgba(255,255,255,0.25)" />
      <rect x="36" y="16" width="18" height="3" rx="1.5" fill="rgba(255,255,255,0.2)" />
      <rect x="36" y="22" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.15)" />
      <rect x="36" y="29" width="10" height="3" rx="1.5" fill="#7BA3A3" />
    </svg>

    <!-- Mantenimiento -->
    <svg v-else-if="kind === 'mantenimiento'" viewBox="0 0 64 40" preserveAspectRatio="xMidYMid meet">
      <rect width="64" height="40" rx="6" fill="#2F243A" />
      <!-- QR like grid -->
      <g transform="translate(7 7)">
        <rect width="22" height="22" rx="2" fill="rgba(255,255,255,0.92)" />
        <rect x="2" y="2" width="6" height="6" fill="#2F243A" />
        <rect x="14" y="2" width="6" height="6" fill="#2F243A" />
        <rect x="2" y="14" width="6" height="6" fill="#2F243A" />
        <rect x="10" y="10" width="3" height="3" fill="#2F243A" />
        <rect x="14" y="14" width="3" height="3" fill="#2F243A" />
        <rect x="10" y="16" width="3" height="3" fill="#2F243A" />
      </g>
      <!-- equipment ficha -->
      <rect x="33" y="8" width="24" height="24" rx="3" fill="rgba(255,255,255,0.06)" />
      <circle cx="40" cy="15" r="3.5" fill="rgba(43,187,146,0.7)" />
      <rect x="46" y="13" width="9" height="3" rx="1.5" fill="rgba(255,255,255,0.5)" />
      <rect x="36" y="22" width="18" height="2.5" rx="1" fill="rgba(255,255,255,0.18)" />
      <rect x="36" y="27" width="13" height="2.5" rx="1" fill="rgba(43,187,146,0.6)" />
    </svg>

    <!-- Costeo -->
    <svg v-else-if="kind === 'costeo'" viewBox="0 0 64 40" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="np-cost-g" x1="0" x2="0" y1="1" y2="0">
          <stop offset="0%" stop-color="#ef4444" />
          <stop offset="50%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#10b981" />
        </linearGradient>
      </defs>
      <rect width="64" height="40" rx="6" fill="#2F243A" />
      <!-- bars -->
      <g transform="translate(6 6)">
        <rect width="6" height="20" rx="2" y="8" fill="rgba(255,255,255,0.12)" />
        <rect width="6" height="14" rx="2" x="9" y="14" fill="rgba(43,187,146,0.55)" />
        <rect width="6" height="22" rx="2" x="18" y="6" fill="rgba(32,148,210,0.7)" />
        <rect width="6" height="10" rx="2" x="27" y="18" fill="rgba(255,255,255,0.18)" />
      </g>
      <!-- thermo -->
      <rect x="44" y="8" width="6" height="20" rx="3" fill="rgba(255,255,255,0.1)" />
      <rect x="44" y="14" width="6" height="14" rx="3" fill="url(#np-cost-g)" />
      <circle cx="47" cy="32" r="5" fill="#ef4444" />
      <circle cx="47" cy="32" r="3" fill="#fb923c" />
    </svg>

    <span class="np-badge"><i class="fa-solid fa-flask" /></span>
  </span>
</template>

<style scoped lang="scss">
.np {
  position: relative;
  display: inline-block;
  width: 56px;
  height: 36px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}
.np svg { width: 100%; height: 100%; display: block; }
.np-badge {
  position: absolute; right: 3px; bottom: 3px;
  width: 14px; height: 14px; border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b, #fb923c);
  color: white;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 0.45rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}
</style>
