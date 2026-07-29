import pandas as pd
import json
import re
from app.crud import files as crud_files
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database.database import get_db
from app.models.questionnaire import Questionnaire
from app.core.config import settings
from app.core.security import get_current_user
from app.core.prompt_templates import build_monetization_strategy_messages, MONETIZATION_MODEL_CATALOG
from app.schemas.audience import AudienceResponse
from app.api.admin_endpoints import log_recommendation_activity

router = APIRouter()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
STRATEGY_CHAT_MODEL = "openai/gpt-oss-120b"


def _groq_retry_after_seconds(response) -> int:
    retry_after = response.headers.get("retry-after")
    if retry_after:
        try:
            return max(1, int(float(retry_after)))
        except ValueError:
            pass

    try:
        body = response.json()
        message = str(body.get("error", {}).get("message") or "")
    except Exception:
        message = response.text or ""

    match = re.search(r"try again in\s+([0-9.]+)s", message, re.IGNORECASE)
    if match:
        return max(1, int(float(match.group(1))) + 1)

    return 0


def call_groq_sync(messages: list, model: str = STRATEGY_CHAT_MODEL, max_tokens: int = 1024, json_mode: bool = False, temperature: float = 0.6) -> str:
    import requests
    import time

    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")

    payload: dict = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=60,
                verify=True,
            )

            if response.status_code in (413, 429):
                wait = max(_groq_retry_after_seconds(response), 8 * (attempt + 1))
                if attempt < max_retries - 1:
                    time.sleep(wait)
                    continue
                raise HTTPException(
                    status_code=429,
                    detail=f"Groq token limit reached. Please wait about {wait} seconds and try again.",
                )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"Groq API returned {response.status_code}: {response.text[:200]}",
                )

            data = response.json()
            return data["choices"][0]["message"]["content"]

        except HTTPException:
            raise
        except requests.exceptions.Timeout:
            if attempt < max_retries - 1:
                time.sleep(3 * (attempt + 1))
                continue
            raise HTTPException(status_code=502, detail="Groq API request timed out.")
        except requests.exceptions.RequestException as exc:
            raise HTTPException(status_code=502, detail=f"Groq API request failed: {exc}")


class LLMQuestionOption(BaseModel):
    label: str
    value: str


class LLMQuestion(BaseModel):
    id: str
    title: str
    description: str
    options: List[LLMQuestionOption]


class GenerateQuestionsRequest(BaseModel):
    industry: str
    count: int = 18


class AnsweredQuestion(BaseModel):
    question_id: str
    question: str
    answer: str


class AnalyzeQuestionnaireRequest(BaseModel):
    industry: str
    answers: List[AnsweredQuestion]


class NextQuestionRequest(BaseModel):
    industry: str
    question_number: int  # how many questions answered so far (0 = want first question)
    conversation: List[AnsweredQuestion] = []


def _extract_json_object(response_text: str) -> dict:
    text = response_text.strip()
    if text.startswith("```json"):
        text = text[7:].strip()
    elif text.startswith("```"):
        text = text[3:].strip()
    if text.endswith("```"):
        text = text[:-3].strip()

    start = text.find("{")
    if start == -1:
        raise HTTPException(status_code=502, detail="LLM returned no JSON object.")
    text = text[start:]

    # Try clean parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try trimming to the last clean top-level closing brace
    end = text.rfind("}")
    if end > 0:
        try:
            return json.loads(text[:end + 1])
        except json.JSONDecodeError:
            pass

    # Attempt to repair truncated JSON by closing unclosed structures
    try:
        return _repair_json(text)
    except Exception:
        raise HTTPException(status_code=502, detail="LLM returned malformed JSON that could not be repaired.")


def _repair_json(text: str) -> dict:
    """Close unclosed JSON structures caused by token truncation."""
    in_string = False
    escape = False
    stack = []

    i = 0
    last_complete = 0
    while i < len(text):
        ch = text[i]
        if escape:
            escape = False
            i += 1
            continue
        if ch == "\\" and in_string:
            escape = True
            i += 1
            continue
        if ch == '"':
            in_string = not in_string
            if not in_string:
                last_complete = i + 1
            i += 1
            continue
        if in_string:
            i += 1
            continue
        if ch in ("{", "["):
            stack.append("}" if ch == "{" else "]")
        elif ch in ("}", "]"):
            if stack and stack[-1] == ch:
                stack.pop()
                last_complete = i + 1
        i += 1

    # If we ended mid-string, trim back to last safely completed position
    if in_string:
        # Find the last comma before the truncated string to remove the incomplete field
        trimmed = text[:last_complete]
        trimmed = trimmed.rstrip().rstrip(",")
        # Re-count stack for the trimmed version
        stack = []
        in_s = False
        esc = False
        for ch in trimmed:
            if esc:
                esc = False
                continue
            if ch == "\\" and in_s:
                esc = True
                continue
            if ch == '"':
                in_s = not in_s
                continue
            if in_s:
                continue
            if ch in ("{", "["):
                stack.append("}" if ch == "{" else "]")
            elif ch in ("}", "]"):
                if stack and stack[-1] == ch:
                    stack.pop()
        repaired = trimmed + "".join(reversed(stack))
    else:
        repaired = text[:last_complete] + "".join(reversed(stack))

    return json.loads(repaired)


