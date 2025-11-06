# Sokol Judge - Gymnastics Judging System

A full-stack web application for managing gymnastics competitions with real-time judging, scoring, and results tracking.

## Project Structure

```
Sokol/
├── FullStackJudge/
│   ├── JudgeBack/          # Django REST API Backend
│   └── JudgeFront/         # React + Vite Frontend
```

## Tech Stack

### Backend
- Python 3.8+
- Django 5.0
- Django REST Framework 3.15
- SQLite (default) / PostgreSQL support
- CORS enabled for frontend communication

### Frontend
- React 19
- Vite 6
- Tailwind CSS 4
- React Router DOM
- Axios for API calls
- Recharts for data visualization
- ExcelJS for exports

## Prerequisites

Before starting, ensure you have the following installed:
- **Python 3.8+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 18+** and npm - [Download Node.js](https://nodejs.org/)
- **Git** - [Download Git](https://git-scm.com/downloads/)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Gitceli/SokolJudge.git
cd SokolJudge
```

### 2. Backend Setup (Django)

#### Step 1: Navigate to Backend Directory
```bash
cd FullStackJudge/JudgeBack
```

#### Step 2: Create Virtual Environment
**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**On macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

#### Step 4: Run Database Migrations
```bash
python manage.py migrate
```

#### Step 5: Create Admin User (Optional but Recommended)
```bash
python manage.py createsuperuser
```
Follow the prompts to create an admin account.

#### Step 6: Start Backend Server
**For local development:**
```bash
python manage.py runserver
```

**For network access (access from other devices):**
```bash
python manage.py runserver 0.0.0.0:8000
```

The backend will be running at `http://localhost:8000` (or your network IP:8000)

### 3. Frontend Setup (React + Vite)

#### Step 1: Open New Terminal and Navigate to Frontend Directory
```bash
cd FullStackJudge/JudgeFront
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Configure API Endpoint (if needed)
Check [src/axios.js](FullStackJudge/JudgeFront/src/axios.js) and ensure the baseURL points to your backend:
```javascript
baseURL: 'http://localhost:8000/api/'  // Update if backend is on different host/port
```

#### Step 4: Start Development Server
```bash
npm run dev
```

The frontend will be running at `http://localhost:5173`

## Running the Full Application

### Quick Start (Development)

1. **Terminal 1 - Backend:**
   ```bash
   cd FullStackJudge/JudgeBack
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   cd FullStackJudge/JudgeFront
   npm run dev
   ```

3. **Access the Application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000/api/
   - Django Admin: http://localhost:8000/admin/

## Features

- **Judge Registration & Authentication** - Token-based authentication system
- **Active Scoring** - Real-time scoring interface for judges
- **Difficulty Scoring** - Separate difficulty assessment module
- **Results Dashboard** - Comprehensive results viewing and analysis
- **Data Export** - Excel export functionality for results
- **Main Judge Dashboard** - Administrative controls and overview
- **Responsive UI** - Modern, mobile-friendly interface with Tailwind CSS

## Production Deployment

### Backend Production
1. Update `settings.py` for production:
   - Set `DEBUG = False`
   - Configure `ALLOWED_HOSTS`
   - Use PostgreSQL or MySQL instead of SQLite
   - Set secure `SECRET_KEY`

2. Use production server:
   ```bash
   pip install gunicorn
   gunicorn JudgeBack.wsgi:application
   ```

### Frontend Production
```bash
npm run build
```
Deploy the `dist/` directory to your web server (Netlify, Vercel, etc.)

## Troubleshooting

### Backend Issues
- **Port already in use:** Change port with `python manage.py runserver 8001`
- **Database errors:** Delete `db.sqlite3` and run `python manage.py migrate` again
- **Module not found:** Ensure virtual environment is activated and dependencies installed

### Frontend Issues
- **CORS errors:** Ensure `django-cors-headers` is configured in backend settings
- **API connection failed:** Check backend is running and URL in `axios.js` is correct
- **npm install fails:** Try deleting `node_modules` and `package-lock.json`, then run `npm install` again

## Development Tools

### Backend
- Django Admin Panel: http://localhost:8000/admin/
- API Documentation: Available through Django REST Framework browsable API

### Frontend
- ESLint for code linting: `npm run lint`
- Build preview: `npm run preview`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues, questions, or contributions, please contact the repository maintainer or open an issue on GitHub.

---

**Built with ❤️ for gymnastics competitions**
