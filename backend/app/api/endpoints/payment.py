import os
import hmac
import hashlib
import razorpay
from fastapi import APIRouter, HTTPException, Header, status
from pydantic import BaseModel

router = APIRouter()

# ── Load keys from env ──────────────────────────────────────────
RAZORPAY_KEY_ID     = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

PRO_AMOUNT_PAISE = 700  # ₹7 in paise

def get_razorpay_client():
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Payment gateway not configured. Contact support."
        )
    return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


# ── Schemas ─────────────────────────────────────────────────────
class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# ── POST /payment/create-order ──────────────────────────────────
@router.post("/create-order", response_model=CreateOrderResponse)
def create_order(authorization: str = Header(default="")):
    """Creates a Razorpay order for the Pro plan (₹7/month)."""
    from app.services.supabase_client import get_supabase

    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Authorization token required.")

    try:
        sb = get_supabase()
        user_result = sb.auth.get_user(token)
        user = user_result.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session.")

        # Check if already Pro
        plan_result = sb.table("user_plans").select("plan").eq("user_id", str(user.id)).single().execute()
        if plan_result.data and plan_result.data.get("plan") == "pro":
            raise HTTPException(status_code=400, detail="You are already on the Pro plan.")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth error: {str(e)}")

    client = get_razorpay_client()

    try:
        order = client.order.create({
            "amount": PRO_AMOUNT_PAISE,
            "currency": "INR",
            "payment_capture": 1,  # auto-capture
            "notes": {
                "user_id": str(user.id),
                "email": user.email,
                "plan": "pro"
            }
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create payment order: {str(e)}")

    return CreateOrderResponse(
        order_id=order["id"],
        amount=order["amount"],
        currency=order["currency"],
        key_id=RAZORPAY_KEY_ID
    )


# ── POST /payment/verify ────────────────────────────────────────
@router.post("/verify")
def verify_payment(
    payload: VerifyPaymentRequest,
    authorization: str = Header(default="")
):
    """Verifies Razorpay payment signature and upgrades user to Pro."""
    from app.services.supabase_client import get_supabase

    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Authorization token required.")

    # 1. Authenticate user
    try:
        sb = get_supabase()
        user_result = sb.auth.get_user(token)
        user = user_result.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth error: {str(e)}")

    # 2. Verify HMAC-SHA256 signature
    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Payment gateway not configured.")

    body = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        body.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, payload.razorpay_signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed. Invalid signature."
        )

    # 3. Upgrade user plan to Pro
    try:
        sb.table("user_plans").upsert({
            "user_id": str(user.id),
            "plan": "pro",
            "plan_activated_at": "now()",
            "razorpay_payment_id": payload.razorpay_payment_id,
            "razorpay_order_id": payload.razorpay_order_id,
        }, on_conflict="user_id").execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plan upgrade failed: {str(e)}")

    # 4. Fetch updated user profile to return
    try:
        plan_result = sb.table("user_plans").select("plan,plan_activated_at").eq("user_id", str(user.id)).single().execute()
        plan_data = plan_result.data or {}
    except Exception:
        plan_data = {"plan": "pro"}

    return {
        "success": True,
        "message": "🎉 Welcome to TrustForge Pro! Your plan has been activated.",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "display_name": user.user_metadata.get("display_name", user.email.split("@")[0]),
            "plan": plan_data.get("plan", "pro"),
            "plan_activated_at": plan_data.get("plan_activated_at"),
        }
    }
