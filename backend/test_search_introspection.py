import google.generativeai as genai
import inspect

try:
    print("Introspecting genai.types to find Google Search class...")
    import google.generativeai.types as types
    for name, obj in inspect.getmembers(types):
        if "Search" in name or "Google" in name:
            print(f"Name: {name}")
    print("Introspecting genai.types.content_types...")
    import google.generativeai.types.content_types as ct
    for name, obj in inspect.getmembers(ct):
        if "Search" in name or "Google" in name or "Tool" in name:
            print(f"Content Type Name: {name}")
except Exception as e:
    print(f"Error: {e}")
