from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.dependencies.auth import require_student_or_admin
from backend.app.models.student_profile import StudentProfile
from backend.app.models.user import User
from backend.app.schemas.student import StudentProfileResponse, StudentProfileUpdate


router = APIRouter(prefix="/students", tags=["students"])


def get_or_create_profile(db: Session, user_id: int) -> StudentProfile:
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if profile is None:
        profile = StudentProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("/me", response_model=StudentProfileResponse)
def get_my_profile(
    current_user: Annotated[User, Depends(require_student_or_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    return get_or_create_profile(db, current_user.id)


@router.put("/me", response_model=StudentProfileResponse)
def update_my_profile(
    payload: StudentProfileUpdate,
    current_user: Annotated[User, Depends(require_student_or_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    profile = get_or_create_profile(db, current_user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile
