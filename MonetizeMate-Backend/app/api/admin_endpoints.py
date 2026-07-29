from collections import Counter, defaultdict
from datetime import datetime, timedelta
import json

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import get_current_admin_user, get_current_user
from app.database.database import get_db
from app.models.admin_activity import AdminActivity
from app.models.audience import Audience
from app.models.file import File
from app.schemas.audience import AudienceResponse

router = APIRouter()

# Report downloads happen entirely client-side (PDF is generated in the
# browser), so there's no natural backend request to count them from —
# the frontend explicitly pings this endpoint after a successful download.
REPORT_DOWNLOAD_ACTIVITY_TYPE = "report_downloaded"


class DownloadTrackingRequest(BaseModel):
    source: str


@router.post("/activity/track-download")
def track_download(
    request: DownloadTrackingRequest,
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user),
):
    db.add(AdminActivity(
        audience_id=current_user.id,
        activity_type=REPORT_DOWNLOAD_ACTIVITY_TYPE,
        source=request.source,
    ))
    db.commit()
    return {"ok": True}

USE_CASE_BY_INDUSTRY = {
    "Banking & Financial Services": ("Open Banking API Marketplace", "High", "Hybrid subscription + usage", "Regulatory compliance, partner onboarding, secure consent flows"),
    "Banking": ("Open Banking API Marketplace", "High", "Hybrid subscription + usage", "Regulatory compliance, partner onboarding, secure consent flows"),
    "Insurance": ("Claims API Platform", "Medium-High", "Value-based pricing", "Legacy systems, claims data quality, fraud controls"),
    "Retail": ("Partner Order APIs", "Medium-High", "Usage-based pricing", "Partner integration variance, catalog sync, fulfilment SLAs"),
    "Healthcare": ("Patient Data Exchange APIs", "High", "Value-based pricing", "Privacy, consent, interoperability, auditability"),
    "Telecommunications": ("Network API Monetization", "High", "Usage-based pricing", "Network abstraction, latency SLAs, developer adoption"),
    "Manufacturing": ("IoT Device APIs", "Medium", "Tiered subscription", "Device heterogeneity, uptime, edge data governance"),
    "Logistics": ("Shipment Tracking APIs", "Medium-High", "Usage-based pricing", "Carrier coverage, real-time accuracy, exception handling"),
    "Government": ("Citizen Service API Platform", "Medium", "Governance-led platform model", "Security reviews, procurement cycles, data classification"),
    "Education": ("Student Information APIs", "Medium", "Subscription model", "FERPA-style privacy, campus system integration, role access"),
    "Energy": ("Energy Data Exchange APIs", "Medium-High", "Value-based pricing", "Operational data quality, compliance, partner ecosystem maturity"),
    "Technology": ("Developer API Marketplace", "High", "Freemium + usage-based pricing", "Governed API management, developer portal, event-driven integration, and standardized domain APIs"),
}

ROADMAP = [
    "Segment API portfolio by consumer and business value",
    "Define metering, packaging, and access tiers",
    "Launch pilot with 3-5 priority API products",
    "Measure adoption, revenue, support load, and conversion",
]

