'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState, useRef } from 'react'
import { useFileHandler } from '../../hooks/useFileHandler'
import { useAuth } from '../../hooks/useAuth'
import UserProfile from '../../components/UserProfile'
import Link from 'next/link'

const ROUTE_MAP: Record<string, (id: string) => string> = {
  analytics:  (id) => `/dashboard/api-stats/${id}`,
  prediction: (id) => `/dashboard/prediction/${id}`,
  strategy:   () => `/dashboard/strategy-adviser`,
}

const META: Record<string, { heading: string; sub: string; icon: string; color: string }> = {
  analytics:  { heading: 'API Analytics', sub: 'Analyse usage patterns, errors and response times across your API calls', icon: '⬡', color: '#00E5C0' },
  prediction: { heading: 'ML Predictions', sub: 'Run anomaly detection and demand forecasting on your API data', icon: '◈', color: '#818cf8' },
  strategy:   { heading: 'Strategy Advisor', sub: 'Get personalised monetisation recommendations for your APIs', icon: '◎', color: '#f59e0b' },
}

function getInitials(name?: string, email?: string) {
  if (name?.trim()) {
    const p = name.trim().split(/\s+/)
    return p.length >= 2 ? (p[0][0] + p[p.length-1][0]).toUpperCase() : p[0].slice(0,2).toUpperCase()
  }
  return email?.slice(0,2).toUpperCase() ?? 'U'
}

