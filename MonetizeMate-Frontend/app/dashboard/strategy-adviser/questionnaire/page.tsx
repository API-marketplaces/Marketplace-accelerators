'use client'

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { ArrowLeft, MessageSquare, AlertCircle, Loader2, Brain } from "lucide-react";
import LoadingAnalysis, { QuestionnaireAnalysisSteps, GeneratingRecommendationsSteps } from "../../../components/LoadingAnalysis";
import QuestionnaireCard, { GeneratedQuestion } from "../../../components/QuestionnaireCard";
import { useAuth } from "@/app/hooks/useAuth";

type FlowType = 'loading' | 'thinking' | 'question' | 'analyzing' | 'generating';

interface ConversationEntry {
    question: GeneratedQuestion;
    answer: string;
}

const ESTIMATED_TOTAL = 12;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function QuestionnairePageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { authenticated, loading } = useAuth();

    const selectedIndustry = searchParams.get('industry') || '';

    const [flowType, setFlowType] = useState<FlowType>('loading');
    const [history, setHistory] = useState<ConversationEntry[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<GeneratedQuestion | null>(null);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && authenticated === false) router.push('/login');
        if (!loading && !selectedIndustry) router.push('/dashboard/strategy-adviser');
    }, [authenticated, loading, selectedIndustry, router]);

    const fetchNextQuestion = useCallback(async (conversation: ConversationEntry[]) => {
        setFlowType(conversation.length === 0 ? 'loading' : 'thinking');
        setError(null);

        try {
            const [response] = await Promise.all([
                fetch('/api/questionnaire/next', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        industry: selectedIndustry,
                        question_number: conversation.length,
                        conversation: conversation.map(({ question, answer }) => ({
                            question_id: question.id,
                            question: question.title,
                            answer,
                        })),
                    }),
                }),
                wait(conversation.length === 0 ? 1200 : 600),
            ]);

            const data = await response.json().catch(() => ({ message: 'Question generation failed' }));
            if (!response.ok) {
                throw new Error(data.detail || data.message || 'Question generation failed');
            }

            if (data.completed) {
                await analyzeAnswers(conversation);
                return;
            }

            if (!data.question) throw new Error('No question returned from AI.');

            setCurrentQuestion(data.question);
            setCurrentAnswer('');
            setFlowType('question');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unable to generate question. Please try again.');
            setFlowType('question');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedIndustry]);

    const analyzeAnswers = async (conversation: ConversationEntry[]) => {
        setFlowType('analyzing');
        setError(null);

        const payload = {
            industry: selectedIndustry,
            answers: conversation.map(({ question, answer }) => ({
                question_id: question.id,
                question: question.title,
                answer,
            })),
        };

        try {
            await wait(900);
            setFlowType('generating');

            const [response] = await Promise.all([
                fetch('/api/monetization/recommend-llm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }),
                wait(1400),
            ]);

            const data = await response.json().catch(() => ({ message: 'Recommendation analysis failed' }));
            if (!response.ok) throw new Error(data.detail || data.message || 'Recommendation analysis failed');

            sessionStorage.setItem('recommendations_data', JSON.stringify(data));
            const params = new URLSearchParams();
            params.set('analysisSource', 'questionnaire-llm');
            params.set('selectedIndustry', selectedIndustry);
            router.push(`/dashboard/recommendation?${params.toString()}`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unable to generate recommendations.');
            setFlowType('question');
        }
    };

    useEffect(() => {
        if (loading || authenticated === false || !selectedIndustry) return;
        fetchNextQuestion([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, authenticated, selectedIndustry]);

    const handleNext = () => {
        if (!currentQuestion || !currentAnswer) return;
        const updatedHistory = [...history, { question: currentQuestion, answer: currentAnswer }];
        setHistory(updatedHistory);
        fetchNextQuestion(updatedHistory);
    };

    const handleSkip = () => {
        if (!currentQuestion) return;
        const updatedHistory = [...history, { question: currentQuestion, answer: 'Skipped by user' }];
        setHistory(updatedHistory);
        fetchNextQuestion(updatedHistory);
    };

    const handlePrevious = () => {
        if (history.length === 0) return;
        const prev = history[history.length - 1];
        setHistory(h => h.slice(0, -1));
        setCurrentQuestion(prev.question);
        setCurrentAnswer(prev.answer);
        setFlowType('question');
    };

    const questionNumber = history.length + 1;

    if (loading || flowType === 'loading') {
        return (
            <LoadingAnalysis
                title="Preparing Your Assessment"
                description={`AI is generating the first question tailored to the ${selectedIndustry || 'your'} industry...`}
                steps={<QuestionnaireAnalysisSteps industry={selectedIndustry || 'your industry'} />}
            />
        );
    }

    if (flowType === 'analyzing') {
        return (
            <LoadingAnalysis
                title="Processing Your Responses"
                description={`Monetize Mate is analyzing your ${selectedIndustry} business responses...`}
                steps={<QuestionnaireAnalysisSteps industry={selectedIndustry} />}
            />
        );
    }

    if (flowType === 'generating') {
        return (
            <LoadingAnalysis
                title="Generating Strategy Recommendations"
                description={`Monetize Mate is turning your ${selectedIndustry} answers into ranked monetization recommendations...`}
                steps={
                    <GeneratingRecommendationsSteps
                        analysisSource="manual"
                        fileName=""
                        industry={selectedIndustry}
                    />
                }
                progressValue={75}
            />
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 px-6 font-sans">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-5 mb-8">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/dashboard/strategy-adviser')}
                        className="h-10 font-bold flex-shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div className="flex items-center gap-4">
                        <span className="w-11 h-11 rounded-full border-2 border-teal-500 flex items-center justify-center text-teal-500 flex-shrink-0">
                            <MessageSquare className="w-5 h-5" />
                        </span>
                        <div>
                            <h1 className="text-2xl font-extrabold text-foreground leading-tight">Business Assessment</h1>
                            <p className="text-sm text-muted-foreground">Industry: {selectedIndustry}</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-5">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between gap-4">
                            <span>{error}</span>
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-shrink-0 h-7 text-xs border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => fetchNextQuestion(history)}
                            >
                                Retry
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {flowType === 'thinking' ? (
                    <Card className="p-8 rounded-2xl border shadow-lg">
                        <div className="flex items-center gap-5">
                            <Brain className="w-8 h-8 text-teal-500 flex-shrink-0 animate-pulse" />
                            <div className="flex-1">
                                <p className="font-bold text-foreground text-base mb-1">AI is analyzing your answer…</p>
                                <p className="text-sm text-muted-foreground">Preparing the next adaptive question based on your responses</p>
                            </div>
                            <Loader2 className="w-5 h-5 text-teal-500 animate-spin flex-shrink-0" />
                        </div>
                        <div className="flex gap-2 mt-6 justify-center">
                            {[0, 1, 2].map(i => (
                                <div
                                    key={i}
                                    className="w-2 h-2 rounded-full bg-teal-400"
                                    style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                                />
                            ))}
                        </div>
                        <style>{`
                            @keyframes bounce {
                                0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                                40% { transform: scale(1); opacity: 1; }
                            }
                        `}</style>
                    </Card>
                ) : currentQuestion ? (
                    <QuestionnaireCard
                        question={currentQuestion}
                        questionNumber={questionNumber}
                        estimatedTotal={ESTIMATED_TOTAL}
                        currentAnswer={currentAnswer}
                        onAnswerChange={setCurrentAnswer}
                        onNext={handleNext}
                        onSkip={handleSkip}
                        onPrevious={handlePrevious}
                        canGoBack={history.length > 0}
                        selectedIndustry={selectedIndustry}
                    />
                ) : (
                    <Card className="p-8 rounded-2xl text-center border">
                        <p className="text-muted-foreground mb-4">Could not load question.</p>
                        <Button onClick={() => fetchNextQuestion(history)}>Try Again</Button>
                    </Card>
                )}
            </div>
        </div>
    );
}

export default function QuestionnairePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
        }>
            <QuestionnairePageInner />
        </Suspense>
    );
}

