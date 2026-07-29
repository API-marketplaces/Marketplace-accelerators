from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Tuple
import pandas as pd
import os
import json

from app.core.security import get_current_user
from app.database.database import get_db
from app.schemas.audience import AudienceResponse
from app.crud import files as crud_files
from app.core.config import settings

router = APIRouter()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"
STRATEGY_CHAT_MODEL = "openai/gpt-oss-120b"


class ChatMessage(BaseModel):
    role: str
    content: str


class ConciergeRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    file_id: Optional[int] = None


class StrategyChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


def load_file_summary(db, file_id: int, current_user) -> str:
    """Load and summarize the uploaded file data for context."""
    if not file_id:
        return ""
    try:
        db_file = crud_files.get_file_by_id(db, file_id)
        if not db_file or db_file.audience_id != current_user.id:
            return ""
        file_path = db_file.path
        if not os.path.exists(file_path):
            return ""

        ext = os.path.splitext(file_path)[1].lower()
        if ext in [".json", ".log"]:
            from app.core.file_parsers import load_log_or_json_to_df
            df = load_log_or_json_to_df(file_path)
        elif ext == ".csv":
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        summary_parts = []
        summary_parts.append(f"Dataset: {db_file.filename} ({len(df)} rows, {len(df.columns)} columns)")
        summary_parts.append(f"Columns: {', '.join(df.columns.tolist())}")
        if "requests" in df.columns:
            summary_parts.append(f"Total requests: {int(df['requests'].sum()):,}")
        if "status_code" in df.columns:
            success = int((df["status_code"] == 200).sum())
            errors = int((df["status_code"] != 200).sum())
            summary_parts.append(f"Successful: {success:,} | Errors: {errors:,}")
        if "response_time" in df.columns:
            summary_parts.append(f"Avg response time: {df['response_time'].mean():.0f}ms | Max: {df['response_time'].max():.0f}ms")
        if "endpoint" in df.columns:
            top_endpoints = df.groupby("endpoint")["requests"].sum().nlargest(5)
            summary_parts.append(f"Top 5 endpoints: {', '.join([f'{k}({v:,})' for k, v in top_endpoints.items()])}")
        if "client_id" in df.columns:
            top_clients = df.groupby("client_id")["requests"].sum().nlargest(5)
            summary_parts.append(f"Top 5 clients: {', '.join([f'{k}({v:,})' for k, v in top_clients.items()])}")
        if "country" in df.columns or "geo" in df.columns:
            col = "country" if "country" in df.columns else "geo"
            top_countries = df[col].value_counts().head(5)
            summary_parts.append(f"Top countries: {', '.join([f'{k}({v})' for k, v in top_countries.items()])}")
        if "revenue" in df.columns:
            summary_parts.append(f"Total revenue: ${df['revenue'].sum():,.2f} | Avg: ${df['revenue'].mean():,.2f}")
        if "brand" in df.columns:
            top_brands = df["brand"].value_counts().head(3)
            summary_parts.append(f"Top brands: {', '.join([f'{k}({v})' for k, v in top_brands.items()])}")
        if "team" in df.columns:
            top_teams = df["team"].value_counts().head(3)
            summary_parts.append(f"Top teams: {', '.join([f'{k}({v})' for k, v in top_teams.items()])}")
        if "partner" in df.columns:
            top_partners = df["partner"].value_counts().head(3)
            summary_parts.append(f"Top partners: {', '.join([f'{k}({v})' for k, v in top_partners.items()])}")
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
            min_date = df["timestamp"].min()
            max_date = df["timestamp"].max()
            summary_parts.append(f"Date range: {min_date.date()} to {max_date.date()}")

        return "\n".join(summary_parts)
    except Exception as e:
        return f"File loaded but summary failed: {str(e)}"


def call_groq_sync(messages: list, model: str = GROQ_MODEL, max_tokens: int = 1024) -> str:
    """Call Groq API using requests library (synchronous, most reliable)."""
    import requests

    api_key = settings.GROQ_API_KEY

    if not api_key:
        return "⚠️ Groq API key not configured. Please add GROQ_API_KEY to your .env file. Get a free key at console.groq.com"

    try:
        response = requests.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": 0.7,
            },
            timeout=30,
            verify=True,
        )

        if response.status_code != 200:
            error_detail = response.text
            print(f"Groq API error {response.status_code}: {error_detail}")
            raise HTTPException(
                status_code=502,
                detail=f"Groq API returned {response.status_code}: {error_detail[:200]}"
            )

        data = response.json()
        return data["choices"][0]["message"]["content"]

    except HTTPException:
        raise
    except requests.exceptions.SSLError as e:
        print(f"SSL Error calling Groq: {e}")
        raise HTTPException(status_code=502, detail=f"SSL Error: {str(e)}")
    except requests.exceptions.ConnectionError as e:
        print(f"Connection Error calling Groq: {e}")
        raise HTTPException(status_code=502, detail=f"Connection Error: {str(e)}")
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=502, detail="Groq API request timed out after 30s")
    except Exception as e:
        print(f"Unexpected error calling Groq: {type(e).__name__}: {e}")
        raise HTTPException(status_code=502, detail=f"{type(e).__name__}: {str(e)}")