def _default_likert_options() -> List[Dict[str, str]]:
    return [
        {"label": "Strongly Disagree", "value": "Strongly Disagree"},
        {"label": "Disagree", "value": "Disagree"},
        {"label": "Neutral", "value": "Neutral"},
        {"label": "Agree", "value": "Agree"},
        {"label": "Strongly Agree", "value": "Strongly Agree"},
    ]


def _normalize_questions(payload: dict, industry: str) -> dict:
    questions = payload.get("questions")
    if not isinstance(questions, list):
        raise HTTPException(status_code=502, detail="LLM response did not include questions.")

    normalized = []
    for index, question in enumerate(questions[:20], start=1):
        if not isinstance(question, dict):
            continue
        options = question.get("options")
        if not isinstance(options, list) or len(options) < 3:
            options = _default_likert_options()

        normalized_options = []
        for option in options[:5]:
            if not isinstance(option, dict):
                continue
            label = str(option.get("label") or option.get("text") or option.get("value") or "Option")
            value = str(option.get("value") or option.get("label") or option.get("text") or label)
            normalized_options.append({"label": label, "value": value})

        normalized.append({
            "id": str(question.get("id") or f"q{index}"),
            "title": str(question.get("title") or question.get("question") or f"Question {index}"),
            "description": str(question.get("description") or "Select the option that best describes your business."),
            "options": normalized_options or _default_likert_options(),
        })

    if len(normalized) < 15:
        raise HTTPException(status_code=502, detail="LLM generated fewer than 15 questions.")

    return {"industry": industry, "questions": normalized}


def _default_pricing() -> dict:
    return {
        "model": "Tiered Subscription",
        "currency": "USD",
        "tiers": [
            {
                "name": "Starter", "price": "Contact for pricing", "billingPeriod": "monthly",
                "includedUsage": "—", "overageRate": "—", "targetSegment": "New customers", "features": [],
            },
        ],
        "rationale": "",
    }


def _normalize_pricing(payload: dict) -> dict:
    pricing = payload.get("pricing")
    if not isinstance(pricing, dict):
        return _default_pricing()

    normalized_tiers = []
    tiers = pricing.get("tiers")
    if isinstance(tiers, list):
        for tier in tiers[:6]:
            if not isinstance(tier, dict):
                continue
            features = tier.get("features")
            normalized_tiers.append({
                "name": str(tier.get("name") or "Tier"),
                "price": str(tier.get("price") or "Contact for pricing"),
                "billingPeriod": str(tier.get("billingPeriod") or "monthly"),
                "includedUsage": str(tier.get("includedUsage") or "—"),
                "overageRate": str(tier.get("overageRate") or "—"),
                "targetSegment": str(tier.get("targetSegment") or ""),
                "features": [str(f) for f in features] if isinstance(features, list) else [],
            })

    return {
        "model": str(pricing.get("model") or "Tiered Subscription"),
        "currency": str(pricing.get("currency") or "USD"),
        "tiers": normalized_tiers or _default_pricing()["tiers"],
        "rationale": str(pricing.get("rationale") or ""),
    }


def _default_packaging() -> dict:
    return {"strategy": "Good-Better-Best", "bundles": [], "rationale": ""}


def _normalize_packaging(payload: dict) -> dict:
    packaging = payload.get("packaging")
    if not isinstance(packaging, dict):
        return _default_packaging()

    normalized_bundles = []
    bundles = packaging.get("bundles")
    if isinstance(bundles, list):
        for bundle in bundles[:6]:
            if not isinstance(bundle, dict):
                continue
            features_included = bundle.get("featuresIncluded")
            normalized_bundles.append({
                "name": str(bundle.get("name") or "Bundle"),
                "description": str(bundle.get("description") or ""),
                "featuresIncluded": [str(f) for f in features_included] if isinstance(features_included, list) else [],
                "upsellPath": str(bundle.get("upsellPath") or ""),
            })

    return {
        "strategy": str(packaging.get("strategy") or "Good-Better-Best"),
        "bundles": normalized_bundles,
        "rationale": str(packaging.get("rationale") or ""),
    }


