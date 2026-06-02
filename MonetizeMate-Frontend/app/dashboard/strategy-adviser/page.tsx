'use client'

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, BriefcaseBusiness, Compass, MessageSquare, Sparkles } from "lucide-react";
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
                    <Card
                        className="strategy-card"
                        onClick={() => router.push('/dashboard/strategy-adviser/business-data')}
                    >
                        <div className="strategy-card-content">
                            <span className="strategy-card-icon">
                                <BriefcaseBusiness className="w-8 h-8" />
                            </span>
                            <h3>Business Data</h3>
                            <p>
                                Enter your business details and API metrics to generate personalized monetization recommendations.
                            </p>

                            <div className="strategy-info">
                                <h4>Business Assessment</h4>
                                <ul>
                                    <li>Company, region, and industry profile</li>
                                    <li>API usage and consumer metrics</li>
                                    <li>Revenue target and charging preference</li>
                                    <li>Strategic API importance</li>
                                </ul>
                            </div>

                            <Button className="strategy-card-button">
                                <BriefcaseBusiness className="w-4 h-4 mr-2" />
                                Enter Business Data
                            </Button>
                        </div>
                    </Card>

                    <Card
                        className="strategy-card"
                        onClick={() => setShowIndustryDialog(true)}
                    >
                        <div className="strategy-card-content">
                            <span className="strategy-card-icon strategy-card-icon-soft">
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

                            <Button className="strategy-card-button">
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
                    <h3>Both Methods Lead to Success</h3>
                    <p>
                        Whether you enter business data or answer questions manually, you&apos;ll receive high-quality,
                        personalized monetization recommendations tailored to your specific business needs.
                    </p>
                </div>
            </div>
            <style>{`
                .strategy-page {
                    min-height: 100vh;
                    padding: 48px 24px 72px;
                    background:
                        radial-gradient(circle at 18% 0%, rgba(0, 229, 192, 0.14), transparent 34%),
                        linear-gradient(135deg, #060e1e 0%, #0b1f36 52%, #071420 100%);
                    color: #ffffff;
                    font-family: 'DM Sans', system-ui, sans-serif;
                }

                .strategy-shell {
                    width: min(1120px, 100%);
                    margin: 0 auto;
                }

                .strategy-header {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    margin-bottom: 34px;
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
                    gap: 18px;
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
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 28px;
                }

                .strategy-card {
                    min-height: 430px;
                    padding: 28px;
                    border-radius: 18px;
                    border: 1px solid rgba(0, 229, 192, 0.22);
                    background: rgba(17, 34, 54, 0.92);
                    box-shadow:
                        0 28px 80px rgba(0, 0, 0, 0.28),
                        inset 0 1px 0 rgba(255, 255, 255, 0.06);
                    cursor: pointer;
                    transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
                }

                .strategy-card:hover {
                    transform: translateY(-4px);
                    border-color: rgba(143, 252, 240, 0.48);
                    box-shadow: 0 30px 86px rgba(0, 229, 192, 0.15);
                }

                .strategy-card-content {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 18px;
                }

                .strategy-card-icon {
                    width: 68px;
                    height: 68px;
                    border-radius: 18px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    color: #00e5c0;
                    background: rgba(0, 229, 192, 0.12);
                    border: 1px solid rgba(0, 229, 192, 0.22);
                }

                .strategy-card-icon-soft {
                    background: rgba(220, 252, 231, 0.9);
                    color: #047857;
                }

                .strategy-card h3 {
                    margin: 6px 0 0;
                    color: #ffffff;
                    font-size: 22px;
                    font-weight: 800;
                }

                .strategy-card p {
                    margin: 0;
                    max-width: 390px;
                    color: #00e5c0;
                    font-size: 15px;
                    line-height: 1.65;
                    font-weight: 700;
                }

                .strategy-info {
                    width: 100%;
                    margin-top: 4px;
                    padding: 18px;
                    border-radius: 12px;
                    border: 1px solid rgba(0, 229, 192, 0.16);
                    background: rgba(31, 47, 68, 0.72);
                    text-align: left;
                }

                .strategy-info h4 {
                    margin: 0 0 10px;
                    color: #ffffff;
                    font-size: 14px;
                    font-weight: 800;
                    text-align: center;
                }

                .strategy-info ul {
                    margin: 0;
                    padding: 0;
                    list-style: none;
                    display: grid;
                    gap: 7px;
                }

                .strategy-info li {
                    color: rgba(255, 255, 255, 0.72);
                    font-size: 13px;
                    font-weight: 700;
                }

                .strategy-info li::before {
                    content: '';
                    display: inline-block;
                    width: 6px;
                    height: 6px;
                    margin-right: 8px;
                    border-radius: 50%;
                    background: #00e5c0;
                    vertical-align: 1px;
                }

                .strategy-card-button {
                    width: 100%;
                    height: 46px;
                    margin-top: auto;
                    border-radius: 10px;
                    background: #11d3ba;
                    color: #061421;
                    font-weight: 900;
                }

                .strategy-card-button:hover {
                    background: #38e6d0;
                    color: #061421;
                }

                .strategy-success {
                    width: min(760px, 100%);
                    margin: 44px auto 0;
                    padding: 28px;
                    text-align: center;
                    border-radius: 18px;
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

                @media (max-width: 820px) {
                    .strategy-grid {
                        grid-template-columns: 1fr;
                    }

                    .strategy-header {
                        align-items: flex-start;
                        flex-direction: column;
                    }
                }

                @media (max-width: 640px) {
                    .strategy-page {
                        padding: 28px 14px 48px;
                    }

                    .strategy-title-row h1 {
                        font-size: 27px;
                    }

                    .strategy-card {
                        padding: 22px;
                    }
                }
            `}</style>
        </div>
    );
}
