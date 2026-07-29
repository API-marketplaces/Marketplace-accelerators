'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { Activity, BarChart3, Building2, Download, FileText, Loader2, LogOut, ShieldCheck, Target, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { useAuth } from '@/app/hooks/useAuth'
import { downloadHtmlAsPdf } from '@/app/utils/pdf'
import {
  EXEC_REPORT_STYLES, xrHeader, xrBriefTitle, xrInfoGrid, xrSectionTitled, xrBarList, xrList, xrFooter,
} from '@/app/utils/executiveReport'

type ExportedUser = {
  id: number
  name: string
  email: string
  company_name: string
  job_title: string
  department: string
  country: string
  industry: string
  company_size: string
  annual_revenue: string
  api_maturity: string
  primary_objectives: string
  api_gateway: string
  apis_managed: string
  team_size: string
  persona: string
  preferred_pricing_model: string
  monetization_readiness_score: number
  features_used: string
  assessments_completed: number
  reports_downloaded: number
  files_uploaded: number
  last_activity_at: string | null
}

type DistributionItem = { label: string; count: number; percentage: number }
type FeatureMetric = { feature: string; opened: number; completed: number; time_spent: string; reports_generated: number; downloads: number }
type UseCase = { industry: string; use_case: string; customer_count: number; revenue_potential: string; recommended_model: string; common_challenges: string; roadmap: string[]; target_buyers?: string; value_proposition?: string; data_signals?: string[]; kpis?: string[]; quick_wins?: string[]; current_state?: string; key_challenges?: string; monetizemate_recommendation?: string }
type Insights = {
  summary: Record<string, number | string>
  industry_distribution: DistributionItem[]
  company_size_distribution: DistributionItem[]
  api_maturity_distribution: DistributionItem[]
  country_distribution: DistributionItem[]
  business_objectives: DistributionItem[]
  common_api_types: DistributionItem[]
  preferred_pricing_models: DistributionItem[]
  persona_distribution: DistributionItem[]
  api_gateway_distribution: DistributionItem[]
  feature_metrics: FeatureMetric[]
  activity_timeline: Array<{ date: string; recommendations: number; uploads: number }>
  ai_use_cases: UseCase[]
  recent_activity: Array<{ id: number; industry: string | null; persona: string | null; use_case: string | null; strategy: string | null; created_at: string | null; user: { name: string; email: string } | null }>
}

const colors = ['#007d6f', '#2563eb', '#7c3aed', '#dc2626', '#ca8a04', '#0891b2', '#475569']
const overviewCards = [
  ['total_users', 'Total Users', Users],
  ['companies', 'Companies', Building2],
  ['assessments_completed', 'Assessments Completed', Target],
  ['reports_generated', 'Reports Generated', FileText],
  ['average_completion_rate', 'Avg Completion Rate', Activity],
  ['monetization_readiness_score', 'Readiness Score', BarChart3],
] as const

function valueWithSuffix(key: string, value: number | string | undefined) {
  if (value === undefined) return '0'
  if (key.includes('rate') || key.includes('score')) return `${value}%`
  return String(value)
}

function BarList({ items, empty = 'No data yet.' }: { items: DistributionItem[]; empty?: string }) {
  if (!items.length) return <p className="empty">{empty}</p>
  return <div className="bar-list">{items.map((item) => <div key={item.label} className="bar-item"><div><span>{item.label}</span><strong>{item.percentage}%</strong></div><i><b style={{ width: `${Math.max(item.percentage, 4)}%` }} /></i></div>)}</div>
}


