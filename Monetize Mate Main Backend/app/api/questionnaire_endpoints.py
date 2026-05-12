from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.database import get_db
from app.schemas.questionnaire import QuestionnaireCreate, QuestionnaireUpdate, QuestionnaireOut
from app.crud import questionnaire as crud_questionnaire

router = APIRouter()

@router.post("/questionnaire/", response_model=QuestionnaireOut)
def add_or_update_question(
    question: QuestionnaireCreate,
    question_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Add a new question or update an existing one (if question_id is provided).
    """
    db_question = crud_questionnaire.upsert_question(db, question, question_id)
    return db_question

@router.get("/questionnaire/", response_model=List[QuestionnaireOut])
def get_all_questions(db: Session = Depends(get_db)):
    """
    Get all questions in the questionnaire.
    """
    import json
    questions = crud_questionnaire.get_all_questions(db)
    for q in questions:
        if hasattr(q, "options") and isinstance(q.options, str):
            try:
                q.options = json.loads(q.options)
            except Exception:
                q.options = []
    return questions
