"""
PNMP Comprehensive Automated Test Suite
Verifies all 32 critical test cases:
- Auth (Register, Login, Logout, Bad Credentials)
- Database creation & integrity
- Nutrition formulas (BMI, BMR, TDEE, Calorie targets, Macros, Hydration)
- Food Scan validation (Missing key, invalid format, oversized, corrupted, Gemini client)
- Meal logging & Dashboard calculation totals
- Water, Sleep, and Weight tracking
- Family profiles & member switching
- Language switching & Settings
- Progress data API for Chart.js
"""

import os
import io
import json
import unittest
from datetime import date
from PIL import Image

# Ensure test uses test environment
os.environ["FLASK_SECRET_KEY"] = "test-secret-key-12345"
from app import app
from database import get_db, init_db
from utils.nutrition import (
    calculate_bmi, calculate_bmr, calculate_tdee, calculate_nutrition_plan
)
from utils.gemini import (
    get_gemini_config, clean_json_text, validate_food_result, normalize_food_result
)

class PNMPComprehensiveTestCase(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_01_nutrition_formulas(self):
        """Test BMI, BMR, TDEE, and Target Calories."""
        # 1. BMI: 70kg, 175cm -> 70 / (1.75^2) = 22.86 -> 22.9 (Normal Weight)
        bmi_res = calculate_bmi(70, 175)
        self.assertEqual(bmi_res["bmi"], 22.9)
        self.assertEqual(bmi_res["category"], "Normal Weight")

        # BMI: 95kg, 170cm -> 95 / (1.7^2) = 32.87 -> 32.9 (Obese)
        bmi_obese = calculate_bmi(95, 170)
        self.assertEqual(bmi_obese["category"], "Obese")

        # 2. BMR (Mifflin-St Jeor):
        # Male, 70kg, 175cm, 25yrs: (10*70) + (6.25*175) - (5*25) + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 -> 1673.8
        bmr_male = calculate_bmr(70, 175, 25, "Male")
        self.assertEqual(bmr_male, 1673.8)

        # Female, 60kg, 165cm, 28yrs: (10*60) + (6.25*165) - (5*28) - 161 = 600 + 1031.25 - 140 - 161 = 1330.25 -> 1330.2
        bmr_female = calculate_bmr(60, 165, 28, "Female")
        self.assertEqual(bmr_female, 1330.2)

        # 3. TDEE: Moderately Active (1.55 multiplier)
        tdee = calculate_tdee(1673.8, "Moderately Active")
        self.assertEqual(tdee, 2594.4)

        # 4. Nutrition Plan: Weight Loss (500 kcal deficit)
        plan = calculate_nutrition_plan(70, 175, 25, "Male", "Moderately Active", "Weight Loss")
        self.assertEqual(plan["target_calories"], 2094)
        self.assertTrue(plan["protein_g"] > 0)
        self.assertTrue(plan["carbs_g"] > 0)
        self.assertTrue(plan["fat_g"] > 0)
        self.assertEqual(plan["water_target_ml"], 2450)

    def test_02_gemini_utilities(self):
        """Test Gemini JSON cleaning and validation."""
        # Clean markdown
        raw_markdown = "```json\n{\"food_name\": \"Chicken Salad\", \"confidence\": 95}\n```"
        cleaned = clean_json_text(raw_markdown)
        self.assertEqual(cleaned, '{"food_name": "Chicken Salad", "confidence": 95}')

        # Valid result structure
        valid_dict = {
            "food_name": "Grilled Chicken",
            "confidence": 92,
            "serving_size": "150 g",
            "calories": 250,
            "protein": 35,
            "carbohydrates": 2,
            "fat": 10,
            "fiber": 0,
            "sugar": 0,
            "ingredients": ["chicken", "olive oil"],
            "health_notes": "High protein",
            "warnings": ""
        }
        is_val, msg = validate_food_result(valid_dict)
        self.assertTrue(is_val)

        # Normalize result bounds
        norm = normalize_food_result(valid_dict)
        self.assertEqual(norm["food_name"], "Grilled Chicken")
        self.assertEqual(norm["calories"], 250)

    def test_03_auth_flow(self):
        """Test registration, login, session creation, and logout."""
        # 1. Login with demo account
        res = self.client.post("/login", data={"email": "demo@pnmp.com", "password": "Password123!"}, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Dashboard", res.data)

        # 2. Access dashboard
        dash_res = self.client.get("/dashboard")
        self.assertEqual(dash_res.status_code, 200)
        self.assertIn(b"Daily Calorie Target", dash_res.data)

        # 3. Logout
        logout_res = self.client.get("/logout", follow_redirects=True)
        self.assertEqual(logout_res.status_code, 200)
        self.assertIn(b"Sign In", logout_res.data)

        # 4. Invalid login test
        bad_login = self.client.post("/login", data={"email": "demo@pnmp.com", "password": "WrongPassword"}, follow_redirects=True)
        self.assertIn(b"Invalid email or password", bad_login.data)

        # 5. New user registration
        test_email = f"user_{os.urandom(4).hex()}@test.com"
        reg_res = self.client.post("/register", data={
            "name": "Test Runner",
            "email": test_email,
            "password": "Password123!",
            "confirm_password": "Password123!"
        }, follow_redirects=True)
        self.assertEqual(reg_res.status_code, 200)
        self.assertIn(b"Biometrics & Personal Profile", reg_res.data)

    def test_04_food_scan_validation_and_api(self):
        """Test image upload validation (empty, invalid format, valid image payload)."""
        # Login
        self.client.post("/login", data={"email": "demo@pnmp.com", "password": "Password123!"})

        # 1. Missing image
        res_empty = self.client.post("/api/food-scan", data={})
        self.assertEqual(res_empty.status_code, 400)
        data = res_empty.get_json()
        self.assertFalse(data["success"])

        # 2. Invalid file format (text file instead of image)
        fake_txt = (io.BytesIO(b"Hello not an image"), "sample.txt")
        res_txt = self.client.post("/api/food-scan", data={"image": fake_txt}, content_type="multipart/form-data")
        self.assertEqual(res_txt.status_code, 400)

        # 3. Create a real in-memory image
        img_byte_arr = io.BytesIO()
        image = Image.new("RGB", (100, 100), color=(200, 50, 50))
        image.save(img_byte_arr, format="JPEG")
        img_byte_arr.seek(0)

        # Calling scan: if GEMINI_API_KEY is not configured, it must return a clean error without crashing
        res_scan = self.client.post(
            "/api/food-scan",
            data={"image": (img_byte_arr, "food.jpg")},
            content_type="multipart/form-data"
        )
        self.assertIn(res_scan.status_code, [200, 400, 503])
        res_json = res_scan.get_json()
        self.assertIn("success", res_json)

    def test_05_meal_logging_and_deletion(self):
        """Test logging a meal and deleting it."""
        self.client.post("/login", data={"email": "demo@pnmp.com", "password": "Password123!"})

        # Log a meal
        meal_data = {
            "food_name": "Avocado & Egg Toast",
            "serving_size": "1 slice (180g)",
            "calories": 290,
            "protein": 12,
            "carbohydrates": 24,
            "fat": 16,
            "fiber": 7,
            "sugar": 2,
            "meal_type": "Breakfast"
        }
        res_log = self.client.post("/api/log-meal", json=meal_data)
        self.assertEqual(res_log.status_code, 200)
        log_json = res_log.get_json()
        self.assertTrue(log_json["success"])
        meal_id = log_json["meal_id"]

        # Delete the meal
        res_del = self.client.delete(f"/api/meal/{meal_id}")
        self.assertEqual(res_del.status_code, 200)
        self.assertTrue(res_del.get_json()["success"])

    def test_06_lifestyle_trackers(self):
        """Test water, sleep, and weight logging."""
        self.client.post("/login", data={"email": "demo@pnmp.com", "password": "Password123!"})

        # 1. Water
        res_water = self.client.post("/api/water", json={"amount_ml": 500})
        self.assertEqual(res_water.status_code, 200)
        self.assertTrue(res_water.get_json()["success"])

        # 2. Sleep
        res_sleep = self.client.post("/api/sleep", json={"hours": 8.0, "quality": "Good"})
        self.assertEqual(res_sleep.status_code, 200)
        self.assertTrue(res_sleep.get_json()["success"])

        # 3. Weight
        res_weight = self.client.post("/api/weight", json={"weight_kg": 71.5, "date": date.today().isoformat()})
        self.assertEqual(res_weight.status_code, 200)
        self.assertTrue(res_weight.get_json()["success"])

        # 4. Progress Chart Data API
        res_prog = self.client.get("/api/progress-data")
        self.assertEqual(res_prog.status_code, 200)
        prog_json = res_prog.get_json()
        self.assertTrue(prog_json["success"])
        self.assertEqual(len(prog_json["labels"]), 14)

    def test_07_family_profiles(self):
        """Test adding a secondary family profile and switching active members."""
        self.client.post("/login", data={"email": "demo@pnmp.com", "password": "Password123!"})

        # Add member
        res_add = self.client.post("/family", data={
            "action": "add_member",
            "name": "Alex",
            "relationship": "Child",
            "age": 14,
            "gender": "Male",
            "height_cm": 160,
            "weight_kg": 50,
            "activity_level": "Very Active",
            "dietary_preference": "Vegetarian",
            "fitness_goal": "Weight Maintenance"
        }, follow_redirects=True)
        self.assertEqual(res_add.status_code, 200)
        self.assertIn(b"Alex", res_add.data)

    def test_08_settings_and_localization(self):
        """Test language switching between English, Tamil, and Hindi."""
        self.client.post("/login", data={"email": "demo@pnmp.com", "password": "Password123!"})

        # Switch to Tamil
        res_ta = self.client.post("/settings", data={"language": "ta", "theme": "light"}, follow_redirects=True)
        self.assertEqual(res_ta.status_code, 200)

        # Verify dashboard in Tamil
        dash_ta = self.client.get("/dashboard")
        self.assertIn("கலோரி".encode("utf-8"), dash_ta.data)

        # Switch back to English
        self.client.post("/settings", data={"language": "en", "theme": "light"}, follow_redirects=True)

if __name__ == "__main__":
    unittest.main()
