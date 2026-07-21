'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, BarChart3, Building2, Download, FileText, Loader2, LogOut, ShieldCheck, Target, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { useAuth } from '@/app/hooks/useAuth'
import { downloadHtmlAsPdf } from '@/app/utils/pdf'

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

const USE_CASES_PDF_STYLES = `
  * { box-sizing: border-box; } body { font-family: Arial, sans-serif; color: #0f172a; padding: 22px; background: #fff; } h1 { margin: 0 0 4px; font-size: 24px; } h2 { margin: 0 0 10px; font-size: 18px; } h3 { margin: 9px 0 5px; font-size: 11px; text-transform: uppercase; letter-spacing: .02em; } p, li, dd, dt { font-size: 12px; line-height: 1.38; } p, li { color: #334155; } ul, ol { margin-top: 0; margin-bottom: 0; padding-left: 18px; } .meta { color: #526171; margin: 0 0 12px; } .usecase { border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin-bottom: 14px; } .industry { color: #007d6f; font-weight: 800; margin: 0 0 3px; } .metafacts { margin: 0 0 10px; } .dl-row { display: flex; gap: 12px; margin-bottom: 5px; break-inside: avoid; } .dl-row .k { width: 140px; flex-shrink: 0; color: #526171; font-weight: 800; font-size: 12px; } .dl-row .v { margin: 0; font-weight: 700; font-size: 12px; color: #0f172a; } .requirement { background: #e7f6f3; border: 1px solid #b6e4db; border-radius: 8px; padding: 9px 10px; margin-bottom: 10px; line-height: 1.38; break-inside: avoid; } .requirement strong { display: block; margin-bottom: 3px; } .grid { display: grid; gap: 8px; margin: 9px 0; } .grid.three { grid-template-columns: repeat(3, 1fr); } .grid.two { grid-template-columns: repeat(2, 1fr); } article { border: 1px solid #dbe4ef; border-radius: 8px; padding: 9px; break-inside: avoid; } .analysis-block { border-left: 4px solid #007d6f; padding: 7px 10px; background: #f8fafc; margin: 10px 0; break-inside: avoid; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0; break-inside: avoid; } .summary-tile { background: #e7f6f3; border: 1px solid #b6e4db; border-radius: 8px; padding: 10px; } .summary-tile span { display: block; color: #526171; font-size: 9.5px; font-weight: 800; text-transform: uppercase; margin-bottom: 5px; } .summary-tile strong { display: block; color: #007d6f; font-size: 17px; } .visual-card { border: 1px solid #dbe4ef; border-radius: 8px; padding: 10px; margin: 10px 0; break-inside: avoid; } .chart-row { display: grid; grid-template-columns: 145px 1fr 38px; gap: 8px; align-items: center; margin-bottom: 7px; font-size: 10.5px; color: #334155; } .chart-track { height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; display: block; } .chart-fill { height: 100%; display: block; border-radius: inherit; background: #007d6f; }
  .metric-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10.5px; break-inside: avoid; } .metric-table th { text-align: left; color: #526171; font-weight: 800; font-size: 9.5px; text-transform: uppercase; padding: 6px 8px; border-bottom: 2px solid #cbd5e1; } .metric-table td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; color: #334155; } .metric-table tr:last-child td { border-bottom: none; } .section-heading { font-size: 13px; font-weight: 800; color: #0f172a; border-left: 4px solid #007d6f; padding-left: 8px; margin: 16px 0 8px; }
`


function distributionBars(title: string, items: DistributionItem[]) {
  const rows = items.slice(0, 6).map((item, index) => `<div class="chart-row"><span>${escapeHtml(item.label)}</span><i class="chart-track"><b class="chart-fill" style="width:${Math.max(item.percentage, 4)}%;background:${colors[index % colors.length]}"></b></i><strong>${escapeHtml(item.percentage)}%</strong></div>`).join('')
  return `<div class="visual-card"><h3>${escapeHtml(title)}</h3>${rows || '<p>No data yet.</p>'}</div>`
}

// Pairs two distribution cards side by side. Each card is short and marked
// break-inside: avoid on its own, so pairing them is safe — unlike wrapping
// the whole summary section in one avoid block, which breaks pagination once
// the section grows taller than a page (see .usecase fix above).
function chartPair(a: string, b: string) {
  return `<div class="grid two">${a}${b}</div>`
}

