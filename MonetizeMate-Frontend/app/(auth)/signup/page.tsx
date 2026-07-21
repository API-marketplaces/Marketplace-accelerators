'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, BriefcaseBusiness, Building2, CheckSquare, DollarSign, Eye, EyeOff, Globe2, Lock, Mail, User } from 'lucide-react'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useAuth } from '../../hooks/useAuth'

const industries = [
  'Banking & Financial Services', 'Insurance', 'Retail', 'Healthcare', 'Telecommunications',
  'Manufacturing', 'Logistics', 'Government', 'Education', 'Energy', 'Technology', 'Other',
]
const companySizes = ['Startup (1-50)', 'Small (51-250)', 'Medium (251-1000)', 'Enterprise (1000+)']
const annualRevenues = ['< $10M', '$10M-$100M', '$100M-$1B', '$1B+']
const apiMaturityOptions = ['Exploring APIs', 'Internal APIs', 'Partner APIs', 'Public APIs', 'Mature API Marketplace']
const primaryObjectives = [
  'Monetize APIs', 'Improve API Adoption', 'Productize APIs', 'Build Developer Portal',
  'Create API Marketplace', 'Analyze API Usage', 'Revenue Forecasting', 'Governance', 'Other',
]
const apiGateways = ['Kong', 'Apigee', 'Azure APIM', 'Broadcom Layer7', 'MuleSoft', 'WSO2', 'IBM API Connect', 'AWS API Gateway', 'None', 'Other']
const apisManagedOptions = ['<25', '25-100', '100-500', '500+']
const teamSizes = ['Individual', '2-5', '6-20', '20+']
const departments = ['', 'Product', 'Engineering', 'Architecture', 'IT', 'Business Strategy', 'Revenue', 'Operations', 'Other']
const countries = ['', 'India', 'United States', 'United Kingdom', 'Germany', 'France', 'Australia', 'Singapore', 'UAE', 'Canada', 'Other']
const jobTitles = ['', 'Product Manager', 'API Product Manager', 'Engineering Manager', 'Enterprise Architect', 'CTO', 'CIO', 'Business Analyst', 'Developer Relations', 'Other']

type SignupForm = {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  companyName: string
  jobTitle: string
  department: string
  country: string
  industry: string
  companySize: string
  annualRevenue: string
  apiMaturity: string
  primaryObjectives: string[]
  apiGateway: string
  apisManaged: string
  teamSize: string
  analyticsConsent: boolean
}

const initialForm: SignupForm = {
  firstName: '', lastName: '', email: '', password: '', confirmPassword: '', companyName: '',
  jobTitle: '', department: '', country: '', industry: '', companySize: '', annualRevenue: '',
  apiMaturity: '', primaryObjectives: [], apiGateway: '', apisManaged: '', teamSize: '', analyticsConsent: false,
}