USE_CASE_DETAIL_BY_INDUSTRY = {
    "Banking & Financial Services": {
        "target_buyers": "Fintech partners, wealth platforms, lending partners, and treasury clients",
        "value_proposition": "Monetize trusted financial data and transaction capabilities through compliant partner experiences.",
        "data_signals": ["Consent completion rate", "Partner activation time", "Transaction success rate", "API error rate"],
        "kpis": ["Partner revenue", "API call growth", "Consent conversion", "SLA adherence"],
        "quick_wins": ["Package account data APIs by partner tier", "Create a fintech sandbox", "Add premium SLA tiers"],
    },
    "Banking": {
        "target_buyers": "Fintech partners, wealth platforms, lending partners, and treasury clients",
        "value_proposition": "Monetize trusted financial data and transaction capabilities through compliant partner experiences.",
        "data_signals": ["Consent completion rate", "Partner activation time", "Transaction success rate", "API error rate"],
        "kpis": ["Partner revenue", "API call growth", "Consent conversion", "SLA adherence"],
        "quick_wins": ["Package account data APIs by partner tier", "Create a fintech sandbox", "Add premium SLA tiers"],
    },
    "Technology": {
        "target_buyers": "Developers, ISVs, SaaS partners, marketplaces, and product-led growth teams",
        "value_proposition": "Turn high-demand platform capabilities into self-serve API products with clear packaging and quotas.",
        "data_signals": ["Developer signups", "Token usage", "Free-to-paid conversion", "Endpoint-level demand"],
        "kpis": ["Monthly recurring API revenue", "Active developers", "Conversion rate", "Support tickets per customer"],
        "quick_wins": ["Publish top API bundles", "Add free trial quotas", "Launch usage dashboards for developers"],
        "current_state": "Fragmented point-to-point integrations, no API governance, limited security visibility, and heavy dependence on SAP-centric custom integrations.",
        "key_challenges": "SAP CRM/DBM sunset (2030), growing integration complexity, security/compliance exposure, and inability to support AI-ready, event-driven business capabilities.",
        "monetizemate_recommendation": "Establish a governed API Management layer (Kong/Apigee), API portal, event-driven integration platform, and standardized domain APIs before additional applications are built. This becomes the foundation for AI, dealer ecosystem integration, and future ERP/CRM modernization.",
    },
    "Healthcare": {
        "target_buyers": "Care networks, payers, digital health partners, and patient engagement platforms",
        "value_proposition": "Create secure data exchange products that reduce integration friction while protecting patient trust.",
        "data_signals": ["FHIR/API adoption", "Consent audit status", "Integration cycle time", "Data freshness"],
        "kpis": ["Partner onboarding time", "Exchange volume", "Compliance exceptions", "Customer retention"],
        "quick_wins": ["Prioritize high-value exchange flows", "Document consent controls", "Offer managed partner onboarding"],
    },
    "Retail": {
        "target_buyers": "Marketplace sellers, logistics partners, affiliates, agencies, and enterprise buyers",
        "value_proposition": "Expose catalog, order, inventory, and fulfilment capabilities as paid partner accelerators.",
        "data_signals": ["Order API volume", "Catalog sync errors", "Partner GMV", "Fulfilment SLA misses"],
        "kpis": ["Partner GMV uplift", "Paid partner count", "API margin", "Integration defect rate"],
        "quick_wins": ["Bundle order and catalog APIs", "Create partner certification tiers", "Meter high-volume endpoints"],
    },
    "Telecommunications": {
        "target_buyers": "Application developers, IoT providers, enterprise connectivity teams, and channel partners",
        "value_proposition": "Productize network capabilities such as identity, location, quality, and messaging for developer ecosystems.",
        "data_signals": ["Network API volume", "Latency by endpoint", "Developer activation", "Retry/error behavior"],
        "kpis": ["API revenue per developer", "Latency SLA compliance", "Active apps", "Partner churn"],
        "quick_wins": ["Launch a developer sandbox", "Package low-latency tiers", "Create premium support offers"],
    },
}

DEFAULT_USE_CASE_DETAIL = {
    "target_buyers": "Partners, internal product teams, enterprise customers, and developer ecosystems",
    "value_proposition": "Convert reusable API capabilities into measurable products with pricing, packaging, and adoption tracking.",
    "data_signals": ["API traffic by endpoint", "Customer segment demand", "Error and latency trends", "Conversion funnel activity"],
    "kpis": ["API revenue", "Active consumers", "Adoption growth", "Support load"],
    "quick_wins": ["Identify the top 5 monetizable APIs", "Define access tiers", "Pilot with priority consumers"],
    "current_state": "API capabilities are handled through fragmented integrations, limited governance, inconsistent ownership, and low visibility into reuse, security, and business value.",
    "key_challenges": "Integration complexity is increasing while security, compliance, observability, and product readiness remain difficult to standardize across teams and partners.",
    "monetizemate_recommendation": "Create a governed API management layer, publish standardized domain APIs through an API portal, introduce event-driven integration patterns, and measure adoption before expanding new digital and AI-enabled capabilities.",
}

def _safe_value(value, fallback="Unspecified"):
    if value is None:
        return fallback
    text = str(value).strip()
    return text or fallback


