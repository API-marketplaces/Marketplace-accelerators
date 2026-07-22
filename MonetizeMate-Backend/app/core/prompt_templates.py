"""Centralized prompt templates for LLM-generated monetization strategy content.

A single, versioned template is used for every monetization strategy generation
call (regardless of industry or the specific business answers supplied) so the
requested JSON shape — recommendations, pricing, packaging, and roadmap — never
drifts between calls. This is what keeps AI output consistent across different
business scenarios and safe to render directly in the UI without per-call
schema surprises.
"""

import json
from typing import List

# Full catalog of monetization models the LLM can choose recommendations from
# and must score in "modelMapping". Kept as a single source of truth here so
# both the recommendation pool and the "which model is best" mapping table
# are always grounded in the same fixed set of real-world models, instead of
# the AI inventing or drifting between different model names per call.
MONETIZATION_MODEL_CATALOG = [
    {"id": "api_usage_pricing", "name": "API Usage-Based Pricing", "category": "pricing_model",
     "description": "Charge customers based on the volume of API consumption.",
     "suitable_for": ["high_volume_apis", "utility_apis", "transactional_apis", "developer_facing_apis"],
     "value_drivers": ["api_consumption", "request_volume", "business_criticality"],
     "required_capabilities": ["api_usage_metering", "consumer_identification", "usage_aggregation", "billing_integration"],
     "implementation_complexity": "medium", "revenue_potential": "high"},
    {"id": "resource_consumption_pricing", "name": "Resource Consumption Pricing", "category": "pricing_model",
     "description": "Charge based on the quantity of a measurable resource consumed by the customer (data, storage, compute, tokens).",
     "suitable_for": ["ai_apis", "data_processing_apis", "media_apis", "analytics_apis"],
     "value_drivers": ["processing_volume", "data_volume", "computational_consumption"],
     "required_capabilities": ["resource_metering", "usage_tracking", "billing_integration"],
     "implementation_complexity": "medium", "revenue_potential": "high"},
    {"id": "transaction_based_pricing", "name": "Transaction-Based Pricing", "category": "pricing_model",
     "description": "Charge when the API enables or completes a measurable business transaction or outcome.",
     "suitable_for": ["fintech_apis", "payment_apis", "identity_apis", "fraud_apis", "logistics_apis", "commerce_apis"],
     "value_drivers": ["business_transaction", "successful_outcome", "financial_value_created"],
     "required_capabilities": ["transaction_tracking", "success_failure_tracking", "billing_integration"],
     "implementation_complexity": "medium", "revenue_potential": "very_high"},
    {"id": "subscription_pricing", "name": "Subscription Access", "category": "pricing_model",
     "description": "Charge a recurring fee for continuous access to an API, API product, or platform capability.",
     "suitable_for": ["stable_api_consumption", "enterprise_apis", "data_services", "api_platforms"],
     "value_drivers": ["continuous_access", "platform_availability", "recurring_business_value"],
     "required_capabilities": ["subscription_management", "recurring_billing", "access_control", "entitlement_management"],
     "implementation_complexity": "low", "revenue_potential": "high"},
    {"id": "tiered_pricing", "name": "Tiered API Plans", "category": "pricing_model",
     "description": "Offer predefined pricing plans with increasing usage limits, capabilities, or service levels.",
     "suitable_for": ["segmented_customer_bases", "predictable_usage_patterns", "self_service_api_products"],
     "value_drivers": ["plan_differentiation", "customer_segmentation"],
     "required_capabilities": ["plan_management", "entitlement_management", "usage_limits", "access_control"],
     "implementation_complexity": "medium", "revenue_potential": "high"},
    {"id": "overage_pricing", "name": "Overage Pricing", "category": "pricing_model",
     "description": "Charge customers for usage exceeding the quota included in their subscription plan.",
     "suitable_for": ["subscription_api_products", "predictable_base_usage", "variable_consumption"],
     "value_drivers": ["predictable_base_revenue", "monetizes_growth"],
     "required_capabilities": ["quota_management", "real_time_metering", "threshold_monitoring", "billing_integration"],
     "implementation_complexity": "medium", "revenue_potential": "high"},
    {"id": "api_product_bundling", "name": "API Product and Bundle Pricing", "category": "productization_model",
     "description": "Package multiple APIs into a unified business-oriented product.",
     "suitable_for": ["multiple_related_apis", "api_marketplaces", "enterprise_api_portfolios"],
     "value_drivers": ["business_capability", "convenience", "integrated_workflow"],
     "required_capabilities": ["api_catalog", "product_bundling", "unified_subscription", "unified_billing"],
     "implementation_complexity": "medium", "revenue_potential": "high"},
    {"id": "feature_based_pricing", "name": "Feature and Capability-Based Pricing", "category": "pricing_model",
     "description": "Charge based on the capabilities or features enabled for the customer.",
     "suitable_for": ["feature_rich_apis", "ai_apis", "analytics_apis", "premium_data_services"],
     "value_drivers": ["advanced_features", "premium_data", "real_time_access", "automation"],
     "required_capabilities": ["feature_entitlements", "access_control", "plan_management"],
     "implementation_complexity": "medium", "revenue_potential": "high"},
    {"id": "performance_based_pricing", "name": "Performance and Throughput Pricing", "category": "pricing_model",
     "description": "Charge based on the performance, throughput, or capacity provided to the consumer.",
     "suitable_for": ["high_traffic_apis", "mission_critical_apis", "real_time_apis"],
     "value_drivers": ["requests_per_second", "throughput", "dedicated_capacity"],
     "required_capabilities": ["rate_limit_management", "traffic_metering", "capacity_management"],
     "implementation_complexity": "high", "revenue_potential": "high"},
    {"id": "sla_based_pricing", "name": "SLA-Based Pricing", "category": "pricing_model",
     "description": "Charge based on guaranteed availability, reliability, support, and service commitments.",
     "suitable_for": ["enterprise_apis", "mission_critical_apis", "regulated_industries"],
     "value_drivers": ["uptime", "support_response_time", "disaster_recovery"],
     "required_capabilities": ["monitoring", "sla_measurement", "incident_management", "support_management"],
     "implementation_complexity": "high", "revenue_potential": "high"},
    {"id": "data_access_licensing", "name": "Data Access Licensing", "category": "data_monetization",
     "description": "Charge for access to proprietary datasets through APIs, files, feeds, or platforms.",
     "suitable_for": ["financial_data", "market_data", "logistics_data", "reference_data", "industry_data"],
     "value_drivers": ["dataset_scope", "geography", "access_frequency", "number_of_consumers"],
     "required_capabilities": ["data_catalog", "data_access_control", "usage_tracking", "licensing_management"],
     "implementation_complexity": "medium", "revenue_potential": "very_high"},
    {"id": "data_freshness_pricing", "name": "Data Freshness-Based Pricing", "category": "data_monetization",
     "description": "Charge based on the freshness, frequency, or latency of data updates.",
     "suitable_for": ["market_data", "financial_data", "logistics", "pricing_data", "intelligence_platforms"],
     "value_drivers": ["data_recency"],
     "required_capabilities": ["real_time_pipeline", "data_versioning"],
     "implementation_complexity": "medium", "revenue_potential": "very_high"},
    {"id": "application_based_pricing", "name": "Application and Developer-Based Pricing", "category": "access_model",
     "description": "Charge based on the number of applications, developers, teams, or environments consuming the API.",
     "suitable_for": ["enterprise_api_platforms", "developer_platforms", "multi_tenant_api_products"],
     "value_drivers": ["consumer_count", "predictability"],
     "required_capabilities": ["application_registration", "developer_management", "tenant_management", "access_control"],
     "implementation_complexity": "medium", "revenue_potential": "medium"},
    {"id": "premium_support", "name": "Premium Support and Managed Services", "category": "service_monetization",
     "description": "Monetize enhanced support, technical assistance, onboarding, and operational services.",
     "suitable_for": ["enterprise_customers", "mission_critical_apis", "complex_integrations"],
     "value_drivers": ["operational_dependency", "white_glove_service"],
     "required_capabilities": ["support_management", "account_management"],
     "implementation_complexity": "low", "revenue_potential": "medium"},
    {"id": "partner_reseller", "name": "Partner and Reseller Monetization", "category": "distribution_model",
     "description": "Generate revenue by selling API products through partners, resellers, system integrators, or technology providers.",
     "suitable_for": ["enterprise_apis", "specialized_api_products", "regional_expansion"],
     "value_drivers": ["revenue_share", "reseller_margin", "referral_fee"],
     "required_capabilities": ["partner_management", "revenue_sharing"],
     "implementation_complexity": "medium", "revenue_potential": "high"},
    {"id": "marketplace_commission", "name": "API Marketplace Commission", "category": "ecosystem_monetization",
     "description": "Earn commission by enabling third parties to publish and sell APIs or digital products through a marketplace.",
     "suitable_for": ["api_marketplaces", "multi_provider_ecosystems", "developer_ecosystems"],
     "value_drivers": ["percentage_commission", "listing_fee", "transaction_fee"],
     "required_capabilities": ["provider_onboarding", "catalog_management", "subscription_management", "payment_processing", "revenue_sharing"],
     "implementation_complexity": "high", "revenue_potential": "very_high"},
    {"id": "embedded_oem", "name": "Embedded and OEM Monetization", "category": "distribution_model",
     "description": "Allow customers or partners to embed API capabilities into their own products and commercial offerings.",
     "suitable_for": ["b2b_apis", "embedded_fintech", "identity_services", "infrastructure_apis"],
     "value_drivers": ["embedded_subscription", "per_customer_fee", "revenue_share"],
     "required_capabilities": ["multi_tenancy", "usage_attribution", "partner_management", "white_label_support"],
     "implementation_complexity": "high", "revenue_potential": "very_high"},
    {"id": "white_label_platform", "name": "White-Label API Platform", "category": "platform_monetization",
     "description": "License an API platform or marketplace experience that can be branded and operated by another organization.",
     "suitable_for": ["enterprises", "telecom_operators", "financial_institutions", "technology_providers"],
     "value_drivers": ["platform_license", "tenant_deployment"],
     "required_capabilities": ["branding_configuration", "tenant_isolation", "customizable_portal", "deployment_options"],
     "implementation_complexity": "high", "revenue_potential": "very_high"},
    {"id": "sdk_component_licensing", "name": "SDK and Software Component Licensing", "category": "software_monetization",
     "description": "License reusable SDKs, libraries, connectors, agents, algorithms, or proprietary software components.",
     "suitable_for": ["proprietary_sdks", "client_libraries", "api_connectors", "ai_models", "reusable_algorithms"],
     "value_drivers": ["developer_seat", "deployment", "annual_license"],
     "required_capabilities": ["license_management", "version_management", "entitlement_management"],
     "implementation_complexity": "medium", "revenue_potential": "high"},
]

