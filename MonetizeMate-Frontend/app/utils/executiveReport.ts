// Shared visual language for every downloadable report in the app — modeled
// on the "Executive Brief" reference design: a confidential-brief header,
// tag pills, metric tiles, titled insight cards, and a consistent teal/amber/
// red status-badge vocabulary. Each PDF builder (strategy, comparison,
// business data, implementation plan) composes these same building blocks
// rather than each inventing its own look.

export interface StrategicFit {
    partnerEcosystemReadiness: number;
    revenueModelAlignment: number;
    infrastructureMaturity: number;
    marketTiming: number;
}

export interface WhyThisStrategyItem {
    title: string;
    description: string;
}

export interface NextStepItem {
    action: string;
    timeframe: string;
}


export const EXEC_REPORT_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1e293b; background: #fff; }
  .page { padding: 36px 42px; }

  /* Header */
  .xr-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; margin-bottom: 20px; }
  .xr-brand { display: flex; align-items: center; gap: 10px; }
  .xr-logo { width: 32px; height: 32px; border-radius: 8px; background: #0d9488; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 15px; flex-shrink: 0; }
  .xr-brand-name { font-size: 15px; font-weight: bold; color: #0f172a; }
  .xr-brand-tag { font-size: 9px; letter-spacing: 0.06em; color: #64748b; font-weight: bold; text-transform: uppercase; }
  .xr-meta { text-align: right; font-size: 10.5px; color: #64748b; line-height: 1.6; }
  .xr-meta b { color: #1e293b; }
  .xr-header-title { font-size: 13px; font-weight: bold; color: #0f172a; }
  .xr-header-strategy { font-size: 13px; font-weight: bold; color: #0d9488; }

  /* Brief kicker + title */
  .xr-kicker { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #0d9488; font-weight: bold; margin-bottom: 6px; }
  .xr-title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 18px; }
  .xr-title-row h1 { font-size: 22px; color: #0f172a; }
  .xr-pills { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
  .xr-pill { font-size: 10px; font-weight: bold; padding: 3px 10px; border-radius: 999px; border: 1px solid #99f6e4; color: #0d9488; background: #f0fdfa; white-space: nowrap; }

  /* Recommended strategy hero card */
  .xr-hero { border: 1.5px solid #99f6e4; border-radius: 10px; padding: 20px 22px; margin-bottom: 22px; background: #fafffe; break-inside: avoid; }
  .xr-hero-eyebrow { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #0d9488; font-weight: bold; margin-bottom: 6px; }
  .xr-hero h2 { font-size: 24px; color: #0f172a; margin-bottom: 6px; }
  .xr-hero p.desc { color: #475569; font-size: 12.5px; margin-bottom: 16px; }
  .xr-tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .xr-tile { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #fff; break-inside: avoid; }
  .xr-tile .lbl { font-size: 9px; letter-spacing: 0.04em; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 6px; }
  .xr-tile .val { font-size: 19px; font-weight: bold; color: #0f172a; line-height: 1.2; }
  .xr-tile .sub { font-size: 10px; color: #64748b; margin-top: 3px; }
  .xr-tile .val.teal { color: #0d9488; } .xr-tile .val.amber { color: #d97706; }

  /* Section heading */
  .xr-section { margin-bottom: 16px; }
  .xr-section-heading { font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: #0d9488; font-weight: bold; margin-bottom: 12px; }

  /* Generic info-tile grid, reused by reports that need a labeled fact grid (e.g. a business profile) */
  .xr-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .xr-info-tile { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; break-inside: avoid; }
  .xr-info-tile .k { font-size: 9.5px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 3px; }
  .xr-info-tile .v { font-size: 12px; color: #1e293b; }

  /* Generic bullet list, reused by reports that need a plain pros/cons/steps list */
  ul.xr-list { list-style: none; }
  ul.xr-list li { font-size: 11px; color: #475569; padding: 2px 0 2px 14px; position: relative; line-height: 1.5; }
  ul.xr-list li::before { content: "\\2022"; position: absolute; left: 0; color: #0d9488; font-weight: bold; }
  ul.xr-list.cons li::before { color: #d97706; }
  ul.xr-list.steps { counter-reset: steps; }
  ul.xr-list.steps li { counter-increment: steps; padding-left: 18px; }
  ul.xr-list.steps li::before { content: counter(steps) "."; }

  /* Simple comparison table (distinct from the pricing xr-table's own tone) */
  table.xr-compare th { background: #0d9488; color: #fff; }
  table.xr-compare .xr-mini-tag { display: inline-block; background: #f0fdfa; border: 1px solid #99f6e4; color: #0d9488; border-radius: 4px; padding: 1px 6px; font-size: 10px; margin: 1px; }
  table.xr-compare .xr-mini-tag.con { border-color: #fcd34d; background: #fffbeb; color: #92400e; }

  /* Why-this-strategy cards */
  .xr-why-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .xr-why-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; break-inside: avoid; }
  .xr-why-card .ic { font-size: 18px; margin-bottom: 8px; }
  .xr-why-card h4 { font-size: 12.5px; color: #0f172a; margin-bottom: 6px; }
  .xr-why-card p { font-size: 11px; color: #475569; line-height: 1.5; }

  /* Strategic fit grid */
  .xr-fit-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 32px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; }
  .xr-fit-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; break-inside: avoid; }
  .xr-fit-row .fit-label { font-size: 12px; color: #334155; }
  .xr-fit-row .fit-value { font-size: 13px; font-weight: bold; }
  .xr-fit-row .fit-value.high { color: #0d9488; } .xr-fit-row .fit-value.mid { color: #d97706; } .xr-fit-row .fit-value.low { color: #dc2626; }

  /* Alternatives */
  .xr-alt-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .xr-alt-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; break-inside: avoid; }
  .xr-alt-card h4 { font-size: 12.5px; color: #0f172a; margin-bottom: 6px; }
  .xr-alt-card p { font-size: 11px; color: #475569; line-height: 1.5; }
  .xr-status { display: inline-block; font-size: 9px; font-weight: bold; letter-spacing: 0.03em; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px; }
  .xr-status.not-recommended { background: #fef2f2; color: #dc2626; }
  .xr-status.deferred { background: #fffbeb; color: #d97706; }
  .xr-status.low-risk { background: #f0fdf4; color: #16a34a; }
  .xr-status.consider { background: #fffbeb; color: #d97706; }

  /* Pricing table */
  table.xr-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  table.xr-table th { text-align: left; font-size: 9.5px; letter-spacing: 0.04em; text-transform: uppercase; color: #64748b; font-weight: bold; padding: 8px 10px; border-bottom: 1.5px solid #cbd5e1; }
  table.xr-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; color: #334155; vertical-align: top; }
  table.xr-table tr:last-child td { border-bottom: none; }
  table.xr-table td.tier-name { font-weight: bold; color: #0f172a; }
  table.xr-table td.rate { font-weight: bold; }
  .xr-table-footnote { display: flex; justify-content: space-between; font-size: 10.5px; color: #64748b; padding: 10px; border-top: 1px solid #e2e8f0; }

  /* Roadmap */
  .xr-roadmap-step { border: 1px solid #e2e8f0; border-radius: 8px; padding: 11px 16px; margin-bottom: 8px; break-inside: avoid; }
  .xr-roadmap-step .row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
  .xr-roadmap-step .row h4 { font-size: 13px; color: #0f172a; }
  .xr-roadmap-step .row .when { font-size: 10.5px; color: #0d9488; font-weight: bold; white-space: nowrap; }
  .xr-roadmap-step ul { list-style: none; }
  .xr-roadmap-step li { font-size: 11px; color: #475569; line-height: 1.6; padding-left: 14px; position: relative; }
  .xr-roadmap-step li::before { content: "\\203A"; position: absolute; left: 0; color: #0d9488; font-weight: bold; }

  /* Risks + next steps two column */
  .xr-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .xr-risk-card { border: 1px solid #fde68a; border-radius: 8px; padding: 9px 14px; margin-bottom: 8px; background: #fffdf5; break-inside: avoid; }
  .xr-risk-card.low-risk { border-color: #bbf7d0; background: #f7fdf9; }
  .xr-risk-card .row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
  .xr-risk-card h4 { font-size: 12px; color: #0f172a; }
  .xr-risk-card p { font-size: 11px; color: #475569; line-height: 1.5; }
  .xr-next-step { display: flex; gap: 10px; margin-bottom: 9px; break-inside: avoid; }
  .xr-next-step .num { width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid #0d9488; color: #0d9488; font-size: 10.5px; font-weight: bold; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .xr-next-step .body p { font-size: 11.5px; color: #334155; line-height: 1.4; }
  .xr-next-step .body span { font-size: 10px; color: #64748b; }

  /* Advisory note */
  .xr-advisory { border-left: 3px solid #0d9488; background: #f8fafc; border-radius: 0 8px 8px 0; padding: 12px 16px; break-inside: avoid; }
  .xr-advisory .lbl { font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: #0d9488; font-weight: bold; margin-bottom: 5px; }
  .xr-advisory p { font-size: 11.5px; color: #334155; line-height: 1.55; }
  .xr-advisory strong { color: #0d9488; }

  /* Distribution bar list (platform-wide stats, e.g. admin reports) */
  .xr-bar-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; break-inside: avoid; }
  .xr-bar-title { font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 10px; }
  .xr-bar-row { display: grid; grid-template-columns: 110px 1fr 34px; gap: 8px; align-items: center; margin-bottom: 7px; font-size: 10.5px; color: #334155; }
  .xr-bar-track { height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; display: block; }
  .xr-bar-fill { height: 100%; display: block; border-radius: inherit; background: #0d9488; }

  /* Footer */
  .xr-footer { display: flex; justify-content: space-between; font-size: 9.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 14px; }
`;

export function xrList(items: string[] | undefined, cls = ''): string {
    if (!items?.length) return '<p style="color:#94a3b8;font-size:11px">—</p>';
    return `<ul class="xr-list ${cls}">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

export function xrInfoGrid(rows: [string, string][]): string {
    return `<div class="xr-info-grid">${rows.map(([k, v]) => `<div class="xr-info-tile"><div class="k">${esc(k)}</div><div class="v">${esc(v) || '—'}</div></div>`).join('')}</div>`;
}

export function xrSectionTitled(heading: string, bodyHtml: string): string {
    return `<div class="xr-section"><div class="xr-section-heading">${esc(heading)}</div>${bodyHtml}</div>`;
}

export function xrBarList(title: string, items: { label: string; percentage: number }[]): string {
    const rows = items.slice(0, 6).map((item) => `
        <div class="xr-bar-row">
          <span>${esc(item.label)}</span>
          <span class="xr-bar-track"><span class="xr-bar-fill" style="width:${Math.max(item.percentage, 4)}%"></span></span>
          <strong>${esc(item.percentage)}%</strong>
        </div>`).join('');
    return `
    <div class="xr-bar-card">
      <div class="xr-bar-title">${esc(title)}</div>
      ${rows || '<p style="color:#94a3b8;font-size:11px">No data yet.</p>'}
    </div>`;
}

function esc(value: string | number | undefined | null): string {
    const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(value ?? '').replace(/[&<>"']/g, (char) => entities[char] || char);
}

export function xrHeader(opts: { industry: string; generatedDate: string; reportId: string; rightTitle?: string; rightStrategy?: string }): string {
    return `
    <div class="xr-header">
      <div class="xr-brand">
        <span class="xr-logo">M</span>
        <div>
          <div class="xr-brand-name">MonetizeMate ${opts.rightTitle ? `<span style="color:#64748b;font-weight:normal">&nbsp;·&nbsp;${esc(opts.rightTitle)}</span>` : ''}</div>
          ${opts.rightTitle ? '' : '<div class="xr-brand-tag">AI Monetization Advisor</div>'}
        </div>
      </div>
      ${opts.rightStrategy
            ? `<div class="xr-header-strategy">${esc(opts.rightStrategy)}</div>`
            : `<div class="xr-meta">Industry: <b>${esc(opts.industry)}</b><br/>Generated: <b>${esc(opts.generatedDate)}</b><br/>Report ID: <b>${esc(opts.reportId)}</b></div>`
        }
    </div>`;
}

export function xrBriefTitle(title: string, pills: string[]): string {
    return `
    <div class="xr-kicker">Confidential &middot; Executive Brief</div>
    <div class="xr-title-row">
      <h1>${esc(title)}</h1>
      <div class="xr-pills">${pills.map((p) => `<span class="xr-pill">${esc(p)}</span>`).join('')}</div>
    </div>`;
}

export function xrHero(opts: { name: string; description: string; confidence: number; revenueLow: string; revenueHigh?: string; timeToValue: string; complexity: string; complexitySub: string }): string {
    return `
    <div class="xr-hero">
      <div class="xr-hero-eyebrow">&#9733; Recommended Strategy</div>
      <h2>${esc(opts.name)}</h2>
      <p class="desc">${esc(opts.description)}</p>
      <div class="xr-tiles">
        <div class="xr-tile"><div class="lbl">Recommendation Confidence</div><div class="val teal">${esc(opts.confidence)}%</div></div>
        <div class="xr-tile"><div class="lbl">Revenue Potential</div><div class="val teal">${esc(opts.revenueLow)}</div><div class="sub">${esc(opts.revenueHigh || '')}</div></div>
        <div class="xr-tile"><div class="lbl">Time to Value</div><div class="val">${esc(opts.timeToValue)}</div><div class="sub">to first revenue</div></div>
        <div class="xr-tile"><div class="lbl">Implementation Complexity</div><div class="val amber">${esc(opts.complexity)}</div><div class="sub">${esc(opts.complexitySub)}</div></div>
      </div>
    </div>`;
}

const WHY_ICONS = ['⚡', '🚀', '📊', '🎯', '🔑', '💡'];

export function xrWhyThisStrategy(items: WhyThisStrategyItem[]): string {
    if (!items.length) return '';
    return `
    <div class="xr-section">
      <div class="xr-section-heading">Why This Strategy</div>
      <div class="xr-why-grid">
        ${items.slice(0, 3).map((item, i) => `
          <div class="xr-why-card">
            <div class="ic">${WHY_ICONS[i % WHY_ICONS.length]}</div>
            <h4>${esc(item.title)}</h4>
            ${item.description ? `<p>${esc(item.description)}</p>` : ''}
          </div>`).join('')}
      </div>
    </div>`;
}

function fitTier(value: number): 'high' | 'mid' | 'low' {
    if (value >= 80) return 'high';
    if (value >= 60) return 'mid';
    return 'low';
}

export function xrStrategicFit(fit: StrategicFit): string {
    const rows: [string, number][] = [
        ['Partner Ecosystem Readiness', fit.partnerEcosystemReadiness],
        ['Revenue Model Alignment', fit.revenueModelAlignment],
        ['Infrastructure Maturity', fit.infrastructureMaturity],
        ['Market Timing', fit.marketTiming],
    ];
    return `
    <div class="xr-section">
      <div class="xr-section-heading">Strategic Fit Analysis</div>
      <div class="xr-fit-grid">
        ${rows.map(([label, value]) => `
          <div class="xr-fit-row">
            <span class="fit-label">${esc(label)}</span>
            <span class="fit-value ${fitTier(value)}">${esc(value)}%</span>
          </div>`).join('')}
      </div>
    </div>`;
}

export interface AlternativeEntry {
    name: string;
    status: 'NOT RECOMMENDED' | 'DEFERRED' | string;
    description: string;
}

export function xrAlternatives(alternatives: AlternativeEntry[]): string {
    if (!alternatives.length) return '';
    return `
    <div class="xr-section">
      <div class="xr-section-heading">Alternatives Evaluated</div>
      <div class="xr-alt-grid">
        ${alternatives.slice(0, 3).map((alt) => `
          <div class="xr-alt-card">
            <span class="xr-status ${alt.status.toLowerCase().includes('not') ? 'not-recommended' : 'deferred'}">${esc(alt.status)}</span>
            <h4>${esc(alt.name)}</h4>
            <p>${esc(alt.description)}</p>
          </div>`).join('')}
      </div>
    </div>`;
}

export interface PricingTierRow {
    name: string;
    price: string;
    billingPeriod: string;
    includedUsage: string;
    overageRate: string;
    targetSegment: string;
}

export function xrPricingTable(tiers: PricingTierRow[], rationale?: string): string {
    if (!tiers.length) return '';
    return `
    <div class="xr-section">
      <div class="xr-section-heading">Pricing Architecture</div>
      <table class="xr-table">
        <thead><tr><th>Tier</th><th>Included Usage</th><th>Price</th><th>Overage</th><th>Best For</th></tr></thead>
        <tbody>
          ${tiers.map((t) => `
            <tr>
              <td class="tier-name">${esc(t.name)}</td>
              <td>${esc(t.includedUsage)}</td>
              <td class="rate">${esc(t.price)} <span style="font-weight:normal;color:#64748b">/ ${esc(t.billingPeriod)}</span></td>
              <td>${esc(t.overageRate)}</td>
              <td>${esc(t.targetSegment)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      ${rationale ? `<p style="margin-top:10px;font-size:11px;color:#475569;line-height:1.55">${esc(rationale)}</p>` : ''}
    </div>`;
}

export interface RoadmapPhaseRow {
    name: string;
    duration: string;
    milestones: string[];
}

export function xrRoadmap(phases: RoadmapPhaseRow[]): string {
    if (!phases.length) return '';
    return `
    <div class="xr-section">
      <div class="xr-section-heading">Implementation Roadmap</div>
      ${phases.map((phase) => `
        <div class="xr-roadmap-step">
          <div class="row"><h4>${esc(phase.name)}</h4><span class="when">${esc(phase.duration)}</span></div>
          <ul>${phase.milestones.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
        </div>`).join('')}
    </div>`;
}

export function xrRisksAndNextSteps(risks: string[], mitigations: string[], severities: string[], nextSteps: NextStepItem[]): string {
    if (!risks.length && !nextSteps.length) return '';
    const risksHtml = risks.map((risk, i) => {
        const severity = severities[i] === 'low' ? 'low' : 'consider';
        return `
        <div class="xr-risk-card ${severity === 'low' ? 'low-risk' : ''}">
          <div class="row"><h4>${esc(risk)}</h4><span class="xr-status ${severity === 'low' ? 'low-risk' : 'consider'}">${severity === 'low' ? 'LOW RISK' : 'CONSIDER'}</span></div>
          ${mitigations[i] ? `<p>${esc(mitigations[i])}</p>` : ''}
        </div>`;
    }).join('');
    const stepsHtml = nextSteps.map((step, i) => `
        <div class="xr-next-step">
          <div class="num">${i + 1}</div>
          <div class="body"><p>${esc(step.action)}</p><span>${esc(step.timeframe)}</span></div>
        </div>`).join('');
    return `
    <div class="xr-two-col">
      <div>
        <div class="xr-section-heading">Key Risks &amp; Considerations</div>
        ${risksHtml}
      </div>
      <div>
        <div class="xr-section-heading">Immediate Next Steps</div>
        ${stepsHtml}
      </div>
    </div>`;
}

export function xrAdvisoryNote(confidence: number, revisitTrigger: string): string {
    return `
    <div class="xr-advisory">
      <div class="lbl">AI Advisory Note</div>
      <p>This recommendation is generated with <strong>${esc(confidence)}% confidence</strong> based on your business profile, API usage patterns, and market positioning. ${esc(revisitTrigger)}</p>
    </div>`;
}

export function xrFooter(pageLabel: string, generatedDate: string): string {
    return `<div class="xr-footer"><span>CONFIDENTIAL — For internal use only. MonetizeMate AI &middot; ${esc(generatedDate)}.</span><span>${esc(pageLabel)}</span></div>`;
}
