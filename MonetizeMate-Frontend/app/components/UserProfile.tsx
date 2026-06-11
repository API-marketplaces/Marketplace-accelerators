'use client'

import { useEffect, useState, type ElementType } from 'react'
import { useRouter } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Compass, Brain, BarChart3, Calendar, LogOut, Clock, ChevronRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getFilesByDecisionMetrics } from '../services/fileService'
import type { BackendFile } from '../types/File'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name?: string, email?: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return email?.slice(0, 2).toUpperCase() ?? 'U'
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Activity {
  id: string
  title: string
  description: string
  date: string
  time: string
  icon: ElementType
  color: string
}

// ─── Recent activity helpers ──────────────────────────────────────────────────

function getMetricMeta(metric?: string) {
  const normalizedMetric = metric?.toLowerCase()

  if (normalizedMetric === 'prediction') {
    return {
      description: 'Prediction Upload',
      icon: Brain,
      color: '#818cf8',
    }
  }

  if (normalizedMetric === 'analytics') {
    return {
      description: 'Analytics Upload',
      icon: BarChart3,
      color: '#f59e0b',
    }
  }

  return {
    description: 'Strategy Activity',
    icon: Compass,
    color: '#00E5C0',
  }
}

function formatActivityDate(value: Date | string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return { date: 'Unknown date', time: '' }
  }

  return {
    date: date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }),
  }
}

function fileToActivity(file: BackendFile): Activity {
  const metricMeta = getMetricMeta(file.decisionMetrics)
  const uploadedAt = formatActivityDate(file.upload_time)

  return {
    id: `${file.decisionMetrics}-${file.id}`,
    title: file.displayname || file.filename || 'Uploaded API data',
    description: metricMeta.description,
    date: uploadedAt.date,
    time: uploadedAt.time,
    icon: metricMeta.icon,
    color: metricMeta.color,
  }
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #00E5C0 0%, #0095a8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.36,
        color: '#060E1E',
        flexShrink: 0,
        letterSpacing: '0.5px',
      }}
    >
      {initials}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * UserProfile popover — drop this wherever the user avatar/icon appears.
 * It reads auth state from `useAuth()` so no props are required.
 * Logout clears the session and redirects to "/" automatically.
 */
export default function UserProfile() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)

  useEffect(() => {
    if (!user || !open) return

    let cancelled = false

    async function loadRecentActivities() {
      setActivitiesLoading(true)

      const results = await Promise.allSettled([
        getFilesByDecisionMetrics('analytics'),
        getFilesByDecisionMetrics('prediction'),
      ])

      if (cancelled) return

      const files = results
        .filter((result): result is PromiseFulfilledResult<BackendFile[]> => result.status === 'fulfilled')
        .flatMap(result => result.value)
        .sort((first, second) => {
          const firstTime = new Date(first.upload_time).getTime()
          const secondTime = new Date(second.upload_time).getTime()
          return secondTime - firstTime
        })
        .slice(0, 3)

      setActivities(files.map(fileToActivity))
      setActivitiesLoading(false)
    }

    loadRecentActivities()

    return () => {
      cancelled = true
    }
  }, [open, user])

  if (!user) return null

  const initials = getInitials(user.name, user.email)
  const displayName = user.name || user.email?.split('@')[0] || 'User'

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
      setOpen(false)
      router.push('/')
      router.refresh()
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* ── Trigger: avatar button ── */}
      <PopoverTrigger asChild>
        <button
          aria-label="Open user menu"
          style={{
            background: 'none',
            border: '2px solid rgba(0,229,192,0.35)',
            padding: 0,
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'border-color 0.2s',
            outline: 'none',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#00E5C0')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,229,192,0.35)')}
        >
          <Avatar initials={initials} size={36} />
        </button>
      </PopoverTrigger>

      {/* ── Popover content ── */}
      <PopoverContent
        align="end"
        sideOffset={10}
        style={{
          width: 300,
          padding: 0,
          background: '#0D1B2E',
          border: '1px solid rgba(0,229,192,0.15)',
          borderRadius: 14,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,229,192,0.08)',
          overflow: 'hidden',
          color: '#fff',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px 16px',
            background: 'linear-gradient(180deg, rgba(0,229,192,0.07) 0%, transparent 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar initials={initials} size={44} />
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayName}
              </p>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 12,
                  color: 'rgba(0,229,192,0.7)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ padding: '14px 20px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Clock style={{ width: 13, height: 13, color: 'rgba(0,229,192,0.6)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
              Recent Activity
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activitiesLoading && (
              <p style={{ margin: '8px 10px 12px', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                Loading recent activity...
              </p>
            )}

            {!activitiesLoading && activities.length === 0 && (
              <p style={{ margin: '8px 10px 12px', fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.45)' }}>
                No recent uploads yet.
              </p>
            )}

            {!activitiesLoading && activities.map(activity => {
              const Icon = activity.icon
              return (
                <div
                  key={activity.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 9,
                    transition: 'background 0.15s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
                >
                  {/* Icon chip */}
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: `${activity.color}18`,
                      border: `1px solid ${activity.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon style={{ width: 14, height: 14, color: activity.color }} />
                  </div>

                  {/* Text */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.85)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {activity.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Calendar style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{activity.date}</span>
                      <span style={{ fontSize: 11, color: 'rgba(0,229,192,0.55)', fontWeight: 500 }}>{activity.time}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

        {/* Logout */}
        <div style={{ padding: '8px 12px 12px' }}>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              padding: '9px 12px',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 9,
              background: 'transparent',
              color: '#f87171',
              fontSize: 13,
              fontWeight: 500,
              cursor: loggingOut ? 'not-allowed' : 'pointer',
              opacity: loggingOut ? 0.6 : 1,
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              if (!loggingOut) {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.5)'
              }
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.25)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LogOut style={{ width: 14, height: 14 }} />
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </div>
            {!loggingOut && <ChevronRight style={{ width: 13, height: 13, opacity: 0.5 }} />}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
