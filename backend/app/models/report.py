from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, JSON, ForeignKey, func
import uuid
from app.core.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    type = Column(String(50), nullable=False)  # 'job_offer', 'website', etc.
    input_data = Column(Text, nullable=True)
    file_url = Column(Text, nullable=True)
    trust_score = Column(Integer, nullable=False)
    ai_summary = Column(Text, nullable=True)
    analysis_details = Column(JSON, nullable=True)  # Stores detailed flags
    recommendations = Column(JSON, nullable=True)   # Stores safety checklists
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
