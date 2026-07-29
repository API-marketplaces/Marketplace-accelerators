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
                        <div className="strategy-tile-content">
                            <span className="strategy-eyebrow strategy-eyebrow-muted">Coming Soon</span>
                            <h3>Business Data</h3>
                            <p>
                                Build a categorized business profile — saved and reusable — to generate personalized monetization recommendations.
                            </p>

                            <ul className="strategy-info">
                                <li>Business Model, Customers, APIs sections</li>
                                <li>Revenue, Technology, and Objectives sections</li>
                                <li>Save and reuse profiles across assessments</li>
                                <li>Strategic API importance</li>
                            </ul>

                            <Button className="strategy-cta" disabled>
                                Enter Business Data
                                <BriefcaseBusiness className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </Card>

                    <Card className="strategy-option strategy-option-disabled" aria-disabled="true">
                        <div className="strategy-tile-content">
                            <span className="strategy-eyebrow strategy-eyebrow-muted">Coming Soon</span>
                            <h3>AI Chat Advisor</h3>
                            <p>
                                Fine-tuned question discovery for conversational monetization recommendations.
                            </p>

                            <ul className="strategy-info">
                                <li>Natural conversation instead of forms</li>
                                <li>Sequential follow-up questions</li>
                                <li>Strategy recommendations from dialogue</li>
                                <li>Recommendation handoff to implementation</li>
                            </ul>

                            <Button className="strategy-cta" disabled>
                                Chat with AI
                                <Bot className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </Card>

                    <Card
                        className="strategy-option strategy-option-wide"
                        onClick={() => setShowIndustryDialog(true)}
                    >
                        <div className="strategy-tile-content">
                            <span className="strategy-eyebrow">Recommended</span>
                            <h3>Answer Questionnaire</h3>
                            <p>
                                Answer a comprehensive questionnaire about your business to receive tailored monetization strategy recommendations.
                            </p>

                            <ul className="strategy-info">
                                <li>Industry selection + 10 targeted questions</li>
                                <li>Covers all key business aspects</li>
                                <li>Detailed strategy explanations with reasoning</li>
                                <li>Implementation guidance</li>
                            </ul>

                            <Button className="strategy-cta">
                                Answer Questions
                                <MessageSquare className="w-4 h-4 ml-2" />
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
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    background: rgba(255, 255, 255, 0.05) !important;
                    backdrop-filter: blur(22px) saturate(160%);
                    -webkit-backdrop-filter: blur(22px) saturate(160%);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.08);
                    cursor: pointer;
                    transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
                }

                .strategy-option:hover {
                    transform: translateY(-6px);
                    border-color: rgba(143, 252, 240, 0.4);
                    box-shadow: 0 16px 40px rgba(0, 229, 192, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.1);
                }

                .strategy-option-disabled {
                    opacity: 0.45;
                    cursor: not-allowed;
                    pointer-events: none;
                    filter: grayscale(0.3);
                }

                .strategy-option-disabled:hover {
                    border-color: rgba(0, 229, 192, 0.22);
                }

                .strategy-tile-content {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    text-align: left;
                    gap: 14px;
                }

                .strategy-eyebrow {
                    font-size: 12px;
                    font-weight: 800;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    color: #00e5c0;
                }

                .strategy-eyebrow-muted {
                    color: rgba(255, 255, 255, 0.42);
                }

                .strategy-option h3 {
                    margin: 0;
                    color: #ffffff;
                    font-size: 28px;
                    line-height: 1.2;
                    font-weight: 800;
                }

                .strategy-option p {
                    margin: 0;
                    max-width: 400px;
                    color: rgba(255, 255, 255, 0.68);
                    font-size: 15px;
                    line-height: 1.65;
                    font-weight: 500;
                }

                .strategy-info {
                    width: 100%;
                    margin: 4px 0 0;
                    padding: 0;
                    list-style: none;
                    display: grid;
                    gap: 10px;
                }

                .strategy-info li {
                    display: grid;
                    grid-template-columns: 8px 1fr;
                    align-items: start;
                    gap: 12px;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 14px;
                    line-height: 1.45;
                    font-weight: 500;
                }

                .strategy-info li::before {
                    content: '';
                    width: 7px;
                    height: 7px;
                    margin-top: 7px;
                    border-radius: 50%;
                    background: #00e5c0;
                }

                .strategy-cta {
                    width: auto;
                    height: auto;
                    margin-top: auto;
                    padding: 0;
                    border: none;
                    background: transparent;
                    color: #00e5c0;
                    font-weight: 800;
                    font-size: 15px;
                }

                .strategy-cta:hover {
                    background: transparent;
                    color: #38e6d0;
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

                    .strategy-option p {
                        max-width: 720px;
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
                }
            `}</style>
        </div>
    );
}
