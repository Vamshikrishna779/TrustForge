"""
cloud_sync.py — Dual-save scan reports to Supabase for Pro users.

Usage in scan endpoints:
    from app.services.cloud_sync import try_cloud_save
    try_cloud_save(token=authorization_header, report_data={...})
"""
from typing import Optional

def try_cloud_save(token: str, report_data: dict) -> bool:
    """
    Attempts to save a scan report to Supabase cloud_scan_reports.
    Silently returns False if user is not Pro or Supabase is not configured.
    Returns True if successfully saved.
    """
    if not token:
        return False
    token = token.replace("Bearer ", "").strip()
    if not token:
        return False

    try:
        from app.services.supabase_client import get_supabase
        sb = get_supabase()

        # Verify token and get user
        user_result = sb.auth.get_user(token)
        user = user_result.user
        if not user:
            return False

        # Check if user is Pro
        plan_result = (
            sb.table("user_plans")
            .select("plan")
            .eq("user_id", str(user.id))
            .single()
            .execute()
        )
        if not plan_result.data or plan_result.data.get("plan") != "pro":
            return False  # Free users don't get cloud sync

        # Save report to Supabase
        sb.table("cloud_scan_reports").insert({
            "user_id": str(user.id),
            "type": report_data.get("type", "unknown"),
            "input_data": report_data.get("input_data", ""),
            "trust_score": report_data.get("trust_score", 50),
            "ai_summary": report_data.get("ai_summary", ""),
            "analysis_details": report_data.get("analysis_details", {}),
            "recommendations": report_data.get("recommendations", []),
        }).execute()

        return True

    except Exception:
        # Never crash the scan for a sync failure
        return False
