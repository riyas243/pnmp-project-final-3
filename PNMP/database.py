"""
PNMP SQLite Database Engine
Handles connection pooling, schema initialization, and transactional queries.
"""

import sqlite3
from pathlib import Path
from werkzeug.security import generate_password_hash
from config import Config
from datetime import date, timedelta

def get_db():
    """
    Returns a configured SQLite connection with foreign keys and Row factory enabled.
    """
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """
    Creates all tables, indexes, and initial demo data if database is fresh.
    """
    Path(Config.DATABASE_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = get_db()
    cursor = conn.cursor()

    # 1. Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        language TEXT DEFAULT 'en',
        theme TEXT DEFAULT 'light',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Family Members table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS family_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        relationship TEXT DEFAULT 'Self',
        is_primary INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 3. Profiles table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER UNIQUE NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
        age INTEGER DEFAULT 25,
        gender TEXT DEFAULT 'Male',
        height_cm REAL DEFAULT 172.0,
        weight_kg REAL DEFAULT 68.0,
        activity_level TEXT DEFAULT 'Moderately Active',
        dietary_preference TEXT DEFAULT 'Vegetarian',
        allergies TEXT DEFAULT '',
        medical_conditions TEXT DEFAULT '',
        fitness_goal TEXT DEFAULT 'Weight Maintenance',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 4. Meals table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS meals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
        food_name TEXT NOT NULL,
        serving_size TEXT DEFAULT '1 serving',
        calories REAL NOT NULL DEFAULT 0,
        protein REAL NOT NULL DEFAULT 0,
        carbohydrates REAL NOT NULL DEFAULT 0,
        fat REAL NOT NULL DEFAULT 0,
        fiber REAL NOT NULL DEFAULT 0,
        sugar REAL NOT NULL DEFAULT 0,
        meal_type TEXT NOT NULL,
        image_path TEXT DEFAULT '',
        confidence REAL DEFAULT 0,
        date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 5. Water Logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS water_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
        amount_ml INTEGER NOT NULL,
        date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 6. Sleep Logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sleep_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
        hours REAL NOT NULL,
        quality TEXT DEFAULT 'Good',
        date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 7. Weight Logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS weight_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
        weight_kg REAL NOT NULL,
        date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 8. Meal Plans table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS meal_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
        plan_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()

    # Seed demo account if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        seed_demo_account(conn)

    conn.close()


def seed_demo_account(conn):
    """
    Seeds a realistic starter account for viva/presentation convenience.
    Email: demo@pnmp.com
    Password: Password123!
    """
    cursor = conn.cursor()
    pwd_hash = generate_password_hash("Password123!")

    cursor.execute(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        ("Riyas Demo", "demo@pnmp.com", pwd_hash)
    )
    user_id = cursor.lastrowid

    # Primary member
    cursor.execute(
        "INSERT INTO family_members (user_id, name, relationship, is_primary) VALUES (?, ?, ?, 1)",
        (user_id, "Riyas Demo", "Self")
    )
    member_id = cursor.lastrowid

    # Secondary family member
    cursor.execute(
        "INSERT INTO family_members (user_id, name, relationship, is_primary) VALUES (?, ?, ?, 0)",
        (user_id, "Sarah (Spouse)", "Spouse")
    )
    sarah_member_id = cursor.lastrowid

    # Profile for primary
    cursor.execute("""
        INSERT INTO profiles (
            member_id, age, gender, height_cm, weight_kg,
            activity_level, dietary_preference, allergies,
            medical_conditions, fitness_goal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        member_id, 24, "Male", 175.0, 72.0,
        "Moderately Active", "Vegetarian", "None",
        "None", "Weight Loss"
    ))

    # Profile for secondary
    cursor.execute("""
        INSERT INTO profiles (
            member_id, age, gender, height_cm, weight_kg,
            activity_level, dietary_preference, allergies,
            medical_conditions, fitness_goal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        sarah_member_id, 23, "Female", 162.0, 56.0,
        "Lightly Active", "Vegetarian", "Peanuts",
        "None", "Weight Maintenance"
    ))

    today_str = date.today().isoformat()
    yesterday_str = (date.today() - timedelta(days=1)).isoformat()

    # Seed starter meals for today
    cursor.execute("""
        INSERT INTO meals (member_id, food_name, serving_size, calories, protein, carbohydrates, fat, fiber, sugar, meal_type, date, confidence)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (member_id, "Oatmeal with Almonds & Berries", "1 bowl (250g)", 320, 11, 48, 9, 7, 8, "Breakfast", today_str, 95))

    cursor.execute("""
        INSERT INTO meals (member_id, food_name, serving_size, calories, protein, carbohydrates, fat, fiber, sugar, meal_type, date, confidence)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (member_id, "Greek Salad with Paneer & Olive Oil", "1 plate (300g)", 420, 22, 14, 28, 4, 3, "Lunch", today_str, 92))

    # Water logs for today
    cursor.execute("INSERT INTO water_logs (member_id, amount_ml, date) VALUES (?, ?, ?)", (member_id, 750, today_str))
    cursor.execute("INSERT INTO water_logs (member_id, amount_ml, date) VALUES (?, ?, ?)", (member_id, 500, today_str))

    # Sleep log for today
    cursor.execute("INSERT INTO sleep_logs (member_id, hours, quality, date) VALUES (?, ?, ?, ?)", (member_id, 7.5, "Good", today_str))

    # Weight logs over past few weeks
    dates_weights = [
        ((date.today() - timedelta(days=21)).isoformat(), 74.0),
        ((date.today() - timedelta(days=14)).isoformat(), 73.2),
        ((date.today() - timedelta(days=7)).isoformat(), 72.6),
        (today_str, 72.0)
    ]
    for d, w in dates_weights:
        cursor.execute("INSERT INTO weight_logs (member_id, weight_kg, date) VALUES (?, ?, ?)", (member_id, w, d))

    conn.commit()
