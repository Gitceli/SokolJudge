# JudgeBotSolol — Gymnastics Judging App

A full‑stack app where **judges register, log in, and submit scores** for the **currently active competitor**.  
Admins mark which competitor is active; each judge can enter **up to 10 round/jump scores** and **cannot resubmit the same round**.

## Features
- Judge registration with auto‑login (DRF Token)
- (Optional) Auto‑generated username from first/last name
- Show judge name + active competitor
- 10 rounds per competitor, duplicate‑proof (DB + UI)
- Success ✓ animation, persistent login (localStorage)

## Repo layout (dev)
- `backend/` — Django + DRF API
- `frontend/` — React + Vite + Tailwind
- `requirements/` — Python & Node install lists

## 1) Backend — Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate             # Windows: .venv\Scripts\activate
pip install -r ../requirements/python/requirements.in

# (optional) Make a lockfile:
pip freeze > ../requirements/python/requirements.txt

# Configure Django:
# INSTALLED_APPS += ['rest_framework', 'rest_framework.authtoken', 'corsheaders', 'django_py']
# MIDDLEWARE: add 'corsheaders.middleware.CorsMiddleware' near the top
# CORS_ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]

python manage.py migrate
python manage.py runserver 0.0.0.0:8000
