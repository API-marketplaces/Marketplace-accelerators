'use client'

import Link from 'next/link'
import DashboardNavbar from '../components/DashboardNavbar'
import { ArrowRight, BarChart3, Brain, CheckCircle2, Compass } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type DashboardFeature = {
  title: string
  description: string
  href: string
  action: string
  eyebrow: string
  icon: LucideIcon
}

const FEATURES: DashboardFeature[] = [
  {
    title: 'Monetization Strategy Advisor',
    description: 'Get personalized monetization recommendations based on your business model.',
    href: '/dashboard/strategy-adviser',
    action: 'Get strategy',
    eyebrow: 'Strategy',
    icon: Compass,
  },
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

const STEPS = [
  {
    label: 'Get Strategy Recommendations',
    text: 'Answer questions about your business to receive personalized monetization strategies.',
  },
  {
    label: 'Analyze Performance',
    text: 'Monitor your API statistics and understand usage patterns.',
  },
  {
    label: 'Predict Growth',
    text: 'Forecast revenue and optimize your strategy with AI models.',
  },
]

export default function DashboardPage() {
  return (
    <main className="monetize-dashboard">
      <DashboardNavbar />

      <section className="dashboard-content">
        <div className="dashboard-heading">
          <div>
            <p className="dashboard-kicker">Interactive Dashboard</p>
            <h1>MonetizeMate</h1>
            <p>Your AI-powered monetization dashboard</p>
          </div>
        </div>

        <div className="feature-grid" aria-label="MonetizeMate dashboard features">
          {FEATURES.map((feature) => {
            const Icon = feature.icon

            return (
              <Link
                key={feature.title}
                href={feature.href}
                className="feature-card"
              >
                <div className="feature-card-inner">
                  <div className="feature-top">
                    <div className="feature-icon">
                      <Icon aria-hidden="true" />
                    </div>
                    <span className="feature-eyebrow">{feature.eyebrow}</span>
                  </div>
                  <div>
                    <h2>{feature.title}</h2>
                    <p>{feature.description}</p>
                  </div>
                  <span className="feature-action">
                    {feature.action}
                    <ArrowRight aria-hidden="true" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        <section className="welcome-panel" aria-labelledby="welcome-title">
          <p className="dashboard-kicker">Start Here</p>
          <h2 id="welcome-title">Welcome to MonetizeMate</h2>
          <p>
            Start with the Monetization Strategy Advisor, then use analytics and prediction tools
            to optimize and track your revenue growth.
          </p>

          <div className="steps-grid">
            {STEPS.map((step, index) => (
              <div key={step.label} className="step-item">
                <div className="step-number">
                  <span>{index + 1}</span>
                  <CheckCircle2 aria-hidden="true" />
                </div>
                <h3>{step.label}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </section>
      </section>

      <style>{`
        .monetize-dashboard {
          min-height: 100vh;
          background:
            linear-gradient(135deg, rgba(6, 14, 30, 0.96) 0%, rgba(10, 22, 40, 0.98) 45%, rgba(7, 20, 32, 1) 100%);
          color: #ffffff;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        .dashboard-content {
          width: min(1140px, calc(100% - 48px));
          margin: 0 auto;
          padding: 56px 0 80px;
        }

        .dashboard-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 44px;
        }

        .dashboard-kicker {
          margin: 0 0 8px;
          color: #00E5C0;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .dashboard-heading h1 {
          margin: 0;
          color: #ffffff;
          font-size: 34px;
          line-height: 1.15;
          font-weight: 800;
        }

        .dashboard-heading p:not(.dashboard-kicker) {
          margin: 10px 0 0;
          color: rgba(255, 255, 255, 0.58);
          font-size: 16px;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
          margin-bottom: 66px;
        }

        .feature-card {
          position: relative;
          display: flex;
          min-height: 312px;
          color: inherit;
          text-decoration: none;
          border-radius: 20px;
          overflow: hidden;
          background:
            radial-gradient(circle at 16% 12%, rgba(190, 242, 100, 0.22), transparent 30%),
            radial-gradient(circle at 84% 86%, rgba(45, 212, 191, 0.3), transparent 34%),
            linear-gradient(145deg, rgba(6, 95, 70, 0.98) 0%, rgba(4, 120, 87, 0.94) 48%, rgba(2, 71, 55, 0.98) 100%);
          border: 1px solid rgba(134, 239, 172, 0.54);
          box-shadow:
            0 26px 70px rgba(16, 185, 129, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            inset 0 -90px 100px rgba(2, 44, 34, 0.28);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(115deg, rgba(255,255,255,0.2), transparent 28%),
            linear-gradient(180deg, rgba(236, 253, 245, 0.08), transparent 58%);
          opacity: 0.9;
          pointer-events: none;
        }

        .feature-card::after {
          content: '';
          position: absolute;
          inset: 1px;
          border-radius: 19px;
          border: 1px solid rgba(167, 243, 208, 0.18);
          pointer-events: none;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          border-color: rgba(110, 231, 183, 0.72);
          box-shadow:
            0 32px 88px rgba(0, 229, 192, 0.32),
            0 0 0 1px rgba(110, 231, 183, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.22),
            inset 0 -80px 90px rgba(3, 30, 24, 0.2);
        }

        .feature-card-inner {
          position: relative;
          z-index: 1;
          flex: 1;
          min-height: 312px;
          height: 100%;
          box-sizing: border-box;
          padding: 34px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 24px;
        }

        .feature-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .feature-icon {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.95), transparent 30%),
            linear-gradient(145deg, #d1fae5, #5eead4);
          border: 1px solid rgba(236, 253, 245, 0.72);
          box-shadow:
            0 14px 32px rgba(4, 120, 87, 0.35),
            0 0 0 8px rgba(209, 250, 229, 0.08);
        }

        .feature-icon svg {
          width: 27px;
          height: 27px;
          color: #064e3b;
          stroke-width: 2.5;
        }

        .feature-eyebrow {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 5px 11px;
          border-radius: 999px;
          border: 1px solid rgba(220, 252, 231, 0.32);
          background: rgba(220, 252, 231, 0.16);
          color: #dcfce7;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .feature-card h2 {
          max-width: 360px;
          margin: 0 0 16px;
          color: #ffffff;
          font-size: 22px;
          line-height: 1.22;
          font-weight: 800;
        }

        .feature-card p {
          max-width: 390px;
          margin: 0;
          color: rgba(236, 253, 245, 0.88);
          font-size: 15px;
          line-height: 1.62;
        }

        .feature-action {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          width: fit-content;
          min-width: 176px;
          gap: 12px;
          padding: 10px 12px 10px 16px;
          border-radius: 999px;
          border: 1px solid rgba(220, 252, 231, 0.32);
          background: rgba(220, 252, 231, 0.16);
          color: #ecfdf5;
          font-size: 14px;
          font-weight: 800;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .feature-action svg {
          width: 17px;
          height: 17px;
          padding: 2px;
          border-radius: 50%;
          color: #065f46;
          background: #bbf7d0;
        }

        .welcome-panel {
          width: min(808px, 100%);
          margin: 0 auto;
          padding: 42px 42px 36px;
          text-align: center;
          border-radius: 20px;
          border: 1px solid rgba(0, 229, 192, 0.14);
          background: rgba(255, 255, 255, 0.035);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.22);
          backdrop-filter: blur(18px);
        }

        .welcome-panel h2 {
          margin: 0 0 14px;
          color: #ffffff;
          font-size: 27px;
          line-height: 1.25;
          font-weight: 800;
        }

        .welcome-panel > p:not(.dashboard-kicker) {
          width: min(690px, 100%);
          margin: 0 auto;
          color: rgba(255, 255, 255, 0.62);
          font-size: 15px;
          line-height: 1.7;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 28px;
          margin-top: 34px;
        }

        .step-item {
          min-width: 0;
        }

        .step-number {
          width: 52px;
          height: 52px;
          margin: 0 auto 14px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          color: #060E1E;
          background: linear-gradient(135deg, #00E5C0, #1ABFA3);
          font-weight: 800;
        }

        .step-number svg {
          position: absolute;
          width: 16px;
          height: 16px;
          right: -2px;
          bottom: -2px;
          color: #ffffff;
          fill: rgba(6, 14, 30, 0.9);
        }

        .step-item h3 {
          margin: 0 0 8px;
          color: #ffffff;
          font-size: 15px;
          line-height: 1.45;
          font-weight: 800;
        }

        .step-item p {
          margin: 0;
          color: rgba(255, 255, 255, 0.52);
          font-size: 13px;
          line-height: 1.55;
        }

        @media (max-width: 900px) {
          .feature-grid,
          .steps-grid {
            grid-template-columns: 1fr;
          }

          .feature-card,
          .feature-card-inner {
            min-height: 260px;
          }
        }

        @media (max-width: 640px) {
          .dashboard-content {
            width: min(100% - 28px, 1140px);
            padding: 34px 0 58px;
          }

          .dashboard-heading {
            margin-bottom: 28px;
          }

          .dashboard-heading h1 {
            font-size: 28px;
          }

          .feature-card-inner {
            padding: 26px;
          }

          .welcome-panel {
            padding: 32px 24px 28px;
          }
        }
      `}</style>
    </main>
  )
}
