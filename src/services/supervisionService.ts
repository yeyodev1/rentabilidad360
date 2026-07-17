import APIBase from './httpBase'

export type SupervisionTargetType = 'branch' | 'plant'
export type SupervisionAnswerStatus = 'si' | 'no' | 'no_aplica'

export interface SupervisionPlant {
  _id: string
  name: string
  address?: string
}

export interface SupervisionTemplateItem {
  key: string
  label: string
  helpText?: string
}

export interface SupervisionTemplateSection {
  key: string
  title: string
  items: SupervisionTemplateItem[]
}

export interface SupervisionTemplate {
  _id: string
  name: string
  description: string
  targetType: SupervisionTargetType
  frequency: string
  recommended: boolean
  sections: SupervisionTemplateSection[]
}

export interface SupervisionEvidence {
  url: string
  publicId: string
}

export interface SupervisionAnswer {
  itemKey: string
  status: SupervisionAnswerStatus
  observation?: string
}

export interface SupervisionSubmission {
  _id: string
  result: string
  score: number
  templateName: string
  targetName: string
  submittedBy?: { _id?: string; name?: string; email?: string } | string
  createdAt: string
  businessDate?: string
  targetType?: SupervisionTargetType
}

export interface SupervisionBootstrap {
  plants: SupervisionPlant[]
  templates: SupervisionTemplate[]
  submissions: SupervisionSubmission[]
}

export interface CreateSupervisionSubmissionPayload {
  templateId: string
  targetType: SupervisionTargetType
  branchId?: string
  plantId?: string
  businessDate: string
  header: {
    visitorName: string
    visitTime: string
    mileage?: number
    managerName?: string
    kitchenLeadName?: string
  }
  answers: SupervisionAnswer[]
  evidence: SupervisionEvidence[]
}

export interface SupervisionSubmissionFilters {
  branchId?: string
  plantId?: string
  limit?: number
}

class SupervisionService extends APIBase {
  async getBootstrap(branchId = '') {
    return this.get<SupervisionBootstrap>(`supervision/bootstrap?branchId=${encodeURIComponent(branchId)}`)
  }

  async createPlant(data: { name: string; address?: string }) {
    return this.post<SupervisionPlant>('supervision/plants', data)
  }

  async createSubmission(data: CreateSupervisionSubmissionPayload) {
    return this.post<SupervisionSubmission>('supervision/submissions', data)
  }

  async listSubmissions(filters: SupervisionSubmissionFilters = {}) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value))
    })
    const query = params.toString()
    return this.get<SupervisionSubmission[]>(`supervision/submissions${query ? `?${query}` : ''}`)
  }
}

export const supervisionService = new SupervisionService()
