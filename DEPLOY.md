# TrustForge — Complete Deployment & Local Setup Guide

> Comprehensive architecture, local setup, production deployment, keep-alive configuration, and maintenance instructions for TrustForge.

---

## Live Production Architecture & URLs

| Component | Platform / Host | Production URL / Endpoint | Details |
|---|---|---|---|
| **Web Frontend (PWA)** | Cloudflare Pages | [https://trustforge-app.pages.dev](https://trustforge-app.pages.dev) | Vite React SPA + PWA Manifest |
| **Backend API** | Render.com | [https://trustforge-backend-nz74.onrender.com](https://trustforge-backend-nz74.onrender.com) | FastAPI (Python 3.11) |
| **API Docs (Swagger)** | Render.com | [https://trustforge-backend-nz74.onrender.com/docs](https://trustforge-backend-nz74.onrender.com/docs) | OpenAPI interactive documentation |
| **Backend Health Check** | Render.com | [https://trustforge-backend-nz74.onrender.com/health](https://trustforge-backend-nz74.onrender.com/health) | Keep-alive monitoring endpoint |
| **Database & Auth** | Supabase | `https://bgphyzwxmzcwtahaeuje.supabase.co` | PostgreSQL + Supabase Auth |
| **24/7 Keep-Alive** | UptimeRobot | Pings `/health` every 5 minutes | Prevents Render cold-starts |
| **Source Control** | GitHub | [https://github.com/Vamshikrishna779/TrustForge](https://github.com/Vamshikrishna779/TrustForge) | Production main branch |
| **Admin Portal** | Web App | [https://trustforge-app.pages.dev/admin](https://trustforge-app.pages.dev/admin) | Exclusive to `vamshikrishna9608@gmail.com` |

---

## Accounts & Free Services Matrix

| Service | Role | Dashboard Link | Pricing Tier |
|---|---|---|---|
| **GitHub** | Code Repository & Auto-Deploy Trigger | https://github.com | Free |
| **Render** | Python FastAPI Backend Hosting | https://dashboard.render.com | Free |
| **Cloudflare Pages** | React Vite Single-Page Web App | https://dash.cloudflare.com | Free |
| **Supabase** | Cloud Database & User Auth | https://supabase.com | Free |
| **UptimeRobot** | 24/7 Keep-Alive Monitor | https://uptimerobot.com | Free |
| **Razorpay** | Pro Plan Payment Gateway (₹7/mo) | https://dashboard.razorpay.com | Free Test / Standard |

---

## Brand & Design System Specifications

- **Logo Palette**:
  - **Electric Teal**: `#00A4B4` (Gradient accents: `#0097A7` to `#00B4D8`)
  - **Deep Navy**: `#002855` (Card & container backdrops: `#04101B` / `#0A2034`)
  - **Status Colors**: Safe (`#10B981`), Warning (`#F59E0B`), Threat (`#EF4444`)
- **Typography**: Inter (sans), Outfit (headings), JetBrains Mono (monospaced numbers & tags)
- **Theme**: Premium Glassmorphism Dark Mode with 60 FPS GPU-accelerated background animations.

---

## LOCAL DEVELOPMENT SETUP (Run App Locally on Windows)

### 1. Run Backend Server Locally

```powershell
# Open Terminal 1
cd C:\TrustForge\backend

# Install Python 3.11 requirements
pip install -r requirements.txt

# Start FastAPI dev server
uvicorn main:app --reload --port 8000
```
> **Local API Endpoint**: `http://localhost:8000`  
> **Local Swagger Docs**: `http://localhost:8000/docs`

---

### 2. Run Frontend Web App Locally

```powershell
# Open Terminal 2
cd C:\TrustForge\frontend

# Install dependencies (if needed)
npm install

# Start Vite dev server
npm run dev
```
> **Local Web App**: `http://localhost:5173`

---

## PRODUCTION DEPLOYMENT STEPS

### Phase 1 — Backend Deployment (Render)

1. Log into [Render Dashboard](https://dashboard.render.com).
2. Connected Web Service: `trustforge-backend`
3. Repository: `Vamshikrishna779/TrustForge`
4. Configuration Settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3` (3.11.4 locked via `.python-version` & `runtime.txt`)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
5. **Environment Variables**:
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
   - `SUPABASE_URL`: `https://bgphyzwxmzcwtahaeuje.supabase.co`
   - `SUPABASE_KEY`: *(Your Supabase anon key)*
   - `RAZORPAY_KEY_ID`: `rzp_test_...`
   - `RAZORPAY_KEY_SECRET`: *(Your Razorpay Key Secret)*
   - `DATABASE_URL`: `sqlite:///./trustforge.db`

---

### Phase 2 — Frontend Deployment (Cloudflare Pages)

```powershell
# Build production bundle and deploy
cd C:\TrustForge\frontend
npm run build
wrangler pages deploy dist --project-name trustforge-app
```

---

### Phase 3 — Backend 24/7 Keep-Alive (UptimeRobot)

To prevent Render free tier cold-starts (30-50 sec delays):

1. Log into [UptimeRobot Dashboard](https://uptimerobot.com).
2. Click **`+ Add New Monitor`**:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `TrustForge Backend Health`
   - **URL**: `https://trustforge-backend-nz74.onrender.com/health`
   - **Monitoring Interval**: `5 minutes`
3. Click **`Create Monitor`**.

---

## FUTURE MAINTENANCE & WORKFLOW

### To Push Backend Updates (Automatic Deploy on Render):
```powershell
cd C:\TrustForge
git add .
git commit -m "fix: update backend logic"
git push origin main
```
*(Render will automatically detect the push and build the backend)*

### To Deploy Frontend UI Updates (Cloudflare Pages):
```powershell
cd C:\TrustForge\frontend
npm run build
wrangler pages deploy dist --project-name trustforge-app
```

---

## Key App Features Verified & Active

- ✅ **5 Verification Scanners**: Website URLs, Recruiter Emails, Documents (PDF/PNG/JPEG), WhatsApp/SMS Text, and Placement Guarantee Academies.
- ✅ **Security Dashboard**: Live scan history with category filters (`ALL`, `WEBSITE`, `EMAIL`, `DOCUMENT`, `TEXT`, `TRAINING`) and individual **Delete 🗑️** options.
- ✅ **User Profile**: Real-time stats calculation (Total Scans, Threats Flagged, Safe Passed, Avg Trust Score ring).
- ✅ **PWA Support**: Installable app support (`manifest.json` + `theme-color`) with auto-closing 10s install banner.
- ✅ **Admin Portal**: Accessible strictly to `vamshikrishna9608@gmail.com` with mobile-responsive horizontal scroll user management tables.
- ✅ **Clean Export PDF**: Professional A4 print document layout formatting.