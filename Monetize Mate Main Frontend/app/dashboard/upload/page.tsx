'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import FileUpload from '../../components/FileUpload'
import { useFileHandler } from '../../hooks/useFileHandler'
import { useAuth } from '../../hooks/useAuth'
import { UploadedFile } from '../../types/UploadedFile'

// Route map: after file selected, go to the right dashboard page
const ROUTE_MAP: Record<string, (id: string) => string> = {
  analytics:  (id) => `/dashboard/api-stats/${id}`,
  prediction: (id) => `/dashboard/prediction/${id}`,
  strategy:   (id) => `/dashboard/strategy-adviser`,
}

const TITLE_MAP: Record<string, { heading: string; sub: string; icon: string }> = {
  analytics:  { heading: 'API Analytics', sub: 'Upload a CSV/Excel file to analyse your API usage data', icon: '⬡' },
  prediction: { heading: 'ML Predictions', sub: 'Upload a file to run anomaly detection and forecasting', icon: '◈' },
  strategy:   { heading: 'Strategy Advisor', sub: 'Upload your data to get a personalised monetisation strategy', icon: '◎' },
}

function UploadPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const decisionMetrics = searchParams.get('decisionMetrics') || 'analytics'

  const { user } = useAuth()

  const {
    uploadedFiles,
    handleFileUpload,
    handleFileDelete,
    handleFileDownload,
    handleFileUpdate,
    isLoading,
  } = useFileHandler(decisionMetrics)

  const meta = TITLE_MAP[decisionMetrics] ?? TITLE_MAP.analytics

  const handleFileSelect = (fileId: string) => {
    const dest = ROUTE_MAP[decisionMetrics]
    if (dest) router.push(dest(fileId))
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #060E1E 0%, #0A1628 40%, #0D2035 70%, #071420 100%)',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: '#fff',
    }}>
      {/* NAV */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: '68px',
        borderBottom: '1px solid rgba(0,229,192,0.1)',
        backdropFilter: 'blur(12px)',
        background: 'rgba(6,14,30,0.7)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.push('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #00E5C0, #1ABFA3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: '800', color: '#060E1E' }}>M</div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#fff', lineHeight: '1.15' }}>MonetizeMate</div>
              <div style={{ fontSize: '10px', fontWeight: '500', color: 'rgba(0,229,192,0.65)' }}>AI-Powered API Monetization</div>
            </div>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '1px', height: '36px', background: 'rgba(0,229,192,0.15)' }} />
          <img src="/nagarro-logo.png" alt="Nagarro" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
        </div>
      </nav>

      {/* SUB-BAR: user avatar / auth buttons */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        padding: '8px 48px',
        borderBottom: '1px solid rgba(0,229,192,0.06)',
        background: 'rgba(6,14,30,0.4)',
        backdropFilter: 'blur(8px)',
        gap: '10px',
      }}>
        {user ? (
          <>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #00E5C0, #1ABFA3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '800', color: '#060E1E',
            }}>
              {user.name
                ? (() => { const p = user.name.trim().split(/\s+/); return p.length >= 2 ? (p[0][0]+p[p.length-1][0]).toUpperCase() : p[0].slice(0,2).toUpperCase() })()
                : user.email?.slice(0,2).toUpperCase() ?? 'U'}
            </div>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontWeight: '500' }}>
              {user.name || user.email?.split('@')[0]}
            </span>
          </>
        ) : (
          <>
            <button onClick={() => router.push('/login')} style={{ background: 'transparent', border: '1px solid rgba(0,229,192,0.3)', color: '#00E5C0', padding: '6px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Sign In</button>
            <button onClick={() => router.push('/signup')} style={{ background: 'linear-gradient(135deg, #00E5C0, #1ABFA3)', border: 'none', color: '#060E1E', padding: '6px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Get Started</button>
          </>
        )}
      </div>

      {/* PAGE HEADER */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 48px 0' }}>
        <button
          onClick={() => router.push('/')}
          style={{ background: 'transparent', border: '1px solid rgba(0,229,192,0.2)', color: 'rgba(0,229,192,0.8)', padding: '7px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          ← Back to Home
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0,229,192,0.1)', border: '1px solid rgba(0,229,192,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: '#00E5C0' }}>
            {meta.icon}
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>{meta.heading}</h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{meta.sub}</p>
          </div>
        </div>

        {/* Step hint */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '24px', marginBottom: '32px' }}>
          {['Upload your file', 'Select it below', 'View results'].map((step, i) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: i === 0 ? 'linear-gradient(135deg,#00E5C0,#1ABFA3)' : 'rgba(0,229,192,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: i === 0 ? '#060E1E' : 'rgba(0,229,192,0.6)' }}>{i + 1}</div>
              <span style={{ fontSize: '13px', color: i === 0 ? '#fff' : 'rgba(255,255,255,0.35)', fontWeight: i === 0 ? '600' : '400' }}>{step}</span>
              {i < 2 && <span style={{ color: 'rgba(0,229,192,0.2)', fontSize: '16px' }}>›</span>}
            </div>
          ))}
        </div>
      </div>

      {/* FILE UPLOAD COMPONENT */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 48px 80px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.4)' }}>Loading files…</div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,229,192,0.12)', borderRadius: '20px', overflow: 'hidden' }}>
            <FileUpload
              uploadedFiles={uploadedFiles}
              onFileUpload={handleFileUpload}
              onFileDelete={handleFileDelete}
              onFileDownload={handleFileDownload}
              onFileUpdate={handleFileUpdate}
              onFileSelect={handleFileSelect}
              title={`Upload for ${meta.heading}`}
              description="Upload a CSV or Excel file, then click on it to proceed"
            />
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
      `}</style>
    </div>
  )
}

export default function UploadPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#060E1E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00E5C0', fontFamily: 'system-ui' }}>
        Loading…
      </div>
    }>
      <UploadPageInner />
    </Suspense>
  )
}