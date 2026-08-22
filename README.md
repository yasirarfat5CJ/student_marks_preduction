# Student Marks Prediction

This project predicts `final_exam_marks` from student performance features.

For a full component-by-component explanation, technologies used, build flow, deployment notes, and hackathon Q&A, see `PROJECT_COMPLETE_GUIDE.md`.

## How To Run

```bash
python3 app.py
```

The script creates:

- `artifacts/final_model.pkl`: saved preprocessing + model pipeline
- `artifacts/final_report.md`: final explanation report
- `artifacts/*.csv`: model results and analysis tables
- `artifacts/plots/*.png`: EDA plots

## Code Structure

- `app.py`: runs the full pipeline step by step
- `ml_pipeline/config.py`: common settings, feature names, file paths
- `ml_pipeline/preprocessing.py`: cleans and validates the dataset
- `ml_pipeline/visualization.py`: creates EDA graphs
- `ml_pipeline/models.py`: builds and tunes ML models
- `ml_pipeline/evaluation.py`: calculates metrics, CV scores, feature importance
- `ml_pipeline/prediction.py`: loads the saved model and predicts marks
- `ml_pipeline/reporting.py`: writes the final report

## Metrics

- MAE: average error in marks. Lower is better.
- MSE: squared error. Lower is better and large mistakes are punished more.
- RMSE: error in marks, but more sensitive to large mistakes. Lower is better.
- R2: how much variation the model explains compared with predicting the average. Higher is better, but it is not accuracy.

## Current Result

Gradient Boosting is selected because it gives the lowest test error and stable cross-validation performance.

The Dummy Regressor performs worst because it predicts the same average mark for every student.

The Decision Tree overfits because it memorizes training data very well but performs worse on unseen test data.

Random Forest performs well, but its training score is much higher than its test score, so it may overfit slightly.

Linear Regression is strong because the dataset has clear mostly linear relationships between input features and final marks.

## Secure Backend

The secure API is now organized under `backend/app/` and exposed through `api.py`.

Main backend folders:

- `backend/app/core`: environment config, SQLAlchemy database setup, JWT/password security
- `backend/app/models`: SQLAlchemy ORM tables
- `backend/app/schemas`: Pydantic request/response models
- `backend/app/routers`: API endpoints
- `backend/app/services`: authentication and ML prediction services
- `backend/app/dependencies`: JWT current-user and role dependencies
- `backend/scripts`: maintenance scripts such as admin user creation
- `backend/migrations`: Alembic migration files
- `tests`: backend unit tests

## MySQL Setup

Create the database:

```sql
CREATE DATABASE student_prediction;
```

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Example:

```env
DATABASE_URL=mysql+pymysql://USER:PASSWORD@localhost/student_prediction
SECRET_KEY=change-this-secret-at-least-32-bytes-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=http://localhost:5173
```

Never commit `.env`.

## Where Data Is Stored

With the MySQL `DATABASE_URL`, application data is stored inside the MySQL database named `student_prediction`.

Main database tables:

- `users`: registered students and admins
- `student_profiles`: one profile per student user
- `predictions`: prediction history linked to the logged-in user
- `what_if_predictions`: what-if simulator history linked to the logged-in user

If `DATABASE_URL` is not set, the backend defaults to MySQL database `student_prediction` on localhost.

## Admin Login

There is no hardcoded default admin password in the code. Create or update an admin account with:

```bash
ADMIN_NAME="Admin" \
ADMIN_EMAIL="admin@example.com" \
ADMIN_PASSWORD="StrongPassword123" \
python3 backend/scripts/create_admin.py
```

Then use that email and password on the login page. The password is stored only as a bcrypt hash in the `users` table.

## Install Backend Requirements

```bash
python3 -m pip install -r requirements.txt
```

## Run Migrations

```bash
alembic upgrade head
```

For local hackathon development, the API also calls `Base.metadata.create_all()` on startup so tables exist if migrations were not run yet. Production should use Alembic.

## Run FastAPI

```bash
python3 api.py
```

or:

```bash
python3 -m uvicorn backend.app.main:app --reload --port 8000
```

## Authentication Flow

1. Register with `POST /auth/register`.
2. Login with `POST /auth/login`.
3. Store the returned `access_token` in the frontend.
4. Send protected requests with:

```http
Authorization: Bearer <token>
```

JWT payload contains only:

- `sub`: user id
- `role`: student/admin
- `exp`: expiration

Passwords are hashed with bcrypt and never returned by the API.

## Authorization

- Students can access their own profile, predictions, prediction history, and what-if history.
- Admins can access `/admin/users`, `/admin/statistics`, and `/admin/model-metrics`.
- Students receive `403 Forbidden` on admin routes.
- The backend never trusts `user_id` from the frontend for user-specific data.

## Main API Endpoints

Public:

- `POST /auth/register`
- `POST /auth/login`
- `GET /metrics`

Protected:

- `GET /auth/me`
- `GET /students/me`
- `PUT /students/me`
- `POST /predict`
- `GET /predictions/history`
- `POST /what-if`
- `GET /what-if/history`

Admin only:

- `GET /admin/users`
- `GET /admin/statistics`
- `GET /admin/model-metrics`
- `GET /admin/student-categories`

## Example Requests

Register:

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Yasir","email":"yasir@example.com","password":"StrongPassword123"}'
```

Login:

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"yasir@example.com","password":"StrongPassword123"}'
```

Predict:

```bash
curl -X POST http://localhost:8000/predict \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "attendance_pct":90,
    "study_hours_week":15,
    "assignment_score":85,
    "internal_marks":80,
    "prev_sem_cgpa":8.2,
    "activity_score":84
  }'
```

## ML Integration

The backend loads the existing saved pipeline from:

```text
artifacts/final_model.pkl
```

It does not retrain the model during prediction or what-if simulation. Both `/predict` and `/what-if` call the same prediction service and use the same saved preprocessing + model pipeline.

## Frontend Connection

Set the frontend environment:

```env
VITE_API_BASE_URL=http://localhost:8000
```

For protected endpoints, React must include:

```js
Authorization: `Bearer ${token}`
```

## Tests

```bash
pytest -q tests/test_auth_backend.py
```