def _default_roadmap() -> dict:
    return {
        "phases": [
            {"name": "Phase 1: Planning & Setup", "duration": "1-2 weeks", "milestones": []},
            {"name": "Phase 2: Staged Rollout", "duration": "2-4 weeks", "milestones": []},
            {"name": "Phase 3: Full Launch", "duration": "1-2 months", "milestones": []},
            {"name": "Phase 4: Optimization", "duration": "Ongoing", "milestones": []},
        ],
    }


def _normalize_roadmap(payload: dict) -> dict:
    roadmap = payload.get("roadmap")
    if not isinstance(roadmap, dict):
        return _default_roadmap()

    normalized_phases = []
    phases = roadmap.get("phases")
    if isinstance(phases, list):
        for phase in phases[:6]:
            if not isinstance(phase, dict):
                continue
            milestones = phase.get("milestones")
            normalized_phases.append({
                "name": str(phase.get("name") or "Phase"),
                "duration": str(phase.get("duration") or ""),
                "milestones": [str(m) for m in milestones] if isinstance(milestones, list) else [],
            })

    return {"phases": normalized_phases or _default_roadmap()["phases"]}


def _clamp_score(value, default: int) -> int:
    try:
        return max(0, min(100, int(value)))
    except (TypeError, ValueError):
        return default


def _normalize_strategic_fit(raw, fallback_score: int) -> dict:
    fit = raw if isinstance(raw, dict) else {}
    return {
        "partnerEcosystemReadiness": _clamp_score(fit.get("partnerEcosystemReadiness"), fallback_score),
        "revenueModelAlignment": _clamp_score(fit.get("revenueModelAlignment"), fallback_score),
        "infrastructureMaturity": _clamp_score(fit.get("infrastructureMaturity"), fallback_score),
        "marketTiming": _clamp_score(fit.get("marketTiming"), fallback_score),
    }


def _normalize_why_this_strategy(raw, pros: list) -> list:
    items = []
    if isinstance(raw, list):
        for entry in raw[:3]:
            if isinstance(entry, dict) and entry.get("title"):
                items.append({
                    "title": str(entry.get("title")),
                    "description": str(entry.get("description") or ""),
                })
    if items:
        return items
    # Fall back to the strategy's own pros so the section is never empty.
    return [{"title": str(pro), "description": ""} for pro in (pros or [])[:3]]


def _normalize_risk_severity(raw, risk_count: int) -> list:
    allowed = {"consider", "low"}
    severities = raw if isinstance(raw, list) else []
    normalized = [str(s).lower() if str(s).lower() in allowed else "consider" for s in severities[:risk_count]]
    while len(normalized) < risk_count:
        normalized.append("consider")
    return normalized


def _normalize_next_steps(raw, implementation_steps: list) -> list:
    items = []
    if isinstance(raw, list):
        for entry in raw[:4]:
            if isinstance(entry, dict) and entry.get("action"):
                items.append({
                    "action": str(entry.get("action")),
                    "timeframe": str(entry.get("timeframe") or ""),
                })
    if items:
        return items
    # Fall back to the strategy's own implementation steps with generic,
    # sequential week labels rather than leaving the section empty.
    fallback_timeframes = ["This week", "Week 2", "Week 3", "Week 4"]
    return [
        {"action": str(step), "timeframe": fallback_timeframes[i] if i < len(fallback_timeframes) else f"Week {i + 1}"}
        for i, step in enumerate((implementation_steps or [])[:4])
    ]


def _normalize_model_mapping(raw) -> list:
    """Score every model in the fixed catalog against this business. The LLM
    is asked to return one entry per catalog model; here we fill in any it
    skipped with a neutral fallback so the full landscape is always complete,
    then sort by fit score so the top entry is unambiguously "the best"."""
    by_id = {}
    if isinstance(raw, list):
        for entry in raw:
            if isinstance(entry, dict) and entry.get("id"):
                by_id[str(entry["id"])] = entry

    mapping = []
    for model in MONETIZATION_MODEL_CATALOG:
        entry = by_id.get(model["id"], {})
        mapping.append({
            "id": model["id"],
            "name": str(entry.get("name") or model["name"]),
            "fitScore": _clamp_score(entry.get("fitScore"), 50),
            "verdict": str(entry.get("verdict") or ""),
        })

    mapping.sort(key=lambda m: m["fitScore"], reverse=True)
    return mapping


