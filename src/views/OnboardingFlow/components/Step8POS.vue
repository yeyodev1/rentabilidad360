<script setup lang="ts">
defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="ob-pos-container">
    <!-- Step Helper Info Banner -->
    <div class="flow-helper-banner">
      <div class="banner-intro">
        <div class="banner-icon-wrapper">
          <i class="fa-solid fa-plug-circle-bolt" />
        </div>
        <div class="banner-body">
          <div class="banner-title-row">
            <h4 class="banner-title">Conexión de Ventas y Facturación (POS)</h4>
            <span class="upcoming-badge">Próximamente</span>
          </div>
          <p class="banner-text">
            Estamos desarrollando integraciones automáticas con los puntos de venta más importantes del mercado. 
            Pronto podrás importar todas tus ventas del día con un solo clic.
          </p>
        </div>
      </div>
    </div>

    <!-- Integrations Grid (All set to Coming Soon / Próximamente) -->
    <div class="upcoming-integrations-card">
      <h5 class="showcase-title">
        <i class="fa-solid fa-circle-nodes" /> 
        Sistemas en Desarrollo de Integración
      </h5>
      
      <div class="integrations-showcase-grid">
        <!-- Clover -->
        <div class="integration-badge upcoming">
          <i class="fa-solid fa-clock-rotate-left" /> Clover <span class="soon-txt">(Pronto)</span>
        </div>
        <!-- Square -->
        <div class="integration-badge upcoming">
          <i class="fa-solid fa-clock-rotate-left" /> Square POS <span class="soon-txt">(Pronto)</span>
        </div>
        <!-- Tu Mesero -->
        <div class="integration-badge upcoming">
          <i class="fa-solid fa-clock-rotate-left" /> Tu Mesero <span class="soon-txt">(Pronto)</span>
        </div>
        <!-- Runfood -->
        <div class="integration-badge upcoming highlighted">
          <i class="fa-solid fa-clock-rotate-left" /> Runfood <span class="soon-txt">(Pronto)</span>
        </div>
        <!-- Contifico -->
        <div class="integration-badge upcoming highlighted">
          <i class="fa-solid fa-clock-rotate-left" /> Contifico <span class="soon-txt">(Pronto)</span>
        </div>
      </div>

      <div class="info-alert-box">
        <i class="fa-solid fa-circle-info info-alert-icon" />
        <div class="info-alert-text">
          <strong>¡No necesitas configurar nada ahora!</strong> 
          Por el momento, el módulo de ventas se cargará de forma manual o a través de plantillas de Excel sencillas. 
          Puedes hacer clic en <strong>Siguiente</strong> para continuar.
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ob-pos-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

/* Premium Info Banner */
.flow-helper-banner {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgba($primary, 0.05) 0%, rgba($secondary, 0.03) 100%);
  border: 1.5px solid rgba($primary, 0.12);
  border-radius: 18px;
  padding: 16px;
  gap: 16px;
  transition: all 0.3s ease;

  @media (min-width: 600px) {
    padding: 20px;
  }

  &:hover {
    border-color: rgba($primary, 0.25);
    box-shadow: 0 6px 18px rgba($primary, 0.05);
  }
}

.banner-intro {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.banner-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: white;
  border: 1px solid rgba($primary, 0.15);
  color: $primary;
  font-size: 1.05rem;
  box-shadow: 0 4px 8px rgba($primary, 0.05);
  flex-shrink: 0;
}

.banner-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-grow: 1;
}

.banner-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.banner-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: $primary-dark;
}

.upcoming-badge {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  background: rgba($secondary, 0.08);
  color: $secondary;
  padding: 2px 8px;
  border-radius: 99px;
  letter-spacing: 0.5px;
}

.banner-text {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: $text-secondary;
}

/* Showcase Card */
.upcoming-integrations-card {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 24px;
  padding: 16px;
  gap: 20px;
  box-shadow: 0 10px 30px rgba($primary-dark, 0.02);

  @media (min-width: 600px) {
    padding: 24px;
  }
}

.showcase-title {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 800;
  color: $primary-dark;
  display: flex;
  align-items: center;
  gap: 8px;

  i {
    color: $primary;
  }
}

.integrations-showcase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

.integration-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 16px 12px;
  border-radius: 14px;
  border: 1.5px dashed rgba($primary-dark, 0.08);
  background: #fafbfc;
  color: $text-secondary;
  text-align: center;
  transition: all 0.2s ease;

  i {
    font-size: 1rem;
    color: rgba($primary-dark, 0.25);
  }

  .soon-txt {
    font-size: 0.65rem;
    font-weight: 600;
    color: $primary;
    background: rgba($primary, 0.05);
    padding: 1px 6px;
    border-radius: 99px;
    margin-top: 2px;
  }

  &.highlighted {
    border-color: rgba($primary, 0.2);
    background: rgba($primary, 0.01);
    
    i {
      color: $primary;
    }
  }

  &:hover {
    transform: translateY(-2px);
    border-color: $primary;
    background: white;
    box-shadow: 0 4px 12px rgba($primary, 0.05);
  }
}

/* Info Alert Box */
.info-alert-box {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: rgba($primary, 0.03);
  border: 1px solid rgba($primary, 0.1);
  border-radius: 14px;
  padding: 12px 14px;
}

.info-alert-icon {
  color: $primary;
  font-size: 0.95rem;
  margin-top: 2px;
  flex-shrink: 0;
}

.info-alert-text {
  font-size: 0.78rem;
  line-height: 1.45;
  color: $primary-dark;

  strong {
    font-weight: 800;
  }
}
</style>
