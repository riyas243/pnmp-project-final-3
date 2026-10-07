# PERSONALIZED NUTRITION & MEAL PLANNER (PNMP)

Final-Year B.Sc. Artificial Intelligence & Data Science Capstone Project  
A full-stack, AI-powered health-tech web platform featuring multimodal food image recognition, scientific metabolic calculations, personalized 7-day meal planning, grocery list compilation, family profile management, and multi-language support.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Prerequisites & Python Installation](#prerequisites--python-installation)
6. [Quick Start Guide (Windows / VS Code)](#quick-start-guide-windows--vs-code)
7. [Environment Variables & Google AI Studio Setup](#environment-variables--google-ai-studio-setup)
8. [Database Schema & Seed Data](#database-schema--seed-data)
9. [Scientific Nutrition Engine Details](#scientific-nutrition-engine-details)
10. [AI Multimodal Food Scanner Architecture](#ai-multimodal-food-scanner-architecture)
11. [Testing & Verification Guide](#testing--verification-guide)
12. [College Viva & Demonstration FAQ](#college-viva--demonstration-faq)
13. [Medical & Nutritional Safety Disclaimer](#medical--nutritional-safety-disclaimer)

---

## 1. Project Overview

**PNMP (Personalized Nutrition & Meal Planner)** solves common limitations of traditional fitness trackers by combining standard metabolic formulas (Mifflin-St Jeor, WHO BMI cutoffs) with **multimodal computer vision** powered by the **Google Gemini API**.

Instead of manually searching nutritional databases for each ingredient, users can upload or capture a photo of their meal. The server-side Gemini integration identifies the dish, portions, macro/micronutrients, and potential allergens in structured JSON format, enabling 1-click diary logging.

---

## 2. Key Features

- **Scientific Metabolic Engine**:
  - **BMI** (Body Mass Index) + WHO category classification and actionable advice.
  - **BMR** (Basal Metabolic Rate) calculated via the gold-standard Mifflin-St Jeor equation.
  - **TDEE** (Total Daily Energy Expenditure) based on five activity levels (1.2x to 1.9x).
  - **Safe Calorie Targets**: 500 kcal deficit for fat loss, maintenance for stabilization, or 400 kcal surplus for lean gain.
  - **Macronutrient Split**: Target grams for Protein, Carbohydrates, and Fats.
- **Multimodal AI Food Image Scanner**:
  - Drag-and-drop or file upload (JPG, PNG, WEBP).
  - Server-side Gemini API request with strict JSON schema validation.
  - Returns food name, confidence score, serving size, calories, protein, carbs, fat, fiber, sugar, ingredients list, and health notes.
  - One-click "Log This Meal" directly into the user's daily diary.
- **AI 7-Day Meal Plan & Grocery List Generator**:
  - Custom 7-day schedule (Breakfast, Morning Snack, Lunch, Evening Snack, Dinner) with nutritional breakdown.
  - Automatically categorized grocery list (Produce, Proteins, Grains, Dairy).
- **Comprehensive Daily Trackers**:
  - Nutrition diary grouped by meal categories.
  - Quick-log Water tracker (+250ml, +500ml, custom amount) with real-time hydration meter.
  - Sleep logger (hours, quality ratings).
  - Body weight progression tracking.
- **Progress Analytics**:
  - Responsive charts using **Chart.js** (Weight progression, Caloric intake vs. target limit, Macronutrient ratios).
- **Multi-Member Household / Family Accounts**:
  - Add family members (Spouse, Child, Parent, Sibling) with individual biometrics, dietary preferences, and allergies.
  - Seamless one-click profile switching; zero data bleed between members.
- **Multi-Language Support**:
  - English, Tamil (தமிழ்), and Hindi (हिन्दी).
- **Theme Selection**:
  - Light mode (health-tech emerald theme) and Dark mode (high-contrast slate).

---

## 3. Technology Stack

- **Backend**: Python 3.10+ / Flask 3.x
- **Database**: SQLite 3 with Foreign Key constraints and automatic schema migration
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3, Bootstrap Icons
- **Data Visualization**: Chart.js 4.4
- **AI Service**: Google Gemini API (Multimodal Vision model `gemini-3.8-flash`)
- **Environment Management**: python-dotenv

---

## 4. Project Structure

```
PNMP/
│
├── app.py                  # Core Flask application, routing, and API endpoints
├── config.py               # Centralized configuration and path management
├── database.py             # SQLite connection pooling, schema DDL, and demo seeding
├── requirements.txt        # Minimal, production-ready Python package dependencies
├── README.md               # Complete documentation and viva guide
├── run.bat                 # 1-click Windows starter script for VS Code
├── .env.example            # Environment configuration template
├── .gitignore              # Protects secrets, DBs, and virtual environments
│
├── instance/
│   └── pnmp.db             # Local SQLite database (created automatically on first launch)
│
├── static/
│   ├── css/
│   │   └── style.css       # Clean, modern health-tech design system
│   └── js/
│       └── app.js          # Client-side controller (drag & drop, API fetch, toasts)
│
├── templates/
│   ├── base.html           # Master layout with sidebar, topbar, toasts, and disclaimers
│   ├── login.html          # Authentication view with demo account auto-fill
│   ├── register.html       # User onboarding view
│   ├── dashboard.html      # Central dashboard with biometrics, progress bars, quick actions
│   ├── profile.html        # Biometric profile editor with live calculation engine
│   ├── food_scan.html      # Multimodal Gemini food scanner interface
│   ├── meal_plan.html      # 7-Day AI meal plan viewer and grocery list
│   ├── today.html          # Daily meal diary with macro totals and manual entry
│   ├── progress.html       # Chart.js analytics for weight, calories, and macros
│   ├── family.html         # Multi-member household profile manager
│   └── settings.html       # Language switching, theme preferences, and AI status
│
├── utils/
│   ├── __init__.py
│   ├── nutrition.py        # BMI, BMR, TDEE, macro formulas
│   ├── gemini.py           # Google Gemini multimodal API client and JSON validator
│   └── translations.py     # Multi-language dictionary (English, Tamil, Hindi)
│
└── uploads/                # Temporary directory for image uploads
```

---

## 5. Prerequisites & Python Installation

1. Download and install **Python 3.10** or higher from [https://www.python.org/downloads/](https://www.python.org/downloads/).
   - **IMPORTANT**: During installation on Windows, ensure the box **"Add Python to PATH"** is checked!
2. Install **Visual Studio Code (VS Code)** or your preferred IDE.

---

## 6. Quick Start Guide (Windows / VS Code)

### Method A: One-Click Runner (Recommended for Windows)

1. Open the `PNMP` folder in **VS Code**.
2. Double-click or run `run.bat` in the terminal:
   ```cmd
   .\run.bat
   ```
3. `run.bat` will automatically:
   - Create a virtual environment (`.venv`) if not present.
   - Activate the virtual environment.
   - Install required packages from `requirements.txt`.
   - Copy `.env.example` to `.env` if `.env` does not exist.
   - Start the Flask development server on `http://127.0.0.1:5000`.
4. Open `http://127.0.0.1:5000` in your web browser.

### Method B: Manual Command Line Setup

```bash
# 1. Navigate to the project root
cd PNMP

# 2. Create Python virtual environment
python -m venv .venv

# 3. Activate the virtual environment
# On Windows (cmd/PowerShell):
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create local environment file
cp .env.example .env

# 6. Run the Flask application
python app.py
```

Visit `http://127.0.0.1:5000` in your browser.

---

## 7. Environment Variables & Google AI Studio Setup

PNMP strictly enforces server-side API key protection. **Never paste API keys into HTML, JS, or commit them to Git.**

### Step-by-Step Google AI Studio Setup:

1. Navigate to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click on **"Get API key"** and create or copy an API key.
4. Open the `.env` file in the `PNMP` directory.
5. Set your key:
   ```env
   GEMINI_API_KEY=AIzaSy...your_actual_key_here
   GEMINI_MODEL=gemini-3.8-flash
   FLASK_SECRET_KEY=any_secure_random_string_here
   PORT=5000
   ```
6. Save the file and restart the Flask app.
7. Navigate to the **Food Scan** page: the badge will show **"AI Ready (gemini-3.8-flash)"**.

> **Note on Missing API Keys**: If `GEMINI_API_KEY` is not configured, the Flask application **still starts normally**. Non-AI features (metabolic calculations, meal diaries, water tracking, family profiles, charts) continue functioning smoothly, while AI pages display a clear configuration notice.

---

## 8. Database Schema & Seed Data

The database is powered by **SQLite** (`instance/pnmp.db`) and automatically bootstraps itself with schema tables, foreign key constraints, and seed data upon first startup.

### Pre-configured Starter Account:
- **Email**: `demo@pnmp.com`
- **Password**: `Password123!`
- Includes sample biometrics, logged meals for today, hydration records, and historical weight progression for quick demonstration.

---

## 9. Scientific Nutrition Engine Details

Located in `utils/nutrition.py`:

1. **BMI (Body Mass Index)**:
   $$\text{BMI} = \frac{\text{weight (kg)}}{(\text{height (m)})^2}$$
   - *Categories*: Underweight (< 18.5), Normal (18.5 - 24.9), Overweight (25.0 - 29.9), Obese ($\ge$ 30.0).

2. **BMR (Mifflin-St Jeor Equation)**:
   - *Male*: $\text{BMR} = (10 \times \text{weight}) + (6.25 \times \text{height}) - (5 \times \text{age}) + 5$
   - *Female*: $\text{BMR} = (10 \times \text{weight}) + (6.25 \times \text{height}) - (5 \times \text{age}) - 161$

3. **TDEE (Total Daily Energy Expenditure)**:
   - $\text{TDEE} = \text{BMR} \times \text{Activity Multiplier}$
   - *Sedentary*: 1.2
   - *Lightly Active*: 1.375
   - *Moderately Active*: 1.55
   - *Very Active*: 1.725
   - *Extra Active*: 1.9

4. **Calorie Targets**:
   - *Weight Loss*: $\text{TDEE} - 500\text{ kcal}$ (Deficit floor: 1200 kcal for females, 1500 kcal for males).
   - *Maintenance*: $\text{TDEE}$.
   - *Weight Gain*: $\text{TDEE} + 400\text{ kcal}$.

---

## 10. AI Multimodal Food Scanner Architecture

The food scan pipeline processes images entirely server-side:

```
[User Browser]
      │  (Multipart Form-Data / Base64)
      ▼
[Flask Backend: POST /api/food-scan]
      │  1. Check MIME type (JPG, PNG, WEBP)
      │  2. Validate payload size (< 16MB)
      │  3. Read GEMINI_API_KEY from environment
      ▼
[Google Gemini Multimodal API: gemini-3.8-flash]
      │  Executes dedicated nutrition prompt & responseSchema
      ▼
[utils/gemini.py Validator]
      │  1. Strip markdown fences (```json)
      │  2. Validate all numeric & array fields
      │  3. Reject non-food images gracefully
      ▼
[Client Interface Result Card]
      │  Displays nutrients, ingredients, confidence
      ▼
[1-Click "Log This Meal"] -> [SQLite meals table]
```

---

## 11. Testing & Verification Guide

### Test Suite:
1. **Startup**: Verify Flask launches without errors and creates `instance/pnmp.db`.
2. **Auth**: Sign in using `demo@pnmp.com` / `Password123!`. Test registration with a new account.
3. **Biometrics**: Change height/weight on Profile page; observe live BMI, BMR, and TDEE updates.
4. **Food Scan (With Key)**: Upload food photo; verify structured dish name, confidence, macros, and ingredients.
5. **Food Scan (Without Key)**: Verify graceful error banner without server crash.
6. **Diary Logging**: Log a scanned or manual meal; observe dashboard calorie and macro bars update immediately.
7. **Hydration & Sleep**: Click `+250ml` or `+500ml`; verify instant hydration meter update.
8. **Family Profiles**: Add a second member; switch profiles; verify separate nutritional targets.
9. **Multi-Language**: Change language to Tamil or Hindi in Settings; verify UI localized instantly.
10. **Progress Charts**: Inspect Chart.js rendering on Progress page.

---

## 12. College Viva & Demonstration FAQ

**Q1: Why was Flask selected over Django?**  
*Answer*: Flask provides a lightweight, modular micro-framework architecture where every route, session, and database query is transparent and explainable. It avoids Django's heavy ORM overhead and fits college capstone viva demonstrations where examiners request exact code explanations.

**Q2: How does the application prevent SQL Injection?**  
*Answer*: All database operations in `database.py` and `app.py` utilize parameterized SQL queries (`cursor.execute("SELECT ... WHERE email = ?", (email,))`). No user input is concatenated into SQL strings.

**Q3: How are Gemini API keys secured?**  
*Answer*: The Gemini API key is stored exclusively in server environment variables (`.env`). The browser frontend communicates only with `/api/food-scan` via standard HTTP endpoints. The client code never receives or stores the API key.

**Q4: Which equation is used for metabolic calculations?**  
*Answer*: The Mifflin-St Jeor equation is implemented because clinical studies demonstrate it to be the most accurate predictive formula for BMR (within $\pm 10\%$ of indirect calorimetry).

---

## 13. Medical & Nutritional Safety Disclaimer

PNMP is designed for **educational and lifestyle guidance purposes only**. It does not diagnose, treat, or prevent any medical condition. Individuals with metabolic disorders, diabetes, kidney disease, or pregnancy should consult a registered dietitian or licensed medical practitioner before following any caloric deficit or dietary modification.