def _normalize_recommendations(payload: dict, industry: str) -> dict:
    recommendations = payload.get("recommendations")
    if not isinstance(recommendations, list) or not recommendations:
        raise HTTPException(status_code=502, detail="LLM response did not include recommendations.")

    # Recommendation "id" now comes from the open MONETIZATION_MODEL_CATALOG
    # (19 model ids) rather than a fixed 5-value enum, so the icon fallback
    # can no longer be keyed by id — cycle through the allowed set by index.
    allowed_icons = ["Zap", "DollarSign", "TrendingUp", "Users", "Star"]

    normalized = []
    for index, item in enumerate(recommendations[:5]):
        if not isinstance(item, dict):
            continue
        strategy_id = str(item.get("id") or item.get("name") or f"strategy-{index + 1}").lower().replace(" ", "-")
        icon = item.get("icon") if item.get("icon") in allowed_icons else allowed_icons[index % len(allowed_icons)]
        score = int(item.get("score") or max(60, 95 - index * 8))
        pros = item.get("pros") if isinstance(item.get("pros"), list) else []
        risks = item.get("risks") if isinstance(item.get("risks"), list) else []
        implementation_steps = item.get("implementationSteps") if isinstance(item.get("implementationSteps"), list) else []
        normalized.append({
            "id": strategy_id,
            "name": str(item.get("name") or "Monetization Strategy"),
            "description": str(item.get("description") or ""),
            "timeframe": str(item.get("timeframe") or item.get("timeline") or ""),
            "expectedRevenue": str(item.get("expectedRevenue") or item.get("revenueImpact") or ""),
            "implementation": str(item.get("implementation") or ""),
            "implementationSteps": implementation_steps,
            "timeline": str(item.get("timeline") or item.get("timeframe") or ""),
            "revenueImpact": str(item.get("revenueImpact") or item.get("expectedRevenue") or ""),
            "pros": pros,
            "cons": item.get("cons") if isinstance(item.get("cons"), list) else [],
            "risks": risks,
            "mitigations": item.get("mitigations") if isinstance(item.get("mitigations"), list) else [],
            "riskSeverity": _normalize_risk_severity(item.get("riskSeverity"), len(risks)),
            "successMetrics": item.get("successMetrics") if isinstance(item.get("successMetrics"), list) else [],
            "reasoning": str(item.get("reasoning") or item.get("why") or ""),
            "score": score,
            "icon": icon,
            "color": str(item.get("color") or "text-blue-600"),
            "bgColor": str(item.get("bgColor") or "bg-blue-50"),
            "strategicFit": _normalize_strategic_fit(item.get("strategicFit"), score),
            "whyThisStrategy": _normalize_why_this_strategy(item.get("whyThisStrategy"), pros),
            "nextSteps": _normalize_next_steps(item.get("nextSteps"), implementation_steps),
            "revisitTrigger": str(item.get("revisitTrigger") or ""),
        })

    if not normalized:
        raise HTTPException(status_code=502, detail="LLM response did not include usable recommendations.")

    return {
        "analysisSource": "questionnaire-llm",
        "selectedIndustry": payload.get("selectedIndustry") or industry,
        "primaryRecommendation": payload.get("primaryRecommendation") or normalized[0],
        "recommendations": normalized,
    }


@router.post("/questionnaire/generate")
def generate_questionnaire_questions(
    request: GenerateQuestionsRequest,
):
    count = min(20, max(15, request.count))
    messages = [
        {
            "role": "system",
            "content": """You generate business assessment MCQs for API monetization strategy.
Return valid JSON only. Do not include markdown.
The JSON shape must be:
{
  "industry": "industry name",
  "questions": [
    {
      "id": "short-stable-id",
      "title": "one MCQ question",
      "description": "why this signal matters",
      "options": [
        {"label": "Strongly Disagree", "value": "Strongly Disagree"},
        {"label": "Disagree", "value": "Disagree"},
        {"label": "Neutral", "value": "Neutral"},
        {"label": "Agree", "value": "Agree"},
        {"label": "Strongly Agree", "value": "Strongly Agree"}
      ]
    }
  ]
}
Questions must be specific to the selected industry and cover customer segment, API value, usage pattern, willingness to pay, competition, metering readiness, billing resources, compliance, timeline, revenue goals, packaging, and expansion potential.""",
        },
        {
            "role": "user",
            "content": f"Generate {count} industry-related MCQs for this industry: {request.industry}",
        },
    ]
    response_text = call_groq_sync(messages, model=STRATEGY_CHAT_MODEL, max_tokens=3500)
    return _normalize_questions(_extract_json_object(response_text), request.industry)


