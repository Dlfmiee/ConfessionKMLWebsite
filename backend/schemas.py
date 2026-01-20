from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class CommentRead(CommentBase):
    id: int
    timestamp: datetime
    confession_id: int

    class Config:
        orm_mode = True

class ConfessionCreate(BaseModel):
    content: str

class ConfessionRead(BaseModel):
    id: int
    content: str
    timestamp: datetime
    likes: int
    comments: List[CommentRead] = []

    class Config:
        orm_mode = True
