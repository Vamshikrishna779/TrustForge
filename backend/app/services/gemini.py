import json
import io
import pypdf
import google.generativeai as genai
from app.core.config import settings

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPT_TEMPLATE = """
You are a cybersecurity expert analyst. You are evaluating a job offer, email, or message for potential scams targeting candidates in India.

Below is the transcribed text of the document:
---
{document_text}
---

Our rule engine scanned the document text and flagged the following structured evidence indicators:
{evidence_json}

Using the document text and these evidence items, provide a finalized cybersecurity analysis.
If any evidence checks were flagged as suspicious, explain why they pose a security risk in this context.

Your response must be in raw, valid JSON format only, matching this structure:
{{
  "trust_score": <int between 0 and 100 where 100 is completely safe and 0 is a critical scam>,
  "verdict": "<SAFE | LOW_RISK | MEDIUM_RISK | HIGH_RISK | CRITICAL_SCAM>",
  "category": "<Dynamic category name identifying what this input is, e.g. 'Candidate Resume', 'Job Offer Letter', 'WhatsApp Recruitment Message', 'Recruiter Contact Email', 'Website Login Domain'>",
  "ai_summary": "<A simple, clear summary under 3 sentences for the user explaining if this is safe to trust>",
  "red_flags": [
    "<specific reason 1>",
    "<specific reason 2>"
  ],
  "recommendations": [
    "<recommendation action item 1>",
    "<recommendation action item 2>"
  ]
}}
Ensure there is no markdown code block surrounding the JSON (no ```json ... ```). Just return the raw JSON string. Do not hallucinate any details.
"""

SYSTEM_PROMPT = """
You are a cybersecurity expert analyst evaluating a job offer, email, message, or document for potential scams targeting candidates in India.

Analyze the provided input context and evaluate it for safety. You must extract and compile structured evidence indicators in your final response:
1. Official Email Impersonation: Flag generic domains (gmail.com, yahoo.com) if official brands (TCS, Amazon, etc.) are referenced, UNLESS this is clearly a candidate's own Resume/CV (in which case mark as passed).
2. Upfront Payment Requests: Scan for demands for security deposits, registration fees, training fees, laptop fees.
3. Out-of-Band Chats: Scan for Telegram links (t.me/), user handles (@), or WhatsApp redirect links.
4. UPI Handles: Extract any UPI payment handles (like name@ybl, name@okaxis) but do not mistake standard email addresses for UPI IDs.
5. Urgency: Check for high urgency keywords ("immediate joiner", "urgent interview").

Your response must be in raw, valid JSON format only, matching this structure:
{
  "trust_score": <int between 0 and 100 where 100 is completely safe and 0 is a critical scam>,
  "verdict": "<SAFE | LOW_RISK | MEDIUM_RISK | HIGH_RISK | CRITICAL_SCAM>",
  "category": "<Dynamic category name identifying what this input is, e.g. 'Candidate Resume', 'Job Offer Letter', 'WhatsApp Recruitment Message', 'Recruiter Contact Email', 'Website Login Domain'>",
  "ai_summary": "<A simple, clear summary under 3 sentences for the user explaining if this is safe to trust>",
  "raw_text": "<Verbatim extracted/transcribed raw text content of this document or image screenshot>",
  "evidence": [
    {
      "key": "email_check" | "payment_check" | "telegram_check" | "whatsapp_check" | "upi_check" | "urgency_check",
      "status": "passed" | "flagged",
      "title": "<Human-readable title, e.g. 'Upfront Payments'>",
      "details": "<Clear description of what was verified or flagged>"
    }
  ],
  "red_flags": [
    "<specific reason for flagged items>"
  ],
  "recommendations": [
    "<recommendation action item for safety>"
  ]
}
Ensure there is no markdown code block surrounding the JSON (no ```json ... ```). Just return the raw JSON string. Do not hallucinate any details.
"""

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Parses a PDF locally on the server to extract text instantly.
    """
    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text.strip()
    except Exception as e:
        print(f"Local PDF parser warning: {e}")
        return ""

def generate_content_with_fallback(contents, system_instruction: str = None, tools = None) -> str:
    """
    Attempts to generate content trying different Gemini models in sequence.
    If one model hits a 429 quota exception, it falls back to the next model.
    """
    models_to_try = [
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-2.0-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-1.5-flash",
        "gemini-2.0-flash",
        "gemini-3.5-flash",
        "gemini-3.6-flash"
    ]
    
    last_err = None
    for model_name in models_to_try:
        try:
            print(f"Attempting scan with model: {model_name}...")
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_instruction,
                tools=tools
            )
            response = model.generate_content(contents)
            return response.text.strip()
        except Exception as e:
            last_err = e
            print(f"Model {model_name} failed: {e}")
            continue
            
    if last_err:
        raise last_err
    raise Exception("All available Gemini models failed to respond.")

def analyze_document(file_bytes: bytes, mime_type: str) -> dict:
    """
    Fast multimodal scan with fallback logic across all available models.
    """
    if not settings.GEMINI_API_KEY:
        return {
            "trust_score": 50,
            "verdict": "MEDIUM_RISK",
            "category": "Job Offer Document",
            "ai_summary": "Gemini API key is not configured on the backend.",
            "red_flags": ["Missing Gemini API Key"],
            "recommendations": ["Configure the GEMINI_API_KEY in backend settings."],
            "evidence": [],
            "raw_text": ""
        }

    try:
        raw_text = ""
        if mime_type == "application/pdf":
            raw_text = extract_text_from_pdf(file_bytes)

        if raw_text:
            prompt = f"{SYSTEM_PROMPT}\n\nDocument Text:\n{raw_text}"
            text_content = generate_content_with_fallback(prompt)
        else:
            document_part = {
                "mime_type": mime_type,
                "data": file_bytes
            }
            text_content = generate_content_with_fallback([SYSTEM_PROMPT, document_part])
        
        if text_content.startswith("```json"):
            text_content = text_content[7:]
        if text_content.endswith("```"):
            text_content = text_content[:-3]
            
        result = json.loads(text_content.strip())
        
        # Ensure raw_text is always populated in JSON even if Gemini missed it
        if "raw_text" not in result or not result["raw_text"]:
            result["raw_text"] = raw_text
            
        return result

    except Exception as e:
        raise e
