from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    catches = relationship("Catch", back_populates="user", cascade="all, delete-orphan")


class Catch(Base):
    __tablename__ = "catches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    species = Column(String(100), nullable=False)
    weight_lbs = Column(Float, nullable=True)
    length_inches = Column(Float, nullable=True)
    water_body = Column(String(255), nullable=True)
    caught_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    bait_lure = Column(String(255), nullable=True)
    technique = Column(String(100), nullable=True)
    weather = Column(String(255), nullable=True)
    water_temp_f = Column(Float, nullable=True)
    kept = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    photo_url = Column(String(512), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="catches")
