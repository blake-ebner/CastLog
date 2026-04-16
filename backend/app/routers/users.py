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
    species_set = {c.species for c in catches}
    species_count = len(species_set)
    best = max((c.weight_lbs for c in catches if c.weight_lbs), default=None)

    # Per-species personal bests
    species_best: dict[str, tuple[float, int]] = {}
    for c in catches:
        if c.weight_lbs is not None:
            if c.species not in species_best or c.weight_lbs > species_best[c.species][0]:
                species_best[c.species] = (c.weight_lbs, c.id)
    species_records = [
        schemas.SpeciesRecord(species=s, weight_lbs=w, catch_id=cid)
        for s, (w, cid) in sorted(species_best.items(), key=lambda x: x[1][0], reverse=True)
    ]

    # Achievements
    max_weight = best or 0
    achievements = [
        schemas.Achievement(
            id="catches_1", name="First Cast",
            description="Log your first catch", unlocked=total >= 1,
        ),
        schemas.Achievement(
            id="catches_10", name="Getting Started",
            description="Log 10 catches", unlocked=total >= 10,
        ),
        schemas.Achievement(
            id="catches_100", name="Century Club",
            description="Log 100 catches", unlocked=total >= 100,
        ),
        schemas.Achievement(
            id="catches_1000", name="Legend",
            description="Log 1,000 catches", unlocked=total >= 1000,
        ),
        schemas.Achievement(
            id="weight_5", name="5 Pounder",
            description="Catch a fish weighing 5+ lbs", unlocked=max_weight >= 5,
        ),
        schemas.Achievement(
            id="weight_10", name="10 Pounder",
            description="Catch a fish weighing 10+ lbs", unlocked=max_weight >= 10,
        ),
        schemas.Achievement(
            id="weight_50", name="50 Pounder",
            description="Catch a fish weighing 50+ lbs", unlocked=max_weight >= 50,
        ),
        schemas.Achievement(
            id="weight_100", name="Centurion",
            description="Catch a fish weighing 100+ lbs", unlocked=max_weight >= 100,
        ),
        schemas.Achievement(
            id="species_5", name="Variety Pack",
            description="Catch 5 different species", unlocked=species_count >= 5,
        ),
        schemas.Achievement(
            id="species_10", name="Species Hunter",
            description="Catch 10 different species", unlocked=species_count >= 10,
        ),
        schemas.Achievement(
            id="species_25", name="Explorer",
            description="Catch 25 different species", unlocked=species_count >= 25,
        ),
        schemas.Achievement(
            id="species_100", name="Master Angler",
            description="Catch 100 different species", unlocked=species_count >= 100,
        ),
    ]

    return schemas.UserStats(
        total_catches=total,
        species_count=species_count,
        personal_best_lbs=best,
        species_records=species_records,
        achievements=achievements,
    )


@router.get("/search", response_model=schemas.UserSearchResult)
def search_users(q: str = "", db: Session = Depends(get_db)):
    if not q or len(q.strip()) < 1:
        return schemas.UserSearchResult(users=[])
    results = (
        db.query(models.User)
        .filter(models.User.username.ilike(f"%{q.strip()}%"))
        .limit(20)
        .all()
    )
    return schemas.UserSearchResult(users=[schemas.UserOut.model_validate(u) for u in results])


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
