'use client';

interface LoadingAnalysisProps {
    title: string;
    description: string;
    steps: React.ReactNode;
    progressValue?: number;
}

const LoadingAnalysis: React.FC<LoadingAnalysisProps> = ({ title, description, steps, progressValue = 75 }) => {
    const progressLabel = title.includes("Generating") ? "Generation" : "Analysis";

    return (
        <div className="loading-analysis">
            <div className="loading-shell">
                <div className="loading-spinner" aria-hidden="true">
                    <span className="loading-spinner-glow" />
                    <span className="loading-spinner-ring" />
                    <span className="loading-spinner-ring loading-spinner-ring-soft" />
                    <svg className="loading-spinner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
                    </svg>
                </div>

                <h2 className="loading-title">{title}</h2>
                <p className="loading-description">{description}</p>

                <div className="loading-steps">
                    {steps}
                </div>

                <div className="loading-progress-track">
                    <div className="loading-progress-fill" style={{ width: `${progressValue}%` }}>
                        <span className="loading-progress-shimmer" />
                    </div>
                </div>
                <p className="loading-progress-label">{progressLabel} Progress: {progressValue}%</p>
            </div>

            <style>{`
                .loading-analysis {
                    min-height: 100vh;
                    padding: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background:
                        radial-gradient(circle at 18% 0%, rgba(0, 229, 192, 0.16), transparent 36%),
                        radial-gradient(circle at 85% 100%, rgba(0, 229, 192, 0.1), transparent 40%),
                        linear-gradient(135deg, #060e1e 0%, #0b1f36 52%, #071420 100%);
                    font-family: 'DM Sans', system-ui, sans-serif;
                }

                .loading-shell {
                    width: min(440px, 100%);
                    padding: 48px 38px 40px;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(22px) saturate(160%);
                    -webkit-backdrop-filter: blur(22px) saturate(160%);
                    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
                    text-align: center;
                    animation: loading-rise 420ms cubic-bezier(0.16, 1, 0.3, 1);
                }

                .loading-spinner {
                    position: relative;
                    width: 84px;
                    height: 84px;
                    margin: 0 auto 28px;
                    display: grid;
                    place-items: center;
                }

                .loading-spinner-glow {
                    position: absolute;
                    inset: -14px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(0, 229, 192, 0.35), transparent 70%);
                    animation: loading-pulse 2.2s ease-in-out infinite;
                }

                .loading-spinner-ring {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    border: 3px solid transparent;
                    border-top-color: #00e5c0;
                    border-right-color: #1abfa3;
                    animation: loading-spin 1s linear infinite;
                }

                .loading-spinner-ring-soft {
                    inset: 12px;
                    border-top-color: transparent;
                    border-right-color: transparent;
                    border-bottom-color: rgba(0, 229, 192, 0.4);
                    border-left-color: rgba(0, 229, 192, 0.18);
                    animation-duration: 1.6s;
                    animation-direction: reverse;
                }

                .loading-spinner-icon {
                    width: 22px;
                    height: 22px;
                    color: #00e5c0;
                }

                .loading-title {
                    margin: 0 0 12px;
                    color: #ffffff;
                    font-size: 22px;
                    line-height: 1.3;
                    font-weight: 800;
                }

                .loading-description {
                    margin: 0 0 26px;
                    color: #7ce9d6;
                    font-size: 14.5px;
                    line-height: 1.6;
                    font-weight: 600;
                }

                .loading-steps {
                    display: grid;
                    gap: 10px;
                    text-align: left;
                    margin-bottom: 30px;
                }

                .loading-step {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    font-size: 13.5px;
                    line-height: 1.45;
                    opacity: 0;
                    animation: loading-step-in 380ms ease forwards;
                    animation-delay: calc(var(--step-index, 0) * 90ms);
                }

                .loading-step-icon {
                    flex: 0 0 auto;
                    width: 18px;
                    height: 18px;
                    margin-top: 1px;
                    display: grid;
                    place-items: center;
                }

                .loading-step-done .loading-step-icon {
                    color: #00e5c0;
                }

                .loading-step-pending {
                    color: rgba(255, 255, 255, 0.38);
                }

                .loading-step-pending .loading-step-icon {
                    color: rgba(255, 255, 255, 0.28);
                }

                .loading-step-done {
                    color: rgba(255, 255, 255, 0.86);
                }

                .loading-step-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: currentColor;
                    animation: loading-dot-pulse 1.4s ease-in-out infinite;
                }

                .loading-progress-track {
                    height: 8px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.1);
                    overflow: hidden;
                    position: relative;
                }

                .loading-progress-fill {
                    position: relative;
                    height: 100%;
                    border-radius: inherit;
                    background: linear-gradient(90deg, #1abfa3, #00e5c0);
                    overflow: hidden;
                    transition: width 500ms ease;
                }

                .loading-progress-shimmer {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(100deg, transparent 30%, rgba(255, 255, 255, 0.55) 50%, transparent 70%);
                    background-size: 200% 100%;
                    animation: loading-shimmer 1.6s ease-in-out infinite;
                }

                .loading-progress-label {
                    margin: 10px 0 0;
                    color: #00e5c0;
                    font-size: 12px;
                    font-weight: 800;
                    letter-spacing: 0.02em;
                }

                @keyframes loading-rise {
                    from { opacity: 0; transform: translateY(14px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                @keyframes loading-spin {
                    to { transform: rotate(360deg); }
                }

                @keyframes loading-pulse {
                    0%, 100% { opacity: 0.55; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.08); }
                }

                @keyframes loading-step-in {
                    from { opacity: 0; transform: translateX(-6px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                @keyframes loading-dot-pulse {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 1; }
                }

                @keyframes loading-shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                /* Site-wide light-mode rules in nagarro-theme.css repaint every bare
                   h1-h4/p/span to dark navy (html.light h2, html.light p, ...). Those
                   selectors carry !important with 1 class of specificity, so every
                   override below adds a second class (".loading-title", etc.) to win
                   on specificity rather than relying on stylesheet order. */
                html.light .loading-analysis {
                    background:
                        radial-gradient(circle at 18% 0%, rgba(14, 116, 104, 0.12), transparent 36%),
                        radial-gradient(circle at 85% 100%, rgba(14, 116, 104, 0.08), transparent 40%),
                        linear-gradient(135deg, #f7fbff 0%, #eef7f5 48%, #ffffff 100%);
                }

                html.light .loading-shell {
                    background: rgba(255, 255, 255, 0.72);
                    border-color: rgba(14, 116, 104, 0.18);
                    box-shadow: 0 24px 70px rgba(16, 32, 51, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6);
                }

                html.light .loading-spinner-ring {
                    border-top-color: #0e9c86;
                    border-right-color: #0a7b6c;
                }

                html.light .loading-spinner-ring-soft {
                    border-bottom-color: rgba(14, 116, 104, 0.42);
                    border-left-color: rgba(14, 116, 104, 0.2);
                }

                html.light .loading-spinner-icon {
                    color: #0a7b6c;
                }

                html.light .loading-title {
                    color: #102033 !important;
                }

                html.light .loading-description {
                    color: #087d70 !important;
                }

                html.light .loading-step-done,
                html.light .loading-step-done .loading-step-text {
                    color: rgba(16, 32, 51, 0.82) !important;
                }

                html.light .loading-step-pending,
                html.light .loading-step-pending .loading-step-text {
                    color: rgba(16, 32, 51, 0.4) !important;
                }

                html.light .loading-step-done .loading-step-icon {
                    color: #0a7b6c !important;
                }

                html.light .loading-step-pending .loading-step-icon {
                    color: rgba(16, 32, 51, 0.28) !important;
                }

                html.light .loading-progress-track {
                    background: rgba(14, 116, 104, 0.14);
                }

                html.light .loading-progress-label {
                    color: #087d70 !important;
                }

                @media (prefers-reduced-motion: reduce) {
                    .loading-shell,
                    .loading-spinner-glow,
                    .loading-spinner-ring,
                    .loading-step,
                    .loading-step-dot,
                    .loading-progress-shimmer {
                        animation: none !important;
                    }
                    .loading-step { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default LoadingAnalysis;

const CheckIcon = () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 10.5l3.5 3.5L16 5.5" />
    </svg>
);

function Step({ done, index, children }: { done: boolean; index: number; children: React.ReactNode }) {
    return (
        <div
            className={done ? "loading-step loading-step-done" : "loading-step loading-step-pending"}
            style={{ '--step-index': index } as React.CSSProperties}
        >
            <span className="loading-step-icon">
                {done ? <CheckIcon /> : <span className="loading-step-dot" />}
            </span>
            <span className="loading-step-text">{children}</span>
        </div>
    );
}

export const FileAnalysisSteps = ({ fileName }: { fileName: string }) => (
    <>
        <Step done index={0}>Processing {fileName}</Step>
        <Step done index={1}>Identifying business patterns</Step>
        <Step done index={2}>Deriving monetization insights</Step>
        <Step done={false} index={3}>Generating recommendations</Step>
    </>
);

export const QuestionnaireAnalysisSteps = ({ industry }: { industry: string }) => (
    <>
        <Step done index={0}>Analyzing {industry} industry factors</Step>
        <Step done index={1}>Processing questionnaire responses</Step>
        <Step done index={2}>Calculating strategy fit scores</Step>
        <Step done={false} index={3}>Generating personalized recommendations</Step>
    </>
);

export const GeneratingRecommendationsSteps = ({
    analysisSource,
    fileName,
    industry,
    sourceLabel = 'questionnaire responses'
}: {
    analysisSource: 'file' | 'manual',
    fileName: string,
    industry: string,
    sourceLabel?: string
}) => (
    <>
        <Step done index={0}>{analysisSource === 'file' ? `Processing ${fileName}` : `Analyzing ${industry} ${sourceLabel}`}</Step>
        <Step done index={1}>Evaluating business characteristics and market fit</Step>
        <Step done index={2}>Calculating strategy compatibility scores</Step>
        <Step done={false} index={3}>Generating detailed implementation plans</Step>
        <Step done={false} index={4}>Creating recommendation reasoning</Step>
        <Step done={false} index={5}>Finalizing strategy rankings</Step>
    </>
);
