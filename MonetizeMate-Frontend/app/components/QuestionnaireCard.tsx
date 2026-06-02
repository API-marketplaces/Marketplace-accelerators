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
    setDirection,
    selectedIndustry,
    handleNext
}) => {
    const progress = ((currentStep + 1) / QUESTIONNAIRE_QUESTIONS.length) * 100;
    const currentQuestion = QUESTIONNAIRE_QUESTIONS[currentStep];
    const currentAnswer = answers[currentQuestion?.id as keyof QuestionnaireAnswers];
    const valueToShow = currentAnswer === undefined ? '' : currentAnswer.toString();

    return (
        <Card className="questionnaire-card">
            <div className="questionnaire-progress">
                <div className="questionnaire-meta">
                    <span>Question {currentStep + 1} of {QUESTIONNAIRE_QUESTIONS.length}</span>
                    <Badge variant="outline" className="questionnaire-badge">{selectedIndustry}</Badge>
                </div>
                <Progress value={progress} className="questionnaire-progress-bar" />
            </div>

            <div className="questionnaire-body">
                <h2>{currentQuestion.title}</h2>
                <p>{currentQuestion.description}</p>

                <RadioGroup key={currentQuestion.id} value={valueToShow} onValueChange={(value: string) => {
                    setAnswers(prev => ({ ...prev, [currentQuestion.id]: parseInt(value) }));
                    setDirection('backward');
                }}>
                    <div className="questionnaire-options">
                        {ANSWER_OPTIONS.map((option) => (
                            <div key={option.value} className="questionnaire-option" data-selected={valueToShow === option.value.toString()}>
                                <RadioGroupItem value={option.value.toString()} id={`${currentQuestion.id}-${option.value}`} className="questionnaire-radio" />
                                <Label htmlFor={`${currentQuestion.id}-${option.value}`} className="questionnaire-label">
                                    {option.text}
                                </Label>
                            </div>
                        ))}
                    </div>
                </RadioGroup>
            </div>

            <div className="questionnaire-actions">
                <Button variant="outline" onClick={() => { setDirection('backward'); setCurrentStep(prev => prev - 1); }} disabled={currentStep === 0} className="questionnaire-secondary">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                <Button onClick={handleNext} disabled={!valueToShow} className="questionnaire-primary">
                    {currentStep === QUESTIONNAIRE_QUESTIONS.length - 1 ? 'Get Recommendations' : 'Next'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
            <style>{`
                .questionnaire-card {
                    padding: 32px;
                    border-radius: 18px;
                    border: 1px solid rgba(0, 229, 192, 0.22);
                    background: rgba(17, 34, 54, 0.92);
                    box-shadow:
                        0 28px 80px rgba(0, 0, 0, 0.28),
                        inset 0 1px 0 rgba(255, 255, 255, 0.06);
                    color: #ffffff;
                }

                .questionnaire-progress {
                    margin-bottom: 30px;
                }

                .questionnaire-meta {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    margin-bottom: 12px;
                }

                .questionnaire-meta > span {
                    color: #00e5c0;
                    font-size: 13px;
                    font-weight: 900;
                }

                .questionnaire-badge {
                    border-color: rgba(143, 252, 240, 0.68);
                    background: rgba(0, 229, 192, 0.12);
                    color: #8ffcf0;
                    font-weight: 800;
                }

                .questionnaire-progress-bar {
                    height: 8px;
                    overflow: hidden;
                    background: rgba(0, 0, 0, 0.28);
                }

                .questionnaire-progress-bar [data-slot="progress-indicator"] {
                    background: linear-gradient(135deg, #00e5c0, #38e6d0);
                }

                .questionnaire-body h2 {
                    margin: 0 0 14px;
                    color: #ffffff;
                    font-size: 22px;
                    line-height: 1.35;
                    font-weight: 800;
                }

                .questionnaire-body > p {
                    margin: 0 0 26px;
                    color: #00e5c0;
                    font-size: 15px;
                    line-height: 1.6;
                    font-weight: 700;
                }

                .questionnaire-options {
                    display: grid;
                    gap: 12px;
                }

                .questionnaire-option {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    min-height: 56px;
                    padding: 14px 16px;
                    border-radius: 12px;
                    border: 1px solid rgba(143, 252, 240, 0.16);
                    background: rgba(31, 47, 68, 0.7);
                    transition: background 160ms ease, border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
                }

                .questionnaire-option:hover {
                    border-color: rgba(143, 252, 240, 0.38);
                    background: rgba(36, 55, 79, 0.98);
                }

                .questionnaire-option[data-selected="true"] {
                    border-color: #8ffcf0;
                    background: linear-gradient(135deg, rgba(0, 229, 192, 0.26), rgba(17, 211, 186, 0.14));
                    box-shadow: 0 0 0 3px rgba(143, 252, 240, 0.12);
                }

                .questionnaire-radio {
                    border-color: rgba(255, 255, 255, 0.72);
                    color: #00e5c0;
                }

                .questionnaire-option[data-selected="true"] .questionnaire-radio {
                    border-color: #8ffcf0;
                    background: #00e5c0;
                    color: #061421;
                }

                .questionnaire-label {
                    flex: 1;
                    cursor: pointer;
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 15px;
                    font-weight: 800;
                }

                .questionnaire-option[data-selected="true"] .questionnaire-label {
                    color: #ffffff;
                }

                .questionnaire-actions {
                    display: flex;
                    justify-content: space-between;
                    gap: 16px;
                    margin-top: 30px;
                    padding-top: 24px;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                }

                .questionnaire-secondary,
                .questionnaire-primary {
                    min-width: 124px;
                    height: 44px;
                    border-radius: 10px;
                    font-weight: 900;
                }

                .questionnaire-secondary {
                    border-color: rgba(0, 229, 192, 0.34);
                    background: rgba(0, 229, 192, 0.1);
                    color: #8ffcf0;
                }

                .questionnaire-secondary:hover {
                    background: rgba(0, 229, 192, 0.18);
                    color: #ffffff;
                }

                .questionnaire-primary {
                    background: #11d3ba;
                    color: #061421;
                }

                .questionnaire-primary:hover {
                    background: #38e6d0;
                    color: #061421;
                }

                @media (max-width: 640px) {
                    .questionnaire-card {
                        padding: 22px;
                    }

                    .questionnaire-meta,
                    .questionnaire-actions {
                        align-items: stretch;
                        flex-direction: column;
                    }

                    .questionnaire-secondary,
                    .questionnaire-primary {
                        width: 100%;
                    }
                }
            `}</style>
        </Card>
    );
};

export default QuestionnaireCard;
