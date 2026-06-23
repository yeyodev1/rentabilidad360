import APIBase from './httpBase'

export interface AdminStats {
  users: number
  companies: number
  analyses: number
  checklists: number
  maintenanceTickets: number
  ingredients: number
}

export interface AdminHistoryResponse {
  stats: AdminStats
  recentAnalyses: any[]
}

class AdminService extends APIBase {
  private base = 'admin'

  async getHistory(): Promise<{ data: AdminHistoryResponse }> {
    const res = await this.get<AdminHistoryResponse>(`${this.base}/history`)
    return { data: res.data }
  }

  async getAllUsers(): Promise<{ data: any[] }> {
    const res = await this.get<any[]>(`${this.base}/users`)
    return { data: res.data }
  }

  async triggerAlert(userId: string, subject: string, message: string): Promise<void> {
    await this.post(`${this.base}/alert`, { userId, subject, message })
  }

  async sendReminder(userId: string, subject: string, message: string, ctaLabel?: string, ctaLink?: string): Promise<void> {
    await this.post(`${this.base}/reminder`, { userId, subject, message, ctaLabel, ctaLink })
  }
}

export const adminService = new AdminService()
