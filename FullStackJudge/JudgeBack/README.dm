# 📝 Full Stack Django + React — Console Command Cheat Sheet

## 🐍 Python / Django side
_Run these inside your **backend** folder._

```bash
# 1. Activate virtual environment
conda activate djangoenv

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Create new Django app
python manage.py startapp app_name

# 4. Make migrations (when models change)
python manage.py makemigrations
python manage.py migrate

# 5. Create superuser (admin account)
python manage.py createsuperuser

# 6. Run local dev server
python manage.py runserver
