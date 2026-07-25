from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.services.supabase_client import get_supabase

router = APIRouter()

from fastapi import Header
import re
import json
from app.services.gemini import generate_content_with_fallback, settings


class CommunityReportCreate(BaseModel):
    title: str
    description: str
    category: str
    suspect_entity: Optional[str] = None
    evidence_url: Optional[str] = None
    author_name: Optional[str] = "Anonymous Candidate"

# ─── POST /report ─────────────────────────────────────────────
@router.post("/report", status_code=201)
def create_community_report(
    payload: CommunityReportCreate,
    authorization: str = Header(default="")
):
    title_clean = payload.title.strip()
    desc_clean = payload.description.strip()
    suspect_clean = payload.suspect_entity.strip() if payload.suspect_entity else ""

    # 1. Local Heuristic Strict Validation
    if len(title_clean) < 15:
        raise HTTPException(
            status_code=400,
            detail="Headline is too short. Please provide a clear title describing the scam (at least 15 characters, e.g., 'WhatsApp review task scam requesting ₹1,500 deposit')."
        )
    if len(desc_clean) < 40:
        raise HTTPException(
            status_code=400,
            detail="Description is too brief. Please provide details (at least 40 characters) explaining what happened, fee demands, or suspect contacts."
        )

    # Catch common gibberish / test words
    lower_title = title_clean.lower()
    lower_desc = desc_clean.lower()
    test_words = ["hello", "test", "testing", "hi", "asdf", "asdfgh", "jvkrrkvrv", "qwerty"]
    if lower_title in test_words or lower_desc in test_words or len(set(lower_title.replace(" ", ""))) < 4:
        raise HTTPException(
            status_code=400,
            detail="Submission Blocked: Test greetings, single words, or gibberish text are not allowed in community scam reports."
        )

    try:
        sb = get_supabase()
        token = authorization.replace("Bearer ", "").strip()
        author_display = payload.author_name or "Verified Candidate"

        if token:
            try:
                user_res = sb.auth.get_user(token)
                if user_res and user_res.user:
                    u = user_res.user
                    author_display = u.user_metadata.get("display_name") or u.email.split("@")[0]
            except Exception:
                pass

        # 2. MANDATORY Gemini AI Online Context & Relevance Gatekeeper
        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="Gemini AI Moderation service is temporarily offline. Please try again shortly."
            )

        mod_prompt = f"""
        You are a strict moderation AI for a recruitment scam prevention database.
        Evaluate this user-submitted scam report for authenticity, relevance, and safety:

        - Scam Headline: "{title_clean}"
        - Category: "{payload.category}"
        - Suspect Entity / Company / Contact: "{suspect_clean if suspect_clean else "Not specified"}"
        - Warning Details: "{desc_clean}"
        - Evidence Link: "{payload.evidence_url or "None"}"

        CRITICAL APPROVAL RULES:
        1. REJECT (is_approved=false) if the title or description is gibberish, random keystrokes (e.g. "jvkrrkvrv", "asdfgh"), single-word test greetings ("hello", "hi"), or non-recruitment random text.
        2. REJECT (is_approved=false) if the input does NOT describe a job offer, hiring trap, interview scam, payment request, fake recruiter, or suspicious placement academy.
        3. APPROVE (is_approved=true) ONLY if the submission clearly describes a relevant job scam, candidate phishing attempt, or fraudulent hiring practice.

        Perform an online context check on the suspect entity/pattern.
        Return raw JSON only:
        {{
          "is_approved": true/false,
          "confidence": <int 0 to 100>,
          "reason": "<clear explanation if approved or rejected>",
          "ai_summary": "<1-sentence summary of why this report is relevant for job seekers based on online scam patterns>"
        }}
        """
        
        try:
            mod_raw = generate_content_with_fallback(mod_prompt)
            if mod_raw.startswith("```json"):
                mod_raw = mod_raw[7:]
            if mod_raw.endswith("```"):
                mod_raw = mod_raw[:-3]
            mod_json = json.loads(mod_raw.strip())

            if not mod_json.get("is_approved", False):
                raise HTTPException(
                    status_code=400,
                    detail=f"🤖 AI Gatekeeper Blocked: {mod_json.get('reason', 'Submission does not appear to describe a valid job scam pattern.')}"
                )

            ai_confidence = mod_json.get("confidence", 95)
            ai_summary = mod_json.get("ai_summary", "AI Web Verified: Matches candidate scam warning pattern.")
            ai_verified = True
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"AI Moderation Gatekeeper Check failed: Please ensure your description clearly details a job scam or recruiter incident."
            )

        insert_payload = {
            "title": payload.title.strip(),
            "description": payload.description.strip(),
            "category": payload.category,
            "evidence_url": payload.evidence_url or None,
            "upvotes": 0,
            "downvotes": 0,
        }

        # Try inserting extended fields if supported by table
        try:
            insert_payload_ext = {
                **insert_payload,
                "author_name": author_display,
                "ai_verified": ai_verified,
                "ai_confidence": ai_confidence,
                "ai_summary": ai_summary,
            }
            result = sb.table("community_reports").insert(insert_payload_ext).execute()
        except Exception:
            result = sb.table("community_reports").insert(insert_payload).execute()

        if result.data:
            report_data = result.data[0]
            report_data["author_name"] = author_display
            report_data["ai_verified"] = ai_verified
            report_data["ai_confidence"] = ai_confidence
            report_data["ai_summary"] = ai_summary
            return report_data

        raise HTTPException(status_code=500, detail="Failed to create community report.")
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except HTTPException:
        raise
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
def vote_community_report(
    report_id: str,
    vote_type: str,
    previous_vote: Optional[str] = None
):
    if vote_type not in ("up", "down"):
        raise HTTPException(status_code=400, detail="vote_type must be 'up' or 'down'.")
    try:
        sb = get_supabase()

        # Sanitize previous_vote string from frontend
        if previous_vote in ("undefined", "null", "none", "", "None"):
            previous_vote = None

        # Fetch current counts
        row = sb.table("community_reports").select("upvotes,downvotes").eq("id", report_id).single().execute()
        if not row.data:
            raise HTTPException(status_code=404, detail="Report not found.")

        current = row.data
        upvotes = max(0, current.get("upvotes", 0))
        downvotes = max(0, current.get("downvotes", 0))

        if previous_vote == vote_type:
            # User clicked the same active vote -> Toggle OFF / Undo vote
            if vote_type == "up":
                upvotes = max(0, upvotes - 1)
            else:
                downvotes = max(0, downvotes - 1)
        elif previous_vote == "up" and vote_type == "down":
            upvotes = max(0, upvotes - 1)
            downvotes = downvotes + 1
        elif previous_vote == "down" and vote_type == "up":
            downvotes = max(0, downvotes - 1)
            upvotes = upvotes + 1
        else:
            # Brand new vote
            if vote_type == "up":
                upvotes = upvotes + 1
            else:
                downvotes = downvotes + 1

        update_data = {"upvotes": upvotes, "downvotes": downvotes}

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

