# TrustForge Backend API

FastAPI backend for TrustForge — AI-powered scam & fraud detection.

Deployed on **Render.com** — https://trustforge-backend.onrender.com

## Endpoints

- `GET /` — Health check
- `GET /docs` — Swagger UI (interactive API docs)
- `POST /api/v1/auth/register` — Register
- `POST /api/v1/auth/login` — Login
- `POST /api/v1/scan/url` — Scan a URL
- `POST /api/v1/scan/training-program` — Scan a training/placement program
- `POST /api/v1/payment/create-order` — Create Razorpay order
- `POST /api/v1/payment/verify` — Verify payment & upgrade plan
- `GET /api/v1/community/reports` — Community scam reports

## Local Development

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Open http://localhost:8000/docs

