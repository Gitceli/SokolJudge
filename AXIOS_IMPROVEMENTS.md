# Axios Configuration Improvements

This document summarizes all improvements made to the axios HTTP client configuration for the Sokol Judge application.

## Changes Made

### 1. ✅ Fixed Base URL Configuration

**Before:**
```javascript
baseURL: 'http://127.0.0.1:8000/'
```

**After:**
```javascript
baseURL: `${getApiUrl()}/api/`
```

**Benefits:**
- Automatically includes `/api/` in all requests
- Cleaner component code (no need to repeat `/api/` everywhere)
- Dynamic URL based on environment

### 2. ✅ Environment Variable Support

Created `.env.local` file for easy configuration:

```bash
# For localhost
VITE_API_URL=http://localhost:8000

# For LAN access
VITE_API_URL=http://192.168.1.100:8000
```

**Benefits:**
- Easy switching between localhost and network access
- No code changes needed for different environments
- Supports multiple developers with different IP addresses

### 3. ✅ Enhanced Error Handling

Added `getErrorMessage()` helper function with:
- User-friendly Slovenian error messages
- Specific messages for different HTTP status codes (400, 401, 403, 404, 500, etc.)
- Network error detection
- Backend error message parsing

**Example Usage:**
```javascript
catch (error) {
  setError(getErrorMessage(error));
}
```

### 4. ✅ Request/Response Logging

Added comprehensive logging for development:

**Request Logs:**
```
[API Request] POST token-auth/
{
  baseURL: "http://localhost:8000/api/",
  params: {},
  data: { username: "...", password: "..." }
}
```

**Response Logs:**
```
[API Response] GET contesters/
{
  status: 200,
  data: [...]
}
```

**Benefits:**
- Easy debugging during development
- Automatic in development mode only
- No performance impact in production

### 5. ✅ Automatic Retry Logic

Implemented smart retry mechanism:
- Automatically retries failed requests up to 2 times
- Exponential backoff (1s, 2s delays)
- Only retries on network errors (not auth failures)
- Prevents retry loops

**Example:**
```
[API] Network error - server not reachable
[API] Retrying request (1/2)...
[API] Retrying request (2/2)...
[API] Max retries reached - please check your connection
```

### 6. ✅ Request Timeout

Added 10-second timeout for all requests:
```javascript
timeout: 10000  // 10 seconds
```

Prevents hanging requests when server is unresponsive.

### 7. ✅ Cleaner API Paths

**Before:**
```javascript
axios.post('/api/token-auth/', data)
axios.get('/api/contesters/')
axios.post('/api/ratings/', data)
```

**After:**
```javascript
axios.post('token-auth/', data)
axios.get('contesters/')
axios.post('ratings/', data)
```

**Files Updated:**
- `pages/Login.jsx`
- `pages/Register.jsx`
- `pages/ActiveScoring.jsx`
- `pages/DifficultyScoring.jsx`
- `pages/MainJudgeDashboard.jsx`
- `pages/Rezultati.jsx`
- `components/JudgeScoringForm.jsx`
- `components/JudgeRegisterForm.jsx`

### 8. ✅ Health Check Helper

Added `checkBackendHealth()` function:
```javascript
const isHealthy = await checkBackendHealth();
if (!isHealthy) {
  alert('Backend server is not reachable!');
}
```

## LAN Setup Support

### For Host Machine:

1. Find your IP address:
   ```bash
   # Windows
   ipconfig

   # macOS/Linux
   ifconfig | grep "inet "
   ```

2. Update `.env.local`:
   ```bash
   VITE_API_URL=http://192.168.1.100:8000
   ```

3. Start backend:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

4. Start frontend:
   ```bash
   npm run dev -- --host
   ```

### For Client Devices:

Simply navigate to: `http://192.168.1.100:5173`

See [LAN_SETUP.md](FullStackJudge/LAN_SETUP.md) for detailed instructions.

