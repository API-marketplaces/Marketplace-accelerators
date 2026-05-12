'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, CheckCircle, Milestone, Sparkles, Target, Zap } from 'lucide-react';
import { Progress } from '@/app/components/ui/progress';

interface Strategy {
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
}

const implementationPhases = [
    {
        name: "Phase 1: Planning & Setup",
        duration: "1-2 Weeks",
        tasks: [
            "Define key performance indicators (KPIs) for the new strategy.",
            "Configure pricing tiers and feature sets in your billing system.",
            "Prepare marketing materials and update documentation.",
            "Set up analytics to track the new model's performance.",
        ],
        icon: Target
    },
    {
        name: "Phase 2: Staged Rollout",
        duration: "2-4 Weeks",
        tasks: [
            "Launch the new pricing to a small segment of new customers (e.g., 10%).",
            "Monitor user feedback, support tickets, and conversion rates.",
            "A/B test different aspects of the pricing page or checkout flow.",
            "Iterate on messaging based on initial customer reactions.",
        ],
        icon: Milestone
    },
    {
        name: "Phase 3: Full Launch & Migration",
        duration: "1-2 Months",
        tasks: [
            "Roll out the new strategy to all new customers.",
            "Announce the new pricing to existing customers and provide a clear migration path.",
            "Offer incentives for early adoption of new plans.",
            "Handle customer support inquiries related to the changes.",
        ],
        icon: Zap
    },
    {
        name: "Phase 4: Optimization",
        duration: "Ongoing",
        tasks: [
            "Continuously analyze performance against KPIs.",
            "Gather long-term customer feedback and conduct surveys.",
            "Make data-driven adjustments to pricing and packaging.",
            "Explore add-ons and further monetization opportunities.",
        ],
        icon: Sparkles
    }
];

export default function ImplementationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [strategy, setStrategy] = useState<Strategy | null>(null);

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" onClick={() => router.back()} className="border-blue-300 text-blue-700 hover:bg-blue-50">
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

                <h2 className="text-2xl text-blue-900 mb-6">Implementation Phases</h2>
                <div className="space-y-6">
                    {implementationPhases.map((phase, index) => {
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
            </div>
        </div>
    );
}