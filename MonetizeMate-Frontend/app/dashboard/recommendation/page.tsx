'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Sparkles, Rocket, CheckCircle, AlertCircle, Star, MessageCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { calculateRecommendations } from '@/app/constants/strategy-helpers';
import { QuestionnaireAnswers } from '@/app/types/QuestionnaireAnswers';

type IconName = keyof typeof LucideIcons;

interface Recommendation {
    id: string;
    name: string;
    description: string;
    timeframe: string;
    expectedRevenue: string;
    implementation: string;
    pros: string[];
    cons: string[];
    reasoning: string;
    score: number;
    icon: IconName;
    color: string;
    bgColor: string;
}

function RecommendationsPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const recommendationState = useMemo(() => {
        const recommendationsData = searchParams.get('recommendations');
        const answersData = searchParams.get('answers');
        const source = searchParams.get('analysisSource');
        const industry = searchParams.get('selectedIndustry');

        if (recommendationsData) {
            try {
                const parsed = JSON.parse(recommendationsData);
                const aiRecommendations = Array.isArray(parsed)
                    ? parsed
                    : Array.isArray(parsed.recommendations)
                        ? parsed.recommendations
                        : [];

                if (!aiRecommendations.length) {
                    throw new Error('No AI recommendations found');
                }

                return {
                    recommendations: aiRecommendations as Recommendation[],
                    analysisSource: parsed.analysisSource || source || 'ai-chat',
                    selectedIndustry: parsed.selectedIndustry || industry || '',
                    invalid: false,
                };
            } catch (error) {
                console.error("Failed to parse AI recommendations", error);
                return { recommendations: [], analysisSource: '', selectedIndustry: '', invalid: true };
            }
        } else if (answersData && source && industry) {
            try {
                const answers: Partial<QuestionnaireAnswers> = JSON.parse(answersData);
                const calculatedRecommendations = calculateRecommendations(answers, industry);
                return {
                    recommendations: calculatedRecommendations as Recommendation[],
                    analysisSource: source,
                    selectedIndustry: industry || '',
                    invalid: false,
                };
            } catch (error) {
                console.error("Failed to parse data or calculate recommendations", error);
                return { recommendations: [], analysisSource: '', selectedIndustry: '', invalid: true };
            }
        }

        return { recommendations: [], analysisSource: '', selectedIndustry: '', invalid: true };
    }, [searchParams]);

    useEffect(() => {
        if (recommendationState.invalid) {
            router.push('/dashboard/strategy-adviser');
        }
    }, [recommendationState.invalid, router]);

    const { recommendations, analysisSource, selectedIndustry } = recommendationState;

    const onStartImplementation = (strategy: Recommendation) => {
        const params = new URLSearchParams();
        params.set('strategy', JSON.stringify(strategy));
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
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" onClick={() => router.push('/dashboard/strategy-adviser')} className="border-blue-300 text-blue-700 hover:bg-blue-50">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Start Over
                    </Button>
                    {analysisSource === 'ai-chat' && (
                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard/strategy-adviser/ai-chat?resume=1')}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
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
                                            <Badge variant="outline" className={`${strategy.color} border-current`}>
                                                {strategy.score}% match
                                            </Badge>
                                            {index === 0 && (
                                                <Badge className="bg-blue-600 text-white">
                                                    <Star className="w-3 h-3 mr-1" />
                                                    Recommended
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-blue-700 mb-4">{strategy.description}</p>

                                        {strategy.reasoning && (
                                            <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                                <h4 className="text-blue-900 text-sm mb-2">💡 Why We Recommend This</h4>
                                                <p className="text-blue-700 text-sm">{strategy.reasoning}</p>
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
                                            <div className="flex items-center">
                                                <Button onClick={() => onStartImplementation(strategy)} className="bg-blue-600 hover:bg-blue-700 w-full">
                                                    <Rocket className="w-4 h-4 mr-2" />
                                                    Start Implementation
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-green-700 text-sm mb-2 flex items-center"><CheckCircle className="w-4 h-4 mr-1" />Pros</h4>
                                                <ul className="text-green-600 text-sm space-y-1">
                                                    {strategy.pros.map((pro: string, idx: number) => (<li key={idx}>• {pro}</li>))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="text-orange-700 text-sm mb-2 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />Considerations</h4>
                                                <ul className="text-orange-600 text-sm space-y-1">
                                                    {strategy.cons.map((con: string, idx: number) => (<li key={idx}>• {con}</li>))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                <div className="mt-8 text-center">
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
                        <Sparkles className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                        <h3 className="text-xl text-blue-900 mb-2">Ready to Implement?</h3>
                        <p className="text-blue-700 mb-4">Each recommendation includes a comprehensive implementation guide with step-by-step phases, progress tracking, and resource support to help you succeed.</p>
                        <Button onClick={() => onStartImplementation(recommendations[0])} className="bg-blue-600 hover:bg-blue-700">
                            <Rocket className="w-4 h-4 mr-2" />
                            Start with Top Recommendation
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default function RecommendationsPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'#060E1E',display:'flex',alignItems:'center',justifyContent:'center',color:'#00E5C0'}}>Loading…</div>}>
      <RecommendationsPageInner />
    </Suspense>
  )
}
