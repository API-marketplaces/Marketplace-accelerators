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

const BD_PDF_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a202c; background: #fff; }
  .page { padding: 40px 48px; }
  .header { border-bottom: 3px solid #0d9488; padding-bottom: 18px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; color: #0d9488; margin-bottom: 4px; }
  .header .meta { font-size: 11px; color: #64748b; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 13px; font-weight: bold; color: #0f172a; border-left: 4px solid #0d9488; padding-left: 10px; margin-bottom: 10px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; }
  .info-box .label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 3px; }
  .info-box .value { font-size: 12px; color: #1e293b; }
  .reason-box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
  .reason-box .label { font-size: 12px; font-weight: bold; color: #0f766e; margin-bottom: 6px; }
  .reason-box p { font-size: 12px; color: #134e4a; line-height: 1.6; }
  ul { list-style: none; padding: 0; }
  ul li::before { content: "• "; color: #0d9488; font-weight: bold; }
  ul li { padding: 2px 0; font-size: 11.5px; line-height: 1.5; }
  .pros li::before { color: #16a34a; }
  .cons li::before { color: #d97706; }
  .steps-list { counter-reset: steps; }
  .steps-list li { counter-increment: steps; padding: 4px 0 4px 24px; position: relative; }
  .steps-list li::before { content: counter(steps) ". "; position: absolute; left: 0; color: #0d9488; font-weight: bold; }
  .score-bar { height: 8px; background: #e2e8f0; border-radius: 9999px; margin-top: 4px; }
  .score-fill { height: 100%; background: #0d9488; border-radius: 9999px; }
  .visual-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .visual-card { background: #f8fafc; border: 1px solid #dbe4ef; border-radius: 8px; padding: 14px; break-inside: avoid; }
  .visual-card h3 { font-size: 12px; color: #0f172a; margin-bottom: 10px; }
  .chart-row { display: grid; grid-template-columns: 125px 1fr 36px; gap: 8px; align-items: center; margin-bottom: 8px; font-size: 10.5px; color: #334155; }
  .chart-track { height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; display: block; }
  .chart-fill { height: 100%; border-radius: inherit; background: #0d9488; display: block; }
  .metric-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .metric-tile { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 10px; min-height: 66px; }
  .metric-tile span { display: block; color: #64748b; font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 5px; }
  .metric-tile strong { display: block; color: #0f766e; font-size: 14px; line-height: 1.2; }
  .radar-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 12px; }
  .radar-cell { background: #fff; border: 1px solid #dbe4ef; border-radius: 8px; padding: 10px; text-align: center; min-height: 72px; }
  .radar-cell strong { display: block; color: #0f766e; font-size: 18px; margin-bottom: 4px; }
  .radar-cell span { color: #64748b; font-size: 10px; line-height: 1.3; }
  .funnel { display: grid; gap: 7px; margin-top: 8px; }
  .funnel-step { height: 24px; border-radius: 6px; color: #fff; font-size: 10px; font-weight: bold; display: grid; place-items: center; margin: 0 auto; }
  .portfolio-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px; }
  .portfolio-cell { border: 1px solid #dbe4ef; border-radius: 8px; padding: 10px; background: #fff; min-height: 72px; }
  .portfolio-cell b { display: block; color: #0f172a; font-size: 11px; margin-bottom: 5px; }
  .portfolio-cell span { color: #475569; font-size: 10.5px; line-height: 1.4; }
  .rec-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 14px; }
  .rec-card h3 { font-size: 14px; color: #0d9488; margin-bottom: 6px; }
  .badge { display: inline-block; background: #f0fdfa; border: 1px solid #99f6e4; color: #0d9488; padding: 1px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; margin-left: 8px; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;


function numericValue(value: string): number {
    const parsed = Number(String(value || '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
}

function qualitativeScore(value: string): number {
    const normalized = value.toLowerCase();
    if (normalized.includes('critical') || normalized.includes('high') || normalized.includes('mature') || normalized.includes('50%+')) return 90;
    if (normalized.includes('medium') || normalized.includes('balanced') || normalized.includes('developing') || normalized.includes('25-50')) return 65;
    if (normalized.includes('low') || normalized.includes('ad-hoc') || normalized.includes('flat') || normalized.includes('maybe')) return 40;
    if (normalized.includes('none') || normalized.includes('declining') || normalized.includes('no')) return 25;
    return 55;
}

function buildBusinessVisuals(form: BusinessProfileForm, recommendations: Array<{ name: string; score: number }>) {
    const activeConsumers = numericValue(form.customers.activeConsumers);
    const monthlyTransactions = numericValue(form.apis.monthlyTransactions);
    const revenueTarget = numericValue(form.revenue.annualRevenueTarget);
    const tech = qualitativeScore(form.technology.technicalReadiness);
    const analytics = qualitativeScore(form.technology.dataInfrastructureMaturity);
    const strategic = qualitativeScore(form.objectives.strategicImportance);
    const customerGrowth = qualitativeScore(form.customers.consumerGrowthExpectation);
    const apiValue = qualitativeScore(form.customers.perceivedBusinessValue);
    const usageGrowth = qualitativeScore(form.apis.usageGrowth);
    const readiness = Math.round((tech + analytics + strategic) / 3);
    const growth = Math.round((customerGrowth + usageGrowth + apiValue) / 3);
    const revenueFocus = qualitativeScore(form.revenue.adoptionVsRevenue === 'Revenue First' ? 'High' : form.revenue.adoptionVsRevenue === 'Balanced' ? 'Medium' : 'Low');
    const monetizationComplexity = Math.round((qualitativeScore(form.business_model.competitiveLandscape) + revenueFocus + tech) / 3);
    const topScores = recommendations.slice(0, 5).map((item, index) => `
        <div class="chart-row"><span>${index === 0 ? 'Top: ' : ''}${item.name}</span><i class="chart-track"><b class="chart-fill" style="width:${item.score}%;background:${index === 0 ? '#0d9488' : '#2563eb'}"></b></i><strong>${item.score}%</strong></div>
    `).join('');
    return `
  <div class="section">
    <div class="section-title">Visual Business Snapshot</div>
    <div class="metric-strip">
      <div class="metric-tile"><span>Active Consumers</span><strong>${activeConsumers.toLocaleString() || '0'}</strong></div>
      <div class="metric-tile"><span>Monthly Transactions</span><strong>${monthlyTransactions.toLocaleString() || '0'}</strong></div>
      <div class="metric-tile"><span>Annual API Target</span><strong>$${revenueTarget.toLocaleString() || '0'}</strong></div>
      <div class="metric-tile"><span>Top Strategy</span><strong>${recommendations[0]?.name || 'Pending'}</strong></div>
    </div>
    <div class="visual-grid" style="margin-top:14px">
      <div class="visual-card">
        <h3>Readiness Signals</h3>
        <div class="chart-row"><span>Technical Readiness</span><i class="chart-track"><b class="chart-fill" style="width:${tech}%"></b></i><strong>${tech}%</strong></div>
        <div class="chart-row"><span>Analytics Maturity</span><i class="chart-track"><b class="chart-fill" style="width:${analytics}%;background:#2563eb"></b></i><strong>${analytics}%</strong></div>
        <div class="chart-row"><span>Strategic Importance</span><i class="chart-track"><b class="chart-fill" style="width:${strategic}%;background:#7c3aed"></b></i><strong>${strategic}%</strong></div>
        <div class="chart-row"><span>Overall Readiness</span><i class="chart-track"><b class="chart-fill" style="width:${readiness}%;background:#16a34a"></b></i><strong>${readiness}%</strong></div>
      </div>
      <div class="visual-card">
        <h3>Opportunity Signals</h3>
        <div class="chart-row"><span>Customer Growth</span><i class="chart-track"><b class="chart-fill" style="width:${customerGrowth}%"></b></i><strong>${customerGrowth}%</strong></div>
        <div class="chart-row"><span>API Value</span><i class="chart-track"><b class="chart-fill" style="width:${apiValue}%;background:#2563eb"></b></i><strong>${apiValue}%</strong></div>
        <div class="chart-row"><span>Usage Growth</span><i class="chart-track"><b class="chart-fill" style="width:${usageGrowth}%;background:#7c3aed"></b></i><strong>${usageGrowth}%</strong></div>
        <div class="chart-row"><span>Growth Potential</span><i class="chart-track"><b class="chart-fill" style="width:${growth}%;background:#16a34a"></b></i><strong>${growth}%</strong></div>
      </div>
    </div>
    <div class="radar-grid">
      <div class="radar-cell"><strong>${readiness}%</strong><span>Platform readiness</span></div>
      <div class="radar-cell"><strong>${growth}%</strong><span>Market opportunity</span></div>
      <div class="radar-cell"><strong>${monetizationComplexity}%</strong><span>Monetization complexity</span></div>
    </div>
    <div class="visual-grid">
      <div class="visual-card">
        <h3>API Monetization Funnel</h3>
        <div class="funnel">
          <div class="funnel-step" style="width:96%;background:#0d9488">API Inventory: ${form.apis.numberOfApis || 'N/A'} APIs</div>
          <div class="funnel-step" style="width:82%;background:#2563eb">Usage Base: ${monthlyTransactions.toLocaleString() || '0'} transactions/month</div>
          <div class="funnel-step" style="width:68%;background:#7c3aed">Target Customers: ${form.customers.apiConsumerType || 'Mixed'}</div>
          <div class="funnel-step" style="width:54%;background:#d97706">Revenue Target: $${revenueTarget.toLocaleString() || '0'}</div>
        </div>
      </div>
      <div class="visual-card">
        <h3>Strategy Match Ranking</h3>
        ${topScores || '<p style="color:#64748b;font-size:11px">No recommendation scores available yet.</p>'}
      </div>
    </div>
    <div class="visual-card">
      <h3>Operating Model Map</h3>
      <div class="portfolio-grid">
        <div class="portfolio-cell"><b>Access Model</b><span>${form.business_model.currentAccessModel || 'Not defined'} today, moving toward ${form.business_model.preferredChargingMethod || 'a monetized model'}.</span></div>
        <div class="portfolio-cell"><b>Customer Motion</b><span>${form.customers.apiConsumerType || 'Mixed'} consumers with ${form.customers.consumerGrowthExpectation || 'unknown'} growth expectation.</span></div>
        <div class="portfolio-cell"><b>Technology Base</b><span>${form.technology.apiGatewayProvider || 'No gateway'} with ${form.technology.technicalReadiness || 'unknown'} billing readiness.</span></div>
        <div class="portfolio-cell"><b>Business Goal</b><span>${form.objectives.primaryBusinessGoal || 'Growth'} over a ${form.objectives.targetTimeHorizon || 'planned'} time horizon.</span></div>
      </div>
    </div>
  </div>`;
}
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
            // Step 1: Get recommendations
            const recResponse = await fetch('/api/monetization/recommend-llm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ industry: resolvedIndustry, answers: buildLLMAnswers(form) }),
            });
            const recData = await recResponse.json().catch(() => ({}));
            if (!recResponse.ok) throw new Error(recData.detail || recData.message || 'Recommendation failed');

            const recommendations: Array<{
                id: string; name: string; description: string; score: number;
                reasoning?: string; timeframe?: string; expectedRevenue?: string;
                implementation?: string; implementationSteps?: string[];
                pros?: string[]; cons?: string[]; risks?: string[];
                mitigations?: string[]; successMetrics?: string[];
            }> = recData.recommendations || [];

            const top = recommendations[0];

            // Step 2: Get AI narrative for top recommendation
            let narrative: Record<string, string> | null = null;
            if (top) {
                const narRes = await fetch('/api/monetization/enhance-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        industry: resolvedIndustry,
                        strategy_name: top.name,
                        description: top.description,
                        reasoning: top.reasoning || '',
                        pros: top.pros || [],
                        cons: top.cons || [],
                        risks: top.risks || [],
                        mitigations: top.mitigations || [],
                        implementation_steps: top.implementationSteps || [],
                        timeframe: top.timeframe || '',
                        expected_revenue: top.expectedRevenue || '',
                        success_metrics: top.successMetrics || [],
                        score: top.score,
                    }),
                });
                if (narRes.ok) narrative = await narRes.json();
            }

            // Step 3: Build the PDF
            const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            const profileSections = buildBusinessProfileSections(form, resolvedIndustry);

            const profileSectionsHtml = profileSections.map(([title, rows]) => `
                <div class="section">
                    <div class="section-title">${title}</div>
                    <div class="grid3">
                        ${rows.map(([label, value]) => `<div class="info-box"><div class="label">${label}</div><div class="value">${value || '—'}</div></div>`).join('')}
                    </div>
                </div>
            `).join('');

            const recSection = recommendations.map((r, i) => `
                <div class="rec-card">
                    <h3>${i === 0 ? '⭐ ' : ''}${r.name} <span class="badge">${r.score}% match</span></h3>
                    <p style="font-size:11.5px;color:#334155;margin-bottom:8px">${r.description}</p>
                    <div class="grid3" style="margin-bottom:8px">
                        <div class="info-box"><div class="label">Timeframe</div><div class="value">${r.timeframe || '—'}</div></div>
                        <div class="info-box"><div class="label">Expected Revenue</div><div class="value">${r.expectedRevenue || '—'}</div></div>
                        <div class="info-box"><div class="label">Implementation</div><div class="value">${r.implementation || '—'}</div></div>
                    </div>
                    <div class="grid2">
                        <div><div style="font-size:11px;font-weight:bold;color:#16a34a;margin-bottom:4px">Pros</div>
                            <ul class="pros">${(r.pros || []).map(p => `<li>${p}</li>`).join('')}</ul></div>
                        <div><div style="font-size:11px;font-weight:bold;color:#d97706;margin-bottom:4px">Considerations</div>
                            <ul class="cons">${(r.cons || []).map(c => `<li>${c}</li>`).join('')}</ul></div>
                    </div>
                    ${r.implementationSteps?.length ? `<div style="margin-top:10px"><div style="font-size:11px;font-weight:bold;color:#0d9488;margin-bottom:4px">Implementation Steps</div>
                        <ul class="steps-list">${r.implementationSteps.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
                </div>`).join('');

            const pdfHtml = `
<div class="page">
  <div class="header">
    <h1>Business Monetization Strategy Report</h1>
    <div class="meta">${form.business_model.companyName} &nbsp;·&nbsp; Industry: ${resolvedIndustry} &nbsp;·&nbsp; Generated ${date}</div>
  </div>

  ${buildBusinessVisuals(form, recommendations)}

  ${narrative?.executive_summary ? `
  <div class="reason-box">
    <div class="label">📋 Executive Summary</div>
    <p>${narrative.executive_summary}</p>
  </div>` : top?.reasoning ? `
  <div class="reason-box">
    <div class="label">💡 Top Recommendation Rationale</div>
    <p>${top.reasoning}</p>
  </div>` : ''}

  <div class="section">
    <div class="section-title">📋 Business Profile</div>
  </div>
  ${profileSectionsHtml}

  ${narrative?.strategic_fit_analysis ? `
  <div class="section">
    <div class="section-title">🎯 Strategic Fit Analysis</div>
    <p style="font-size:12px;color:#334155;line-height:1.75">${narrative.strategic_fit_analysis}</p>
  </div>` : ''}

  ${narrative?.business_impact ? `
  <div class="section">
    <div class="section-title">📈 Business Impact &amp; Revenue Outlook</div>
    <p style="font-size:12px;color:#334155;line-height:1.75">${narrative.business_impact}</p>
  </div>` : ''}

  ${narrative?.market_opportunity ? `
  <div class="section">
    <div class="section-title">🌍 Market Opportunity</div>
    <p style="font-size:12px;color:#334155;line-height:1.75">${narrative.market_opportunity}</p>
  </div>` : ''}

  <div class="section">
    <div class="section-title">🏆 Recommended Monetization Strategies</div>
    ${recSection}
  </div>

  ${narrative?.implementation_deep_dive ? `
  <div class="section">
    <div class="section-title">🗺️ Implementation Deep Dive</div>
    <p style="font-size:12px;color:#334155;line-height:1.75">${narrative.implementation_deep_dive}</p>
  </div>` : ''}

  ${narrative?.risk_deep_dive ? `
  <div class="section">
    <div class="section-title">🚨 Risk Analysis &amp; Mitigation</div>
    <p style="font-size:12px;color:#334155;line-height:1.75">${narrative.risk_deep_dive}</p>
  </div>` : ''}

  ${narrative?.recommended_next_steps ? `
  <div class="section">
    <div class="section-title">🚀 Recommended Next Steps (Next 30 Days)</div>
    <p style="font-size:12px;color:#334155;line-height:1.75">${narrative.recommended_next_steps}</p>
  </div>` : ''}

  <div class="footer">MonetizeMate &nbsp;·&nbsp; Confidential &nbsp;·&nbsp; Generated by AI — review with a qualified business strategist before implementation.</div>
</div>`;

            await downloadHtmlAsPdf(pdfHtml, BD_PDF_STYLES, `${(form.business_model.companyName || 'business').toLowerCase().replace(/\s+/g, '-')}-monetization-report.pdf`, 'business_data_pdf');

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