def _parse_objectives(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return [str(item) for item in parsed if str(item).strip()]
    except Exception:
        pass
    return [part.strip() for part in value.split(",") if part.strip()]


def _percentage(count: int, total: int) -> int:
    if total <= 0:
        return 0
    return round((count / total) * 100)


def _distribution(counter: Counter, total: int, limit: int | None = None) -> list[dict]:
    items = counter.most_common(limit)
    return [
        {"label": label, "count": count, "percentage": _percentage(count, total)}
        for label, count in items
    ]


def _persona_for_user(user: Audience) -> str:
    objectives = " ".join(_parse_objectives(user.primary_objectives)).lower()
    job = _safe_value(user.job_title, "").lower()
    size = _safe_value(user.company_size, "").lower()
    maturity = _safe_value(user.api_maturity, "").lower()
    industry = _safe_value(user.industry, "")

    base = "API Product Manager"
    if "enterprise" in size and "governance" in objectives:
        base = "Enterprise Architect"
    elif "internal" in maturity:
        base = "Integration Lead"
    elif "marketplace" in maturity or "marketplace" in objectives:
        base = "Digital Transformation Lead"
    elif "mature" in maturity:
        base = "API Platform Owner"
    elif "revenue forecasting" in objectives or "revenue" in objectives:
        base = "Business Strategist"
    elif "product" in job and "monetize" in objectives:
        base = "API Product Manager"

    industry_prefix = {
        "Healthcare": "Healthcare Integration Lead",
        "Retail": "Retail Digital Architect",
        "Government": "Government Enterprise Architect",
        "Banking & Financial Services": "Banking API Product Manager",
        "Telecommunications": "Telecom Platform Owner",
    }
    return industry_prefix.get(industry, base)


def _maturity_score(maturity: str | None) -> int:
    scores = {
        "Exploring APIs": 20,
        "Internal APIs": 40,
        "Partner APIs": 60,
        "Public APIs": 75,
        "Mature API Marketplace": 90,
    }
    return scores.get(_safe_value(maturity, ""), 0)


def _readiness_score(user: Audience) -> int:
    score = 0
    score += _maturity_score(user.api_maturity)
    objectives = _parse_objectives(user.primary_objectives)
    if "Monetize APIs" in objectives:
        score += 8
    if "Create API Marketplace" in objectives:
        score += 7
    if _safe_value(user.api_gateway, "None") not in ("None", "Unspecified"):
        score += 6
    if _safe_value(user.apis_managed, "") in ("100-500", "500+"):
        score += 5
    return min(100, score)


def _preferred_pricing_model(user: Audience) -> str:
    objectives = _parse_objectives(user.primary_objectives)
    maturity = _safe_value(user.api_maturity, "")
    if "Revenue Forecasting" in objectives:
        return "Value-based"
    if "Create API Marketplace" in objectives or maturity == "Mature API Marketplace":
        return "Hybrid"
    if _safe_value(user.apis_managed, "") in ("100-500", "500+"):
        return "Usage-based"
    if "Improve API Adoption" in objectives:
        return "Freemium"
    return "Subscription"


def _use_case_for_user(user: Audience) -> dict:
    industry = _safe_value(user.industry, "Technology")
    use_case, revenue, model, challenges = USE_CASE_BY_INDUSTRY.get(
        industry,
        (f"{industry} API Monetization Program", "Medium", "Hybrid pricing", "Governed API management, adoption, security, and measurement"),
    )
    details = USE_CASE_DETAIL_BY_INDUSTRY.get(industry, DEFAULT_USE_CASE_DETAIL)
    return {
        "industry": industry,
        "use_case": use_case,
        "revenue_potential": revenue,
        "recommended_model": model,
        "common_challenges": challenges,
        "roadmap": ROADMAP,
        "target_buyers": details["target_buyers"],
        "value_proposition": details["value_proposition"],
        "data_signals": details["data_signals"],
        "kpis": details["kpis"],
        "quick_wins": details["quick_wins"],
        "current_state": details.get("current_state", DEFAULT_USE_CASE_DETAIL["current_state"]),
        "key_challenges": details.get("key_challenges", DEFAULT_USE_CASE_DETAIL["key_challenges"]),
        "monetizemate_recommendation": details.get("monetizemate_recommendation", DEFAULT_USE_CASE_DETAIL["monetizemate_recommendation"]),
    }

def _feature_metrics(users: list[Audience], activities: list[AdminActivity], files: list[File]) -> list[dict]:
    recommendation_runs = sum(1 for item in activities if item.activity_type == "recommendation_generated")
    analytics_uploads = sum(1 for item in files if _safe_value(item.decision_metrics, "").lower() == "analytics")
    prediction_uploads = sum(1 for item in files if _safe_value(item.decision_metrics, "").lower() == "prediction")
    strategy_uploads = sum(1 for item in files if _safe_value(item.decision_metrics, "").lower() == "strategy")
    # Every report download today (per-strategy PDF, comparison PDF, business
    # data report, implementation plan) belongs to the Strategy Advisor flow —
    # there's nothing downloadable yet in the other three features.
    report_downloads = sum(1 for item in activities if item.activity_type == REPORT_DOWNLOAD_ACTIVITY_TYPE)
    return [
        {"feature": "Strategy Advisor", "opened": recommendation_runs, "completed": recommendation_runs, "time_spent": "Captured after event tracking", "reports_generated": recommendation_runs, "downloads": report_downloads},
        {"feature": "Analytics Workbench", "opened": analytics_uploads, "completed": analytics_uploads, "time_spent": "Captured after event tracking", "reports_generated": 0, "downloads": 0},
        {"feature": "Prediction Models", "opened": prediction_uploads, "completed": prediction_uploads, "time_spent": "Captured after event tracking", "reports_generated": 0, "downloads": 0},
        {"feature": "AI Monetization Plugin", "opened": strategy_uploads, "completed": strategy_uploads, "time_spent": "Captured after event tracking", "reports_generated": 0, "downloads": 0},
    ]


def _isoformat_utc(value: datetime | None) -> str | None:
    """created_at columns are stored as naive UTC (datetime.utcnow()). Without an
    explicit 'Z'/offset, browsers parse the ISO string as local time instead of
    UTC, which silently shifts every timestamp shown in the UI. Appending 'Z'
    marks it as UTC so `new Date(...)` on the frontend converts it correctly."""
    if value is None:
        return None
    return value.isoformat() + "Z"


def _serialize_activity(activity: AdminActivity) -> dict:
    return {
        "id": activity.id,
        "activity_type": activity.activity_type,
        "industry": activity.industry,
        "persona": activity.persona,
        "use_case": activity.use_case,
        "strategy": activity.strategy,
        "source": activity.source,
        "created_at": _isoformat_utc(activity.created_at),
        "user": {
            "id": activity.audience.id,
            "name": activity.audience.name,
            "email": activity.audience.email,
        } if activity.audience else None,
    }


@router.get("/admin/insights")
def get_admin_insights(
    db: Session = Depends(get_db),
    _: AudienceResponse = Depends(get_current_admin_user),
):
    now = datetime.utcnow()
    last_7_days = now - timedelta(days=7)

    users = db.query(Audience).all()
    non_admin_users = [user for user in users if not bool(user.is_admin)]
    files = db.query(File).all()
    activities = db.query(AdminActivity).order_by(AdminActivity.created_at.desc()).limit(500).all()

    total_users = len(non_admin_users)
    company_count = len({user.company_name.strip().lower() for user in non_admin_users if user.company_name})
    assessments_completed = sum(1 for item in activities if item.activity_type == "recommendation_generated")
    reports_generated = assessments_completed
    completion_rate = _percentage(assessments_completed, max(total_users, assessments_completed)) if total_users or assessments_completed else 0

    industry_counter = Counter(_safe_value(user.industry) for user in non_admin_users)
    company_size_counter = Counter(_safe_value(user.company_size) for user in non_admin_users)
    country_counter = Counter(_safe_value(user.country) for user in non_admin_users)
    maturity_counter = Counter(_safe_value(user.api_maturity) for user in non_admin_users)
    gateway_counter = Counter(_safe_value(user.api_gateway) for user in non_admin_users)
    api_type_counter = Counter()
    objective_counter = Counter()
    persona_counter = Counter()
    pricing_counter = Counter()

    readiness_scores = []
    maturity_scores = []
    use_case_groups: dict[str, dict] = {}

    for user in non_admin_users:
        persona_counter[_persona_for_user(user)] += 1
        pricing_counter[_preferred_pricing_model(user)] += 1
        readiness_scores.append(_readiness_score(user))
        maturity_scores.append(_maturity_score(user.api_maturity))
        maturity = _safe_value(user.api_maturity)
        if maturity == "Internal APIs":
            api_type_counter["Internal"] += 1
        elif maturity == "Public APIs" or maturity == "Mature API Marketplace":
            api_type_counter["Public"] += 1
        elif maturity == "Partner APIs":
            api_type_counter["External"] += 1
        else:
            api_type_counter["Internal"] += 1
        for objective in _parse_objectives(user.primary_objectives):
            objective_counter[objective] += 1
        use_case = _use_case_for_user(user)
        key = use_case["use_case"]
        if key not in use_case_groups:
            use_case_groups[key] = {**use_case, "customer_count": 0}
        use_case_groups[key]["customer_count"] += 1

    feature_metrics = _feature_metrics(non_admin_users, activities, files)
    most_used_feature = max(feature_metrics, key=lambda item: item["opened"])["feature"] if feature_metrics else "No usage yet"
    reports_downloaded = sum(item["downloads"] for item in feature_metrics)

    daily_activity = defaultdict(lambda: {"date": "", "recommendations": 0, "uploads": 0})
    for idx in range(6, -1, -1):
        day = (now - timedelta(days=idx)).date().isoformat()
        daily_activity[day]["date"] = day
    for activity in activities:
        if activity.created_at and activity.created_at >= last_7_days:
            key = activity.created_at.date().isoformat()
            daily_activity[key]["date"] = key
            daily_activity[key]["recommendations"] += 1
    for file in files:
        if file.upload_time and file.upload_time >= last_7_days:
            key = file.upload_time.date().isoformat()
            daily_activity[key]["date"] = key
            daily_activity[key]["uploads"] += 1

    return {
        "summary": {
            "total_users": total_users,
            "companies": company_count,
            "assessments_completed": assessments_completed,
            "reports_generated": reports_generated,
            "reports_downloaded": reports_downloaded,
            "average_completion_rate": completion_rate,
            "most_used_feature": most_used_feature,
            "average_maturity_score": round(sum(maturity_scores) / len(maturity_scores)) if maturity_scores else 0,
            "monetization_readiness_score": round(sum(readiness_scores) / len(readiness_scores)) if readiness_scores else 0,
        },
        "industry_distribution": _distribution(industry_counter, total_users, 12),
        "company_size_distribution": _distribution(company_size_counter, total_users),
        "api_maturity_distribution": _distribution(maturity_counter, total_users),
        "country_distribution": _distribution(country_counter, total_users, 8),
        "business_objectives": _distribution(objective_counter, total_users, 10),
        "common_api_types": _distribution(api_type_counter, total_users),
        "preferred_pricing_models": _distribution(pricing_counter, total_users),
        "persona_distribution": _distribution(persona_counter, total_users),
        "api_gateway_distribution": _distribution(gateway_counter, total_users, 10),
        "feature_metrics": feature_metrics,
        "activity_timeline": [daily_activity[key] for key in sorted(daily_activity.keys())],
        "ai_use_cases": sorted(use_case_groups.values(), key=lambda item: item["customer_count"], reverse=True),
        "recent_activity": [_serialize_activity(activity) for activity in activities[:5]],
    }


@router.get("/admin/users/export")
def export_users(
    db: Session = Depends(get_db),
    _: AudienceResponse = Depends(get_current_admin_user),
):
    """Full user roster with account details and feature usage, for the admin CSV export.
    Unlike /admin/insights (which caps recent_activity at 5 for the dashboard widget),
    this covers every non-admin user regardless of whether they've done anything yet."""
    users = db.query(Audience).all()
    non_admin_users = [user for user in users if not bool(user.is_admin)]
    all_activities = db.query(AdminActivity).order_by(AdminActivity.created_at.desc()).all()
    all_files = db.query(File).all()

    activities_by_user: dict[int, list[AdminActivity]] = defaultdict(list)
    for activity in all_activities:
        if activity.audience_id is not None:
            activities_by_user[activity.audience_id].append(activity)

    files_by_user: dict[int, list[File]] = defaultdict(list)
    for file in all_files:
        files_by_user[file.audience_id].append(file)

    rows = []
    for user in non_admin_users:
        user_activities = activities_by_user.get(user.id, [])
        user_files = files_by_user.get(user.id, [])
        assessments_completed = sum(1 for item in user_activities if item.activity_type == "recommendation_generated")
        reports_downloaded = sum(1 for item in user_activities if item.activity_type == REPORT_DOWNLOAD_ACTIVITY_TYPE)
        features_used = []
        if assessments_completed:
            features_used.append("Strategy Advisor")
        if any(_safe_value(f.decision_metrics, "").lower() == "analytics" for f in user_files):
            features_used.append("Analytics Workbench")
        if any(_safe_value(f.decision_metrics, "").lower() == "prediction" for f in user_files):
            features_used.append("Prediction Models")
        if any(_safe_value(f.decision_metrics, "").lower() == "strategy" for f in user_files):
            features_used.append("AI Monetization Plugin")
        last_activity = max(
            (item.created_at for item in user_activities if item.created_at),
            default=None,
        )

        rows.append({
            "id": user.id,
            "name": _safe_value(user.name, ""),
            "email": user.email or "",
            "company_name": _safe_value(user.company_name, ""),
            "job_title": _safe_value(user.job_title, ""),
            "department": _safe_value(user.department, ""),
            "country": _safe_value(user.country, ""),
            "industry": _safe_value(user.industry, ""),
            "company_size": _safe_value(user.company_size, ""),
            "annual_revenue": _safe_value(user.annual_revenue, ""),
            "api_maturity": _safe_value(user.api_maturity, ""),
            "primary_objectives": ", ".join(_parse_objectives(user.primary_objectives)),
            "api_gateway": _safe_value(user.api_gateway, ""),
            "apis_managed": _safe_value(user.apis_managed, ""),
            "team_size": _safe_value(user.team_size, ""),
            "persona": _persona_for_user(user),
            "preferred_pricing_model": _preferred_pricing_model(user),
            "monetization_readiness_score": _readiness_score(user),
            "features_used": ", ".join(features_used) if features_used else "None yet",
            "assessments_completed": assessments_completed,
            "reports_downloaded": reports_downloaded,
            "files_uploaded": len(user_files),
            "last_activity_at": _isoformat_utc(last_activity),
        })

    return {"users": rows, "total": len(rows)}


def _persona_for_industry(industry: str, count: int) -> str:
    name = industry or "General API Business"
    if name == "Healthcare":
        return "Healthcare Integration Lead"
    if name == "Retail":
        return "Retail Digital Architect"
    if name == "Government":
        return "Government Enterprise Architect"
    if name == "Banking & Financial Services":
        return "Banking API Product Manager"
    if name == "Telecommunications":
        return "Telecom Platform Owner"
    return f"{name} API Product Manager"


def log_recommendation_activity(db: Session, user: AudienceResponse, industry: str, answers: list, recommendations: list, source: str = "questionnaire-llm"):
    top = recommendations[0] if recommendations else {}
    strategy_name = top.get("name") or top.get("id") if isinstance(top, dict) else None
    persona = _persona_for_industry(industry, 1)
    use_case_data = USE_CASE_BY_INDUSTRY.get(industry)
    use_case = use_case_data[0] if use_case_data else f"{strategy_name or 'Monetization strategy'} evaluation for {industry}"
    answers_summary = json.dumps([
        {"question": item.question, "answer": item.answer}
        for item in answers[:20]
    ])

    db.add(AdminActivity(
        audience_id=user.id,
        activity_type="recommendation_generated",
        industry=industry,
        persona=persona,
        use_case=use_case,
        strategy=strategy_name,
        source=source,
        answers_summary=answers_summary,
    ))
    db.commit()







