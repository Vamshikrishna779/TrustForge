import google.generativeai as genai
from app.core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

try:
    print("Testing tools='google_search' with upgraded SDK...")
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        tools="google_search"
    )
    response = model.generate_content("Does the company CREONEX DEV have an Instagram or LinkedIn profile? Search Google and summarize the findings.")
    print("SUCCESS!")
    print("Response:")
    print(response.text.strip())
except Exception as e:
    print(f"FAILED: {type(e).__name__} - {str(e)}")
