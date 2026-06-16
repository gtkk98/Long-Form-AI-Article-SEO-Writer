import time
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from google import genai
import models
import security
from database import get_db, SessionLocal

router = APIRouter()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class ArticleRequest(BaseModel):
    prompt: str

@router.post("/generate")
def generate_article(
    request: ArticleRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    task_id = str(uuid.uuid4())
    new_article = models.Article(
        id=task_id, 
        prompt=request.prompt, 
        status="processing",
        user_id=current_user.id 
    )
    db.add(new_article)
    db.commit()
    
    background_tasks.add_task(process_article_task, task_id)
    return {"task_id": task_id, "message": "Article generation started"}

@router.get("/{article_id}")
def get_article(article_id: str, db: Session = Depends(get_db)):
    article = db.query(models.Article).filter(models.Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.delete("/{article_id}")
def delete_article(
    article_id: str, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    article = db.query(models.Article).filter(
        models.Article.id == article_id, 
        models.Article.user_id == current_user.id
    ).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found or unauthorized")
    db.delete(article)
    db.commit()
    return {"message": "Article deleted successfully"}

@router.patch("/{article_id}/toggle-save")
def toggle_save_article(
    article_id: str, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    article = db.query(models.Article).filter(
        models.Article.id == article_id, 
        models.Article.user_id == current_user.id
    ).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found or unauthorized")
    article.is_saved = not article.is_saved
    db.commit()
    return {"is_saved": article.is_saved}

def process_article_task(article_id: str):
    db = SessionLocal()
    try:
        article = db.query(models.Article).filter(models.Article.id == article_id).first()
        if not article: return
        
        ai_prompt = f"Act as an expert SEO copywriter. Write a highly structured article about: '{article.prompt}'. Format in Markdown."
        max_retries = 3
        retry_delay = 2
        response = None

        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(model='gemini-2.5-flash', contents=ai_prompt)
                break
            except Exception:
                if attempt == max_retries - 1: raise
                time.sleep(retry_delay)
                retry_delay *= 2

        article.status = "completed"
        article.content = response.text
        db.commit()
    except Exception as e:
        print(f"Error: {e}")
        article.status = "failed"
        article.content = "Generation failed. Please try again."
        db.commit()
    finally:
        db.close()