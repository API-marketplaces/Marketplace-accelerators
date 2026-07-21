"""Centralized prompt templates for LLM-generated monetization strategy content.

A single, versioned template is used for every monetization strategy generation
call (regardless of industry or the specific business answers supplied) so the
requested JSON shape — recommendations, pricing, packaging, and roadmap — never
drifts between calls. This is what keeps AI output consistent across different
business scenarios and safe to render directly in the UI without per-call
schema surprises.
"""

from typing import List

MONETIZATION_STRATEGY_JSON_SHAPE = """{
  "analysisSource": "questionnaire-llm",
  "selectedIndustry": "short industry name",
  "primaryRecommendation": {
    "id": "subscription",
    "name": "Subscription Model",
    "why": "one sentence why it is the best fit"
  },
  "recommendations": [
    {
      "id": "subscription|usage-based|hybrid|freemium|value-based",
      "name": "Strategy name",
      "description": "short description",
      "score": 92,
      "reasoning": "3-5 sentence strategic summary of why this fits the business profile. Write as a cohesive narrative. Never mention question numbers (Q1, Q3, Q8 etc.), never say 'you answered' or 'your response to'. Describe the business profile that emerged and why the strategy fits it.",
      "implementation": "one-line implementation summary",
      "implementationSteps": ["step 1", "step 2", "step 3", "step 4", "step 5"],
      "timeframe": "timeline summary",
      "expectedRevenue": "revenue impact summary",
      "timeline": "more specific rollout timeline",
      "revenueImpact": "specific expected revenue impact",
      "pros": ["...", "...", "..."],
      "cons": ["...", "..."],
      "risks": ["...", "...", "..."],
      "mitigations": ["...", "...", "..."],
      "successMetrics": ["...", "...", "..."],
      "icon": "Users|DollarSign|TrendingUp|Zap|Star",
      "color": "text-green-600",
      "bgColor": "bg-green-50"
    }
  ],
  "pricing": {
    "model": "short label for the recommended pricing structure, e.g. 'Tiered Usage-Based'",
    "currency": "USD",
    "tiers": [
      {
        "name": "Starter",
        "price": "e.g. $0-49/mo",
        "billingPeriod": "monthly",
        "includedUsage": "e.g. 10,000 API calls/month",
        "overageRate": "e.g. $0.005 per extra call",
        "targetSegment": "who this tier is for",
        "features": ["feature 1", "feature 2", "feature 3"]
      }
    ],
    "rationale": "2-3 sentences on why this pricing structure fits this specific business"
  },
  "packaging": {
    "strategy": "short label, e.g. 'Good-Better-Best'",
    "bundles": [
      {
        "name": "Core",
        "description": "one sentence describing this bundle",
        "featuresIncluded": ["feature 1", "feature 2"],
        "upsellPath": "what naturally leads a customer to upgrade from this bundle"
      }
    ],
    "rationale": "2-3 sentences on why this packaging approach fits this business"
  },
  "roadmap": {
    "phases": [
      {
        "name": "Phase 1: Foundation",
        "duration": "e.g. 2-4 weeks",
        "milestones": ["milestone 1", "milestone 2", "milestone 3"]
      }
    ]
  }
}"""


def build_monetization_strategy_messages(industry: str, answer_lines: str) -> List[dict]:
    """Return the fixed system/user message pair for a monetization strategy
    generation call. Always requests the same four sections (recommendations,
    pricing, packaging, roadmap) in the same JSON shape."""
    system_prompt = f"""You are MonetizeMate's senior API monetization strategist.
Analyze the business's questionnaire answers and return valid JSON only. Do not include markdown.

Always populate all FOUR sections: recommendations, pricing, packaging, roadmap.
Every section must be tailored to the specific business profile in the answers below.
Never return generic placeholder text and never omit a section.

CRITICAL for the "reasoning" field inside each recommendation: write 3-5 sentences as a fluent, insightful summary of WHY this strategy fits this specific business.
- Synthesize what you learned from the answers into a cohesive business narrative.
- Do NOT list questions or answers. Do NOT say "you answered X" or "your answer to Q3".
- Write as a strategist explaining your recommendation: describe the business profile that emerged and why the strategy fits it.
- Example tone: "Your focus on enterprise hospital systems, combined with strong compliance requirements and a preference for predictable costs, makes a tiered subscription model the natural fit. The recurring revenue structure allows you to build long-term relationships with large buyers while accommodating their budgeting cycles. As your call volume grows, tiered pricing gives you a clear upsell path without renegotiating contracts."

The "pricing" section must define 3-4 concrete tiers with real price ranges appropriate to the industry and business scale implied by the answers.
The "packaging" section must define 2-4 feature bundles and a clear upsell path between them.
The "roadmap" section must define 3-4 sequential phases covering planning, staged rollout, full launch, and optimization — each with concrete, business-specific milestones (not generic filler).

The JSON must have this exact top-level shape:
{MONETIZATION_STRATEGY_JSON_SHAPE}

Return 3-5 recommendations sorted by score descending."""

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Industry: {industry}\n\nUser's questionnaire answers:\n{answer_lines}"},
    ]
