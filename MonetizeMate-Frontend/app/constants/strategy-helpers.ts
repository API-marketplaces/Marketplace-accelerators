import { MonetizationStrategy } from '../types/MonetizationStrategy';
import { QuestionnaireAnswers } from '../types/QuestionnaireAnswers';
import { UploadedFile } from '../types/UploadedFile';
import { Users, DollarSign, TrendingUp, Zap, Star } from 'lucide-react';

export const processFileForAnswers = (file: UploadedFile): Partial<QuestionnaireAnswers> => {
    const derivedAnswers: Partial<QuestionnaireAnswers> = {};

    if (file.data && file.data.length > 0) {
        const sampleData = file.data[0];

        if (sampleData.revenue && sampleData.customers) {
            const avgRevenue = file.data.reduce((sum: number, row: any) => sum + (row.revenue || 0), 0) / file.data.length;

            if (avgRevenue > 50000) {
                derivedAnswers.currentRevenue = 2;
                derivedAnswers.userBase = 2;
                derivedAnswers.businessType = 2;
                derivedAnswers.targetMarket = 2;
                derivedAnswers.resourceLevel = 1;
            } else if (avgRevenue > 5000) {
                derivedAnswers.currentRevenue = 1;
                derivedAnswers.userBase = 1;
                derivedAnswers.businessType = 1;
                derivedAnswers.targetMarket = 0;
                derivedAnswers.resourceLevel = 0;
            } else {
                derivedAnswers.currentRevenue = -1;
                derivedAnswers.userBase = -1;
                derivedAnswers.businessType = 0;
                derivedAnswers.targetMarket = -1;
                derivedAnswers.resourceLevel = -1;
            }
        } else if (sampleData.requests || sampleData.users) {
            const avgRequests = file.data.reduce((sum: number, row: any) => sum + (row.requests || 0), 0) / file.data.length;

            if (avgRequests > 10000) {
                derivedAnswers.businessType = 1;
                derivedAnswers.userBase = 1;
                derivedAnswers.currentRevenue = 1;
                derivedAnswers.targetMarket = 0;
                derivedAnswers.apiComplexity = 1;
            } else {
                derivedAnswers.businessType = 0;
                derivedAnswers.userBase = 0;
                derivedAnswers.currentRevenue = -1;
                derivedAnswers.targetMarket = -1;
                derivedAnswers.apiComplexity = 0;
            }
        }

        derivedAnswers.primaryGoal = derivedAnswers.currentRevenue && derivedAnswers.currentRevenue > 0 ? 1 : 0;
        derivedAnswers.customerWillingness = derivedAnswers.targetMarket && derivedAnswers.targetMarket > 0 ? 1 : 0;
        derivedAnswers.competition = 0;
        derivedAnswers.timeToMarket = 1;
    }

    return {
        businessType: 0,
        userBase: 0,
        currentRevenue: -1,
        primaryGoal: 0,
        customerWillingness: 0,
        competition: 0,
        apiComplexity: 0,
        targetMarket: -1,
        timeToMarket: 1,
        resourceLevel: 0,
        ...derivedAnswers
    };
};

const getBaseStrategies = (): MonetizationStrategy[] => [
    {
        id: "freemium",
        name: "Freemium Model",
        score: 0,
        description: "Free tier with premium features for paid users",
        pros: ["Low barrier to entry", "Large user base potential", "Viral growth"],
        cons: ["High conversion challenge", "High support costs", "Revenue takes time"],
        implementation: "Implement feature gating and upgrade flows",
        timeframe: "2-3 months",
        expectedRevenue: "Low initially, high potential",
        icon: Users,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        reasoning: ""
    },
    {
        id: "subscription",
        name: "Subscription Model",
        score: 0,
        description: "Recurring monthly or annual payments",
        pros: ["Predictable revenue", "Strong customer relationships", "Scalable"],
        cons: ["Subscription fatigue", "Churn management", "Value demonstration"],
        implementation: "Set up billing system and tier structure",
        timeframe: "1-2 months",
        expectedRevenue: "Predictable, recurring",
        icon: DollarSign,
        color: "text-green-600",
        bgColor: "bg-green-50",
        reasoning: ""
    },
    {
        id: "usage-based",
        name: "Usage-Based Pricing",
        score: 0,
        description: "Pay per API call, transaction, or usage metric",
        pros: ["Fair pricing", "Scales with value", "Low entry barrier"],
        cons: ["Unpredictable revenue", "Complex billing", "Usage optimization"],
        implementation: "Implement usage tracking and billing",
        timeframe: "2-4 months",
        expectedRevenue: "Variable, scales with usage",
        icon: TrendingUp,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        reasoning: ""
    },
    {
        id: "hybrid",
        name: "Hybrid Model",
        score: 0,
        description: "Combination of subscription and usage-based pricing",
        pros: ["Revenue stability", "Flexible pricing", "Customer choice"],
        cons: ["Complex to implement", "Confusing messaging", "Higher maintenance"],
        implementation: "Develop multi-tier pricing with usage components",
        timeframe: "3-6 months",
        expectedRevenue: "Balanced, multiple streams",
        icon: Zap,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        reasoning: ""
    },
    {
        id: "value-based",
        name: "Value-Based Pricing",
        score: 0,
        description: "Pricing based on customer value and outcomes",
        pros: ["High profit margins", "Customer alignment", "Premium positioning"],
        cons: ["Difficult to measure", "Sales complexity", "Market education"],
        implementation: "Define value metrics and outcome tracking",
        timeframe: "4-6 months",
        expectedRevenue: "High per customer",
        icon: Star,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
        reasoning: ""
    }
];