MONETIZATION_STRATEGY_JSON_SHAPE = """{
  "analysisSource": "questionnaire-llm",
  "selectedIndustry": "short industry name",
  "primaryRecommendation": {
    "id": "id of the best-fitting model from the catalog, e.g. api_usage_pricing",
    "name": "matching catalog model name, e.g. API Usage-Based Pricing",
    "why": "one sentence why it is the best fit"
  },
  "recommendations": [
    {
      "id": "id of a model from the provided catalog (see MODEL CATALOG below) — never invent an id outside the catalog",
      "name": "the catalog model's name",
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
      "riskSeverity": ["consider|low", "consider|low", "consider|low"],
      "successMetrics": ["...", "...", "..."],
      "icon": "Users|DollarSign|TrendingUp|Zap|Star",
      "color": "text-green-600",
      "bgColor": "bg-green-50",
      "strategicFit": {
        "partnerEcosystemReadiness": 88,
        "revenueModelAlignment": 91,
        "infrastructureMaturity": 72,
        "marketTiming": 85
      },
      "whyThisStrategy": [
        {"title": "short punchy title, e.g. 'Scales with Demand'", "description": "1-2 sentences grounded in this business's specific answers"},
        {"title": "...", "description": "..."},
        {"title": "...", "description": "..."}
      ],
      "nextSteps": [
        {"action": "concrete first action", "timeframe": "e.g. 'This week'"},
        {"action": "...", "timeframe": "e.g. 'Week 2'"},
        {"action": "...", "timeframe": "e.g. 'Week 2'"},
        {"action": "...", "timeframe": "e.g. 'Week 3'"}
      ],
      "revisitTrigger": "one sentence describing the concrete metric/threshold at which this strategy should be re-evaluated"
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
  },
  "modelMapping": [
    {
      "id": "catalog model id, e.g. api_usage_pricing",
      "name": "catalog model name, e.g. API Usage-Based Pricing",
      "fitScore": 82,
      "verdict": "one sentence on how well this specific model fits this business — genuine, not generic filler"
    }
  ]
}"""


