from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from . import models, schemas, crud, database

# Create tables (Note: This won't auto-migrate existing tables correctly if changed, 
# for dev purposes deleting the DB file might be needed if schema changes drastically 
# or use Alembic, but we'll stick to simple recreation if needed or just additive changes)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="ConfessionKML API")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return FileResponse("frontend/index.html")

@app.post("/api/confessions", response_model=schemas.ConfessionRead)
def create_confession(confession: schemas.ConfessionCreate, db: Session = Depends(get_db)):
    return crud.create_confession(db=db, confession=confession)

@app.get("/api/confessions", response_model=List[schemas.ConfessionRead])
def read_confessions(db: Session = Depends(get_db)):
    return crud.get_confessions(db=db)

@app.post("/api/confessions/{confession_id}/like", response_model=schemas.ConfessionRead)
def like_confession(confession_id: int, db: Session = Depends(get_db)):
    db_confession = crud.like_confession(db, confession_id=confession_id)
    if db_confession is None:
        raise HTTPException(status_code=404, detail="Confession not found")
    return db_confession

@app.post("/api/confessions/{confession_id}/comments", response_model=schemas.CommentRead)
def create_comment(confession_id: int, comment: schemas.CommentCreate, db: Session = Depends(get_db)):
    return crud.create_comment(db=db, confession_id=confession_id, comment=comment)

# Mount frontend static files
app.mount("/static", StaticFiles(directory="frontend"), name="static")

# Serve index.html at root (and for any other route not matched by API)
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # If the path looks like a file in frontend, try to serve it
    if "." in full_path:
        return FileResponse(f"frontend/{full_path}")
    return FileResponse("frontend/index.html")
