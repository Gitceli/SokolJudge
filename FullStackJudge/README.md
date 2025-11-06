# FullStack Judge - Competition Judging System

A real-time judging system for gymnastics/sports competitions with role-based access control and live results visualization.

## 🎯 Features

- **Main Judge Dashboard** - Control which competitor is active
- **Judge Scoring Interface** - Score competitors across 10 rounds
- **Real-time Updates** - All judges see changes within 3-5 seconds (polling)
- **Results Visualization** - Interactive charts and detailed performance breakdowns
- **Role-based Access** - Main judges control flow, regular judges only score

---

## 📋 Table of Contents

1. [Requirements](#requirements)
2. [Installation](#installation)
3. [Network Deployment Setup](#network-deployment-setup)
4. [Running the Application](#running-the-application)
5. [Initial Setup](#initial-setup)
6. [User Guide](#user-guide)
7. [Troubleshooting](#troubleshooting)

---

## 📦 Requirements

### Backend (Django)
- Python 3.8+
- pip
- See `JudgeBack/requirements.txt` for Python packages

### Frontend (React)
- Node.js 16+ and npm
- See `JudgeFront/package.json` for Node packages

---

## 🔧 Installation

### 1. Clone the Repository
```bash
cd /path/to/FullStackJudge
```

### 2. Backend Setup

```bash
# Navigate to backend
cd JudgeBack

# Install Python dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser for admin access
python manage.py createsuperuser
```

### 3. Frontend Setup

```bash
# Navigate to frontend
cd JudgeFront

# Install Node.js dependencies
npm install
```

---

## 🌐 Network Deployment Setup

**This section is CRITICAL if you want judges to connect from phones/other computers!**

### Step 1: Find Your Host Computer's IP Address

**On Linux/Mac:**
```bash
hostname -I | awk '{print $1}'
# Example output: 192.168.1.100
```

**On Windows (PowerShell):**
```powershell
ipconfig | findstr IPv4
# Look for "IPv4 Address" - example: 192.168.1.100
```

**Note:** Your IP will look like `192.168.X.X` or `10.0.X.X`

### Step 2: Update Frontend API Configuration

**⚠️ IMPORTANT:** You MUST update this file before running on network!

Edit `JudgeFront/src/axios.js`:

**BEFORE (localhost only):**
```javascript
const instance = axios.create({
  baseURL: 'http://127.0.0.1:8000/',
});
```

**AFTER (replace with YOUR IP):**
```javascript
const instance = axios.create({
  baseURL: 'http://192.168.1.100:8000/',  // ← Replace with your actual IP!
});
```

### Step 3: Update Backend ALLOWED_HOSTS (Already Configured)

The file `JudgeBack/JudgeBack/settings.py` should have:
```python
ALLOWED_HOSTS = ['*']  # Already set for network access
```

### Step 4: Ensure Firewall Allows Connections

Make sure your firewall allows incoming connections on:
- **Port 8000** (Django backend)
- **Port 5173** (Vite frontend)

**On Linux (UFW):**
```bash
sudo ufw allow 8000
sudo ufw allow 5173
```

**On Windows:**
- Open Windows Defender Firewall
- Add inbound rules for ports 8000 and 5173

---

## 🚀 Running the Application

### Start Backend (Terminal 1)

```bash
cd JudgeBack

# IMPORTANT: Use 0.0.0.0 to bind to all network interfaces
python manage.py runserver 0.0.0.0:8000
```

✅ You should see: `Starting development server at http://0.0.0.0:8000/`

### Start Frontend (Terminal 2)

```bash
cd JudgeFront

# IMPORTANT: Use --host flag for network access
npm run dev -- --host
```

✅ You should see:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.100:5173/
```

### Access URLs

**From Host Computer:**
- Frontend: `http://localhost:5173`
- Backend Admin: `http://localhost:8000/admin`

**From Other Devices (phones/tablets/computers):**
- Frontend: `http://192.168.1.100:5173` (replace with your IP)
- Backend Admin: `http://192.168.1.100:8000/admin`

---

## 🎬 Initial Setup

### 1. Access Django Admin

1. Open `http://192.168.1.100:8000/admin` (replace with your IP)
2. Login with superuser credentials

### 2. Add Competitors

1. Go to **Contesters** → **Add Contester**
2. Fill in:
   - Name, Surname
   - Competitor number (e.g., "101")
   - Group (e.g., "5A")
   - Club (e.g., "SK Ljubljana")
3. Click **Save**
4. Repeat for all competitors

### 3. Set Main Judge

**Option A: Promote Existing Judge**
1. Have someone register as a judge via `/register`
2. Go to **Judges** in admin
3. Edit the judge
4. Check **Is main judge** ✓
5. Click **Save**

**Option B: Create Judge Manually**
1. Go to **Judges** → **Add Judge**
2. Fill in details
3. Check **Is main judge** ✓
4. Link to a User account
5. Click **Save**

### 4. Judge Registration

Have judges access `http://192.168.1.100:5173/register` on their devices:
- They'll self-register with name, surname, password
- System auto-assigns judge numbers (E1, E2, E3, etc.)
- They'll be automatically logged in

---

## 📖 User Guide

### Main Judge Workflow

1. **Login** → Auto-redirected to `/main-judge` dashboard
2. **Select Active Competitor** → Click "Nastavi kot aktivnega" on a competitor
3. All regular judges will see this competitor appear (within 3 seconds)
4. **View Results** → Click "Rezultati" to see live charts

### Regular Judge Workflow

1. **Login** → Auto-redirected to `/score` page
2. **Wait for Active Competitor** → Shows "Ni aktivnega tekmovalca" until main judge selects one
3. **Score Rounds** → Enter score for each round (Skok 1-10), click "Oddaj"
4. **View Results** → Click "Rezultati" to see performance charts

### Results Page (`/rezultati`)

**Overview Tab:**
- Bar charts showing best and average scores
- Click any competitor card to see detailed breakdown

**Individual Competitor View:**
- Line chart showing all judges' scores across rounds
- Detailed table with scores by round and judge
- Statistics: best score, average, total rounds

---

## 🔐 Access Control

| Page | Regular Judge | Main Judge |
|------|--------------|------------|
| `/score` (Scoring) | ✅ Can access | ❌ Redirected to `/main-judge` |
| `/main-judge` (Dashboard) | ❌ Redirected to `/score` | ✅ Can access |
| `/rezultati` (Results) | ✅ Can access | ✅ Can access |

---

## 🐛 Troubleshooting

### Judges Can't Connect from Phones

**Problem:** "Network Error" or can't load page

**Solutions:**
1. ✅ Check you updated `JudgeFront/src/axios.js` with your IP
2. ✅ Verify backend is running with `0.0.0.0:8000` (not `127.0.0.1`)
3. ✅ Verify frontend is running with `--host` flag
4. ✅ All devices must be on **same WiFi network**
5. ✅ Check firewall allows ports 8000 and 5173
6. ✅ Try accessing `http://YOUR-IP:8000/admin` from phone - if this fails, it's a network issue

### Main Judge Can't Set Active Competitor

**Problem:** 403 Forbidden or "Permission denied"

**Solution:**
- Go to Django admin
- Edit the judge's profile
- Make sure **"Is main judge"** is checked ✓
- Save and have them log out and back in

### Scores Not Appearing in Real-time

**This is expected behavior!**
- System uses **polling**, not WebSockets
- Updates happen every **3-5 seconds**
- Wait a few seconds and the page will auto-refresh

### Can't Edit/Delete Submitted Score

**This is by design!**
- Scores are permanent once submitted
- Prevents cheating/tampering
- To fix errors: Use Django admin to manually edit `JudgeRating` entries

### "Ni aktivnega tekmovalca" Forever

**Solutions:**
1. Main judge must click "Nastavi kot aktivnega" on a competitor
2. Check competitor exists in database (Django admin → Contesters)
3. Regular judges wait 3 seconds for polling to update

### Charts Empty on Results Page

**Solutions:**
1. Have judges submit some test scores first
2. Check `/api/contesters/results/` endpoint in browser - should return data
3. Clear browser cache and reload

---

## 📊 System Architecture

### Backend (Django REST Framework)
- **Database:** SQLite (default) - stores judges, competitors, ratings
- **API:** RESTful endpoints at `/api/`
- **Authentication:** Token-based (stored in `localStorage`)

### Frontend (React + Vite)
- **State Management:** React `useState` and `localStorage`
- **Charts:** Recharts library
- **Polling:** `setInterval` for real-time updates
- **Styling:** Tailwind CSS

### Real-time Mechanism
- **NOT WebSocket** - uses HTTP polling
- Active competitor changes: Polled every **3 seconds**
- Results updates: Polled every **5 seconds**
- Trade-off: Simple implementation, slight delay vs. true real-time

---

## 🔑 Important API Endpoints

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/api/token-auth/` | POST | Public | Login (returns token) |
| `/api/auth/register/` | POST | Public | Judge self-registration |
| `/api/auth/me/` | GET | Authenticated | Get current judge info |
| `/api/contesters/` | GET | Main Judge | List all competitors |
| `/api/contesters/active/` | GET | All Judges | Get active competitor |
| `/api/contesters/{id}/set_active/` | POST | Main Judge | Set active competitor |
| `/api/contesters/results/` | GET | All Judges | Get all results/statistics |
| `/api/ratings/` | GET/POST | All Judges | View own ratings or submit new |

---

## 📝 Database Schema

### Judge
- `id`, `name`, `surname`, `judge_number` (e.g., "E1")
- `is_main_judge` (Boolean)
- `user` (OneToOne with Django User)

### Contester
- `id`, `name`, `surname`, `competitor_number`, `group`, `club`
- `active` (Boolean) - only one can be active at a time
- `HD`, `Tof`, `D`, `P` (scoring category fields)

### JudgeRating
- `id`, `contester` (FK), `judge` (FK)
- `round_number` (1-10)
- `score` (Float)
- `timestamp`
- **Unique constraint:** (contester, judge, round_number) - prevents duplicate scoring

---

## 🛠️ Development Notes

### Quick IP Change Script

If you need to change IPs frequently, create this helper script:

**`update-ip.sh`** (Linux/Mac):
```bash
#!/bin/bash
NEW_IP=$1
sed -i "s|baseURL: 'http://[0-9.]*:8000/'|baseURL: 'http://$NEW_IP:8000/'|" JudgeFront/src/axios.js
echo "Updated axios.js to use IP: $NEW_IP"
```

Usage:
```bash
chmod +x update-ip.sh
./update-ip.sh 192.168.1.100
```

### Testing Locally (Single Machine)

If testing on one computer only:
1. Keep `baseURL: 'http://127.0.0.1:8000/'` in axios.js
2. Backend: `python manage.py runserver` (no 0.0.0.0 needed)
3. Frontend: `npm run dev` (no --host needed)

---

## 📞 Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review Django logs in Terminal 1
3. Check browser console for frontend errors (F12)

---

## 📄 License

[Add your license here]

---

**Built with Django REST Framework, React, and Recharts**
