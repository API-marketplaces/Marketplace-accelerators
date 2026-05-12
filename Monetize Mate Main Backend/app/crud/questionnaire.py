from sqlalchemy.orm import Session
from app.models.questionnaire import Questionnaire
from app.schemas.questionnaire import QuestionnaireCreate, QuestionnaireUpdate
import json

def upsert_question(db: Session, question_data: QuestionnaireCreate, question_id: int = None):
    if question_id:
        db_question = db.query(Questionnaire).filter(Questionnaire.id == question_id).first()
        if db_question:
            db_question.question = question_data.question
            db_question.answer_type = question_data.answer_type
            db_question.options = json.dumps(question_data.options) if question_data.options else None
            db_question.category = question_data.category
            db.commit()
            db.refresh(db_question)
            return db_question
    # Create new
    db_question = Questionnaire(
        question=question_data.question,
        answer_type=question_data.answer_type,
        options=json.dumps(question_data.options) if question_data.options else None,
        category=question_data.category
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

def get_all_questions(db: Session):
    return db.query(Questionnaire).all()
