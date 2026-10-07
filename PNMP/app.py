"""
PNMP - Personalized Nutrition & Meal Planner
Full-Stack Flask Application
"""

import os
import json
import logging
from datetime import date, datetime, timedelta
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash
from flask import (
    Flask, render_template, request, redirect,
    url_for, session, flash, jsonify, g
)

from config import Config
from database import get_db, init_db
from utils.nutrition import calculate_nutrition_plan
from utils.gemini import (
    analyze_food_image, generate_meal_plan,
    get_gemini_config
)
from utils.translations import get_text, TRANSLATIONS

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("pnmp.app")

app = Flask(__name__)
app.config.from_object(Config)

# Ensure instance and upload directories exist
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
os.makedirs(os.path.dirname(app.config["DATABASE_PATH"]), exist_ok=True)

# Initialize database schema and initial demo seed
with app.app_context():
    init_db()

# Log Gemini startup status
gemini_info = get_gemini_config()
if gemini_info["is_configured"]:
    logger.info(f"PNMP Startup: Gemini AI configured with model '{gemini_info['model']}'.")
else:
    logger.warning("WARNING: GEMINI_API_KEY is not configured.")


# =========================================================================
# Template Context Processors & Decorators
# =========================================================================

@app.context_processor
def inject_global_data():
    """Injects translation helper, active user, active member, and AI status."""
    lang = session.get("lang", "en")
    theme = session.get("theme", "light")
    ai_status = get_gemini_config()

    current_member = None
    all_members = []
    if "user_id" in session:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM family_members WHERE user_id = ? ORDER BY is_primary DESC, id ASC", (session["user_id"],))
        all_members = [dict(m) for m in cursor.fetchall()]

        active_id = session.get("active_member_id")
        for m in all_members:
            if m["id"] == active_id:
                current_member = m
                break
        if not current_member and all_members:
            current_member = all_members[0]
            session["active_member_id"] = current_member["id"]
        conn.close()

    return {
        "t": lambda key: get_text(lang, key),
        "current_lang": lang,
        "current_theme": theme,
        "current_member": current_member,
        "family_members": all_members,
        "ai_ready": ai_status["is_configured"],
        "gemini_model": ai_status["model"],
        "today_date": date.today().strftime("%A, %B %d, %Y")
    }


def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            # Auto-authenticate default demo user for seamless instant dashboard preview
            if not session.get("manual_logout"):
                conn = get_db()
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM users WHERE email = 'demo@pnmp.com'")
                user = cursor.fetchone()
                if user:
                    session["user_id"] = user["id"]
                    session["user_name"] = user["name"]
                    session["user_email"] = user["email"]
                    session["lang"] = user["language"] or "en"
                    session["theme"] = user["theme"] or "light"
                    cursor.execute("SELECT id FROM family_members WHERE user_id = ? AND is_primary = 1", (user["id"],))
                    primary = cursor.fetchone()
                    session["active_member_id"] = primary["id"] if primary else None
                    conn.close()
                    return f(*args, **kwargs)
                conn.close()
            flash("Please sign in to access this page.", "warning")
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated_function


