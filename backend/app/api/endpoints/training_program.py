import json
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.models.report import Report
from app.services.gemini import generate_content_with_fallback, settings
from app.services.heuristics import check_domain_age, scan_text_for_evidence
from app.services.supabase_client import get_supabase
from google.api_core.exceptions import ResourceExhausted, GoogleAPICallError

router = APIRouter()

class TrainingProgramScanRequest(BaseModel):
    academy_name: str
    website_url: str | None = None
    pasted_details: str | None = None

def verify_pro_user(authorization: str):
    token = authorization.replace("Bearer ", "").strip() if authorization else ""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Placement Program Verification is a Pro feature. Please sign in with a Pro account."
        )
    try:
        sb = get_supabase()
        user_res = sb.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token.")
        
        user_id = str(user_res.user.id)
        plan_res = sb.table("user_plans").select("plan").eq("user_id", user_id).single().execute()
        if not plan_res.data or plan_res.data.get("plan") != "pro":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Placement Program Verification requires a Pro subscription (₹7/mo)."
            )
        return user_res.user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Pro feature authorization failed: {str(e)}"
        )

@router.post("/scan")
async def scan_training_program(
    payload: TrainingProgramScanRequest,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db)
):
    verify_pro_user(authorization)

    academy_name = payload.academy_name.strip()
    if not academy_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Academy or training provider name cannot be empty."
        )

    try:
        evidence = []
        website_url = payload.website_url.strip() if payload.website_url else ""
        pasted_details = payload.pasted_details.strip() if payload.pasted_details else ""

        # 1. Analyze domain age if URL is provided
        domain_age_info = {}
        if website_url:
            domain = website_url.replace("https://", "").replace("http://", "").split("/")[0].split("?")[0].strip()
            if domain.startswith("www."):
                domain = domain[4:]
            
            domain_age_info = check_domain_age(domain)
            if domain_age_info.get("age_days", -1) != -1:
                age_days = domain_age_info["age_days"]
                is_suspicious = age_days < 180
                evidence.append({
                    "key": "domain_age",
                    "status": "flagged" if is_suspicious else "passed",
                    "title": "Academy Domain Registry",
                    "details": f"Academy website domain '{domain}' is only {age_days} days old (new portal)." if is_suspicious else f"Academy website domain is established ({age_days} days old)."
                })
            else:
                evidence.append({
                    "key": "domain_age",
                    "status": "flagged",
                    "title": "Academy Domain Registry",
                    "details": f"Could not verify registry age for academy domain '{domain}'. Suspicious hosting structure."
                })

        # 2. Run rule engine checks on the pasted text details
        if pasted_details:
            text_evidence = scan_text_for_evidence(pasted_details)
            # Filter and merge relevant checks (payment charges, telegram redirection, WhatsApp groups)
            for item in text_evidence:
                if item["key"] in ["payment_check", "telegram_check", "whatsapp_check", "upi_check"]:
                    # Adjust title/context slightly for academies
                    if item["key"] == "payment_check":
                        item["title"] = "Upfront Training Charges"
                    evidence.append(item)

        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini API key is not configured on the server."
            )

        # 3. Formulate specialized prompt to identify training/placement scams
        final_prompt = f"""
        Analyze the details of this recruitment training or placement program:
        - Academy Name: {academy_name}
        - Website URL: {website_url if website_url else "Not Provided"}
        - Domain WHOIS Age Profile: {json.dumps(domain_age_info)}
        - Pasted Program Details / Terms:
        ---
        {pasted_details if pasted_details else "No program copy provided."}
        ---

        Evaluate if this program matches typical placement scams:
        1. "Job Guarantee" traps: Promising selection at top corporate companies (e.g. TCS, Wipro, Google, Amazon) conditional on paying upfront for training/certificates.
        2. Unrealistic job claims or excessive recruitment fees.
        3. Fake physical addresses or lack of corporate history.

        Your response must be in raw, valid JSON format only, matching this structure:
        {{
          "trust_score": <int between 0 and 100 where 100 is completely safe and 0 is a critical scam>,
          "verdict": "<SAFE | LOW_RISK | MEDIUM_RISK | HIGH_RISK | CRITICAL_SCAM>",
          "category": "Placement Academy Check",
          "ai_summary": "<A simple, clear summary under 3 sentences for the candidate explaining the safety of this academy>",
          "red_flags": [
            "<specific risk indicator found, e.g. 'Demands Rs 12,000 upfront training registration fee'>"
          ],
          "recommendations": [
            "<action item, e.g. 'Verify partnership status directly with the claimed parent companies'>"
          ]
        }}
        Ensure there is no markdown code block surrounding the JSON (no ```json ... ```). Just return the raw JSON string.
        """

        # Uses fallbacks sequentially (3.1-flash-lite -> 3.5-flash-lite -> 2.0-flash-lite)
        text_content = generate_content_with_fallback(final_prompt)

        if text_content.startswith("```json"):
            text_content = text_content[7:]
        if text_content.endswith("```"):
            text_content = text_content[:-3]
        analysis = json.loads(text_content.strip())

        raw_context_data = f"Academy Name: {academy_name}\nWebsite: {website_url}\nProgram Details: {pasted_details}"

        report = Report(
            type="training_program",
            input_data=academy_name,
            trust_score=analysis.get("trust_score", 50),
            ai_summary=analysis.get("ai_summary", "No summary."),
            analysis_details={
                "verdict": analysis.get("verdict", "MEDIUM_RISK"),
                "category": "Training Program",
                "red_flags": analysis.get("red_flags", []),
                "evidence": evidence,
                "raw_text": raw_context_data
            },
            recommendations=analysis.get("recommendations", []),
            is_public=True
        )

        db.add(report)
        db.commit()
        db.refresh(report)

        return {
            "id": report.id,
            "type": report.type,
            "trust_score": report.trust_score,
            "ai_summary": report.ai_summary,
            "analysis_details": report.analysis_details,
            "recommendations": report.recommendations,
            "created_at": report.created_at
        }

    except ResourceExhausted:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Gemini API rate limit exceeded across all models. Please wait 30 seconds and retry."
        )
    except GoogleAPICallError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini API service error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Placement Program scan failed: {str(e)}"
        )
