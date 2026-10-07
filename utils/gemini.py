"""
PNMP - Gemini Food Recognition Utility
======================================
Provides server-side multimodal image analysis for food identification,
nutritional estimation, and structured JSON output validation using
the Google GenAI SDK.
"""

import os
import json
import re
from typing import Dict, Any, Optional, Tuple

# Configurable environment variables
GEMINI_MODEL_DEFAULT = "gemini-3.8-flash"

FOOD_RECOGNITION_PROMPT = """You are a food recognition assistant for a nutrition planning application.

Analyze the provided food image.

Identify the most likely food or dish.

Estimate the visible serving size and nutritional information.

Return ONLY valid JSON.

Do not include Markdown.
Do not include ```json.
Do not include explanations outside the JSON.

Use this exact structure:

{
  "food_name": "",
  "confidence": 0,
  "serving_size": "",
  "calories": 0,
  "protein": 0,
  "carbohydrates": 0,
  "fat": 0,
  "fiber": 0,
  "sugar": 0,
  "ingredients": [],
  "health_notes": "",
  "warnings": ""
}

If the image is unclear, do not invent excessive certainty.

Set confidence appropriately.

If the image does not appear to contain food, return a safe response indicating that the image could not be identified as food."""


def get_gemini_client():
    """
    Initializes and returns a Google GenAI client instance.
    Reads GEMINI_API_KEY from environment variables.
    Raises ValueError if API key is missing.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise ValueError("Food recognition is not configured. Please configure the Gemini API key.")

    try:
        from google import genai
        # Initialize Google GenAI with telemetry User-Agent
        client = genai.Client(
            api_key=api_key,
            http_options={'headers': {'User-Agent': 'aistudio-build'}}
        )
        return client
    except ImportError:
        raise RuntimeError("google-genai SDK is not installed in the environment.")


def extract_json_safely(raw_text: str) -> Optional[Dict[str, Any]]:
    """
    Extracts and parses JSON from Gemini's response, stripping
    markdown code blocks or conversational text if present.
    """
    if not raw_text or not isinstance(raw_text, str):
        return None

    cleaned = raw_text.strip()
    # Strip markdown backticks if present
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Attempt to find the first '{' and matching '}'
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
    return None


def validate_gemini_response(data: Any) -> Tuple[bool, Optional[str]]:
    """
    Validates that the Gemini output contains all required fields,
    proper data types, and non-empty values.
    Returns (is_valid, error_message).
    """
    if not isinstance(data, dict):
        return False, "Response must be a JSON object"

    food_name = data.get("food_name")
    if not food_name or not isinstance(food_name, str) or not food_name.strip():
        return False, "food_name is missing or invalid"

    # Numeric fields validation
    numeric_fields = ["confidence", "calories", "protein", "carbohydrates", "fat", "fiber", "sugar"]
    for field in numeric_fields:
        val = data.get(field)
        if val is not None and not isinstance(val, (int, float)):
            try:
                float(val)
            except (ValueError, TypeError):
                return False, f"Field '{field}' must be numeric"

    # Ingredients must be a list
    ingredients = data.get("ingredients")
    if ingredients is not None and not isinstance(ingredients, list):
        return False, "ingredients must be an array"

    return True, None


def normalize_food_result(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes the parsed food result, ensuring all numeric fields
    are non-negative numbers, lists are lists of strings, and strings are cleaned.
    """
    def to_safe_num(val, default=0, is_int=False):
        try:
            num = float(val) if val is not None else default
            if num < 0:
                num = 0
            return int(round(num)) if is_int else round(num, 1)
        except (ValueError, TypeError):
            return default

    # Normalize ingredients
    raw_ingredients = raw_data.get("ingredients", [])
    if isinstance(raw_ingredients, list):
        ingredients = [str(item).strip() for item in raw_ingredients if str(item).strip()]
    else:
        ingredients = []

    confidence = to_safe_num(raw_data.get("confidence", 0), default=0, is_int=True)
    if confidence > 100:
        confidence = 100

    return {
        "food_name": str(raw_data.get("food_name", "Unknown Food")).strip(),
        "confidence": confidence,
        "serving_size": str(raw_data.get("serving_size", "1 serving")).strip(),
        "calories": to_safe_num(raw_data.get("calories", 0), is_int=True),
        "protein": to_safe_num(raw_data.get("protein", 0)),
        "carbohydrates": to_safe_num(raw_data.get("carbohydrates", 0)),
        "fat": to_safe_num(raw_data.get("fat", 0)),
        "fiber": to_safe_num(raw_data.get("fiber", 0)),
        "sugar": to_safe_num(raw_data.get("sugar", 0)),
        "ingredients": ingredients,
        "health_notes": str(raw_data.get("health_notes", "")).strip(),
        "warnings": str(raw_data.get("warnings", "")).strip(),
    }


def analyze_food_image(image_bytes: bytes, mime_type: str) -> Dict[str, Any]:
    """
    Sends the food image to Gemini and returns structured, normalized nutrition data.
    """
    client = get_gemini_client()
    model_name = os.getenv("GEMINI_MODEL", "").strip() or GEMINI_MODEL_DEFAULT

    from google.genai import types

    # Prepare multimodal content part
    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

    response = client.models.generateContent(
        model=model_name,
        contents=[image_part, FOOD_RECOGNITION_PROMPT],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        )
    )

    response_text = getattr(response, "text", "") or ""
    parsed = extract_json_safely(response_text)

    if not parsed:
        raise ValueError("Could not parse food recognition results. Please try another image.")

    is_valid, error_msg = validate_gemini_response(parsed)
    if not is_valid:
        raise ValueError(f"Invalid food recognition response: {error_msg}")

    return normalize_food_result(parsed)
