from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.security import create_access_token, hash_password, verify_password
from backend.app.models.student_profile import StudentProfile
from backend.app.models.user import User
from backend.app.schemas.auth import LoginRequest, RegisterRequest


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def register_student(db: Session, payload: RegisterRequest) -> User:
    user = User(
        name=payload.name.strip(),
        email=payload.email,
        password_hash=hash_password(payload.password),
        role="student",
        is_active=True,
    )
    db.add(user)
    db.flush()
    db.add(StudentProfile(user_id=user.id))
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, payload: LoginRequest) -> tuple[User | None, str | None]:
    user = get_user_by_email(db, payload.email)
    if user is None or not verify_password(payload.password, user.password_hash) or not user.is_active:
        return None, None
    token = create_access_token(user.id, user.role)
    return user, token
