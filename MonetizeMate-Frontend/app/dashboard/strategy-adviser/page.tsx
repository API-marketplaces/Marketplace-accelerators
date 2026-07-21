'use client'

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Bot, BriefcaseBusiness, Compass, MessageSquare, Sparkles } from "lucide-react";
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

    const [showIndustryDialog, setShowIndustryDialog] = useState(false);

    const onBack = () => router.push('/');

    return (
        <div className="strategy-page">
            <div className="strategy-shell">
                <div className="strategy-header">
                    <Button variant="outline" onClick={onBack} className="strategy-back">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                    <div className="strategy-title-row">
                        <span className="strategy-title-icon">
                            <Compass className="w-7 h-7" />
                        </span>
                        <div>
                            <h1>Monetization Strategy Advisor</h1>
                            <p>Choose how you&apos;d like to get personalized recommendations</p>
                        </div>
                    </div>
                </div>

                <div className="strategy-grid">
                    <Card className="strategy-option strategy-option-disabled" aria-disabled="true">
                        <span className="strategy-coming-soon">Coming Soon</span>
                        <div className="strategy-option-body">
                            <span className="strategy-option-icon">
                                <BriefcaseBusiness className="w-8 h-8" />
                            </span>
                            <h3>Business Data</h3>
                            <p>
                                Build a categorized business profile — saved and reusable — to generate personalized monetization recommendations.
                            </p>

                            <div className="strategy-info">
                                <h4>Business Profile Builder</h4>
                                <ul>
                                    <li>Business Model, Customers, APIs sections</li>
                                    <li>Revenue, Technology, and Objectives sections</li>
                                    <li>Save and reuse profiles across assessments</li>
                                    <li>Strategic API importance</li>
                                </ul>
                            </div>

                            <Button className="strategy-option-button" disabled>
                                <BriefcaseBusiness className="w-4 h-4 mr-2" />
                                Enter Business Data
                            </Button>
                        </div>
                    </Card>

                    <Card className="strategy-option strategy-option-disabled" aria-disabled="true">
                        <span className="strategy-coming-soon">Coming Soon</span>
                        <div className="strategy-option-body">
                            <span className="strategy-option-icon strategy-option-icon-chat">
                                <Bot className="w-8 h-8" />
                            </span>
                            <h3>AI Chat Advisor</h3>
                            <p>
                                Fine-tuned question discovery for conversational monetization recommendations.
                            </p>

                            <div className="strategy-info">
                                <h4>Chatbot Discovery</h4>
                                <ul>
                                    <li>Natural conversation instead of forms</li>
                                    <li>Sequential follow-up questions</li>
                                    <li>Strategy recommendations from dialogue</li>
                                    <li>Recommendation handoff to implementation</li>
                                </ul>
                            </div>

                            <Button className="strategy-option-button" disabled>
                                <Bot className="w-4 h-4 mr-2" />
                                Chat with AI
                            </Button>
                        </div>
                    </Card>

                    <Card
                        className="strategy-option strategy-option-wide"
                        onClick={() => setShowIndustryDialog(true)}
                    >
                        <div className="strategy-option-body">
                            <span className="strategy-option-icon strategy-option-icon-soft">
                                <MessageSquare className="w-8 h-8" />
                            </span>
                            <h3>Answer Questionnaire</h3>
                            <p>
                                Answer a comprehensive questionnaire about your business to receive tailored monetization strategy recommendations.
                            </p>

                            <div className="strategy-info">
                                <h4>Personalized Assessment</h4>
                                <ul>
                                    <li>Industry selection + 10 targeted questions</li>
                                    <li>Covers all key business aspects</li>
                                    <li>Detailed strategy explanations with reasoning</li>
                                    <li>Implementation guidance</li>
                                </ul>
                            </div>

                            <Button className="strategy-option-button">
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
                        router.push(`/dashboard/strategy-adviser/questionnaire?industry=${encodeURIComponent(industry)}`);
                    }}
                />

                <div className="strategy-success">
                    <Sparkles className="w-8 h-8" />
                    <h3>Every Path Leads to Success</h3>
                    <p>
                        Whether you chat with AI, enter business data, or answer questions manually, you&apos;ll receive high-quality,
                        personalized monetization recommendations tailored to your specific business needs.
                    </p>
                </div>
            </div>
            <style>{`
                .strategy-page {
                    min-height: 100vh;
                    padding: 40px 32px 72px;
                    background:
                        radial-gradient(circle at 18% 0%, rgba(0, 229, 192, 0.14), transparent 34%),
                        linear-gradient(135deg, #060e1e 0%, #0b1f36 52%, #071420 100%);
                    color: #ffffff;
                    font-family: 'DM Sans', system-ui, sans-serif;
                }

                .strategy-shell {
                    width: min(1280px, 100%);
                    margin: 0 auto;
                }

                .strategy-header {
                    display: flex;
                    align-items: center;
                    gap: 32px;
                    margin-bottom: 44px;
                }

                .strategy-back {
                    height: 44px;
                    border: 1px solid rgba(0, 229, 192, 0.44);
                    background: #11d3ba;
                    color: #061421;
                    font-weight: 800;
                    box-shadow: 0 10px 24px rgba(0, 229, 192, 0.16);
                }

                .strategy-back:hover {
                    background: #38e6d0;
                    color: #061421;
                }

                .strategy-title-row {
                    display: flex;
                    align-items: center;
                    gap: 22px;
                }

                .strategy-title-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    border: 3px solid #00e5c0;
                    color: #00e5c0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex: 0 0 auto;
                }

                .strategy-title-row h1 {
                    margin: 0;
                    color: #ffffff;
                    font-size: 32px;
                    line-height: 1.2;
                    font-weight: 800;
                }

                .strategy-title-row p {
                    margin: 4px 0 0;
                    color: rgba(255, 255, 255, 0.72);
                    font-size: 17px;
                }

                .strategy-grid {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(320px, 1fr));
                    gap: 34px;
                }

                .strategy-option {
                    position: relative;
                    min-height: 500px;
                    padding: 38px 34px 32px;
                    border-radius: 12px;
                    border: 1px solid rgba(0, 229, 192, 0.22);
                    background: rgba(17, 34, 54, 0.88) !important;
                    box-shadow:
                        0 28px 80px rgba(0, 0, 0, 0.28),
                        inset 0 1px 0 rgba(255, 255, 255, 0.06);
                    cursor: pointer;
                    transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
                }

                .strategy-option:hover {
                    transform: translateY(-4px);
                    border-color: rgba(143, 252, 240, 0.48);
                    box-shadow: 0 30px 86px rgba(0, 229, 192, 0.15);
                }

                .strategy-option-disabled {
                    opacity: 0.45;
                    cursor: not-allowed;
                    pointer-events: none;
                    filter: grayscale(0.3);
                }

                .strategy-option-disabled:hover {
                    transform: none;
                    border-color: rgba(0, 229, 192, 0.22);
                    box-shadow:
                        0 28px 80px rgba(0, 0, 0, 0.28),
                        inset 0 1px 0 rgba(255, 255, 255, 0.06);
                }

                .strategy-coming-soon {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    padding: 5px 12px;
                    border-radius: 999px;
                    border: 1px solid rgba(255, 255, 255, 0.28);
                    background: rgba(0, 0, 0, 0.35);
                    color: #ffffff;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 0.02em;
                    text-transform: uppercase;
                }

                .strategy-option-body {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 22px;
                }

                .strategy-option-icon {
                    width: 76px;
                    height: 76px;
                    border-radius: 18px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    color: #00e5c0;
                    background: rgba(0, 229, 192, 0.12);
                    border: 1px solid rgba(0, 229, 192, 0.22);
                }

                .strategy-option-icon-soft {
                    background: rgba(220, 252, 231, 0.9);
                    color: #047857;
                }

                .strategy-option-icon-chat {
                    background: rgba(0, 229, 192, 0.14);
                    color: #00e5c0;
                }

                .strategy-option h3 {
                    margin: 2px 0 0;
                    color: #ffffff;
                    font-size: 24px;
                    line-height: 1.2;
                    font-weight: 800;
                }

                .strategy-option p {
                    margin: 0;
                    max-width: 360px;
                    color: #00e5c0;
                    font-size: 16px;
                    line-height: 1.65;
                    font-weight: 700;
                }

                .strategy-info {
                    width: 100%;
                    margin-top: 4px;
                    padding: 26px 0 0;
                    border-top: 1px solid rgba(0, 229, 192, 0.22);
                    background: transparent;
                    text-align: left;
                }

                .strategy-info h4 {
                    margin: 0 0 14px;
                    color: #ffffff;
                    font-size: 15px;
                    font-weight: 800;
                    text-align: center;
                }

                .strategy-info ul {
                    margin: 0;
                    padding: 0;
                    list-style: none;
                    display: grid;
                    gap: 14px;
                }

                .strategy-info li {
                    display: grid;
                    grid-template-columns: 8px 1fr;
                    align-items: start;
                    gap: 12px;
                    color: rgba(255, 255, 255, 0.78);
                    font-size: 14px;
                    line-height: 1.45;
                    font-weight: 700;
                }

                .strategy-info li::before {
                    content: '';
                    width: 7px;
                    height: 7px;
                    margin-top: 7px;
                    border-radius: 50%;
                    background: #00e5c0;
                }

                .strategy-option-button {
                    width: 100%;
                    height: 52px;
                    margin-top: auto;
                    border-radius: 10px;
                    border: 1px solid rgba(0, 229, 192, 0.34);
                    background: rgba(0, 229, 192, 0.14);
                    color: #ffffff;
                    font-weight: 900;
                    gap: 6px;
                }

                .strategy-option-button:hover {
                    background: #38e6d0;
                    color: #061421;
                }

                .strategy-new-pill {
                    margin-left: auto;
                    padding: 3px 9px;
                    border-radius: 999px;
                    border: 1px solid rgba(6, 20, 33, 0.22);
                    font-size: 11px;
                    line-height: 1.2;
                }

                .strategy-success {
                    width: min(760px, 100%);
                    margin: 52px auto 0;
                    padding: 28px;
                    text-align: center;
                    border-radius: 12px;
                    border: 1px solid rgba(0, 229, 192, 0.22);
                    background: rgba(17, 34, 54, 0.92);
                    box-shadow:
                        0 28px 80px rgba(0, 0, 0, 0.22),
                        inset 0 1px 0 rgba(255, 255, 255, 0.06);
                }

                .strategy-success svg {
                    color: #00e5c0;
                    margin: 0 auto 12px;
                }

                .strategy-success h3 {
                    margin: 0 0 10px;
                    color: #ffffff;
                    font-size: 22px;
                    font-weight: 800;
                }

                .strategy-success p {
                    width: min(620px, 100%);
                    margin: 0 auto;
                    color: rgba(255, 255, 255, 0.72);
                    font-size: 15px;
                    line-height: 1.65;
                    font-weight: 700;
                }

                @media (max-width: 1100px) {
                    .strategy-grid {
                        grid-template-columns: repeat(2, minmax(280px, 1fr));
                    }

                    .strategy-option-wide {
                        grid-column: 1 / -1;
                    }

                    .strategy-option {
                        min-height: auto;
                    }

                    .strategy-option-body {
                        align-items: flex-start;
                        text-align: left;
                    }

                    .strategy-option p {
                        max-width: 720px;
                    }

                    .strategy-info h4 {
                        text-align: left;
                    }
                }

                @media (max-width: 820px) {
                    .strategy-header {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .strategy-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 640px) {
                    .strategy-page {
                        padding: 28px 16px 48px;
                    }

                    .strategy-title-row h1 {
                        font-size: 27px;
                    }

                    .strategy-option {
                        padding: 24px;
                    }

                    .strategy-option-icon {
                        width: 64px;
                        height: 64px;
                    }
                }
            `}</style>
        </div>
    );
}