def _questionnaire_phase(total_answered: int) -> tuple[str, str]:
    """Return (phase_name, phase_guidance) so early questions stay foundational
    (business stage, whether an API/product even exists yet) before drilling
    into pricing/monetization specifics that assume technical maturity."""
    if total_answered < 3:
        return (
            "Foundations",
            "Ask broad, non-technical basics ANYONE can answer regardless of experience: "
            "current business/product stage (idea vs. building vs. already live), whether they "
            "already have an API or product in the market, who their target customers are, and "
            "their primary goal for monetization. Do NOT ask about specific pricing/revenue models, "
            "metering, or billing mechanics yet — that assumes context the user may not have.",
        )
    if total_answered < 7:
        return (
            "Customer & Value",
            "Now explore the customer and value proposition: target customer segment, the core "
            "problem/value the API or product solves, how they currently reach customers, and "
            "competitive landscape. Keep options concrete and easy to choose even for a first-time "
            "founder — avoid jargon-heavy pricing terminology.",
        )
    if total_answered < 11:
        return (
            "Monetization Specifics",
            "Now that basics are established, go deeper into monetization: willingness to pay, "
            "preferred revenue model, pricing sensitivity, and revenue goals.",
        )
    return (
        "Readiness & Scale",
        "Cover technical/operational readiness: metering and billing infrastructure, compliance "
        "needs, team resources, timeline to launch, and expansion potential.",
    )


@router.post("/questionnaire/next")
def get_next_question(request: NextQuestionRequest):
    total_answered = len(request.conversation)

    # Hard boundaries
    if total_answered >= 15:
        return {"completed": True, "question": None}

    conversation_text = "\n".join(
        f"Q{idx + 1}: {item.question}\nAnswer: {item.answer}"
        for idx, item in enumerate(request.conversation)
    ) or "No previous questions — generate the first question."

    last_answer_skipped = bool(request.conversation) and request.conversation[-1].answer.strip().lower() == "skipped by user"
    phase_name, phase_guidance = _questionnaire_phase(total_answered)

    skip_instruction = (
        "\n- The user SKIPPED the previous question — do not re-ask that question or a close variant of it. "
        "Pick a different, unexplored topic area instead so the assessment keeps adapting."
        if last_answer_skipped
        else ""
    )

    messages = [
        {
            "role": "system",
            "content": f"""You are an adaptive business assessment AI for API monetization strategy.
Industry: {request.industry}
Questions answered so far: {total_answered}
Current phase: {phase_name}
Phase guidance: {phase_guidance}

Generate ONE contextual follow-up question to assess this business for monetization strategy.

Rules:
- Follow the current phase guidance above — questions must get progressively more specific, never jump ahead to advanced/technical monetization details during the Foundations phase
- Generate a specific MCQ with 4-5 answer options tailored to the question (NOT generic Likert scale)
- Options should be concrete and mutually exclusive choices relevant to the specific question, understandable to someone brand new to APIs or monetization
- Build on previous answers — go deeper on interesting signals or explore uncovered areas{skip_instruction}
- After {total_answered} >= 10 questions, set completed=true ONLY if you have sufficient signal for recommendations
- Below 10 questions always set completed=false

Return ONLY valid JSON, no markdown:
{{
  "completed": false,
  "question": {{
    "id": "q{total_answered + 1}",
    "title": "Your specific question here?",
    "description": "One sentence explaining why this matters for monetization strategy",
    "options": [
      {{"label": "Option text A", "value": "Option text A"}},
      {{"label": "Option text B", "value": "Option text B"}},
      {{"label": "Option text C", "value": "Option text C"}},
      {{"label": "Option text D", "value": "Option text D"}}
    ]
  }}
}}

OR when you have enough information:
{{
  "completed": true,
  "question": null
}}""",
        },
        {
            "role": "user",
            "content": f"Industry: {request.industry}\n\nConversation so far:\n{conversation_text}",
        },
    ]

    last_exc = None
    payload = None
    for attempt in range(2):
        response_text = call_groq_sync(messages, model=STRATEGY_CHAT_MODEL, max_tokens=800, json_mode=True)
        try:
            payload = _extract_json_object(response_text)
            break
        except HTTPException as exc:
            last_exc = exc
    if payload is None:
        raise last_exc

    completed = bool(payload.get("completed", False))

    if total_answered < 10:
        completed = False

    if completed:
        return {"completed": True, "question": None}

    raw_q = payload.get("question")
    if not raw_q or not isinstance(raw_q, dict):
        raise HTTPException(status_code=502, detail="LLM did not return a valid question.")

    options = raw_q.get("options", [])
    if not isinstance(options, list) or len(options) < 2:
        options = _default_likert_options()

    normalized_options = []
    for opt in options[:5]:
        if isinstance(opt, dict):
            label = str(opt.get("label") or opt.get("text") or opt.get("value") or "Option")
            value = str(opt.get("value") or opt.get("label") or label)
            normalized_options.append({"label": label, "value": value})

    if not normalized_options:
        normalized_options = _default_likert_options()

    return {
        "completed": False,
        "question": {
            "id": str(raw_q.get("id") or f"q{total_answered + 1}"),
            "title": str(raw_q.get("title") or raw_q.get("question") or "Question"),
            "description": str(raw_q.get("description") or "Select the most appropriate option for your business."),
            "options": normalized_options,
        },
    }


