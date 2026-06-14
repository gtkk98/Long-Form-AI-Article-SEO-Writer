from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel 
from sqlalchemy.orm import Session
import models
import time 
import os
from dotenv import load_dotenv
from database import engine, get_db, SessionLocal
from google import genai

# Load the secret environment variables securely
load_dotenv()

client = genai.Client()

app = FastAPI()

# This line magically creates the tables in your database if they don't exist!
models.Base.metadata.create_all(bind=engine)

# This allows your React app (running on a different port) to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, we will lock this down to your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ArticleRequest(BaseModel):
    prompt : str

@app.post("/api/v1/articles/generate")
def generate_article(request: ArticleRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    
    # 1. Create a new database record using the user's prompt
    new_article = models.Article(
        prompt = request.prompt,
        status = "queued"
    )
    
    # 2. Add and save it to the database
    db.add(new_article)
    db.commit()
    db.refresh(new_article) # Grabs the newly generated UUID from the database
    
    background_tasks.add_task(process_article_task, new_article.id)
    
    return {
        "status": new_article.status,
        "task_id": new_article.id,
        "message": "Saved to database successfully!"
    }
    
def process_article_task(article_id: str):
    db = SessionLocal()
    try:
        # 1. Find the article and mark it as 'PROCESSING'
        article = db.query(models.Article).filter(models.Article.id == article_id).first()
        if not article:
            return
        
        article.status = "processing"
        db.commit()
        
        print(f"Worker securely calling new Google GenAI API for {article_id}...")
        
        ai_prompt = f"""
        Act as an expert SEO copywriter. Write a highly structured, engaging article about: "{article.prompt}".
        Include a catchy title, introduction, multiple H2 and H3 headings, and a conclusion.
        Format the entire response in clean Markdown.
        """
        
        # NEW: The updated way to call the model
        response = client.models.generate_content(
            model='gemini-2.5-flash', # Using the latest, fastest model available
            contents=ai_prompt,
        )

        article.status = "completed"
        article.content = response.text
        db.commit()
        
        print(f"Worker finished AI generation for {article_id}!")
    except Exception as e:
        # Real-world safety: If Google Cloud crashes, mark the task as failed
        print(f"Error generating AI content: {e}")
        article.status = "failed"
        article.content = f"Error: {str(e)}"
        db.commit()
    finally:
        db.close()
    
@app.get("/api/v1/articles/{article_id}")
def get_article(article_id: str, db: Session = Depends(get_db)):
    article = db.query(models.Article).filter(models.Article.id == article_id).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return {
        "id": article.id,
        "status": article.status,
        "prompt": article.prompt,
        "content": article.content,
        "created_at": article.created_at
    }