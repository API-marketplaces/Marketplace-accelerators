'use client'

import Link from 'next/link'
import DashboardNavbar from '../components/DashboardNavbar'
import { ArrowRight, BarChart3, CheckCircle2, Compass, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip'
import type { LucideIcon } from 'lucide-react'

type DashboardFeature = {
  title: string
  description: string
  tooltip: string
  href: string
  action: string
  eyebrow: string
  icon: LucideIcon
}

const FEATURES: DashboardFeature[] = [
  {
    title: 'Monetization Strategy Advisor',
    description: 'Get personalized monetization recommendations based on your business model.',
    tooltip: 'Turn business inputs into a recommended pricing model, packaging direction, and next steps for monetizing your APIs.',
    href: '/dashboard/strategy-adviser',
    action: 'Get strategy',
    eyebrow: 'Strategy',
    icon: Compass,
  },
  {
    title: 'Analytics Workbench',
    description: 'Analyze API performance, usage patterns, forecasts, and growth signals in one workspace.',
    tooltip: 'Open API Statistics or Prediction Models so you can inspect uploaded data, review operational trends, and run forecasting or anomaly analysis.',
    href: '/dashboard/analytics-workbench',
    action: 'Open workbench',
    eyebrow: 'Analytics + Forecasting',
    icon: BarChart3,
  },
]

const STEPS = [
  {
    label: 'Get Strategy Recommendations',
    text: 'Answer questions about your business to receive personalized monetization strategies.',
    tooltip: 'Best first step when you are deciding between freemium, tiered, pay-per-use, or hybrid pricing.',
  },
  {
    label: 'Analyze Performance',
    text: 'Monitor your API statistics and understand usage patterns.',
    tooltip: 'Use this widget after uploading API logs to validate where usage, client demand, and operational load are concentrated.',
  },
  {
    label: 'Predict Growth',
    text: 'Forecast revenue and optimize your strategy with AI models.',
    tooltip: 'Use predictions once historical usage exists, so model output can guide capacity, pricing, and retention decisions.',
  },
]

export default function DashboardPage() {
  return (
    <main className="monetize-dashboard">
      <DashboardNavbar />

      <section className="dashboard-content">
        <section className="welcome-panel" aria-labelledby="welcome-title">
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
                <InfoHint text={step.tooltip} />
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="dashboard-heading">
          <div>
            <p className="dashboard-kicker">Interactive Dashboard</p>
            <h1>Features</h1>
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
                    <div className="feature-meta">
                      <span className="feature-eyebrow">{feature.eyebrow}</span>
                      <InfoHint text={feature.tooltip} />
                    </div>
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
          margin: 46px 0 30px;
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
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 26px;
          margin-bottom: 0;
        }

        .feature-card {
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

        .feature-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(115deg, rgba(255,255,255,0.13), transparent 28%),
            linear-gradient(180deg, rgba(236, 253, 245, 0.05), transparent 58%);
          opacity: 0.9;
          pointer-events: none;
        }

        .feature-card::after {
          content: '';
          position: absolute;
          inset: 1px;
          border-radius: 19px;
          border: 1px solid rgba(167, 243, 208, 0.1);
          pointer-events: none;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          border-color: rgba(118, 240, 219, 0.72);
          box-shadow:
            0 30px 88px rgba(0, 229, 192, 0.18),
            0 0 0 1px rgba(110, 231, 183, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.22),
            inset 0 -80px 90px rgba(3, 30, 24, 0.2);
        }

        .feature-card-inner {
          position: relative;
          z-index: 1;
          flex: 1;
          min-height: 362px;
          height: 100%;
          box-sizing: border-box;
          padding: 34px 34px 33px;
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

        .feature-meta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .feature-icon {
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

        .feature-icon svg {
          width: 30px;
          height: 30px;
          color: #064e3b;
          stroke-width: 2.5;
        }

        .feature-eyebrow {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 5px 12px;
          border-radius: 999px;
          border: 1px solid rgba(220, 252, 231, 0.36);
          background: rgba(220, 252, 231, 0.14);
          color: #dcfce7;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .info-hint {
          width: 28px;
          height: 28px;
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid rgba(220, 252, 231, 0.34);
          background: rgba(220, 252, 231, 0.14);
          color: #dcfce7;
          cursor: help;
          transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
        }

        .info-hint:hover,
        .info-hint:focus-visible {
          border-color: rgba(220, 252, 231, 0.72);
          background: rgba(220, 252, 231, 0.24);
          color: #ffffff;
          outline: none;
        }

        .info-hint svg {
          width: 15px;
          height: 15px;
          stroke-width: 2.5;
        }

        .info-tooltip {
          max-width: 292px;
          border: 1px solid rgba(45, 212, 191, 0.34);
          background: #102235;
          color: #ecfdf5;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28);
        }

        .info-tooltip p {
          margin: 0;
          font-size: 13px;
          line-height: 1.45;
        }

        .feature-card h2 {
          max-width: 360px;
          margin: 0 0 16px;
          color: #ffffff;
          font-size: 23px;
          line-height: 1.22;
          font-weight: 900;
        }

        .feature-card p {
          max-width: 390px;
          margin: 0;
          color: rgba(236, 253, 245, 0.82);
          font-size: 15px;
          line-height: 1.62;
        }

        .feature-action {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          width: fit-content;
          min-width: 196px;
          gap: 12px;
          padding: 10px 12px 10px 16px;
          border-radius: 999px;
          border: 1px solid rgba(220, 252, 231, 0.38);
          background: rgba(220, 252, 231, 0.14);
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
          position: relative;
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

        .step-item .info-hint {
          margin: 0 auto 10px;
          width: 26px;
          height: 26px;
          color: #a7f3d0;
          border-color: rgba(0, 229, 192, 0.24);
          background: rgba(0, 229, 192, 0.1);
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

function InfoHint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="info-hint"
          role="img"
          aria-label={text}
          onClick={(event) => event.preventDefault()}
        >
          <Info aria-hidden="true" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="info-tooltip">
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  )
}