function featureAdoptionTable(features: FeatureMetric[]) {
  if (!features.length) return ''
  const rows = features.map((f) => `<tr><td>${escapeHtml(f.feature)}</td><td>${escapeHtml(f.opened)}</td><td>${escapeHtml(f.completed)}</td><td>${escapeHtml(f.time_spent)}</td><td>${escapeHtml(f.reports_generated)}</td><td>${escapeHtml(f.downloads)}</td></tr>`).join('')
  return `
    <div class="section-heading">Feature Usage &amp; Report Activity</div>
    <table class="metric-table">
      <thead><tr><th>Feature</th><th>Opened</th><th>Completed</th><th>Time Spent</th><th>Reports</th><th>Downloads</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
}

function buildAdminVisualSummary(insights: Insights) {
  return `
    <section>
      <h2>Visual Platform Snapshot</h2>
      <div class="summary-grid">
        <div class="summary-tile"><span>Total Users</span><strong>${escapeHtml(insights.summary.total_users)}</strong></div>
        <div class="summary-tile"><span>Companies</span><strong>${escapeHtml(insights.summary.companies)}</strong></div>
        <div class="summary-tile"><span>Assessments</span><strong>${escapeHtml(insights.summary.assessments_completed)}</strong></div>
        <div class="summary-tile"><span>Reports</span><strong>${escapeHtml(insights.summary.reports_generated)}</strong></div>
      </div>
      <div class="summary-grid">
        <div class="summary-tile"><span>Avg Completion</span><strong>${escapeHtml(insights.summary.average_completion_rate)}%</strong></div>
        <div class="summary-tile"><span>Readiness Score</span><strong>${escapeHtml(insights.summary.monetization_readiness_score)}%</strong></div>
        <div class="summary-tile"><span>Use Cases Found</span><strong>${insights.ai_use_cases.length}</strong></div>
        <div class="summary-tile"><span>Most Used Feature</span><strong style="font-size:13px">${escapeHtml(insights.summary.most_used_feature || '—')}</strong></div>
      </div>
      <div class="section-heading">Platform Distribution</div>
      ${chartPair(distributionBars('Industry Mix', insights.industry_distribution), distributionBars('Company Size', insights.company_size_distribution))}
      ${chartPair(distributionBars('API Maturity Level', insights.api_maturity_distribution), distributionBars('Country Distribution', insights.country_distribution))}
      ${chartPair(distributionBars('Personas', insights.persona_distribution), distributionBars('Preferred Pricing Models', insights.preferred_pricing_models))}
      ${chartPair(distributionBars('Common API Types', insights.common_api_types), distributionBars('API Gateway Usage', insights.api_gateway_distribution))}
      ${distributionBars('Business Objectives', insights.business_objectives)}
      ${featureAdoptionTable(insights.feature_metrics)}
    </section>`
}

async function downloadUseCasesReport(insights: Insights) {
  const useCaseSections = insights.ai_use_cases.map((item, index) => `
    <section class="usecase">
      <p class="industry">${escapeHtml(item.industry)}</p>
      <h2>${index + 1}. ${escapeHtml(item.use_case)}</h2>
      <div class="metafacts">
        <div class="dl-row"><span class="k">Users</span><span class="v">${escapeHtml(item.customer_count)}</span></div>
        <div class="dl-row"><span class="k">Strategic Priority</span><span class="v">${escapeHtml(item.revenue_potential)}</span></div>
        <div class="dl-row"><span class="k">Model</span><span class="v">${escapeHtml(item.recommended_model)}</span></div>
        <div class="dl-row"><span class="k">Target Users</span><span class="v">${escapeHtml(item.target_buyers || 'Not enough signal yet.')}</span></div>
      </div>
      <div class="requirement"><strong>High Level Requirement</strong>${escapeHtml(item.common_challenges)}</div>
      <div class="grid three">
        <article><h3>Current State</h3><p>${escapeHtml(item.current_state || 'API capabilities are handled through fragmented integrations and limited governance.')}</p></article>
        <article><h3>Key Challenges</h3><p>${escapeHtml(item.key_challenges || item.common_challenges)}</p></article>
        <article><h3>Monetize Mate Recommendation</h3><p>${escapeHtml(item.monetizemate_recommendation || item.value_proposition || 'Create a governed API management layer and standardize reusable domain APIs.')}</p></article>
      </div>
      <div class="analysis-block">
        <h3>AI Opportunity Analysis</h3>
        <p>This use case is prioritized because it combines visible user demand with a repeatable API product pattern. Monetize Mate's AI interpretation suggests the organization should move from ad hoc integration delivery toward governed, reusable API capabilities that can be packaged, secured, measured, and extended into partner or AI-enabled workflows.</p>
        <p>The recommended model should be treated as an operating model as much as a pricing model: define ownership, access policies, service levels, usage visibility, and adoption targets before scaling consumption across teams or external users.</p>
      </div>
      <div class="grid two">
        <article><h3>Governance Actions</h3><ul><li>Assign an API product owner and platform owner.</li><li>Define API standards, approval flow, security controls, and lifecycle stages.</li><li>Create reusable domain APIs before adding new point-to-point integrations.</li><li>Publish APIs through a managed catalog or developer portal.</li></ul></article>
        <article><h3>Success Metrics</h3><ul><li>Active users and consuming applications.</li><li>API reuse rate across domains and partners.</li><li>Integration delivery cycle time reduction.</li><li>Error rate, latency, SLA adherence, and support volume.</li><li>Revenue, cost avoidance, or productivity impact by API product.</li></ul></article>
      </div>
      <h3>Implementation Roadmap</h3>
      <ol>${item.roadmap.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
    </section>
  `).join('')

  const bodyHtml = `<h1>AI-Derived Use Cases Report</h1><p class="meta">Generated ${escapeHtml(new Date().toLocaleString())}</p>${buildAdminVisualSummary(insights)}${useCaseSections}`
  await downloadHtmlAsPdf(bodyHtml, USE_CASES_PDF_STYLES, 'ai-derived-use-cases-report.pdf')
}
export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, authenticated, loading, logout } = useAuth()
  const [insights, setInsights] = useState<Insights | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloadingReport, setDownloadingReport] = useState(false)

  const handleDownloadUseCasesReport = async () => {
    if (!insights) return
    setDownloadingReport(true)
    try {
      await downloadUseCasesReport(insights)
    } finally {
      setDownloadingReport(false)
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
          <h2>Recent Activity</h2>
          <div className="activity-table">
            {insights.recent_activity.length ? insights.recent_activity.map((item) => <div key={item.id} className="activity-row"><span>{item.user?.name || 'User'}</span><span>{item.industry || 'Unspecified'}</span><span>{item.persona || item.use_case || 'Assessment'}</span><span>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</span></div>) : <p className="empty">No recent activity yet.</p>}
          </div>
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












