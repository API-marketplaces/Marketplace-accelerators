'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
type TimeFilter = '1d' | '7d' | '30d' | '90d'
type TabId = 'overview' | 'analysis' | 'temporal' | 'clients' | 'distribution' | 'rankings'

interface OverviewData {
  total_requests: number
  successful_requests: number
  errors: number
  avg_response_time: number | null
  daily_usage: { date: string; total_requests: number; errors: number }[]
}

interface AnalysisData {
  top_5_apis_by_consumption: { endpoint: string; total_requests: number }[]
  apis_with_most_errors: { endpoint: string; error_requests: number }[]
}

interface TemporalData {
  daily_request_volume: { date: string; total_requests: number }[]
  hourly_call_distribution: { hour: number; total_requests: number }[]
}

interface ClientsData {
  top_consumers: { client_id: string; total_requests: number }[]
}

interface DistributionData {
  geographic_distribution: { geo: string; count: number }[]
  brand_distribution: { brand: string; count: number }[]
  partner_distribution: { partner: string; count: number }[]
  team_distribution: { team: string; count: number }[]
}

interface RankingsData {
  top_20_clients: { client_id: string; total_requests: number }[]
  top_20_apis_accessed: { endpoint: string; total_requests: number }[]
  top_20_failed_apis: { endpoint: string; error_requests: number }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ACCENT = '#00E5C0'
const ACCENT_DIM = 'rgba(0,229,192,0.12)'

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

function BarChart({ data, valueKey, labelKey, color = ACCENT }: {
  data: Record<string, number | string>[]
  valueKey: string
  labelKey: string
  color?: string
}) {
  if (!data?.length) return <Empty />
  const max = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.map((item, i) => {
        const pct = (Number(item[valueKey]) / max) * 100
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '140px', fontSize: '12px', color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>
              {String(item[labelKey])}
            </div>
            <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ width: '60px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>
              {fmt(Number(item[valueKey]))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Sparkline({ data, valueKey, labelKey, color = ACCENT }: {
  data: Record<string, number | string>[]
  valueKey: string
  labelKey?: string
  color?: string
}) {
  if (!data?.length) return <Empty />
  const values = data.map(d => Number(d[valueKey]) || 0)
  const max = Math.max(...values, 1)
  const w = 600, h = 120
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * (h - 10)}`)
  const polyline = pts.join(' ')
  const area = `0,${h} ${polyline} ${w},${h}`
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${w} ${h + 20}`} style={{ width: '100%', minWidth: '300px', height: '140px' }}>
        <defs>
          <linearGradient id={`grad-${valueKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#grad-${valueKey})`} />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        {values.map((v, i) => (
          <circle key={i} cx={(i / (values.length - 1)) * w} cy={h - (v / max) * (h - 10)} r="3" fill={color} opacity={0.7} />
        ))}
        {labelKey && data.length <= 14 && data.map((d, i) => (
          <text key={i} x={(i / (data.length - 1)) * w} y={h + 16} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)">
            {String(d[labelKey]).slice(5)}
          </text>
        ))}
      </svg>
    </div>
  )
}

function HourlyBars({ data }: { data: { hour: number; total_requests: number }[] }) {
  if (!data?.length) return <Empty />
  const full = Array.from({ length: 24 }, (_, h) => {
    const found = data.find(d => d.hour === h)
    return { hour: h, total_requests: found?.total_requests ?? 0 }
  })
  const max = Math.max(...full.map(d => d.total_requests), 1)
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '80px' }}>
      {full.map(d => (
        <div key={d.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '100%', height: `${(d.total_requests / max) * 60}px`, background: ACCENT, borderRadius: '3px 3px 0 0', opacity: d.total_requests > 0 ? 0.7 + (d.total_requests / max) * 0.3 : 0.15, transition: 'height 0.5s ease', minHeight: '2px' }} />
          {d.hour % 6 === 0 && <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{d.hour}h</div>}
        </div>
      ))}
    </div>
  )
}

function DistGrid({ items, labelKey, countKey }: { items: Record<string, string | number>[]; labelKey: string; countKey: string }) {
  if (!items?.length) return <Empty />
  const max = Math.max(...items.map(d => Number(d[countKey])), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {items.slice(0, 10).map((item, i) => {
        const pct = (Number(item[countKey]) / max) * 100
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '18px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${ACCENT}, #1ABFA3)`, borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', minWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(item[labelKey])}</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', minWidth: '50px', textAlign: 'right' }}>{fmt(Number(item[countKey]))}</span>
          </div>
        )
      })}
    </div>
  )
}

