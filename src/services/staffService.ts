import APIBase from './httpBase'

interface ShiftData {
  area: 'cocina' | 'atencion'
  dayOfWeek: number
  startTime: string
  endTime: string
  staffCount: number
}

class StaffService extends APIBase {
  async listShifts(branchId?: string, area?: string) {
    const params = new URLSearchParams()
    if (branchId) params.set('branchId', branchId)
    if (area) params.set('area', area)
    return this.get<ShiftData[]>(`staff/shifts?${params}`)
  }

  async saveShifts(branchId: string, area: string, shifts: Omit<ShiftData, 'area'>[]) {
    return this.post('staff/shifts', { branchId, area, shifts })
  }

  async getOptimization(branchId?: string) {
    const params = branchId ? `?branchId=${branchId}` : ''
    return this.get(`staff/optimization${params}`)
  }
}

export const staffService = new StaffService()
