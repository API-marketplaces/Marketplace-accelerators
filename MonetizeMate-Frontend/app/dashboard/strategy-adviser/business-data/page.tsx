'use client'

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, BriefcaseBusiness, Sparkles, Download, Loader2,
    Building2, Users, Layers, DollarSign, Cpu, Target,
    Save, FolderOpen, Trash2, Plus, CheckCircle2,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { useAuth } from "@/app/hooks/useAuth";
import LoadingAnalysis, { GeneratingRecommendationsSteps } from "../../../components/LoadingAnalysis";
import { downloadHtmlAsPdf } from "@/app/utils/pdf";
import {
    EXEC_REPORT_STYLES, xrHeader, xrBriefTitle, xrHero, xrWhyThisStrategy, xrStrategicFit,
    xrPricingTable, xrRoadmap, xrRisksAndNextSteps, xrAdvisoryNote, xrFooter, xrList,
    xrInfoGrid, xrSectionTitled,
    type StrategicFit, type WhyThisStrategyItem, type NextStepItem,
} from "@/app/utils/executiveReport";

type BusinessDataFlowType = 'form' | 'analyzing' | 'generating';

// Each section is a flat string map — the keys must match the backend's
// per-section Pydantic schema (app/schemas/business_profile.py) exactly so a
// saved profile round-trips without translation.
type ProfileSection = Record<string, string>;

type BusinessProfileForm = {
    business_model: ProfileSection;
    customers: ProfileSection;
    apis: ProfileSection;
    revenue: ProfileSection;
    technology: ProfileSection;
    objectives: ProfileSection;
};

type SectionKey = keyof BusinessProfileForm;

interface SavedBusinessProfile extends BusinessProfileForm {
    id: number;
    profile_name: string;
    created_at: string;
    updated_at: string;
}

const initialForm: BusinessProfileForm = {
    business_model: { companyName: '', region: '', currentAccessModel: '', preferredChargingMethod: '', competitiveLandscape: '' },
    customers: { apiConsumerType: '', activeConsumers: '', consumerGrowthExpectation: '', perceivedBusinessValue: '' },
    apis: { numberOfApis: '', monthlyTransactions: '', usageGrowth: '' },
    revenue: { annualRevenueTarget: '', adoptionVsRevenue: '', premiumSupportNeeded: '' },
    technology: { apiGatewayProvider: '', technicalReadiness: '', dataInfrastructureMaturity: '' },
    objectives: { primaryBusinessGoal: '', strategicImportance: '', targetTimeHorizon: '' },
};

const industryOptions = [
    'Fintech',
    'Healthcare',
    'E-commerce / Retail',
    'Social Media / Content',
    'Logistics / Mapping',
    'SaaS / B2B Tech',
    'Other'
];

interface FieldDef {
    id: string;
    label: string;
    type?: 'text' | 'number' | 'select';
    options?: string[];
    placeholder?: string;
}

interface SectionDef {
    key: SectionKey;
    title: string;
    blurb: string;
    icon: React.ElementType;
    fields: FieldDef[];
}

