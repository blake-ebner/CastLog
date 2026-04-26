import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .routers import auth, catches, users, friends, comments, messages

app = FastAPI(title="CastLog API", version="1.0.0")

# CORS — allow the Vite dev server and any configured origin
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded photos as static files
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Routers
app.include_router(auth.router)
app.include_router(catches.router)
app.include_router(users.router)
app.include_router(friends.router)
app.include_router(comments.router)
app.include_router(messages.router)


@app.get("/health")
def health():
    return {"status": "ok"}
