import APIBase from './httpBase'

interface ChecklistField {
  label: string
  type: 'checkbox' | 'slider' | 'text' | 'number' | 'photo'
  required: boolean
  order: number
}

interface ChecklistTemplate {
  _id: string
  name: string
  category: string
  description?: string
  fields: ChecklistField[]
  isActive: boolean
}

class ChecklistService extends APIBase {
  async listTemplates(category?: string) {
    const params = category ? `?category=${category}` : ''
    return this.get<ChecklistTemplate[]>(`checklists/templates${params}`)
  }

  async createTemplate(data: { name: string; category: string; description?: string; fields: ChecklistField[] }) {
    return this.post('checklists/templates', data)
  }

  async updateTemplate(id: string, data: Partial<ChecklistTemplate>) {
    return this.put(`checklists/templates/${id}`, data)
  }

  async deleteTemplate(id: string) {
    return this.delete(`checklists/templates/${id}`)
  }

  async createInstance(templateId: string, branchId: string) {
    return this.post('checklists/instances', { templateId, branchId })
  }

  async submitChecklist(id: string, responses: Record<string, unknown>, photoUrl?: string) {
    return this.patch(`checklists/instances/${id}/submit`, { responses, photoUrl })
  }

  async reviewChecklist(id: string, comments: string, approved: boolean) {
    return this.patch(`checklists/instances/${id}/review`, { comments, approved })
  }

  async getDailyChecklists(branchId?: string) {
    const params = branchId ? `?branchId=${branchId}` : ''
    return this.get(`checklists/daily${params}`)
  }

  async getPendingReviews(branchId?: string) {
    const params = branchId ? `?branchId=${branchId}` : ''
    return this.get(`checklists/pending-reviews${params}`)
  }

  async downloadPDF(id: string) {
    return this.get(`checklists/instances/${id}/pdf`, undefined, { responseType: 'blob' })
  }

  async uploadPhotoOCR(file: File) {
    const formData = new FormData()
    formData.append('photo', file)
    return this.post('checklists/ocr-upload', formData)
  }
}

export const checklistService = new ChecklistService()