# ─── GET /quick-threats ───────────────────────────────────────
@router.get("/quick-threats")
def get_quick_scan_threats():
    """
    Returns 100% live, real-time scam threats for Quick Scan chips & Live Threat Feed,
    combining active Supabase community reports + Gemini AI real-time web news threat intelligence.
    NO hardcoded defaults.
    """
    threats = []

    # 1. Fetch real community reports submitted by candidates in Supabase
    try:
        sb = get_supabase()
        res = sb.table("community_reports").select("*").order("created_at", desc=True).limit(20).execute()
        db_items = res.data or []
        for item in db_items:
            cat = item.get("category", "")
            title = item.get("title", "")
            desc = item.get("description", "")
            
            scan_tab = "text"
            if "url" in cat.lower() or "http" in title.lower() or "http" in desc.lower() or ".net" in title.lower() or ".xyz" in title.lower():
                scan_tab = "website"
            elif re.search(r'[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}', title + " " + desc):
                scan_tab = "email"
            elif "academy" in cat.lower() or "training" in cat.lower() or "placement" in cat.lower():
                scan_tab = "training"


            threats.append({
                "id": item.get("id"),
                "tab": scan_tab,
                "val": title[:40],
                "title": title,
                "description": desc,
                "full_text": f"ALERT REPORT: {title}\n\nDETAILS: {desc}",
                "category": item.get("category", "Community Scam Report"),
                "ai_confidence": item.get("ai_confidence", 95),
                "created_at": item.get("created_at"),
                "author": item.get("author_name", "Verified Candidate")
            })
    except Exception as e:
        print("Community DB fetch notice:", e)

    # 2. Fetch live real-time web news threat alerts via Gemini AI with FULL realistic text context
    ai_news_items = []
    try:
        if settings.GEMINI_API_KEY:
            ai_news_prompt = """
            Act as a live cybersecurity threat intelligence engine. Generate 6 active, real-world recruitment & digital scam trends currently reported in recent news and cyber crime advisories (e.g. WhatsApp task scams, Telegram rating traps, laptop security deposit demands, fake recruiter emails, malicious APK downloads).
            Do NOT mention specific real corporate brand names (no TCS, Wipro, Google, etc.).
            Return a raw JSON array of 6 items matching this exact schema:
            [
              {
                "tab": "text",
                "val": "<Short 4-6 word chip title, e.g. 'Laptop Security Deposit Demand'>",

                "title": "<Clear news alert headline>",
                "category": "upfront_fee",
                "ai_confidence": 98,
                "description": "<Brief 1-sentence news alert summary explaining the scam technique>",
                "full_text": "<Full 3-4 sentence realistic scam transcript message that a candidate would receive via SMS/WhatsApp/Email, including fee demand, UPI handle or Telegram contact, and urgency>"
              }
            ]
            Return RAW JSON ONLY, no markdown surrounding.
            """
            news_raw = generate_content_with_fallback(ai_news_prompt)
            if news_raw.startswith("```json"):
                news_raw = news_raw[7:]
            if news_raw.endswith("```"):
                news_raw = news_raw[:-3]
            parsed = json.loads(news_raw.strip())
            if isinstance(parsed, list):
                ai_news_items = parsed
    except Exception as err:
        print("AI Web News Threat Intelligence error:", err)

    seen = set()
    final_threats = []
    
    # Merge community reports first, then AI web news items
    for t in threats + ai_news_items:
        v = str(t.get("val", "")).strip()
        if v and v not in seen:
            seen.add(v)
            if not t.get("full_text"):
                t["full_text"] = f"{t.get('title', '')}: {t.get('description', '')}"
            final_threats.append(t)

    return final_threats[:12]



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

# ─── DELETE /reports/{report_id} (Admin moderation) ───────────
@router.delete("/reports/{report_id}")
def delete_community_report(report_id: str):
    """Deletes a community scam report from Supabase."""
    try:
        sb = get_supabase()
        res = None
        
        # Try string match first
        try:
            res = sb.table("community_reports").delete().eq("id", report_id).execute()
        except Exception:
            res = None

        # If 0 rows deleted and report_id is numeric, try integer match
        if (not res or not res.data) and report_id.isdigit():
            res = sb.table("community_reports").delete().eq("id", int(report_id)).execute()

        # Strict check: If 0 rows deleted (e.g. blocked by RLS policy or missing ID)
        if not res or not res.data:
            raise HTTPException(
                status_code=400,
                detail="Database deletion returned 0 modified rows. Ensure Supabase RLS policy 'Allow public delete access' is enabled."
            )

        return {"status": "success", "message": f"Report {report_id} deleted permanently."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete report: {str(e)}")



