'use client'

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "../../../components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { QuestionnaireAnswers } from '../../../types/QuestionnaireAnswers';
import { INDUSTRIES, QUESTIONNAIRE_QUESTIONS } from '../../../constants/strategy-constants';
import LoadingAnalysis, { QuestionnaireAnalysisSteps, GeneratingRecommendationsSteps } from "../../../components/LoadingAnalysis";
import QuestionnaireCard from "../../../components/QuestionnaireCard";
import { useAuth } from "@/app/hooks/useAuth";

type QuestionnaireFlowType = 'questionnaire' | 'analyzing' | 'generating';

export default function QuestionnairePage() {
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
    }, [authenticated, loading, router]);

    const [flowType, setFlowType] = useState<QuestionnaireFlowType>('questionnaire');
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>({});
    const [analysisSource, setAnalysisSource] = useState<'file' | 'manual'>('manual');
    const [selectedIndustry, setSelectedIndustry] = useState<string>(industryFromQuery);
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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="outline" onClick={() => router.push('/dashboard/strategy-adviser')} className="border-blue-300 text-blue-700 hover:bg-blue-50">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Options
                        </Button>
                        <div className="flex-grow">
                            <div className="flex items-center gap-4">
                                <MessageSquare className="w-8 h-8 text-blue-600" />
                                <div>
                                    <h1 className="text-2xl text-blue-900">Business Assessment</h1>
                                    <p className="text-blue-700">Industry: {selectedIndustry}</p>
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