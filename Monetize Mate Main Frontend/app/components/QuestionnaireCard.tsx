'use client';

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ANSWER_OPTIONS, QUESTIONNAIRE_QUESTIONS } from '../constants/strategy-constants';
import { QuestionnaireAnswers } from "../types/QuestionnaireAnswers";

interface QuestionnaireCardProps {
    currentStep: number;
    setCurrentStep: (step: number | ((prev: number) => number)) => void;
    answers: Partial<QuestionnaireAnswers>;
    setAnswers: (answers: Partial<QuestionnaireAnswers> | ((prev: Partial<QuestionnaireAnswers>) => Partial<QuestionnaireAnswers>)) => void;
    direction: 'forward' | 'backward';
    setDirection: (direction: 'forward' | 'backward') => void;
    selectedIndustry: string;
    handleNext: () => void;
}

const QuestionnaireCard: React.FC<QuestionnaireCardProps> = ({
    currentStep,
    setCurrentStep,
    answers,
    setAnswers,
    direction,
    setDirection,
    selectedIndustry,
    handleNext
}) => {
    const progress = ((currentStep + 1) / QUESTIONNAIRE_QUESTIONS.length) * 100;
    const currentQuestion = QUESTIONNAIRE_QUESTIONS[currentStep];
    const currentAnswer = answers[currentQuestion?.id as keyof QuestionnaireAnswers];
    const valueToShow = direction === 'forward' ? undefined : currentAnswer?.toString();

    return (
        <Card className="p-8 bg-white/80 backdrop-blur-sm border-blue-200">
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-blue-600">Question {currentStep + 1} of {QUESTIONNAIRE_QUESTIONS.length}</span>
                    <Badge variant="outline" className="text-blue-600 border-blue-300">{selectedIndustry}</Badge>
                </div>
                <Progress value={progress} className="h-2 bg-blue-100" />
            </div>

            <div className="mb-8">
                <h2 className="text-xl text-blue-900 mb-4">{currentQuestion.title}</h2>
                <p className="text-blue-600 mb-8">{currentQuestion.description}</p>

                <RadioGroup value={valueToShow} onValueChange={(value: any) => {
                    setAnswers(prev => ({ ...prev, [currentQuestion.id]: parseInt(value) }));
                    setDirection('backward');
                }}>
                    <div className="space-y-4">
                        {ANSWER_OPTIONS.map((option) => (
                            <div key={option.value} className="flex items-center space-x-3 p-4 bg-blue-50/50 rounded-lg hover:bg-blue-50 transition-colors">
                                <RadioGroupItem value={option.value.toString()} id={`${currentQuestion.id}-${option.value}`} />
                                <Label htmlFor={`${currentQuestion.id}-${option.value}`} className="flex-grow cursor-pointer text-blue-900">
                                    {option.text}
                                </Label>
                            </div>
                        ))}
                    </div>
                </RadioGroup>
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={() => { setDirection('backward'); setCurrentStep(prev => prev - 1); }} disabled={currentStep === 0} className="border-blue-300 text-blue-700 hover:bg-blue-50">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                <Button onClick={handleNext} disabled={valueToShow === undefined} className="bg-blue-600 hover:bg-blue-700">
                    {currentStep === QUESTIONNAIRE_QUESTIONS.length - 1 ? 'Get Recommendations' : 'Next'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </Card>
    );
};

export default QuestionnaireCard;