'use client'

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Sparkles, Rocket, CheckCircle, AlertCircle, Star, MessageCircle, Download, FileText, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { calculateRecommendations } from '@/app/constants/strategy-helpers';
import { QuestionnaireAnswers } from '@/app/types/QuestionnaireAnswers';
import { downloadHtmlAsPdf } from '@/app/utils/pdf';
import {
    EXEC_REPORT_STYLES, xrHeader, xrBriefTitle, xrHero, xrWhyThisStrategy, xrStrategicFit,
    xrAlternatives, xrPricingTable, xrRoadmap, xrRisksAndNextSteps, xrAdvisoryNote, xrFooter, xrList,
    type StrategicFit, type WhyThisStrategyItem, type NextStepItem, type AlternativeEntry,
} from '@/app/utils/executiveReport';

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
    timeline?: string;
    revenueImpact?: string;
    pros: string[];
    cons: string[];
    risks?: string[];
    mitigations?: string[];
    riskSeverity?: string[];
    successMetrics?: string[];
    reasoning: string;
    score: number;
    icon: IconName;
    color: string;
    bgColor: string;
    strategicFit?: StrategicFit;
    whyThisStrategy?: WhyThisStrategyItem[];
    nextSteps?: NextStepItem[];
    revisitTrigger?: string;
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

function reportId(strategy: Recommendation): string {
    // Deterministic per-strategy so re-downloading the same report keeps the same ID.
    const hash = Array.from(strategy.id).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 10000, 7);
    return `MM-${new Date().getFullYear()}-${String(hash).padStart(4, '0')}`;
}

function complexityFromSteps(strategy: Recommendation): { label: string; sub: string } {
    const count = strategy.implementationSteps?.length || 0;
    const label = count <= 3 ? 'Low' : count <= 6 ? 'Med' : 'High';
    return { label, sub: strategy.implementation || strategy.timeframe || '' };
}

function buildAlternatives(strategy: Recommendation, all: Recommendation[]): AlternativeEntry[] {
    return all
        .filter((s) => s.id !== strategy.id)
        .slice(0, 3)
        .map((alt) => ({
            name: alt.name,
            status: alt.score < strategy.score - 12 ? 'NOT RECOMMENDED' : 'DEFERRED',
            description: alt.cons?.[0] || alt.reasoning?.split('. ')[0] || `A ${alt.score}% fit, currently ranked below ${strategy.name}.`,
        }));
}

function buildStrategyPDFHtml(
    strategy: Recommendation,
    industry: string,
    allRecommendations: Recommendation[],
    topPricing: PricingBlueprint | null,
    topRoadmap: Roadmap | null,
): string {
    const generatedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const id = reportId(strategy);
    const complexity = complexityFromSteps(strategy);
    const isPrimary = allRecommendations[0]?.id === strategy.id;
    const fit = strategy.strategicFit || { partnerEcosystemReadiness: strategy.score, revenueModelAlignment: strategy.score, infrastructureMaturity: strategy.score, marketTiming: strategy.score };

    // Pricing/roadmap tiers only exist for the top-ranked recommendation today —
    // an alternative strategy gets its own implementation steps as a roadmap
    // instead of fabricated tier pricing it was never actually priced out for.
    const pricingSection = isPrimary && topPricing?.tiers.length
        ? xrPricingTable(topPricing.tiers, topPricing.rationale)
        : '';
    const roadmapPhases = isPrimary && topRoadmap?.phases.length
        ? topRoadmap.phases
        : strategy.implementationSteps?.length
            ? [{ name: 'Rollout Plan', duration: strategy.timeframe || '', milestones: strategy.implementationSteps }]
            : [];

    return `
<div class="page">
  ${xrHeader({ industry, generatedDate, reportId: id })}
  ${xrBriefTitle('Monetization Strategy Report', [industry, 'API Monetization', strategy.name])}
  ${xrHero({
        name: strategy.name,
        description: strategy.description,
        confidence: strategy.score,
        revenueLow: strategy.expectedRevenue || strategy.revenueImpact || '—',
        revenueHigh: strategy.revenueImpact && strategy.revenueImpact !== strategy.expectedRevenue ? strategy.revenueImpact : '',
        timeToValue: strategy.timeframe || strategy.timeline || '—',
        complexity: complexity.label,
        complexitySub: complexity.sub,
    })}
  ${xrWhyThisStrategy(strategy.whyThisStrategy || [])}
  ${xrStrategicFit(fit)}
  ${xrAlternatives(buildAlternatives(strategy, allRecommendations))}
  ${xrFooter('Page 1 of 2', generatedDate)}
</div>

<div class="page">
  ${xrHeader({ industry, generatedDate, reportId: id, rightTitle: 'Monetization Strategy Report — Execution Plan', rightStrategy: strategy.name })}
  ${pricingSection}
  ${xrRoadmap(roadmapPhases)}
  ${xrRisksAndNextSteps(strategy.risks || [], strategy.mitigations || [], strategy.riskSeverity || [], strategy.nextSteps || [])}
  <div style="height:8px"></div>
  ${xrAdvisoryNote(strategy.score, strategy.revisitTrigger || `Revisit this strategy if performance diverges meaningfully from the ${strategy.expectedRevenue || 'projected'} revenue target.`)}
  ${xrFooter('Page 2 of 2', generatedDate)}
</div>`;
}

