import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export interface AnalysisResults {
  monthlySales: number
  variableCost: number
  fixedCost: number
  ebitda: number
  profitMargin: number
  breakEvenClients: number
  healthStatus: 'green' | 'yellow' | 'red'
  diagnosis: string
}

export type CurrencyCode = 'USD' | 'MXN' | 'EUR' | 'COP'

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  MXN: 'MX$',
  EUR: '€',
  COP: 'COL$',
}

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code as CurrencyCode] || '$'
}

export type PainPointId = 'maintenance' | 'costing'

export interface PainPoint {
  id: PainPointId
  title: string
  description: string
  icon: string
  route: string
  ctaLabel: string
}

export const PAIN_POINTS: PainPoint[] = [
  {
    id: 'costing',
    title: 'Costos y Precios',
    description: 'No sé el costo real de mis platos ni a qué precio debería venderlos para tener finanzas sanas.',
    icon: 'fa-solid fa-sack-dollar',
    route: '/modulo/costeo',
    ctaLabel: 'Costeo de Platos',
  },
  {
    id: 'maintenance',
    title: 'Mantenimiento y Equipos',
    description: 'Las máquinas se dañan sin aviso y no tengo un historial rápido de su mantenimiento.',
    icon: 'fa-solid fa-screwdriver-wrench',
    route: '/modulo/mantenimiento',
    ctaLabel: 'Mantenimiento Pro',
  },
]

export interface Tienda {
  id: string
  name: string
  businessType: string | null
  address: string
  city: string
  manager: string
  phone: string
  status: 'active' | 'paused' | 'opening'
  staff: number
  monthlyClients: number
  notes: string
  createdAt: string
  isMain: boolean
}

const STORAGE_KEY = 'rentabilidad360_onboarding'

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return null
}

function saveState(state: Record<string, unknown>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}

