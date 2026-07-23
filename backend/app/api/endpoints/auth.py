from fastapi import APIRouter, HTTPException, status, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.services.supabase_client import get_supabase

router = APIRouter()

# ─── Schemas ──────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UpgradePlanRequest(BaseModel):
    plan: str  # 'pro' | 'free'

# ─── POST /register ───────────────────────────────────────────
@router.post("/register", status_code=201)
def register(payload: RegisterRequest):
    try:
        sb = get_supabase()
        result = sb.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
            "options": {
                "data": {"display_name": payload.display_name or payload.email.split("@")[0]}
            }
        })
        user = result.user
        if not user:
            raise HTTPException(status_code=400, detail="Registration failed. Check your email and try again.")

        # Create default free plan entry for the new user
        try:
            sb.table("user_plans").insert({
                "user_id": str(user.id),
                "plan": "free",
            }).execute()
        except Exception:
            pass  # Already exists or RLS prevents — non-fatal

        return {
            "id": str(user.id),
            "email": user.email,
            "plan": "free",
            "message": "Account created. Check your email to confirm registration."
        }
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration error: {str(e)}")

# ─── POST /login ──────────────────────────────────────────────
@router.post("/login")
def login(payload: LoginRequest):
    try:
        sb = get_supabase()
        result = sb.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password,
        })
        session = result.session
        user = result.user
        if not session or not user:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        # Get user plan
        plan_result = sb.table("user_plans").select("plan,plan_expires_at").eq("user_id", str(user.id)).single().execute()
        plan_data = plan_result.data or {}
        plan = plan_data.get("plan", "free")

        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "display_name": user.user_metadata.get("display_name", user.email.split("@")[0]),
                "plan": plan,
                "plan_expires_at": plan_data.get("plan_expires_at"),
            }
        }
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Login failed: {str(e)}")

# ─── POST /logout ─────────────────────────────────────────────
@router.post("/logout")
def logout(authorization: str = Header(default="")):
    try:
        sb = get_supabase()
        token = authorization.replace("Bearer ", "").strip()
        if token:
            sb.auth.sign_out()
        return {"message": "Logged out successfully. Local data has been cleared."}
    except Exception:
        return {"message": "Logged out."}

# ─── GET /profile ─────────────────────────────────────────────
@router.get("/profile")
def get_profile(authorization: str = Header(default="")):
    try:
        sb = get_supabase()
        token = authorization.replace("Bearer ", "").strip()
        if not token:
            raise HTTPException(status_code=401, detail="Authorization token required.")

        user_result = sb.auth.get_user(token)
        user = user_result.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session.")

        plan_result = sb.table("user_plans").select("plan,plan_activated_at,plan_expires_at").eq("user_id", str(user.id)).single().execute()
        plan_data = plan_result.data or {}

        return {
            "id": str(user.id),
            "email": user.email,
            "display_name": user.user_metadata.get("display_name", user.email.split("@")[0]),
            "plan": plan_data.get("plan", "free"),
            "plan_activated_at": plan_data.get("plan_activated_at"),
            "plan_expires_at": plan_data.get("plan_expires_at"),
        }
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Profile fetch failed: {str(e)}")

# Capacity constraints for free tier Supabase database
MAX_PRO_USERS = 50
MAX_CLOUD_REPORTS = 500

@router.get("/capacity-status")
def get_capacity_status():
    """Checks if Supabase free tier limits are reached."""
    try:
        sb = get_supabase()
        # Count total active pro users
        pro_users_res = sb.table("user_plans").select("id", count="exact").eq("plan", "pro").execute()
        pro_count = pro_users_res.count or 0
        
        # Count total cloud scan reports
        reports_res = sb.table("cloud_scan_reports").select("id", count="exact").execute()
        reports_count = reports_res.count or 0
        
        is_locked = (pro_count >= MAX_PRO_USERS) or (reports_count >= MAX_CLOUD_REPORTS)
        
        return {
            "pro_users_count": pro_count,
            "max_pro_users": MAX_PRO_USERS,
            "cloud_reports_count": reports_count,
            "max_cloud_reports": MAX_CLOUD_REPORTS,
            "is_locked": is_locked
        }
    except Exception:
        # If Supabase not configured or offline, return safe defaults
        return {
            "pro_users_count": 0,
            "max_pro_users": MAX_PRO_USERS,
            "cloud_reports_count": 0,
            "max_cloud_reports": MAX_CLOUD_REPORTS,
            "is_locked": False
        }

