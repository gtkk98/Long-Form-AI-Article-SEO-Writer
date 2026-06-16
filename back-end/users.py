import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models
import security
from database import get_db

router = APIRouter()
UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
os.makedirs(UPLOAD_DIR, exist_ok=True)

class UserUpdate(BaseModel):
    bio: Optional[str] = None
    settings: Optional[dict] = None

@router.get("/me")
def get_profile(current_user: models.User = Depends(security.get_current_user)):
    return current_user

@router.patch("/me")
def update_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    if payload.bio is not None:
        current_user.bio = payload.bio
    if payload.settings is not None:
        if current_user.settings is None:
            current_user.settings = {}
        current_user.settings = {**current_user.settings, **payload.settings}
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/history")
def get_user_history(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    return db.query(models.Article).filter(models.Article.user_id == current_user.id).all()

async def save_upload_file(file: UploadFile, sub_folder: str, old_path: Optional[str] = None) -> str:
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid extension")

    folder = os.path.join(UPLOAD_DIR, sub_folder)
    os.makedirs(folder, exist_ok=True)
    
    if old_path and os.path.exists(old_path):
        try: os.remove(old_path)
        except: pass

    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(folder, unique_filename)
    
    content = await file.read()
    with open(file_path, "wb") as buffer:
        buffer.write(content)
    
    return file_path.replace("\\", "/")

@router.post("/upload-profile-pic")
async def upload_profile_pic(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    path = await save_upload_file(file, "profile_pics", current_user.profile_pic)
    current_user.profile_pic = path
    db.add(current_user)
    db.commit()
    return {"profile_pic": path}

@router.post("/upload-cover-pic")
async def upload_cover_pic(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    path = await save_upload_file(file, "cover_pics", current_user.cover_pic)
    current_user.cover_pic = path
    db.add(current_user)
    db.commit()
    return {"cover_pic": path}

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    for pic in [current_user.profile_pic, current_user.cover_pic]:
        if pic and os.path.exists(pic):
            try: os.remove(pic)
            except: pass
    db.delete(current_user)
    db.commit()
    return None