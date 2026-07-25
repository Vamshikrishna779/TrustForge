from fastapi import APIRouter, HTTPException, status, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.services.supabase_client import get_supabase
from app.core.config import settings

router = APIRouter()

# ─── Schemas ──────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UpgradePlanRequest(BaseModel):
    plan: str  # 'pro' | 'free'

@router.get("/google-url")
def get_google_auth_url(redirect_to: str = "https://trustforge-app.pages.dev/auth"):
    """Returns Supabase Google OAuth authorization URL for the client."""
    try:
        supabase_url = settings.SUPABASE_URL.rstrip('/')
        url = f"{supabase_url}/auth/v1/authorize?provider=google&redirect_to={redirect_to}"
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not generate OAuth URL.")


# ─── POST /register ───────────────────────────────────────────
@router.post("/register", status_code=201)
def register(payload: RegisterRequest):
    try:
        sb = get_supabase()
        display_name = (payload.display_name or "").strip()

        if len(display_name) < 5 or len(display_name) > 15:
            raise HTTPException(status_code=400, detail="Username must be between 5 and 15 characters long.")

        # Check username uniqueness in user_plans
        try:
            existing = sb.table("user_plans").select("id").ilike("display_name", display_name).execute()
            if existing and existing.data and len(existing.data) > 0:
                raise HTTPException(status_code=400, detail="Username is already taken. Please choose a different username.")
        except HTTPException:
            raise
        except Exception:
            pass

        result = sb.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
            "options": {
                "data": {"display_name": display_name},
                "email_redirect_to": "https://trustforge-app.pages.dev/auth"
            }
        })

        user = result.user
        if not user:
            raise HTTPException(status_code=400, detail="Registration failed. Check your email and try again.")

        # Create default free plan entry for the new user with display_name and email
        try:
            sb.table("user_plans").upsert({
                "user_id": str(user.id),
                "email": user.email,
                "display_name": display_name,
                "plan": "free",
            }, on_conflict="user_id").execute()

            # Auto-send Welcome Notification to new user
            sb.table("user_notifications").insert({
                "user_id": str(user.id),
                "user_email": user.email,
                "title": "🎉 Welcome to TrustForge!",
                "message": f"Hello {display_name}! Your account is active. Start scanning suspicious job offers, emails, and URLs with our AI Cyber Intelligence Engine.",
                "category": "system",
                "is_read": False
            }).execute()

            # Auto-send Registration Notification to Admin
            sb.table("user_notifications").insert({
                "user_id": "admin_alert",
                "user_email": "vamshikrishna9608@gmail.com",
                "title": "👤 New User Registration",
                "message": f"New user {display_name} ({user.email}) has registered on TrustForge.",
                "category": "admin_alert",
                "is_read": False
            }).execute()
        except Exception:
            pass

        return {
            "id": str(user.id),
            "email": user.email,
            "display_name": display_name,
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

        disp_name = user.user_metadata.get("display_name") or user.user_metadata.get("full_name") or user.user_metadata.get("name") or user.email.split("@")[0]
        plan = "free"
        plan_expires = None
        try:
            plan_result = sb.table("user_plans").select("plan,plan_expires_at").eq("user_id", str(user.id)).execute()
            if plan_result and plan_result.data and len(plan_result.data) > 0:
                p_data = plan_result.data[0]
                plan = p_data.get("plan", "free")
                plan_expires = p_data.get("plan_expires_at")
            
            sb.table("user_plans").upsert({
                "user_id": str(user.id),
                "email": user.email,
                "display_name": disp_name,
                "plan": plan
            }, on_conflict="user_id").execute()
        except Exception:
            pass



        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "display_name": disp_name,
                "plan": plan,
                "plan_expires_at": plan_expires,
            }
        }
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail="Authentication service unavailable.")
    except HTTPException:
        raise
    except Exception as e:
        err_str = str(e).lower()
        if "invalid" in err_str or "credential" in err_str:
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        raise HTTPException(status_code=401, detail="Login failed. Please verify your credentials and try again.")


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

        # Extract display name from metadata or full_name or email
        display_name = user.user_metadata.get("display_name") or user.user_metadata.get("full_name") or user.user_metadata.get("name") or user.email.split("@")[0]

        plan = "free"
        plan_activated = None
        plan_expires = None

        try:
            plan_result = sb.table("user_plans").select("plan,plan_activated_at,plan_expires_at").eq("user_id", str(user.id)).execute()
            is_new_user = not (plan_result and plan_result.data and len(plan_result.data) > 0)

            if not is_new_user:
                p_data = plan_result.data[0]
                plan = p_data.get("plan", "free")
                plan_activated = p_data.get("plan_activated_at")
                plan_expires = p_data.get("plan_expires_at")
            
            # Upsert email and display_name into user_plans for admin visibility
            sb.table("user_plans").upsert({
                "user_id": str(user.id),
                "email": user.email,
                "display_name": display_name,
                "plan": plan
            }, on_conflict="user_id").execute()

            if is_new_user:
                # Auto-send Welcome Notification to new user
                sb.table("user_notifications").insert({
                    "user_id": str(user.id),
                    "user_email": user.email,
                    "title": "🎉 Welcome to TrustForge!",
                    "message": f"Hello {display_name}! Your account is active. Start scanning suspicious job offers, emails, and URLs with our AI Cyber Intelligence Engine.",
                    "category": "system",
                    "is_read": False
                }).execute()

                # Auto-send Registration Notification to Admin
                sb.table("user_notifications").insert({
                    "user_id": "admin_alert",
                    "user_email": "vamshikrishna9608@gmail.com",
                    "title": "👤 New User Registration",
                    "message": f"New user {display_name} ({user.email}) has registered on TrustForge.",
                    "category": "admin_alert",
                    "is_read": False
                }).execute()
        except Exception:
            pass

        return {
            "id": str(user.id),
            "email": user.email,
            "display_name": display_name,
            "plan": plan,
            "plan_activated_at": plan_activated,
            "plan_expires_at": plan_expires,
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
    """Returns all registered users, their emails, names, and plans from Supabase."""
    try:
        sb = get_supabase()
        res = sb.table("user_plans").select("*").execute()
        plans_data = res.data or []
        
        # Query auth.users via Supabase Admin Auth API
        auth_users_map = {}
        try:
            users_res = sb.auth.admin.list_users()
            if users_res:
                raw_list = users_res if isinstance(users_res, list) else getattr(users_res, 'users', [])
                for u in raw_list:
                    u_id = str(getattr(u, 'id', ''))
                    email = getattr(u, 'email', '')
                    user_meta = getattr(u, 'user_metadata', {}) or {}
                    name = user_meta.get('full_name') or user_meta.get('display_name') or user_meta.get('name') or (email.split('@')[0] if email else 'User')
                    created_at = getattr(u, 'created_at', None)
                    auth_users_map[u_id] = {
                        "email": email,
                        "name": name,
                        "created_at": created_at
                    }
        except Exception as err:
            print("Admin list_users info:", err)

        users_list = []
        for p in plans_data:
            u_id = str(p.get("user_id", ""))
            auth_info = auth_users_map.get(u_id, {})
            
            email_val = p.get("email") or p.get("user_email") or auth_info.get("email") or ""
            raw_name = p.get("display_name") or p.get("name") or auth_info.get("name")
            
            if not raw_name or raw_name.strip() in ("", "Registered Member", "User"):
                if email_val and "@" in email_val:
                    raw_name = email_val.split("@")[0].capitalize()
                else:
                    raw_name = "Candidate Member"

            if not email_val and u_id:
                email_val = f"User ({u_id[:8]}...)"


            created_val = p.get("created_at") or p.get("plan_activated_at") or auth_info.get("created_at")

            users_list.append({
                "id": u_id,
                "user_id": u_id,
                "name": raw_name,
                "email": email_val,
                "plan": p.get("plan", "free"),
                "created_at": created_val
            })



        # Include auth users not yet present in user_plans table
        existing_ids = {u["id"] for u in users_list}
        for u_id, auth_info in auth_users_map.items():
            if u_id not in existing_ids:
                e_val = auth_info.get("email") or f"User ({u_id[:8]}...)"
                users_list.append({
                    "id": u_id,
                    "user_id": u_id,
                    "name": auth_info.get("name") or (e_val.split('@')[0] if '@' in e_val else "User"),
                    "email": e_val,
                    "plan": "free",
                    "created_at": auth_info.get("created_at")
                })

        return users_list
    except Exception as e:
        print("Failed to fetch admin users:", e)
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

@router.delete("/admin/user/{user_id}")
def delete_user_admin(user_id: str):
    """Admin override to delete a user record permanently from Supabase user_plans."""
    try:
        sb = get_supabase()
        res = sb.table("user_plans").delete().eq("user_id", user_id).execute()
        return {"status": "success", "message": f"User {user_id} deleted permanently."}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")


# ─── NOTIFICATION ENDPOINTS ───────────────────────────────────────
class AdminNotificationRequest(BaseModel):
    user_id: str = ""
    user_email: str = ""
    title: str
    message: str
    category: str = "admin_alert"

@router.post("/admin/notify")
def send_admin_notification(payload: AdminNotificationRequest):
    """Admin endpoint to dispatch in-app notification to a user or broadcast to all."""
    try:
        sb = get_supabase()
        
        target_users = []
        if payload.user_id and payload.user_id != "all":
            target_users.append({"user_id": payload.user_id, "user_email": payload.user_email})
        elif payload.user_email and payload.user_email != "all":
            target_users.append({"user_id": payload.user_id or payload.user_email, "user_email": payload.user_email})
        else:
            all_users_res = sb.table("user_plans").select("user_id").execute()
            if all_users_res and all_users_res.data:
                target_users = [{"user_id": u.get("user_id"), "user_email": ""} for u in all_users_res.data]


        if not target_users:
            target_users = [{"user_id": payload.user_id or "global", "user_email": payload.user_email or "all"}]

        notifications_data = []
        for target in target_users:
            notifications_data.append({
                "user_id": str(target["user_id"]),
                "user_email": target.get("user_email") or "",
                "title": payload.title,
                "message": payload.message,
 @router.get("/notifications")
def get_user_notifications(authorization: str = Header(default=""), user_id: str = "", email: str = ""):
    """Returns active in-app notifications for the authenticated user."""
    try:
        sb = get_supabase()
        u_id = user_id.strip()
        u_email = email.strip().lower()

        token = authorization.replace("Bearer ", "").strip() if authorization else ""
        if token:
            try:
                user_res = sb.auth.get_user(token)
                if user_res and user_res.user:
                    u_id = str(user_res.user.id)
                    u_email = (user_res.user.email or u_email).strip().lower()
            except Exception:
                pass

        if not u_id and not u_email:
            return {"notifications": [], "unread_count": 0}

        # Fetch recent notifications and filter in Python for 100% reliability
        res = sb.table("user_notifications").select("*").order("created_at", desc=True).limit(100).execute()
        raw_list = res.data or []

        is_admin_user = u_email == "vamshikrishna9608@gmail.com"

        data = []
        for n in raw_list:
            nid = str(n.get("user_id", "")).strip()
            nemail = str(n.get("user_email", "")).strip().lower()
            ncat = str(n.get("category", "")).strip()
            
            is_match = False
            if u_id and (nid == u_id or nid == u_email):
                is_match = True
            elif u_email and (nemail == u_email or nid == u_email):
                is_match = True
            elif nid in ("all", "global"):
                is_match = True
            elif is_admin_user and (nid == "admin_alert" or ncat == "admin_alert"):
                is_match = True

            if is_match:
                data.append(n)

        unread_count = sum(1 for n in data if not n.get("is_read"))

        return {"notifications": data, "unread_count": unread_count}
    except Exception as e:
        print("Error fetching notifications:", e)
        return {"notifications": [], "unread_count": 0}



@router.patch("/notifications/{notification_id}/read")
def mark_notification_as_read(notification_id: str):
    try:
        sb = get_supabase()
        sb.table("user_notifications").update({"is_read": True}).eq("id", notification_id).execute()
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.delete("/notifications/{notification_id}")
def delete_notification(notification_id: str):
    try:
        sb = get_supabase()
        sb.table("user_notifications").delete().eq("id", notification_id).execute()
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.delete("/notifications/clear-all")
def clear_all_notifications(authorization: str = Header(default="")):
    try:
        sb = get_supabase()
        token = authorization.replace("Bearer ", "").strip() if authorization else ""
        if token:
            user_res = sb.auth.get_user(token)
            if user_res and user_res.user:
                u_id = str(user_res.user.id)
                sb.table("user_notifications").delete().eq("user_id", u_id).execute()
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}



