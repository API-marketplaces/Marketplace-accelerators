'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
    ArrowLeft,
    CheckCircle,
    Download,
    ListChecks,
    Loader2,
    Milestone,
    Rocket,
    ShieldAlert,
    Sparkles,
    Target,
    Zap,
} from 'lucide-react';
import { downloadHtmlAsPdf } from '@/app/utils/pdf';

interface Strategy {
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
    timeline?: string;
    revenueImpact?: string;
    reasoning: string;
    score: number;
}

interface Phase {
    name: string;
    duration: string;
    tasks: string[];
    icon: typeof Target;
}

const PHASE_TEMPLATE: { name: string; duration: string; icon: typeof Target; fallbackTasks: string[] }[] = [
    {
        name: "Phase 1: Planning & Setup",
        duration: "1-2 Weeks",
        icon: Target,
        fallbackTasks: [
            "Define key performance indicators (KPIs) for the new strategy.",
            "Configure pricing tiers and feature sets in your billing system.",
            "Prepare marketing materials and update documentation.",
            "Set up analytics to track the new model's performance.",
        ],
    },
    {
        name: "Phase 2: Staged Rollout",
        duration: "2-4 Weeks",
        icon: Milestone,
        fallbackTasks: [
            "Launch the new pricing to a small segment of new customers (e.g., 10%).",
            "Monitor user feedback, support tickets, and conversion rates.",
            "A/B test different aspects of the pricing page or checkout flow.",
            "Iterate on messaging based on initial customer reactions.",
        ],
    },
    {
        name: "Phase 3: Full Launch & Migration",
        duration: "1-2 Months",
        icon: Zap,
        fallbackTasks: [
            "Roll out the new strategy to all new customers.",
            "Announce the new pricing to existing customers and provide a clear migration path.",
            "Offer incentives for early adoption of new plans.",
            "Handle customer support inquiries related to the changes.",
        ],
    },
    {
        name: "Phase 4: Optimization",
        duration: "Ongoing",
        icon: Sparkles,
        fallbackTasks: [
            "Continuously analyze performance against KPIs.",
            "Gather long-term customer feedback and conduct surveys.",
            "Make data-driven adjustments to pricing and packaging.",
            "Explore add-ons and further monetization opportunities.",
        ],
    },
];

// Distributes the strategy's own implementationSteps across the four phases
// (evenly, in order) so the plan reflects this specific recommendation instead
// of showing identical generic tasks for every strategy. Falls back to the
// generic tasks for any phase that doesn't get a real step assigned.
function buildPhases(strategy: Strategy): Phase[] {
    const steps = (strategy.implementationSteps || []).filter(Boolean);
    if (steps.length === 0) {
        return PHASE_TEMPLATE.map(({ name, duration, icon, fallbackTasks }) => ({
            name, duration, icon, tasks: fallbackTasks,
        }));
    }

    const perPhase = Math.ceil(steps.length / PHASE_TEMPLATE.length);
    return PHASE_TEMPLATE.map(({ name, duration, icon, fallbackTasks }, index) => {
        const slice = steps.slice(index * perPhase, index * perPhase + perPhase);
        return { name, duration, icon, tasks: slice.length > 0 ? slice : fallbackTasks };
    });
}

const DEFAULT_PREREQUISITES = [
    "Executive and stakeholder buy-in on the new monetization approach.",
    "Billing and payment infrastructure capable of supporting the model.",
    "Baseline analytics in place to measure KPIs before launch.",
    "Customer support team briefed on messaging and FAQs.",
];

// Pairs each risk with its mitigation so users know what needs to be in place
// before they start — this is the actual "readiness" gate, derived from the
// strategy's own risk analysis rather than a generic checklist.
function buildPrerequisites(strategy: Strategy): { risk?: string; action: string }[] {
    const risks = strategy.risks || [];
    const mitigations = strategy.mitigations || [];
    if (risks.length === 0) {
        return DEFAULT_PREREQUISITES.map((action) => ({ action }));
    }
    return risks.map((risk, index) => ({
        risk,
        action: mitigations[index] || "Put a mitigation plan in place before launch.",
    }));
}

const DEFAULT_CTA_ITEMS = [
    "Set a 30-day check-in to review early adoption and conversion metrics.",
    "Survey the first cohort of customers on the new pricing experience.",
    "Define the threshold that triggers moving from staged rollout to full launch.",
];

