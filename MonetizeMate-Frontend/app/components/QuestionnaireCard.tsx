'use client';

import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { ArrowLeft, ArrowRight } from "lucide-react";

export interface GeneratedQuestion {
    id: string;
    title: string;
    description: string;
    options: { label: string; value: string }[];
}

interface QuestionnaireCardProps {
    question: GeneratedQuestion;
    questionNumber: number;
    estimatedTotal: number;
    currentAnswer: string;
    onAnswerChange: (value: string) => void;
    onNext: () => void;
    onSkip: () => void;
    onPrevious: () => void;
    canGoBack: boolean;
    selectedIndustry: string;
    isLastQuestion?: boolean;
}

const QuestionnaireCard: React.FC<QuestionnaireCardProps> = ({
    question,
    questionNumber,
    estimatedTotal,
    currentAnswer,
    onAnswerChange,
    onNext,
    onSkip,
    onPrevious,
    canGoBack,
    selectedIndustry,
    isLastQuestion = false,
}) => {
    const progress = Math.min((questionNumber / estimatedTotal) * 100, 95);
    const customPrefix = 'Custom: ';
    const customAnswer = currentAnswer.startsWith(customPrefix) ? currentAnswer.slice(customPrefix.length) : '';

    // The LLM sometimes generates its own "Other" option alongside our built-in
    // custom-answer option below — drop any such duplicates so only one "Other" shows.
    const isOtherLikeOption = (label: string) => /^other\b/i.test(label.trim()) || /please specify/i.test(label);
    const visibleOptions = question.options.filter((option) => !isOtherLikeOption(option.label));

    const [showOtherInput, setShowOtherInput] = useState(
        currentAnswer.startsWith(customPrefix) || (!!currentAnswer && isOtherLikeOption(currentAnswer))
    );
    const isOtherSelected = showOtherInput || currentAnswer.startsWith(customPrefix);

    useEffect(() => {
        setShowOtherInput(currentAnswer.startsWith(customPrefix) || (!!currentAnswer && isOtherLikeOption(currentAnswer)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question.id]);

    const handleCustomAnswerChange = (value: string) => {
        onAnswerChange(value.trim() ? `${customPrefix}${value}` : '');
    };

    const handleSelectOther = () => {
        setShowOtherInput(true);
        if (!currentAnswer.startsWith(customPrefix)) {
            onAnswerChange('');
        }
    };

    return (
        <Card className="p-8 rounded-2xl border shadow-lg">
            {/* Progress header */}
            <div className="mb-7">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-extrabold text-teal-500">
                        Question {questionNumber}
                    </span>
                    <Badge variant="outline" className="text-teal-600 border-teal-400 dark:text-teal-300 dark:border-teal-600 font-bold">
                        {selectedIndustry}
                    </Badge>
                </div>
                {/* Progress bar */}
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question text */}
            <h2 className="text-xl font-extrabold text-foreground mb-2 leading-snug">
                {question.title}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {question.description}
            </p>

            {/* Options */}
            <div className="grid gap-3 mb-5">
                {visibleOptions.map((option) => {
                    const isSelected = currentAnswer === option.value;
                    return (
                        <div
                            key={option.value}
                            onClick={() => {
                                setShowOtherInput(false);
                                onAnswerChange(option.value);
                            }}
                            className={[
                                'flex items-center gap-4 px-4 py-4 rounded-xl border cursor-pointer transition-all duration-150',
                                isSelected
                                    ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-500'
                                    : 'border-border bg-muted/40 hover:bg-muted hover:border-teal-300 dark:hover:border-teal-600',
                            ].join(' ')}
                        >
                            {/* Radio indicator */}
                            <div className={[
                                'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
                                isSelected
                                    ? 'border-teal-500 bg-teal-500'
                                    : 'border-muted-foreground/40',
                            ].join(' ')}>
                                {isSelected && (
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                            </div>
                            <span className={[
                                'text-sm leading-snug select-none',
                                isSelected
                                    ? 'font-bold text-teal-700 dark:text-teal-300'
                                    : 'font-medium text-foreground',
                            ].join(' ')}>
                                {option.label}
                            </span>
                        </div>
                    );
                })}

                {/* Other / custom answer */}
                <div
                    onClick={handleSelectOther}
                    className={[
                        'flex items-center gap-4 px-4 py-4 rounded-xl border cursor-pointer transition-all duration-150',
                        isOtherSelected
                            ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-500'
                            : 'border-border bg-muted/40 hover:bg-muted hover:border-teal-300 dark:hover:border-teal-600',
                    ].join(' ')}
                >
                    <div className={[
                        'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
                        isOtherSelected
                            ? 'border-teal-500 bg-teal-500'
                            : 'border-muted-foreground/40',
                    ].join(' ')}>
                        {isOtherSelected && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                    </div>
                    <span className={[
                        'text-sm leading-snug select-none',
                        isOtherSelected
                            ? 'font-bold text-teal-700 dark:text-teal-300'
                            : 'font-medium text-foreground',
                    ].join(' ')}>
                        Other (please specify)
                    </span>
                </div>
                {isOtherSelected && (
                    <Textarea
                        autoFocus
                        placeholder="Type your answer here..."
                        value={customAnswer}
                        onChange={(e) => handleCustomAnswerChange(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="min-h-[80px]"
                    />
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-4 pt-6 border-t border-border">
                <Button
                    variant="outline"
                    onClick={onPrevious}
                    disabled={!canGoBack}
                    className="min-w-[110px] h-11 font-bold"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onSkip}
                        className="min-w-[110px] h-11 font-bold border-teal-300 text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:border-teal-700 dark:hover:bg-teal-950/30"
                    >
                        Skip
                    </Button>
                    <Button
                        onClick={onNext}
                        disabled={!currentAnswer}
                        className="min-w-[160px] h-11 font-bold bg-teal-500 hover:bg-teal-400 text-white border-0"
                    >
                        {isLastQuestion ? 'Get Recommendations' : 'Next'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default QuestionnaireCard;
