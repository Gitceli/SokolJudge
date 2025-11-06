# LAN Setup Guide - Multi-Device Access

This guide explains how to set up the Sokol Judge application so multiple devices on the same Local Area Network (LAN) can access it simultaneously.

## Prerequisites

- All devices must be connected to the same WiFi network or LAN
- Backend server must be running on a host machine
- Firewall on host machine must allow incoming connections on port 8000

## Step 1: Find Your Host Machine's IP Address

The host machine is where you'll run the backend Django server.

### On Windows:
```bash
ipconfig
```
Look for **IPv4 Address** under your active network adapter (e.g., `192.168.1.100`)

### On macOS:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### On Linux/WSL:
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```
Or:
```bash
hostname -I
```

**Example output:** `192.168.1.100` (your IP will be different)

## Step 2: Configure Backend for Network Access

Navigate to the backend directory:
```bash
cd FullStackJudge/JudgeBack
```

The backend is already configured to accept connections from all hosts:
```python
# In settings.py
ALLOWED_HOSTS = ['*']
CORS_ALLOW_ALL_ORIGINS = True
```

Start the backend server with network access:
```bash
# Activate virtual environment first
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run on all network interfaces
python manage.py runserver 0.0.0.0:8000
```

The `0.0.0.0` tells Django to listen on all network interfaces, making it accessible from other devices.

## Step 3: Configure Frontend for LAN Access

Navigate to the frontend directory:
```bash
cd FullStackJudge/JudgeFront
```

Edit the `.env.local` file and update the `VITE_API_URL` with your host machine's IP:

```bash
# Replace 192.168.1.100 with YOUR actual IP address from Step 1
VITE_API_URL=http://192.168.1.100:8000
```

Start the frontend development server:
```bash
npm run dev -- --host
```

The `--host` flag allows Vite to be accessed from other devices on the network.

Vite will show you the network URL:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.100:5173/
```

## Step 4: Access from Other Devices

On any device connected to the same network, open a web browser and navigate to:

```
http://192.168.1.100:5173
```

Replace `192.168.1.100` with your host machine's actual IP address.

## Troubleshooting

### Issue: "Network Error" or "Cannot Connect"

**Solution:**
1. Verify the backend is running: `http://YOUR_IP:8000/admin/`
2. Check if firewall is blocking port 8000
3. Ensure both devices are on the same network

### Issue: Firewall Blocking Connections

**Windows:**
```bash
# Allow Python through firewall (run as Administrator)
netsh advfirewall firewall add rule name="Django Server" dir=in action=allow protocol=TCP localport=8000
```

**macOS:**
System Preferences → Security & Privacy → Firewall → Firewall Options → Allow Python

**Linux:**
```bash
# UFW
sudo ufw allow 8000/tcp

# Firewalld
sudo firewall-cmd --add-port=8000/tcp --permanent
sudo firewall-cmd --reload
```

### Issue: Different Subnets

If devices are on different subnets (e.g., guest network vs main network), they won't be able to communicate. Ensure all devices are on the same subnet.

### Issue: Backend Returns 404

Verify the frontend is using the correct API URL:
1. Open browser console (F12)
2. Check the `[API Request]` logs
3. Ensure requests are going to `http://YOUR_IP:8000/api/...`

## Production Deployment

For production use, you should:

1. **Use a proper web server** (Nginx, Apache)
2. **Enable HTTPS** with SSL certificates
3. **Restrict CORS** to specific origins:
   ```python
   CORS_ALLOWED_ORIGINS = [
       "http://192.168.1.100:5173",
       "https://yourdomain.com"
   ]
   ```
4. **Set DEBUG = False** in Django settings
5. **Use environment variables** for sensitive data
6. **Use PostgreSQL** instead of SQLite for better concurrency

## Quick Reference

### Host Machine Setup (Development):

**Terminal 1 - Backend:**
```bash
cd FullStackJudge/JudgeBack
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```bash
cd FullStackJudge/JudgeFront
# Edit .env.local with your IP first
npm run dev -- --host
```

### Client Devices:

Open browser to: `http://YOUR_HOST_IP:5173`

### Network URL Examples:

- **Backend API:** `http://192.168.1.100:8000/api/`
- **Frontend App:** `http://192.168.1.100:5173`
- **Django Admin:** `http://192.168.1.100:8000/admin/`

## Testing Your Setup

1. On host machine, open: `http://localhost:5173`
2. On another device, open: `http://YOUR_HOST_IP:5173`
3. Both should see the same login page
4. Check browser console for `[API Request]` logs showing correct URLs

## Security Notes

⚠️ **Development Mode Only:**
- `ALLOWED_HOSTS = ['*']` is insecure for production
- `CORS_ALLOW_ALL_ORIGINS = True` is insecure for production
- Always use HTTPS in production
- Never expose DEBUG = True to the internet

## Support

If you encounter issues:
1. Check browser console for error messages
2. Check Django server terminal for request logs
3. Verify IP addresses match across configuration
4. Ensure no VPN is interfering with local network