def get_active_profile_and_targets(member_id: int):
    """Fetches profile for given member and calculates scientific nutrition targets."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM profiles WHERE member_id = ?", (member_id,))
    profile_row = cursor.fetchone()
    conn.close()

    if not profile_row:
        # Default fallback profile
        profile = {
            "member_id": member_id, "age": 25, "gender": "Male",
            "height_cm": 170.0, "weight_kg": 70.0,
            "activity_level": "Moderately Active", "dietary_preference": "Vegetarian",
            "allergies": "", "medical_conditions": "", "fitness_goal": "Weight Maintenance"
        }
    else:
        profile = dict(profile_row)

    targets = calculate_nutrition_plan(
        weight_kg=float(profile.get("weight_kg", 70.0)),
        height_cm=float(profile.get("height_cm", 170.0)),
        age=int(profile.get("age", 25)),
        gender=str(profile.get("gender", "Male")),
        activity_level=str(profile.get("activity_level", "Moderately Active")),
        fitness_goal=str(profile.get("fitness_goal", "Weight Maintenance"))
    )
    return profile, targets


# =========================================================================
# Authentication Routes
# =========================================================================

@app.route("/login", methods=["GET", "POST"])
def login():
    if "user_id" in session:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        if not email or not password:
            flash("Please provide both email and password.", "danger")
            return render_template("login.html")

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()

        if user and check_password_hash(user["password_hash"], password):
            session.clear()
            session["user_id"] = user["id"]
            session["user_name"] = user["name"]
            session["user_email"] = user["email"]
            session["lang"] = user["language"] or "en"
            session["theme"] = user["theme"] or "light"

            # Set primary family member as active
            cursor.execute("SELECT id FROM family_members WHERE user_id = ? AND is_primary = 1", (user["id"],))
            primary = cursor.fetchone()
            if primary:
                session["active_member_id"] = primary["id"]
            else:
                cursor.execute("SELECT id FROM family_members WHERE user_id = ? LIMIT 1", (user["id"],))
                first_m = cursor.fetchone()
                session["active_member_id"] = first_m["id"] if first_m else None

            conn.close()
            flash(f"Welcome back, {user['name']}!", "success")
            return redirect(url_for("dashboard"))
        else:
            conn.close()
            flash("Invalid email or password. Please check your credentials.", "danger")

    return render_template("login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if "user_id" in session:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")

        if not name or not email or not password:
            flash("Please complete all required fields.", "danger")
            return render_template("register.html")

        if password != confirm_password:
            flash("Passwords do not match.", "danger")
            return render_template("register.html")

        if len(password) < 6:
            flash("Password must be at least 6 characters.", "danger")
            return render_template("register.html")

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            flash("An account with this email already exists. Please log in.", "warning")
            return redirect(url_for("login"))

        pwd_hash = generate_password_hash(password)
        cursor.execute("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", (name, email, pwd_hash))
        user_id = cursor.lastrowid

        # Create primary family member
        cursor.execute(
            "INSERT INTO family_members (user_id, name, relationship, is_primary) VALUES (?, ?, 'Self', 1)",
            (user_id, name)
        )
        member_id = cursor.lastrowid

        # Create default profile
        cursor.execute("""
            INSERT INTO profiles (
                member_id, age, gender, height_cm, weight_kg,
                activity_level, dietary_preference, allergies,
                medical_conditions, fitness_goal
            ) VALUES (?, 25, 'Male', 172.0, 68.0, 'Moderately Active', 'Vegetarian', '', '', 'Weight Maintenance')
        """, (member_id,))

        conn.commit()
        conn.close()

        # Log user in
        session.clear()
        session["user_id"] = user_id
        session["user_name"] = name
        session["user_email"] = email
        session["active_member_id"] = member_id
        session["lang"] = "en"
        session["theme"] = "light"

        flash("Account created successfully! Welcome to PNMP.", "success")
        return redirect(url_for("profile"))

    return render_template("register.html")


@app.route("/logout")
def logout():
    session.clear()
    session["manual_logout"] = True
    flash("You have been signed out successfully.", "info")
    return redirect(url_for("login"))


# =========================================================================
# Application Pages
# =========================================================================

@app.route("/")
def index():
    if session.get("manual_logout"):
        return redirect(url_for("login"))
    return redirect(url_for("dashboard"))


@app.route("/dashboard")
@login_required
def dashboard():
    member_id = session.get("active_member_id")
    if not member_id:
        return redirect(url_for("family"))

    profile, targets = get_active_profile_and_targets(member_id)
    today_str = date.today().isoformat()

    conn = get_db()
    cursor = conn.cursor()

    # Today's meals
    cursor.execute("""
        SELECT * FROM meals
        WHERE member_id = ? AND date = ?
        ORDER BY created_at DESC
    """, (member_id, today_str))
    today_meals = [dict(m) for m in cursor.fetchall()]

    # Today's consumed totals
    cursor.execute("""
        SELECT
            COALESCE(SUM(calories), 0) as total_cals,
            COALESCE(SUM(protein), 0) as total_protein,
            COALESCE(SUM(carbohydrates), 0) as total_carbs,
            COALESCE(SUM(fat), 0) as total_fat,
            COALESCE(SUM(fiber), 0) as total_fiber,
            COALESCE(SUM(sugar), 0) as total_sugar
        FROM meals
        WHERE member_id = ? AND date = ?
    """, (member_id, today_str))
    consumed_row = dict(cursor.fetchone())

    # Today's water total
    cursor.execute("""
        SELECT COALESCE(SUM(amount_ml), 0) as total_water
        FROM water_logs
        WHERE member_id = ? AND date = ?
    """, (member_id, today_str))
    water_today = cursor.fetchone()["total_water"]

    # Today's sleep total
    cursor.execute("""
        SELECT COALESCE(SUM(hours), 0) as total_sleep, quality
        FROM sleep_logs
        WHERE member_id = ? AND date = ?
        ORDER BY created_at DESC LIMIT 1
    """, (member_id, today_str))
    sleep_row = cursor.fetchone()
    sleep_today = sleep_row["total_sleep"] if sleep_row else 0
    sleep_quality = sleep_row["quality"] if (sleep_row and sleep_row["quality"]) else "N/A"

    conn.close()

    # Calculations
    consumed_calories = int(round(consumed_row["total_cals"]))
    target_calories = targets["target_calories"]
    remaining_calories = target_calories - consumed_calories
    calories_pct = min(100, int(round((consumed_calories / target_calories) * 100))) if target_calories > 0 else 0

    protein_consumed = round(consumed_row["total_protein"], 1)
    carbs_consumed = round(consumed_row["total_carbs"], 1)
    fat_consumed = round(consumed_row["total_fat"], 1)

    protein_pct = min(100, int(round((protein_consumed / targets["protein_g"]) * 100))) if targets["protein_g"] > 0 else 0
    carbs_pct = min(100, int(round((carbs_consumed / targets["carbs_g"]) * 100))) if targets["carbs_g"] > 0 else 0
    fat_pct = min(100, int(round((fat_consumed / targets["fat_g"]) * 100))) if targets["fat_g"] > 0 else 0

    water_target = targets["water_target_ml"]
    water_pct = min(100, int(round((water_today / water_target) * 100))) if water_target > 0 else 0

    sleep_target = targets["sleep_target_hours"]
    sleep_pct = min(100, int(round((sleep_today / sleep_target) * 100))) if sleep_target > 0 else 0

    return render_template(
        "dashboard.html",
        profile=profile,
        targets=targets,
        today_meals=today_meals,
        consumed={
            "calories": consumed_calories,
            "protein": protein_consumed,
            "carbs": carbs_consumed,
            "fat": fat_consumed,
            "fiber": round(consumed_row["total_fiber"], 1),
            "sugar": round(consumed_row["total_sugar"], 1),
            "water": water_today,
            "sleep": sleep_today,
            "sleep_quality": sleep_quality,
        },
        percentages={
            "calories": calories_pct,
            "protein": protein_pct,
            "carbs": carbs_pct,
            "fat": fat_pct,
            "water": water_pct,
            "sleep": sleep_pct
        },
        remaining_calories=remaining_calories
    )


@app.route("/profile", methods=["GET", "POST"])
@login_required
def profile():
    member_id = session.get("active_member_id")
    conn = get_db()
    cursor = conn.cursor()

    if request.method == "POST":
        name = request.form.get("name", "").strip()
        age = int(request.form.get("age", 25))
        gender = request.form.get("gender", "Male")
        height_cm = float(request.form.get("height_cm", 170.0))
        weight_kg = float(request.form.get("weight_kg", 70.0))
        activity_level = request.form.get("activity_level", "Moderately Active")
        dietary_preference = request.form.get("dietary_preference", "Vegetarian")
        allergies = request.form.get("allergies", "").strip()
        medical_conditions = request.form.get("medical_conditions", "").strip()
        fitness_goal = request.form.get("fitness_goal", "Weight Maintenance")

        if name:
            cursor.execute("UPDATE family_members SET name = ? WHERE id = ?", (name, member_id))

        cursor.execute("""
            UPDATE profiles SET
                age = ?, gender = ?, height_cm = ?, weight_kg = ?,
                activity_level = ?, dietary_preference = ?, allergies = ?,
                medical_conditions = ?, fitness_goal = ?, updated_at = CURRENT_TIMESTAMP
            WHERE member_id = ?
        """, (age, gender, height_cm, weight_kg, activity_level, dietary_preference, allergies, medical_conditions, fitness_goal, member_id))

        # Also add to weight log if different
        today_str = date.today().isoformat()
        cursor.execute("SELECT id FROM weight_logs WHERE member_id = ? AND date = ?", (member_id, today_str))
        existing_log = cursor.fetchone()
        if existing_log:
            cursor.execute("UPDATE weight_logs SET weight_kg = ? WHERE id = ?", (weight_kg, existing_log["id"]))
        else:
            cursor.execute("INSERT INTO weight_logs (member_id, weight_kg, date) VALUES (?, ?, ?)", (member_id, weight_kg, today_str))

        conn.commit()
        flash("Profile and nutrition targets successfully updated!", "success")

    profile_data, targets = get_active_profile_and_targets(member_id)
    cursor.execute("SELECT name, relationship FROM family_members WHERE id = ?", (member_id,))
    member_info = cursor.fetchone()
    conn.close()

    return render_template("profile.html", profile=profile_data, targets=targets, member_info=member_info)


@app.route("/food_scan")
@login_required
def food_scan():
    ai_status = get_gemini_config()
    return render_template("food_scan.html", ai_status=ai_status)


@app.route("/today")
@login_required
def today():
    member_id = session.get("active_member_id")
    profile, targets = get_active_profile_and_targets(member_id)
    today_str = date.today().isoformat()

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM meals WHERE member_id = ? AND date = ? ORDER BY id ASC", (member_id, today_str))
    all_today = [dict(m) for m in cursor.fetchall()]

    # Group meals by category
    categories = {"Breakfast": [], "Morning Snack": [], "Lunch": [], "Evening Snack": [], "Dinner": []}
    for m in all_today:
        cat = m.get("meal_type", "Lunch")
        if cat in categories:
            categories[cat].append(m)
        else:
            categories.setdefault("Other", []).append(m)

    # Water
    cursor.execute("SELECT COALESCE(SUM(amount_ml), 0) as total FROM water_logs WHERE member_id = ? AND date = ?", (member_id, today_str))
    water_ml = cursor.fetchone()["total"]

    conn.close()

    total_cals = sum(m["calories"] for m in all_today)
    total_protein = sum(m["protein"] for m in all_today)
    total_carbs = sum(m["carbohydrates"] for m in all_today)
    total_fat = sum(m["fat"] for m in all_today)

    return render_template(
        "today.html",
        meals_by_cat=categories,
        total_cals=int(round(total_cals)),
        total_protein=round(total_protein, 1),
        total_carbs=round(total_carbs, 1),
        total_fat=round(total_fat, 1),
        water_ml=water_ml,
        targets=targets,
        meal_count=len(all_today)
    )


@app.route("/meal_plan")
@login_required
def meal_plan():
    member_id = session.get("active_member_id")
    profile, targets = get_active_profile_and_targets(member_id)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT plan_json FROM meal_plans WHERE member_id = ? ORDER BY created_at DESC LIMIT 1", (member_id,))
    existing_plan = cursor.fetchone()
    conn.close()

    plan_data = None
    if existing_plan:
        try:
            plan_data = json.loads(existing_plan["plan_json"])
        except Exception:
            plan_data = None

    ai_status = get_gemini_config()
    return render_template("meal_plan.html", plan_data=plan_data, profile=profile, targets=targets, ai_status=ai_status)


@app.route("/progress")
@login_required
def progress():
    member_id = session.get("active_member_id")
    profile, targets = get_active_profile_and_targets(member_id)
    return render_template("progress.html", profile=profile, targets=targets)


@app.route("/family", methods=["GET", "POST"])
@login_required
def family():
    user_id = session["user_id"]
    conn = get_db()
    cursor = conn.cursor()

    if request.method == "POST":
        action = request.form.get("action", "")

        if action == "add_member":
            name = request.form.get("name", "").strip()
            relationship = request.form.get("relationship", "Family Member").strip()
            age = int(request.form.get("age", 25))
            gender = request.form.get("gender", "Male")
            height_cm = float(request.form.get("height_cm", 170.0))
            weight_kg = float(request.form.get("weight_kg", 65.0))
            activity_level = request.form.get("activity_level", "Moderately Active")
            dietary_preference = request.form.get("dietary_preference", "Vegetarian")
            fitness_goal = request.form.get("fitness_goal", "Weight Maintenance")

            if name:
                cursor.execute(
                    "INSERT INTO family_members (user_id, name, relationship, is_primary) VALUES (?, ?, ?, 0)",
                    (user_id, name, relationship)
                )
                new_member_id = cursor.lastrowid

                cursor.execute("""
                    INSERT INTO profiles (
                        member_id, age, gender, height_cm, weight_kg,
                        activity_level, dietary_preference, allergies,
                        medical_conditions, fitness_goal
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, '', '', ?)
                """, (new_member_id, age, gender, height_cm, weight_kg, activity_level, dietary_preference, fitness_goal))

                conn.commit()
                flash(f"Family profile for {name} added successfully!", "success")

        elif action == "delete_member":
            member_to_del = int(request.form.get("member_id", 0))
            # Protect primary
            cursor.execute("SELECT is_primary FROM family_members WHERE id = ? AND user_id = ?", (member_to_del, user_id))
            target = cursor.fetchone()
            if target and not target["is_primary"]:
                cursor.execute("DELETE FROM family_members WHERE id = ?", (member_to_del,))
                conn.commit()
                flash("Family member removed.", "info")
                if session.get("active_member_id") == member_to_del:
                    # Switch to primary
                    cursor.execute("SELECT id FROM family_members WHERE user_id = ? AND is_primary = 1", (user_id,))
                    prim = cursor.fetchone()
                    session["active_member_id"] = prim["id"] if prim else None

    # Fetch all members with their computed metrics
    cursor.execute("SELECT * FROM family_members WHERE user_id = ? ORDER BY is_primary DESC, id ASC", (user_id,))
    members_raw = [dict(m) for m in cursor.fetchall()]

    member_cards = []
    for m in members_raw:
        prof, targs = get_active_profile_and_targets(m["id"])
        member_cards.append({
            "member": m,
            "profile": prof,
            "targets": targs
        })

    conn.close()
    return render_template("family.html", member_cards=member_cards)


@app.route("/settings", methods=["GET", "POST"])
@login_required
def settings():
    user_id = session["user_id"]
    conn = get_db()
    cursor = conn.cursor()

    if request.method == "POST":
        lang = request.form.get("language", "en")
        theme = request.form.get("theme", "light")

        if lang in ["en", "ta", "hi"]:
            session["lang"] = lang
        if theme in ["light", "dark"]:
            session["theme"] = theme

        cursor.execute("UPDATE users SET language = ?, theme = ? WHERE id = ?", (lang, theme, user_id))
        conn.commit()
        flash("Settings saved successfully!", "success")

    ai_status = get_gemini_config()
    conn.close()
    return render_template("settings.html", ai_status=ai_status)


# =========================================================================
# API Endpoints
# =========================================================================

@app.route("/api/food-scan", methods=["POST"])
@login_required
def api_food_scan():
    """
    Core Food Scan API endpoint.
    Validates uploaded image and executes real Gemini multimodal recognition.
    """
    if "image" not in request.files:
        # Check base64 in JSON fallback
        json_data = request.get_json(silent=True) or {}
        if "imageBase64" in json_data:
            import base64
            raw_base64 = json_data["imageBase64"]
            mime_type = "image/jpeg"
            if "," in raw_base64:
                header, b64_content = raw_base64.split(",", 1)
                if "image/png" in header:
                    mime_type = "image/png"
                elif "image/webp" in header:
                    mime_type = "image/webp"
                image_bytes = base64.b64decode(b64_content)
            else:
                image_bytes = base64.b64decode(raw_base64)
        else:
            return jsonify({"success": False, "error": "Please upload a valid food image."}), 400
    else:
        file = request.files["image"]
        if file.filename == "":
            return jsonify({"success": False, "error": "Please select a food image file to scan."}), 400

        # Validate extension
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if ext not in Config.ALLOWED_EXTENSIONS:
            return jsonify({"success": False, "error": "Please upload a valid food image (JPG, JPEG, PNG, WEBP)."}), 400

        image_bytes = file.read()
        mime_type = file.mimetype or "image/jpeg"

    # Size check
    if len(image_bytes) > Config.MAX_CONTENT_LENGTH:
        return jsonify({"success": False, "error": "Image size is too large. Please upload an image under 16MB."}), 400

    if len(image_bytes) < 100:
        return jsonify({"success": False, "error": "Uploaded image file is empty or corrupted."}), 400

    # Execute real Gemini Multimodal analysis
    result = analyze_food_image(image_bytes=image_bytes, mime_type=mime_type)

    if not result.get("success"):
        return jsonify(result), 400

    return jsonify(result), 200


@app.route("/api/log-meal", methods=["POST"])
@login_required
def api_log_meal():
    """Logs a recognized meal or manual meal entry into the database."""
    member_id = session.get("active_member_id")
    if not member_id:
        return jsonify({"success": False, "error": "No active profile selected."}), 400

    data = request.get_json(silent=True) or request.form.to_dict()
    food_name = str(data.get("food_name", "")).strip()

    if not food_name:
        return jsonify({"success": False, "error": "Food name is required."}), 400

    try:
        calories = float(data.get("calories", 0))
        protein = float(data.get("protein", 0))
        carbs = float(data.get("carbohydrates", data.get("carbs", 0)))
        fat = float(data.get("fat", 0))
        fiber = float(data.get("fiber", 0))
        sugar = float(data.get("sugar", 0))
        confidence = float(data.get("confidence", 90))
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Invalid nutrient values."}), 400

    serving_size = str(data.get("serving_size", "1 serving")).strip()
    meal_type = str(data.get("meal_type", "Lunch")).strip()
    meal_date = str(data.get("date", date.today().isoformat())).strip()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO meals (
            member_id, food_name, serving_size, calories,
            protein, carbohydrates, fat, fiber, sugar,
            meal_type, confidence, date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        member_id, food_name, serving_size, calories,
        protein, carbs, fat, fiber, sugar,
        meal_type, confidence, meal_date
    ))
    conn.commit()
    meal_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Successfully logged '{food_name}' to {meal_type}!",
        "meal_id": meal_id
    })


@app.route("/api/meal/<int:meal_id>", methods=["DELETE", "POST"])
@login_required
def api_delete_meal(meal_id):
    """Deletes a logged meal."""
    member_id = session.get("active_member_id")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM meals WHERE id = ? AND member_id = ?", (meal_id, member_id))
    conn.commit()
    affected = cursor.rowcount
    conn.close()

    if affected:
        return jsonify({"success": True, "message": "Meal removed."})
    return jsonify({"success": False, "error": "Meal not found or unauthorized."}), 404


@app.route("/api/water", methods=["POST"])
@login_required
def api_log_water():
    """Logs water intake for the active member."""
    member_id = session.get("active_member_id")
    data = request.get_json(silent=True) or request.form.to_dict()

    try:
        amount_ml = int(data.get("amount_ml", 250))
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Invalid water amount."}), 400

    today_str = date.today().isoformat()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO water_logs (member_id, amount_ml, date) VALUES (?, ?, ?)", (member_id, amount_ml, today_str))
    conn.commit()

    # Get updated total
    cursor.execute("SELECT SUM(amount_ml) as total FROM water_logs WHERE member_id = ? AND date = ?", (member_id, today_str))
    total_water = cursor.fetchone()["total"] or 0
    conn.close()

    return jsonify({"success": True, "total_water": total_water, "added": amount_ml})


@app.route("/api/sleep", methods=["POST"])
@login_required
def api_log_sleep():
    """Logs sleep hours and quality."""
    member_id = session.get("active_member_id")
    data = request.get_json(silent=True) or request.form.to_dict()

    try:
        hours = float(data.get("hours", 8.0))
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Invalid sleep hours."}), 400

    quality = str(data.get("quality", "Good")).strip()
    sleep_date = str(data.get("date", date.today().isoformat())).strip()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO sleep_logs (member_id, hours, quality, date)
        VALUES (?, ?, ?, ?)
    """, (member_id, hours, quality, sleep_date))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Sleep logged successfully!", "hours": hours})