function formatSize(bytes: number) {
  if (!bytes) return '—'
  const k = 1024, sizes = ['B','KB','MB','GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}

function formatDate(d: any) {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function UploadPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const decisionMetrics = searchParams.get('decisionMetrics') || 'analytics'
  const { user, logout } = useAuth()
  const { uploadedFiles, handleFileUpload, handleFileDelete, handleFileDownload, handleFileUpdate, isLoading } = useFileHandler(decisionMetrics)
  const meta = META[decisionMetrics] ?? META.analytics

  const [isDrag, setIsDrag] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const openUpload = (file: File) => {
    setPendingFile(file)
    setDisplayName(file.name)
    setShowDialog(true)
  }

  const confirmUpload = async () => {
    if (!pendingFile) return
    setUploading(true)
    try {
      const result = await handleFileUpload(pendingFile, displayName.trim() || pendingFile.name)
      if (result) {
        setShowDialog(false)
        setPendingFile(null)
        setDisplayName('')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleSelect = (id: string) => {
    const dest = ROUTE_MAP[decisionMetrics]
    if (dest) router.push(dest(id))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070F1F', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#fff' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ height: '64px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(7,15,31,0.95)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #00E5C0, #1ABFA3)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '800', color: '#060E1E' }}>M</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', lineHeight: 1.2 }}>MonetizeMate</div>
            <div style={{ fontSize: '10px', color: 'rgba(0,229,192,0.6)', letterSpacing: '0.3px' }}>AI-Powered API Monetization</div>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.08)' }} />
          <img src="/nagarro-logo.png" alt="Nagarro" style={{ height: '26px', objectFit: 'contain' }} />
          {user && (
            <UserProfile
              user={{ name: user.name || user.email?.split('@')[0] || 'User', email: user.email || '' }}
              onLogout={() => logout()}
              onBack={() => router.back()}
            />
          )}
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 40px 80px' }}>

        {/* Back + Title */}
        <div style={{ marginBottom: '40px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px', transition: 'color 0.2s' }}
            onMouseEnter={(e: any) => e.currentTarget.style.color = '#00E5C0'}
            onMouseLeave={(e: any) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          >
            ← Back to Home
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: `rgba(${meta.color === '#00E5C0' ? '0,229,192' : meta.color === '#818cf8' ? '129,140,248' : '245,158,11'},0.12)`, border: `1px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{meta.icon}</div>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px', marginBottom: '4px' }}>{meta.heading}</h1>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5' }}>{meta.sub}</p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px 24px' }}>
          {['Upload your file', 'Click to select', 'View results'].map((step, i) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i === 0 ? `linear-gradient(135deg, ${meta.color}, #1ABFA3)` : 'rgba(255,255,255,0.06)', border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: i === 0 ? '#060E1E' : 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{i + 1}</div>
                <span style={{ fontSize: '13px', fontWeight: i === 0 ? '600' : '400', color: i === 0 ? '#fff' : 'rgba(255,255,255,0.3)' }}>{step}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0 16px' }} />}
            </div>
          ))}
        </div>

        {/* Two-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

          {/* LEFT — Upload zone */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>Upload New File</div>
            <div
              style={{ border: `2px dashed ${isDrag ? meta.color : 'rgba(255,255,255,0.1)'}`, borderRadius: '16px', background: isDrag ? `rgba(${meta.color === '#00E5C0' ? '0,229,192' : '129,140,248'},0.04)` : 'rgba(255,255,255,0.02)', padding: '48px 32px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              onDragOver={e => { e.preventDefault(); setIsDrag(true) }}
              onDragLeave={() => setIsDrag(false)}
              onDrop={e => { e.preventDefault(); setIsDrag(false); const f = e.dataTransfer.files[0]; if (f) openUpload(f) }}
              onClick={() => fileRef.current?.click()}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `rgba(${meta.color === '#00E5C0' ? '0,229,192' : meta.color === '#818cf8' ? '129,140,248' : '245,158,11'},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '26px' }}>📤</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>Drop your file here</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '20px' }}>or click to browse files</div>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '20px' }}>
                {['.csv', '.xlsx', '.xls'].map(t => <span key={t} style={{ fontSize: '11px', fontWeight: '600', color: meta.color, background: `rgba(${meta.color === '#00E5C0' ? '0,229,192' : '129,140,248'},0.08)`, border: `1px solid ${meta.color}25`, borderRadius: '100px', padding: '3px 10px' }}>{t}</span>)}
              </div>
              <button style={{ background: `linear-gradient(135deg, ${meta.color}, #1ABFA3)`, border: 'none', color: '#060E1E', padding: '10px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Choose File</button>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) openUpload(f); e.target.value = '' }} />

            {/* Tip */}
            <div style={{ marginTop: '16px', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>💡</span>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6', margin: 0 }}>After uploading, click any file in the list on the right to proceed to analysis. Large files may take a moment to process.</p>
            </div>
          </div>

          {/* RIGHT — File list */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Your Files</div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: meta.color, background: `rgba(${meta.color === '#00E5C0' ? '0,229,192' : '129,140,248'},0.1)`, padding: '3px 10px', borderRadius: '100px' }}>{uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}</div>
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1,2,3].map(i => <div key={i} style={{ height: '72px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />)}
              </div>
            ) : uploadedFiles.length === 0 ? (
              <div style={{ border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '14px', padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📂</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>No files yet</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>Upload a file on the left to get started</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '460px', overflowY: 'auto', paddingRight: '4px' }}>
                {uploadedFiles.map((file: any) => (
                  <div
                    key={file.id}
                    onClick={() => handleSelect(String(file.id))}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'all 0.18s', position: 'relative' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = `rgba(${meta.color === '#00E5C0' ? '0,229,192' : '129,140,248'},0.06)`; el.style.borderColor = `${meta.color}30` }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = 'rgba(255,255,255,0.03)'; el.style.borderColor = 'rgba(255,255,255,0.07)' }}
                  >
                    {/* Icon */}
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                      {String(file.name || '').endsWith('.csv') ? '📊' : '📗'}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>{file.displayName || file.name}</div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {[formatDate(file.uploadDate), formatSize(file.size), file.records ? `${Number(file.records).toLocaleString()} rows` : null].filter(Boolean).map((item, i) => (
                          <span key={i} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{item}</span>
                        ))}
                      </div>
                    </div>
                    {/* Analyse CTA */}
                    <div style={{ fontSize: '11px', fontWeight: '600', color: meta.color, background: `rgba(${meta.color === '#00E5C0' ? '0,229,192' : '129,140,248'},0.08)`, padding: '4px 10px', borderRadius: '100px', whiteSpace: 'nowrap', flexShrink: 0 }}>Analyse →</div>
                    {/* Menu */}
                    <div style={{ flexShrink: 0 }} onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === file.id ? null : file.id) }}>
                      <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px 6px', borderRadius: '6px', fontSize: '16px' }}>⋮</button>
                      {openMenu === file.id && (
                        <div style={{ position: 'absolute', top: '8px', right: '40px', background: '#0E1929', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '6px', minWidth: '140px', zIndex: 50, boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
                          {[
                            { icon: '⬇️', label: 'Download', action: () => { handleFileDownload(file.id); setOpenMenu(null) }, danger: false },
                            { icon: '🗑️', label: 'Delete', action: () => { if (confirm('Delete this file?')) handleFileDelete(file.id); setOpenMenu(null) }, danger: true },
                          ].map(item => (
                            <button key={item.label} onClick={item.action} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: item.danger ? '#f87171' : 'rgba(255,255,255,0.7)', padding: '8px 10px', borderRadius: '7px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                              onMouseEnter={e => e.currentTarget.style.background = item.danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >{item.icon} {item.label}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── UPLOAD DIALOG ── */}
      {showDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDialog(false)}>
          <div style={{ background: '#0E1929', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '420px', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>Name Your File</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>{pendingFile?.name}</div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Display Name</label>
            <input
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', padding: '11px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '24px' }}
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. Q1 API Logs 2026"
              autoFocus
              onFocus={e => e.target.style.borderColor = meta.color}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDialog(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmUpload} disabled={uploading} style={{ background: `linear-gradient(135deg, ${meta.color}, #1ABFA3)`, border: 'none', color: '#060E1E', padding: '10px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', opacity: uploading ? 0.7 : 1 }}>
                {uploading ? '⏳ Uploading…' : '↑ Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
    </div>
  )
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#070F1F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00E5C0', fontFamily: 'system-ui' }}>Loading…</div>}>
      <UploadPageInner />
    </Suspense>
  )
}