export default function SignUpPage() {
  const router = useRouter()
  const { signup, signingUp } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<SignupForm>(initialForm)
  const [error, setError] = useState<string | null>(null)

  const updateField = (field: keyof SignupForm, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const toggleObjective = (objective: string) => {
    const exists = formData.primaryObjectives.includes(objective)
    updateField(
      'primaryObjectives',
      exists
        ? formData.primaryObjectives.filter((item) => item !== objective)
        : [...formData.primaryObjectives, objective]
    )
  }

  const validate = () => {
    const required: Array<[keyof SignupForm, string]> = [
      ['firstName', 'First Name'], ['lastName', 'Last Name'], ['email', 'Work Email'], ['password', 'Password'],
      ['companyName', 'Company Name'], ['jobTitle', 'Job Title'], ['country', 'Country'], ['industry', 'Industry'],
      ['companySize', 'Company Size'], ['apiMaturity', 'API Maturity'], ['apiGateway', 'API Gateway'],
      ['apisManaged', 'APIs Managed'], ['teamSize', 'Team Size'],
    ]
    const missing = required.find(([field]) => !String(formData[field]).trim())
    if (missing) return `Please enter ${missing[1]}.`
    if (!formData.email.includes('@')) return 'Please enter a valid work email.'
    if (formData.password.length < 8) return 'Password must be at least 8 characters.'
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match.'
    if (!formData.primaryObjectives.length) return 'Select at least one primary objective.'
    if (!formData.analyticsConsent) return 'Please agree to anonymized usage analytics to continue.'
    return null
  }

  const handleSubmit = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    try {
      await signup({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim(),
        companyName: formData.companyName.trim(),
        jobTitle: formData.jobTitle.trim(),
        department: formData.department.trim(),
        country: formData.country.trim(),
        industry: formData.industry.trim(),
        companySize: formData.companySize,
        annualRevenue: formData.annualRevenue,
        apiMaturity: formData.apiMaturity,
        primaryObjectives: formData.primaryObjectives,
        apiGateway: formData.apiGateway,
        apisManaged: formData.apisManaged,
        teamSize: formData.teamSize,
        analyticsConsent: formData.analyticsConsent,
      })
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    }
  }

  const textInput = (field: keyof SignupForm, label: string, placeholder: string, icon?: React.ReactNode, type = 'text') => (
    <label className="signup-field">
      <Label htmlFor={String(field)}>{label}</Label>
      <span className="input-shell">
        {icon}
        <Input id={String(field)} type={type} placeholder={placeholder} value={String(formData[field])} onChange={(event) => updateField(field, event.target.value)} />
      </span>
    </label>
  )

  const selectInput = (field: keyof SignupForm, label: string, options: string[], placeholder = 'Select') => (
    <label className="signup-field">
      <Label htmlFor={String(field)}>{label}</Label>
      <select id={String(field)} value={String(formData[field])} onChange={(event) => updateField(field, event.target.value)} className="signup-select">
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option} value={option}>{option || 'None'}</option>)}
      </select>
    </label>
  )

  return (
    <main className="signup-page">
      <Button variant="ghost" onClick={() => router.push('/')} className="back-button">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Button>

      <section className="signup-shell">
        <div className="signup-heading">
          <div className="brand-row">
            <div className="brand-mark"><DollarSign className="w-7 h-7" /></div>
            <span>MonetizeMate</span>
          </div>
          <h1>Create Your Account</h1>
          <p>Build a richer profile so MonetizeMate can personalize strategy recommendations and admin insights.</p>
        </div>

        <Card className="signup-card">
          <form className="signup-form" onSubmit={(event) => event.preventDefault()}>
            {error && (
              <Alert variant="destructive" className="form-wide">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="section-title form-wide"><User />Account Information</div>
            {textInput('firstName', 'First Name', 'Aman', <User />)}
            {textInput('lastName', 'Last Name', 'Pandey')}
            {textInput('email', 'Work Email', 'name@company.com', <Mail />, 'email')}
            <label className="signup-field">
              <Label htmlFor="password">Password</Label>
              <span className="input-shell">
                <Lock />
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={formData.password} onChange={(event) => updateField('password', event.target.value)} />
                <button type="button" className="password-button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </span>
            </label>
            {textInput('confirmPassword', 'Confirm Password', 'Confirm your password', <Lock />, 'password')}
            {textInput('companyName', 'Company Name', 'Nagarro', <Building2 />)}
            {selectInput('jobTitle', 'Job Title', jobTitles, 'Select or choose Other')}
            {selectInput('department', 'Department', departments, 'Select department')}
            {selectInput('country', 'Country', countries, 'Select country')}

            <div className="section-title form-wide"><BriefcaseBusiness />Business Information</div>
            {selectInput('industry', 'Industry', industries, 'Select industry')}
            {selectInput('companySize', 'Company Size', companySizes, 'Select company size')}
            {selectInput('annualRevenue', 'Annual Revenue (Optional)', annualRevenues, 'Select annual revenue')}
            {selectInput('apiGateway', 'API Gateway', apiGateways, 'Select API gateway')}
            {selectInput('apisManaged', 'APIs Managed', apisManagedOptions, 'Select APIs managed')}
            {selectInput('teamSize', 'Team Size', teamSizes, 'Select team size')}

            <fieldset className="choice-group form-wide">
              <legend><Globe2 />API Maturity</legend>
              <div className="radio-grid">
                {apiMaturityOptions.map((option) => (
                  <label key={option} className="choice-pill">
                    <input type="radio" name="apiMaturity" checked={formData.apiMaturity === option} onChange={() => updateField('apiMaturity', option)} />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="choice-group form-wide">
              <legend><CheckSquare />Primary Objective</legend>
              <div className="checkbox-grid">
                {primaryObjectives.map((objective) => (
                  <label key={objective} className="choice-pill">
                    <input type="checkbox" checked={formData.primaryObjectives.includes(objective)} onChange={() => toggleObjective(objective)} />
                    <span>{objective}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="consent-row form-wide">
              <input type="checkbox" checked={formData.analyticsConsent} onChange={(event) => updateField('analyticsConsent', event.target.checked)} />
              <span>I agree to anonymized usage analytics for improving AI recommendations.</span>
            </label>

            <div className="form-actions form-wide">
              <Button type="button" onClick={handleSubmit} className="create-button" disabled={signingUp}>
                {signingUp ? 'Creating Account...' : 'Create Account'}
              </Button>
              <p>Already have an account? <button type="button" onClick={() => router.push('/login')}>Sign in</button></p>
            </div>
          </form>
        </Card>
      </section>

      <style>{`
        .signup-page { min-height: 100vh; background: linear-gradient(135deg, #eefafa 0%, #f8fbff 100%); padding: 34px 22px 64px; color: #142238; font-family: 'DM Sans', system-ui, sans-serif; }
        .back-button { position: fixed; top: 22px; left: 24px; color: #0f766e !important; z-index: 10; }
        .signup-shell { width: min(1120px, 100%); margin: 56px auto 0; }
        .signup-heading { text-align: center; margin-bottom: 28px; }
        .brand-row { display: inline-flex; align-items: center; gap: 12px; margin-bottom: 18px; font-size: 24px; font-weight: 900; color: #102033; }
        .brand-mark { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 12px; background: #00d6bd; color: #061421; }
        .signup-heading h1 { margin: 0; font-size: clamp(32px, 5vw, 48px); line-height: 1.05; font-weight: 900; }
        .signup-heading p { width: min(720px, 100%); margin: 14px auto 0; color: #526276; line-height: 1.7; }
        .signup-card { padding: 30px !important; border: 1px solid rgba(13, 148, 136, .22) !important; border-radius: 8px !important; background: rgba(255,255,255,.88) !important; box-shadow: 0 26px 70px rgba(15, 118, 110, .13); }
        .signup-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 22px; }
        .form-wide { grid-column: 1 / -1; }
        .section-title { display: flex; align-items: center; gap: 10px; margin-top: 6px; padding-bottom: 10px; border-bottom: 1px solid #d7e8e6; color: #0f766e; font-size: 17px; font-weight: 900; }
        .section-title svg { width: 20px; height: 20px; }
        .signup-field { display: grid; gap: 8px; min-width: 0; }
        .signup-field label, .choice-group legend { color: #1c2b3f; font-size: 13px; font-weight: 900; }
        .input-shell { position: relative; display: block; }
        .input-shell > svg { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #14b8a6; z-index: 1; }
        .input-shell input { height: 46px; border-radius: 8px !important; border-color: #b8deda !important; padding-left: 42px !important; color: #142238 !important; background: #fff !important; }
        .signup-field:not(:has(.input-shell > svg)) input { padding-left: 14px !important; }
        .password-button { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 30px; height: 30px; border: 0; background: transparent; color: #0d9488; display: grid; place-items: center; cursor: pointer; }
        .password-button svg { width: 17px; height: 17px; }
        .signup-select { height: 46px; width: 100%; border: 1px solid #b8deda; border-radius: 8px; background: #fff; color: #142238; padding: 0 13px; font-weight: 600; outline: none; }
        .choice-group { border: 1px solid #d7e8e6; border-radius: 8px; padding: 16px; background: #f8fdfc; }
        .choice-group legend { display: inline-flex; align-items: center; gap: 8px; padding: 0 8px; }
        .choice-group legend svg { width: 17px; height: 17px; color: #0d9488; }
        .radio-grid, .checkbox-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
        .choice-pill { min-height: 42px; display: flex; align-items: center; gap: 9px; padding: 10px 12px; border: 1px solid #cce6e3; border-radius: 8px; background: #fff; color: #26364a; font-size: 13px; font-weight: 700; }
        .choice-pill input { accent-color: #0d9488; flex: 0 0 auto; }
        .consent-row { display: flex; align-items: flex-start; gap: 10px; color: #334155; font-size: 14px; line-height: 1.5; }
        .consent-row input { margin-top: 3px; accent-color: #0d9488; }
        .form-actions { display: grid; justify-items: center; gap: 14px; padding-top: 8px; }
        .create-button { width: min(360px, 100%); height: 48px; border-radius: 8px !important; background: #00cdb5 !important; color: #061421 !important; font-weight: 900 !important; }
        .form-actions p { margin: 0; color: #526276; } .form-actions button:not(.create-button) { border: 0; background: transparent; color: #0d9488; font-weight: 900; cursor: pointer; }
        @media (max-width: 820px) { .signup-form, .radio-grid, .checkbox-grid { grid-template-columns: 1fr; } .signup-shell { margin-top: 74px; } .back-button { position: absolute; } .signup-card { padding: 20px !important; } }
      `}</style>
    </main>
  )
}