def split_recommendations_json(response_text: str) -> Tuple[str, Optional[dict]]:
    marker = "RECOMMENDATIONS_JSON:"
    if marker not in response_text:
        return response_text.strip(), None

    message_text, json_text = response_text.split(marker, 1)
    json_text = json_text.strip()

    if json_text.startswith("```json"):
        json_text = json_text[7:].strip()
    elif json_text.startswith("```"):
        json_text = json_text[3:].strip()
    if json_text.endswith("```"):
        json_text = json_text[:-3].strip()

    try:
        parsed = json.loads(json_text)
    except json.JSONDecodeError:
        start = json_text.find("{")
        end = json_text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return response_text.strip(), None
        parsed = json.loads(json_text[start:end + 1])

    return message_text.strip(), parsed


def is_basic_chat_message(message: str) -> bool:
    normalized = " ".join(message.lower().strip(" .,!?\t\r\n").split())
    basic_messages = {
        "hi",
        "hello",
        "hey",
        "hii",
        "helo",
        "good morning",
        "good afternoon",
        "good evening",
        "thanks",
        "thank you",
        "ok",
        "okay",
        "yes",
        "no",
    }
    return normalized in basic_messages


def is_substantive_strategy_message(message: str) -> bool:
    # Accept any answer of 4+ chars that isn't a bare greeting/ack.
    # Single-word answers like "internal", "flat", "B2B" are valid strategy inputs.
    return len(message.strip()) >= 4 and not is_basic_chat_message(message)


# Ordered discovery questions — asked sequentially based on conversation turn,
# regardless of what the user said.  Keyword matching cannot reliably understand
# free-form human answers ("internal", "2 million api per month", "500k", etc.).
DISCOVERY_QUESTIONS = [
    "How are you currently monetizing this API today: free/internal use, flat fee, subscription, usage-based pricing, or something else?",
    "What is the main business goal for the next 12 months: new customer acquisition, higher revenue, enterprise expansion, or retention?",
    "How competitive is the market for this API, and do your customers have strong alternatives available?",
    "Do you already have the team or tools to support billing, metering, plans, and usage tracking, or would you need a simpler rollout?",
    "What pricing approach are your customers most likely to accept: subscription, pay-per-use, tiered packages, or a hybrid?",
]


def strategy_chat_follow_up(user_turn_index: int) -> str:
    """Return the next discovery question for the given zero-based user-turn index."""
    if user_turn_index < len(DISCOVERY_QUESTIONS):
        return DISCOVERY_QUESTIONS[user_turn_index]
    # Fallback (should not normally be reached before the LLM phase)
    return DISCOVERY_QUESTIONS[-1]


