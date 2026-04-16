from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


# ── User ──────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Achievement(BaseModel):
    id: str
    name: str
    description: str
    unlocked: bool


class SpeciesRecord(BaseModel):
    species: str
    weight_lbs: float
    catch_id: int


class UserStats(BaseModel):
    total_catches: int
    species_count: int
    personal_best_lbs: Optional[float]
    species_records: list[SpeciesRecord]
    achievements: list[Achievement]


class UserProfile(BaseModel):
    user: UserOut
    stats: UserStats


# ── Catch ─────────────────────────────────────────────────────────────────────

class CatchCreate(BaseModel):
    species: str
    weight_lbs: Optional[float] = None
    length_inches: Optional[float] = None
    water_body: Optional[str] = None
    caught_at: Optional[datetime] = None
    bait_lure: Optional[str] = None
    technique: Optional[str] = None
    weather: Optional[str] = None
    water_temp_f: Optional[float] = None
    kept: bool = False
    notes: Optional[str] = None


class CatchOut(BaseModel):
    id: int
    user_id: int
    species: str
    weight_lbs: Optional[float]
    length_inches: Optional[float]
    water_body: Optional[str]
    caught_at: datetime
    bait_lure: Optional[str]
    technique: Optional[str]
    weather: Optional[str]
    water_temp_f: Optional[float]
    kept: bool
    notes: Optional[str]
    photo_url: Optional[str]
    created_at: datetime
    username: Optional[str] = None
    is_personal_best: bool = False

    model_config = {"from_attributes": True}


class PaginatedCatches(BaseModel):
    items: list[CatchOut]
    total: int
    page: int
    page_size: int
    pages: int


# ── Friends ───────────────────────────────────────────────────────────────────

class FriendRequestOut(BaseModel):
    id: int
    user: UserOut  # the other person in the relationship
    created_at: datetime

    model_config = {"from_attributes": True}


class FriendshipStatus(BaseModel):
    # "none" | "pending_sent" | "pending_received" | "friends"
    status: str
    request_id: Optional[int] = None


class FriendData(BaseModel):
    friends: list[UserOut]
    incoming_requests: list[FriendRequestOut]
    outgoing_requests: list[FriendRequestOut]


class UserSearchResult(BaseModel):
    users: list[UserOut]