function RankTable({ rows, cols }: { rows: Record<string, string | number>[]; cols: { key: string; label: string; mono?: boolean }[] }) {
  if (!rows?.length) return <Empty />
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr>
            <th style={{ width: '32px', padding: '8px', textAlign: 'left', color: 'rgba(255,255,255,0.3)', fontWeight: '500', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>#</th>
            {cols.map(c => (
              <th key={c.key} style={{ padding: '8px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.3)', fontWeight: '500', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 20).map((row, i) => (
            <tr key={i}
              style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
              onMouseEnter={e => (e.currentTarget.style.background = ACCENT_DIM)}
              onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)')}
            >
              <td style={{ padding: '8px', color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>{i + 1}</td>
              {cols.map(c => (
                <td key={c.key} style={{ padding: '8px 12px', color: c.mono ? ACCENT : 'rgba(255,255,255,0.75)', fontFamily: c.mono ? 'monospace' : 'inherit', fontSize: c.mono ? '12px' : '13px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {c.key.includes('request') || c.key.includes('error') ? fmt(Number(row[c.key])) : String(row[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Empty() {
  return <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>No data available for this period</div>
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: `3px solid rgba(0,229,192,0.12)`, borderTop: `3px solid ${ACCENT}`, animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.8)' }}>{title}</span>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  )
}

function StatTile({ label, value, sub, color = '#fff' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px 24px' }}>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px', textTransform: 'uppercase' as const, marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '800', color, letterSpacing: '-0.5px', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

// ─── Inner page (uses useSearchParams) ────────────────────────────────────────
function AnalyticsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileId = searchParams.get('fileId') ?? ''

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [overviewData, setOverviewData] = useState<OverviewData | null>(null)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [temporalData, setTemporalData] = useState<TemporalData | null>(null)
  const [clientsData, setClientsData] = useState<ClientsData | null>(null)
  const [distributionData, setDistributionData] = useState<DistributionData | null>(null)
  const [rankingsData, setRankingsData] = useState<RankingsData | null>(null)

  const fetchTab = useCallback(async (tab: TabId, tf: TimeFilter) => {
    if (!fileId) return
    setLoading(true)
    setError(null)
    const endpoint = `/api/analytics/${tab}?fileId=${fileId}&time_filter=${tf}`
    try {
      const res = await fetch(endpoint)
      if (!res.ok) { setError(`Failed to load ${tab} data (${res.status})`); setLoading(false); return }
      const data = await res.json()
      if (tab === 'overview') setOverviewData(data)
      else if (tab === 'analysis') setAnalysisData(data)
      else if (tab === 'temporal') setTemporalData(data)
      else if (tab === 'clients') setClientsData(data)
      else if (tab === 'distribution') setDistributionData(data)
      else if (tab === 'rankings') setRankingsData(data)
    } catch {
      setError('Network error — is the backend running?')
    }
    setLoading(false)
  }, [fileId])

  useEffect(() => { fetchTab(activeTab, timeFilter) }, [activeTab, timeFilter, fetchTab])

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '◎' },
    { id: 'analysis', label: 'Analysis', icon: '⬡' },
    { id: 'temporal', label: 'Temporal', icon: '◷' },
    { id: 'clients', label: 'Clients', icon: '◈' },
    { id: 'distribution', label: 'Distribution', icon: '◉' },
    { id: 'rankings', label: 'Rankings', icon: '▲' },
  ]

  const timeFilters: { v: TimeFilter; l: string }[] = [
    { v: '1d', l: '1D' }, { v: '7d', l: '7D' }, { v: '30d', l: '30D' }, { v: '90d', l: '90D' },
  ]

  return (
    <div className="analytics-legacy-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #060E1E 0%, #0A1628 50%, #071420 100%)', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#fff' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(0,229,192,0.08)', background: 'rgba(6,14,30,0.9)', backdropFilter: 'blur(20px)', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
        <div onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #00E5C0, #1ABFA3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '800', color: '#060E1E' }}>M</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', lineHeight: 1.2 }}>MonetizeMate</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px' }}>API Analytics</div>
          </div>
        </div>
        <button onClick={() => router.push('/dashboard/upload?decisionMetrics=analytics')}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '6px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
        >← Back to Upload</button>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }} />
              <span style={{ fontSize: '11px', fontWeight: '700', color: ACCENT, letterSpacing: '1px', textTransform: 'uppercase' }}>Live Analysis</span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff' }}>API Analytics Dashboard</h1>
          </div>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '4px' }}>
            {timeFilters.map(tf => (
              <button key={tf.v} onClick={() => setTimeFilter(tf.v)}
                style={{ padding: '6px 14px', borderRadius: '7px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: timeFilter === tf.v ? 'linear-gradient(135deg, #00E5C0, #1ABFA3)' : 'transparent', color: timeFilter === tf.v ? '#060E1E' : 'rgba(255,255,255,0.45)' }}
              >{tf.l}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2px', marginBottom: '28px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '4px', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '9px', border: 'none', fontSize: '13px', fontWeight: activeTab === tab.id ? '700' : '500', cursor: 'pointer', whiteSpace: 'nowrap', background: activeTab === tab.id ? 'linear-gradient(135deg, #00E5C0, #1ABFA3)' : 'transparent', color: activeTab === tab.id ? '#060E1E' : 'rgba(255,255,255,0.5)' }}
            >
              <span style={{ fontSize: '14px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '12px', padding: '16px 20px', color: '#f87171', fontSize: '13px', marginBottom: '24px' }}>
            ⚠ {error}
          </div>
        )}

        {loading ? <Spinner /> : (
          <>
            {activeTab === 'overview' && overviewData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  <StatTile label="Total Requests" value={fmt(overviewData.total_requests)} color={ACCENT} />
                  <StatTile label="Successful" value={fmt(overviewData.successful_requests)} color="#4ade80" sub={`${overviewData.total_requests ? ((overviewData.successful_requests / overviewData.total_requests) * 100).toFixed(1) : 0}% success rate`} />
                  <StatTile label="Errors" value={fmt(overviewData.errors)} color="#f87171" sub={`${overviewData.total_requests ? ((overviewData.errors / overviewData.total_requests) * 100).toFixed(1) : 0}% error rate`} />
                  <StatTile label="Avg Response" value={overviewData.avg_response_time ? `${Math.round(overviewData.avg_response_time)}ms` : '—'} color="#facc15" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Card title="Daily Request Volume"><Sparkline data={overviewData.daily_usage} valueKey="total_requests" labelKey="date" /></Card>
                  <Card title="Daily Errors"><Sparkline data={overviewData.daily_usage} valueKey="errors" labelKey="date" color="#f87171" /></Card>
                </div>
              </div>
            )}
            {activeTab === 'analysis' && analysisData && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Card title="Top 5 APIs by Consumption"><BarChart data={analysisData.top_5_apis_by_consumption} valueKey="total_requests" labelKey="endpoint" /></Card>
                <Card title="APIs with Most Errors"><BarChart data={analysisData.apis_with_most_errors} valueKey="error_requests" labelKey="endpoint" color="#f87171" /></Card>
              </div>
            )}
            {activeTab === 'temporal' && temporalData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Card title="Daily Request Volume"><Sparkline data={temporalData.daily_request_volume} valueKey="total_requests" labelKey="date" /></Card>
                <Card title="Hourly Call Distribution"><HourlyBars data={temporalData.hourly_call_distribution} /></Card>
              </div>
            )}
            {activeTab === 'clients' && clientsData && (
              <Card title="Top API Consumers"><BarChart data={clientsData.top_consumers.slice(0, 15)} valueKey="total_requests" labelKey="client_id" /></Card>
            )}
            {activeTab === 'distribution' && distributionData && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Card title="Geographic Distribution"><DistGrid items={distributionData.geographic_distribution} labelKey="geo" countKey="count" /></Card>
                <Card title="Brand Distribution"><DistGrid items={distributionData.brand_distribution} labelKey="brand" countKey="count" /></Card>
                <Card title="Partner Distribution"><DistGrid items={distributionData.partner_distribution} labelKey="partner" countKey="count" /></Card>
                <Card title="Team Distribution"><DistGrid items={distributionData.team_distribution} labelKey="team" countKey="count" /></Card>
              </div>
            )}
            {activeTab === 'rankings' && rankingsData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Card title="Top 20 Clients by Requests"><RankTable rows={rankingsData.top_20_clients} cols={[{ key: 'client_id', label: 'Client ID', mono: true }, { key: 'total_requests', label: 'Requests' }]} /></Card>
                <Card title="Top 20 APIs Accessed"><RankTable rows={rankingsData.top_20_apis_accessed} cols={[{ key: 'endpoint', label: 'Endpoint', mono: true }, { key: 'total_requests', label: 'Requests' }]} /></Card>
                <Card title="Top 20 Failed APIs"><RankTable rows={rankingsData.top_20_failed_apis} cols={[{ key: 'endpoint', label: 'Endpoint', mono: true }, { key: 'error_requests', label: 'Error Requests' }]} /></Card>
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  )
}

// ─── Default export wrapped in Suspense ───────────────────────────────────────
export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="analytics-legacy-page" style={{ minHeight: '100vh', background: '#060E1E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00E5C0', fontFamily: 'system-ui', fontSize: '16px' }}>
        Loading…
      </div>
    }>
      <AnalyticsPageInner />
    </Suspense>
  )
}
