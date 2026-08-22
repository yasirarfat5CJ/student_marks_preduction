from getpass import getpass
import os
from pathlib import Path
import sys


ROOT_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT_DIR))

from backend.app.core.database import Base, SessionLocal, engine  # noqa: E402
from backend.app.core.security import hash_password  # noqa: E402
from backend.app.models.prediction import Prediction  # noqa: F401, E402
from backend.app.models.student_profile import StudentProfile  # noqa: F401, E402
from backend.app.models.user import User  # noqa: E402
from backend.app.models.what_if import WhatIfPrediction  # noqa: F401, E402


def read_value(name: str, prompt: str, secret: bool = False) -> str:
    env_value = os.getenv(name)
    if env_value:
        return env_value.strip()

    reader = getpass if secret else input
    return reader(prompt).strip()


def main() -> None:
    Base.metadata.create_all(bind=engine)

    name = read_value("ADMIN_NAME", "Admin name: ") or "Admin"
    email = read_value("ADMIN_EMAIL", "Admin email: ").lower()
    password = read_value("ADMIN_PASSWORD", "Admin password: ", secret=True)

    if not email or not password:
        raise SystemExit("Admin email and password are required.")

    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.name = name
            user.password_hash = hash_password(password)
            user.role = "admin"
            user.is_active = True
            action = "Updated"
        else:
            user = User(
                name=name,
                email=email,
                password_hash=hash_password(password),
                role="admin",
                is_active=True,
            )
            db.add(user)
            action = "Created"

        db.commit()

    print(f"{action} admin user: {email}")


if __name__ == "__main__":
    main()
