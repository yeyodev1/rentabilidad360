import APIBase from './httpBase'

interface BranchInfo {
  id: string
  name: string
  address: string
  phone: string
  isMain: boolean
}

interface WorkspaceInfo {
  id: string
  legalName: string
  commercialName?: string
  ruc: string
  country?: string
  city?: string
  onboardingCompleted: boolean
  branches: BranchInfo[]
}

export interface WorkspaceMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'supervisor' | 'operador'
  isVerified: boolean
  isOwner: boolean
  createdAt: string
}

class WorkspaceService extends APIBase {
  async getWorkspaces() {
    return this.get<{ workspaces: WorkspaceInfo[]; count: number }>('workspace')
  }

  async getCurrentWorkspace() {
    return this.get<{ workspace: WorkspaceInfo | null }>('workspace/current')
  }

  async listMembers() {
    return this.get<{ members: WorkspaceMember[] }>('workspace/current/members')
  }

  async createMember(data: { name: string; email: string; password: string; role: 'supervisor' | 'operador' }) {
    return this.post<{ member: WorkspaceMember }>('workspace/current/members', data)
  }

  async updateMemberRole(memberId: string, role: 'supervisor' | 'operador') {
    return this.patch<{ member: WorkspaceMember }>(`workspace/current/members/${memberId}`, { role })
  }

  async removeMember(memberId: string) {
    return this.delete(`workspace/current/members/${memberId}`)
  }
}

export const workspaceService = new WorkspaceService()
