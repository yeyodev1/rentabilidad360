import APIBase from './httpBase'

export interface POSConnectionData {
  _id?: string
  provider: string
  status?: string
  apiKey?: string
  storeId?: string
  createdAt?: string
}

class PosService extends APIBase {
  async getConnections() {
    return this.get('pos')
  }

  async createConnection(data: Partial<POSConnectionData>) {
    return this.post('pos', data)
  }

  async deleteConnection(id: string) {
    return this.delete(`pos/${id}`)
  }
}

export const posService = new PosService()
