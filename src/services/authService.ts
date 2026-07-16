import APIBase from './httpBase'

export type UserRole = 'admin' | 'supervisor' | 'operador'

interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
}

interface RegisterResponse {
  message: string
  email: string
}

interface VerifyPayload {
  email: string
  code: string
}

interface VerifyResponse {
  message: string
  token: string
  user: {
    id: string
    name: string
    email: string
    workspaceIds: string[]
    role?: UserRole
  }
  hasWorkspace?: boolean
  workspaceCount?: number
}

interface LoginResponse {
  message: string
  token: string
  user: {
    id: string
    name: string
    email: string
    workspaceIds: string[]
    role?: UserRole
  }
  hasWorkspace?: boolean
  workspaceCount?: number
}

class AuthService extends APIBase {
  async register(payload: RegisterPayload) {
    return this.post<RegisterResponse>('auth/register', payload)
  }

  async verifyEmail(payload: VerifyPayload) {
    return this.post<VerifyResponse>('auth/verify', payload)
  }

  async resendCode(email: string) {
    return this.post<{ message: string }>('auth/resend-code', { email })
  }

  async login(email: string, password: string) {
    return this.post<LoginResponse>('auth/login', { email, password })
  }
}

export const authService = new AuthService()
