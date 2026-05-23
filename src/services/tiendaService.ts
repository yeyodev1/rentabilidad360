import APIBase from './httpBase'
import type { Tienda } from '@/stores/onboarding'

export interface TiendaPayload {
  name: string
  businessType?: string | null
  address?: string
  city?: string
  manager?: string
  phone?: string
  status?: 'active' | 'paused' | 'opening'
  staff?: number
  monthlyClients?: number
  notes?: string
  isMain?: boolean
  workspaceName?: string
}

class TiendaService extends APIBase {
  async list() {
    return this.get<Tienda[]>('tiendas')
  }

  async create(payload: TiendaPayload) {
    return this.post<Tienda>('tiendas', payload)
  }

  async update(id: string, payload: Partial<TiendaPayload>) {
    return this.put<Tienda>(`tiendas/${id}`, payload)
  }

  async setMain(id: string) {
    return this.patch<Tienda>(`tiendas/${id}/main`, {})
  }

  async remove(id: string) {
    return this.delete<{ message: string; id: string }>(`tiendas/${id}`)
  }
}

export const tiendaService = new TiendaService()
