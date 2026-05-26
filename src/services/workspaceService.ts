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

class WorkspaceService extends APIBase {
  async getWorkspaces() {
    return this.get<{ workspaces: WorkspaceInfo[]; count: number }>('workspace')
  }

  async getCurrentWorkspace() {
    return this.get<{ workspace: WorkspaceInfo | null }>('workspace/current')
  }
}

export const workspaceService = new WorkspaceService()
