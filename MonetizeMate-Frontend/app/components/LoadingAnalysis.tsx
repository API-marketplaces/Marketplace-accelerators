'use client';

import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

interface LoadingAnalysisProps {
    title: string;
    description: string;
    steps: React.ReactNode;
    progressValue?: number;
}

const LoadingAnalysis: React.FC<LoadingAnalysisProps> = ({ title, description, steps }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
            <Card className="p-12 max-w-md text-center bg-white/80 backdrop-blur-sm border-blue-200">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                <h2 className="text-xl text-blue-900 mb-4">{title}</h2>
                <p className="text-blue-600 mb-6">{description}</p>
                <div className="space-y-2 text-sm text-blue-500 text-left">
                    {steps}
                </div>
                <div className="mt-6">
                    <Progress value={75} className="h-2" />
                    <p className="text-xs text-blue-500 mt-2">
                        {title.includes("Generating") ? "Generation" : "Analysis"} Progress: 75%
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default LoadingAnalysis;

export const FileAnalysisSteps = ({ fileName }: { fileName: string }) => (
    <>
        <p>✓ Processing {fileName}</p>
        <p>✓ Identifying business patterns</p>
        <p>✓ Deriving monetization insights</p>
        <p>⏳ Generating recommendations</p>
    </>
);

export const QuestionnaireAnalysisSteps = ({ industry }: { industry: string }) => (
    <>
        <p>✓ Analyzing {industry} industry factors</p>
        <p>✓ Processing questionnaire responses</p>
        <p>✓ Calculating strategy fit scores</p>
        <p>⏳ Generating personalized recommendations</p>
    </>
);

export const GeneratingRecommendationsSteps = ({ analysisSource, fileName, industry }: { analysisSource: 'file' | 'manual', fileName: string, industry: string }) => (
    <>
        <p>✓ {analysisSource === 'file' ? `Processing ${fileName}` : `Analyzing ${industry} questionnaire responses`}</p>
        <p>✓ Evaluating business characteristics and market fit</p>
        <p>✓ Calculating strategy compatibility scores</p>
        <p>⏳ Generating detailed implementation plans</p>
        <p className="opacity-50">⏳ Creating recommendation reasoning</p>
        <p className="opacity-50">⏳ Finalizing strategy rankings</p>
    </>
);