function buildCtaItems(strategy: Strategy): string[] {
    return strategy.successMetrics && strategy.successMetrics.length > 0
        ? strategy.successMetrics
        : DEFAULT_CTA_ITEMS;
}

const IMPLEMENTATION_PDF_STYLES = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a202c; padding: 40px 48px; background: #fff; }
    h1 { font-size: 22px; color: #0d9488; margin-bottom: 6px; }
    h2 { font-size: 15px; color: #0f172a; border-left: 4px solid #0d9488; padding-left: 10px; margin: 26px 0 12px; }
    h3 { font-size: 13px; color: #0f172a; margin-bottom: 6px; }
    .dur { font-size: 10px; font-weight: normal; color: #64748b; }
    p.desc { color: #475569; margin-bottom: 14px; line-height: 1.5; }
    .badge { display: inline-block; background: #f0fdfa; border: 1px solid #99f6e4; color: #0d9488; padding: 2px 10px; border-radius: 9999px; font-size: 11px; margin-right: 8px; }
    .phase { margin-bottom: 16px; break-inside: avoid; }
    ul { list-style: none; padding: 0; }
    li { padding: 3px 0 3px 16px; position: relative; font-size: 11.5px; line-height: 1.5; }
    li::before { content: "•"; position: absolute; left: 0; color: #0d9488; font-weight: bold; }
`;

function buildImplementationPdfHtml(strategy: Strategy, phases: Phase[], prerequisites: { risk?: string; action: string }[], ctaItems: string[]): string {
    const esc = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const phasesHtml = phases.map((phase) => `
        <div class="phase">
            <h3>${esc(phase.name)} <span class="dur">${esc(phase.duration)}</span></h3>
            <ul>${phase.tasks.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
    `).join('');

    const prereqHtml = prerequisites.map((p) => `
        <li>${p.risk ? `<strong>Risk:</strong> ${esc(p.risk)} — ` : ''}${esc(p.action)}</li>
    `).join('');

    const ctaHtml = ctaItems.map((c) => `<li>${esc(c)}</li>`).join('');

    return `
        <h1>${esc(strategy.name)} — Implementation Plan</h1>
        <p class="desc">${esc(strategy.description)}</p>
        <div>
            <span class="badge">Timeframe: ${esc(strategy.timeframe)}</span>
            <span class="badge">Revenue: ${esc(strategy.expectedRevenue)}</span>
            <span class="badge">Difficulty: ${esc(strategy.implementation)}</span>
        </div>

        <h2>Optimal Delivery Strategy</h2>
        <p class="desc"><strong>Recommended rollout timeline:</strong> ${esc(strategy.timeline || strategy.timeframe)}</p>
        <p class="desc"><strong>Expected revenue impact:</strong> ${esc(strategy.revenueImpact || strategy.expectedRevenue)}</p>
        <p class="desc">${esc(strategy.reasoning)}</p>

        <h2>Prerequisites</h2>
        <ul>${prereqHtml}</ul>

        <h2>Phased Implementation</h2>
        ${phasesHtml}

        <h2>Call-to-Action Strategies</h2>
        <ul>${ctaHtml}</ul>
    `;
}

async function downloadImplementationPlan(strategy: Strategy, phases: Phase[], prerequisites: { risk?: string; action: string }[], ctaItems: string[]) {
    const html = buildImplementationPdfHtml(strategy, phases, prerequisites, ctaItems);
    await downloadHtmlAsPdf(html, IMPLEMENTATION_PDF_STYLES, `${strategy.name.toLowerCase().replace(/\s+/g, '-')}-implementation-plan.pdf`, 'implementation_plan_pdf');
}

function ImplementationPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [strategy, setStrategy] = useState<Strategy | null>(null);
    const [downloadingPlan, setDownloadingPlan] = useState(false);

    useEffect(() => {
        const strategyData = searchParams.get('strategy');
        if (strategyData) {
            try {
                setStrategy(JSON.parse(strategyData));
            } catch (error) {
                console.error("Failed to parse strategy data", error);
                router.push('/dashboard/strategy-adviser');
            }
        } else {
            // Handle case where there is no strategy data
            router.push('/dashboard/strategy-adviser');
        }
    }, [searchParams, router]);

    if (!strategy) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <p>Loading strategy...</p>
            </div>
        );
    }

    const phases = buildPhases(strategy);
    const prerequisites = buildPrerequisites(strategy);
    const ctaItems = buildCtaItems(strategy);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="outline"
                        onClick={() => {
                            const params = new URLSearchParams(window.location.search);
                            const source = params.get('analysisSource') || 'questionnaire-llm';
                            const industry = params.get('selectedIndustry') || '';
                            router.push(`/dashboard/recommendation?analysisSource=${encodeURIComponent(source)}&selectedIndustry=${encodeURIComponent(industry)}`);
                        }}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Recommendations
                    </Button>
                </div>

                <Card className="p-8 bg-white/80 backdrop-blur-sm border-blue-200 mb-8">
                    <h1 className="text-3xl text-blue-900 mb-2">{strategy.name} Implementation Plan</h1>
                    <p className="text-blue-700 mb-4">{strategy.description}</p>
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-blue-600 border-blue-300">Timeframe: {strategy.timeframe}</Badge>
                        <Badge variant="outline" className="text-green-600 border-green-300">Revenue: {strategy.expectedRevenue}</Badge>
                        <Badge variant="outline" className="text-purple-600 border-purple-300">Difficulty: {strategy.implementation}</Badge>
                    </div>
                </Card>

                {/* Optimal Delivery Strategy */}
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-200 mb-8">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Rocket className="w-6 h-6 text-teal-600" />
                        </div>
                        <div className="flex-grow">
                            <h2 className="text-xl text-blue-900 mb-3">Optimal Delivery Strategy</h2>
                            <div className="grid sm:grid-cols-2 gap-4 mb-4">
                                <div className="bg-blue-50 rounded-lg p-3">
                                    <p className="text-xs uppercase tracking-wide text-blue-500 font-semibold mb-1">Recommended Timeline</p>
                                    <p className="text-blue-900">{strategy.timeline || strategy.timeframe}</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3">
                                    <p className="text-xs uppercase tracking-wide text-green-600 font-semibold mb-1">Expected Revenue Impact</p>
                                    <p className="text-green-900">{strategy.revenueImpact || strategy.expectedRevenue}</p>
                                </div>
                            </div>
                            <p className="text-blue-700 leading-relaxed">{strategy.reasoning}</p>
                        </div>
                    </div>
                </Card>

                {/* Prerequisites */}
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-200 mb-8">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <ShieldAlert className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="flex-grow">
                            <h2 className="text-xl text-blue-900 mb-3">Prerequisites</h2>
                            <ul className="space-y-2 text-blue-700">
                                {prerequisites.map((p, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 mt-1 text-amber-500 flex-shrink-0" />
                                        <span>{p.risk && <strong className="text-blue-900">{p.risk}: </strong>}{p.action}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Card>

                {/* Phased Strategies */}
                <h2 className="text-2xl text-blue-900 mb-6">Phased Strategies</h2>
                <div className="space-y-6 mb-8">
                    {phases.map((phase, index) => {
                        const Icon = phase.icon;
                        return (
                            <Card key={index} className="p-6 bg-white/80 backdrop-blur-sm border-blue-200">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xl text-blue-900">{phase.name}</h3>
                                            <Badge variant="secondary">{phase.duration}</Badge>
                                        </div>
                                        <ul className="mt-4 space-y-2 text-blue-700">
                                            {phase.tasks.map((task, taskIdx) => (
                                                <li key={taskIdx} className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 mt-1 text-green-500 flex-shrink-0" />
                                                    <span>{task}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Call to Action Strategies */}
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-200 mb-8">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <ListChecks className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-grow">
                            <h2 className="text-xl text-blue-900 mb-3">Call-to-Action Strategies</h2>
                            <ul className="space-y-2 text-blue-700">
                                {ctaItems.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 mt-1 text-purple-500 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Card>

                {/* Call to Action button */}
                <div className="flex justify-center">
                    <Button
                        onClick={async () => {
                            setDownloadingPlan(true);
                            try {
                                await downloadImplementationPlan(strategy, phases, prerequisites, ctaItems);
                            } finally {
                                setDownloadingPlan(false);
                            }
                        }}
                        disabled={downloadingPlan}
                        className="h-12 px-8 bg-teal-600 hover:bg-teal-500 text-white font-bold"
                    >
                        {downloadingPlan ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                        {downloadingPlan ? 'Generating PDF…' : 'Download Implementation Plan (PDF)'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
export default function ImplementationPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'#060E1E',display:'flex',alignItems:'center',justifyContent:'center',color:'#00E5C0'}}>Loading…</div>}>
      <ImplementationPageInner />
    </Suspense>
  )
}
