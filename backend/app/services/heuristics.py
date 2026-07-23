import re
import whois
from datetime import datetime

def extract_domains(text: str) -> list[str]:
    """
    Finds and returns all website domains inside a block of text.
    """
    url_pattern = re.compile(r'(?:https?://)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)')
    return list(set(url_pattern.findall(text)))

def check_domain_age(domain: str) -> dict:
    """
    Queries the WHOIS server to calculate the age of a domain.
    """
    try:
        w = whois.whois(domain)
        creation_date = w.creation_date
        
        if isinstance(creation_date, list):
            creation_date = creation_date[0]
            
        if not creation_date:
            return {"age_days": -1, "status": "unknown"}
            
        age = datetime.now() - creation_date
        return {
            "age_days": age.days,
            "status": "new" if age.days < 180 else "established",
            "created_at": creation_date.isoformat()
        }
    except Exception:
        return {"age_days": -1, "status": "failed"}

def scan_text_for_evidence(text: str) -> list[dict]:
    """
    Runs deterministic checks on document/input text and returns structured evidence.
    """
    evidence = []
    text_lower = text.lower()

    # 1. Official Email Check
    emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    generic_domains = [
        "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", 
        "email.com", "mail.com", "proton.me", "protonmail.com", 
        "zoho.com", "zoho.in", "yandex.com", "gmx.com", 
        "aol.com", "icloud.com", "rediffmail.com"
    ]
    corporate_keywords = ["amazon", "tcs", "tata", "wipro", "infosys", "reliance", "hfc", "icici", "microsoft", "google", "indeed"]
    
    is_resume = "experience" in text_lower and ("education" in text_lower or "skills" in text_lower or "projects" in text_lower or "resume" in text_lower)
    
    email_flagged = False
    flagged_email_details = ""
    if not is_resume:
        for email in emails:
            domain = email.split("@")[-1].lower()
            if domain in generic_domains:
                mentioned_corps = [corp for corp in corporate_keywords if corp in text_lower]
                if mentioned_corps:
                    email_flagged = True
                    flagged_email_details = f"Sender is using a generic address ({email}) but the text references official brands ({', '.join(mentioned_corps)})."
                    break

    if email_flagged:
        evidence.append({
            "key": "email_check",
            "status": "flagged",
            "title": "Official Email Impersonation",
            "details": flagged_email_details
        })
    elif emails:
        evidence.append({
            "key": "email_check",
            "status": "passed",
            "title": "Email Check",
            "details": f"Verified official email domain: {emails[0].split('@')[-1]}"
        })

    # 2. Upfront Payment requests
    payment_terms = ["registration fee", "security deposit", "training fee", "laptop security", "refundable deposit", "refundable amount", "documentation charges"]
    matched_payments = [term for term in payment_terms if term in text_lower]
    if matched_payments:
        evidence.append({
            "key": "payment_check",
            "status": "flagged",
            "title": "Upfront Payment Requests",
            "details": f"Detected requests for upfront cash: {', '.join(matched_payments)}. Legitimate companies never charge candidates."
        })
    else:
        evidence.append({
            "key": "payment_check",
            "status": "passed",
            "title": "Upfront Payments",
            "details": "No indicators of registration fee demands found."
        })

    # 3. Telegram Link Redirects
    telegram_flag = "t.me/" in text_lower or "@telegram" in text_lower or "telegram channel" in text_lower
    if telegram_flag:
        evidence.append({
            "key": "telegram_check",
            "status": "flagged",
            "title": "Out-of-Band Channels",
            "details": "Discovered Telegram redirects. Scammers frequently use Telegram to run automated fake tasks or avoid local law tracking."
        })
    else:
        evidence.append({
            "key": "telegram_check",
            "status": "passed",
            "title": "Interview Channels",
            "details": "No suspicious Telegram redirect channels found."
        })

    # 4. WhatsApp Group Redirects
    whatsapp_flag = "wa.me/" in text_lower or "chat.whatsapp.com" in text_lower or "whatsapp group" in text_lower
    if whatsapp_flag:
        evidence.append({
            "key": "whatsapp_check",
            "status": "flagged",
            "title": "WhatsApp Redirects",
            "details": "Discovered WhatsApp chat redirect links. Unofficial channels are rarely used for formal corporate job offers."
        })

    # 5. UPI ID Detection
    upi_pattern = re.compile(r'[a-zA-Z0-9\.\-_]+@[a-zA-Z0-9]{3,}')
    raw_upi_ids = upi_pattern.findall(text)
    upi_ids = []
    for handle in raw_upi_ids:
        handle_lower = handle.lower()
        if any(handle_lower.endswith(suffix) for suffix in [".com", ".in", ".org", ".net", ".edu", ".co", ".info", ".gov"]):
            continue
        if "@gmail" in handle_lower or "@yahoo" in handle_lower or "@outlook" in handle_lower or "@hotmail" in handle_lower:
            continue
        upi_ids.append(handle)

    if upi_ids:
        evidence.append({
            "key": "upi_check",
            "status": "flagged",
            "title": "UPI Handle Detected",
            "details": f"Discovered UPI payment handles: {', '.join(upi_ids)}. Standard job offers do not embed personal payment IDs."
        })

    # 6. Urgency Keywords
    urgency_terms = ["immediate start", "vacancy closes today", "urgent interview", "join immediately", "accept today"]
    matched_urgency = [term for term in urgency_terms if term in text_lower]
    if matched_urgency:
        evidence.append({
            "key": "urgency_check",
            "status": "flagged",
            "title": "Artificial Urgency",
            "details": f"High urgency language detected: {', '.join(matched_urgency)}. This is designed to rush users into making unsafe choices."
        })

    return evidence

