from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/friends", tags=["friends"])


def _get_friendship(user_a: int, user_b: int, db: Session):
    """Return the Friendship row between two users regardless of direction, or None."""
    return db.query(models.Friendship).filter(
        or_(
            and_(models.Friendship.requester_id == user_a, models.Friendship.addressee_id == user_b),
            and_(models.Friendship.requester_id == user_b, models.Friendship.addressee_id == user_a),
        )
    ).first()


@router.get("/status/{user_id}", response_model=schemas.FriendshipStatus)
def get_friendship_status(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_id == current_user.id:
        return schemas.FriendshipStatus(status="self")

    row = _get_friendship(current_user.id, user_id, db)
    if row is None:
        return schemas.FriendshipStatus(status="none")
    if row.status == "accepted":
        return schemas.FriendshipStatus(status="friends", request_id=row.id)
    # pending
    if row.requester_id == current_user.id:
        return schemas.FriendshipStatus(status="pending_sent", request_id=row.id)
    return schemas.FriendshipStatus(status="pending_received", request_id=row.id)


@router.get("", response_model=schemas.FriendData)
def get_friends(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = current_user.id

    accepted = db.query(models.Friendship).filter(
        models.Friendship.status == "accepted",
        or_(models.Friendship.requester_id == uid, models.Friendship.addressee_id == uid),
    ).all()

    friends: list[schemas.UserOut] = []
    for row in accepted:
        other_id = row.addressee_id if row.requester_id == uid else row.requester_id
        other = db.query(models.User).filter(models.User.id == other_id).first()
        if other:
            friends.append(schemas.UserOut.model_validate(other))

    incoming_rows = db.query(models.Friendship).filter(
        models.Friendship.addressee_id == uid,
        models.Friendship.status == "pending",
    ).all()
    incoming = [
        schemas.FriendRequestOut(
            id=row.id,
            user=schemas.UserOut.model_validate(row.requester),
            created_at=row.created_at,
        )
        for row in incoming_rows
    ]

    outgoing_rows = db.query(models.Friendship).filter(
        models.Friendship.requester_id == uid,
        models.Friendship.status == "pending",
    ).all()
    outgoing = [
        schemas.FriendRequestOut(
            id=row.id,
            user=schemas.UserOut.model_validate(row.addressee),
            created_at=row.created_at,
        )
        for row in outgoing_rows
    ]

    return schemas.FriendData(friends=friends, incoming_requests=incoming, outgoing_requests=outgoing)


@router.post("/request/{user_id}", status_code=status.HTTP_201_CREATED)
def send_friend_request(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot send a friend request to yourself")

    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = _get_friendship(current_user.id, user_id, db)
    if existing:
        if existing.status == "accepted":
            raise HTTPException(status_code=400, detail="Already friends")
        raise HTTPException(status_code=400, detail="Friend request already exists")

    row = models.Friendship(requester_id=current_user.id, addressee_id=user_id)
    db.add(row)
    db.commit()
    return {"detail": "Friend request sent"}


@router.post("/accept/{request_id}")
def accept_friend_request(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.query(models.Friendship).filter(models.Friendship.id == request_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Friend request not found")
    if row.addressee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your request to accept")
    if row.status != "pending":
        raise HTTPException(status_code=400, detail="Request is not pending")

    row.status = "accepted"
    db.commit()
    return {"detail": "Friend request accepted"}


@router.post("/decline/{request_id}")
def decline_friend_request(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.query(models.Friendship).filter(models.Friendship.id == request_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Friend request not found")
    if row.addressee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your request to decline")
    if row.status != "pending":
        raise HTTPException(status_code=400, detail="Request is not pending")

    db.delete(row)
    db.commit()
    return {"detail": "Friend request declined"}


@router.delete("/request/{request_id}")
def cancel_friend_request(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.query(models.Friendship).filter(models.Friendship.id == request_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Friend request not found")
    if row.requester_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your request to cancel")
    if row.status != "pending":
        raise HTTPException(status_code=400, detail="Request is not pending")

    db.delete(row)
    db.commit()
    return {"detail": "Friend request cancelled"}


@router.delete("/{user_id}")
def remove_friend(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = _get_friendship(current_user.id, user_id, db)
    if not row or row.status != "accepted":
        raise HTTPException(status_code=404, detail="Not friends with this user")

    db.delete(row)
    db.commit()
    return {"detail": "Friend removed"}
