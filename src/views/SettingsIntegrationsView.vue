<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppShell from '@/layout/AppShell.vue'
import { posService, type POSConnectionData } from '@/services/posService'

const connections = ref<POSConnectionData[]>([])
const loading = ref(false)
const errorMsg = ref('')

const showFudoModal = ref(false)
const fudoApiKey = ref('')

const availablePos = [
  { id: 'fudo', name: 'Fudo', logo: 'fa-solid fa-store', desc: 'Sincroniza tus ventas y comandas automáticamente desde Fudo.' },
  { id: 'toteat', name: 'Toteat', logo: 'fa-solid fa-utensils', desc: 'Integración completa con Toteat (Próximamente)', disabled: true },
  { id: 'siigo', name: 'Siigo POS', logo: 'fa-solid fa-cash-register', desc: 'Facturación y ventas desde Siigo (Próximamente)', disabled: true }
]

async function loadConnections() {
  try {
    const res = await posService.getConnections()
    connections.value = res.data as any
  } catch (err) {
    console.error('Error fetching POS connections', err)
  }
}

async function connectFudo() {
  errorMsg.value = ''
  if (!fudoApiKey.value) {
    errorMsg.value = 'Debes ingresar un API Key válido.'
    return
  }

  loading.value = true
  try {
    await posService.createConnection({
      provider: 'fudo',
      apiKey: fudoApiKey.value
    })
    showFudoModal.value = false
    fudoApiKey.value = ''
    await loadConnections()
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || 'Error al conectar'
  } finally {
    loading.value = false
  }
}

async function removeConnection(id: string) {
  if (!confirm('¿Estás seguro de que deseas desconectar este POS? Perderás la sincronización de ventas automáticas.')) return
  try {
    await posService.deleteConnection(id)
    await loadConnections()
  } catch (err) {
    console.error(err)
  }
}

function isConnected(provider: string) {
  return connections.value.some(c => c.provider === provider)
}

onMounted(() => {
  document.title = 'Integraciones POS · Rentabilidad360'
  loadConnections()
})
</script>

<template>
  <AppShell>
    <div class="mod">
      <header class="mod-top">
        <div class="mod-head">
          <h1 class="mod-title"><i class="fa-solid fa-plug" /> Integraciones POS</h1>
          <p class="mod-sub">Conecta tu Punto de Venta para sincronizar tus ventas, tickets y rentabilidad automáticamente.</p>
        </div>
      </header>

      <div class="grid">
        <section class="card edu-card">
          <header class="card-head">
            <span class="card-chip"><i class="fa-solid fa-lightbulb" /> ¿Por qué conectar tu POS?</span>
          </header>
          <div class="edu-body">
            <div class="edu-item">
              <i class="fa-solid fa-bolt" />
              <div>
                <strong>Automatización Total</strong>
                <p>Las ventas se registran en Rentabilidad360 sin digitación manual.</p>
              </div>
            </div>
            <div class="edu-item">
              <i class="fa-solid fa-chart-line" />
              <div>
                <strong>Márgenes en Tiempo Real</strong>
                <p>Cruza tus ventas reales con tus recetas costeadas al instante.</p>
              </div>
            </div>
          </div>
        </section>

        <section class="card">
          <h3 class="card-title">Proveedores Compatibles</h3>
          <div class="pos-grid">
            <div v-for="pos in availablePos" :key="pos.id" :class="['pos-card', { disabled: pos.disabled, active: isConnected(pos.id) }]">
              <div class="pos-header">
                <div class="pos-logo">
                  <i :class="pos.logo" />
                </div>
                <span v-if="isConnected(pos.id)" class="status-badge connected"><i class="fa-solid fa-check" /> Conectado</span>
                <span v-else-if="pos.disabled" class="status-badge soon">Pronto</span>
              </div>
              <h4>{{ pos.name }}</h4>
              <p>{{ pos.desc }}</p>
              
              <button v-if="isConnected(pos.id)" class="btn pos-btn danger" @click="removeConnection(connections.find(c => c.provider === pos.id)!._id!)">
                Desconectar
              </button>
              <button v-else :disabled="pos.disabled" class="btn pos-btn primary" @click="pos.id === 'fudo' ? showFudoModal = true : null">
                Conectar
              </button>
            </div>
          </div>
        </section>
      </div>

      <!-- Fudo Modal -->
      <div v-if="showFudoModal" class="modal-back" @click.self="showFudoModal = false">
        <div class="modal">
          <header class="modal-head">
            <h3 class="modal-title"><i class="fa-solid fa-plug" /> Conectar Fudo</h3>
            <button class="close-btn" @click="showFudoModal = false"><i class="fa-solid fa-xmark" /></button>
          </header>
          
          <div class="modal-body">
            <p>Ingresa el API Key proporcionado por Fudo en tu panel de administración.</p>
            <label class="field">
              <span>API Key de Fudo</span>
              <input v-model="fudoApiKey" type="password" placeholder="Ej: sk_live_12345abcdef" />
            </label>
            <div v-if="errorMsg" class="error-msg"><i class="fa-solid fa-circle-exclamation" /> {{ errorMsg }}</div>
          </div>

          <footer class="modal-foot">
            <button class="btn ghost" @click="showFudoModal = false">Cancelar</button>
            <button class="btn primary" :disabled="loading" @click="connectFudo">
              <i class="fa-solid fa-link" /> {{ loading ? 'Conectando...' : 'Conectar' }}
            </button>
          </footer>
        </div>
      </div>

    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.mod { padding: 0 0 60px; font-family: $font-principal; }