class EnhancePDFRequest(BaseModel):
    industry: str
    strategy_name: str
    description: str
    reasoning: str
    pros: List[str] = []
    cons: List[str] = []
    risks: List[str] = []
    mitigations: List[str] = []
    implementation_steps: List[str] = []
    timeframe: str = ""
    expected_revenue: str = ""
    success_metrics: List[str] = []
    score: int = 0


@router.post("/monetization/enhance-pdf")
def enhance_pdf_narrative(request: EnhancePDFRequest):
    pros_text = "\n".join(f"- {p}" for p in request.pros) or "None listed"
    cons_text = "\n".join(f"- {c}" for c in request.cons) or "None listed"
    risks_text = "\n".join(f"- {r}" for r in request.risks) or "None listed"
    mitigations_text = "\n".join(f"- {m}" for m in request.mitigations) or "None listed"
    steps_text = "\n".join(f"{i+1}. {s}" for i, s in enumerate(request.implementation_steps)) or "None listed"
    metrics_text = "\n".join(f"- {m}" for m in request.success_metrics) or "None listed"

    messages = [
        {
            "role": "system",
            "content": """You are a world-class API monetization consultant writing a detailed strategy report for a client.
Generate a comprehensive, in-depth analysis for a PDF report. Every section must be thorough and specific — not generic.
Reference the exact industry, strategy, pros, cons, risks, and metrics provided.

Return ONLY valid JSON with these exact keys (each value must be a detailed string, no arrays):
{
  "executive_summary": "Write 4-5 sentences as a compelling executive overview. State the strategy name, why it scores highly for this industry, the core business value it delivers, the expected revenue outcome, and a clear call to action for leadership.",

  "strategic_fit_analysis": "Write 4-5 sentences explaining precisely why this strategy fits this business better than alternatives. Reference the industry characteristics, current business model, customer profile, and how the strategy aligns with their goals. Be specific — mention industry dynamics, buyer behaviour, and competitive positioning.",

  "business_impact": "Write 4-5 sentences on the concrete business impact. Cover: how revenue will change, how customer relationships improve, how the API product becomes more defensible, and what long-term compounding effects occur. Include realistic revenue growth projections tied to the expected revenue figure.",

  "market_opportunity": "Write 3-4 sentences on the market opportunity this strategy unlocks. Discuss industry trends, competitor gaps, pricing power, and how this model positions the business to capture a larger share of the market over the next 2-3 years.",

  "competitive_advantage": "Write 3-4 sentences explaining the durable competitive advantage this strategy creates. How does it make the product stickier? How does it raise the barrier to switching? What moat does it build?",

  "implementation_deep_dive": "Write 4-5 sentences covering the full implementation journey in depth. Discuss team requirements, technical prerequisites, key integration points, how to phase the rollout, and what the business looks like 6 and 12 months after launch.",

  "risk_deep_dive": "Write 4-5 sentences doing a thorough risk analysis. For each major risk, explain the root cause, the likely impact if it materialises, and a concrete mitigation strategy. Be honest — do not downplay real risks.",

  "success_framework": "Write 3-4 sentences defining what success looks like 3, 6, and 12 months in. Tie each timeframe to specific metrics and business outcomes. Explain how to course-correct if metrics are off-track.",

  "recommended_next_steps": "Write 4-5 concrete, actionable next steps the business should take in the next 30 days to begin executing this strategy. Each step should be specific and practical."
}

Rules:
- Every section must be substantive — minimum 3 sentences, aim for 4-5
- Never use placeholder phrases like "this strategy will help you grow" — be specific
- Reference numbers, percentages, and timeframes wherever plausible
- Write as if advising a real executive who will act on this report""",
        },
        {
            "role": "user",
            "content": f"""Industry: {request.industry}
Recommended Strategy: {request.strategy_name} ({request.score}% confidence match)
Description: {request.description}
Core Reasoning: {request.reasoning}
Timeframe to Launch: {request.timeframe}
Expected Revenue Impact: {request.expected_revenue}

Pros / Strengths:
{pros_text}

Cons / Considerations:
{cons_text}

Key Risks:
{risks_text}

Mitigations:
{mitigations_text}

Implementation Steps:
{steps_text}

Success Metrics:
{metrics_text}

Write a thorough, executive-quality PDF report based on the above.""",
        },
    ]

    response_text = call_groq_sync(messages, model=STRATEGY_CHAT_MODEL, max_tokens=3500, json_mode=True)
    payload = _extract_json_object(response_text)

    def safe(key: str) -> str:
        return str(payload.get(key) or "")

    return {
        "executive_summary": safe("executive_summary"),
        "strategic_fit_analysis": safe("strategic_fit_analysis"),
        "business_impact": safe("business_impact"),
        "market_opportunity": safe("market_opportunity"),
        "competitive_advantage": safe("competitive_advantage"),
        "implementation_deep_dive": safe("implementation_deep_dive"),
        "risk_deep_dive": safe("risk_deep_dive"),
        "success_framework": safe("success_framework"),
        "recommended_next_steps": safe("recommended_next_steps"),
    }


