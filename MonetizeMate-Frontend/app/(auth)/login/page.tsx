'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  AlertCircle,
  BarChart3,
  Brain,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const FEATURE_PREVIEW = [
  {
    title: 'Monetization Strategy Advisor',
    text: 'Personalized pricing and packaging recommendations.',
    icon: Compass,
  },
  {
    title: 'API Statistics',
    text: 'Usage, performance, clients, rankings, and trends.',
    icon: BarChart3,
  },
  {
    title: 'Prediction Models',
    text: 'Revenue forecasts and AI-assisted growth insights.',
    icon: Brain,
  },
]

export default function LoginPage() {
  const router = useRouter()
  const { login, loggingIn, resetPassword, resettingPassword } = useAuth()
  const [mode, setMode] = useState<'login' | 'reset'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      await login({ email: email.trim().toLowerCase(), password: password.trim() })
      const params = new URLSearchParams(window.location.search)
      const redirectTo = params.get('redirectTo') || '/dashboard'
      router.push(redirectTo)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    }
  }

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (newPassword.trim().length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    try {
      await resetPassword({ email: resetEmail.trim().toLowerCase(), password: newPassword.trim() })
      setEmail(resetEmail.trim().toLowerCase())
      setPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMode('login')
      setSuccess('Password updated. Sign in with your new password.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.')
    }
  }

  const openResetForm = () => {
    setResetEmail(email.trim().toLowerCase())
    setError(null)
    setSuccess(null)
    setMode('reset')
  }

  return (
    <main className="signin-shell">
      <section className="signin-layout">
        <div className="signin-copy">
          <div className="brand-row">
            <div className="brand-mark">M</div>
            <div>
              <p>MonetizeMate</p>
              <span>AI-Powered API Monetization</span>
            </div>
          </div>

          <p className="signin-kicker">Secure sign in</p>
          <h1>Unlock your revenue dashboard.</h1>
          <p className="signin-summary">
            Sign in to access your strategy advisor, API statistics, and prediction models in
            one focused workspace.
          </p>

          <div className="preview-list" aria-label="Dashboard features">
            {FEATURE_PREVIEW.map((feature) => {
              const Icon = feature.icon

              return (
                <div key={feature.title} className="preview-item">
                  <div className="preview-icon">
                    <Icon aria-hidden="true" />
                  </div>
                  <div>
                    <h2>{feature.title}</h2>
                    <p>{feature.text}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <Card className="signin-card">
          <div className="card-heading">
            <h2>{mode === 'login' ? 'Welcome Back' : 'Reset Password'}</h2>
            <p>{mode === 'login' ? 'Sign in to continue to MonetizeMate' : 'Create a new password for your account'}</p>
          </div>

          <form className="signin-form" onSubmit={mode === 'login' ? handleSubmit : handleResetSubmit}>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {mode === 'login' ? (
              <>
                <div className="field-group">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="input-wrap">
                    <Mail aria-hidden="true" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="field-group">
                  <Label htmlFor="password">Password</Label>
                  <div className="input-wrap">
                    <Lock aria-hidden="true" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="password-toggle"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <label>
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="link-button" onClick={openResetForm}>
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" className="signin-submit" disabled={loggingIn}>
                  {loggingIn ? 'Signing In...' : 'Sign In'}
                </Button>
              </>
            ) : (
              <>
                <div className="field-group">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <div className="input-wrap">
                    <Mail aria-hidden="true" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(event) => setResetEmail(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="field-group">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="input-wrap">
                    <KeyRound aria-hidden="true" />
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter a new password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="password-toggle"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <div className="field-group">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="input-wrap">
                    <Lock aria-hidden="true" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="signin-submit" disabled={resettingPassword}>
                  {resettingPassword ? 'Updating Password...' : 'Update Password'}
                </Button>

                <button
                  type="button"
                  className="link-button back-to-login"
                  onClick={() => {
                    setMode('login')
                    setError(null)
                  }}
                >
                  Back to sign in
                </button>
              </>
            )}
          </form>

          <p className="signup-link">
            Do not have an account?{' '}
            <button type="button" onClick={() => router.push('/signup')}>
              Create account
            </button>
          </p>
        </Card>
      </section>

      <style>{`
        .signin-shell {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background:
            linear-gradient(135deg, rgba(6, 14, 30, 0.98) 0%, rgba(10, 22, 40, 0.98) 42%, rgba(13, 32, 53, 0.96) 72%, rgba(7, 20, 32, 1) 100%);
          color: #ffffff;
          font-family: 'DM Sans', system-ui, sans-serif;
          padding: 56px 24px;
        }

        .signin-shell::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(rgba(0, 229, 192, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 229, 192, 0.035) 1px, transparent 1px);
          background-size: 76px 76px;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent 78%);
        }

        .signin-layout {
          position: relative;
          z-index: 1;
          width: min(1080px, 100%);
          min-height: calc(100vh - 112px);
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(360px, 430px);
          gap: 48px;
          align-items: center;
        }

        .brand-row {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 48px;
        }

        .brand-mark {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #00E5C0, #1ABFA3);
          color: #060E1E;
          font-size: 18px;
          font-weight: 900;
        }

        .brand-row p {
          margin: 0;
          color: #ffffff;
          font-size: 18px;
          font-weight: 800;
          line-height: 1.2;
        }

        .brand-row span {
          display: block;
          margin-top: 2px;
          color: rgba(0, 229, 192, 0.68);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        .signin-kicker {
          width: fit-content;
          margin: 0 0 18px;
          color: #00E5C0;
          border: 1px solid rgba(0, 229, 192, 0.22);
          background: rgba(0, 229, 192, 0.08);
          border-radius: 999px;
          padding: 7px 14px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .signin-copy h1 {
          width: min(560px, 100%);
          margin: 0;
          color: #ffffff;
          font-size: 54px;
          line-height: 1.06;
          font-weight: 900;
        }

        .signin-summary {
          width: min(520px, 100%);
          margin: 22px 0 34px;
          color: rgba(255, 255, 255, 0.58);
          font-size: 17px;
          line-height: 1.7;
        }

        .preview-list {
          display: grid;
          gap: 14px;
          width: min(540px, 100%);
        }

        .preview-item {
          display: grid;
          grid-template-columns: 48px minmax(0, 1fr);
          gap: 14px;
          align-items: center;
          padding: 16px;
          border: 1px solid rgba(0, 229, 192, 0.13);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.035);
          backdrop-filter: blur(14px);
        }

        .preview-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 229, 192, 0.1);
          border: 1px solid rgba(0, 229, 192, 0.18);
        }

        .preview-icon svg {
          width: 24px;
          height: 24px;
          color: #00E5C0;
        }

        .preview-item h2 {
          margin: 0 0 4px;
          color: #ffffff;
          font-size: 15px;
          line-height: 1.35;
          font-weight: 800;
        }

        .preview-item p {
          margin: 0;
          color: rgba(255, 255, 255, 0.5);
          font-size: 13px;
          line-height: 1.45;
        }

        .signin-card {
          border-radius: 18px !important;
          border: 1px solid rgba(0, 229, 192, 0.16) !important;
          background: rgba(8, 20, 36, 0.82) !important;
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(0, 229, 192, 0.05);
          padding: 34px !important;
          backdrop-filter: blur(22px);
        }

        .card-heading {
          margin-bottom: 28px;
          text-align: left;
        }

        .card-heading h2 {
          margin: 0 0 8px;
          color: #ffffff;
          font-size: 27px;
          line-height: 1.2;
          font-weight: 900;
        }

        .card-heading p {
          margin: 0;
          color: rgba(255, 255, 255, 0.52);
          font-size: 14px;
        }

        .signin-form {
          display: grid;
          gap: 18px;
        }

        .field-group {
          display: grid;
          gap: 8px;
        }

        .field-group label {
          color: rgba(255, 255, 255, 0.82);
          font-size: 13px;
          font-weight: 800;
        }

        .input-wrap {
          position: relative;
        }

        .input-wrap > svg {
          position: absolute;
          left: 13px;
          top: 50%;
          width: 19px;
          height: 19px;
          transform: translateY(-50%);
          color: rgba(0, 229, 192, 0.58);
          z-index: 1;
        }

        .input-wrap input {
          height: 46px;
          border-radius: 10px !important;
          padding-left: 44px !important;
          padding-right: 44px !important;
          background: rgba(255, 255, 255, 0.055) !important;
          border-color: rgba(0, 229, 192, 0.18) !important;
          color: #ffffff !important;
        }

        .password-toggle {
          position: absolute;
          right: 11px;
          top: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translateY(-50%);
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: rgba(0, 229, 192, 0.7);
          cursor: pointer;
        }

        .password-toggle:hover {
          background: rgba(0, 229, 192, 0.08);
          color: #00E5C0;
        }

        .password-toggle svg {
          width: 18px;
          height: 18px;
        }

        .form-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .form-row label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
        }

        .form-row input {
          width: 15px;
          height: 15px;
          accent-color: #00E5C0;
        }

        .link-button,
        .signup-link button {
          border: 0;
          background: transparent;
          color: #00E5C0;
          cursor: pointer;
          font-size: 13px;
          font-weight: 800;
        }

        .link-button:hover,
        .signup-link button:hover {
          text-decoration: underline;
        }

        .back-to-login {
          width: fit-content;
          justify-self: center;
        }

        .signin-submit {
          width: 100%;
          height: 48px;
          margin-top: 4px;
          border-radius: 10px !important;
          background: linear-gradient(135deg, #00E5C0, #1ABFA3) !important;
          color: #060E1E !important;
          font-size: 15px !important;
          font-weight: 900 !important;
          box-shadow: 0 18px 42px rgba(0, 229, 192, 0.18);
        }

        .signup-link {
          margin: 24px 0 0;
          text-align: center;
          color: rgba(255, 255, 255, 0.58);
          font-size: 14px;
        }

        @media (max-width: 920px) {
          .signin-layout {
            grid-template-columns: 1fr;
            gap: 34px;
            padding-top: 34px;
          }

          .signin-copy h1 {
            font-size: 42px;
          }

          .signin-card {
            width: min(100%, 480px);
          }
        }

        @media (max-width: 600px) {
          .signin-shell {
            padding: 78px 16px 36px;
          }

          .signin-copy h1 {
            font-size: 34px;
          }

          .signin-summary {
            font-size: 15px;
          }

          .signin-card {
            padding: 26px !important;
          }

          .form-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </main>
  )
}