function escapeHtml(value: string | number | undefined | null) {
  const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
  return String(value ?? '').replace(/[&<>"']/g, (char) => entities[char] || char)
}

function featureAdoptionTable(features: FeatureMetric[]) {
  if (!features.length) return ''
  const rows = features.map((f) => `<tr><td class="tier-name">${escapeHtml(f.feature)}</td><td>${escapeHtml(f.opened)}</td><td>${escapeHtml(f.completed)}</td><td>${escapeHtml(f.time_spent)}</td><td>${escapeHtml(f.reports_generated)}</td><td>${escapeHtml(f.downloads)}</td></tr>`).join('')
  return xrSectionTitled('Feature Usage & Report Activity', `
    <table class="xr-table">
      <thead><tr><th>Feature</th><th>Opened</th><th>Completed</th><th>Time Spent</th><th>Reports</th><th>Downloads</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`)
}

function buildAdminVisualSummary(insights: Insights) {
  const snapshotRows: [string, string][] = [
    ['Total Users', String(insights.summary.total_users ?? 0)],
    ['Companies', String(insights.summary.companies ?? 0)],
    ['Assessments', String(insights.summary.assessments_completed ?? 0)],
    ['Reports', String(insights.summary.reports_generated ?? 0)],
    ['Avg Completion', `${insights.summary.average_completion_rate ?? 0}%`],
    ['Readiness Score', `${insights.summary.monetization_readiness_score ?? 0}%`],
    ['Use Cases Found', String(insights.ai_use_cases.length)],
    ['Most Used Feature', String(insights.summary.most_used_feature || '—')],
  ]
  return `
    ${xrSectionTitled('Platform Snapshot', xrInfoGrid(snapshotRows))}
    ${xrSectionTitled('Platform Distribution', `
      <div class="xr-two-col">${xrBarList('Industry Mix', insights.industry_distribution)}${xrBarList('Company Size', insights.company_size_distribution)}</div>
      <div style="height:10px"></div>
      <div class="xr-two-col">${xrBarList('API Maturity Level', insights.api_maturity_distribution)}${xrBarList('Country Distribution', insights.country_distribution)}</div>
      <div style="height:10px"></div>
      <div class="xr-two-col">${xrBarList('Personas', insights.persona_distribution)}${xrBarList('Preferred Pricing Models', insights.preferred_pricing_models)}</div>
      <div style="height:10px"></div>
      <div class="xr-two-col">${xrBarList('Common API Types', insights.common_api_types)}${xrBarList('API Gateway Usage', insights.api_gateway_distribution)}</div>
      <div style="height:10px"></div>
      ${xrBarList('Business Objectives', insights.business_objectives)}
    `)}
    ${featureAdoptionTable(insights.feature_metrics)}`
}

const GOVERNANCE_ACTIONS = [
  'Assign an API product owner and platform owner.',
  'Define API standards, approval flow, security controls, and lifecycle stages.',
  'Create reusable domain APIs before adding new point-to-point integrations.',
  'Publish APIs through a managed catalog or developer portal.',
]

const SUCCESS_METRICS = [
  'Active users and consuming applications.',
  'API reuse rate across domains and partners.',
  'Integration delivery cycle time reduction.',
  'Error rate, latency, SLA adherence, and support volume.',
  'Revenue, cost avoidance, or productivity impact by API product.',
]

function buildUseCaseSection(item: UseCase, index: number): string {
  const factsRows: [string, string][] = [
    ['Users', String(item.customer_count)],
    ['Strategic Priority', item.revenue_potential],
    ['Model', item.recommended_model],
    ['Target Users', item.target_buyers || 'Not enough signal yet.'],
  ]
  return `
    <div class="xr-section" style="break-inside:avoid">
      <div class="xr-kicker">${escapeHtml(item.industry)}</div>
      <h1 style="font-size:16px;margin-bottom:12px">${index + 1}. ${escapeHtml(item.use_case)}</h1>
      ${xrInfoGrid(factsRows)}
      <div style="height:12px"></div>
      <div class="xr-advisory">
        <div class="lbl">High Level Requirement</div>
        <p>${escapeHtml(item.common_challenges)}</p>
      </div>
      <div style="height:12px"></div>
      <div class="xr-why-grid">
        <div class="xr-why-card"><h4>Current State</h4><p>${escapeHtml(item.current_state || 'API capabilities are handled through fragmented integrations and limited governance.')}</p></div>
        <div class="xr-why-card"><h4>Key Challenges</h4><p>${escapeHtml(item.key_challenges || item.common_challenges)}</p></div>
        <div class="xr-why-card"><h4>Monetize Mate Recommendation</h4><p>${escapeHtml(item.monetizemate_recommendation || item.value_proposition || 'Create a governed API management layer and standardize reusable domain APIs.')}</p></div>
      </div>
      <div style="height:12px"></div>
      <div class="xr-advisory">
        <div class="lbl">AI Opportunity Analysis</div>
        <p>This use case is prioritized because it combines visible user demand with a repeatable API product pattern. MonetizeMate's AI interpretation suggests the organization should move from ad hoc integration delivery toward governed, reusable API capabilities that can be packaged, secured, measured, and extended into partner or AI-enabled workflows. The recommended model should be treated as an operating model as much as a pricing model: define ownership, access policies, service levels, usage visibility, and adoption targets before scaling consumption across teams or external users.</p>
      </div>
      <div style="height:12px"></div>
      <div class="xr-two-col">
        <div><div class="xr-section-heading">Governance Actions</div>${xrList(GOVERNANCE_ACTIONS)}</div>
        <div><div class="xr-section-heading">Success Metrics</div>${xrList(SUCCESS_METRICS)}</div>
      </div>
      <div style="height:12px"></div>
      <div class="xr-section-heading">Implementation Roadmap</div>
      ${xrList(item.roadmap, 'steps')}
    </div>`
}

async function downloadUseCasesReport(insights: Insights) {
  const generatedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const reportId = `MM-ADM-${new Date().getFullYear()}-${String(insights.ai_use_cases.length * 173 % 10000).padStart(4, '0')}`

  const useCaseSections = insights.ai_use_cases.map((item, index) => buildUseCaseSection(item, index)).join('<div style="height:18px"></div>')

  const bodyHtml = `
<div class="page">
  ${xrHeader({ industry: 'All Industries', generatedDate, reportId })}
  ${xrBriefTitle('AI-Derived Use Cases Report', ['Platform-Wide', `${insights.ai_use_cases.length} Use Cases Found`, String(insights.summary.most_used_feature || '')])}
  ${buildAdminVisualSummary(insights)}
  <div style="height:18px"></div>
  ${useCaseSections}
  ${xrFooter('Admin Report', generatedDate)}
</div>`
  await downloadHtmlAsPdf(bodyHtml, EXEC_REPORT_STYLES, 'ai-derived-use-cases-report.pdf')
}
export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, authenticated, loading, logout } = useAuth()
  const [insights, setInsights] = useState<Insights | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloadingReport, setDownloadingReport] = useState(false)
  const [downloadingUsersCsv, setDownloadingUsersCsv] = useState(false)
  const [usersCsvError, setUsersCsvError] = useState<string | null>(null)

  const handleDownloadUseCasesReport = async () => {
    if (!insights) return
    setDownloadingReport(true)
    try {
      await downloadUseCasesReport(insights)
    } finally {
      setDownloadingReport(false)
    }
  }

  const handleDownloadUsersCsv = async () => {
    setDownloadingUsersCsv(true)
    setUsersCsvError(null)
    try {
      const res = await fetch('/api/admin/users/export', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.message || 'Unable to load user export')

      const rows: ExportedUser[] = data.users || []
      const csv = Papa.unparse(rows.map((row) => ({
        'User ID': row.id,
        'Name': row.name,
        'Email': row.email,
        'Company': row.company_name,
        'Job Title': row.job_title,
        'Department': row.department,
        'Country': row.country,
        'Industry': row.industry,
        'Company Size': row.company_size,
        'Annual Revenue': row.annual_revenue,
        'API Maturity': row.api_maturity,
        'Primary Objectives': row.primary_objectives,
        'API Gateway': row.api_gateway,
        'APIs Managed': row.apis_managed,
        'Team Size': row.team_size,
        'Persona': row.persona,
        'Preferred Pricing Model': row.preferred_pricing_model,
        'Monetization Readiness Score': row.monetization_readiness_score,
        'Features Used': row.features_used,
        'Assessments Completed': row.assessments_completed,
        'Reports Downloaded': row.reports_downloaded,
        'Files Uploaded': row.files_uploaded,
        'Last Activity (UTC)': row.last_activity_at || '',
      })))

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `monetizemate-users-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      setUsersCsvError(err instanceof Error ? err.message : 'Unable to export users.')
    } finally {
      setDownloadingUsersCsv(false)
    }
  }

  useEffect(() => {
    if (loading) return
    if (!authenticated) return router.push('/admin/login')
    if (!user?.is_admin) router.push('/dashboard')
  }, [authenticated, loading, router, user?.is_admin])

  useEffect(() => {
    if (!user?.is_admin) return
    fetch('/api/admin/insights', { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || data.message || 'Unable to load admin insights')
        setInsights(data)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load admin insights'))
  }, [user?.is_admin])

  const handleLogout = async () => {
    await logout()
    router.push('/admin/login')
  }

  if (loading || !user?.is_admin) return <main className="admin-page"><p className="admin-loading">Loading admin dashboard...</p></main>

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <div className="admin-brand"><ShieldCheck /><div><p>MonetizeMate Admin</p><span>{user.email}</span></div></div>
        <Button variant="outline" onClick={handleLogout} className="admin-logout"><LogOut className="h-4 w-4 mr-2" />Logout</Button>
      </header>

      <section className="admin-hero">
        <p className="admin-kicker">Platform Overview</p>
        <h1>Admin Insights</h1>
        <p className="admin-subtitle">Activity, user personas, industry patterns, feature adoption, and derived monetization use cases.</p>
        {insights && <div className="hero-fact"><span>Most used feature</span><strong>{insights.summary.most_used_feature || 'No usage yet'}</strong></div>}
      </section>

      {error && <div className="admin-error">{error}</div>}

      {insights && <>
        <section className="admin-summary">
          {overviewCards.map(([key, label, Icon]) => <Card key={key} className="metric-card"><Icon /><div><span>{label}</span><strong>{valueWithSuffix(key, insights.summary[key])}</strong></div></Card>)}
        </section>

        <section className="admin-grid two-wide">
          <Card className="admin-panel chart-panel">
            <h2>Activity on MonetizeMate</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={insights.activity_timeline} margin={{ top: 12, right: 20, left: 4, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8e0ea" />
                <XAxis dataKey="date" stroke="#526171" fontSize={11} tickMargin={8} />
                <YAxis stroke="#526171" fontSize={11} allowDecimals={false} tickMargin={8} />
                <Tooltip contentStyle={{ background: '#fff', color: '#0b1523', border: '1px solid #cbd5e1', borderRadius: 8 }} />
                <Bar dataKey="recommendations" name="Assessments" fill="#007d6f" radius={[5, 5, 0, 0]} />
                <Bar dataKey="uploads" name="Uploads" fill="#2563eb" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="admin-panel">
            <h2>Industry Distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart><Pie data={insights.industry_distribution} dataKey="percentage" nameKey="label" innerRadius={54} outerRadius={86}>{insights.industry_distribution.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
            <BarList items={insights.industry_distribution.slice(0, 7)} />
          </Card>
        </section>

        <section className="admin-grid three">
          <Card className="admin-panel"><h2>Company Size</h2><BarList items={insights.company_size_distribution} /></Card>
          <Card className="admin-panel"><h2>API Maturity Level</h2><BarList items={insights.api_maturity_distribution} /></Card>
          <Card className="admin-panel"><h2>Country Distribution</h2><BarList items={insights.country_distribution} /></Card>
        </section>

        <section className="admin-grid three">
          <Card className="admin-panel"><h2>Personas</h2><BarList items={insights.persona_distribution} /></Card>
          <Card className="admin-panel"><h2>Business Objectives</h2><BarList items={insights.business_objectives} /></Card>
          <Card className="admin-panel"><h2>Preferred Pricing Model</h2><BarList items={insights.preferred_pricing_models} /></Card>
        </section>

        <section className="admin-grid two">
          <Card className="admin-panel"><h2>Common API Types</h2><BarList items={insights.common_api_types} /></Card>
          <Card className="admin-panel"><h2>API Gateway Usage</h2><BarList items={insights.api_gateway_distribution} /></Card>
        </section>

        <Card className="admin-panel feature-panel">
          <h2>Feature Usage and Report Activity</h2>
          <div className="feature-table">
            <div className="feature-row feature-head"><span>Feature</span><span>Opened</span><span>Completed</span><span>Time Spent</span><span>Reports</span><span>Downloads</span></div>
            {insights.feature_metrics.map((item) => <div key={item.feature} className="feature-row"><span>{item.feature}</span><span>{item.opened}</span><span>{item.completed}</span><span>{item.time_spent}</span><span>{item.reports_generated}</span><span>{item.downloads}</span></div>)}
          </div>
        </Card>

        <Card className="admin-panel usecase-panel">
          <div className="panel-heading">
            <h2>AI-Derived Use Cases Report</h2>
            <Button variant="outline" onClick={handleDownloadUseCasesReport} className="download-report" disabled={!insights.ai_use_cases.length || downloadingReport}>
              {downloadingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {downloadingReport ? 'Generating PDF…' : 'Download PDF'}
            </Button>
          </div>
          <div className="usecase-grid">
            {insights.ai_use_cases.length ? insights.ai_use_cases.map((item) => <article key={item.use_case} className="usecase-card"><div><p>{item.industry}</p><h3>{item.use_case}</h3></div><dl><dt>Users</dt><dd>{item.customer_count}</dd><dt>Strategic Priority</dt><dd>{item.revenue_potential}</dd><dt>Model</dt><dd>{item.recommended_model}</dd><dt>Target Users</dt><dd>{item.target_buyers || 'Not enough signal yet.'}</dd></dl><p className="value-prop">{item.value_proposition || 'More use-case detail will appear as customers complete assessments.'}</p><p className="challenge"><strong>High Level Requirement</strong>{item.common_challenges}</p><div className="insight-columns narrative"><section><h4>Current State</h4><p>{item.current_state || 'API capabilities are handled through fragmented integrations and limited governance.'}</p></section><section><h4>Key Challenges</h4><p>{item.key_challenges || item.common_challenges}</p></section><section><h4>Monetize Mate Recommendation</h4><p>{item.monetizemate_recommendation || item.value_proposition || 'Create a governed API management layer and standardize reusable domain APIs.'}</p></section></div><h4>Roadmap</h4><ol>{item.roadmap.map((step) => <li key={step}>{step}</li>)}</ol></article>) : <p className="empty">Use cases will appear after users sign up or complete assessments.</p>}
          </div>
        </Card>

        <Card className="admin-panel">
          <div className="panel-heading">
            <h2>Recent Activity</h2>
            <span className="panel-subnote">Last 5</span>
          </div>
          <div className="activity-table">
            {insights.recent_activity.length ? insights.recent_activity.map((item) => <div key={item.id} className="activity-row"><span>{item.user?.name || 'User'}</span><span>{item.industry || 'Unspecified'}</span><span>{item.persona || item.use_case || 'Assessment'}</span><span>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</span></div>) : <p className="empty">No recent activity yet.</p>}
          </div>
        </Card>

        <Card className="admin-panel">
          <div className="panel-heading">
            <div>
              <h2>Export All Users</h2>
              <p className="panel-description">Download a CSV of every registered user - account details, industry, persona, and which features they've used.</p>
            </div>
            <Button variant="outline" onClick={handleDownloadUsersCsv} className="download-report" disabled={downloadingUsersCsv}>
              {downloadingUsersCsv ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {downloadingUsersCsv ? 'Preparing CSV…' : 'Download CSV'}
            </Button>
          </div>
          {usersCsvError && <div className="admin-error">{usersCsvError}</div>}
        </Card>
      </>}

      <style>{`
        .admin-page { min-height: 100vh; background: #eef3f8; color: #111827; font-family: 'DM Sans', Arial, system-ui, sans-serif; padding: 28px 24px 56px; }
        .admin-loading { min-height: 100vh; display: grid; place-items: center; color: #475569; }
        .admin-topbar, .admin-hero, .admin-summary, .admin-grid, .admin-page > .admin-panel { max-width: 1320px; margin-left: auto; margin-right: auto; }
        .admin-topbar { min-height: 56px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
        .admin-brand { display: flex; align-items: center; gap: 12px; } .admin-brand > svg { width: 40px; height: 40px; padding: 8px; border-radius: 8px; color: #006b5f; background: #d7f7ef; border: 1px solid #7ddfcd; }
        .admin-brand p { margin: 0; color: #1f2937; font-size: 15px; font-weight: 800; } .admin-brand span { color: #475569; font-size: 13px; }
        .admin-logout { height: 36px !important; border-color: #94a3b8 !important; color: #0f172a !important; background: #fff !important; }
        .admin-hero { position: relative; margin-bottom: 18px; padding: 22px 24px; background: #fff; border: 1px solid #cbd5e1; border-left: 6px solid #007d6f; border-radius: 8px; box-shadow: 0 8px 20px rgba(15,23,42,.06); }
        .admin-kicker { color: #007d6f; margin: 0 0 6px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; font-size: 12px; } .admin-hero h1 { margin: 0; color: #0f172a; font-size: 36px; font-weight: 900; } .admin-subtitle { max-width: 760px; margin: 8px 0 0; color: #475569; line-height: 1.55; }
        .hero-fact { position: absolute; right: 24px; top: 24px; display: grid; gap: 4px; text-align: right; } .hero-fact span { color: #64748b; font-size: 12px; font-weight: 800; } .hero-fact strong { color: #007d6f; font-size: 18px; }
        .admin-error { max-width: 1320px; margin: 0 auto 18px; padding: 12px 14px; border: 1px solid #f87171; border-radius: 8px; color: #7f1d1d; background: #fef2f2; font-weight: 700; }
        .admin-summary { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px; margin-bottom: 18px; align-items: stretch; }
        .metric-card, .admin-panel { border: 1px solid #cbd5e1 !important; background: #fff !important; color: #111827 !important; border-radius: 8px !important; box-shadow: 0 8px 20px rgba(15,23,42,.06); }
        .metric-card { min-height: 116px; padding: 18px !important; display: grid; grid-template-columns: 34px 1fr; gap: 12px; align-items: center; } .metric-card svg { color: #007d6f; width: 26px; height: 26px; } .metric-card span { display: block; color: #334155; font-size: 12px; font-weight: 800; } .metric-card strong { display: block; color: #020617; font-size: 28px; margin-top: 6px; font-weight: 900; }
        .admin-grid { display: grid; gap: 18px; margin-bottom: 18px; align-items: stretch; } .admin-grid.two-wide { grid-template-columns: minmax(0, 1.45fr) minmax(360px, .85fr); } .admin-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); } .admin-grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .admin-panel { width: 100%; padding: 22px !important; } .admin-panel h2 { margin: 0 0 16px; color: #0f172a; font-size: 19px; font-weight: 900; }
        .panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 16px; } .panel-heading h2 { margin: 0; }
        .panel-subnote { color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
        .panel-description { margin: 6px 0 0; max-width: 480px; color: #475569; font-size: 13px; line-height: 1.5; }
        .download-report { height: 36px !important; border-color: #007d6f !important; color: #006b5f !important; background: #fff !important; font-weight: 800 !important; } .download-report:hover:not(:disabled) { background: #e7f6f3 !important; } .download-report:disabled { opacity: .55; cursor: not-allowed; }
        .bar-list { display: grid; gap: 11px; } .bar-item div { display: flex; justify-content: space-between; gap: 10px; color: #1f2937; font-size: 13px; font-weight: 800; } .bar-item strong { color: #006b5f; } .bar-item i { display: block; height: 9px; border-radius: 999px; background: #e2e8f0; margin-top: 6px; overflow: hidden; } .bar-item b { display: block; height: 100%; border-radius: inherit; background: #007d6f; }
        .feature-table { display: grid; gap: 8px; } .feature-row { display: grid; grid-template-columns: 1.2fr .55fr .7fr 1.2fr .65fr .65fr; gap: 10px; align-items: center; padding: 12px; border-radius: 8px; background: #f8fafc; border: 1px solid #dbe4ef; color: #334155; font-size: 13px; } .feature-head { background: #e7f6f3; color: #0f172a; font-weight: 900; }
        .usecase-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: stretch; } .usecase-card { border: 1px solid #dbe4ef; background: #f8fafc; border-radius: 8px; padding: 16px; } .usecase-card p { margin: 0; color: #64748b; font-size: 12px; font-weight: 800; } .usecase-card h3 { margin: 4px 0 14px; color: #0f172a; font-size: 17px; } .usecase-card h4 { margin: 12px 0 6px; color: #0f172a; font-size: 12px; font-weight: 900; text-transform: uppercase; } .usecase-card dl { display: grid; grid-template-columns: 120px 1fr; gap: 6px 12px; margin: 0 0 12px; } .usecase-card dt { color: #64748b; font-size: 12px; font-weight: 800; } .usecase-card dd { margin: 0; color: #0f172a; font-size: 13px; font-weight: 800; } .usecase-card .value-prop { color: #0f766e; background: #e7f6f3; border: 1px solid #b6e4db; border-radius: 8px; padding: 10px 12px; line-height: 1.45; margin-bottom: 10px; } .usecase-card .challenge { color: #334155; font-weight: 600; line-height: 1.45; margin-bottom: 10px; } .usecase-card .challenge strong { display: block; color: #0f172a; font-size: 12px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; } .insight-columns { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 12px 0; } .insight-columns section { border: 1px solid #dbe4ef; border-radius: 8px; background: #fff; padding: 10px; } .insight-columns.narrative p { color: #334155; font-size: 13px; font-weight: 600; line-height: 1.5; } .usecase-card ul, .usecase-card ol { margin: 0; padding-left: 18px; color: #334155; font-size: 13px; line-height: 1.5; }
        .activity-table { display: grid; gap: 8px; } .activity-row { display: grid; grid-template-columns: 1fr 1fr 1.3fr 190px; gap: 12px; padding: 12px 14px; border-radius: 8px; background: #f8fafc; border: 1px solid #dbe4ef; color: #334155; font-size: 14px; }
        .empty { margin: 0; color: #475569; font-size: 14px; line-height: 1.5; }
        @media (max-width: 1180px) { .admin-summary { grid-template-columns: repeat(3, minmax(0, 1fr)); } .admin-grid.two-wide, .admin-grid.three { grid-template-columns: 1fr; } .hero-fact { position: static; text-align: left; margin-top: 14px; } }
        @media (max-width: 760px) { .admin-page { padding: 18px 14px 36px; } .admin-topbar, .panel-heading { align-items: flex-start; gap: 14px; flex-direction: column; } .admin-summary, .admin-grid.two, .usecase-grid, .insight-columns { grid-template-columns: 1fr; } .feature-row, .activity-row { grid-template-columns: 1fr; } .download-report { width: 100%; } .admin-hero h1 { font-size: 30px; } }
      `}</style>
    </main>
  )
}












