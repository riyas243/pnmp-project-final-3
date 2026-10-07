"""
PNMP Nutrition Calculation Engine
Implements standard scientific formulas:
- BMI (Body Mass Index) + WHO Category
- BMR (Mifflin-St Jeor Equation)
- TDEE (Total Daily Energy Expenditure)
- Calorie Targets (Safe Deficit / Surplus)
- Macronutrient Allocations (Protein, Carbs, Fats)
- Hydration & Sleep Recommendations
"""

def calculate_bmi(weight_kg: float, height_cm: float) -> dict:
    """Calculate BMI and return value with category and description."""
    if height_cm <= 0 or weight_kg <= 0:
        return {"bmi": 0.0, "category": "N/A", "color": "secondary", "advice": "Invalid measurements"}

    height_m = height_cm / 100.0
    bmi = round(weight_kg / (height_m ** 2), 1)

    if bmi < 18.5:
        category = "Underweight"
        color = "info"
        advice = "A moderate caloric surplus with nutrient-dense foods is recommended."
    elif 18.5 <= bmi <= 24.9:
        category = "Normal Weight"
        color = "success"
        advice = "Healthy weight range. Focus on balanced macronutrients and active lifestyle."
    elif 25.0 <= bmi <= 29.9:
        category = "Overweight"
        color = "warning"
        advice = "A moderate caloric deficit and structured physical activity are recommended."
    else:
        category = "Obese"
        color = "danger"
        advice = "Consult a certified healthcare provider for a structured health plan."

    return {
        "bmi": bmi,
        "category": category,
        "color": color,
        "advice": advice
    }


def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    """
    Calculate Basal Metabolic Rate using Mifflin-St Jeor equation.
    Male:   BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
    Female: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
    """
    if weight_kg <= 0 or height_cm <= 0 or age <= 0:
        return 0.0

    gender_normalized = (gender or "male").strip().lower()
    base = (10 * weight_kg) + (6.25 * height_cm) - (5 * age)

    if gender_normalized in ["female", "f"]:
        bmr = base - 161.0
    else:
        bmr = base + 5.0

    return round(max(500.0, bmr), 1)


def calculate_tdee(bmr: float, activity_level: str) -> float:
    """
    Calculate Total Daily Energy Expenditure using standard activity multipliers.
    """
    multipliers = {
        "Sedentary": 1.2,
        "Lightly Active": 1.375,
        "Moderately Active": 1.55,
        "Very Active": 1.725,
        "Extra Active": 1.9,
    }
    multiplier = multipliers.get(activity_level, 1.375)
    return round(bmr * multiplier, 1)


def calculate_nutrition_plan(
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: str,
    activity_level: str = "Moderately Active",
    fitness_goal: str = "Weight Maintenance"
) -> dict:
    """
    Generates a full personalized nutrition plan:
    - BMI details
    - BMR
    - TDEE
    - Recommended daily calories
    - Protein (g & kcal)
    - Carbohydrates (g & kcal)
    - Fats (g & kcal)
    - Water target (ml)
    - Sleep recommendation (hours)
    """
    bmi_info = calculate_bmi(weight_kg, height_cm)
    bmr = calculate_bmr(weight_kg, height_cm, age, gender)
    tdee = calculate_tdee(bmr, activity_level)

    gender_norm = (gender or "male").lower()
    min_safe_calories = 1200 if gender_norm in ["female", "f"] else 1500

    goal_normalized = (fitness_goal or "Weight Maintenance").strip()

    if goal_normalized == "Weight Loss":
        # Safe 500 kcal deficit
        target_calories = max(min_safe_calories, round(tdee - 500))
        # 30% Protein, 45% Carbs, 25% Fat
        protein_ratio = 0.30
        carbs_ratio = 0.45
        fat_ratio = 0.25
        goal_note = "Targeting ~0.5 kg safe fat loss per week through a balanced 500 kcal deficit."
    elif goal_normalized == "Weight Gain":
        # Safe 400 kcal surplus
        target_calories = round(tdee + 400)
        # 25% Protein, 55% Carbs, 20% Fat
        protein_ratio = 0.25
        carbs_ratio = 0.55
        fat_ratio = 0.20
        goal_note = "Targeting lean muscle growth with a progressive 400 kcal caloric surplus."
    else:
        # Weight Maintenance
        target_calories = round(tdee)
        # 25% Protein, 50% Carbs, 25% Fat
        protein_ratio = 0.25
        carbs_ratio = 0.50
        fat_ratio = 0.25
        goal_note = "Maintaining current weight and optimizing body composition and energy levels."

    # Convert caloric percentages to grams:
    # Protein: 4 kcal per gram
    # Carbs: 4 kcal per gram
    # Fat: 9 kcal per gram
    protein_grams = round((target_calories * protein_ratio) / 4.0, 1)
    carbs_grams = round((target_calories * carbs_ratio) / 4.0, 1)
    fat_grams = round((target_calories * fat_ratio) / 9.0, 1)

    # Water target: ~35 ml per kg body weight, clamped between 1500 ml and 4500 ml
    water_target_ml = int(round(max(1500, min(4500, weight_kg * 35))))

    return {
        "bmi": bmi_info["bmi"],
        "bmi_category": bmi_info["category"],
        "bmi_color": bmi_info["color"],
        "bmi_advice": bmi_info["advice"],
        "bmr": bmr,
        "tdee": tdee,
        "target_calories": target_calories,
        "goal": goal_normalized,
        "goal_note": goal_note,
        "protein_g": protein_grams,
        "carbs_g": carbs_grams,
        "fat_g": fat_grams,
        "water_target_ml": water_target_ml,
        "sleep_target_hours": 8.0,
    }
