# Frontend Setup Guide

## 📦 Dependencies

All dependencies are listed in `package.json`. The main packages are:

### Core Dependencies
- **React 19.1.0** - UI library
- **React Router 7.6.2** - Client-side routing
- **Axios 1.9.0** - HTTP client for API calls
- **Recharts** - Charting library for results visualization
- **Tailwind CSS 4.1.14** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives

### Full Dependency List
See `package.json` for complete list.

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 16+ ([Download here](https://nodejs.org/))
- npm (comes with Node.js)

### Step 1: Install Dependencies

```bash
cd JudgeFront
npm install
```

This will install all packages listed in `package.json`.

### Step 2: Configure Backend API URL

**⚠️ CRITICAL for Network Deployment!**

Edit `src/axios.js` and update the `baseURL`:

**For localhost testing (single computer):**
```javascript
const instance = axios.create({
  baseURL: 'http://127.0.0.1:8000/',
});
```

**For network deployment (multiple devices):**
```javascript
const instance = axios.create({
  baseURL: 'http://192.168.1.100:8000/',  // Replace with YOUR computer's IP
});
```

To find your IP:
- **Linux/Mac:** `hostname -I | awk '{print $1}'`
- **Windows:** `ipconfig | findstr IPv4`

### Step 3: Run Development Server

**For localhost only:**
```bash
npm run dev
```

**For network access (phones/tablets can connect):**
```bash
npm run dev -- --host
```

You should see:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.100:5173/
```

Share the **Network** URL with judges on other devices!

---

## 📁 Project Structure

```
JudgeFront/
├── src/
│   ├── pages/
│   │   ├── Login.jsx              # Judge login
│   │   ├── Register.jsx           # Judge self-registration
│   │   ├── ActiveScoring.jsx      # Regular judge scoring interface
│   │   ├── MainJudgeDashboard.jsx # Main judge control panel
│   │   └── Rezultati.jsx          # Results visualization with charts
│   │
│   ├── components/                # Reusable UI components
│   │   ├── JudgeScoringForm.jsx
│   │   ├── JudgeRegisterForm.jsx
│   │   └── ui/                    # Radix UI components
│   │
│   ├── axios.js                   # API client configuration ⚠️ UPDATE THIS
│   ├── main.jsx                   # App entry point with routing
│   ├── App.jsx                    # Root component
│   └── index.css                  # Tailwind CSS imports
│
├── package.json                   # Dependencies & scripts
├── vite.config.js                 # Vite bundler config
├── tailwind.config.js             # Tailwind CSS config
└── index.html                     # HTML entry point
```

---

## 🔧 Available Scripts

Defined in `package.json`:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (localhost only) |
| `npm run dev -- --host` | Start dev server with network access |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint code linter |

---

## 🌐 Network Deployment Checklist

Before judges connect from phones/tablets:

- [ ] Update `src/axios.js` with your computer's IP address
- [ ] Run backend with `python manage.py runserver 0.0.0.0:8000`
- [ ] Run frontend with `npm run dev -- --host`
- [ ] Ensure all devices are on **same WiFi network**
- [ ] Share the Network URL (e.g., `http://192.168.1.100:5173`) with judges
- [ ] Test by accessing the URL from a phone/tablet

---

## 🔐 Key Configuration Files

### `src/axios.js` - API Configuration
**Purpose:** Configure backend API URL and authentication

**Important settings:**
- `baseURL` - **MUST** match your backend server address
- Token authentication - Auto-attaches auth token to requests
- 401 redirect - Auto-logs out users when token expires

### `src/main.jsx` - Routing & Access Control
**Routes:**
- `/` - Smart redirect (main judge → dashboard, regular → scoring)
- `/login` - Login page
- `/register` - Judge self-registration
- `/score` - Regular judge scoring (protected, main judges redirected)
- `/main-judge` - Main judge dashboard (protected, regular judges redirected)
- `/rezultati` - Results page (all judges can access)

**Route Guards:**
- `ProtectedRoute` - Requires authentication
- `MainJudgeRoute` - Requires `is_main_judge = true`
- `RegularJudgeRoute` - Requires `is_main_judge = false`

---

## 🎨 Styling

This project uses **Tailwind CSS** for styling:
- Utility-first CSS classes
- Responsive design (works on phones, tablets, desktop)
- Dark mode not currently implemented
- Custom animations via `tailwindcss-animate`

To customize colors/styles, edit `tailwind.config.js`.

---

## 📊 Real-time Updates

The app uses **HTTP polling** (not WebSockets):

**ActiveScoring.jsx:**
- Polls `/api/contesters/active/` every **3 seconds**
- Detects when main judge changes active competitor
- Auto-resets scores when competitor changes

**Rezultati.jsx:**
- Polls `/api/contesters/results/` every **5 seconds**
- Updates charts with new scores in real-time
- Updates happen without page refresh

To change polling intervals, edit the `setInterval` values in the respective files.

---

## 🐛 Troubleshooting

### "Network Error" when judges connect

**Problem:** Cannot reach backend API

**Solutions:**
1. ✅ Check `src/axios.js` has correct IP (not `127.0.0.1`)
2. ✅ Verify backend is running with `0.0.0.0:8000`
3. ✅ All devices must be on same WiFi
4. ✅ Firewall must allow port 8000

### Build fails with dependency errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Charts not displaying

**Possible causes:**
- Recharts not installed: `npm install recharts`
- No data from API: Check browser console (F12)
- API returns empty array: Submit some test scores first

### Page won't load on phone

1. Check phone is on same WiFi as host computer
2. Verify you're using Network URL (not localhost)
3. Try accessing `http://YOUR-IP:5173/login` directly
4. Check browser console for errors

---

## 📱 Browser Compatibility

**Tested and working:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Chrome (Android)
- ✅ Mobile Safari (iOS)

**Not supported:**
- ❌ Internet Explorer 11
- ❌ Very old mobile browsers

---

## 🔄 Updating Dependencies

To update all dependencies to latest versions:

```bash
# Check for outdated packages
npm outdated

# Update all to latest (use with caution)
npm update

# Update specific package
npm install react@latest
```

**Warning:** Major version updates may break compatibility. Test thoroughly!

---

## 📝 Adding New Features

### Adding a new page:

1. Create component in `src/pages/YourPage.jsx`
2. Import in `src/main.jsx`
3. Add route:
```javascript
<Route path="/your-page" element={<ProtectedRoute><YourPage /></ProtectedRoute>} />
```

### Adding a new API endpoint:

1. Update `src/axios.js` if needed
2. Call in component:
```javascript
const response = await axios.get('/api/your-endpoint/');
```

---

## 🚀 Production Build

To create optimized production build:

```bash
npm run build
```

This creates a `dist/` folder with optimized static files. Serve with:

```bash
npm run preview
```

For production deployment, use a web server like:
- **Nginx**
- **Apache**
- **Netlify** (static hosting)
- **Vercel** (static hosting)

---

## 📞 Support

For issues:
1. Check browser console (F12) for errors
2. Verify backend API is accessible
3. Check network connectivity
4. Review main [README.md](../README.md) for full setup guide

---

**Built with React + Vite + Tailwind CSS**
