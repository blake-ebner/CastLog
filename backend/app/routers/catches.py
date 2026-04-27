import json
import math
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user
from ..storage import get_storage

router = APIRouter(prefix="/catches", tags=["catches"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.get("", response_model=schemas.PaginatedCatches)
def list_catches(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    query = (
        db.query(models.Catch)
        .join(models.User)
        .order_by(models.Catch.caught_at.desc())
    )
    total = query.count()
    catches = query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for c in catches:
        out = schemas.CatchOut.model_validate(c)
        out.username = c.user.username
        items.append(out)

    return schemas.PaginatedCatches(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total else 0,
    )


@router.post("", response_model=schemas.CatchOut, status_code=status.HTTP_201_CREATED)
async def create_catch(
    species: str = Form(..., max_length=100),
    weight_lbs: Optional[float] = Form(None),
    length_inches: Optional[float] = Form(None),
    water_body: Optional[str] = Form(None, max_length=200),
    caught_at: Optional[str] = Form(None),
    bait_lure: Optional[str] = Form(None, max_length=200),
    technique: Optional[str] = Form(None, max_length=100),
    weather: Optional[str] = Form(None, max_length=50),
    water_temp_f: Optional[float] = Form(None),
    kept: bool = Form(False),
    notes: Optional[str] = Form(None, max_length=2000),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not photo or not photo.filename:
        raise HTTPException(status_code=400, detail="A photo is required")

    photo_url: Optional[str] = None

    if photo and photo.filename:
        if photo.content_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail="Unsupported image type")
        file_bytes = await photo.read()
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large (max 10 MB)")
        storage = get_storage()
        filename = storage.save(file_bytes, photo.filename)
        photo_url = storage.url(filename)

    catch_time = datetime.utcnow()
    if caught_at:
        try:
            catch_time = datetime.fromisoformat(caught_at)
        except ValueError:
            pass

    catch = models.Catch(
        user_id=current_user.id,
        species=species,
        weight_lbs=weight_lbs,
        length_inches=length_inches,
        water_body=water_body,
        caught_at=catch_time,
        bait_lure=bait_lure,
        technique=technique,
        weather=weather,
        water_temp_f=water_temp_f,
        kept=kept,
        notes=notes,
        photo_url=photo_url,
    )
    db.add(catch)
    db.commit()
    db.refresh(catch)

    out = schemas.CatchOut.model_validate(catch)
    out.username = current_user.username
    return out


@router.get("/{catch_id}", response_model=schemas.CatchOut)
def get_catch(catch_id: int, db: Session = Depends(get_db)):
    catch = db.query(models.Catch).filter(models.Catch.id == catch_id).first()
    if not catch:
        raise HTTPException(status_code=404, detail="Catch not found")
    out = schemas.CatchOut.model_validate(catch)
    out.username = catch.user.username

    if catch.weight_lbs is not None:
        best = (
            db.query(func.max(models.Catch.weight_lbs))
            .filter(
                models.Catch.user_id == catch.user_id,
                models.Catch.species == catch.species,
            )
            .scalar()
        )
        out.is_personal_best = catch.weight_lbs >= best

    return out


@router.delete("/{catch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_catch(
    catch_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    catch = db.query(models.Catch).filter(models.Catch.id == catch_id).first()
    if not catch:
        raise HTTPException(status_code=404, detail="Catch not found")
    if catch.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your catch")

    if catch.photo_url:
        storage = get_storage()
        filename = catch.photo_url.rsplit("/", 1)[-1]
        storage.delete(filename)

    db.delete(catch)
    db.commit()