def verify_email_sender(email: str, claimed_company_domain: str = None) -> dict:
    """
    Checks if a sender email address raises a phishing red flag.
    Supports generic domain checks, lookalike brand checks, and brand prefix spoofing.
    """
    generic_domains = [
        "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", 
        "email.com", "mail.com", "proton.me", "protonmail.com", 
        "zoho.com", "zoho.in", "yandex.com", "gmx.com", 
        "aol.com", "icloud.com", "rediffmail.com"
    ]
    
    email_parts = email.split("@")
    if len(email_parts) < 2:
        return {
            "email": email,
            "domain": "",
            "is_generic": True,
            "is_phishing_suspect": True,
            "reason": "Invalid email formatting."
        }
        
    prefix = email_parts[0].lower()
    email_domain = email_parts[1].lower()
    
    is_generic = email_domain in generic_domains
    
    corporate_keywords = ["amazon", "tcs", "wipro", "infosys", "reliance", "google", "microsoft", "indeed", "naukri", "placement", "career"]
    
    is_phishing_suspect = False
    reason = ""
    
    # Generic domain checks containing corporate brands in prefix
    if is_generic:
        matched_brands = [corp for corp in corporate_keywords if corp in prefix]
        if matched_brands:
            is_phishing_suspect = True
            reason = f"Impersonation risk: generic provider '{email_domain}' is used but the user prefix contains brand terms ({', '.join(matched_brands)})."
            
    # Lookalike domains checks
    if not is_generic:
        brand_mappings = {
            "indeed": "indeed.com",
            "amazon": "amazon.com",
            "google": "google.com",
            "tcs": "tcs.com",
            "wipro": "wipro.com",
            "naukri": "naukri.com"
        }
        for brand, official in brand_mappings.items():
            if brand in email_domain and email_domain != official and not email_domain.endswith("." + official):
                is_phishing_suspect = True
                reason = f"Domain spoofing: domain '{email_domain}' lookalike spoof-mimics brand '{brand}' (official: {official})."
                break
                
    return {
        "email": email,
        "domain": email_domain,
        "is_generic": is_generic,
        "is_phishing_suspect": is_phishing_suspect,
        "reason": reason
    }

