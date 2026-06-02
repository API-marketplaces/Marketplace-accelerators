'use client'

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { ArrowLeft, BriefcaseBusiness, Sparkles } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { useAuth } from "@/app/hooks/useAuth";
import { QuestionnaireAnswers } from "@/app/types/QuestionnaireAnswers";
import LoadingAnalysis, { GeneratingRecommendationsSteps } from "../../../components/LoadingAnalysis";

type BusinessDataFlowType = 'form' | 'generating';

type BusinessDataForm = {
    companyName: string;
    industry: string;
    region: string;
    primaryBusinessGoal: string;
    numberOfApis: string;
    apiConsumerType: string;
    activeConsumers: string;
    currentAccessModel: string;
    perceivedBusinessValue: string;
    usageGrowth: string;
    monthlyTransactions: string;
    consumerGrowthExpectation: string;
    adoptionVsRevenue: string;
    preferredChargingMethod: string;
    premiumSupportNeeded: string;
    competitiveLandscape: string;
    annualRevenueTarget: string;
    strategicImportance: string;
};

const initialForm: BusinessDataForm = {
    companyName: '',
    industry: '',
    region: '',
    primaryBusinessGoal: '',
    numberOfApis: '',
    apiConsumerType: '',
    activeConsumers: '',
    currentAccessModel: '',
    perceivedBusinessValue: '',
    usageGrowth: '',
    monthlyTransactions: '',
    consumerGrowthExpectation: '',
    adoptionVsRevenue: '',
    preferredChargingMethod: '',
    premiumSupportNeeded: '',
    competitiveLandscape: '',
    annualRevenueTarget: '',
    strategicImportance: '',
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

const formFields: Array<{
    id: keyof BusinessDataForm;
    label: string;
    type?: 'text' | 'number' | 'select';
    options?: string[];
    placeholder?: string;
}> = [
    { id: 'companyName', label: 'Company Name', placeholder: 'Acme API Labs' },
    { id: 'industry', label: 'Industry', type: 'select', options: industryOptions },
    { id: 'region', label: 'Region', placeholder: 'North America, Europe, APAC' },
    { id: 'primaryBusinessGoal', label: 'Primary Business Goal', type: 'select', options: ['Revenue Growth', 'User Acquisition', 'Market Expansion', 'Customer Retention'] },
    { id: 'numberOfApis', label: 'Number of APIs', type: 'number', placeholder: '12' },
    { id: 'apiConsumerType', label: 'API Consumer Type', type: 'select', options: ['B2B', 'B2C', 'Both'] },
    { id: 'activeConsumers', label: 'Number of Active Consumers', type: 'number', placeholder: '1500' },
    { id: 'currentAccessModel', label: 'Current API Access Model', type: 'select', options: ['Free', 'Internal Only', 'Subscription', 'Pay-per-use', 'Tiered', 'Hybrid'] },
    { id: 'perceivedBusinessValue', label: 'Perceived Business Value of APIs', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
    { id: 'usageGrowth', label: 'API Usage Growth (YoY)', type: 'select', options: ['Declining', 'Flat', '0-25%', '25-50%', '50%+'] },
    { id: 'monthlyTransactions', label: 'Monthly API Transactions', type: 'number', placeholder: '50000' },
    { id: 'consumerGrowthExpectation', label: 'Consumer Growth Expectation', type: 'select', options: ['Low', 'Medium', 'High'] },
    { id: 'adoptionVsRevenue', label: 'Importance of API Adoption vs Revenue', type: 'select', options: ['Adoption First', 'Balanced', 'Revenue First'] },
    { id: 'preferredChargingMethod', label: 'Preferred Charging Method', type: 'select', options: ['Subscription', 'Pay-per-use', 'Tiered', 'Freemium', 'Hybrid', 'Value-based'] },
    { id: 'premiumSupportNeeded', label: 'Need for Premium Support/SLA', type: 'select', options: ['No', 'Maybe', 'Yes'] },
    { id: 'competitiveLandscape', label: 'Competitive Landscape', type: 'select', options: ['Low Competition', 'Moderate Competition', 'High Competition'] },
    { id: 'annualRevenueTarget', label: 'Revenue Target from APIs (Annual)', type: 'number', placeholder: '250000' },
    { id: 'strategicImportance', label: 'Strategic Importance of APIs', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
];

const numberValue = (value: string) => Number(value || 0);

function toScore(value: string, positiveValues: string[] = ['High', 'Critical', 'Yes', '50%+']) {
    if (positiveValues.includes(value)) return 2;
    if (['Medium', 'Maybe', '25-50%', 'Balanced', 'Moderate Competition'].includes(value)) return 1;
    if (['Declining', 'Low', 'No', 'Low Competition', 'Adoption First'].includes(value)) return -1;
    if (value === 'High Competition') return 2;
    return 0;
}

function buildAnswers(form: BusinessDataForm, industryName: string): Partial<QuestionnaireAnswers> {
    const consumers = numberValue(form.activeConsumers);
    const transactions = numberValue(form.monthlyTransactions);
    const revenueTarget = numberValue(form.annualRevenueTarget);
    const apiCount = numberValue(form.numberOfApis);
    const prefersSubscription = form.preferredChargingMethod === 'Subscription' || form.currentAccessModel === 'Subscription';
    const prefersFreemium = form.preferredChargingMethod === 'Freemium' || form.currentAccessModel === 'Free';

    return {
        industry: industryName || 'Other',
        businessType: form.apiConsumerType === 'B2B' ? 2 : form.apiConsumerType === 'B2C' ? -1 : 0,
        userBase: consumers >= 1000 ? 2 : consumers >= 250 ? 1 : consumers > 0 ? -1 : 0,
        currentRevenue: revenueTarget >= 120000 ? 2 : revenueTarget >= 50000 ? 1 : revenueTarget > 0 ? -1 : 0,
        primaryGoal: form.primaryBusinessGoal === 'Revenue Growth' || form.adoptionVsRevenue === 'Revenue First' ? 2 : form.adoptionVsRevenue === 'Adoption First' ? -1 : 0,
        customerWillingness: toScore(form.perceivedBusinessValue) + (form.premiumSupportNeeded === 'Yes' ? 1 : 0),
        competition: toScore(form.competitiveLandscape),
        apiComplexity: apiCount >= 10 || transactions >= 50000 ? 2 : apiCount >= 3 || transactions >= 10000 ? 1 : 0,
        targetMarket: form.apiConsumerType === 'B2B' || form.premiumSupportNeeded === 'Yes' ? 2 : form.apiConsumerType === 'B2C' ? -1 : 0,
        timeToMarket: prefersFreemium ? 2 : prefersSubscription ? 1 : 0,
        resourceLevel: form.strategicImportance === 'Critical' || form.strategicImportance === 'High' ? 2 : toScore(form.strategicImportance),
    };
}

export default function BusinessDataPage() {
    const router = useRouter();
    const { authenticated, loading } = useAuth();
    const [form, setForm] = useState<BusinessDataForm>(initialForm);
    const [customIndustry, setCustomIndustry] = useState('');
    const [error, setError] = useState('');
    const [flowType, setFlowType] = useState<BusinessDataFlowType>('form');
    const [recommendationParams, setRecommendationParams] = useState('');
    const [submittedIndustry, setSubmittedIndustry] = useState('');

    useEffect(() => {
        if (!loading && authenticated === false) {
            router.push('/login');
        }
    }, [authenticated, loading, router]);

    const updateField = (field: keyof BusinessDataForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (field === 'industry' && value !== 'Other') {
            setCustomIndustry('');
        }
        setError('');
    };

    const handleSubmit = () => {
        const missingField = formFields.find(field => !form[field.id].trim());
        const selectedIndustry = form.industry === 'Other' ? customIndustry.trim() : form.industry;

        if (missingField) {
            setError(`Please enter ${missingField.label}.`);
            return;
        }

        if (form.industry === 'Other' && !selectedIndustry) {
            setError('Please enter your industry name.');
            return;
        }

        const params = new URLSearchParams();
        params.set('answers', JSON.stringify(buildAnswers(form, selectedIndustry)));
        params.set('analysisSource', 'manual');
        params.set('selectedIndustry', selectedIndustry || 'Other');
        setSubmittedIndustry(selectedIndustry || 'Other');
        setRecommendationParams(params.toString());
        setFlowType('generating');
    };

    useEffect(() => {
        if (flowType !== 'generating' || !recommendationParams) return;

        const timer = setTimeout(() => {
            router.push(`/dashboard/recommendation?${recommendationParams}`);
        }, 2000);

        return () => clearTimeout(timer);
    }, [flowType, recommendationParams, router]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (flowType === 'generating') {
        return (
            <LoadingAnalysis
                title="Generating Strategy Recommendations"
                description={`Our AI is analyzing your ${submittedIndustry} business profile and generating personalized monetization strategies...`}
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
                                <h1>Business Data</h1>
                                <p>Fill in your API business profile</p>
                            </div>
                        </div>
                    </div>
                </div>

                <Card className="business-card">
                    <div className="business-card-heading">
                        <span className="business-card-icon">
                            <Sparkles className="w-5 h-5" />
                        </span>
                        <div>
                            <h2>Business Data Form</h2>
                            <p>Submit this form to view the recommended monetization model.</p>
                        </div>
                    </div>

                    {error && (
                        <div className="business-error">
                            {error}
                        </div>
                    )}

                    <form className="business-form" onSubmit={(event) => event.preventDefault()}>
                        {formFields.map((field) => (
                            <label key={field.id} className="business-field">
                                <span>{field.label}</span>
                                {field.type === 'select' ? (
                                    <select
                                        value={form[field.id]}
                                        onChange={(event) => updateField(field.id, event.target.value)}
                                        className="business-control"
                                    >
                                        <option value="" disabled>Select {field.label}</option>
                                        {field.options?.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={field.type || 'text'}
                                        min={field.type === 'number' ? '0' : undefined}
                                        value={form[field.id]}
                                        placeholder={field.placeholder}
                                        onChange={(event) => updateField(field.id, event.target.value)}
                                        className="business-control"
                                    />
                                )}
                                {field.id === 'industry' && form.industry === 'Other' && (
                                    <input
                                        value={customIndustry}
                                        placeholder="Enter your industry name"
                                        onChange={(event) => {
                                            setCustomIndustry(event.target.value);
                                            setError('');
                                        }}
                                        className="business-control business-other-control"
                                    />
                                )}
                            </label>
                        ))}
                    </form>

                    <div className="business-actions">
                        <Button onClick={handleSubmit} className="business-submit">
                            Submit
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

                .business-back-button:hover {
                    background: #38e6d0;
                    color: #061421;
                }

                .business-title-wrap {
                    flex: 1;
                }

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

                .business-control::placeholder {
                    color: rgba(255, 255, 255, 0.34);
                    font-weight: 600;
                }

                .business-control:focus {
                    border-color: #8ffcf0;
                    background: rgba(36, 55, 79, 1);
                    box-shadow:
                        0 0 0 3px rgba(143, 252, 240, 0.16),
                        inset 0 1px 0 rgba(255, 255, 255, 0.05);
                }

                .business-control option {
                    background: #ffffff;
                    color: #102033;
                    font-weight: 600;
                }

                .business-other-control {
                    margin-top: 4px;
                    border-color: rgba(143, 252, 240, 0.42);
                    background: rgba(23, 42, 62, 1);
                }

                .business-actions {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 34px;
                    padding-top: 24px;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                }

                .business-submit {
                    min-width: 180px;
                    height: 48px;
                    border-radius: 10px;
                    background: #11d3ba;
                    color: #061421;
                    font-size: 15px;
                    font-weight: 900;
                    box-shadow: 0 16px 34px rgba(0, 229, 192, 0.2);
                }

                .business-submit:hover {
                    background: #38e6d0;
                    color: #061421;
                }

                @media (max-width: 760px) {
                    .business-data-page {
                        padding: 28px 14px 48px;
                    }

                    .business-header {
                        align-items: flex-start;
                        flex-direction: column;
                        gap: 18px;
                    }

                    .business-title-row h1 {
                        font-size: 27px;
                    }

                    .business-card {
                        padding: 22px;
                    }

                    .business-form {
                        grid-template-columns: 1fr;
                        gap: 18px;
                    }

                    .business-actions {
                        justify-content: stretch;
                    }

                    .business-submit {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
