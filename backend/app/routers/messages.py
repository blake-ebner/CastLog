from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/messages", tags=["messages"])


def _are_friends(user_a: int, user_b: int, db: Session) -> bool:
    return db.query(models.Friendship).filter(
        models.Friendship.status == "accepted",
        or_(
            and_(models.Friendship.requester_id == user_a, models.Friendship.addressee_id == user_b),
            and_(models.Friendship.requester_id == user_b, models.Friendship.addressee_id == user_a),
        ),
    ).first() is not None


@router.get("/conversations", response_model=list[schemas.ConversationSummary])
def list_conversations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = current_user.id

    # All accepted friends
    friendships = db.query(models.Friendship).filter(
        models.Friendship.status == "accepted",
        or_(
            models.Friendship.requester_id == uid,
            models.Friendship.addressee_id == uid,
        ),
    ).all()

    friend_ids = [
        f.addressee_id if f.requester_id == uid else f.requester_id
        for f in friendships
    ]

    conversations = []
    for fid in friend_ids:
        last = (
            db.query(models.Message)
            .filter(
                or_(
                    and_(models.Message.sender_id == uid, models.Message.receiver_id == fid),
                    and_(models.Message.sender_id == fid, models.Message.receiver_id == uid),
                )
            )
            .order_by(models.Message.created_at.desc())
            .first()
        )
        if last is None:
            continue

        friend = db.get(models.User, fid)
        conversations.append(
            schemas.ConversationSummary(
                friend=schemas.UserOut.model_validate(friend),
                last_message=schemas.MessageOut.model_validate(last),
                unread_count=0,
            )
        )

    conversations.sort(key=lambda c: c.last_message.created_at, reverse=True)
    return conversations


@router.get("/{user_id}", response_model=list[schemas.MessageOut])
def get_conversation(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _are_friends(current_user.id, user_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not friends")

    messages = (
        db.query(models.Message)
        .filter(
            or_(
                and_(models.Message.sender_id == current_user.id, models.Message.receiver_id == user_id),
                and_(models.Message.sender_id == user_id, models.Message.receiver_id == current_user.id),
            )
        )
        .order_by(models.Message.created_at.asc())
        .all()
    )
    return messages


@router.post("/{user_id}", response_model=schemas.MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    user_id: int,
    payload: schemas.MessageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot message yourself")

    target = db.get(models.User, user_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not _are_friends(current_user.id, user_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not friends")

    body = payload.body.strip()
    if not body:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")

    msg = models.Message(sender_id=current_user.id, receiver_id=user_id, body=body)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    msg = db.get(models.Message, message_id)
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your message")
    from datetime import datetime, timedelta
    if datetime.utcnow() - msg.created_at > timedelta(minutes=10):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Messages can only be deleted within 10 minutes of sending")
    db.delete(msg)
    db.commit()
