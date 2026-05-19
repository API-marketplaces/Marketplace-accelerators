'use client'

import Link from 'next/link'
import UserProfile from './UserProfile'

/**
 * DashboardNavbar
 *
 * A sticky top bar that includes the MonetizeMate brand and the
 * UserProfile avatar/popover.  Import this into every dashboard page
 * (or better yet, add it once in app/dashboard/layout.tsx).
 *
 * Usage:
 *   import DashboardNavbar from '@/app/components/DashboardNavbar'
 *   ...
 *   <DashboardNavbar />
 *
 * No props required — auth state is read internally via useAuth().
 */
export default function DashboardNavbar() {
  return (
    <nav
      style={{
        height: 64,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(7,15,31,0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* ── Brand ── */}
      <Link
        href="/"
        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            background: 'linear-gradient(135deg, #00E5C0, #1ABFA3)',
            borderRadius: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 800,
            color: '#060E1E',
          }}
        >
          M
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
            MonetizeMate
          </div>
          <div style={{ fontSize: 10, color: 'rgba(0,229,192,0.6)', letterSpacing: '0.3px' }}>
            AI-Powered API Monetization
          </div>
        </div>
      </Link>

      {/* ── Right side ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Divider */}
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)' }} />

        {/* Nagarro logo */}
        <img
          src="/nagarro-logo.png"
          alt="Nagarro"
          style={{ height: 26, objectFit: 'contain' }}
        />

        {/* User profile avatar + popover (self-contained) */}
        <UserProfile />
      </div>
    </nav>
  )
}