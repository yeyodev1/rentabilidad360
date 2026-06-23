import { defineStore } from 'pinia'
import { workspaceService } from '@/services/workspaceService'

export interface BranchInfo {
  id: string
  name: string
  address: string
  phone: string
  isMain: boolean
}

export interface UserState {
  id: string | null
  name: string | null
  email: string | null
  isAuthenticated: boolean
  workspaceIds: string[]
  workspaceName: string | null
  workspaceRuc: string | null
  branches: BranchInfo[]
}

const USER_KEY = 'rentabilidad360_user'
const WORKSPACE_KEY = 'rentabilidad360_workspace'

function loadUser(): Partial<UserState> {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function loadWorkspace(): { workspaceName?: string; branches?: BranchInfo[] } {
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY)
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
    workspaceIds: [],
    workspaceName: null,
    workspaceRuc: null,
    branches: [],
  }),

  getters: {
    hasWorkspace: (state) => state.workspaceIds.length > 0,
    workspaceBranchCount: (state) => state.branches.length,
    mainBranch: (state) => state.branches.find((b) => b.isMain) || state.branches[0] || null,
  },

  actions: {
    hydrate() {
      const token = localStorage.getItem('access_token')
      const stored = loadUser()
      const ws = loadWorkspace()
      this.id = stored.id ?? null
      this.name = stored.name ?? null
      this.email = stored.email ?? null
      this.workspaceIds = stored.workspaceIds ?? []
      this.workspaceName = ws.workspaceName ?? null
      this.branches = ws.branches ?? []
      this.isAuthenticated = !!token
    },

    setUser(payload: { id?: string; name?: string; email?: string; workspaceIds?: string[] }) {
      if (payload.id !== undefined) this.id = payload.id
      if (payload.name !== undefined) this.name = payload.name
      if (payload.email !== undefined) this.email = payload.email
      if (payload.workspaceIds !== undefined) this.workspaceIds = payload.workspaceIds
      this.isAuthenticated = true
      try {
        localStorage.setItem(USER_KEY, JSON.stringify({ id: this.id, name: this.name, email: this.email, workspaceIds: this.workspaceIds }))
      } catch { /* ignore */ }
      if (payload.workspaceIds?.length) this.fetchWorkspace()
    },

    async fetchWorkspace() {
      try {
        const res = await workspaceService.getCurrentWorkspace()
        const ws = res.data.workspace
        if (ws) {
          this.workspaceName = ws.commercialName || ws.legalName
          this.workspaceRuc = ws.ruc
          this.branches = ws.branches || []
          try {
            localStorage.setItem(WORKSPACE_KEY, JSON.stringify({ workspaceName: this.workspaceName, branches: this.branches }))
          } catch { /* noop */ }
        }
      } catch { /* noop */ }
    },

    clear() {
      this.id = null
      this.name = null
      this.email = null
      this.workspaceIds = []
      this.workspaceName = null
      this.workspaceRuc = null
      this.branches = []
      this.isAuthenticated = false
      try {
        localStorage.removeItem('access_token')
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(WORKSPACE_KEY)
      } catch { /* ignore */ }
    },
  },
})
