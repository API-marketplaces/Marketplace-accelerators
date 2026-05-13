'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        background: 'transparent',
        border: '1px solid rgba(239,68,68,0.35)',
        color: '#f87171',
        padding: '6px 16px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(239,68,68,0.1)' }}
      onMouseLeave={e => { (e.currentTarget).style.background = 'transparent' }}
    >
      Logout
    </button>
  )
}