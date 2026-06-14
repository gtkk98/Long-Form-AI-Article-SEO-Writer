from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    # Establish a "One-to-Many" relationship: One user owns many articles
    articles = relationship("Article", back_populates="owner")

class Article(Base):
    __tablename__ = "articles"

    id = Column(String, primary_key=True, index=True) # Task ID
    prompt = Column(String, index=True)
    content = Column(Text, nullable=True)
    status = Column(String, default="processing")
    
    # NEW: Allow users to bookmark an article for their "Saved" page
    is_saved = Column(Boolean, default=False)
    
    # NEW: The Foreign Key linking this exact article to a specific user
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Establish the reverse relationship back to the User
    owner = relationship("User", back_populates="articles")