# TrustForge — Complete Deployment Guide

> Follow each phase in order. Everything is FREE. No credit card needed.

---

## Architecture

```
Frontend  ? Cloudflare Pages   ? https://trustforge.pages.dev
Backend   ? Render.com         ? https://trustforge-backend.onrender.com
Keep-Alive? UptimeRobot        ? pings backend every 5 min (no cold starts)
Database  ? Supabase           ? already set up
Payments  ? Razorpay           ? already set up
```

---

## Accounts You Need (All FREE, No Card)

| Site | Purpose | Link |
|---|---|---|
| GitHub | Host code for Render | https://github.com/signup |
| Render | Backend hosting | https://render.com |
| Cloudflare | Frontend hosting | https://dash.cloudflare.com/sign-up |
| UptimeRobot | Keep backend awake | https://uptimerobot.com/signUp |

Your GitHub: https://github.com/Vamshikrishna779/TrustForge ? Done

---

## PHASE 0 — Razorpay Setup

> Do this BEFORE deploying. You need the keys for backend secrets.

### Step 0.1 — Get API Keys

1. Go to https://dashboard.razorpay.com
2. Navigate to Settings > API Keys
3. Click "Generate Test Key"
4. Copy your Key ID (starts with rzp_test_) and Key Secret

### Step 0.2 — Update Supabase Table

Run this SQL in your Supabase SQL Editor:

```sql
ALTER TABLE user_plans
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
```

---

## PHASE 1 — Push Code to GitHub

```
Working directory: C:\TrustForge
```

### Step 1.1 — Initialize Git and Push

```powershell
cd C:\TrustForge

git init
git add .
git commit -m "Initial TrustForge commit"
git branch -M main
git remote add origin https://github.com/Vamshikrishna779/TrustForge.git
git push -u origin main
```

> When prompted: enter your GitHub username and password (or personal access token)
> To create a token: https://github.com/settings/tokens ? New token ? tick "repo" scope

---

## PHASE 2 — Backend to Render.com

### Step 2.1 — Create Render Account

1. Go to https://render.com
2. Click "Get Started for Free"
3. Click "Continue with GitHub" ? Authorize Render

### Step 2.2 — Create Web Service

1. Click "New +" ? "Web Service"
2. Click "Connect" next to your TrustForge repo
3. Fill in the settings:

| Setting | Value |
|---|---|
| Name | `trustforge-backend` |
| Root Directory | `backend` |
| Runtime | `Python 3` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Plan | **Free** |

4. Click "Advanced" ? "Add Environment Variable" and add each one:

| Key | Value |
|---|---|
| `GEMINI_API_KEY` | Your Gemini API key from Google AI Studio |
| `SUPABASE_URL` | `https://bgphyzwxmzcwtahaeuje.supabase.co` |
| `SUPABASE_KEY` | Your Supabase anon key |
| `RAZORPAY_KEY_ID` | `rzp_test_XXXXXXXXXXXXXXXX` |
| `RAZORPAY_KEY_SECRET` | Your Razorpay secret key |
| `DATABASE_URL` | `sqlite:///./trustforge.db` |

5. Click "Create Web Service"

> Build takes 3-5 minutes. Watch the logs.

### Step 2.3 — Verify Backend is Running

Open in browser:
```
https://trustforge-backend.onrender.com/
```
Should return: {"message": "Welcome to TrustForge API", "status": "healthy"}

```
https://trustforge-backend.onrender.com/docs
```
Should show FastAPI Swagger UI.

---

## PHASE 3 — Frontend to Cloudflare Pages

```
Working directory: C:\TrustForge\frontend
```

### Step 3.1 — Build Frontend

```powershell
cd C:\TrustForge\frontend
npm run build
```

