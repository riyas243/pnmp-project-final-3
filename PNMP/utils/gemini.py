"""
PNMP Gemini API Client
Integrates with Google AI Studio Gemini Multimodal API
- Food image recognition with structured JSON extraction
- 7-Day personalized AI meal plan generation
- Safe error handling, schema validation, and normalization
"""

import os
import re
import json
import base64
import logging
import requests
from config import Config

logger = logging.getLogger("pnmp.gemini")

def get_gemini_config() -> dict:
    """
    Returns current Gemini API configuration status safely without leaking keys.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip() or Config.GEMINI_API_KEY
    model = os.getenv("GEMINI_MODEL", "").strip() or Config.GEMINI_MODEL or "gemini-3.8-flash"

    is_configured = bool(
        api_key
        and api_key != "YOUR_GEMINI_API_KEY_HERE"
        and api_key != "PASTE_YOUR_GEMINI_API_KEY_HERE"
        and not api_key.startswith("YOUR_")
    )

    if not is_configured:
        logger.warning("WARNING: GEMINI_API_KEY is not configured.")

    return {
        "is_configured": is_configured,
        "api_key": api_key,
        "model": model
    }


def clean_json_text(raw_text: str) -> str:
    """
    Removes Markdown code blocks (e.g. ```json ... ```) and leading/trailing whitespace.
    """
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        # Strip opening ```json or ```
        cleaned = re.sub(r"^```[a-zA-Z]*\s*", "", cleaned)
        # Strip closing ```
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def validate_food_result(data: dict) -> tuple[bool, str]:
    """
    Validates the structure of the Gemini food recognition response.
    """
    if not isinstance(data, dict):
        return False, "Response must be a JSON object"

    required_fields = [
        "food_name", "confidence", "serving_size", "calories",
        "protein", "carbohydrates", "fat", "fiber", "sugar",
        "ingredients", "health_notes", "warnings"
    ]
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"

    if not isinstance(data["food_name"], str) or not data["food_name"].strip():
        return False, "Food name must be a non-empty string"

    numeric_fields = ["confidence", "calories", "protein", "carbohydrates", "fat", "fiber", "sugar"]
    for field in numeric_fields:
        val = data.get(field)
        if not isinstance(val, (int, float)):
            try:
                data[field] = float(val)
            except (ValueError, TypeError):
                return False, f"Field '{field}' must be numeric"

    if not isinstance(data.get("ingredients"), list):
        if isinstance(data.get("ingredients"), str):
            data["ingredients"] = [i.strip() for i in data["ingredients"].split(",") if i.strip()]
        else:
            data["ingredients"] = []

    return True, "Valid"


def normalize_food_result(raw: dict) -> dict:
    """
    Ensures safe data types and reasonable bounds.
    """
    def safe_float(val, default=0.0):
        try:
            return round(max(0.0, float(val)), 1)
        except (ValueError, TypeError):
            return default

    def safe_int(val, default=0):
        try:
            return int(round(max(0, float(val))))
        except (ValueError, TypeError):
            return default

    ingredients_raw = raw.get("ingredients", [])
    if isinstance(ingredients_raw, list):
        ingredients = [str(item).strip() for item in ingredients_raw if str(item).strip()]
    else:
        ingredients = []

    return {
        "food_name": str(raw.get("food_name", "Unidentified Dish")).strip(),
        "confidence": min(100, safe_int(raw.get("confidence", 85))),
        "serving_size": str(raw.get("serving_size", "1 serving")).strip(),
        "calories": safe_int(raw.get("calories", 0)),
        "protein": safe_float(raw.get("protein", 0)),
        "carbohydrates": safe_float(raw.get("carbohydrates", 0)),
        "fat": safe_float(raw.get("fat", 0)),
        "fiber": safe_float(raw.get("fiber", 0)),
        "sugar": safe_float(raw.get("sugar", 0)),
        "ingredients": ingredients,
        "health_notes": str(raw.get("health_notes", "")).strip(),
        "warnings": str(raw.get("warnings", "")).strip(),
    }


def analyze_food_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    """
    Performs real Gemini Multimodal API call to identify food and nutritional content.
    Returns:
        dict: {"success": True, "data": {...}} or {"success": False, "error": "..."}
    """
    cfg = get_gemini_config()
    if not cfg["is_configured"]:
        return {
            "success": False,
            "error": "AI service is not configured. Please configure the Gemini API key in Settings or .env file."
        }

    api_key = cfg["api_key"]
    model = cfg["model"]
    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    prompt = (
        "You are a food recognition assistant for a nutrition planning application.\n\n"
        "Analyze the provided food image.\n"
        "Identify the most likely food or dish.\n"
        "Estimate the visible serving size and nutritional information.\n\n"
        "Return ONLY valid JSON.\n"
        "Do not return Markdown.\n"
        "Do not return ```json.\n"
        "Do not include explanations outside the JSON.\n\n"
        "Use this exact structure:\n"
        "{\n"
        '  "food_name": "",\n'
        '  "confidence": 0,\n'
        '  "serving_size": "",\n'
        '  "calories": 0,\n'
        '  "protein": 0,\n'
        '  "carbohydrates": 0,\n'
        '  "fat": 0,\n'
        '  "fiber": 0,\n'
        '  "sugar": 0,\n'
        '  "ingredients": [],\n'
        '  "health_notes": "",\n'
        '  "warnings": ""\n'
        "}\n\n"
        "If the image is unclear, reduce confidence rather than pretending certainty.\n"
        "If the image does not contain food, set confidence to 0, food_name to 'Not recognized as food', "
        "and explain in warnings that no food was detected.\n"
        "Do not invent unnecessary ingredients."
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": base64_image
                        }
                    },
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }

    try:
        response = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=30
        )

        if response.status_code == 400:
            error_data = response.json().get("error", {})
            err_msg = error_data.get("message", "Invalid request parameters.")
            logger.error(f"Gemini API 400: {err_msg}")
            return {
                "success": False,
                "error": f"AI model request error: {err_msg}"
            }
        elif response.status_code == 401 or response.status_code == 403:
            logger.error("Gemini API authentication failed (401/403).")
            return {
                "success": False,
                "error": "Gemini API key is invalid or unauthorized. Please verify your GEMINI_API_KEY."
            }
        elif response.status_code == 429:
            logger.warning("Gemini API rate limit exceeded (429).")
            return {
                "success": False,
                "error": "AI service quota or rate limit exceeded. Please wait a moment and try again."
            }
        elif response.status_code != 200:
            logger.error(f"Gemini API responded with status {response.status_code}: {response.text}")
            return {
                "success": False,
                "error": "AI food recognition is temporarily unavailable. Please try again later."
            }

        res_json = response.json()
        candidates = res_json.get("candidates", [])
        if not candidates:
            return {
                "success": False,
                "error": "AI service could not process the image. Please try another image."
            }

        first_part = candidates[0].get("content", {}).get("parts", [{}])[0]
        raw_text = first_part.get("text", "")
        if not raw_text:
            return {
                "success": False,
                "error": "Empty response received from AI model."
            }

        # Clean JSON text
        cleaned_text = clean_json_text(raw_text)

        try:
            parsed = json.loads(cleaned_text)
        except json.JSONDecodeError as jde:
            logger.error(f"JSON decode failed on response: {cleaned_text}")
            # Try regex to locate outermost { ... }
            match = re.search(r"\{.*\}", cleaned_text, re.DOTALL)
            if match:
                try:
                    parsed = json.loads(match.group(0))
                except Exception:
                    return {
                        "success": False,
                        "error": "Received malformed data from AI food recognition service."
                    }
            else:
                return {
                    "success": False,
                    "error": "Failed to parse structured nutritional data."
                }

        is_valid, val_msg = validate_food_result(parsed)
        if not is_valid:
            logger.warning(f"Validation issue with Gemini output: {val_msg}")

        normalized = normalize_food_result(parsed)

        # Check if non-food was reported
        if normalized["confidence"] <= 10 and ("not" in normalized["food_name"].lower() or "unidentified" in normalized["food_name"].lower()):
            return {
                "success": False,
                "error": "The uploaded image could not be identified as food. Please upload a clear photo of food."
            }

        return {
            "success": True,
            "data": normalized
        }

    except requests.exceptions.Timeout:
        logger.error("Gemini API request timed out after 30 seconds.")
        return {
            "success": False,
            "error": "AI food recognition request timed out. Please check your internet connection."
        }
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error connecting to Gemini API: {str(e)}")
        return {
            "success": False,
            "error": "Network error communicating with AI service. Please try again."
        }
    except Exception as e:
        logger.error(f"Unexpected exception during food image analysis: {str(e)}")
        return {
            "success": False,
            "error": "An unexpected error occurred during food recognition. Please try again."
        }


def generate_meal_plan(profile_data: dict, target_calories: int, macros: dict) -> dict:
    """
    Generates a personalized 7-day meal plan with groceries via Gemini, adhering to Section 48-58.
    """
    cfg = get_gemini_config()
    if not cfg["is_configured"]:
        return {
            "success": False,
            "error": "AI service is not configured. Please configure the Gemini API key."
        }

    # Profile completeness check (Section 56)
    if not profile_data.get("age") or not profile_data.get("height_cm") or not profile_data.get("weight_kg"):
        return {
            "success": False,
            "error": "Please complete your nutrition profile before generating a personalized meal plan."
        }

    api_key = cfg["api_key"]
    model = cfg["model"]

    prompt = (
        "You are an expert personalized nutrition and meal planning assistant.\n"
        "Generate a complete, practical 7-day weekly meal plan tailored specifically to the user's profile.\n\n"
        f"User Profile:\n"
        f"- Target Daily Calories: {target_calories} kcal\n"
        f"- Macronutrient Targets: Protein {macros.get('protein_g', 0)}g, Carbs {macros.get('carbs_g', 0)}g, Fat {macros.get('fat_g', 0)}g\n"
        f"- Fitness Goal: {profile_data.get('fitness_goal', 'Weight Maintenance')}\n"
        f"- Dietary Preference: {profile_data.get('dietary_preference', 'Vegetarian')}\n"
        f"- Food Allergies: {profile_data.get('allergies', 'None')}\n"
        f"- Medical Conditions: {profile_data.get('medical_conditions', 'None')}\n"
        f"- Activity Level: {profile_data.get('activity_level', 'Moderately Active')}\n\n"
        "Requirements:\n"
        "1. Create meals for all 7 days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.\n"
        "2. For each day include exactly 5 meals: 'Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'.\n"
        "3. For each meal include: 'food_name', 'serving_size', 'calories' (number), 'protein' (number in g), "
        "'carbohydrates' (number in g), 'fat' (number in g).\n"
        "4. For each day include 'daily_total': { 'calories': 0, 'protein': 0, 'carbohydrates': 0, 'fat': 0 } reasonably close to the target.\n"
        "5. Create a 'grocery_list' categorized by Produce, Proteins, Grains & Pantry, Dairy & Alternatives.\n\n"
        "Return ONLY valid JSON matching this exact structure:\n"
        "{\n"
        '  "summary": "...",\n'
        '  "medical_disclaimer": "This meal plan is for educational guidance only and not medical advice.",\n'
        '  "weekly_plan": [\n'
        '    {\n'
        '      "day": "Monday",\n'
        '      "meals": [\n'
        '        {\n'
        '          "meal_type": "Breakfast",\n'
        '          "food_name": "...",\n'
        '          "serving_size": "...",\n'
        '          "calories": 400,\n'
        '          "protein": 20,\n'
        '          "carbohydrates": 50,\n'
        '          "fat": 12\n'
        '        }\n'
        '      ],\n'
        '      "daily_total": {\n'
        '        "calories": 2000,\n'
        '        "protein": 120,\n'
        '        "carbohydrates": 220,\n'
        '        "fat": 60\n'
        '      }\n'
        '    }\n'
        '  ],\n'
        '  "grocery_list": [\n'
        '    {"name": "Rolled Oats", "category": "Grains & Pantry"}\n'
        '  ]\n'
        "}\n\n"
        "Do not output markdown format or ```json backticks. Return strictly raw JSON."
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.3,
            "responseMimeType": "application/json"
        }
    }

    try:
        response = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=45
        )

        if response.status_code != 200:
            logger.error(f"Gemini Meal Plan Error ({response.status_code}): {response.text}")
            return {
                "success": False,
                "error": "Unable to generate your meal plan right now. Please try again later."
            }

        res_json = response.json()
        candidates = res_json.get("candidates", [])
        if not candidates:
            return {"success": False, "error": "AI service returned no meal plan candidates."}

        raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        cleaned_text = clean_json_text(raw_text)

        parsed = json.loads(cleaned_text)
        if not isinstance(parsed, dict):
            return {"success": False, "error": "Unable to generate your meal plan right now. Please try again later."}

        # Normalize days / weekly_plan
        weekly_plan = parsed.get("weekly_plan") or parsed.get("days")
        if not isinstance(weekly_plan, list) or len(weekly_plan) == 0:
            return {"success": False, "error": "Invalid meal plan format received from AI."}

        # Ensure days field exists for template backward compatibility
        parsed["weekly_plan"] = weekly_plan
        parsed["days"] = weekly_plan

        return {
            "success": True,
            "data": parsed
        }

    except Exception as e:
        logger.error(f"Error generating meal plan: {str(e)}")
        return {
            "success": False,
            "error": "Unable to generate your meal plan right now. Please try again later."
        }
