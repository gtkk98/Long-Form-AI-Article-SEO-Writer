from sqlalchemy import Column, String, Text, DateTime
from database import Base
import uuid
from datetime import datetime

class Article(Base):
    __tablename__ = "articles"
    
    # We use UUIDs (long random strings) instead of 1, 2, 3 so hackers can't guess article URLs
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    prompt = Column(Text, nullable=False)
    status = Column(String, default="queued") # queued, processing, completed
    content = Column(Text, nullable=True) # Will be empty until AI finishes
    created_at = Column(DateTime, default=datetime.utcnow)