export const calculateRecommendations = (answers: Partial<QuestionnaireAnswers>, industry: string): MonetizationStrategy[] => {
    const strategies = getBaseStrategies();

    strategies.forEach(strategy => {
        let score = 50;
        let reasoningParts: string[] = [];

        // Industry-specific scoring
        if (industry === "Fintech") {
            if (strategy.id === "subscription") {
                score += 15;
                reasoningParts.push("Fintech users expect predictable subscription pricing");
            }
            if (strategy.id === "usage-based") {
                score += 10;
                reasoningParts.push("Financial services often benefit from transaction-based models");
            }
        } else if (industry === "Healthcare") {
            if (strategy.id === "value-based") {
                score += 20;
                reasoningParts.push("Healthcare values outcome-based pricing models");
            }
            if (strategy.id === "subscription") {
                score += 15;
                reasoningParts.push("Healthcare organizations prefer predictable recurring costs");
            }
        } else if (industry === "E-commerce / Retail") {
            if (strategy.id === "usage-based") {
                score += 20;
                reasoningParts.push("E-commerce thrives on transaction-based revenue models");
            }
            if (strategy.id === "hybrid") {
                score += 15;
                reasoningParts.push("Retail often benefits from combining fixed and variable pricing");
            }
        } else if (industry === "Social Media / Content") {
            if (strategy.id === "freemium") {
                score += 25;
                reasoningParts.push("Social platforms excel with large free user bases and premium conversions");
            }
            if (strategy.id === "subscription") {
                score += 10;
                reasoningParts.push("Content platforms benefit from recurring subscriptions");
            }
        } else if (industry === "SaaS / B2B Tech") {
            if (strategy.id === "subscription") {
                score += 25;
                reasoningParts.push("SaaS industry standard is subscription-based pricing");
            }
            if (strategy.id === "value-based") {
                score += 15;
                reasoningParts.push("B2B customers pay for measurable business value");
            }
        }

        // Apply other scoring factors
        const businessTypeScore = answers.businessType || 0;
        const userBaseScore = answers.userBase || 0;
        const revenueScore = answers.currentRevenue || 0;
        const goalScore = answers.primaryGoal || 0;
        const willingnessScore = answers.customerWillingness || 0;
        const competitionScore = answers.competition || 0;
        const timeScore = answers.timeToMarket || 0;
        const resourceScore = answers.resourceLevel || 0;

        // Business type scoring
        if (businessTypeScore >= 1) {
            if (strategy.id === "subscription") {
                score += 20;
                reasoningParts.push("B2B customers prefer predictable subscription models");
            }
            if (strategy.id === "value-based") {
                score += 15;
                reasoningParts.push("B2B buyers focus on ROI and business value");
            }
        } else if (businessTypeScore <= -1) {
            if (strategy.id === "freemium") {
                score += 25;
                reasoningParts.push("B2C users expect free access with premium upgrades");
            }
        }

        // User base scoring
        if (userBaseScore <= -1) {
            if (strategy.id === "freemium") {
                score += 20;
                reasoningParts.push("Freemium helps grow your user base quickly");
            }
        } else if (userBaseScore >= 1) {
            if (strategy.id === "subscription") {
                score += 20;
                reasoningParts.push("Large user base provides stable subscription revenue");
            }
        }

        // Apply remaining scoring logic similarly...
        strategy.score = Math.min(100, Math.max(0, score));
        strategy.reasoning = reasoningParts.slice(0, 3).join(". ") + (reasoningParts.length > 0 ? "." : "");
    });

    return strategies.sort((a, b) => b.score - a.score);
};