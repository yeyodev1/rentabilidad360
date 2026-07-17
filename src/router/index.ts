import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: 'Allio — Costeo y mantenimiento para restaurantes' },
  },
  {
    path: '/diagnostico',
    redirect: '/onboarding',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: 'Iniciar sesión · Allio' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { title: 'Crear cuenta · Allio' },
  },
  {
    path: '/verify',
    name: 'Verify',
    component: () => import('../views/VerifyView.vue'),
    meta: { title: 'Verificar correo · Allio' },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/InicioView.vue'),
    meta: { title: 'Inicio · Allio', requiresAuth: true },
  },
  {
    path: '/modulos',
    redirect: '/dashboard',
  },
  {
    path: '/configuracion/workspace',
    name: 'Workspace',
    component: () => import('../views/WorkspaceView.vue'),
    meta: { title: 'Workspace · Allio', requiresAuth: true, adminOnly: true },
  },
  {
    path: '/modulo/mantenimiento',
    name: 'ModuleMaintenance',
    component: () => import('../views/MaintenanceView.vue'),
    meta: { title: 'Mantenimiento Pro · Allio', requiresAuth: true },
  },
  {
    path: '/modulo/costeo',
    name: 'ModuleCosting',
    component: () => import('../views/CostingView.vue'),
    meta: { title: 'Costeo de Recetas · Allio', requiresAuth: true, adminOnly: true },
  },
  {
    path: '/modulo/supervision',
    name: 'ModuleSupervision',
    component: () => import('../views/SupervisionView.vue'),
    meta: { title: 'Supervisión · Allio', requiresAuth: true },
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('../views/OnboardingFlow/index.vue'),
    meta: { title: 'Configuración · Allio', requiresAuth: true, adminOnly: true },
  },
  {
    path: '/modulo/mantenimiento/:id',
    name: 'MaintenanceDetail',
    component: () => import('../views/MaintenanceDetailView.vue'),
    meta: { title: 'Ficha de Equipo · Allio' },
  },
  {
    path: '/:pathMatch(.*)*',
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
  if (to.meta?.adminOnly && localStorage.getItem('user_role') !== 'admin') {
    next('/modulo/mantenimiento')
    return
  }
  next()
})

export default router
