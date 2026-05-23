import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: 'Rentabilidad360 — Diagnóstico para restaurantes' },
  },
  {
    path: '/diagnostico',
    name: 'Onboarding',
    component: () => import('../views/OnboardingFlow.vue'),
    meta: { title: 'Diagnóstico · Rentabilidad360' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: 'Iniciar sesión · Rentabilidad360' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { title: 'Crear cuenta · Rentabilidad360' },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { title: 'Diagnóstico · Rentabilidad360' },
  },
  {
    path: '/modulos',
    name: 'Modules',
    component: () => import('../views/ModulesHubView.vue'),
    meta: { title: 'Mis módulos · Rentabilidad360', requiresAuth: true },
  },
  {
    path: '/configuracion/workspace',
    name: 'Workspace',
    component: () => import('../views/WorkspaceView.vue'),
    meta: { title: 'Workspace · Rentabilidad360' },
  },
  {
    path: '/modulo/sanitario',
    name: 'ModuleSanitary',
    component: () => import('../views/SanitaryControlView.vue'),
    meta: { title: 'Control Sanitario · Rentabilidad360' },
  },
  {
    path: '/modulo/mantenimiento',
    name: 'ModuleMaintenance',
    component: () => import('../views/MaintenanceView.vue'),
    meta: { title: 'Mantenimiento Pro · Rentabilidad360' },
  },
  {
    path: '/modulo/costeo',
    name: 'ModuleCosting',
    component: () => import('../views/CostingView.vue'),
    meta: { title: 'Costeo de Recetas · Rentabilidad360' },
  },
  {
    path: '/modulo/horarios',
    name: 'ModuleSchedule',
    component: () => import('../views/ScheduleView.vue'),
    meta: { title: 'Optimización de Turnos · Rentabilidad360' },
  },
  {
    path: '/:catchAll(.*)',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { left: 0, top: 0, behavior: 'smooth' }
  },
})

router.beforeEach((to, _from, next) => {
  if (to.meta?.title && typeof to.meta.title === 'string') {
    document.title = to.meta.title
  }
  if (to.meta?.requiresAuth) {
    const token = localStorage.getItem('access_token')
    if (!token) {
      next({ name: 'Login', query: { next: to.fullPath } })
      return
    }
  }
  next()
})

export default router