def _compact_text(value: str, max_chars: int) -> str:
    text = " ".join(str(value or "").split())
    if len(text) <= max_chars:
        return text
    return text[: max_chars - 1].rstrip() + "..."


def _compact_questionnaire_answers(answers: List[AnsweredQuestion], max_items: int = 15) -> str:
    compacted = []
    for index, answer in enumerate(answers[:max_items], start=1):
        question = _compact_text(answer.question, 140)
        response = _compact_text(answer.answer, 90)
        if question or response:
            compacted.append(f"{index}. {question} -> {response}")
    return "\n".join(compacted) or "No questionnaire answers provided."


@router.post("/monetization/recommend/llm")
def recommend_monetization_llm(
    request: AnalyzeQuestionnaireRequest,
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user),
):
    answer_lines = _compact_questionnaire_answers(request.answers)
    # Keep the prompt compact enough for Groq on-demand TPM limits. The
    # normalizers below fill any missing optional detail, so the model does
    # not need an oversized completion budget to return a useful result.
    messages = build_monetization_strategy_messages(request.industry, answer_lines)
    response_text = call_groq_sync(messages, model=STRATEGY_CHAT_MODEL, max_tokens=4200, json_mode=True, temperature=0.35)
    payload = _extract_json_object(response_text)
    result = _normalize_recommendations(payload, request.industry)
    result["pricing"] = _normalize_pricing(payload)
    result["packaging"] = _normalize_packaging(payload)
    result["roadmap"] = _normalize_roadmap(payload)
    result["modelMapping"] = _normalize_model_mapping(payload.get("modelMapping"))
    log_recommendation_activity(db, current_user, request.industry, request.answers, result.get("recommendations", []))
    return result


# Monetization models template
MONETIZATION_MODELS = [
    {
        "id": "usage",
        "name": "Usage-Based Pricing",
        "score": 0,
        "description": "Pricing based on actual usage (API calls, data, etc.)",
        "pros": ["Aligns cost with value", "Scalable revenue", "Attracts low-usage customers"],
        "cons": ["Revenue unpredictability", "Complex tracking", "Customer confusion"],
        "implementation": "Track usage and bill accordingly",
        "timeframe": "2-4 months",
        "expectedRevenue": "Variable, scales with usage",
        "reasoning": ""
    },
    {
        "id": "hybrid",
        "name": "Hybrid Model",
        "score": 0,
        "description": "Combination of subscription and usage-based pricing",
        "pros": ["Revenue stability", "Flexible pricing", "Customer choice"],
        "cons": ["Complex to implement", "Confusing messaging", "Higher maintenance"],
        "implementation": "Develop multi-tier pricing with usage components",
        "timeframe": "3-6 months",
        "expectedRevenue": "Balanced, multiple streams",
        "reasoning": ""
    },
    {
        "id": "freemium",
        "name": "Freemium Model",
        "score": 0,
        "description": "Free basic tier, paid advanced features",
        "pros": ["Easy adoption", "Large user base", "Upsell potential"],
        "cons": ["Low conversion", "Support costs", "Revenue delay"],
        "implementation": "Offer free tier, upsell premium features",
        "timeframe": "2-3 months",
        "expectedRevenue": "Low initially, grows with conversion",
        "reasoning": ""
    },
    {
        "id": "subscription",
        "name": "Subscription Model",
        "score": 0,
        "description": "Recurring monthly/annual payments for access",
        "pros": ["Predictable revenue", "Customer retention", "Simple billing"],
        "cons": ["Churn risk", "Price sensitivity", "Feature lock-in"],
        "implementation": "Set up recurring billing and plans",
        "timeframe": "1-2 months",
        "expectedRevenue": "Stable, recurring",
        "reasoning": ""
    },
    {
        "id": "value-based",
        "name": "Value-Based Pricing",
        "score": 0,
        "description": "Pricing based on customer value and outcomes",
        "pros": ["High profit margins", "Customer alignment", "Premium positioning"],
        "cons": ["Difficult to measure", "Sales complexity", "Market education"],
        "implementation": "Define value metrics and outcome tracking",
        "timeframe": "4-6 months",
        "expectedRevenue": "High per customer",
        "reasoning": ""
    }
]


