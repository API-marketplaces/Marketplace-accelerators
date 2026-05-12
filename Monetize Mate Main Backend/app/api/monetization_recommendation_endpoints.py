import pandas as pd
from app.crud import files as crud_files
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database.database import get_db
from app.models.questionnaire import Questionnaire

router = APIRouter()

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
    # Simple scoring logic: adjust as needed for your business logic
    models = [dict(m) for m in MONETIZATION_MODELS]
    for qid, answer in answers.items():
        q = questions.get(qid)
        if not q:
            continue
        # Example: if user has large user base, boost subscription and hybrid
        if "user base" in q.question.lower() and answer in ["Agree", "Strongly Agree"]:
            for m in models:
                if m["id"] in ["subscription", "hybrid"]:
                    m["score"] += 2
                    m["reasoning"] += "Large user base supports recurring/hybrid models. "
        # Example: if revenue is high, boost value-based
        if "revenue" in q.question.lower() and answer in ["Agree", "Strongly Agree"]:
            for m in models:
                if m["id"] == "value-based":
                    m["score"] += 2
                    m["reasoning"] += "High revenue supports value-based pricing. "
        # Example: if customer pays premium, boost value-based
        if "premium prices" in q.question.lower() and answer in ["Agree", "Strongly Agree"]:
            for m in models:
                if m["id"] == "value-based":
                    m["score"] += 2
                    m["reasoning"] += "Customer willingness for premium supports value-based. "
        # Example: if competition is high, boost freemium
        if "competition" in q.question.lower() and answer in ["Agree", "Strongly Agree"]:
            for m in models:
                if m["id"] == "freemium":
                    m["score"] += 2
                    m["reasoning"] += "High competition favors freemium for adoption. "
        # Example: if time constraint is tight, boost subscription
        if "quickly" in q.question.lower() and answer in ["Agree", "Strongly Agree"]:
            for m in models:
                if m["id"] == "subscription":
                    m["score"] += 2
                    m["reasoning"] += "Quick implementation favors subscription. "
        # Example: if technical capability is high, boost hybrid
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
    """
    Recommend monetization models based on answers to questionnaire.
    Payload: {"answers": {question_id: answer, ...}}
    """
    answers = payload.get("answers")
    if not answers or not isinstance(answers, dict):
        raise HTTPException(status_code=400, detail="Payload must include 'answers' as a dict of question_id: answer.")
    # Fetch all relevant questions
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
    """
    Recommend monetization models based on answers in a file (columns: id, question, answer).
    """
    db_file = crud_files.get_file_by_id(db, file_id)
    if not db_file or not db_file.path:
        raise HTTPException(status_code=404, detail="File not found.")
    # Read file (support csv and excel)
    import os
    from io import BytesIO
    file_path = db_file.path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk.")
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".csv":
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)
    # Expect columns: id, question, answer
    if not set(["id", "question", "answer"]).issubset(df.columns):
        raise HTTPException(status_code=422, detail="File must have columns: id, question, answer.")
    answers = {int(row["id"]): row["answer"] for _, row in df.iterrows()}
    q_ids = list(answers.keys())
    questions = {q.id: q for q in db.query(Questionnaire).filter(Questionnaire.id.in_(q_ids)).all()}
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for provided IDs in file.")
    result = score_models(answers, questions)
    return result