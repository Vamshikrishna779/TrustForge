import google.generativeai as genai
import inspect
from google.generativeai.types import content_types

try:
    print("Inspecting GoogleSearchRetrievalDict structure...")
    # Let's inspect the fields/source of content_types.Tool
    # We can inspect the class signature
    print(inspect.signature(content_types.Tool))
except Exception as e:
    print(f"Error: {e}")

try:
    print("Testing Tool instance with google_search...")
    # In older SDKs:
    # Tool = {"google_search_retrieval": {"dynamic_retrieval_config": {"mode": "MODE_DYNAMIC", "dynamic_threshold": 0.3}}}
    # Let's see if this format works!
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        tools=[{"google_search_retrieval": {}}]
    )
    print("SUCCESS: Model created with google_search_retrieval!")
    response = model.generate_content("Does the company CREONEX DEV have an Instagram or LinkedIn profile? Search Google and summarize the findings.")
    print("SUCCESS: Response:")
    print(response.text.strip())
except Exception as e:
    print(f"FAILED: {type(e).__name__} - {str(e)}")