# ─── POST /upgrade ────────────────────────────────────────────
@router.post("/upgrade")
def upgrade_plan(
    payload: UpgradePlanRequest,
    authorization: str = Header(default="")
):
    try:
        sb = get_supabase()
        token = authorization.replace("Bearer ", "").strip()
        if not token:
            raise HTTPException(status_code=401, detail="Authorization token required.")

        user_result = sb.auth.get_user(token)
        user = user_result.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session.")

        if payload.plan not in ("free", "pro"):
            raise HTTPException(status_code=400, detail="Invalid plan. Must be 'free' or 'pro'.")

        # Capacity limit block for upgrading to pro
        if payload.plan == "pro":
            status_data = get_capacity_status()
            if status_data["is_locked"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Pro plan purchases are temporarily disabled because the free tier capacity limit has been reached."
                )

        # Upsert plan record
        sb.table("user_plans").upsert({
            "user_id": str(user.id),
            "plan": payload.plan,
            "plan_activated_at": "now()",
        }, on_conflict="user_id").execute()

        return {
            "user_id": str(user.id),
            "plan": payload.plan,
            "message": f"Plan upgraded to {payload.plan.upper()} successfully!"
        }
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Plan upgrade failed: {str(e)}")

# ─── GET /cloud-history ───────────────────────────────────────
@router.get("/cloud-history")
def get_cloud_history(authorization: str = Header(default="")):
    """Returns Pro user's cloud scan history from Supabase."""
    try:
        sb = get_supabase()
        token = authorization.replace("Bearer ", "").strip()
        if not token:
            raise HTTPException(status_code=401, detail="Authorization token required.")

        user_result = sb.auth.get_user(token)
        user = user_result.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session.")

        # Verify Pro plan
        plan_result = sb.table("user_plans").select("plan").eq("user_id", str(user.id)).single().execute()
        if not plan_result.data or plan_result.data.get("plan") != "pro":
            raise HTTPException(status_code=403, detail="Cloud history is a Pro feature. Upgrade to access your synced history.")

        history = (
            sb.table("cloud_scan_reports")
            .select("*")
            .eq("user_id", str(user.id))
            .order("created_at", desc=True)
            .limit(100)
            .execute()
        )
        return history.data or []
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloud history fetch failed: {str(e)}")

# ─── ADMIN ENDPOINTS ──────────────────────────────────────────
@router.get("/admin/users")
def get_all_users_admin():
    """Returns all registered users and their plans from Supabase."""
    try:
        sb = get_supabase()
        res = sb.table("user_plans").select("*").execute()
        plans_data = res.data or []
        
        # Try fetching real emails from Supabase auth admin or list
        users_list = []
        for p in plans_data:
            u_id = p.get("user_id", "")
            email_val = p.get("email") or f"User ({u_id[:8]}...)"
            users_list.append({
                "id": u_id,
                "user_id": u_id,
                "email": email_val,
                "plan": p.get("plan", "free"),
                "created_at": p.get("created_at") or p.get("plan_activated_at")
            })
        return users_list
    except Exception:
        return []

class AdminUserPlanRequest(BaseModel):
    user_id: str
    plan: str  # 'free' | 'pro'

@router.post("/admin/user-plan")
def update_user_plan_admin(payload: AdminUserPlanRequest):
    """Admin override to upgrade or downgrade any user plan directly in Supabase."""
    try:
        sb = get_supabase()
        res = sb.table("user_plans").upsert({
            "user_id": payload.user_id,
            "plan": payload.plan,
            "plan_activated_at": "now()"
        }, on_conflict="user_id").execute()
        return {"status": "success", "message": f"User {payload.user_id} updated to {payload.plan}."}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user plan: {str(e)}")