def score_models(answers: Dict[int, str], questions: Dict[int, Questionnaire]) -> List[Dict[str, Any]]:
    models = [dict(m) for m in MONETIZATION_MODELS]
    for qid, answer in answers.items():
        q = questions.get(qid)
        if not q:
            continue
        if "user base" in q.question.lower() and answer in ["Agree", "Strongly Agree"]:
            for m in models:
                if m["id"] in ["subscription", "hybrid"]:
                    m["score"] += 2
                    m["reasoning"] += "Large user base supports recurring/hybrid models. "
        if "revenue" in q.question.lower() and answer in ["Agree", "Strongly Agree"]:
            for m in models:
                if m["id"] == "value-based":
                    m["score"] += 2
                    m["reasoning"] += "High revenue supports value-based pricing. "
        if "premium prices" in q.question.lower() and answer in ["Agree", "Strongly Agree"]:
            for m in models:
                if m["id"] == "value-based":
                    m["score"] += 2
                    m["reasoning"] += "Customer willingness for premium supports value-based. "
        if "competition" in q.question.lower() and answer in ["Agree", "Strongly Agree"]:
            for m in models:
                if m["id"] == "freemium":
                    m["score"] += 2
                    m["reasoning"] += "High competition favors freemium for adoption. "
        if "quickly" in q.question.lower() and answer in ["Agree", "Strongly Agree"]:
            for m in models:
                if m["id"] == "subscription":
                    m["score"] += 2
                    m["reasoning"] += "Quick implementation favors subscription. "
        if "technical capabilities" in q.question.lower() and answer in ["Agree", "Strongly Agree"]:
            for m in models:
                if m["id"] == "hybrid":
                    m["score"] += 2
                    m["reasoning"] += "Strong tech team can implement hybrid. "
    return sorted(models, key=lambda x: x["score"], reverse=True)


@router.post("/monetization/recommend", response_model=List[dict])
def recommend_monetization(
    payload: dict,
    db: Session = Depends(get_db)
):
    answers = payload.get("answers")
    if not answers or not isinstance(answers, dict):
        raise HTTPException(status_code=400, detail="Payload must include 'answers' as a dict of question_id: answer.")
    q_ids = [int(qid) for qid in answers.keys()]
    questions = {q.id: q for q in db.query(Questionnaire).filter(Questionnaire.id.in_(q_ids)).all()}
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for provided IDs.")
    result = score_models(answers, questions)
    return result


@router.get("/monetization/recommend/from-file/{file_id}", response_model=List[dict])
def recommend_monetization_from_file(
    file_id: int,
    db: Session = Depends(get_db)
):
    db_file = crud_files.get_file_by_id(db, file_id)
    if not db_file or not db_file.path:
        raise HTTPException(status_code=404, detail="File not found.")
    import os
    file_path = db_file.path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk.")
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".csv":
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)
    if not set(["id", "question", "answer"]).issubset(df.columns):
        raise HTTPException(status_code=422, detail="File must have columns: id, question, answer.")
    answers = {int(row["id"]): row["answer"] for _, row in df.iterrows()}
    q_ids = list(answers.keys())
    questions = {q.id: q for q in db.query(Questionnaire).filter(Questionnaire.id.in_(q_ids)).all()}
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for provided IDs in file.")
    result = score_models(answers, questions)
    return result






