from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user, get_optional_user

router = APIRouter(tags=["comments"])


@router.get("/catches/{catch_id}/comments", response_model=list[schemas.CommentOut])
def list_comments(catch_id: int, db: Session = Depends(get_db)):
    catch = db.query(models.Catch).filter(models.Catch.id == catch_id).first()
    if not catch:
        raise HTTPException(status_code=404, detail="Catch not found")

    comments = (
        db.query(models.Comment)
        .filter(models.Comment.catch_id == catch_id)
        .order_by(models.Comment.created_at.asc())
        .all()
    )
    return [
        schemas.CommentOut(
            id=c.id,
            catch_id=c.catch_id,
            user_id=c.user_id,
            username=c.user.username,
            body=c.body,
            created_at=c.created_at,
        )
        for c in comments
    ]


@router.post(
    "/catches/{catch_id}/comments",
    response_model=schemas.CommentOut,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    catch_id: int,
    payload: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not payload.body.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    catch = db.query(models.Catch).filter(models.Catch.id == catch_id).first()
    if not catch:
        raise HTTPException(status_code=404, detail="Catch not found")

    comment = models.Comment(
        catch_id=catch_id,
        user_id=current_user.id,
        body=payload.body.strip(),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return schemas.CommentOut(
        id=comment.id,
        catch_id=comment.catch_id,
        user_id=comment.user_id,
        username=current_user.username,
        body=comment.body,
        created_at=comment.created_at,
    )


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your comment")

    db.delete(comment)
    db.commit()
