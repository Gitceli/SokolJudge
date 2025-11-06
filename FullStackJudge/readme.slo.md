
---

# README.sl.md (Slovene)

```md
# JudgeBotSolol — Aplikacija za sojenje (gimnastika)

Polna (full‑stack) aplikacija, kjer se **sodniki registrirajo, prijavijo in oddajajo točke** za **trenutno aktivnega tekmovalca**.  
Administrator označi aktivnega tekmovalca; vsak sodnik lahko vnese **do 10 krogov/skokov** in **istega kroga ne more oddati dvakrat**.

## Funkcionalnosti
- Registracija sodnika z avtomatsko prijavo (DRF Token)
- (Neobvezno) Samodejno ustvarjeno uporabniško ime iz imena in priimka
- Prikaz imena sodnika in aktivnega tekmovalca
- 10 krogov na tekmovalca, zaščita pred dvojnimi oddajami (DB + UI)
- Animacija ✓ ob uspehu, trajna prijava (localStorage)

## Struktura repozitorija (dev)
- `backend/` — Django + DRF API
- `frontend/` — React + Vite + Tailwind
- `requirements/` — seznami za namestitev Python & Node

## 1) Backend — Namestitev
```bash
cd backend
python -m venv .venv
source .venv/bin/activate             # Windows: .venv\Scripts\activate
pip install -r ../requirements/python/requirements.in

# (neobvezno) Zakleni verzije:
pip freeze > ../requirements/python/requirements.txt

# Django nastavitve:
# INSTALLED_APPS += ['rest_framework', 'rest_framework.authtoken', 'corsheaders', 'django_py']
# MIDDLEWARE: dodaj 'corsheaders.middleware.CorsMiddleware' visoko v seznam
# CORS_ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]

python manage.py migrate
python manage.py runserver 0.0.0.0:8000
