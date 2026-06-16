import os
from dotenv import load_dotenv

# 1. Force load the environment variables BEFORE importing routers or database engine
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine
import models
import auth, users, articles
app = FastAPI()

# Serve uploads so the frontend can display images
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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

# REGISTER ROUTERS
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(articles.router, prefix="/api/v1/articles", tags=["Articles"])