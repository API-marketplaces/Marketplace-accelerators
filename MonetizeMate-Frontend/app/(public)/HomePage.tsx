'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function HomePage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const { user, loading: authLoading, logout } = useAuth()

  useEffect(() => {
    const handler = () => setShowDropdown(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    setShowDropdown(false)
    router.push('/')
  }

  const getInitials = (email?: string, name?: string): string => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/)
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      return parts[0].slice(0, 2).toUpperCase()
    }
    if (email) return email.slice(0, 2).toUpperCase()
    return 'U'
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let animFrame: number
    let t = 0
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const cols = Math.ceil(canvas.width / 60)
      const rows = Math.ceil(canvas.height / 60)
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const wave = Math.sin(t * 0.02 + i * 0.3 + j * 0.2) * 0.5 + 0.5
          ctx.beginPath()
          ctx.arc(i * 60, j * 60, 1.2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0, 229, 192, ${wave * 0.12})`
          ctx.fill()
        }
      }
      for (let k = 0; k < 3; k++) {
        ctx.beginPath()
        ctx.strokeStyle = `rgba(0, 229, 192, 0.04)`
        ctx.lineWidth = 1
        for (let x = 0; x <= canvas.width; x += 4) {
          const y = canvas.height * 0.3 + Math.sin(x * 0.008 + t * 0.015 + k * 1.5) * 80 + k * 120
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      t++
      animFrame = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener('resize', resize) }
  }, [])

  const features = [
    { icon: '⬡', title: 'Comprehensive API Analytics', desc: 'Deep dive into your API usage with 6-tab dashboard — Overview, Analysis, Temporal, Clients, Distribution, and Rankings with real-time time filtering.', tags: ['Real-time', '6 Views', 'Time Filter'], route: '/dashboard/upload?decisionMetrics=analytics', cta: 'View Analytics →' },
    { icon: '◈', title: 'ML Prediction Models', desc: 'IsolationForest anomaly detection, LinearRegression demand forecasting, quota monitoring, and user behaviour segmentation powered by scikit-learn.', tags: ['scikit-learn', 'Forecasting', 'Anomaly'], route: '/dashboard/upload?decisionMetrics=prediction', cta: 'Run Predictions →' },
    { icon: '◎', title: 'AI-Powered Strategy Advisor', desc: 'Answer a questionnaire or upload your data to receive personalized API monetization strategy recommendations — Freemium, Tiered, or Pay-per-use.', tags: ['Freemium', 'Tiered', 'Pay-per-use'], route: '/dashboard/strategy-adviser', cta: 'Get Strategy →' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #060E1E 0%, #0A1628 40%, #0D2035 70%, #071420 100%)', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '-200px', right: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,192,0.08) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-150px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,191,163,0.07) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

      {/* NAV */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: '68px', borderBottom: '1px solid rgba(0,229,192,0.1)', backdropFilter: 'blur(12px)', background: 'rgba(6,14,30,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #00E5C0, #1ABFA3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: '800', color: '#060E1E' }}>M</div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px', color: '#fff', lineHeight: '1.15' }}>MonetizeMate</div>
            <div style={{ fontSize: '10px', fontWeight: '500', color: 'rgba(0,229,192,0.65)', letterSpacing: '0.3px', lineHeight: '1' }}>AI-Powered API Monetization</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '1px', height: '36px', background: 'rgba(0,229,192,0.15)' }} />
          <img src="/nagarro-logo.png" alt="Nagarro" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
        </div>
      </nav>

      {/* AUTH SUB-BAR */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '8px 48px', gap: '10px', borderBottom: '1px solid rgba(0,229,192,0.06)', background: 'rgba(6,14,30,0.5)', backdropFilter: 'blur(8px)' }}>
        {authLoading ? (
          <div style={{ height: '30px', width: '120px', background: 'rgba(0,229,192,0.08)', borderRadius: '8px' }} />
        ) : user ? (
          <div style={{ position: 'relative' }}>
            <button onClick={(e) => { e.stopPropagation(); setShowDropdown(v => !v) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,229,192,0.08)', border: '1px solid rgba(0,229,192,0.25)', borderRadius: '20px', padding: '5px 14px 5px 5px', cursor: 'pointer', color: '#fff' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #00E5C0, #1ABFA3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: '#060E1E', flexShrink: 0 }}>{getInitials(user.email, user.name)}</div>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#fff', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || user.email?.split('@')[0]}</span>
              <span style={{ fontSize: '10px', color: 'rgba(0,229,192,0.7)' }}>▾</span>
            </button>
            {showDropdown && (
              <div style={{ position: 'absolute', top: '42px', right: '0', background: '#0A1628', border: '1px solid rgba(0,229,192,0.2)', borderRadius: '12px', padding: '8px', minWidth: '190px', zIndex: 100, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid rgba(0,229,192,0.1)', marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{user.name || 'User'}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{user.email}</div>
                </div>
                {[{ label: '📊 Dashboard', path: '/dashboard/upload' }, { label: '🎯 Strategy Advisor', path: '/dashboard/strategy-adviser' }].map(item => (
                  <Link key={item.path} href={item.path} style={{ textDecoration: 'none', display: 'block' }}>
                    <button onClick={() => setShowDropdown(false)} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,192,0.08)'; e.currentTarget.style.color = '#00E5C0' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                    >{item.label}</button>
                  </Link>
                ))}
                <div style={{ borderTop: '1px solid rgba(0,229,192,0.1)', marginTop: '8px', paddingTop: '8px' }} />
                <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#f87171', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >🚪 Logout</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button style={{ background: 'transparent', border: '1px solid rgba(0,229,192,0.3)', color: '#00E5C0', padding: '6px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Sign In</button>
            </Link>
            <Link href="/signup" style={{ textDecoration: 'none' }}>
              <button style={{ background: 'linear-gradient(135deg, #00E5C0, #1ABFA3)', border: 'none', color: '#060E1E', padding: '6px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Get Started</button>
            </Link>
          </>
        )}
      </div>

      {/* HERO */}
      <section style={{ position: 'relative', zIndex: 5, maxWidth: '1200px', margin: '0 auto', padding: '80px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,229,192,0.1)', border: '1px solid rgba(0,229,192,0.2)', borderRadius: '100px', padding: '6px 16px', marginBottom: '32px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00E5C0', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#00E5C0', letterSpacing: '0.5px' }}>AI-POWERED API MONETIZATION</span>
          </div>
          <h1 style={{ fontSize: '56px', fontWeight: '800', lineHeight: '1.08', letterSpacing: '-1.5px', marginBottom: '24px' }}>
            <span style={{ color: '#fff' }}>Transform Your</span><br />
            <span style={{ color: '#fff' }}>APIs Into</span><br />
            <span style={{ background: 'linear-gradient(90deg, #00E5C0, #1ABFA3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Revenue Streams</span>
          </h1>
          <p style={{ fontSize: '17px', lineHeight: '1.7', color: 'rgba(255,255,255,0.55)', marginBottom: '40px', maxWidth: '480px' }}>Leverage AI to develop personalized monetization strategies, analyze API performance, and predict revenue growth with comprehensive business intelligence tools.</p>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link href="/signup" style={{ textDecoration: 'none' }}>
              <button style={{ background: 'linear-gradient(135deg, #00E5C0, #1ABFA3)', border: 'none', color: '#060E1E', padding: '14px 32px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 0 40px rgba(0,229,192,0.25)' }}>Start Free Analysis →</button>
            </Link>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', padding: '14px 32px', borderRadius: '10px', fontSize: '15px', fontWeight: '500', cursor: 'pointer' }}>Sign In</button>
            </Link>
          </div>
          <div style={{ display: 'flex', gap: '32px', marginTop: '48px' }}>
            {[['864K+', 'API Calls Analyzed'], ['3', 'AI Features'], ['$0', 'Setup Cost']].map(([num, label]) => (
              <div key={label}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#00E5C0' }}>{num}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,229,192,0.15)', borderRadius: '20px', padding: '28px', backdropFilter: 'blur(20px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>API ANALYTICS OVERVIEW</span>
              <span style={{ fontSize: '11px', color: '#00E5C0', background: 'rgba(0,229,192,0.1)', padding: '4px 10px', borderRadius: '100px' }}>Live</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '80px', marginBottom: '20px' }}>
              {[65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 50, 88].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '4px 4px 0 0', background: i === 10 ? 'linear-gradient(180deg, #00E5C0, #1ABFA3)' : 'rgba(0,229,192,0.2)' }} />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[['178,180', 'Total Requests'], ['124,573', 'Successful'], ['53,607', 'Errors'], ['1,276ms', 'Avg Response']].map(([val, lbl]) => (
                <div key={lbl} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#00E5C0' }}>{val}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'absolute', top: '-16px', right: '-16px', background: 'linear-gradient(135deg, #0A1628, #0D2035)', border: '1px solid rgba(0,229,192,0.3)', borderRadius: '12px', padding: '12px 16px', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00E5C0', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#00E5C0' }}>AI Concierge Active</span>
          </div>
          <div style={{ position: 'absolute', bottom: '-16px', left: '-16px', background: 'linear-gradient(135deg, #0A1628, #0D2035)', border: '1px solid rgba(0,229,192,0.2)', borderRadius: '12px', padding: '12px 16px', backdropFilter: 'blur(20px)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>ML Prediction</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>+12% growth forecast</div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ position: 'relative', zIndex: 5, maxWidth: '1200px', margin: '0 auto', padding: '60px 48px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: '#00E5C0', textTransform: 'uppercase', marginBottom: '16px' }}>Platform Capabilities</div>
          <h2 style={{ fontSize: '40px', fontWeight: '800', letterSpacing: '-1px', color: '#fff', marginBottom: '16px' }}>Complete Monetization Intelligence</h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.45)', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>Everything you need to optimize your API revenue in one powerful platform</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {features.map((f) => (
            <Link key={f.title} href={f.route} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(0,229,192,0.1)', borderRadius: '20px', padding: '36px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', height: '100%' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = 'rgba(0,229,192,0.06)'; el.style.borderColor = 'rgba(0,229,192,0.35)'; el.style.transform = 'translateY(-6px)'; el.style.boxShadow = '0 20px 60px rgba(0,229,192,0.1)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = 'rgba(255,255,255,0.025)'; el.style.borderColor = 'rgba(0,229,192,0.1)'; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
              >
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(0,229,192,0.1)', border: '1px solid rgba(0,229,192,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#00E5C0', marginBottom: '24px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '12px', lineHeight: '1.3' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', marginBottom: '24px', flex: 1 }}>{f.desc}</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
                  {f.tags.map(tag => (<span key={tag} style={{ fontSize: '11px', fontWeight: '600', color: '#00E5C0', background: 'rgba(0,229,192,0.08)', border: '1px solid rgba(0,229,192,0.15)', borderRadius: '100px', padding: '3px 10px' }}>{tag}</span>))}
                </div>
                <div style={{ color: '#00E5C0', fontSize: '14px', fontWeight: '600' }}>{f.cta}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TECH STRIP */}
      <section style={{ position: 'relative', zIndex: 5, borderTop: '1px solid rgba(0,229,192,0.08)', borderBottom: '1px solid rgba(0,229,192,0.08)', padding: '40px 48px', background: 'rgba(0,229,192,0.02)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase' }}>Built with</span>
          {['Next.js 16', 'FastAPI', 'PostgreSQL', 'Groq Llama 3.1', 'scikit-learn', 'pandas'].map(tech => (
            <span key={tech} style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', padding: '6px 16px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '100px' }}>{tech}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: 'relative', zIndex: 5, maxWidth: '800px', margin: '0 auto', padding: '100px 48px', textAlign: 'center' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(0,229,192,0.08), rgba(26,191,163,0.04))', border: '1px solid rgba(0,229,192,0.2)', borderRadius: '24px', padding: '60px' }}>
          <h2 style={{ fontSize: '40px', fontWeight: '800', letterSpacing: '-1px', color: '#fff', marginBottom: '16px' }}>
            Ready to Monetize<br />
            <span style={{ background: 'linear-gradient(90deg, #00E5C0, #1ABFA3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Your APIs?</span>
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.45)', marginBottom: '36px', lineHeight: '1.6' }}>Join the platform and start analyzing your API data with AI-powered insights.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {user ? (
              <Link href="/dashboard/upload" style={{ textDecoration: 'none' }}>
                <button style={{ background: 'linear-gradient(135deg, #00E5C0, #1ABFA3)', border: 'none', color: '#060E1E', padding: '16px 40px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 0 60px rgba(0,229,192,0.3)' }}>Go to Dashboard →</button>
              </Link>
            ) : (
              <>
                <Link href="/signup" style={{ textDecoration: 'none' }}>
                  <button style={{ background: 'linear-gradient(135deg, #00E5C0, #1ABFA3)', border: 'none', color: '#060E1E', padding: '16px 40px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 0 60px rgba(0,229,192,0.3)' }}>Start Free Analysis →</button>
                </Link>
                <Link href="/login" style={{ textDecoration: 'none' }}>
                  <button style={{ background: 'transparent', border: '1px solid rgba(0,229,192,0.3)', color: '#00E5C0', padding: '16px 40px', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>Sign In</button>
                </Link>
              </>
            )}
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '20px' }}>No credit card required · Setup in 5 minutes · Industry-specific insights</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ position: 'relative', zIndex: 5, borderTop: '1px solid rgba(0,229,192,0.08)', padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(6,14,30,0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, #00E5C0, #1ABFA3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: '#060E1E' }}>M</div>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>MonetizeMate by Nagarro · 2026</span>
        </div>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>AI-Powered API Monetization Platform</span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
      `}</style>
    </div>
  )
}