> Output goes to C:\TrustForge\frontend\dist\
> The backend URL (https://trustforge-backend.onrender.com) is already set in .env.production

### Step 3.2 — Install Wrangler (run once)

```powershell
npm install -g wrangler
```

### Step 3.3 — Login to Cloudflare

```powershell
wrangler login
```

> Opens a browser. Click "Allow". Return to terminal.

### Step 3.4 — Deploy Frontend

```powershell
cd C:\TrustForge\frontend
wrangler pages deploy dist --project-name trustforge
```

> Frontend is live at: https://trustforge.pages.dev

---

## PHASE 4 — Keep Backend Alive (No Cold Starts)

Without this, Render sleeps after 15 min and the first request takes 30-50 seconds.
UptimeRobot pings it every 5 minutes for free — keeping it always awake.

### Step 4.1 — Create UptimeRobot Account

1. Go to https://uptimerobot.com/signUp
2. Sign up with email (free, no card)
3. Confirm your email

### Step 4.2 — Add Monitor

1. Click "+ Add New Monitor"
2. Fill in:

| Setting | Value |
|---|---|
| Monitor Type | HTTP(s) |
| Friendly Name | `TrustForge Backend` |
| URL | `https://trustforge-backend.onrender.com/` |
| Monitoring Interval | Every 5 minutes |

3. Click "Create Monitor" ?

> Your backend now stays awake 24/7 for free.

---

## PHASE 5 — Verify Everything Works End-to-End

1. Open https://trustforge.pages.dev
2. Register a new account
3. Login
4. Scan a URL
5. Check community reports
6. Test upgrade flow (Razorpay test card: 4111 1111 1111 1111)

---

## PHASE 6 — Re-deploy After Code Changes

### Re-deploy Backend

```powershell
cd C:\TrustForge
git add .
git commit -m "Update backend"
git push origin main
```

> Render auto-detects the push and rebuilds automatically.

### Re-deploy Frontend

```powershell
cd C:\TrustForge\frontend
npm run build
wrangler pages deploy dist --project-name trustforge
```

---

## PHASE 7 — Switch Razorpay to Live (When Ready)

Requires Razorpay KYC / business verification first.

1. Get live keys: https://dashboard.razorpay.com > Settings > API Keys > Generate Live Key
2. Go to Render dashboard ? trustforge-backend ? Environment
3. Update:
   - `RAZORPAY_KEY_ID` ? your live key (rzp_live_...)
   - `RAZORPAY_KEY_SECRET` ? your live secret
4. Render auto-restarts with new values

> No frontend change needed — key_id is returned dynamically by the API.

---

## Quick Reference

```
GitHub repo:     https://github.com/Vamshikrishna779/TrustForge
Render backend:  https://trustforge-backend.onrender.com
Render dashboard:https://dashboard.render.com
Cloudflare Pages:https://trustforge.pages.dev
API Docs:        https://trustforge-backend.onrender.com/docs
Health check:    https://trustforge-backend.onrender.com/
```

---

## Project Structure

```
C:\TrustForge\
+-- .gitignore                  <- Protects .env from being pushed to GitHub
+-- DEPLOY.md                   <- This file
+-- backend\
¦   +-- .env                    <- Local secrets (git-ignored, NEVER committed)
¦   +-- render.yaml             <- Render.com config (auto-detected)
¦   +-- Dockerfile              <- For local Docker use only
¦   +-- requirements.txt        <- Python dependencies
¦   +-- main.py                 <- FastAPI app entry point
¦   +-- app\
¦       +-- core\               <- Config + database setup
¦       +-- services\           <- Gemini AI, Supabase, heuristics
¦       +-- api\endpoints\
¦           +-- auth.py         <- Login, register, profile, plan
¦           +-- scan.py         <- URL scanner + AI analysis
¦           +-- payment.py      <- Razorpay create-order + verify
¦           +-- community.py    <- Community scam reports
¦           +-- training_program.py <- Placement program scanner
¦
+-- frontend\
    +-- .env.production         <- VITE_API_BASE_URL = Render URL
    +-- dist\                   <- Built files — deployed to Cloudflare
    +-- src\
        +-- api.ts              <- Central API base URL
        +-- App.tsx             <- Main app + routing
        +-- pages\             <- Landing, Dashboard, Profile, Settings
```

---

## Important Notes

WARNING: Never commit .env to Git. It is protected by .gitignore at root level.

NOTE: Render free tier spins down after 15 min idle.
      UptimeRobot (Phase 4) prevents this completely.

NOTE: Razorpay TEST card: 4111 1111 1111 1111
      Any future expiry, any 3-digit CVV. No real money charged.

NOTE: If build fails on Render, check logs at:
      https://dashboard.render.com ? trustforge-backend ? Logs
