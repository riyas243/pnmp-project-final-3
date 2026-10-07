import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory of PNMP
BASE_DIR = Path(__file__).resolve().parent

# Load .env file safely
load_dotenv(BASE_DIR / ".env")

class Config:
    # Security
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "pnmp-secure-session-key-dev-2026-prod")

    # Database
    INSTANCE_DIR = BASE_DIR / "instance"
    INSTANCE_DIR.mkdir(parents=True, exist_ok=True)
    DATABASE_PATH = str(INSTANCE_DIR / "pnmp.db")

    # Uploads
    UPLOAD_FOLDER = BASE_DIR / "uploads"
    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
    ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}

    # Google Gemini Configuration
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()

    # Session settings
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    PERMANENT_SESSION_LIFETIME = 86400 * 7  # 7 days
