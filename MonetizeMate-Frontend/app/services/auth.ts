import { apiFetch } from '../lib/fetcher'

export type SessionUser = {
  email: string
  name?: string
  is_active?: boolean
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

export function signup(data: { email: string; password: string; firstName?: string; lastName?: string }) {
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
