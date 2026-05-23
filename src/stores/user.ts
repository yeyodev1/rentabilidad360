import { defineStore } from 'pinia'

export interface UserState {
  id: string | null
  name: string | null
  email: string | null
  isAuthenticated: boolean
}

const USER_KEY = 'rentabilidad360_user'

function loadUser(): Partial<UserState> {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    id: null,
    name: null,
    email: null,
    isAuthenticated: false,
  }),

  actions: {
    hydrate() {
      const token = localStorage.getItem('access_token')
      const stored = loadUser()
      this.id = stored.id ?? null
      this.name = stored.name ?? null
      this.email = stored.email ?? null
      this.isAuthenticated = !!token
    },

    setUser(payload: { id?: string; name?: string; email?: string }) {
      if (payload.id !== undefined) this.id = payload.id
      if (payload.name !== undefined) this.name = payload.name
      if (payload.email !== undefined) this.email = payload.email
      this.isAuthenticated = true
      try {
        localStorage.setItem(USER_KEY, JSON.stringify({ id: this.id, name: this.name, email: this.email }))
      } catch { /* ignore */ }
    },

    clear() {
      this.id = null
      this.name = null
      this.email = null
      this.isAuthenticated = false
      try {
        localStorage.removeItem('access_token')
        localStorage.removeItem(USER_KEY)
      } catch { /* ignore */ }
    },
  },
})
