from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel 
from sqlalchemy.orm import Session
import models
import time 
import os
from dotenv import load_dotenv
from database import engine, get_db, SessionLocal
from google import genai
from jose import jwt, JWTError
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

# ==========================================
# SECURITY DEPENDENCIES
# ==========================================

# Tells FastAPI this is where the frontend gets its token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """The Security Guard: Decodes the JWT and finds the user in PostgreSQL."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Open the token and read the "sub" (subject/username) inside
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Fetch the actual user from the database
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# ==========================================
# PROTECTED APP ENDPOINTS
# ==========================================

@app.post("/api/v1/articles/generate")
def generate_article(
    request: ArticleRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # NEW: Require Login!
):
    import uuid
    task_id = str(uuid.uuid4())
    
    # NEW: Attach the current_user.id as the owner of this article
    new_article = models.Article(
        id=task_id, 
        prompt=request.prompt, 
        status="processing",
        user_id=current_user.id 
    )
    
    db.add(new_article)
    db.commit()
    
    # ... (Keep your existing background task logic here) ...
    background_tasks.add_task(process_article_task, task_id)
    
    return {"task_id": task_id, "message": "Article generation started"}

    
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
        max_retries = 3
        retry_delay = 2 # Seconds to wait between attempts
        response = None

        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=ai_prompt,
                )
                break # Success! Break out of the retry loop
            except Exception as api_err:
                # If we're on our last attempt, raise the error to be caught below
                if attempt == max_retries - 1:
                    raise api_err
                print(f"⚠️ Gemini busy (Attempt {attempt + 1}/{max_retries}). Retrying in {retry_delay}s...")
                time.sleep(retry_delay)
                retry_delay *= 2 # Exponential backoff (waits 2s, then 4s)
        # -----------------------------

        article.status = "completed"
        article.content = response.text
        db.commit()
        
        print(f"Worker finished AI generation for {article_id}!")
    except Exception as e:
        print(f"Error generating AI content: {e}")
        article.status = "failed"
        article.content = f"Generation failed due to high AI demand. Please try again in a moment."
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
    }

@app.get("/api/v1/users/history")
def get_user_history(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Fetches only the articles generated by the logged-in user."""
    # Query PostgreSQL for articles where user_id matches the current user
    articles = db.query(models.Article).filter(models.Article.user_id == current_user.id).all()
    return articles

# ==========================================
# ARTICLE MANAGEMENT ENDPOINTS (DELETE & SAVE)
# ==========================================

@app.delete("/api/v1/articles/{article_id}")
def delete_article(
    article_id: str, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Deletes an article, but guarantees it belongs to the logged-in user."""
    article = db.query(models.Article).filter(
        models.Article.id == article_id, 
        models.Article.user_id == current_user.id
    ).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found or unauthorized")
        
    db.delete(article)
    db.commit()
    return {"message": "Article deleted successfully"}


@app.patch("/api/v1/articles/{article_id}/toggle-save")
def toggle_save_article(
    article_id: str, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Flips the boolean is_saved flag back and forth (True/False)."""
    article = db.query(models.Article).filter(
        models.Article.id == article_id, 
        models.Article.user_id == current_user.id
    ).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found or unauthorized")
        
    # Flip the boolean value
    article.is_saved = not article.is_saved
    db.commit()
    db.refresh(article)
    
    return {"is_saved": article.is_saved, "message": "Save status updated"}