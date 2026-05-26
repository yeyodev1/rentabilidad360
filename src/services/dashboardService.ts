import APIBase from './httpBase'

export interface KpiData {
  todaySales: number
  estimatedProfit: number
  averageTicket: number
  breakEven: { units: number; currency: number }
  arcsaStatus: 'green' | 'yellow' | 'red'
  criticalEquipment: number
  weakHours: string[]
}

export interface CriticalAlert {
  type: 'checklist' | 'maintenance' | 'margin' | 'weak_hours'
  severity: 'critical' | 'warning'
  title: string
  message: string
}

export interface StaffSuggestion {
  area: string
  dayOfWeek: number
  timeBlock: string
  message: string
  type: 'overstaffed' | 'understaffed'
}

class DashboardService extends APIBase {
  async getDashboardData(branchId?: string) {
    const params = branchId ? `?branchId=${branchId}` : ''
    return this.get<{
      kpis: KpiData
      alerts: CriticalAlert[]
      staffSuggestions: StaffSuggestion[]
    }>(`dashboard${params}`)
  }

  async getAlerts(branchId?: string) {
    const params = branchId ? `?branchId=${branchId}` : ''
    return this.get<CriticalAlert[]>(`dashboard/alerts${params}`)
  }

  async getStaffOptimization(branchId?: string) {
    const params = branchId ? `?branchId=${branchId}` : ''
    return this.get<StaffSuggestion[]>(`dashboard/staff-optimization${params}`)
  }
}

export const dashboardService = new DashboardService()
