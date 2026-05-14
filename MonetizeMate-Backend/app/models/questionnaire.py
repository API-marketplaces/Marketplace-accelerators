from sqlalchemy import Column, Integer, String, Text
from app.database.database import Base

class Questionnaire(Base):
    __tablename__ = "questionnaire"
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    answer_type = Column(String, nullable=False)  # e.g., 'single', 'multiple', 'text', etc.
    options = Column(Text, nullable=True)  # JSON string for options if applicable
    category = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    def __repr__(self):
        return f"<Questionnaire(id={self.id}, question='{self.question}')>"