function makeId(): string {
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function defaultTienda(name: string, businessType: string | null): Tienda {
  return {
    id: makeId(),
    name: name || 'Sucursal Principal',
    businessType,
    address: '',
    city: '',
    manager: '',
    phone: '',
    status: 'active',
    staff: 6,
    monthlyClients: 1200,
    notes: '',
    createdAt: new Date().toISOString(),
    isMain: true,
  }
}

export const useOnboardingStore = defineStore('onboarding', () => {
  const saved = loadState()

  const projectName = ref(saved?.projectName ?? '')
  const businessType = ref<string | null>(saved?.businessType ?? null)
  const painPoints = ref<PainPointId[]>(Array.isArray(saved?.painPoints) ? saved.painPoints : [])
  const currency = ref<CurrencyCode>(saved?.currency ?? 'USD')
  const investment = ref(saved?.investment ?? 15000)
  const avgPrice = ref<number | null>(saved?.avgPrice ?? null)
  const monthlyClients = ref<number | null>(saved?.monthlyClients ?? null)
  const rawMaterialPercent = ref(saved?.rawMaterialPercent ?? 30)
  const monthlyRent = ref<number | null>(saved?.monthlyRent ?? null)
  const diagnostics = ref<Record<string, AnalysisResults>>(
    saved?.diagnostics && typeof saved.diagnostics === 'object' ? saved.diagnostics : {},
  )
  // Legacy single-result migration
  if (saved?.results && !Object.keys(diagnostics.value).length) {
    diagnostics.value['__legacy__'] = saved.results
  }
  const currentStep = ref(saved?.currentStep ?? 1)
  const showDashboard = ref(saved?.showDashboard ?? false)

  const tiendas = ref<Tienda[]>(Array.isArray(saved?.tiendas) ? saved.tiendas : [])
  const activeTiendaId = ref<string | null>(saved?.activeTiendaId ?? null)

  function ensureMainTienda() {
    if (tiendas.value.length === 0) {
      const main = defaultTienda(projectName.value || 'Sucursal Principal', businessType.value)
      tiendas.value.push(main)
      activeTiendaId.value = main.id
      // Migrate legacy diagnostic into the first tienda
      if (diagnostics.value['__legacy__']) {
        diagnostics.value = {
          ...diagnostics.value,
          [main.id]: diagnostics.value['__legacy__'],
        }
        const { __legacy__, ...rest } = diagnostics.value
        void __legacy__
        diagnostics.value = rest
      }
    } else if (!activeTiendaId.value || !tiendas.value.find((t) => t.id === activeTiendaId.value)) {
      activeTiendaId.value = tiendas.value[0]?.id ?? null
    }
  }

  const activeTienda = computed<Tienda | null>(() =>
    tiendas.value.find((t) => t.id === activeTiendaId.value) ?? tiendas.value[0] ?? null,
  )

  const results = computed<AnalysisResults | null>(() => {
    if (activeTienda.value && diagnostics.value[activeTienda.value.id]) {
      return diagnostics.value[activeTienda.value.id]!
    }
    if (diagnostics.value['__legacy__']) return diagnostics.value['__legacy__']!
    return null
  })

  const hasAnyDiagnostic = computed(() => Object.keys(diagnostics.value).length > 0)

  const diagnosedTiendaIds = computed(() => Object.keys(diagnostics.value).filter((k) => k !== '__legacy__'))

  function addTienda(partial?: Partial<Tienda>): Tienda {
    const t: Tienda = {
      id: makeId(),
      name: partial?.name || `Sucursal ${tiendas.value.length + 1}`,
      businessType: partial?.businessType ?? businessType.value,
      address: partial?.address ?? '',
      city: partial?.city ?? '',
      manager: partial?.manager ?? '',
      phone: partial?.phone ?? '',
      status: partial?.status ?? 'opening',
      staff: partial?.staff ?? 4,
      monthlyClients: partial?.monthlyClients ?? 800,
      notes: partial?.notes ?? '',
      createdAt: new Date().toISOString(),
      isMain: false,
    }
    tiendas.value.push(t)
    activeTiendaId.value = t.id
    return t
  }

  function updateTienda(id: string, patch: Partial<Tienda>) {
    const idx = tiendas.value.findIndex((t) => t.id === id)
    if (idx < 0) return
    tiendas.value[idx] = { ...tiendas.value[idx]!, ...patch, id: tiendas.value[idx]!.id } as Tienda
  }

  function removeTienda(id: string) {
    if (tiendas.value.length <= 1) return false
    const t = tiendas.value.find((x) => x.id === id)
    if (!t) return false
    tiendas.value = tiendas.value.filter((x) => x.id !== id)
    if (activeTiendaId.value === id) {
      activeTiendaId.value = tiendas.value[0]?.id ?? null
    }
    if (t.isMain && tiendas.value[0]) {
      tiendas.value[0].isMain = true
    }
    return true
  }

  function setActiveTienda(id: string) {
    if (tiendas.value.find((t) => t.id === id)) {
      activeTiendaId.value = id
    }
  }

  const canProceedStep1 = computed(() => projectName.value.trim().length > 0 && businessType.value !== null)
  const painStepComplete = computed(() => painPoints.value.length > 0)

  const estimatedSales = computed(() => {
    if (avgPrice.value && monthlyClients.value) {
      return avgPrice.value * monthlyClients.value
    }
    return null
  })

  const step2Complete = computed(() => investment.value >= 0)
  const step3Complete = computed(() => avgPrice.value !== null && avgPrice.value > 0 && monthlyClients.value !== null && monthlyClients.value > 0)
  const step4Complete = computed(() => monthlyRent.value !== null && monthlyRent.value > 0)

  const currencySymbol = computed(() => getCurrencySymbol(currency.value))

  const primaryPain = computed<PainPoint | null>(() => {
    if (!painPoints.value.length) return null
    const first = painPoints.value[0]
    return PAIN_POINTS.find((p) => p.id === first) ?? null
  })

  function togglePain(id: PainPointId) {
    const idx = painPoints.value.indexOf(id)
    if (idx >= 0) painPoints.value.splice(idx, 1)
    else painPoints.value.push(id)
  }

  function calculate(): AnalysisResults {
    const price = avgPrice.value!
    const clients = monthlyClients.value!
    const matPct = rawMaterialPercent.value
    const rent = monthlyRent.value!

    const monthlySales = price * clients
    const variableCost = monthlySales * (matPct / 100)
    const fixedCost = rent
    const ebitda = monthlySales - variableCost - fixedCost
    const profitMargin = monthlySales > 0 ? (ebitda / monthlySales) * 100 : 0

    const vcPerUnit = price * (matPct / 100)
    const cm = price - vcPerUnit
    const breakEven = cm > 0 ? Math.ceil(rent / cm) : Infinity

    let healthStatus: 'green' | 'yellow' | 'red'
    let diagnosis: string

    if (profitMargin >= 20) {
      healthStatus = 'green'
      diagnosis = '¡EBITDA Saludable detectado! Tu negocio tiene un margen sólido y capacidad de crecimiento.'
    } else if (profitMargin >= 0) {
      healthStatus = 'yellow'
      diagnosis = 'Riesgo financiero: Tus costos fijos son muy altos para el volumen de ventas proyectado. Revisa tu estructura de costos.'
    } else {
      healthStatus = 'red'
      diagnosis = 'Tu negocio no es rentable con los costos actuales. Necesitas aumentar precios, reducir costos o mejorar el volumen de ventas.'
    }

    return {
      monthlySales: Math.round(monthlySales * 100) / 100,
      variableCost: Math.round(variableCost * 100) / 100,
      fixedCost: Math.round(fixedCost * 100) / 100,
      ebitda: Math.round(ebitda * 100) / 100,
      profitMargin: Math.round(profitMargin * 100) / 100,
      breakEvenClients: breakEven === Infinity ? 0 : Math.round(breakEven),
      healthStatus,
      diagnosis,
    }
  }

  function goToStep(step: number) {
    currentStep.value = step
  }

  function showLoading() {
    showDashboard.value = true
  }

  function generateDiagnosis() {
    ensureMainTienda()
    const r = calculate()
    const tienda = activeTienda.value
    if (tienda) {
      diagnostics.value = { ...diagnostics.value, [tienda.id]: r }
    } else {
      diagnostics.value = { ...diagnostics.value, __legacy__: r }
    }
  }

  function reset() {
    projectName.value = ''
    businessType.value = null
    painPoints.value = []
    currency.value = 'USD'
    investment.value = 15000
    avgPrice.value = null
    monthlyClients.value = null
    rawMaterialPercent.value = 30
    monthlyRent.value = null
    diagnostics.value = {}
    currentStep.value = 1
    showDashboard.value = false
    tiendas.value = []
    activeTiendaId.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  function resetDiagnosticForActive() {
    const tienda = activeTienda.value
    if (!tienda) return
    const next = { ...diagnostics.value }
    delete next[tienda.id]
    diagnostics.value = next
    currentStep.value = 1
    showDashboard.value = false
  }

  // Bootstrap default tienda if data exists already
  if (saved?.projectName && tiendas.value.length === 0) {
    ensureMainTienda()
  }

  watch(
    () => ({
      projectName: projectName.value,
      businessType: businessType.value,
      painPoints: painPoints.value,
      currency: currency.value,
      investment: investment.value,
      avgPrice: avgPrice.value,
      monthlyClients: monthlyClients.value,
      rawMaterialPercent: rawMaterialPercent.value,
      monthlyRent: monthlyRent.value,
      currentStep: currentStep.value,
      showDashboard: showDashboard.value,
      tiendas: tiendas.value,
      activeTiendaId: activeTiendaId.value,
      diagnostics: diagnostics.value,
    }),
    (state) => saveState(state),
    { deep: true }
  )

  return {
    projectName,
    businessType,
    painPoints,
    primaryPain,
    togglePain,
    painStepComplete,
    currency,
    currencySymbol,
    investment,
    avgPrice,
    monthlyClients,
    rawMaterialPercent,
    monthlyRent,
    diagnostics,
    results,
    hasAnyDiagnostic,
    diagnosedTiendaIds,
    resetDiagnosticForActive,
    currentStep,
    showDashboard,
    canProceedStep1,
    estimatedSales,
    step2Complete,
    step3Complete,
    step4Complete,
    tiendas,
    activeTiendaId,
    activeTienda,
    ensureMainTienda,
    addTienda,
    updateTienda,
    removeTienda,
    setActiveTienda,
    calculate,
    goToStep,
    showLoading,
    generateDiagnosis,
    reset,
  }
})