const SECTION_DEFS: SectionDef[] = [
    {
        key: 'business_model',
        title: 'Business Model',
        blurb: 'How your business and APIs are structured today.',
        icon: Building2,
        fields: [
            { id: 'companyName', label: 'Company Name', placeholder: 'Acme API Labs' },
            { id: 'region', label: 'Region', placeholder: 'North America, Europe, APAC' },
            { id: 'currentAccessModel', label: 'Current API Access Model', type: 'select', options: ['Free', 'Internal Only', 'Subscription', 'Pay-per-use', 'Tiered', 'Hybrid'] },
            { id: 'preferredChargingMethod', label: 'Preferred Charging Method', type: 'select', options: ['Subscription', 'Pay-per-use', 'Tiered', 'Freemium', 'Hybrid', 'Value-based'] },
            { id: 'competitiveLandscape', label: 'Competitive Landscape', type: 'select', options: ['Low Competition', 'Moderate Competition', 'High Competition'] },
        ],
    },
    {
        key: 'customers',
        title: 'Customers',
        blurb: 'Who consumes your APIs and how that base is growing.',
        icon: Users,
        fields: [
            { id: 'apiConsumerType', label: 'API Consumer Type', type: 'select', options: ['B2B', 'B2C', 'Both'] },
            { id: 'activeConsumers', label: 'Number of Active Consumers', type: 'number', placeholder: '1500' },
            { id: 'consumerGrowthExpectation', label: 'Consumer Growth Expectation', type: 'select', options: ['Low', 'Medium', 'High'] },
            { id: 'perceivedBusinessValue', label: 'Perceived Business Value of APIs', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
        ],
    },
    {
        key: 'apis',
        title: 'APIs',
        blurb: 'The shape and scale of your current API footprint.',
        icon: Layers,
        fields: [
            { id: 'numberOfApis', label: 'Number of APIs', type: 'number', placeholder: '12' },
            { id: 'monthlyTransactions', label: 'Monthly API Transactions', type: 'number', placeholder: '50000' },
            { id: 'usageGrowth', label: 'API Usage Growth (YoY)', type: 'select', options: ['Declining', 'Flat', '0-25%', '25-50%', '50%+'] },
        ],
    },
    {
        key: 'revenue',
        title: 'Revenue',
        blurb: 'Revenue goals and how pricing priorities are weighed.',
        icon: DollarSign,
        fields: [
            { id: 'annualRevenueTarget', label: 'Revenue Target from APIs (Annual $)', type: 'number', placeholder: '250000' },
            { id: 'adoptionVsRevenue', label: 'Importance of API Adoption vs Revenue', type: 'select', options: ['Adoption First', 'Balanced', 'Revenue First'] },
            { id: 'premiumSupportNeeded', label: 'Need for Premium Support/SLA', type: 'select', options: ['No', 'Maybe', 'Yes'] },
        ],
    },
    {
        key: 'technology',
        title: 'Technology',
        blurb: 'The infrastructure and readiness behind billing and metering.',
        icon: Cpu,
        fields: [
            { id: 'apiGatewayProvider', label: 'API Gateway Provider', type: 'select', options: ['None', 'Azure APIM', 'Apigee', 'Kong', 'AWS API Gateway', 'Other'] },
            { id: 'technicalReadiness', label: 'Technical Readiness for Billing/Metering', type: 'select', options: ['Low', 'Medium', 'High'] },
            { id: 'dataInfrastructureMaturity', label: 'Usage Analytics Maturity', type: 'select', options: ['Ad-hoc', 'Developing', 'Mature'] },
        ],
    },
    {
        key: 'objectives',
        title: 'Objectives',
        blurb: 'What success looks like and how urgently you want it.',
        icon: Target,
        fields: [
            { id: 'primaryBusinessGoal', label: 'Primary Business Goal', type: 'select', options: ['Revenue Growth', 'User Acquisition', 'Market Expansion', 'Customer Retention'] },
            { id: 'strategicImportance', label: 'Strategic Importance of APIs', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
            { id: 'targetTimeHorizon', label: 'Target Time Horizon', type: 'select', options: ['0-3 months', '3-6 months', '6-12 months', '12+ months'] },
        ],
    },
];

function findMissingField(form: BusinessProfileForm): string | null {
    for (const section of SECTION_DEFS) {
        for (const field of section.fields) {
            if (!form[section.key][field.id]?.trim()) return field.label;
        }
    }
    return null;
}

function buildLLMAnswers(form: BusinessProfileForm) {
    const bm = form.business_model, cu = form.customers, ap = form.apis;
    const rv = form.revenue, te = form.technology, ob = form.objectives;
    return [
        { question_id: 'company', question: 'Company Name', answer: bm.companyName },
        { question_id: 'region', question: 'Region / Market', answer: bm.region },
        { question_id: 'accessModel', question: 'Current API Access Model', answer: bm.currentAccessModel },
        { question_id: 'charging', question: 'Preferred Charging / Pricing Method', answer: bm.preferredChargingMethod },
        { question_id: 'competition', question: 'Competitive Landscape', answer: bm.competitiveLandscape },
        { question_id: 'consumerType', question: 'API Consumer Type (B2B / B2C / Both)', answer: cu.apiConsumerType },
        { question_id: 'consumers', question: 'Number of Active API Consumers', answer: cu.activeConsumers },
        { question_id: 'growthExp', question: 'Consumer Growth Expectation', answer: cu.consumerGrowthExpectation },
        { question_id: 'bizValue', question: 'Perceived Business Value of APIs', answer: cu.perceivedBusinessValue },
        { question_id: 'numApis', question: 'Number of APIs', answer: ap.numberOfApis },
        { question_id: 'transactions', question: 'Monthly API Transactions', answer: ap.monthlyTransactions },
        { question_id: 'usageGrowth', question: 'API Usage Growth (Year-over-Year)', answer: ap.usageGrowth },
        { question_id: 'revenueTarget', question: 'Annual Revenue Target from APIs (USD)', answer: rv.annualRevenueTarget },
        { question_id: 'adoptVsRev', question: 'Priority: API Adoption vs Revenue', answer: rv.adoptionVsRevenue },
        { question_id: 'premSupport', question: 'Need for Premium Support / SLA', answer: rv.premiumSupportNeeded },
        { question_id: 'gateway', question: 'API Gateway Provider', answer: te.apiGatewayProvider },
        { question_id: 'techReadiness', question: 'Technical Readiness for Billing/Metering', answer: te.technicalReadiness },
        { question_id: 'dataMaturity', question: 'Usage Analytics Maturity', answer: te.dataInfrastructureMaturity },
        { question_id: 'primaryGoal', question: 'Primary Business Goal', answer: ob.primaryBusinessGoal },
        { question_id: 'strategic', question: 'Strategic Importance of APIs to Business', answer: ob.strategicImportance },
        { question_id: 'timeHorizon', question: 'Target Time Horizon for Results', answer: ob.targetTimeHorizon },
    ];
}

// ─── PDF generation ──────────────────────────────────────────────────────────

function buildBusinessProfileSections(form: BusinessProfileForm, resolvedIndustry: string): [string, [string, string][]][] {
    return [
        ['Business Model', [
            ['Company Name', form.business_model.companyName],
            ['Industry', resolvedIndustry],
            ['Region / Market', form.business_model.region],
            ['Current Access Model', form.business_model.currentAccessModel],
            ['Preferred Charging Method', form.business_model.preferredChargingMethod],
            ['Competitive Landscape', form.business_model.competitiveLandscape],
        ]],
        ['Customers', [
            ['API Consumer Type', form.customers.apiConsumerType],
            ['Active Consumers', form.customers.activeConsumers],
            ['Consumer Growth Expectation', form.customers.consumerGrowthExpectation],
            ['Perceived Business Value', form.customers.perceivedBusinessValue],
        ]],
        ['APIs', [
            ['Number of APIs', form.apis.numberOfApis],
            ['Monthly API Transactions', form.apis.monthlyTransactions],
            ['API Usage Growth (YoY)', form.apis.usageGrowth],
        ]],
        ['Revenue', [
            ['Annual Revenue Target (USD)', form.revenue.annualRevenueTarget],
            ['API Adoption vs Revenue Priority', form.revenue.adoptionVsRevenue],
            ['Premium Support / SLA Needed', form.revenue.premiumSupportNeeded],
        ]],
        ['Technology', [
            ['API Gateway Provider', form.technology.apiGatewayProvider],
            ['Technical Readiness', form.technology.technicalReadiness],
            ['Usage Analytics Maturity', form.technology.dataInfrastructureMaturity],
        ]],
        ['Objectives', [
            ['Primary Business Goal', form.objectives.primaryBusinessGoal],
            ['Strategic Importance of APIs', form.objectives.strategicImportance],
            ['Target Time Horizon', form.objectives.targetTimeHorizon],
        ]],
    ];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BusinessDataPage() {
    const router = useRouter();
    const { authenticated, loading } = useAuth();
    const [form, setForm] = useState<BusinessProfileForm>(initialForm);
    const [industryChoice, setIndustryChoice] = useState('');
    const [customIndustry, setCustomIndustry] = useState('');
    const [error, setError] = useState('');
    const [flowType, setFlowType] = useState<BusinessDataFlowType>('form');
    const [submittedIndustry, setSubmittedIndustry] = useState('');
    const [pdfGenerating, setPdfGenerating] = useState(false);

    // Saved profile persistence
    const [savedProfiles, setSavedProfiles] = useState<SavedBusinessProfile[]>([]);
    const [profilesLoading, setProfilesLoading] = useState(true);
    const [profileName, setProfileName] = useState('');
    const [loadedProfileId, setLoadedProfileId] = useState<number | null>(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        if (!loading && authenticated === false) {
            router.push('/login');
        }
    }, [authenticated, loading, router]);

    const loadProfilesList = async () => {
        setProfilesLoading(true);
        try {
            const response = await fetch('/api/business-profiles', { cache: 'no-store' });
            const data = await response.json().catch(() => []);
            if (response.ok && Array.isArray(data)) setSavedProfiles(data);
        } catch {
            // Non-fatal — saved-profiles panel just stays empty.
        } finally {
            setProfilesLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && authenticated) {
            const timer = window.setTimeout(() => { void loadProfilesList(); }, 0);
            return () => window.clearTimeout(timer);
        }
    }, [loading, authenticated]);

    const updateField = (section: SectionKey, field: string, value: string) => {
        setForm(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
        setError('');
        setSaveMessage('');
    };

    const resolvedIndustry = industryChoice === 'Other' ? customIndustry.trim() : industryChoice;

    const validateForm = (): string | null => {
        const missing = findMissingField(form);
        if (missing) return `Please enter ${missing}.`;
        if (!industryChoice) return 'Please select your industry.';
        if (industryChoice === 'Other' && !customIndustry.trim()) return 'Please enter your industry name.';
        return null;
    };

    const resetToNewProfile = () => {
        setForm(initialForm);
        setIndustryChoice('');
        setCustomIndustry('');
        setProfileName('');
        setLoadedProfileId(null);
        setError('');
        setSaveMessage('');
    };

    const handleLoadProfile = (profile: SavedBusinessProfile) => {
        setForm({
            business_model: profile.business_model,
            customers: profile.customers,
            apis: profile.apis,
            revenue: profile.revenue,
            technology: profile.technology,
            objectives: profile.objectives,
        });
        const industry = profile.business_model.industry || '';
        if (industry && industryOptions.includes(industry)) {
            setIndustryChoice(industry);
            setCustomIndustry('');
        } else if (industry) {
            setIndustryChoice('Other');
            setCustomIndustry(industry);
        } else {
            setIndustryChoice('');
            setCustomIndustry('');
        }
        setProfileName(profile.profile_name);
        setLoadedProfileId(profile.id);
        setError('');
        setSaveMessage('');
    };

    const handleDeleteProfile = async (profile: SavedBusinessProfile) => {
        try {
            await fetch(`/api/business-profiles/${profile.id}`, { method: 'DELETE' });
            if (loadedProfileId === profile.id) resetToNewProfile();
            loadProfilesList();
        } catch {
            setError('Failed to delete profile. Please try again.');
        }
    };

    const handleSaveProfile = async () => {
        const validationError = validateForm();
        if (validationError) { setError(validationError); return; }
        if (!profileName.trim()) { setError('Please enter a name for this profile before saving.'); return; }

        setSavingProfile(true);
        setError('');
        setSaveMessage('');

        const payload = {
            profile_name: profileName.trim(),
            business_model: { ...form.business_model, industry: resolvedIndustry },
            customers: form.customers,
            apis: form.apis,
            revenue: form.revenue,
            technology: form.technology,
            objectives: form.objectives,
        };

        try {
            const isEditing = loadedProfileId !== null;
            const response = await fetch(
                isEditing ? `/api/business-profiles/${loadedProfileId}` : '/api/business-profiles',
                {
                    method: isEditing ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.detail || data.message || 'Failed to save profile');

            setLoadedProfileId(data.id);
            setSaveMessage(isEditing ? 'Profile updated.' : 'Profile saved — you can reuse it anytime.');
            loadProfilesList();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save profile. Please try again.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSubmit = async () => {
        const validationError = validateForm();
        if (validationError) { setError(validationError); return; }

        setSubmittedIndustry(resolvedIndustry);
        setFlowType('analyzing');

        try {
            const response = await fetch('/api/monetization/recommend-llm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    industry: resolvedIndustry,
                    answers: buildLLMAnswers(form),
                }),
            });

            setFlowType('generating');

            const data = await response.json().catch(() => ({ message: 'Recommendation analysis failed' }));
            if (!response.ok) {
                throw new Error(data.detail || data.message || 'Recommendation analysis failed');
            }

            sessionStorage.setItem('recommendations_data', JSON.stringify(data));
            const params = new URLSearchParams();
            params.set('analysisSource', 'questionnaire-llm');
            params.set('selectedIndustry', resolvedIndustry);

            // Brief pause so "Generating" screen is visible
            await new Promise(resolve => setTimeout(resolve, 1200));
            router.push(`/dashboard/recommendation?${params.toString()}`);

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to generate recommendations. Please try again.');
            setFlowType('form');
        }
    };

    const handleDownloadReport = async () => {
        const validationError = validateForm();
        if (validationError) { setError(validationError); return; }

        setPdfGenerating(true);
        setError('');

        try {
            const recResponse = await fetch('/api/monetization/recommend-llm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ industry: resolvedIndustry, answers: buildLLMAnswers(form) }),
            });
            const recData = await recResponse.json().catch(() => ({}));
            if (!recResponse.ok) throw new Error(recData.detail || recData.message || 'Recommendation failed');

            const recommendations: Array<{
                id: string; name: string; description: string; score: number;
                reasoning?: string; timeframe?: string; expectedRevenue?: string; revenueImpact?: string; timeline?: string;
                implementation?: string; implementationSteps?: string[];
                pros?: string[]; cons?: string[]; risks?: string[]; mitigations?: string[]; riskSeverity?: string[];
                successMetrics?: string[]; strategicFit?: StrategicFit; whyThisStrategy?: WhyThisStrategyItem[];
                nextSteps?: NextStepItem[]; revisitTrigger?: string;
            }> = recData.recommendations || [];
            const pricing: { tiers: Array<{ name: string; price: string; billingPeriod: string; includedUsage: string; overageRate: string; targetSegment: string }>; rationale?: string } | null = recData.pricing || null;
            const roadmap: { phases: Array<{ name: string; duration: string; milestones: string[] }> } | null = recData.roadmap || null;

            const top = recommendations[0];
            const others = recommendations.slice(1, 4);
            const generatedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            const id = `MM-${new Date().getFullYear()}-${String((form.business_model.companyName || '').length * 211 % 10000).padStart(4, '0')}`;

            const profileSections = buildBusinessProfileSections(form, resolvedIndustry);
            const profileSectionsHtml = profileSections.map(([title, rows]) => xrSectionTitled(title, xrInfoGrid(rows))).join('');

            const otherStrategiesHtml = others.map((r) => `
                <div class="xr-why-card" style="break-inside:avoid;margin-bottom:10px;">
                    <h4 style="font-size:13px;margin-bottom:6px;">${r.name} <span style="font-size:10.5px;color:#64748b;font-weight:normal">${r.score}% match</span></h4>
                    <p style="margin-bottom:8px;">${r.description}</p>
                    <div class="xr-two-col">
                        <div>${xrList(r.pros)}</div>
                        <div>${xrList(r.cons, 'cons')}</div>
                    </div>
                </div>`).join('');

            const pdfHtml = `
<div class="page">
  ${xrHeader({ industry: resolvedIndustry, generatedDate, reportId: id })}
  ${xrBriefTitle('Business Monetization Report', [resolvedIndustry, form.business_model.companyName || 'Business Profile'])}
  ${profileSectionsHtml}
  ${xrFooter('Page 1 of 3', generatedDate)}
</div>

${top ? `
<div class="page">
  ${xrHeader({ industry: resolvedIndustry, generatedDate, reportId: id, rightTitle: 'Business Monetization Report — Recommendation', rightStrategy: top.name })}
  ${xrHero({
                name: top.name,
                description: top.description,
                confidence: top.score,
                revenueLow: top.expectedRevenue || top.revenueImpact || '—',
                revenueHigh: top.revenueImpact && top.revenueImpact !== top.expectedRevenue ? top.revenueImpact : '',
                timeToValue: top.timeframe || top.timeline || '—',
                complexity: (top.implementationSteps?.length || 0) <= 3 ? 'Low' : (top.implementationSteps?.length || 0) <= 6 ? 'Med' : 'High',
                complexitySub: top.implementation || '',
            })}
  ${xrWhyThisStrategy(top.whyThisStrategy || [])}
  ${top.strategicFit ? xrStrategicFit(top.strategicFit) : ''}
  ${xrFooter('Page 2 of 3', generatedDate)}
</div>

<div class="page">
  ${xrHeader({ industry: resolvedIndustry, generatedDate, reportId: id, rightTitle: 'Business Monetization Report — Execution Plan', rightStrategy: top.name })}
  ${pricing?.tiers.length ? xrPricingTable(pricing.tiers, pricing.rationale) : ''}
  ${roadmap?.phases.length ? xrRoadmap(roadmap.phases) : ''}
  ${xrRisksAndNextSteps(top.risks || [], top.mitigations || [], top.riskSeverity || [], top.nextSteps || [])}
  <div style="height:8px"></div>
  ${xrAdvisoryNote(top.score, top.revisitTrigger || `Revisit this strategy if performance diverges meaningfully from the ${top.expectedRevenue || 'projected'} revenue target.`)}
  ${others.length ? xrSectionTitled('Other Strategies Considered', otherStrategiesHtml) : ''}
  ${xrFooter('Page 3 of 3', generatedDate)}
</div>` : ''}`;

            await downloadHtmlAsPdf(pdfHtml, EXEC_REPORT_STYLES, `${(form.business_model.companyName || 'business').toLowerCase().replace(/\s+/g, '-')}-monetization-report.pdf`, 'business_data_pdf');

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to generate report.');
        } finally {
            setPdfGenerating(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (flowType === 'analyzing') {
        return (
            <LoadingAnalysis
                title="Analysing Your Business Profile"
                description={`Groq AI is reviewing your ${submittedIndustry} business data and identifying the best monetization strategies...`}
                steps={
                    <GeneratingRecommendationsSteps
                        analysisSource="manual"
                        fileName=""
                        industry={submittedIndustry}
                        sourceLabel="business data"
                    />
                }
                progressValue={40}
            />
        );
    }

    if (flowType === 'generating') {
        return (
            <LoadingAnalysis
                title="Generating Strategy Recommendations"
                description={`Groq AI is building personalised monetisation recommendations for your ${submittedIndustry} business...`}
                steps={
                    <GeneratingRecommendationsSteps
                        analysisSource="manual"
                        fileName=""
                        industry={submittedIndustry}
                        sourceLabel="business data"
                    />
                }
                progressValue={75}
            />
        );
    }

    return (
        <div className="business-data-page">
            <div className="business-shell">
                <div className="business-header">
                    <Button variant="outline" onClick={() => router.push('/dashboard/strategy-adviser')} className="business-back-button">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Options
                    </Button>
                    <div className="business-title-wrap">
                        <div className="business-title-row">
                            <span className="business-title-icon">
                                <BriefcaseBusiness className="w-7 h-7" />
                            </span>
                            <div>
                                <h1>Business Profile Builder</h1>
                                <p>Build a categorized business profile — save it once, reuse it anytime.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Saved profiles */}
                <Card className="business-card business-saved-card">
                    <div className="business-card-heading">
                        <span className="business-card-icon">
                            <FolderOpen className="w-5 h-5" />
                        </span>
                        <div>
                            <h2>Saved Business Profiles</h2>
                            <p>Load a previously saved profile to reuse it, or start a new one below.</p>
                        </div>
                    </div>

                    {profilesLoading ? (
                        <p className="business-saved-empty"><Loader2 className="w-4 h-4 mr-2 animate-spin inline" />Loading saved profiles…</p>
                    ) : savedProfiles.length === 0 ? (
                        <p className="business-saved-empty">No saved profiles yet — fill in the form below and save it to reuse later.</p>
                    ) : (
                        <div className="business-saved-list">
                            {savedProfiles.map((profile) => (
                                <div key={profile.id} className={`business-saved-item ${loadedProfileId === profile.id ? 'active' : ''}`}>
                                    <div className="business-saved-item-info">
                                        <strong>{profile.profile_name}</strong>
                                        <span>{profile.business_model.companyName || 'Untitled company'} · Updated {new Date(profile.updated_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="business-saved-item-actions">
                                        <Button variant="outline" onClick={() => handleLoadProfile(profile)} className="business-saved-load">
                                            Load
                                        </Button>
                                        <Button variant="outline" onClick={() => handleDeleteProfile(profile)} className="business-saved-delete">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {loadedProfileId !== null && (
                        <Button variant="outline" onClick={resetToNewProfile} className="business-new-profile">
                            <Plus className="w-4 h-4 mr-2" />
                            Start a New Profile
                        </Button>
                    )}
                </Card>

                <Card className="business-card">
                    <div className="business-card-heading">
                        <span className="business-card-icon">
                            <Sparkles className="w-5 h-5" />
                        </span>
                        <div>
                            <h2>{loadedProfileId !== null ? 'Editing Saved Profile' : 'New Business Profile'}</h2>
                            <p>Fill in each category, then save it for reuse or submit for AI recommendations.</p>
                        </div>
                    </div>

                    {error && (
                        <div className="business-error">{error}</div>
                    )}
                    {saveMessage && (
                        <div className="business-success"><CheckCircle2 className="w-4 h-4 mr-2 inline" />{saveMessage}</div>
                    )}

                    <form className="business-form-sections" onSubmit={(e) => e.preventDefault()}>
                        {SECTION_DEFS.map((section) => {
                            const SectionIcon = section.icon;
                            return (
                                <div key={section.key} className="business-section">
                                    <div className="business-section-heading">
                                        <span className="business-section-icon"><SectionIcon className="w-5 h-5" /></span>
                                        <div>
                                            <h3>{section.title}</h3>
                                            <p>{section.blurb}</p>
                                        </div>
                                    </div>
                                    <div className="business-form">
                                        {section.key === 'business_model' && (
                                            <label className="business-field">
                                                <span>Industry</span>
                                                <select
                                                    value={industryChoice}
                                                    onChange={(e) => { setIndustryChoice(e.target.value); if (e.target.value !== 'Other') setCustomIndustry(''); setError(''); setSaveMessage(''); }}
                                                    className="business-control"
                                                >
                                                    <option value="" disabled>Select Industry</option>
                                                    {industryOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                                {industryChoice === 'Other' && (
                                                    <input
                                                        value={customIndustry}
                                                        placeholder="Enter your industry name"
                                                        onChange={(e) => { setCustomIndustry(e.target.value); setError(''); setSaveMessage(''); }}
                                                        className="business-control business-other-control"
                                                    />
                                                )}
                                            </label>
                                        )}
                                        {section.fields.map((field) => (
                                            <label key={field.id} className="business-field">
                                                <span>{field.label}</span>
                                                {field.type === 'select' ? (
                                                    <select
                                                        value={form[section.key][field.id]}
                                                        onChange={(e) => updateField(section.key, field.id, e.target.value)}
                                                        className="business-control"
                                                    >
                                                        <option value="" disabled>Select {field.label}</option>
                                                        {field.options?.map((opt) => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type={field.type || 'text'}
                                                        min={field.type === 'number' ? '0' : undefined}
                                                        value={form[section.key][field.id]}
                                                        placeholder={field.placeholder}
                                                        onChange={(e) => updateField(section.key, field.id, e.target.value)}
                                                        className="business-control"
                                                    />
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </form>

                    <label className="business-field business-profile-name">
                        <span>Profile Name (for saving &amp; reuse)</span>
                        <input
                            value={profileName}
                            placeholder="e.g. Acme API Labs — Q3 Assessment"
                            onChange={(e) => { setProfileName(e.target.value); setError(''); setSaveMessage(''); }}
                            className="business-control"
                        />
                    </label>

                    <div className="business-actions">
                        <Button
                            variant="outline"
                            onClick={handleSaveProfile}
                            disabled={savingProfile}
                            className="business-save"
                        >
                            {savingProfile
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                                : <><Save className="w-4 h-4 mr-2" />{loadedProfileId !== null ? 'Update Profile' : 'Save Profile'}</>
                            }
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleDownloadReport}
                            disabled={pdfGenerating}
                            className="business-download"
                        >
                            {pdfGenerating
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Report…</>
                                : <><Download className="w-4 h-4 mr-2" />Download Report</>
                            }
                        </Button>
                        <Button onClick={handleSubmit} className="business-submit">
                            Get AI Recommendations
                        </Button>
                    </div>
                </Card>
            </div>
            <style>{`
                .business-data-page {
                    min-height: 100vh;
                    padding: 48px 24px 72px;
                    background:
                        radial-gradient(circle at 18% 0%, rgba(0, 229, 192, 0.14), transparent 34%),
                        linear-gradient(135deg, #060e1e 0%, #0b1f36 52%, #071420 100%);
                    color: #ffffff;
                    font-family: 'DM Sans', system-ui, sans-serif;
                }

                .business-shell {
                    width: min(1180px, 100%);
                    margin: 0 auto;
                }

                .business-header {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    margin-bottom: 30px;
                }

                .business-back-button {
                    height: 44px;
                    border: 1px solid rgba(0, 229, 192, 0.44);
                    background: #11d3ba;
                    color: #061421;
                    font-weight: 800;
                    box-shadow: 0 10px 24px rgba(0, 229, 192, 0.16);
                }

                .business-back-button:hover { background: #38e6d0; color: #061421; }

                .business-title-wrap { flex: 1; }

                .business-title-row {
                    display: flex;
                    align-items: center;
                    gap: 18px;
                }

                .business-title-icon,
                .business-card-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex: 0 0 auto;
                    color: #00e5c0;
                }

                .business-title-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    border: 3px solid #00e5c0;
                }

                .business-title-row h1 {
                    margin: 0;
                    color: #ffffff;
                    font-size: 32px;
                    line-height: 1.2;
                    font-weight: 800;
                }

                .business-title-row p {
                    margin: 4px 0 0;
                    color: rgba(255, 255, 255, 0.72);
                    font-size: 17px;
                }

                .business-card {
                    padding: 34px;
                    border-radius: 18px;
                    border: 1px solid rgba(0, 229, 192, 0.22);
                    background: rgba(17, 34, 54, 0.92);
                    box-shadow:
                        0 28px 80px rgba(0, 0, 0, 0.28),
                        inset 0 1px 0 rgba(255, 255, 255, 0.06);
                    margin-bottom: 26px;
                }

                .business-card-heading {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    margin-bottom: 28px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }

                .business-card-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    background: rgba(0, 229, 192, 0.12);
                    border: 1px solid rgba(0, 229, 192, 0.22);
                }

                .business-card-heading h2 {
                    margin: 0;
                    color: #ffffff;
                    font-size: 22px;
                    font-weight: 800;
                }

                .business-card-heading p {
                    margin: 4px 0 0;
                    color: rgba(255, 255, 255, 0.64);
                    font-size: 14px;
                }

                .business-saved-empty {
                    margin: 0;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 14px;
                }

                .business-saved-list {
                    display: grid;
                    gap: 12px;
                    margin-bottom: 18px;
                }

                .business-saved-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    padding: 14px 18px;
                    border-radius: 12px;
                    border: 1px solid rgba(0, 229, 192, 0.18);
                    background: rgba(31, 47, 68, 0.6);
                }

                .business-saved-item.active {
                    border-color: rgba(0, 229, 192, 0.6);
                    background: rgba(0, 229, 192, 0.1);
                }

                .business-saved-item-info {
                    display: grid;
                    gap: 3px;
                }

                .business-saved-item-info strong {
                    color: #ffffff;
                    font-size: 15px;
                }

                .business-saved-item-info span {
                    color: rgba(255, 255, 255, 0.56);
                    font-size: 13px;
                }

                .business-saved-item-actions {
                    display: flex;
                    gap: 8px;
                    flex-shrink: 0;
                }

                .business-saved-load,
                .business-saved-delete,
                .business-new-profile {
                    height: 40px;
                    border-radius: 8px;
                    border: 1px solid rgba(0, 229, 192, 0.34);
                    background: rgba(0, 229, 192, 0.08);
                    color: #8ffcf0;
                    font-weight: 700;
                }

                .business-saved-load:hover,
                .business-new-profile:hover {
                    background: rgba(0, 229, 192, 0.18);
                    color: #ffffff;
                }

                .business-saved-delete {
                    border-color: rgba(248, 113, 113, 0.4);
                    color: #fca5a5;
                }

                .business-saved-delete:hover {
                    background: rgba(248, 113, 113, 0.14);
                    color: #fecaca;
                }

                .business-error {
                    margin-bottom: 22px;
                    padding: 12px 14px;
                    border-radius: 10px;
                    border: 1px solid rgba(248, 113, 113, 0.42);
                    background: rgba(127, 29, 29, 0.26);
                    color: #fecaca;
                    font-size: 14px;
                    font-weight: 700;
                }

                .business-success {
                    margin-bottom: 22px;
                    padding: 12px 14px;
                    border-radius: 10px;
                    border: 1px solid rgba(0, 229, 192, 0.42);
                    background: rgba(0, 229, 192, 0.12);
                    color: #8ffcf0;
                    font-size: 14px;
                    font-weight: 700;
                }

                .business-form-sections {
                    display: grid;
                    gap: 32px;
                }

                .business-section {
                    padding-bottom: 28px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }

                .business-section:last-child {
                    border-bottom: none;
                    padding-bottom: 0;
                }

                .business-section-heading {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    margin-bottom: 20px;
                }

                .business-section-icon {
                    width: 38px;
                    height: 38px;
                    border-radius: 10px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex: 0 0 auto;
                    color: #00e5c0;
                    background: rgba(0, 229, 192, 0.12);
                    border: 1px solid rgba(0, 229, 192, 0.22);
                }

                .business-section-heading h3 {
                    margin: 0;
                    color: #ffffff;
                    font-size: 18px;
                    font-weight: 800;
                }

                .business-section-heading p {
                    margin: 2px 0 0;
                    color: rgba(255, 255, 255, 0.56);
                    font-size: 13px;
                }

                .business-form {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 22px 28px;
                }

                .business-field {
                    display: grid;
                    gap: 9px;
                    min-width: 0;
                }

                .business-profile-name {
                    margin-top: 8px;
                    padding-top: 24px;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                }

                .business-field span {
                    color: rgba(255, 255, 255, 0.88);
                    font-size: 14px;
                    line-height: 1.25;
                    font-weight: 800;
                }

                .business-control {
                    width: 100%;
                    min-width: 0;
                    height: 48px;
                    border-radius: 10px;
                    border: 1px solid rgba(0, 229, 192, 0.28);
                    background: rgba(31, 47, 68, 0.98);
                    color: #ffffff;
                    padding: 0 16px;
                    font-size: 15px;
                    font-weight: 600;
                    outline: none;
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
                    transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
                }

                .business-control::placeholder { color: rgba(255, 255, 255, 0.34); font-weight: 600; }

                .business-control:focus {
                    border-color: #8ffcf0;
                    background: rgba(36, 55, 79, 1);
                    box-shadow: 0 0 0 3px rgba(143, 252, 240, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.05);
                }

                .business-control option { background: #ffffff; color: #102033; font-weight: 600; }

                .business-other-control {
                    margin-top: 4px;
                    border-color: rgba(143, 252, 240, 0.42);
                    background: rgba(23, 42, 62, 1);
                }

                .business-actions {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 34px;
                    padding-top: 24px;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                }

                .business-save,
                .business-download {
                    min-width: 180px;
                    height: 48px;
                    border-radius: 10px;
                    border: 1px solid rgba(0, 229, 192, 0.44);
                    background: rgba(0, 229, 192, 0.1);
                    color: #8ffcf0;
                    font-size: 15px;
                    font-weight: 800;
                }

                .business-save:hover:not(:disabled),
                .business-download:hover:not(:disabled) { background: rgba(0, 229, 192, 0.18); color: #ffffff; }
                .business-save:disabled,
                .business-download:disabled { opacity: 0.65; cursor: not-allowed; }

                .business-submit {
                    min-width: 200px;
                    height: 48px;
                    border-radius: 10px;
                    background: #11d3ba;
                    color: #061421;
                    font-size: 15px;
                    font-weight: 900;
                    box-shadow: 0 16px 34px rgba(0, 229, 192, 0.2);
                }

                .business-submit:hover { background: #38e6d0; color: #061421; }

                @media (max-width: 760px) {
                    .business-data-page { padding: 28px 14px 48px; }
                    .business-header { align-items: flex-start; flex-direction: column; gap: 18px; }
                    .business-title-row h1 { font-size: 27px; }
                    .business-card { padding: 22px; }
                    .business-form { grid-template-columns: 1fr; gap: 18px; }
                    .business-saved-item { flex-direction: column; align-items: flex-start; }
                    .business-actions { justify-content: stretch; flex-direction: column; }
                    .business-save, .business-download, .business-submit { width: 100%; }
                }
            `}</style>
        </div>
    );
}
