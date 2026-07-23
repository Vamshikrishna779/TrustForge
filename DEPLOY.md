# TrustForge — Complete Deployment Guide

> Follow each phase in order. Everything is FREE. No credit card needed.

---

## Live Production Architecture

```
Frontend  ? Cloudflare Pages   ? https://trustforge-app.pages.dev
Backend   ? Render.com         ? https://trustforge-backend-nz74.onrender.com
Keep-Alive? UptimeRobot        ? pings backend every 5 min (prevents cold starts)
Database  ? Supabase           ? https://bgphyzwxmzcwtahaeuje.supabase.co
Payments  ? Razorpay           ? Test mode configured (Live ready)
GitHub    ? Source Control     ? https://github.com/Vamshikrishna779/TrustForge
```

---

## Accounts Used (All FREE, No Credit Card)

| Site | Purpose | Link |
|---|---|---|
| GitHub | Host source code for Render | https://github.com |
| Render | Python FastAPI Backend hosting | https://render.com |
| Cloudflare | React Vite Frontend hosting | https://dash.cloudflare.com |
| UptimeRobot | Backend 24/7 keep-alive monitor | https://uptimerobot.com |
| Supabase | Database & Auth platform | https://supabase.com |
| Razorpay | Payment gateway | https://dashboard.razorpay.com |

---

## PHASE 0 — Database & Supabase Verification

Run this in your **Supabase SQL Editor** to ensure Razorpay support:

```sql
ALTER TABLE user_plans
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
```

---

## PHASE 1 — GitHub Source Push

```powershell
cd C:\TrustForge
git add .
git commit -m "Update application"
git push origin main
```

---

## PHASE 2 — Render Backend Setup

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Connected Web Service: `trustforge-backend`
3. Repository: `Vamshikrishna779/TrustForge`
4. Configurations:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
5. **Environment Variables**:
   - `GEMINI_API_KEY`: *(Your Gemini API key)*
   - `SUPABASE_URL`: `https://bgphyzwxmzcwtahaeuje.supabase.co`
   - `SUPABASE_KEY`: *(Your Supabase anon key)*
   - `RAZORPAY_KEY_ID`: `rzp_test_XXXXXXXXXXXXXXXX`
   - `RAZORPAY_KEY_SECRET`: *(Your Razorpay key secret)*
   - `DATABASE_URL`: `sqlite:///./trustforge.db`

> **Backend URL**: `https://trustforge-backend-nz74.onrender.com`

---

## PHASE 3 — Cloudflare Pages Frontend Deployment

```powershell
# 1. Build frontend dist
cd C:\TrustForge\frontend
npm run build

# 2. Deploy to Cloudflare Pages project
wrangler pages deploy dist --project-name trustforge-app
```

> **Live Frontend URL**: `https://trustforge-app.pages.dev`

---

## PHASE 4 — Prevent Backend Sleep (UptimeRobot)

1. Log in to [UptimeRobot Dashboard](https://uptimerobot.com).
2. Add New Monitor:
   - **Type**: `HTTP(s)`
   - **Name**: `TrustForge Backend`
   - **URL**: `https://trustforge-backend-nz74.onrender.com/`
   - **Interval**: `Every 5 minutes`
3. Save monitor. This prevents Render from going into 50-second cold starts.

---

## PHASE 5 — Future Code Maintenance & Updates

### To update Backend & Logic:
```powershell
cd C:\TrustForge
git add .
git commit -m "Your update description"
git push origin main
```
*(Render will automatically detect the push and redeploy the backend)*

### To update Frontend UI:
```powershell
cd C:\TrustForge\frontend
npm run build
wrangler pages deploy dist --project-name trustforge-app
```

---

## Summary of URLs

- **Live Application**: [https://trustforge-app.pages.dev](https://trustforge-app.pages.dev)
- **Live API Endpoint**: [https://trustforge-backend-nz74.onrender.com](https://trustforge-backend-nz74.onrender.com)
- **Interactive API Docs (Swagger)**: [https://trustforge-backend-nz74.onrender.com/docs](https://trustforge-backend-nz74.onrender.com/docs)
- **GitHub Repository**: [https://github.com/Vamshikrishna779/TrustForge](https://github.com/Vamshikrishna779/TrustForge)