@app.route("/api/weight", methods=["POST"])
@login_required
def api_log_weight():
    """Logs weight entry."""
    member_id = session.get("active_member_id")
    data = request.get_json(silent=True) or request.form.to_dict()

    try:
        weight_kg = float(data.get("weight_kg", 70.0))
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Invalid weight value."}), 400

    weight_date = str(data.get("date", date.today().isoformat())).strip()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO weight_logs (member_id, weight_kg, date) VALUES (?, ?, ?)", (member_id, weight_kg, weight_date))
    # Update profile weight as well
    cursor.execute("UPDATE profiles SET weight_kg = ? WHERE member_id = ?", (weight_kg, member_id))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Weight recorded successfully!", "weight_kg": weight_kg})


@app.route("/api/switch-member", methods=["POST"])
@login_required
def api_switch_member():
    """Switches active member in the session."""
    data = request.get_json(silent=True) or request.form.to_dict()
    member_id = int(data.get("member_id", 0))

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM family_members WHERE id = ? AND user_id = ?", (member_id, session["user_id"]))
    member = cursor.fetchone()
    conn.close()

    if member:
        session["active_member_id"] = member["id"]
        return jsonify({"success": True, "member_id": member["id"], "name": member["name"]})
    return jsonify({"success": False, "error": "Member not found."}), 404


