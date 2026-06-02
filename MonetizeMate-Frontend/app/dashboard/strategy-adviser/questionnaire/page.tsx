'use client'

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "../../../components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { QuestionnaireAnswers } from '../../../types/QuestionnaireAnswers';
import { QUESTIONNAIRE_QUESTIONS } from '../../../constants/strategy-constants';
import LoadingAnalysis, { QuestionnaireAnalysisSteps, GeneratingRecommendationsSteps } from "../../../components/LoadingAnalysis";
import QuestionnaireCard from "../../../components/QuestionnaireCard";
import { useAuth } from "@/app/hooks/useAuth";

type QuestionnaireFlowType = 'questionnaire' | 'analyzing' | 'generating';

function QuestionnairePageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { authenticated, loading } = useAuth();

    const industryFromQuery = searchParams.get('industry') || '';

    useEffect(() => {
        if (!loading && authenticated === false) {
            router.push('/login');
        }
        if (!loading && !industryFromQuery) {
            // If no industry is provided, go back to the start
            router.push('/dashboard/strategy-adviser');
        }
    }, [authenticated, industryFromQuery, loading, router]);

    const [flowType, setFlowType] = useState<QuestionnaireFlowType>('questionnaire');
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>({});
    const analysisSource = 'manual' as const;
    const selectedIndustry = industryFromQuery;
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');


    const handleNext = () => {
        setDirection('forward');
        if (currentStep < QUESTIONNAIRE_QUESTIONS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setFlowType('analyzing');
            setTimeout(() => {
                setFlowType('generating');
            }, 3000);
        }
    };

    // Handle transition from generating to results
    useEffect(() => {
        if (flowType === 'generating') {
            const timer = setTimeout(() => {
                const params = new URLSearchParams();
                params.set('answers', JSON.stringify(answers));
                params.set('analysisSource', analysisSource);
                params.set('selectedIndustry', selectedIndustry);
                router.push(`/dashboard/recommendation?${params.toString()}`);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [flowType, answers, analysisSource, selectedIndustry, router]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    // Questionnaire flow
    if (flowType === 'questionnaire') {
        return (
            <div className="questionnaire-page">
                <div className="questionnaire-shell">
                    <div className="questionnaire-header">
                        <Button variant="outline" onClick={() => router.push('/dashboard/strategy-adviser')} className="questionnaire-back">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Options
                        </Button>
                        <div className="questionnaire-title-wrap">
                            <div className="questionnaire-title-row">
                                <span className="questionnaire-title-icon">
                                    <MessageSquare className="w-7 h-7" />
                                </span>
                                <div>
                                    <h1>Business Assessment</h1>
                                    <p>Industry: {selectedIndustry}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <QuestionnaireCard
                        currentStep={currentStep}
                        setCurrentStep={setCurrentStep}
                        answers={answers}
                        setAnswers={setAnswers}
                        direction={direction}
                        setDirection={setDirection}
                        selectedIndustry={selectedIndustry}
                        handleNext={handleNext}
                    />
                </div>
                <style>{`
                    .questionnaire-page {
                        min-height: 100vh;
                        padding: 48px 24px 72px;
                        background:
                            radial-gradient(circle at 18% 0%, rgba(0, 229, 192, 0.14), transparent 34%),
                            linear-gradient(135deg, #060e1e 0%, #0b1f36 52%, #071420 100%);
                        color: #ffffff;
                        font-family: 'DM Sans', system-ui, sans-serif;
                    }

                    .questionnaire-shell {
                        width: min(760px, 100%);
                        margin: 0 auto;
                    }

                    .questionnaire-header {
                        display: flex;
                        align-items: center;
                        gap: 24px;
                        margin-bottom: 30px;
                    }

                    .questionnaire-back {
                        height: 44px;
                        border: 1px solid rgba(0, 229, 192, 0.44);
                        background: #11d3ba;
                        color: #061421;
                        font-weight: 800;
                        box-shadow: 0 10px 24px rgba(0, 229, 192, 0.16);
                    }

                    .questionnaire-back:hover {
                        background: #38e6d0;
                        color: #061421;
                    }

                    .questionnaire-title-wrap {
                        flex: 1;
                    }

                    .questionnaire-title-row {
                        display: flex;
                        align-items: center;
                        gap: 18px;
                    }

                    .questionnaire-title-icon {
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        border: 3px solid #00e5c0;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        color: #00e5c0;
                        flex: 0 0 auto;
                    }

                    .questionnaire-title-row h1 {
                        margin: 0;
                        color: #ffffff;
                        font-size: 32px;
                        line-height: 1.2;
                        font-weight: 800;
                    }

                    .questionnaire-title-row p {
                        margin: 4px 0 0;
                        color: rgba(255, 255, 255, 0.72);
                        font-size: 17px;
                    }

                    @media (max-width: 640px) {
                        .questionnaire-page {
                            padding: 28px 14px 48px;
                        }

                        .questionnaire-header {
                            align-items: flex-start;
                            flex-direction: column;
                            gap: 18px;
                        }

                        .questionnaire-title-row h1 {
                            font-size: 27px;
                        }
                    }
                `}</style>
            </div>
        );
    }

    // Analysis loading
    if (flowType === 'analyzing') {
        return (
            <LoadingAnalysis
                title={'Processing Your Responses'}
                description={`Our AI is analyzing your ${selectedIndustry} business responses to find the perfect monetization strategy...`}
                steps={<QuestionnaireAnalysisSteps industry={selectedIndustry} />}
            />
        );
    }

    // Generating recommendations screen
    if (flowType === 'generating') {
        return (
            <LoadingAnalysis
                title="Generating Strategy Recommendations"
                description={`Our AI is analyzing your ${selectedIndustry} business profile and generating personalized monetization strategies...`}
                steps={
                    <GeneratingRecommendationsSteps
                        analysisSource={analysisSource}
                        fileName={''}
                        industry={selectedIndustry}
                    />
                }
                progressValue={75}
            />
        );
    }

    return null;
}
export default function QuestionnairePage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'#060E1E',display:'flex',alignItems:'center',justifyContent:'center',color:'#00E5C0'}}>Loading…</div>}>
      <QuestionnairePageInner />
    </Suspense>
  )
}
