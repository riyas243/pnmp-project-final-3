# PNMP - Personalized Nutrition & Meal Planner (AI Food Scanner)

PNMP is a modern, high-precision nutrition planning and meal tracking platform powered by **Google Gemini API** multimodal image recognition. It analyzes real food photos, estimates portion sizes and nutritional values (calories, protein, carbohydrates, fats, fiber, sugar), lists ingredients, provides health insights and warnings, and enables instant logging into a personalized nutrition diary.

---

## Google AI Studio Setup Documentation

Follow these steps to obtain and configure your Gemini API key:

1. **Open Google AI Studio**: Go to [https://aistudio.google.com/](https://aistudio.google.com/).
2. **Sign in with a Google account**.
3. **Create/get a Gemini API key**: Click **Get API key** in the left navigation menu, then click **Create API key**.
4. **Copy the API key**.
5. **Create a local `.env` file** in the root directory of this project (it is already included in `.gitignore`):
   ```bash
   cp .env.example .env
   ```
6. **Add your API key** to `.env`:
   ```bash
   GEMINI_API_KEY=YOUR_REAL_KEY
   ```
7. **Configure the supported Gemini multimodal model**:
   ```bash
   GEMINI_MODEL=gemini-3.8-flash
   ```
   *(Note: You can switch models anytime by changing `GEMINI_MODEL` without modifying any application code).*
8. **Start the application**:
   ```bash
   npm run dev
   # Or for Python Flask environments using utils/gemini.py:
   # flask run --port 3000
   ```
9. **Open Food Scan** in your browser (`http://localhost:3000`).
10. **Upload a food image** (JPG, JPEG, PNG, or WEBP).
11. **Click "Scan Food"**.
12. **Verify that Gemini returns the nutrition result** with confidence score, serving size, macronutrients, ingredients list, and health notes.

> **Security Note:** Never commit your `.env` file or place your actual API key into Git, client-side files, HTML, CSS, JavaScript, or public repositories. The Gemini API key stays strictly on the server.

---

## Food Image → Gemini Architecture Flow

```
User
  ↓
Food Scan Page
  ↓
Select/Upload Food Image (Drag-and-Drop, Camera, File Upload, or Sample Dishes)
  ↓
Frontend validates image (MIME type, format, file size)
  ↓
Backend receives image (/api/food-scan via multipart/form-data or base64)
  ↓
Backend validates image (buffer length, MIME whitelist, size limit <= 10MB)
  ↓
Backend loads GEMINI_API_KEY & GEMINI_MODEL from environment
  ↓
Backend sends image + structured food-recognition prompt to Gemini
  ↓
Gemini analyzes image (multimodal reasoning)
  ↓
Gemini returns structured food information in strict JSON
  ↓
Backend validates Gemini response schema (food_name, numeric macros, ingredients array)
  ↓
Backend converts and normalizes response safely
  ↓
Backend sends safe JSON response to frontend
  ↓
Frontend displays Food Recognition Result
  ↓
User can Log Meal into Daily Nutrition Log or Scan Another
```

---

## Food Scan API Route

### `POST /api/food-scan`
- **Authentication**: Requires valid user session / auth token.
- **Request Body**: `multipart/form-data` with `image` file, or JSON with `{ imageBase64, mimeType }`.
- **Supported Formats**: JPG, JPEG, PNG, WEBP (Max 10MB).
- **Successful Response**:
```json
{
  "success": true,
  "data": {
    "food_name": "Grilled Chicken",
    "confidence": 92,
    "serving_size": "150 g",
    "calories": 250,
    "protein": 35,
    "carbohydrates": 2,
    "fat": 10,
    "fiber": 0,
    "sugar": 0,
    "ingredients": ["chicken", "spices"],
    "health_notes": "High protein food",
    "warnings": ""
  }
}
```

### `GET /api/ai-status`
Returns AI engine health without exposing internal credentials:
```json
{
  "success": true,
  "status": "AI Ready",
  "model": "gemini-3.8-flash",
  "configured": true
}
```

### `POST /api/log-meal`
Logs the scanned food item into the user's daily meal log:
```json
{
  "success": true,
  "message": "Meal logged successfully!",
  "data": { ... }
}
```

---

## Server Utilities & Modules

- **TypeScript / Node.js Engine**: `server/gemini.ts` & `server.ts`
- **Python / Flask Integration**: `utils/gemini.py` (`get_gemini_client()`, `analyze_food_image()`, `validate_gemini_response()`, `normalize_food_result()`)
