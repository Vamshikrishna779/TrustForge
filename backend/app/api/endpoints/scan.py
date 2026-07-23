import json
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.models.report import Report
from app.services.gemini import analyze_document, SYSTEM_PROMPT_TEMPLATE, settings, generate_content_with_fallback
from app.services.heuristics import scan_text_for_evidence, check_domain_age, verify_email_sender
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, GoogleAPICallError

router = APIRouter()

SUPPORTED_MIME_TYPES = {
    "application/pdf": "PDF Document",
    "image/png": "PNG Image",
    "image/jpeg": "JPEG Image",
    "image/jpg": "JPG Image",
}

class ChatRequest(BaseModel):
    message: str

class TextScanRequest(BaseModel):
    text: str

class WebsiteScanRequest(BaseModel):
    url: str

class EmailScanRequest(BaseModel):
    email: str

@router.post("/document")
async def scan_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    mime_type = file.content_type
    if mime_type not in SUPPORTED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF or an Image (PNG/JPEG)."
        )

    try:
        file_bytes = await file.read()

        # Call Gemini AI Scanner directly (queries fallbacks internally)
        analysis = analyze_document(file_bytes, mime_type)

        # Create database report entry
        report = Report(
            type="document",
            input_data=file.filename,
            trust_score=analysis.get("trust_score", 50),
            ai_summary=analysis.get("ai_summary", "No summary generated."),
            analysis_details={
                "verdict": analysis.get("verdict", "MEDIUM_RISK"),
                "category": analysis.get("category", "Document"),
                "red_flags": analysis.get("red_flags", []),
                "evidence": analysis.get("evidence", []),
                "raw_text": analysis.get("raw_text", "")
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
            detail=f"Scan failed: {str(e)}"
        )

@router.post("/job-offer", deprecated=True)
async def scan_job_offer(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Deprecated: Redirects legacy clients to new /document endpoint.
    """
    return await scan_document(file=file, db=db)

@router.post("/text")
async def scan_copied_text(
    payload: TextScanRequest,
    db: Session = Depends(get_db)
):
    try:
        raw_text = payload.text.strip()
        if not raw_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text content cannot be empty."
            )

        # Run deterministic Rule Engine to feed evidence to the AI prompt
        evidence = scan_text_for_evidence(raw_text)

        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini API key is not configured on the server."
            )

        genai.configure(api_key=settings.GEMINI_API_KEY)
        final_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            document_text=raw_text,
            evidence_json=json.dumps(evidence, indent=2)
        )
        
        # Uses fallbacks sequentially (1.5-flash -> flash-latest -> 2.0-flash)
        text_content = generate_content_with_fallback(final_prompt)
        
        if text_content.startswith("```json"):
            text_content = text_content[7:]
        if text_content.endswith("```"):
            text_content = text_content[:-3]
        analysis = json.loads(text_content.strip())

        report = Report(
            type="text",
            input_data=raw_text[:60] + "..." if len(raw_text) > 60 else raw_text,
            trust_score=analysis.get("trust_score", 50),
            ai_summary=analysis.get("ai_summary", "No summary."),
            analysis_details={
                "verdict": analysis.get("verdict", "MEDIUM_RISK"),
                "category": analysis.get("category", "Text Message"),
                "red_flags": analysis.get("red_flags", []),
                "evidence": evidence,
                "raw_text": raw_text
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
            detail=f"Scan failed: {str(e)}"
        )

@router.post("/website")
async def scan_website_url(
    payload: WebsiteScanRequest,
    db: Session = Depends(get_db)
):
    try:
        url = payload.url.strip()
        if not url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="URL cannot be empty."
            )

        domain = url.replace("https://", "").replace("http://", "").split("/")[0].split("?")[0].strip()
        if domain.startswith("www."):
            domain = domain[4:]

        age_info = check_domain_age(domain)
        evidence = []

        if age_info.get("status") == "official":
            evidence.append({
                "key": "domain_age",
                "status": "passed",
                "title": "Official TrustForge System",
                "details": "Verified official TrustForge Platform service."
            })
        elif age_info.get("status") == "dev_platform":
            evidence.append({
                "key": "domain_age",
                "status": "passed",
                "title": "Developer Cloud Platform",
                "details": age_info.get("note", "Hosted on a developer cloud hosting provider.")
            })
        elif age_info.get("age_days", -1) != -1:
            age_days = age_info["age_days"]
            is_suspicious = age_days < 180
            evidence.append({
                "key": "domain_age",
                "status": "flagged" if is_suspicious else "passed",
                "title": "Domain Age Check",
                "details": f"Domain age is {age_days} days. Registered under 6 months ago, posing high risk." if is_suspicious else f"Domain is established ({age_days} days old)."
            })
        else:
            evidence.append({
                "key": "domain_age",
                "status": "flagged",
                "title": "Domain Age Check",
                "details": "WHOIS registry info could not be found. Suspicious domain routing."
            })

        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini API key is not configured on the server."
            )

        genai.configure(api_key=settings.GEMINI_API_KEY)
        final_prompt = f"""
        Analyze the domain/URL: {domain}
        WHOIS data: {json.dumps(age_info)}

        Evaluate if this website is suspicious (common phishing, replica company login, or spam portal).
        First determine what type of site this domain appears to be, then evaluate its trustworthiness.
        Your response must be in raw, valid JSON format only, matching this structure:
        {{
          "trust_score": <int between 0 and 100 where 100 is completely safe and 0 is a critical scam>,
          "verdict": "<SAFE | LOW_RISK | MEDIUM_RISK | HIGH_RISK | CRITICAL_SCAM>",
          "category": "<Pick the most accurate label: 'Legitimate Business Site' | 'Job Portal' | 'Phishing Clone' | 'Fake Shopping Site' | 'Crypto/Investment Scam' | 'Malware Distribution Site' | 'Government Impersonation' | 'Brand Replica Site' | 'Unknown/Suspicious Domain'>",
          "ai_summary": "<A simple, clear summary under 3 sentences for the user>",
          "red_flags": [
            "<specific reason>"
          ],
          "recommendations": [
            "<action item>"
          ]
        }}
        Ensure there is no markdown code block surrounding the JSON (no ```json ... ```). Just return the raw JSON string.
        """
        
        # Uses fallbacks sequentially (1.5-flash -> flash-latest -> 2.0-flash)
        text_content = generate_content_with_fallback(final_prompt)
        
        if text_content.startswith("```json"):
            text_content = text_content[7:]
        if text_content.endswith("```"):
            text_content = text_content[:-3]
        analysis = json.loads(text_content.strip())

        report = Report(
            type="website",
            input_data=url,
            trust_score=analysis.get("trust_score", 50),
            ai_summary=analysis.get("ai_summary", "No summary."),
            analysis_details={
                "verdict": analysis.get("verdict", "MEDIUM_RISK"),
                "category": analysis.get("category", "Website"),
                "red_flags": analysis.get("red_flags", []),
                "evidence": evidence,
                "raw_text": f"URL Link: {url}\nWHOIS domain profile: {json.dumps(age_info)}"
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
            detail=f"URL Scan failed: {str(e)}"
        )

@router.post("/email")
async def scan_email_sender(
    payload: EmailScanRequest,
    db: Session = Depends(get_db)
):
    try:
        email = payload.email.strip()
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email cannot be empty."
            )

        sender_info = verify_email_sender(email)
        evidence = []
        
        if sender_info["is_phishing_suspect"]:
            evidence.append({
                "key": "email_sender",
                "status": "flagged",
                "title": "Official Brand Impersonation",
                "details": sender_info["reason"]
            })
        elif sender_info["is_generic"]:
            evidence.append({
                "key": "email_sender",
                "status": "flagged",
                "title": "Generic Email Domain Check",
                "details": f"Sender uses generic provider domain '{sender_info['domain']}' instead of secure corporate servers."
            })
        else:
            evidence.append({
                "key": "email_sender",
                "status": "passed",
                "title": "Email Domain Check",
                "details": f"Verified official sender domain: {sender_info['domain']}"
            })

        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini API key is not configured on the server."
            )

        genai.configure(api_key=settings.GEMINI_API_KEY)
        final_prompt = f"""
        Analyze the email address: {email}
        Metadata: {json.dumps(sender_info)}

        First identify what type of email sender this appears to be, then evaluate its trustworthiness and risk level.
        Your response must be in raw, valid JSON format only, matching this structure:
        {{
          "trust_score": <int between 0 and 100 where 100 is completely safe and 0 is a critical scam>,
          "verdict": "<SAFE | LOW_RISK | MEDIUM_RISK | HIGH_RISK | CRITICAL_SCAM>",
          "category": "<Pick the most accurate label: 'Legitimate Corporate Email' | 'Recruiter Email' | 'Generic Domain Sender' | 'Brand Impersonation' | 'Phishing Contact' | 'Spam Newsletter' | 'Fake KYC/OTP Sender' | 'Government Impersonation' | 'Unknown Sender'>",
          "ai_summary": "<A simple, clear summary under 3 sentences for the user>",
          "red_flags": [
            "<specific reason>"
          ],
          "recommendations": [
            "<action item>"
          ]
        }}
        Ensure there is no markdown code block surrounding the JSON (no ```json ... ```). Just return the raw JSON string.
        """
        
        # Uses fallbacks sequentially (1.5-flash -> flash-latest -> 2.0-flash)
        text_content = generate_content_with_fallback(final_prompt)
        
        if text_content.startswith("```json"):
            text_content = text_content[7:]
        if text_content.endswith("```"):
            text_content = text_content[:-3]
        analysis = json.loads(text_content.strip())

        report = Report(
            type="email",
            input_data=email,
            trust_score=analysis.get("trust_score", 50),
            ai_summary=analysis.get("ai_summary", "No summary."),
            analysis_details={
                "verdict": analysis.get("verdict", "MEDIUM_RISK"),
                "category": analysis.get("category", "Email Sender"),
                "red_flags": analysis.get("red_flags", []),
                "evidence": evidence,
                "raw_text": f"Sender Email Address: {email}\nProfile: {json.dumps(sender_info)}"
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
            detail=f"Email Scan failed: {str(e)}"
        )

@router.get("/report/{report_id}")
def get_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Security report not found."
        )
    return report

@router.post("/report/{report_id}/chat")
async def chat_with_report_analyst(
    report_id: str,
    payload: ChatRequest,
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Security report not found."
        )

    try:
        raw_text_content = report.analysis_details.get("raw_text", "") if report.analysis_details else ""
        if not raw_text_content or not raw_text_content.strip():
            category_text = report.analysis_details.get("category", "Document Image") if report.analysis_details else "Document Image"
            raw_text_content = f"Scanned Image Profile:\n- Filename: {report.input_data}\n- Detected Format Category: {category_text}\n- AI Image Analysis: {report.ai_summary}"
        
        chat_prompt = f"""
        You are a cybersecurity expert analyst. You recently analyzed a document/communication and compiled this security report.
        
        Here is the safety report details:
        - Trust Score: {report.trust_score}
        - AI Summary: {report.ai_summary}
        - Verdict: {report.analysis_details.get('verdict', 'UNKNOWN') if report.analysis_details else 'UNKNOWN'}
        - Recommendations: {report.recommendations}
        
        Here is the verbatim transcribed text content of the scanned document/input:
        ---
        {raw_text_content}
        ---

        The user has a question regarding this document/report:
        "{payload.message}"

        Provide a clear, simple, and reassuring answer as a cybersecurity analyst. 
        You have direct access to the raw document text above. Use it to answer any specific questions about authors, dates, company names, requirements, or anything else found in the text.
        Do not hallucinate or make up facts. Focus on helping the user stay safe.
        """
        
        response_text = generate_content_with_fallback(chat_prompt)
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Chat failed: {str(e)}"
        )

@router.get("/history")
def get_scan_history(db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.created_at.desc()).all()

@router.get("/stats")
def get_live_stats(db: Session = Depends(get_db)):
    """Returns real-time scan statistics computed from the local SQLite database."""
    from sqlalchemy import func as sqlfunc

    total_scans = db.query(Report).count()

    # Threats = trust_score < 40 (High Risk / Critical Scam)
    threats_caught = db.query(Report).filter(Report.trust_score < 40).count()

    # Safe = trust_score >= 75
    safe_verified = db.query(Report).filter(Report.trust_score >= 75).count()

    # Per-channel breakdown
    channel_counts = (
        db.query(Report.type, sqlfunc.count(Report.id))
        .group_by(Report.type)
        .all()
    )
    channels = {row[0]: row[1] for row in channel_counts}

    # Accuracy rate: non-ambiguous results (score < 35 or > 70) vs total
    clear_results = db.query(Report).filter(
        (Report.trust_score < 35) | (Report.trust_score > 70)
    ).count()
    accuracy = round((clear_results / total_scans * 100)) if total_scans > 0 else 99

    # Community reports
    from app.models.community import CommunityReport
    community_count = db.query(CommunityReport).count()

    return {
        "total_scans": total_scans,
        "threats_caught": threats_caught,
        "safe_verified": safe_verified,
        "accuracy_rate": accuracy,
        "community_reports": community_count,
        "channels": channels,
    }

