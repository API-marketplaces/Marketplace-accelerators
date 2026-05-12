'use client'

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Compass, Upload, MessageSquare, FileText, Sparkles } from "lucide-react";
import IndustrySelectionDialog from '@/app/components/IndustrySelectionDialog';
import { useAuth } from "@/app/hooks/useAuth";

export default function StrategyAdviserPage() {
    const router = useRouter();
    const { authenticated, loading } = useAuth();
    useEffect(() => {
        if (!loading && authenticated === false) {
            router.push('/login');
        }
    }, [authenticated, loading, router]);

    const [analysisSource, setAnalysisSource] = useState<'file' | 'manual'>('manual');
    const [showIndustryDialog, setShowIndustryDialog] = useState(false);
    const [selectedFlow, setSelectedFlow] = useState<'file-upload' | 'questionnaire' | null>(null);

    const onBack = () => router.push('/');

    // Initial choice screen
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" onClick={onBack} className="border-blue-300 text-blue-700 hover:bg-blue-50">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                    <div className="flex-grow">
                        <div className="flex items-center gap-4">
                            <Compass className="w-8 h-8 text-blue-600" />
                            <div>
                                <h1 className="text-2xl text-blue-900">Monetization Strategy Advisor</h1>
                                <p className="text-blue-700">Choose how you'd like to get personalized recommendations</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* File Upload Option */}
                    <Card className="p-8 bg-white/80 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => {
                        setAnalysisSource('file');
                        setSelectedFlow('file-upload');
                        setShowIndustryDialog(true);
                    }}>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                                <Upload className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl text-blue-900 mb-4">Upload Business Data</h3>
                            <p className="text-blue-600 mb-6 leading-relaxed">
                                Upload your business data file and let our AI automatically analyze it to generate personalized recommendations.
                                No questionnaire needed!
                            </p>

                            <div className="bg-blue-50 p-4 rounded-lg mb-6">
                                <h4 className="text-blue-900 text-sm mb-2">✨ AI-Powered Analysis</h4>
                                <ul className="text-xs text-blue-700 space-y-1 text-left">
                                    <li>• Automatically detects business patterns</li>
                                    <li>• Analyzes revenue and usage data</li>
                                    <li>• Derives optimal monetization strategies</li>
                                    <li>• No manual input required</li>
                                </ul>
                            </div>

                            <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                <Upload className="w-4 h-4 mr-2" />
                                Choose File Upload
                            </Button>
                        </div>
                    </Card>

                    {/* Manual Entry Option */}
                    <Card className="p-8 bg-white/80 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => {
                        setAnalysisSource('manual');
                        setSelectedFlow('questionnaire');
                        setShowIndustryDialog(true);
                    }}>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                                <MessageSquare className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl text-blue-900 mb-4">Answer Questionnaire</h3>
                            <p className="text-blue-600 mb-6 leading-relaxed">
                                Answer a comprehensive questionnaire about your business to receive tailored monetization strategy recommendations.
                            </p>

                            <div className="bg-green-50 p-4 rounded-lg mb-6">
                                <h4 className="text-green-900 text-sm mb-2">🎯 Personalized Assessment</h4>
                                <ul className="text-xs text-green-700 space-y-1 text-left">
                                    <li>• Industry selection + 10 targeted questions</li>
                                    <li>• Covers all key business aspects</li>
                                    <li>• Detailed strategy explanations with reasoning</li>
                                    <li>• Implementation guidance</li>
                                </ul>
                            </div>

                            <Button className="w-full bg-green-600 hover:bg-green-700">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Answer Questions
                            </Button>
                        </div>
                    </Card>
                </div>

                <IndustrySelectionDialog
                    open={showIndustryDialog}
                    onOpenChange={setShowIndustryDialog}
                    onContinue={(industry) => {
                        setShowIndustryDialog(false);
                        if (selectedFlow === 'file-upload') {
                            router.push(`/dashboard/upload?industry=${encodeURIComponent(industry)}&source=file&from=strategy-adviser&decisionMetrics=strategy`);
                        } else if (selectedFlow === 'questionnaire') {
                            router.push(`/dashboard/strategy-adviser/questionnaire?industry=${encodeURIComponent(industry)}`);
                        }
                    }}
                />

                <div className="mt-12 text-center">
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
                        <Sparkles className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                        <h3 className="text-xl text-blue-900 mb-2">Both Methods Lead to Success</h3>
                        <p className="text-blue-700">
                            Whether you upload your data or answer questions manually, you'll receive the same high-quality,
                            personalized monetization recommendations tailored to your specific business needs.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return null;
}