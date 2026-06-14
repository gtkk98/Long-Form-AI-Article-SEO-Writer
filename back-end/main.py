from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel 
from sqlalchemy.orm import Session
import models
import time 
import os
from dotenv import load_dotenv
from database import engine, get_db, SessionLocal
from google import genai
import schemas
import security

# 1. Force load the environment variables
load_dotenv()

# 2. Grab the key and verify it exists
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("\n❌ SECURITY ALERT: GEMINI_API_KEY is empty or could not be read from your .env file!")
else:
    # Print just the first 5 characters so you can safely verify it's the right key without leaking it in logs
    print(f"\n✅ SUCCESS: Gemini API Key loaded successfully! Starts with: {api_key[:5]}...")

# 3. Explicitly pass the key to the client so it stops trying to use OAuth tokens
client = genai.Client(api_key=api_key)

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
    
# ==========================================
# AUTHENTICATION ENDPOINTS
# ==========================================

@app.post("/api/v1/auth/register", response_model=schemas.Token)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Check if username is already taken
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username is already registered")
    
    # 2. Scramble the password and save to PostgreSQL
    hashed_password = security.get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 3. Generate and return a JWT so the user is instantly logged in
    access_token = security.create_access_token(data={"sub": new_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/v1/auth/login", response_model=schemas.Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(OAuth2PasswordRequestForm), db: Session = Depends(get_db)):
    # 1. Search PostgreSQL for the requested user
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    # 2. Verify existence AND password match using bcrypt
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Forge a fresh JWT
    access_token = security.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
    
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