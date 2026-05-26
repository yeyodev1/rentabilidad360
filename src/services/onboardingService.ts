import APIBase from './httpBase'

export interface OnboardingStepPayload {
  step: number
  data: Record<string, unknown>
}

class OnboardingService extends APIBase {
  async saveStep(step: number, data: Record<string, unknown>) {
    return this.post('onboarding/step', { step, data })
  }

  async getProgress() {
    return this.get<{ currentStep: number; completedSteps: number[]; data: Record<string, unknown>; isComplete: boolean; hasCompany: boolean; companyName: string | null }>('onboarding/progress')
  }

  async completeOnboarding() {
    return this.post('onboarding/complete', {})
  }
}

export const onboardingService = new OnboardingService()
