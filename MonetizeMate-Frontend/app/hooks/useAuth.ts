'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSession, login as loginSvc, logout as logoutSvc, resetPassword as resetPasswordSvc, signup as signupSvc } from '../services/auth'

export function useAuth() {
  const qc = useQueryClient()

  const session = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: getSession,
    staleTime: 60_000,
  })

  const login = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => loginSvc(email, password),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth', 'session'] }),
  })

  const signup = useMutation({
    mutationFn: (data: { email: string; password: string; firstName?: string; lastName?: string }) => signupSvc(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth', 'session'] }),
  })

  const resetPassword = useMutation({
    mutationFn: (data: { email: string; password: string }) => resetPasswordSvc(data),
  })

  const logout = useMutation({
    mutationFn: logoutSvc,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth', 'session'] }),
  })

  return {
    user: session.data?.user ?? null,
    authenticated: !!session.data?.authenticated,
    loading: session.isLoading,
    error: session.error as Error | null,

    login: login.mutateAsync,
    loggingIn: login.isPending,

    signup: signup.mutateAsync,
    signingUp: signup.isPending,

    resetPassword: resetPassword.mutateAsync,
    resettingPassword: resetPassword.isPending,

    logout: logout.mutateAsync,
    loggingOut: logout.isPending,
  }
}