@app.route("/api/generate-meal-plan", methods=["POST"])
@login_required
def api_generate_meal_plan():
    """Calls Gemini API to generate personalized 7-day meal plan and stores it."""
    member_id = session.get("active_member_id")
    profile, targets = get_active_profile_and_targets(member_id)

    result = generate_meal_plan(
        profile_data=profile,
        target_calories=targets["target_calories"],
        macros={"protein_g": targets["protein_g"], "carbs_g": targets["carbs_g"], "fat_g": targets["fat_g"]}
    )

    if not result.get("success"):
        return jsonify(result), 400

    plan_json_str = json.dumps(result["data"])
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO meal_plans (member_id, plan_json) VALUES (?, ?)", (member_id, plan_json_str))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "data": result["data"]})


@app.route("/api/progress-data")
@login_required
def api_progress_data():
    """Returns past 14 days of nutrition, weight, water, and sleep for Chart.js."""
    member_id = session.get("active_member_id")
    today = date.today()
    days = [(today - timedelta(days=i)).isoformat() for i in range(13, -1, -1)]

    conn = get_db()
    cursor = conn.cursor()

    # Calories & Macros per day
    calories_data = []
    protein_data = []
    carbs_data = []
    fat_data = []
    water_data = []
    sleep_data = []
    weight_data = []

    for d in days:
        # Meals
        cursor.execute("""
            SELECT
                COALESCE(SUM(calories), 0) as cals,
                COALESCE(SUM(protein), 0) as p,
                COALESCE(SUM(carbohydrates), 0) as c,
                COALESCE(SUM(fat), 0) as f
            FROM meals WHERE member_id = ? AND date = ?
        """, (member_id, d))
        m_row = cursor.fetchone()
        calories_data.append(int(round(m_row["cals"])))
        protein_data.append(round(m_row["p"], 1))
        carbs_data.append(round(m_row["c"], 1))
        fat_data.append(round(m_row["f"], 1))

        # Water
        cursor.execute("SELECT COALESCE(SUM(amount_ml), 0) as w FROM water_logs WHERE member_id = ? AND date = ?", (member_id, d))
        water_data.append(cursor.fetchone()["w"])

        # Sleep
        cursor.execute("SELECT COALESCE(SUM(hours), 0) as s FROM sleep_logs WHERE member_id = ? AND date = ?", (member_id, d))
        sleep_data.append(round(cursor.fetchone()["s"], 1))

        # Weight
        cursor.execute("SELECT weight_kg FROM weight_logs WHERE member_id = ? AND date <= ? ORDER BY date DESC, id DESC LIMIT 1", (member_id, d))
        w_row = cursor.fetchone()
        weight_data.append(w_row["weight_kg"] if w_row else None)

    conn.close()

    # Format labels (e.g. 'Oct 01')
    labels = [datetime.strptime(d, "%Y-%m-%d").strftime("%b %d") for d in days]

    return jsonify({
        "success": True,
        "labels": labels,
        "calories": calories_data,
        "protein": protein_data,
        "carbohydrates": carbs_data,
        "fat": fat_data,
        "water": water_data,
        "sleep": sleep_data,
        "weight": weight_data
    })


@app.route("/api/ai-status")
def api_ai_status():
    """Returns Gemini configuration status safely without exposing the API key."""
    status = get_gemini_config()
    return jsonify({
        "success": True,
        "configured": status["is_configured"],
        "status_text": "AI Ready" if status["is_configured"] else "AI Configuration Missing",
        "model": status["model"]
    })


# =========================================================================
# Error Handlers
# =========================================================================

@app.errorhandler(404)
def page_not_found(e):
    return render_template("base.html", custom_error="404 - Page Not Found", error_desc="The requested page could not be located."), 404

@app.errorhandler(500)
def server_error(e):
    logger.error(f"Internal Server Error: {str(e)}")
    return render_template("base.html", custom_error="500 - Server Error", error_desc="An internal error occurred. Please try again later."), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
