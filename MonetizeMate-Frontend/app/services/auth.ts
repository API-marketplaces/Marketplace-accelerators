import { apiFetch } from '../lib/fetcher'

export type SessionUser = {
  email: string
  name?: string
  is_active?: boolean
  is_admin?: boolean
  id?: number
}

export function login(email: string, password: string) {
  return apiFetch<{ ok: true }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function logout() {
  return apiFetch<{ ok: true }>('/api/auth/logout', { method: 'POST' })
}

export function getSession() {
  return apiFetch<{ authenticated: boolean; user: SessionUser | null }>('/api/auth/session')
}

export type SignupPayload = {
  email: string
  password: string
  firstName: string
  lastName: string
  companyName: string
  jobTitle: string
  department?: string
  country: string
  industry: string
  companySize: string
  annualRevenue?: string
  apiMaturity: string
  primaryObjectives: string[]
  apiGateway: string
  apisManaged: string
  teamSize: string
  analyticsConsent: boolean
}

export function signup(data: SignupPayload) {
  return apiFetch<{ ok: true }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export function requestPasswordResetLink(data: { email: string }) {
  return apiFetch<{ ok: true; message?: string }>('/api/auth/forgot-password/request-link', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export function resetPassword(data: { email: string; password: string; token: string }) {
  return apiFetch<{ ok: true; message?: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  })
}


