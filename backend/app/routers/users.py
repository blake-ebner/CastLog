from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


def _build_stats(user_id: int, db: Session) -> schemas.UserStats:
    catches = db.query(models.Catch).filter(models.Catch.user_id == user_id).all()
    total = len(catches)
    species = len({c.species for c in catches})
    best = max((c.weight_lbs for c in catches if c.weight_lbs), default=None)
    return schemas.UserStats(total_catches=total, species_count=species, personal_best_lbs=best)


@router.get("/{user_id}", response_model=schemas.UserProfile)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    stats = _build_stats(user_id, db)
    return schemas.UserProfile(user=schemas.UserOut.model_validate(user), stats=stats)


@router.get("/{user_id}/catches", response_model=schemas.PaginatedCatches)
def get_user_catches(
    user_id: int,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    query = (
        db.query(models.Catch)
        .filter(models.Catch.user_id == user_id)
        .order_by(models.Catch.caught_at.desc())
    )
    total = query.count()
    catches = query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for c in catches:
        out = schemas.CatchOut.model_validate(c)
        out.username = user.username
        items.append(out)

    import math
    return schemas.PaginatedCatches(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total else 0,
    )


@router.get("/me/profile", response_model=schemas.UserProfile)
def get_my_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stats = _build_stats(current_user.id, db)
    return schemas.UserProfile(
        user=schemas.UserOut.model_validate(current_user),
        stats=stats,
    )
