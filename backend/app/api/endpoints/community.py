from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.services.supabase_client import get_supabase

router = APIRouter()

# ─── Pydantic schemas ──────────────────────────────────────────
class CommunityReportCreate(BaseModel):
    title: str
    description: str
    category: str
    evidence_url: Optional[str] = None

# ─── POST /report ─────────────────────────────────────────────
@router.post("/report", status_code=201)
def create_community_report(payload: CommunityReportCreate):
    try:
        sb = get_supabase()
        result = (
            sb.table("community_reports")
            .insert({
                "title": payload.title.strip(),
                "description": payload.description.strip(),
                "category": payload.category,
                "evidence_url": payload.evidence_url or None,
                "upvotes": 0,
                "downvotes": 0,
            })
            .execute()
        )
        if result.data:
            return result.data[0]
        raise HTTPException(status_code=500, detail="Failed to create community report.")
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase error: {str(e)}")

# ─── GET /list ────────────────────────────────────────────────
@router.get("/list")
def list_community_reports():
    try:
        sb = get_supabase()
        result = (
            sb.table("community_reports")
            .select("*")
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
        return result.data or []
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase error: {str(e)}")

# ─── POST /report/{id}/vote ───────────────────────────────────
@router.post("/report/{report_id}/vote")
def vote_community_report(report_id: str, vote_type: str):
    if vote_type not in ("up", "down"):
        raise HTTPException(status_code=400, detail="vote_type must be 'up' or 'down'.")
    try:
        sb = get_supabase()

        # Fetch current counts
        row = sb.table("community_reports").select("upvotes,downvotes").eq("id", report_id).single().execute()
        if not row.data:
            raise HTTPException(status_code=404, detail="Report not found.")

        current = row.data
        update_data = (
            {"upvotes": current["upvotes"] + 1}
            if vote_type == "up"
            else {"downvotes": current["downvotes"] + 1}
        )

        result = (
            sb.table("community_reports")
            .update(update_data)
            .eq("id", report_id)
            .execute()
        )
        if result.data:
            return result.data[0]
        raise HTTPException(status_code=500, detail="Vote update failed.")
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase error: {str(e)}")

# ─── GET /stats ───────────────────────────────────────────────
@router.get("/stats")
def get_live_stats():
    """
    Reads global stats from Supabase:
    - Total community scam reports
    - Upvote totals (confirmed threats)
    - Category breakdown
    """
    try:
        sb = get_supabase()

        # Total reports
        total_result = sb.table("community_reports").select("id", count="exact").execute()
        total_community = total_result.count or 0

        # Confirmed threats (reports with upvotes > 3)
        confirmed_result = (
            sb.table("community_reports")
            .select("id", count="exact")
            .gt("upvotes", 3)
            .execute()
        )
        confirmed_threats = confirmed_result.count or 0

        # Category breakdown
        category_result = (
            sb.table("community_reports")
            .select("category")
            .execute()
        )
        categories: dict = {}
        for row in (category_result.data or []):
            cat = row.get("category", "other")
            categories[cat] = categories.get(cat, 0) + 1

        return {
            "total_community_reports": total_community,
            "confirmed_threats": confirmed_threats,
            "categories": categories,
        }
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase error: {str(e)}")
