'use client'

import { useEffect, useRef, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Sparkles, Rocket, CheckCircle, AlertCircle, Star, MessageCircle, Download, FileText, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { calculateRecommendations } from '@/app/constants/strategy-helpers';
import { QuestionnaireAnswers } from '@/app/types/QuestionnaireAnswers';
import { downloadHtmlAsPdf } from '@/app/utils/pdf';

// Pricing/Packaging/Roadmap sections are hidden from the UI for now.
// Data is still fetched/persisted — flip this back to true to re-show them.
const SHOW_PRICING_PACKAGING_ROADMAP = false;

type IconName = keyof typeof LucideIcons;

interface Recommendation {
    id: string;
    name: string;
    description: string;
    timeframe: string;
    expectedRevenue: string;
    implementation: string;
    implementationSteps?: string[];
    pros: string[];
    cons: string[];
    risks?: string[];
    mitigations?: string[];
    successMetrics?: string[];
    reasoning: string;
    score: number;
    icon: IconName;
    color: string;
    bgColor: string;
}

interface PricingTier {
    name: string;
    price: string;
    billingPeriod: string;
    includedUsage: string;
    overageRate: string;
    targetSegment: string;
    features: string[];
}

interface PricingBlueprint {
    model: string;
    currency: string;
    tiers: PricingTier[];
    rationale: string;
}

interface PackagingBundle {
    name: string;
    description: string;
    featuresIncluded: string[];
    upsellPath: string;
}

interface PackagingStrategy {
    strategy: string;
    bundles: PackagingBundle[];
    rationale: string;
}

interface RoadmapPhase {
    name: string;
    duration: string;
    milestones: string[];
}

interface Roadmap {
    phases: RoadmapPhase[];
}

// ─── PDF helpers ─────────────────────────────────────────────────────────────

const PDF_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a202c; background: #fff; }
  .page { padding: 40px 48px; }
  .header { border-bottom: 3px solid #0d9488; padding-bottom: 18px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; color: #0d9488; margin-bottom: 4px; }
  .header .meta { font-size: 11px; color: #64748b; }
  .badge { display: inline-block; background: #f0fdfa; border: 1px solid #99f6e4; color: #0d9488; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; margin-left: 10px; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 13px; font-weight: bold; color: #0f172a; border-left: 4px solid #0d9488; padding-left: 10px; margin-bottom: 10px; }
  .reason-box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
  .reason-box .label { font-size: 12px; font-weight: bold; color: #0f766e; margin-bottom: 6px; }
  .reason-box p { font-size: 12px; color: #134e4a; line-height: 1.6; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; }
  .info-box .label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .info-box .value { font-size: 12px; color: #1e293b; line-height: 1.4; }
  ul { list-style: none; padding: 0; }
  ul li::before { content: "• "; color: #0d9488; font-weight: bold; }
  ul li { padding: 2px 0; font-size: 11.5px; line-height: 1.5; }
  .pros li::before { color: #16a34a; }
  .cons li::before { color: #d97706; }
  .risks li::before { color: #dc2626; }
  .steps-list { counter-reset: steps; }
  .steps-list li { counter-increment: steps; padding: 4px 0 4px 24px; position: relative; }
  .steps-list li::before { content: counter(steps) ". "; position: absolute; left: 0; color: #0d9488; font-weight: bold; }
  .metrics li::before { color: #7c3aed; }
  .score-bar { height: 8px; background: #e2e8f0; border-radius: 9999px; margin-top: 6px; }
  .score-fill { height: 100%; background: #0d9488; border-radius: 9999px; }
  .visual-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .visual-card { background: #f8fafc; border: 1px solid #dbe4ef; border-radius: 8px; padding: 14px; break-inside: avoid; }
  .visual-card h3 { font-size: 12px; color: #0f172a; margin-bottom: 10px; }
  .chart-row { display: grid; grid-template-columns: 130px 1fr 36px; gap: 8px; align-items: center; margin-bottom: 8px; font-size: 10.5px; color: #334155; }
  .chart-track { height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; display: block; }
  .chart-fill { height: 100%; border-radius: inherit; background: #0d9488; display: block; }
  .donut-wrap { display: flex; align-items: center; gap: 14px; }
  .donut { width: 86px; height: 86px; border-radius: 50%; background: conic-gradient(#0d9488 var(--score), #e2e8f0 0); display: grid; place-items: center; position: relative; }
  .donut::before { content: ""; width: 54px; height: 54px; border-radius: 50%; background: #fff; position: absolute; }
  .donut span { position: relative; z-index: 1; color: #0f766e; font-weight: bold; font-size: 15px; }
  .signal-list { display: grid; gap: 7px; font-size: 11px; color: #334155; }
  .signal-list b { color: #0f172a; }
  .timeline { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px; }
  .timeline-step { border-top: 4px solid #0d9488; background: #f0fdfa; border-radius: 6px; padding: 8px; min-height: 58px; }
  .timeline-step strong { display: block; color: #0f766e; font-size: 10.5px; margin-bottom: 4px; }
  .timeline-step span { color: #334155; font-size: 10.5px; line-height: 1.35; }
  .metric-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 12px 0 18px; }
  .metric-tile { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 10px; min-height: 68px; }
  .metric-tile span { display: block; color: #64748b; font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 5px; }
  .metric-tile strong { display: block; color: #0f766e; font-size: 16px; line-height: 1.2; }
  .balance { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
  .balance-card { border: 1px solid #dbe4ef; border-radius: 8px; padding: 10px; background: #fff; }
  .balance-card strong { display: block; font-size: 19px; color: #0f172a; margin-bottom: 3px; }
  .balance-card span { color: #64748b; font-size: 10.5px; }
  .matrix { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .matrix-cell { border: 1px solid #dbe4ef; border-radius: 8px; padding: 10px; background: #fff; min-height: 76px; }
  .matrix-cell b { display: block; color: #0f172a; font-size: 11px; margin-bottom: 5px; }
  .matrix-cell p { color: #475569; font-size: 10.5px; line-height: 1.45; margin: 0; }
  .impact-ladder { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; align-items: end; min-height: 112px; }
  .ladder-step { display: grid; align-content: end; gap: 6px; text-align: center; }
  .ladder-bar { border-radius: 7px 7px 2px 2px; background: linear-gradient(180deg, #14b8a6, #0f766e); min-height: 32px; }
  .ladder-step strong { font-size: 10.5px; color: #0f766e; }
  .ladder-step span { font-size: 9.5px; color: #64748b; line-height: 1.25; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .kpi-card { border-left: 4px solid #7c3aed; background: #faf5ff; border-radius: 7px; padding: 9px; min-height: 58px; }
  .kpi-card strong { display: block; color: #581c87; font-size: 10.5px; margin-bottom: 4px; }
  .kpi-card span { display: block; color: #475569; font-size: 10px; line-height: 1.35; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
  /* comparison table */
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #0d9488; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; }
  td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; line-height: 1.4; }
  tr:nth-child(even) td { background: #f8fafc; }
  .tag { display: inline-block; background: #f0fdfa; border: 1px solid #99f6e4; color: #0d9488; border-radius: 4px; padding: 1px 6px; font-size: 10px; margin: 1px; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 24px 32px; }
  }
`;


function listHtml(items: string[] | undefined, cls = '') {
    if (!items?.length) return '<p style="color:#94a3b8;font-size:11px">—</p>';
    return `<ul class="${cls}">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
}

interface PDFNarrative {
    executive_summary: string;
    strategic_fit_analysis: string;
    business_impact: string;
    market_opportunity: string;
    competitive_advantage: string;
    implementation_deep_dive: string;
    risk_deep_dive: string;
    success_framework: string;
    recommended_next_steps: string;
}

function section(title: string, body: string, extra = '') {
    if (!body) return '';
    return `
  <div class="section">
    <div class="section-title">${title}</div>
    <p style="font-size:12px;color:#334155;line-height:1.75;margin:0">${body}</p>
    ${extra}
  </div>`;
}


function buildStrategyVisuals(strategy: Recommendation) {
    const implementationLoad = Math.min(100, Math.max(35, 100 - strategy.score + 45));
    const upside = Math.min(100, Math.max(45, strategy.score + 4));
    const risk = Math.min(100, Math.max(20, (strategy.risks?.length || strategy.cons?.length || 2) * 14));
    const prosCount = strategy.pros?.length || 0;
    const consCount = strategy.cons?.length || 0;
    const risks = (strategy.risks?.length ? strategy.risks : strategy.cons || []).slice(0, 4);
    const mitigations = (strategy.mitigations?.length ? strategy.mitigations : strategy.pros || []).slice(0, 4);
    const riskCells = [0, 1, 2, 3].map((idx) => `
        <div class="matrix-cell">
          <b>${idx + 1}. ${risks[idx] || 'Monitor adoption and buyer response'}</b>
          <p>${mitigations[idx] || 'Use staged rollout, clear measurement, and customer feedback loops to reduce uncertainty.'}</p>
        </div>
    `).join('');
    const kpis = (strategy.successMetrics?.length ? strategy.successMetrics : [
        'Revenue generated from paid API consumption',
        'Conversion from free or pilot users to paid tiers',
        'API usage growth and repeat customer adoption',
        'Gross margin after platform and support cost',
        'Churn, expansion, and renewal behavior',
        'Billing accuracy and operational support load',
    ]).slice(0, 6);
    const kpiCards = kpis.map((metric, idx) => `
        <div class="kpi-card"><strong>KPI ${idx + 1}</strong><span>${metric}</span></div>
    `).join('');
    return `
  <div class="section">
    <div class="section-title">Visual Strategy Snapshot</div>
    <div class="metric-strip">
      <div class="metric-tile"><span>Strategy Match</span><strong>${strategy.score}%</strong></div>
      <div class="metric-tile"><span>Revenue Upside</span><strong>${upside}%</strong></div>
      <div class="metric-tile"><span>Strength Signals</span><strong>${prosCount}</strong></div>
      <div class="metric-tile"><span>Risk Signals</span><strong>${Math.max(consCount, risks.length)}</strong></div>
    </div>
    <div class="visual-grid">
      <div class="visual-card">
        <h3>Confidence & Readiness</h3>
        <div class="donut-wrap">
          <div class="donut" style="--score:${strategy.score}%"><span>${strategy.score}%</span></div>
          <div class="signal-list">
            <div><b>Fit:</b> ${strategy.name}</div>
            <div><b>Timeline:</b> ${strategy.timeframe || 'To be defined'}</div>
            <div><b>Revenue:</b> ${strategy.expectedRevenue || 'To be validated'}</div>
          </div>
        </div>
      </div>
      <div class="visual-card">
        <h3>Decision Factors</h3>
        <div class="chart-row"><span>Strategy Match</span><i class="chart-track"><b class="chart-fill" style="width:${strategy.score}%"></b></i><strong>${strategy.score}%</strong></div>
        <div class="chart-row"><span>Revenue Upside</span><i class="chart-track"><b class="chart-fill" style="width:${upside}%"></b></i><strong>${upside}%</strong></div>
        <div class="chart-row"><span>Implementation Load</span><i class="chart-track"><b class="chart-fill" style="width:${implementationLoad}%;background:#2563eb"></b></i><strong>${implementationLoad}%</strong></div>
        <div class="chart-row"><span>Risk Attention</span><i class="chart-track"><b class="chart-fill" style="width:${risk}%;background:#d97706"></b></i><strong>${risk}%</strong></div>
      </div>
    </div>
    <div class="visual-grid">
      <div class="visual-card">
        <h3>Strength vs Consideration Balance</h3>
        <div class="chart-row"><span>Strengths</span><i class="chart-track"><b class="chart-fill" style="width:${Math.min(100, Math.max(20, prosCount * 18))}%;background:#16a34a"></b></i><strong>${prosCount}</strong></div>
        <div class="chart-row"><span>Considerations</span><i class="chart-track"><b class="chart-fill" style="width:${Math.min(100, Math.max(20, consCount * 18))}%;background:#d97706"></b></i><strong>${consCount}</strong></div>
        <div class="balance">
          <div class="balance-card"><strong>${Math.max(1, prosCount - consCount + 3)}</strong><span>Positive momentum index</span></div>
          <div class="balance-card"><strong>${risk}%</strong><span>Governance attention needed</span></div>
        </div>
      </div>
      <div class="visual-card">
        <h3>Revenue Impact Ladder</h3>
        <div class="impact-ladder">
          <div class="ladder-step"><div class="ladder-bar" style="height:34px"></div><strong>Validate</strong><span>Confirm pricing metric</span></div>
          <div class="ladder-step"><div class="ladder-bar" style="height:52px"></div><strong>Pilot</strong><span>Test paid package</span></div>
          <div class="ladder-step"><div class="ladder-bar" style="height:74px"></div><strong>Scale</strong><span>Expand segments</span></div>
          <div class="ladder-step"><div class="ladder-bar" style="height:96px"></div><strong>Optimize</strong><span>Improve margin</span></div>
        </div>
      </div>
    </div>
    <div class="visual-card">
      <h3>Risk to Mitigation Matrix</h3>
      <div class="matrix">${riskCells}</div>
    </div>
    <div class="visual-card">
      <h3>Measurement Dashboard</h3>
      <div class="kpi-grid">${kpiCards}</div>
    </div>
    <div class="visual-card">
      <h3>Suggested Rollout Timeline</h3>
      <div class="timeline">
        <div class="timeline-step"><strong>1. Validate</strong><span>Confirm target segment, pricing assumptions, and core value metric.</span></div>
        <div class="timeline-step"><strong>2. Package</strong><span>Define tiers, usage limits, entitlements, and upgrade paths.</span></div>
        <div class="timeline-step"><strong>3. Launch</strong><span>Release to a controlled customer group with billing and reporting enabled.</span></div>
        <div class="timeline-step"><strong>4. Optimize</strong><span>Measure adoption, conversion, revenue, churn, and support impact.</span></div>
      </div>
    </div>
  </div>`;
}
function buildStrategyPDFHtml(strategy: Recommendation, industry: string, n: PDFNarrative | null) {
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    return `
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <h1>${strategy.name} <span class="badge">${strategy.score}% match</span></h1>
    <div class="meta">Monetization Strategy Report &nbsp;·&nbsp; Industry: ${industry} &nbsp;·&nbsp; Generated ${date}</div>
    <div style="margin-top:12px">
      <div style="font-size:10px;color:#64748b;margin-bottom:4px;font-weight:bold;text-transform:uppercase;letter-spacing:.05em">Confidence Score</div>
      <div class="score-bar"><div class="score-fill" style="width:${strategy.score}%"></div></div>
      <div style="font-size:10px;color:#0d9488;margin-top:3px;font-weight:bold">${strategy.score}%</div>
    </div>
  </div>

  ${buildStrategyVisuals(strategy)}

  <!-- EXECUTIVE SUMMARY -->
  ${n?.executive_summary ? `
  <div class="reason-box" style="border-left:4px solid #0d9488;border-color:#99f6e4;background:#f0fdfa;margin-bottom:22px">
    <div class="label" style="font-size:12px;font-weight:bold;color:#0f766e;margin-bottom:8px">📋 Executive Summary</div>
    <p style="font-size:12.5px;line-height:1.8;color:#134e4a;margin:0">${n.executive_summary}</p>
  </div>` : strategy.reasoning ? `
  <div class="reason-box" style="margin-bottom:22px">
    <div class="label" style="margin-bottom:6px">💡 Why We Recommend This</div>
    <p style="font-size:12px;line-height:1.75;margin:0">${strategy.reasoning}</p>
  </div>` : ''}

  <!-- OVERVIEW & KEY DETAILS -->
  <div class="section">
    <div class="section-title">📌 Strategy Overview</div>
    <p style="font-size:12px;color:#334155;line-height:1.75;margin:0 0 14px">${strategy.description}</p>
    <div class="grid3">
      <div class="info-box"><div class="label">Timeframe</div><div class="value">${strategy.timeframe || '—'}</div></div>
      <div class="info-box"><div class="label">Expected Revenue</div><div class="value">${strategy.expectedRevenue || '—'}</div></div>
      <div class="info-box"><div class="label">Implementation</div><div class="value">${strategy.implementation || '—'}</div></div>
    </div>
  </div>

  <!-- STRATEGIC FIT -->
  ${section('🎯 Strategic Fit Analysis', n?.strategic_fit_analysis || '')}

  <!-- BUSINESS IMPACT -->
  ${section('📈 Business Impact & Revenue Outlook', n?.business_impact || '')}

  <!-- MARKET OPPORTUNITY -->
  ${section('🌍 Market Opportunity', n?.market_opportunity || '')}

  <!-- COMPETITIVE ADVANTAGE -->
  ${section('🏆 Competitive Advantage', n?.competitive_advantage || '')}

  <!-- PROS & CONS -->
  <div class="section">
    <div class="section-title">✅ Strengths &amp; ⚠️ Considerations</div>
    <div class="grid2">
      <div>
        <div style="font-size:11px;font-weight:bold;color:#16a34a;margin-bottom:6px">Strengths</div>
        ${listHtml(strategy.pros, 'pros')}
      </div>
      <div>
        <div style="font-size:11px;font-weight:bold;color:#d97706;margin-bottom:6px">Considerations</div>
        ${listHtml(strategy.cons, 'cons')}
      </div>
    </div>
  </div>

  <!-- IMPLEMENTATION DEEP DIVE -->
  ${section('🗺️ Implementation Deep Dive', n?.implementation_deep_dive || '',
    strategy.implementationSteps?.length ? `
    <div style="margin-top:12px">
      <div style="font-size:11px;font-weight:bold;color:#0d9488;margin-bottom:6px">Step-by-step plan:</div>
      ${listHtml(strategy.implementationSteps, 'steps-list')}
    </div>` : ''
  )}

  <!-- RISK ANALYSIS -->
  ${n?.risk_deep_dive ? `
  <div class="section">
    <div class="section-title">🚨 Risk Analysis &amp; Mitigation</div>
    <p style="font-size:12px;color:#334155;line-height:1.75;margin:0 0 12px">${n.risk_deep_dive}</p>
    ${(strategy.risks?.length || strategy.mitigations?.length) ? `
    <div class="grid2">
      <div><div style="font-size:11px;font-weight:bold;color:#dc2626;margin-bottom:6px">Key Risks</div>${listHtml(strategy.risks, 'risks')}</div>
      <div><div style="font-size:11px;font-weight:bold;color:#0d9488;margin-bottom:6px">Mitigations</div>${listHtml(strategy.mitigations)}</div>
    </div>` : ''}
  </div>` : (strategy.risks?.length || strategy.mitigations?.length) ? `
  <div class="section">
    <div class="section-title">🚨 Risks &amp; Mitigations</div>
    <div class="grid2">
      <div>${listHtml(strategy.risks, 'risks')}</div>
      <div>${listHtml(strategy.mitigations)}</div>
    </div>
  </div>` : ''}

  <!-- SUCCESS FRAMEWORK -->
  ${section('📊 Success Framework & KPIs', n?.success_framework || '',
    strategy.successMetrics?.length ? `
    <div style="margin-top:10px">
      <div style="font-size:11px;font-weight:bold;color:#7c3aed;margin-bottom:6px">Key metrics to track:</div>
      ${listHtml(strategy.successMetrics, 'metrics')}
    </div>` : ''
  )}

  <!-- NEXT STEPS -->
  ${section('🚀 Recommended Next Steps (Next 30 Days)', n?.recommended_next_steps || '')}

  <div class="footer">MonetizeMate &nbsp;·&nbsp; Confidential &nbsp;·&nbsp; This report was generated by AI and should be reviewed by a qualified business strategist before implementation.</div>
</div>`;
}

async function fetchPDFNarrative(strategy: Recommendation, industry: string): Promise<PDFNarrative | null> {
    try {
        const response = await fetch('/api/monetization/enhance-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                industry,
                strategy_name: strategy.name,
                description: strategy.description,
                reasoning: strategy.reasoning || '',
                pros: strategy.pros || [],
                cons: strategy.cons || [],
                risks: strategy.risks || [],
                mitigations: strategy.mitigations || [],
                implementation_steps: strategy.implementationSteps || [],
                timeframe: strategy.timeframe || '',
                expected_revenue: strategy.expectedRevenue || '',
                success_metrics: strategy.successMetrics || [],
                score: strategy.score,
            }),
        });
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
}

async function downloadComparisonPDF(strategies: Recommendation[], industry: string) {
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const tableRows = strategies.map((s, i) => `
      <tr>
        <td><strong>${i === 0 ? '⭐ ' : ''}${s.name}</strong><br><span style="color:#64748b;font-size:10px">${s.score}% match</span></td>
        <td>${s.description}</td>
        <td>${s.timeframe || '—'}</td>
        <td>${s.expectedRevenue || '—'}</td>
        <td>${(s.pros || []).map(p => `<span class="tag">${p}</span>`).join(' ')}</td>
        <td>${(s.cons || []).map(c => `<span class="tag" style="border-color:#fcd34d;background:#fffbeb;color:#92400e">${c}</span>`).join(' ')}</td>
      </tr>`).join('');

    const scoreChart = strategies.map((s, i) => `
      <div class="chart-row">
        <span>${i === 0 ? 'Top: ' : ''}${s.name}</span>
        <i class="chart-track"><b class="chart-fill" style="width:${s.score}%;background:${i === 0 ? '#0d9488' : '#2563eb'}"></b></i>
        <strong>${s.score}%</strong>
      </div>`).join('');

    const detailSections = strategies.map((s, i) => `
      <div style="margin-top:32px;padding-top:20px;border-top:2px solid #e2e8f0">
        <h2 style="font-size:16px;color:#0d9488;margin-bottom:8px">${i === 0 ? '⭐ ' : ''}${s.name} <span style="font-size:12px;color:#64748b;font-weight:normal">${s.score}% match</span></h2>
        ${s.reasoning ? `<div class="reason-box" style="margin-bottom:14px"><div class="label">💡 Why We Recommend This</div><p>${s.reasoning}</p></div>` : ''}
        <div class="grid2">
          <div><div class="section-title">✅ Pros</div>${listHtml(s.pros, 'pros')}</div>
          <div><div class="section-title">⚠️ Considerations</div>${listHtml(s.cons, 'cons')}</div>
        </div>
        ${s.implementationSteps?.length ? `<div style="margin-top:12px"><div class="section-title">🗺️ Implementation Steps</div>${listHtml(s.implementationSteps, 'steps-list')}</div>` : ''}
      </div>`).join('');

    const html = `
<div class="page">
  <div class="header">
    <h1>Monetization Strategy Comparison Report</h1>
    <div class="meta">Industry: ${industry} · ${strategies.length} strategies compared · Generated ${date}</div>
  </div>

  <div class="section">
    <div class="section-title">Visual Score Ranking</div>
    <div class="visual-card">
      ${scoreChart}
    </div>
  </div>

  <div class="section">
    <div class="section-title">At a Glance — All Strategies Compared</div>
    <table>
      <thead>
        <tr>
          <th>Strategy</th>
          <th>Description</th>
          <th>Timeframe</th>
          <th>Expected Revenue</th>
          <th>Pros</th>
          <th>Considerations</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Detailed Breakdown — Each Strategy</div>
    ${detailSections}
  </div>

  <div class="footer">MonetizeMate · Confidential · This report was generated by AI and should be reviewed by a qualified business strategist.</div>
</div>`;
    await downloadHtmlAsPdf(html, PDF_STYLES, `monetization-strategy-comparison-${industry.toLowerCase().replace(/\s+/g, '-')}.pdf`, 'comparison_pdf');
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function RecommendationsPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const recommendationState = useMemo(() => {
        const source = searchParams.get('analysisSource');
        const industry = searchParams.get('selectedIndustry');

        const recommendationsData =
            searchParams.get('recommendations') ||
            (typeof window !== 'undefined' ? sessionStorage.getItem('recommendations_data') : null);

        const answersData = searchParams.get('answers');

        if (recommendationsData) {
            try {
                if (typeof window !== 'undefined') sessionStorage.removeItem('recommendations_data');
                const parsed = JSON.parse(recommendationsData);
                const aiRecommendations = Array.isArray(parsed)
                    ? parsed
                    : Array.isArray(parsed.recommendations)
                        ? parsed.recommendations
                        : [];
                if (!aiRecommendations.length) throw new Error('No AI recommendations found');
                return {
                    recommendations: aiRecommendations as Recommendation[],
                    analysisSource: parsed.analysisSource || source || 'ai-chat',
                    selectedIndustry: parsed.selectedIndustry || industry || '',
                    pricing: (parsed.pricing || null) as PricingBlueprint | null,
                    packaging: (parsed.packaging || null) as PackagingStrategy | null,
                    roadmap: (parsed.roadmap || null) as Roadmap | null,
                    invalid: false,
                };
            } catch {
                return { recommendations: [], analysisSource: '', selectedIndustry: '', pricing: null, packaging: null, roadmap: null, invalid: true };
            }
        } else if (answersData && source && industry) {
            try {
                const answers: Partial<QuestionnaireAnswers> = JSON.parse(answersData);
                const calculatedRecommendations = calculateRecommendations(answers, industry);
                return {
                    recommendations: calculatedRecommendations as Recommendation[],
                    pricing: null,
                    packaging: null,
                    roadmap: null,
                    analysisSource: source,
                    selectedIndustry: industry || '',
                    invalid: false,
                };
            } catch {
                return { recommendations: [], analysisSource: '', selectedIndustry: '', pricing: null, packaging: null, roadmap: null, invalid: true };
            }
        }
        return { recommendations: [], analysisSource: '', selectedIndustry: '', pricing: null, packaging: null, roadmap: null, invalid: true };
    }, [searchParams]);

    useEffect(() => {
        if (recommendationState.invalid) router.push('/dashboard/strategy-adviser');
    }, [recommendationState.invalid, router]);

    const { recommendations, analysisSource, selectedIndustry, pricing, packaging, roadmap } = recommendationState;

    // Cache: strategy.id → PDFNarrative (pre-fetched in background on page load)
    const narrativeCache = useRef<Map<string, PDFNarrative | null>>(new Map());
    const [readyIds, setReadyIds] = useState<Set<string>>(new Set());
    const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
    const [downloadingComparison, setDownloadingComparison] = useState(false);

    // Pre-fetch narratives sequentially in background so PDF is instant on click
    useEffect(() => {
        if (!recommendations.length || !selectedIndustry) return;
        let cancelled = false;

        const prefetch = async () => {
            for (const strategy of recommendations) {
                if (cancelled) break;
                if (narrativeCache.current.has(strategy.id)) continue;
                const narrative = await fetchPDFNarrative(strategy, selectedIndustry);
                if (cancelled) break;
                narrativeCache.current.set(strategy.id, narrative);
                setReadyIds(prev => new Set(prev).add(strategy.id));
                // Small gap between requests to respect Groq TPM limits
                await new Promise(r => setTimeout(r, 2000));
            }
        };

        prefetch();
        return () => { cancelled = true; };
    }, [recommendations, selectedIndustry]);

    const handleDownloadStrategyPDF = async (strategy: Recommendation) => {
        setDownloadingIds(prev => new Set(prev).add(strategy.id));
        try {
            const narrative = narrativeCache.current.get(strategy.id) ?? null;
            const html = buildStrategyPDFHtml(strategy, selectedIndustry, narrative);
            await downloadHtmlAsPdf(html, PDF_STYLES, `${strategy.name.toLowerCase().replace(/\s+/g, '-')}-strategy-report.pdf`, 'strategy_pdf');
        } finally {
            setDownloadingIds(prev => {
                const next = new Set(prev);
                next.delete(strategy.id);
                return next;
            });
        }
    };

    const handleDownloadComparisonPDF = async () => {
        setDownloadingComparison(true);
        try {
            await downloadComparisonPDF(recommendations, selectedIndustry);
        } finally {
            setDownloadingComparison(false);
        }
    };

    const onStartImplementation = (strategy: Recommendation) => {
        // Persist recommendations so the back button on the implementation page can restore them
        sessionStorage.setItem('recommendations_data', JSON.stringify({
            recommendations,
            analysisSource,
            selectedIndustry,
            pricing,
            packaging,
            roadmap,
        }));
        const params = new URLSearchParams();
        params.set('strategy', JSON.stringify(strategy));
        params.set('selectedIndustry', selectedIndustry);
        params.set('analysisSource', analysisSource);
        router.push(`/dashboard/implementation?${params.toString()}`);
    };

    if (recommendations.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <p>Loading recommendations...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" onClick={() => router.push('/dashboard/strategy-adviser')} className="border-blue-300 text-blue-700 hover:bg-blue-50">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Start Over
                    </Button>
                    {analysisSource === 'ai-chat' && (
                        <Button variant="outline" onClick={() => router.push('/dashboard/strategy-adviser/ai-chat?resume=1')} className="border-blue-300 text-blue-700 hover:bg-blue-50">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Back to AI Chat
                        </Button>
                    )}
                    <div className="flex-grow">
                        <div className="flex items-center gap-4">
                            <Sparkles className="w-8 h-8 text-blue-600" />
                            <div>
                                <h1 className="text-2xl text-blue-900">Your Monetization Strategy Recommendations</h1>
                                <p className="text-blue-700">
                                    Based on {analysisSource === 'file' ? 'your data analysis' : analysisSource === 'ai-chat' ? 'your AI chat conversation' : 'your questionnaire responses'}
                                    {selectedIndustry && ` for ${selectedIndustry}`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing blueprint */}
                {SHOW_PRICING_PACKAGING_ROADMAP && pricing && (
                    <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-200 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Badge className="bg-blue-600 text-white">Pricing</Badge>
                            <h2 className="text-xl text-blue-900">{pricing.model}</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
                            {pricing.tiers.map((tier, idx) => (
                                <div key={idx} className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                                    <div className="flex items-baseline justify-between mb-1">
                                        <h4 className="text-blue-900 font-bold">{tier.name}</h4>
                                        <span className="text-blue-700 font-bold text-sm">{tier.price}</span>
                                    </div>
                                    <p className="text-xs text-blue-500 mb-2">{tier.billingPeriod} · {tier.targetSegment}</p>
                                    <p className="text-xs text-blue-700 mb-2">
                                        <span className="font-semibold">Included:</span> {tier.includedUsage} &nbsp;·&nbsp;
                                        <span className="font-semibold">Overage:</span> {tier.overageRate}
                                    </p>
                                    {tier.features.length > 0 && (
                                        <ul className="text-xs text-blue-600 space-y-1">
                                            {tier.features.map((f, fi) => <li key={fi}>• {f}</li>)}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                        {pricing.rationale && <p className="text-sm text-blue-700 leading-relaxed">{pricing.rationale}</p>}
                    </Card>
                )}

                {/* Packaging strategy */}
                {SHOW_PRICING_PACKAGING_ROADMAP && packaging && (
                    <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-200 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Badge className="bg-purple-600 text-white">Packaging</Badge>
                            <h2 className="text-xl text-blue-900">{packaging.strategy}</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
                            {packaging.bundles.map((bundle, idx) => (
                                <div key={idx} className="rounded-xl border border-purple-100 bg-purple-50/60 p-4">
                                    <h4 className="text-purple-900 font-bold mb-1">{bundle.name}</h4>
                                    {bundle.description && <p className="text-xs text-purple-700 mb-2">{bundle.description}</p>}
                                    {bundle.featuresIncluded.length > 0 && (
                                        <ul className="text-xs text-purple-600 space-y-1 mb-2">
                                            {bundle.featuresIncluded.map((f, fi) => <li key={fi}>• {f}</li>)}
                                        </ul>
                                    )}
                                    {bundle.upsellPath && (
                                        <p className="text-xs text-purple-500 italic">Upsell: {bundle.upsellPath}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                        {packaging.rationale && <p className="text-sm text-blue-700 leading-relaxed">{packaging.rationale}</p>}
                    </Card>
                )}

                {/* Roadmap */}
                {SHOW_PRICING_PACKAGING_ROADMAP && roadmap && roadmap.phases.length > 0 && (
                    <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-200 mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <Badge className="bg-teal-600 text-white">Roadmap</Badge>
                            <h2 className="text-xl text-blue-900">Monetization Rollout Roadmap</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {roadmap.phases.map((phase, idx) => (
                                <div key={idx} className="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
                                    <h4 className="text-teal-900 font-bold text-sm mb-1">{phase.name}</h4>
                                    <p className="text-xs text-teal-600 mb-2">{phase.duration}</p>
                                    {phase.milestones.length > 0 && (
                                        <ul className="text-xs text-teal-700 space-y-1">
                                            {phase.milestones.map((m, mi) => <li key={mi}>• {m}</li>)}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Strategy cards */}
                <div className="grid gap-6">
                    {recommendations.map((strategy, index) => {
                        const IconComponent = LucideIcons[strategy.icon] as React.ElementType;
                        return (
                            <Card key={strategy.id} className={`p-6 bg-white/80 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-all duration-300 ${index === 0 ? 'ring-2 ring-blue-400' : ''}`}>
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 ${strategy.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                        {IconComponent && <IconComponent className={`w-6 h-6 ${strategy.color}`} />}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl text-blue-900">{strategy.name}</h3>
                                            <Badge variant="outline" className={`${strategy.color} border-current`}>{strategy.score}% match</Badge>
                                            {index === 0 && (
                                                <Badge className="bg-blue-600 text-white">
                                                    <Star className="w-3 h-3 mr-1" />Recommended
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-blue-700 mb-4">{strategy.description}</p>

                                        {strategy.reasoning && (
                                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-5">
                                                <h4 className="text-blue-900 font-bold text-sm mb-2">💡 Why We Recommend This</h4>
                                                <p className="text-blue-800 text-sm leading-relaxed">{strategy.reasoning}</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <h4 className="text-blue-900 text-sm mb-1">Timeframe</h4>
                                                <p className="text-blue-600 text-sm">{strategy.timeframe}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-blue-900 text-sm mb-1">Expected Revenue</h4>
                                                <p className="text-blue-600 text-sm">{strategy.expectedRevenue}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-blue-900 text-sm mb-1">Implementation</h4>
                                                <p className="text-blue-600 text-sm">{strategy.implementation}</p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Button onClick={() => onStartImplementation(strategy)} className="bg-blue-600 hover:bg-blue-700 w-full">
                                                    <Rocket className="w-4 h-4 mr-2" />Start Implementation
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleDownloadStrategyPDF(strategy)}
                                                    disabled={downloadingIds.has(strategy.id)}
                                                    className="w-full border-teal-400 text-teal-700 hover:bg-teal-50"
                                                >
                                                    {downloadingIds.has(strategy.id) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                                    {downloadingIds.has(strategy.id) ? 'Generating PDF…' : readyIds.has(strategy.id) ? 'Download PDF (AI Enhanced)' : 'Download PDF'}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-green-700 text-sm mb-2 flex items-center"><CheckCircle className="w-4 h-4 mr-1" />Pros</h4>
                                                <ul className="text-green-600 text-sm space-y-1">
                                                    {strategy.pros.map((pro, idx) => <li key={idx}>• {pro}</li>)}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="text-orange-700 text-sm mb-2 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />Considerations</h4>
                                                <ul className="text-orange-600 text-sm space-y-1">
                                                    {strategy.cons.map((con, idx) => <li key={idx}>• {con}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Bottom section */}
                <div className="mt-8">
                    {/* Full comparison PDF download */}
                    <Card className="p-6 bg-white/80 backdrop-blur-sm border-teal-200 mb-6">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-6 h-6 text-teal-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-teal-900">Full Strategy Comparison Report</h3>
                                    <p className="text-sm text-teal-700">
                                        Download a single PDF with all {recommendations.length} strategies — side-by-side comparison table, detailed breakdown, pros &amp; cons, and implementation steps for each.
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleDownloadComparisonPDF}
                                disabled={downloadingComparison}
                                className="flex-shrink-0 bg-teal-600 hover:bg-teal-700 text-white"
                            >
                                {downloadingComparison ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                {downloadingComparison ? 'Generating PDF…' : 'Download Comparison PDF'}
                            </Button>
                        </div>
                    </Card>

                    {/* Start top recommendation */}
                    <div className="text-center">
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
                            <Sparkles className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-xl text-blue-900 mb-2">Ready to Implement?</h3>
                            <p className="text-blue-700 mb-4">Each recommendation includes a comprehensive implementation guide with step-by-step phases, progress tracking, and resource support.</p>
                            <Button onClick={() => onStartImplementation(recommendations[0])} className="bg-blue-600 hover:bg-blue-700">
                                <Rocket className="w-4 h-4 mr-2" />
                                Start with Top Recommendation
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RecommendationsPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', background: '#060E1E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00E5C0' }}>Loading…</div>}>
            <RecommendationsPageInner />
        </Suspense>
    );
}
