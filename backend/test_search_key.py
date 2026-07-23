import google.generativeai as genai
import os
import dotenv

dotenv.load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

try:
    print("Testing tools=[{'google_search_retrieval': {}}] with correct key config...")
    # Try gemini-3.1-flash-lite since we verified it works on their key
    model = genai.GenerativeModel(
        model_name="gemini-3.1-flash-lite",
        tools=[{"google_search_retrieval": {}}]
    )
    response = model.generate_content("Does the company CREONEX DEV have an Instagram or LinkedIn profile? Search Google and summarize the findings.")
    print("SUCCESS!")
    print("Response:")
    print(response.text.strip()[:250])
except Exception as e:
    print(f"FAILED: {type(e).__name__} - {str(e)}")
