'use client'

import Link from 'next/link'
import DashboardNavbar from '../../components/DashboardNavbar'
import { ArrowLeft, ArrowRight, BarChart3, Brain } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type WorkbenchFeature = {
  title: string
  description: string
  href: string
  action: string
  eyebrow: string
  icon: LucideIcon
}

const WORKBENCH_FEATURES: WorkbenchFeature[] = [
  {
    title: 'API Statistics',
    description: 'Analyze usage patterns and performance metrics from your API data.',
    href: '/dashboard/upload?decisionMetrics=analytics',
    action: 'Analyze performance',
    eyebrow: 'Analytics',
    icon: BarChart3,
  },
  {
    title: 'Prediction Models',
    description: 'Use AI-powered models to forecast revenue and spot usage trends.',
    href: '/dashboard/upload?decisionMetrics=prediction',
    action: 'Predict growth',
    eyebrow: 'Forecasting',
    icon: Brain,
  },
]

export default function AnalyticsWorkbenchPage() {
  return (
    <main className="workbench-page">
      <DashboardNavbar />

      <section className="workbench-content">
        <Link href="/dashboard" className="back-link">
          <ArrowLeft aria-hidden="true" />
          Dashboard
        </Link>

        <div className="workbench-heading">
          <p>Analytics + Forecasting</p>
          <h1>Analytics Workbench</h1>
        </div>

        <div className="workbench-grid" aria-label="Analytics Workbench tools">
          {WORKBENCH_FEATURES.map((feature) => {
            const Icon = feature.icon

            return (
              <Link key={feature.title} href={feature.href} className="workbench-card">
                <div className="workbench-card-inner">
                  <div className="workbench-top">
                    <div className="workbench-icon">
                      <Icon aria-hidden="true" />
                    </div>
                    <span className="workbench-eyebrow">{feature.eyebrow}</span>
                  </div>

                  <div>
                    <h2>{feature.title}</h2>
                    <p>{feature.description}</p>
                  </div>

                  <span className="workbench-action">
                    {feature.action}
                    <ArrowRight aria-hidden="true" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <style>{`
        .workbench-page {
          min-height: 100vh;
          background:
            linear-gradient(135deg, rgba(6, 14, 30, 0.96) 0%, rgba(10, 22, 40, 0.98) 45%, rgba(7, 20, 32, 1) 100%);
          color: #ffffff;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        .workbench-content {
          width: min(1140px, calc(100% - 48px));
          margin: 0 auto;
          padding: 48px 0 80px;
        }

        .back-link {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 34px;
          color: #00E5C0;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          border: 1px solid rgba(0, 229, 192, 0.28);
          border-radius: 999px;
          padding: 8px 13px;
          background: rgba(0, 229, 192, 0.07);
        }

        .back-link svg {
          width: 16px;
          height: 16px;
        }

        .workbench-heading {
          margin-bottom: 28px;
        }

        .workbench-heading p {
          margin: 0 0 8px;
          color: #00E5C0;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .workbench-heading h1 {
          margin: 0;
          color: #ffffff;
          font-size: 34px;
          line-height: 1.15;
          font-weight: 900;
        }

        .workbench-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 26px;
        }

        .workbench-card {
          position: relative;
          display: flex;
          min-height: 362px;
          color: inherit;
          text-decoration: none;
          border-radius: 20px;
          overflow: hidden;
          background:
            radial-gradient(circle at 13% 10%, rgba(124, 255, 229, 0.18), transparent 26%),
            radial-gradient(circle at 82% 86%, rgba(0, 229, 192, 0.16), transparent 34%),
            linear-gradient(145deg, rgba(48, 61, 78, 0.9) 0%, rgba(20, 38, 54, 0.96) 45%, rgba(13, 31, 44, 0.98) 100%);
          border: 1px solid rgba(103, 188, 178, 0.48);
          box-shadow:
            0 22px 68px rgba(0, 0, 0, 0.28),
            0 0 0 1px rgba(0, 229, 192, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.13),
            inset 0 -86px 100px rgba(4, 24, 35, 0.24);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .workbench-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(115deg, rgba(255,255,255,0.13), transparent 28%),
            linear-gradient(180deg, rgba(236, 253, 245, 0.05), transparent 58%);
          pointer-events: none;
        }

        .workbench-card:hover {
          transform: translateY(-5px);
          border-color: rgba(118, 240, 219, 0.72);
          box-shadow:
            0 30px 88px rgba(0, 229, 192, 0.18),
            0 0 0 1px rgba(110, 231, 183, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.22),
            inset 0 -80px 90px rgba(3, 30, 24, 0.2);
        }

        .workbench-card-inner {
          position: relative;
          z-index: 1;
          flex: 1;
          min-height: 362px;
          padding: 34px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 28px;
        }

        .workbench-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .workbench-icon {
          width: 66px;
          height: 66px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.95), transparent 30%),
            linear-gradient(145deg, #c9fff5, #5ff2da);
          border: 1px solid rgba(236, 253, 245, 0.72);
          box-shadow:
            0 16px 34px rgba(0, 229, 192, 0.22),
            0 0 0 9px rgba(209, 250, 229, 0.09);
        }

        .workbench-icon svg {
          width: 30px;
          height: 30px;
          color: #064e3b;
          stroke-width: 2.5;
        }

        .workbench-eyebrow {
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          padding: 5px 12px;
          border-radius: 999px;
          border: 1px solid rgba(220, 252, 231, 0.36);
          background: rgba(220, 252, 231, 0.14);
          color: #dcfce7;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .workbench-card h2 {
          max-width: 360px;
          margin: 0 0 16px;
          color: #ffffff;
          font-size: 23px;
          line-height: 1.22;
          font-weight: 900;
        }

        .workbench-card p {
          max-width: 390px;
          margin: 0;
          color: rgba(236, 253, 245, 0.82);
          font-size: 15px;
          line-height: 1.62;
          font-weight: 600;
        }

        .workbench-action {
          width: fit-content;
          min-width: 196px;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 12px 10px 16px;
          border-radius: 999px;
          border: 1px solid rgba(220, 252, 231, 0.38);
          background: rgba(220, 252, 231, 0.14);
          color: #ecfdf5;
          font-size: 14px;
          font-weight: 900;
        }

        .workbench-action svg {
          width: 17px;
          height: 17px;
          padding: 2px;
          border-radius: 50%;
          color: #065f46;
          background: #bbf7d0;
        }

        @media (max-width: 900px) {
          .workbench-grid {
            grid-template-columns: 1fr;
          }

          .workbench-card,
          .workbench-card-inner {
            min-height: 286px;
          }
        }

        @media (max-width: 640px) {
          .workbench-content {
            width: min(100% - 28px, 1140px);
            padding: 34px 0 58px;
          }

          .workbench-card-inner {
            padding: 26px;
          }

          .workbench-heading h1 {
            font-size: 28px;
          }
        }
      `}</style>
    </main>
  )
}
