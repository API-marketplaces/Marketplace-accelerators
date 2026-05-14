from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
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


class ChatMessage(BaseModel):
    role: str
    content: str


class ConciergeRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    file_id: Optional[int] = None


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
        df = pd.read_csv(file_path) if ext == ".csv" else pd.read_excel(file_path)

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


def call_groq_sync(messages: list) -> str:
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
                "model": GROQ_MODEL,
                "messages": messages,
                "max_tokens": 1024,
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


@router.post("/concierge/chat")
async def concierge_chat(
    request: ConciergeRequest,
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    import asyncio

    data_context = load_file_summary(db, request.file_id, current_user) if request.file_id else ""

    system_prompt = """You are an AI Concierge for MonetizeMate, an API monetization intelligence platform.
You help business users understand their API usage data, identify trends, detect anomalies, and recommend monetization strategies.

Your personality: Professional, concise, insightful. Use bullet points for lists. Use emojis sparingly for key points.

You can help with:
- Analyzing API performance and usage patterns
- Identifying top clients, endpoints, and revenue opportunities
- Explaining anomalies and errors
- Suggesting monetization strategies (freemium, tiered pricing, pay-per-use)
- Forecasting trends based on data patterns
- Comparing client segments

Always be data-driven. If you have data context, refer to specific numbers.
If asked something outside your scope, politely redirect to API monetization topics.
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