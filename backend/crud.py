from sqlalchemy.orm import Session
from . import models, schemas

def get_confessions(db: Session):
    return db.query(models.Confession).order_by(models.Confession.timestamp.desc()).all()

def create_confession(db: Session, confession: schemas.ConfessionCreate):
    db_confession = models.Confession(content=confession.content)
    db.add(db_confession)
    db.commit()
    db.refresh(db_confession)
    return db_confession

def like_confession(db: Session, confession_id: int):
    db_confession = db.query(models.Confession).filter(models.Confession.id == confession_id).first()
    if db_confession:
        db_confession.likes += 1
        db.commit()
        db.refresh(db_confession)
    return db_confession

def create_comment(db: Session, confession_id: int, comment: schemas.CommentCreate):
    db_comment = models.Comment(**comment.dict(), confession_id=confession_id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment
