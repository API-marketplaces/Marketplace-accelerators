import { apiFetch } from '../lib/fetcher'

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
  return apiFetch<{ authenticated: boolean; user: any }>('/api/auth/session')
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