_MODEL_CATALOG_JSON = json.dumps(MONETIZATION_MODEL_CATALOG, separators=(",", ":"))


def build_monetization_strategy_messages(industry: str, answer_lines: str) -> List[dict]:
    """Return the fixed system/user message pair for a monetization strategy
    generation call. Always requests the same five sections (recommendations,
    pricing, packaging, roadmap, modelMapping) in the same JSON shape."""
    system_prompt = f"""You are MonetizeMate's senior API monetization strategist.
Analyze the business's questionnaire answers and return valid JSON only. Do not include markdown.

Always populate all FIVE sections: recommendations, pricing, packaging, roadmap, modelMapping.
Every section must be tailored to the specific business profile in the answers below.
Never return generic placeholder text and never omit a section.

MODEL CATALOG — the fixed, complete set of monetization models you must choose from and score.
Never invent a model outside this catalog, and never rename one:
{_MODEL_CATALOG_JSON}

How to use the catalog:
- "recommendations" (3-5 entries): pick the best-fitting models from the catalog above for THIS business, using each model's suitable_for/value_drivers/required_capabilities as grounding. Use the catalog's own "id" and "name" verbatim.
- "modelMapping": score EVERY SINGLE model in the catalog above (all of them, not just the recommended ones) for fit against this specific business. This is the full "which model is best" landscape the reader will see ranked side by side, so scores must show genuine, meaningful variance across models — never assign the same or near-identical score to everything. Sort the array by fitScore descending.

CRITICAL for the "reasoning" field inside each recommendation: write 3-5 sentences as a fluent, insightful summary of WHY this strategy fits this specific business.
- Synthesize what you learned from the answers into a cohesive business narrative.
- Do NOT list questions or answers. Do NOT say "you answered X" or "your answer to Q3".
- Write as a strategist explaining your recommendation: describe the business profile that emerged and why the strategy fits it.
- Example tone: "Your focus on enterprise hospital systems, combined with strong compliance requirements and a preference for predictable costs, makes a tiered subscription model the natural fit. The recurring revenue structure allows you to build long-term relationships with large buyers while accommodating their budgeting cycles. As your call volume grows, tiered pricing gives you a clear upsell path without renegotiating contracts."

The "pricing" section must define 3-4 concrete tiers with real price ranges appropriate to the industry and business scale implied by the answers.
The "packaging" section must define 2-4 feature bundles and a clear upsell path between them.
The "roadmap" section must define 3-4 sequential phases covering planning, staged rollout, full launch, and optimization — each with concrete, business-specific milestones (not generic filler).

Inside each recommendation:
- "strategicFit" scores (0-100) must reflect genuine judgment about THIS business's specific answers for each of the four fixed dimensions — do not default to the same numbers across recommendations or industries.
- "whyThisStrategy" must give exactly 3 distinct, specific reasons grounded in the business's own answers — never generic filler like "this is a proven model."
- "riskSeverity" must be the same length and order as "risks", each entry either "consider" (worth planning around) or "low" (minor, unlikely to derail the strategy) — judge genuinely, don't mark everything the same severity.
- "nextSteps" must be 4 concrete, sequenced actions the business can start on immediately, each with a realistic timeframe.
- "revisitTrigger" must name a specific, measurable threshold (a revenue figure, churn rate, or usage level) tied to this business's own numbers where mentioned.

The JSON must have this exact top-level shape:
{MONETIZATION_STRATEGY_JSON_SHAPE}

Return 3-5 recommendations sorted by score descending."""

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Industry: {industry}\n\nUser's questionnaire answers:\n{answer_lines}"},
    ]