## Testing

### Connection Test Page

Open `check-connection.html` in a browser to verify:
- Backend server is reachable
- API endpoints are accessible
- Network configuration is correct

### Manual Testing

1. **Localhost test:**
   ```bash
   curl http://localhost:8000/api/contesters/
   ```

2. **Network test (from another device):**
   ```bash
   curl http://192.168.1.100:8000/api/contesters/
   ```

## Troubleshooting

### Issue: Network errors in browser console

**Check:**
1. Is backend running? → `python manage.py runserver 0.0.0.0:8000`
2. Is `.env.local` configured correctly?
3. Is firewall blocking port 8000?

### Issue: CORS errors

**Solution:** Already configured in `settings.py`:
```python
CORS_ALLOW_ALL_ORIGINS = True  # for development
```

For production, restrict to specific origins.

### Issue: Can't connect from other devices

**Solutions:**
1. Use `0.0.0.0:8000` not `localhost:8000` for backend
2. Use `npm run dev -- --host` for frontend
3. Check firewall settings
4. Verify all devices on same network

## Migration Guide

If you're updating from old configuration:

1. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

2. **Install dependencies** (no new packages needed):
   ```bash
   cd FullStackJudge/JudgeFront
   npm install
   ```

3. **Create `.env.local`:**
   ```bash
   cp .env.example .env.local
   ```

4. **Update IP if needed:**
   Edit `.env.local` with your machine's IP

5. **Restart servers:**
   ```bash
   # Backend
   python manage.py runserver 0.0.0.0:8000

   # Frontend
   npm run dev
   ```

## Files Created/Modified

### New Files:
- `FullStackJudge/JudgeFront/.env.example` - Environment variable template
- `FullStackJudge/JudgeFront/.env.local` - Local environment configuration
- `FullStackJudge/LAN_SETUP.md` - LAN setup instructions
- `FullStackJudge/JudgeFront/check-connection.html` - Connection test page
- `AXIOS_IMPROVEMENTS.md` - This file

### Modified Files:
- `FullStackJudge/JudgeFront/src/axios.js` - Complete rewrite with all improvements
- `FullStackJudge/JudgeFront/src/pages/Login.jsx` - Updated imports and paths
- `FullStackJudge/JudgeFront/src/pages/Register.jsx` - Updated imports and paths
- `FullStackJudge/JudgeFront/src/pages/ActiveScoring.jsx` - Updated API paths
- `FullStackJudge/JudgeFront/src/pages/DifficultyScoring.jsx` - Updated API paths
- `FullStackJudge/JudgeFront/src/pages/MainJudgeDashboard.jsx` - Updated API paths
- `FullStackJudge/JudgeFront/src/pages/Rezultati.jsx` - Updated API paths
- `FullStackJudge/JudgeFront/src/components/JudgeScoringForm.jsx` - Updated API paths
- `FullStackJudge/JudgeFront/src/components/JudgeRegisterForm.jsx` - Updated API paths

## Benefits Summary

1. **Easier Development** - No hardcoded IPs, environment-based configuration
2. **Better Debugging** - Comprehensive logging in development mode
3. **Improved Reliability** - Automatic retries and timeout handling
4. **User-Friendly Errors** - Clear error messages in Slovenian
5. **LAN Support** - Easy multi-device access on same network
6. **Cleaner Code** - Shorter API paths, centralized configuration
7. **Production Ready** - Environment variable support for deployment

## Next Steps

1. Test on multiple devices on your LAN
2. Verify all features work with new configuration
3. Document any issues found
4. Consider setting up HTTPS for production

## Support

For questions or issues:
1. Check [LAN_SETUP.md](FullStackJudge/LAN_SETUP.md)
2. Use `check-connection.html` to diagnose connection issues
3. Check browser console for `[API Request]` and `[API Error]` logs
4. Verify `.env.local` configuration
