import APIBase from './httpBase'

interface EquipmentData {
  name: string
  brand: string
  purchaseDate: string
  historicalCost: number
  usefulLife: number
  maintenanceIntervalDays: number
  notes?: string
  imageUrl?: string
  location?: string
  branchId?: string
}

interface MaintenanceTicket {
  equipmentId: string
  description: string
  priority?: 'baja' | 'media' | 'alta' | 'critica'
  assignedTo?: string
}

class MaintenanceService extends APIBase {
  async listEquipment(branchId?: string) {
    const params = branchId ? `?branchId=${branchId}` : ''
    return this.get(`maintenance/equipment${params}`)
  }

  async createEquipment(data: EquipmentData) {
    return this.post('maintenance/equipment', data)
  }

  async updateEquipment(id: string, data: Partial<EquipmentData>) {
    return this.put(`maintenance/equipment/${id}`, data)
  }

  async deleteEquipment(id: string) {
    return this.delete(`maintenance/equipment/${id}`)
  }

  async getEquipmentDetail(id: string) {
    return this.get(`maintenance/equipment/${id}`)
  }

  async getPublicEquipmentAudit(id: string) {
    return this.get(`maintenance/public/equipment/${id}`)
  }

  async generateQR(id: string) {
    return this.post(`maintenance/equipment/${id}/qr`, {})
  }

  async scanQR(qrCode: string) {
    return this.get(`maintenance/scan/${qrCode}`)
  }

  async checkOverdue() {
    return this.post('maintenance/overdue/check', {})
  }

  async listTickets(equipmentId?: string, branchId?: string) {
    const searchParams = new URLSearchParams()
    if (equipmentId) searchParams.set('equipmentId', equipmentId)
    if (branchId) searchParams.set('branchId', branchId)
    const params = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return this.get(`maintenance/tickets${params}`)
  }

  async createTicket(data: MaintenanceTicket) {
    return this.post('maintenance/tickets', data)
  }

  async updateTicket(id: string, data: Partial<{ status: string; resolutionNotes: string }>) {
    return this.put(`maintenance/tickets/${id}`, data)
  }
}

export const maintenanceService = new MaintenanceService()
