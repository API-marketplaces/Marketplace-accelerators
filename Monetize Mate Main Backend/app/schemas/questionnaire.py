from pydantic import BaseModel
from typing import Optional, List

class QuestionnaireBase(BaseModel):
    question: str
    answer_type: str
    options: Optional[List[str]] = None
    category: Optional[str] = None
    description: Optional[str] = None

class QuestionnaireCreate(QuestionnaireBase):
    pass

class QuestionnaireUpdate(QuestionnaireBase):
    pass

class QuestionnaireOut(QuestionnaireBase):
    id: int

    class Config:
        from_attributes = True
