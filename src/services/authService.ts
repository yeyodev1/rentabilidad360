import APIBase from './httpBase'

interface RegisterPayload {
  name: string
  email: string
  password: string
}

interface AuthResponse {
  message: string
  token: string
  user: {
    id: string
    name: string
    email: string
  }
}

class AuthService extends APIBase {
  async register(payload: RegisterPayload) {
    return this.post<AuthResponse>('auth/register', payload)
  }

  async login(email: string, password: string) {
    return this.post<AuthResponse>('auth/login', { email, password })
  }
}

export const authService = new AuthService()
