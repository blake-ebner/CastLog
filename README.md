# CastLog

A full-stack fishing catch-logging app built with FastAPI + React.

## Stack

- **Backend**: Python 3.12 · FastAPI · SQLAlchemy · Alembic
- **Database**: PostgreSQL 16
- **Auth**: JWT (python-jose + bcrypt)
- **File storage**: Local volume (`/uploads`), abstracted for easy S3 swap
- **Frontend**: React 18 · TypeScript · Vite · Tailwind CSS *(coming soon)*
- **Containerization**: Docker + Docker Compose

---

## Quick start

### 1. Clone & configure

```bash
git clone <repo-url>
cd CastLog
# Edit .env — set SECRET_KEY to a long random string
```

### 2. Build & start services

```bash
docker compose up --build
```

### 3. Run database migrations

```bash
docker compose exec backend alembic upgrade head
```

The API is now live at **http://localhost:8000**.
Interactive docs: **http://localhost:8000/docs**

---

## API reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Create account, returns JWT |
| POST | `/auth/login` | — | Login, returns JWT |
| GET | `/catches` | — | Paginated public feed |
| POST | `/catches` | ✓ | Log a new catch (multipart) |
| GET | `/catches/{id}` | — | Single catch detail |
| DELETE | `/catches/{id}` | ✓ owner | Delete a catch |
| GET | `/users/{id}` | — | User profile + stats |
| GET | `/users/{id}/catches` | — | User's catch feed |
| GET | `/users/me/profile` | ✓ | Logged-in user's profile |

Query params for feed endpoints: `?page=1&page_size=20`

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://castlog:castlog@db:5432/castlog` | Postgres connection string |
| `SECRET_KEY` | `changeme-insecure-default` | JWT signing secret — **change in production** |
| `UPLOAD_DIR` | `/uploads` | Where photo files are stored |
| `BASE_URL` | `http://localhost:8000` | Used to build photo URLs |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |

---

## Swapping to S3

Photo storage is isolated in `backend/app/storage.py`.
Implement an `S3Storage` class with the same `save()` / `delete()` / `url()` interface,
then swap the return value of `get_storage()`. No other files need changing.