async function downloadComparisonPDF(strategies: Recommendation[], industry: string) {
    const generatedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const id = `MM-${new Date().getFullYear()}-${String(strategies.length * 137 % 10000).padStart(4, '0')}`;

    const tableRows = strategies.map((s, i) => `
      <tr>
        <td class="tier-name">${i === 0 ? '⭐ ' : ''}${s.name}<br/><span style="color:#64748b;font-size:10px;font-weight:normal">${s.score}% match</span></td>
        <td>${s.description}</td>
        <td>${s.timeframe || '—'}</td>
        <td>${s.expectedRevenue || '—'}</td>
        <td>${(s.pros || []).map(p => `<span class="xr-mini-tag">${p}</span>`).join(' ')}</td>
        <td>${(s.cons || []).map(c => `<span class="xr-mini-tag con">${c}</span>`).join(' ')}</td>
      </tr>`).join('');

    const detailSections = strategies.map((s, i) => `
      <div class="xr-why-card" style="break-inside:avoid;margin-bottom:12px;">
        <h4 style="font-size:14px;margin-bottom:6px;">${i === 0 ? '⭐ ' : ''}${s.name} <span style="font-size:11px;color:#64748b;font-weight:normal">${s.score}% match</span></h4>
        ${s.reasoning ? `<p style="margin-bottom:10px;">${s.reasoning}</p>` : ''}
        <div class="xr-two-col">
          <div><div class="xr-section-heading" style="margin-bottom:6px;">Pros</div>${xrList(s.pros)}</div>
          <div><div class="xr-section-heading" style="margin-bottom:6px;">Considerations</div>${xrList(s.cons, 'cons')}</div>
        </div>
        ${s.implementationSteps?.length ? `<div style="margin-top:10px"><div class="xr-section-heading" style="margin-bottom:6px;">Implementation Steps</div>${xrList(s.implementationSteps, 'steps')}</div>` : ''}
      </div>`).join('');

    const html = `
<div class="page">
  ${xrHeader({ industry, generatedDate, reportId: id })}
  ${xrBriefTitle('Strategy Comparison Report', [industry, `${strategies.length} Strategies Compared`])}

  <div class="xr-section">
    <div class="xr-section-heading">At a Glance — All Strategies Compared</div>
    <table class="xr-table xr-compare">
      <thead>
        <tr><th>Strategy</th><th>Description</th><th>Timeframe</th><th>Expected Revenue</th><th>Pros</th><th>Considerations</th></tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>

  <div class="xr-section">
    <div class="xr-section-heading">Detailed Breakdown — Each Strategy</div>
    ${detailSections}
  </div>

  ${xrFooter('Comparison Report', generatedDate)}
</div>`;
    await downloadHtmlAsPdf(html, EXEC_REPORT_STYLES, `monetization-strategy-comparison-${industry.toLowerCase().replace(/\s+/g, '-')}.pdf`, 'comparison_pdf');
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

    const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
    const [downloadingComparison, setDownloadingComparison] = useState(false);

    const handleDownloadStrategyPDF = async (strategy: Recommendation) => {
        setDownloadingIds(prev => new Set(prev).add(strategy.id));
        try {
            const html = buildStrategyPDFHtml(strategy, selectedIndustry, recommendations, pricing, roadmap);
            await downloadHtmlAsPdf(html, EXEC_REPORT_STYLES, `${strategy.name.toLowerCase().replace(/\s+/g, '-')}-strategy-report.pdf`, 'strategy_pdf');
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
                                                    {downloadingIds.has(strategy.id) ? 'Generating PDF…' : 'Download PDF'}
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