.mod-top { padding: 32px 32px 24px; }
.mod-title { margin: 0; font-size: 1.6rem; font-weight: 800; color: $primary-dark; display: flex; align-items: center; gap: 12px; }
.mod-sub { color: $text-secondary; font-size: 0.95rem; margin: 8px 0 0; }

.grid { padding: 0 32px; display: flex; flex-direction: column; gap: 24px; }
.card { background: white; border-radius: 24px; padding: 24px; box-shadow: 0 12px 36px rgba($primary-dark, 0.04); border: 1px solid rgba($primary-dark, 0.08); }
.card-title { margin: 0 0 20px; font-size: 1.2rem; font-weight: 800; color: $primary-dark; }
.card-chip { display: inline-flex; align-items: center; gap: 6px; background: rgba($primary, 0.1); color: $primary; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; margin-bottom: 16px; }

.edu-card { background: linear-gradient(135deg, rgba($primary, 0.05), white); border-color: rgba($primary, 0.2); }
.edu-body { display: grid; gap: 16px; grid-template-columns: 1fr; @media (min-width: 600px) { grid-template-columns: 1fr 1fr; } }
.edu-item { display: flex; gap: 16px; align-items: flex-start; i { font-size: 1.5rem; color: $primary; background: white; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 14px; box-shadow: 0 4px 12px rgba($primary, 0.1); } strong { font-size: 1rem; color: $primary-dark; display: block; margin-bottom: 4px; } p { margin: 0; font-size: 0.85rem; color: $text-secondary; line-height: 1.4; } }

.pos-grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
.pos-card { border: 1.5px solid rgba($primary-dark, 0.1); border-radius: 20px; padding: 20px; background: #f8fafc; transition: all 0.2s; display: flex; flex-direction: column; gap: 12px;
  &:not(.disabled):hover { border-color: $primary; transform: translateY(-2px); box-shadow: 0 8px 24px rgba($primary, 0.1); }
  &.disabled { opacity: 0.6; }
  &.active { border-color: $alert-success; background: linear-gradient(135deg, rgba($alert-success, 0.05), white); }
  h4 { margin: 0; font-size: 1.1rem; color: $primary-dark; }
  p { margin: 0; font-size: 0.85rem; color: $text-secondary; flex: 1; }
}
.pos-header { display: flex; justify-content: space-between; align-items: flex-start; }
.pos-logo { width: 56px; height: 56px; background: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; color: $primary-dark; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.status-badge { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; &.soon { background: rgba($primary-dark, 0.1); color: $text-secondary; } &.connected { background: rgba($alert-success, 0.1); color: darken($alert-success, 10%); display: flex; align-items: center; gap: 4px; } }

.btn { padding: 12px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; font-family: $font-principal; font-size: 0.95rem; border: none; transition: all 0.2s;
  &.primary { background: $primary; color: white; &:hover:not(:disabled) { box-shadow: 0 6px 16px rgba($primary, 0.3); } }
  &.danger { background: rgba($alert-error, 0.1); color: $alert-error; &:hover:not(:disabled) { background: $alert-error; color: white; } }
  &.ghost { background: transparent; color: $primary-dark; &:hover { background: rgba($primary-dark, 0.05); } }
  &:disabled { opacity: 0.7; cursor: not-allowed; }
}
.pos-btn { width: 100%; margin-top: auto; }

.modal-back { position: fixed; inset: 0; z-index: 100; background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 24px; }
.modal { width: 100%; max-width: 440px; background: white; border-radius: 22px; padding: 24px; display: flex; flex-direction: column; gap: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
.modal-head { display: flex; justify-content: space-between; align-items: center; }
.modal-title { margin: 0; font-size: 1.2rem; font-weight: 800; color: $primary-dark; display: flex; align-items: center; gap: 8px; i { color: $primary; } }
.close-btn { width: 32px; height: 32px; border-radius: 10px; border: none; background: rgba($primary-dark, 0.05); cursor: pointer; &:hover { background: rgba($primary-dark, 0.1); } }
.modal-body { display: flex; flex-direction: column; gap: 16px; p { margin: 0; font-size: 0.9rem; color: $text-secondary; } }
.field { display: flex; flex-direction: column; gap: 6px; span { font-size: 0.8rem; font-weight: 700; color: $text-secondary; } input { padding: 12px; border-radius: 12px; border: 1.5px solid rgba($primary-dark, 0.1); background: #f8fafc; font-family: $font-principal; font-size: 0.95rem; color: $primary-dark; &:focus { outline: none; border-color: $primary; background: white; } } }
.error-msg { font-size: 0.85rem; color: $alert-error; display: flex; align-items: center; gap: 6px; }
.modal-foot { display: flex; justify-content: flex-end; gap: 10px; }
</style>
