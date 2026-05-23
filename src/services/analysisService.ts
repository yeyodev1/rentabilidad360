import APIBase from './httpBase'
import type { AnalysisResults } from '@/stores/onboarding'

interface CreateAnalysisPayload {
  projectName: string
  businessType: string
  currency: string
  investment: number
  avgPrice: number
  monthlyClients: number
  rawMaterialPercent: number
  monthlyRent: number
}

interface CreateAnalysisResponse {
  _id: string
  results: AnalysisResults
}

class AnalysisService extends APIBase {
  async create(payload: CreateAnalysisPayload) {
    return this.post<CreateAnalysisResponse>('analysis', payload)
  }

  async getById(id: string) {
    return this.get<CreateAnalysisResponse>(`analysis/${id}`)
  }
}

export const analysisService = new AnalysisService()
