'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Mail, Lock, AlertCircle, UserRound } from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { useAuth } from '@/app/hooks/useAuth'

export default function AdminLoginPage() {
  const router = useRouter()
  const { login, loggingIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      await login({ email: email.trim().toLowerCase(), password: password.trim() })
      const session = await fetch('/api/auth/session', { cache: 'no-store' }).then((res) => res.json())
      if (!session?.user?.is_admin) {
        await fetch('/api/auth/logout', { method: 'POST' })
        setError('This account does not have admin access.')
        return
      }
      router.push('/admin/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
    }
  }

  return (
    <main className="admin-login-shell">
      <Card className="admin-login-card">
        <div className="admin-mark"><ShieldCheck aria-hidden="true" /></div>
        <div className="admin-heading">
          <p>Admin Access</p>
          <h1>MonetizeMate Insights</h1>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <label className="admin-field">
            <Label htmlFor="admin-email">Email</Label>
            <span>
              <Mail aria-hidden="true" />
              <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </span>
          </label>

          <label className="admin-field">
            <Label htmlFor="admin-password">Password</Label>
            <span>
              <Lock aria-hidden="true" />
              <Input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </span>
          </label>

          <Button type="submit" className="admin-submit" disabled={loggingIn}>
            {loggingIn ? 'Checking Access...' : 'Open Admin Dashboard'}
          </Button>

          <Button type="button" variant="outline" className="user-login-button" onClick={() => router.push('/login')}>
            <UserRound aria-hidden="true" className="h-4 w-4" />
            Go to User Login
          </Button>
        </form>
      </Card>

      <style>{`
        .admin-login-shell { min-height: 100vh; display: grid; place-items: center; padding: 28px; background: #08111f; color: #fff; font-family: 'DM Sans', system-ui, sans-serif; }
        .admin-login-card { width: min(430px, 100%); padding: 34px !important; border-radius: 16px !important; border: 1px solid #b9c8d8 !important; background: #f8fafc !important; color: #0f172a !important; box-shadow: 0 28px 80px rgba(0,0,0,.35); }
        .admin-mark { width: 52px; height: 52px; display: grid; place-items: center; border-radius: 14px; background: rgba(0,229,192,.12); border: 1px solid rgba(0,229,192,.25); color: #00e5c0; margin-bottom: 20px; }
        .admin-mark svg { width: 28px; height: 28px; }
        .admin-heading p { margin: 0 0 8px; color: #334155; font-size: 12px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
        .admin-heading h1 { margin: 0 0 26px; color: #020617; font-size: 28px; line-height: 1.15; font-weight: 900; }
        .admin-form { display: grid; gap: 18px; }
        .admin-field { display: grid; gap: 8px; }
        .admin-field label { color: #334155; font-weight: 900; }
        .admin-field span { position: relative; display: block; }
        .admin-field svg { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #007d6f; z-index: 1; }
        .admin-field input { height: 46px; padding-left: 42px !important; border-radius: 10px !important; background: #ffffff !important; border: 1px solid #8fb4d8 !important; color: #020617 !important; box-shadow: 0 1px 0 rgba(15,23,42,.04); }
        .admin-submit { height: 48px; border-radius: 10px !important; background: #00e5c0 !important; color: #061421 !important; font-weight: 900 !important; }
        .user-login-button { height: 46px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 10px !important; border: 1px solid #0f172a !important; background: #0f172a !important; color: #ffffff !important; font-weight: 900 !important; }
        .user-login-button:hover { background: #1e293b !important; border-color: #1e293b !important; color: #ffffff !important; }
      `}</style>
    </main>
  )
}