@router.post("/concierge/chat")
async def concierge_chat(
    request: ConciergeRequest,
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    import asyncio

    data_context = load_file_summary(db, request.file_id, current_user) if request.file_id else ""

    system_prompt = """You are Vessa, the AI help assistant for MonetizeMate, an API monetization intelligence platform.
You help users with two kinds of things: (1) using the application itself, and (2) API monetization strategy and data analysis.

Your personality: Professional, concise, insightful. Use bullet points for lists. Use emojis sparingly for key points.

APPLICATION WORKFLOW YOU MUST KNOW:
- Sign up: the Sign Up page collects name, email, password, and company details (industry, size, revenue, API maturity, goals). After submitting, the user signs in from the Login page.
- Login: email + password on the Login page, with a "Remember me" option. There is a separate "Admin Login" for staff/admin accounts only.
- Forgot password: on the Login page, click "Forgot password?", enter your email, click "Send Reset Link", open the emailed link (it returns to the Login page with a reset form), then enter and confirm a new password and click "Update Password".
- Dashboard: the home page after signing in. Shows a 3-step "Welcome to MonetizeMate" panel and a Features grid with three cards: Monetization Strategy Advisor (active), Analytics Workbench (Coming Soon), AI Monetization Plugin (Coming Soon).
- Monetization Strategy Advisor has 3 paths: "Answer Questionnaire" (active/recommended — pick an industry, answer ~10 AI-generated questions about the business, then get a personalized recommendation), "Business Data" (Coming Soon — reusable business profile), and "AI Chat Advisor" (Coming Soon — conversational discovery).
- Recommendation report: generated after the questionnaire, includes the recommended pricing model, reasoning, a pricing/roadmap breakdown, risks and next steps, downloadable as a PDF.
- Analytics Workbench and AI Monetization Plugin are both marked Coming Soon — do not describe them as usable today.

You can also help with:
- Analyzing API performance and usage patterns (when a dataset is loaded)
- Identifying top clients, endpoints, and revenue opportunities
- Explaining anomalies and errors
- Suggesting monetization strategies (freemium, tiered pricing, pay-per-use, subscription, hybrid)
- Forecasting trends based on data patterns
- Comparing client segments

Always be data-driven when a dataset is loaded — refer to specific numbers. For app-usage questions, give concrete, numbered steps using the workflow above rather than generic advice.
If asked something truly outside your scope, politely redirect to MonetizeMate's features or API monetization topics.
Keep responses concise — under 200 words unless asked for detail."""

    if data_context:
        system_prompt += f"\n\nCurrent dataset loaded:\n{data_context}"

    messages = [{"role": "system", "content": system_prompt}]

    for msg in (request.history or [])[-10:]:
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": request.message})

    # Run synchronous requests call in thread pool to avoid blocking event loop
    loop = asyncio.get_event_loop()
    response_text = await loop.run_in_executor(None, call_groq_sync, messages)

    return {
        "response": response_text,
        "data_context_loaded": bool(data_context),
    }


@router.post("/strategy-advisor/chat")
async def strategy_advisor_chat(
    request: StrategyChatRequest,
    current_user: AudienceResponse = Depends(get_current_user)
):
    import asyncio

    system_prompt = """You are MonetizeMate's AI Chat Advisor for API monetization strategy.
Your job is to run a natural, conversational discovery flow instead of a form.

Use the Groq model to gather business context through short back-and-forth questions.
Ask exactly one focused question at a time.
Do not combine multiple discovery questions in a single reply.
Do not produce final recommendations until the user has answered at least 5 separate user messages and you have enough information.
Aim to finish after roughly 6-8 user messages if you have enough information.

Collect these signals naturally:
- Industry and business type (B2B/B2C/platform/internal API)
- API product/value proposition
- Current users/customers and usage scale
- Current revenue or monetization status
- Target customers and willingness to pay
- Market competition and urgency
- Team/resources to implement billing, plans, metering, and packaging
- Preferred growth goal: acquisition, revenue, enterprise expansion, or retention

When you still need information:
- Reply conversationally in under 90 words.
- Ask one useful follow-up question.
- Use one question mark maximum.
- Do not include JSON.

When you have enough information:
- Only finalize if there are at least 5 separate user messages in this strategy chat.
- Write a warm closing message in 80-140 words.
- Then append this exact marker on a new line: RECOMMENDATIONS_JSON:
- After the marker, output valid JSON only.

The JSON must have this exact shape:
{
  "analysisSource": "ai-chat",
  "selectedIndustry": "short industry name",
  "recommendations": [
    {
      "id": "subscription",
      "name": "Subscription Model",
      "description": "short description",
      "timeframe": "1-2 months",
      "expectedRevenue": "Predictable recurring revenue",
      "implementation": "short implementation guidance",
      "pros": ["...", "...", "..."],
      "cons": ["...", "..."],
      "reasoning": "specific reasoning based on the conversation",
      "score": 92,
      "icon": "DollarSign",
      "color": "text-green-600",
      "bgColor": "bg-green-50"
    }
  ]
}

Return 3-5 recommendations sorted by score descending.
Allowed icon values: Users, DollarSign, TrendingUp, Zap, Star.
Allowed strategy ids: freemium, subscription, usage-based, hybrid, value-based.
Never mention the marker unless you are ready with final recommendations."""

    if is_basic_chat_message(request.message):
        return {
            "message": (
                "Hi! I can help build your API monetization strategy. "
                "Tell me what your API or digital product does, who uses it, and what you want to improve."
            ),
            "ready": False,
            "recommendations": None,
        }

    # Count total user turns so far (history) — current message is turn N.
    # We use raw turn count (not keyword matching) to decide which question to ask next.
    prior_user_turns = len([msg for msg in (request.history or []) if msg.role == "user"])
    # current message is turn index == prior_user_turns (0-based)
    current_turn_index = prior_user_turns

    # Keep asking sequential discovery questions until we have 5+ user turns of context.
    if current_turn_index < 5:
        follow_up = strategy_chat_follow_up(current_turn_index)
        return {
            "message": (
                "Got it. "
                f"{follow_up}"
            ),
            "ready": False,
            "recommendations": None,
        }

    messages = [{"role": "system", "content": system_prompt}]
    for msg in (request.history or [])[-14:]:
        if msg.role in {"user", "assistant"}:
            messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": request.message})

    loop = asyncio.get_event_loop()
    response_text = await loop.run_in_executor(
        None,
        lambda: call_groq_sync(messages, model=STRATEGY_CHAT_MODEL, max_tokens=2200)
    )
    message_text, recommendations_json = split_recommendations_json(response_text)

    return {
        "message": message_text,
        "ready": recommendations_json is not None,
        "recommendations": recommendations_json,
    }


@router.get("/concierge/suggestions")
async def get_suggestions(
    file_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    """Return context-aware suggested questions."""
    if file_id:
        return {"suggestions": [
            "Which API endpoint has the highest error rate?",
            "Who are my top 5 clients by usage?",
            "What monetization strategy do you recommend for my data?",
            "Summarize my API performance in plain English",
            "Which clients are candidates for a premium tier?",
            "What time of day has the highest API traffic?",
            "How can I reduce my error rate?",
            "What is the revenue opportunity I'm missing?",
        ]}
    return {"suggestions": [
        "What is API monetization?",
        "What monetization models work best for B2B APIs?",
        "How do I implement tiered pricing for my API?",
        "What metrics should I track for API monetization?",
        "Upload your data file to get personalized insights!",
    ]}
