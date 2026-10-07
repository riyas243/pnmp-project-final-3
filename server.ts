import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import {
  analyzeFoodImage,
  generateWeeklyMealPlan,
  searchNutrition,
  GEMINI_MODEL_DEFAULT,
} from './server/gemini.ts';
import { db } from './server/db.ts';
import { calculateNutritionPlan } from './server/nutrition.ts';

// Load environment variables safely
dotenv.config();

const app = express();

// In AI Studio preview environment, dev server must run on port 3000
const getPort = (): number => {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const val = parseInt(process.argv[portArgIdx + 1], 10);
    if (!isNaN(val)) return val;
  }
  return 3000;
};
const PORT = getPort();

// Setup multer memory storage for food scans (max 16MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB
  },
});

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Helper to determine active member from query or default to primary
function getActiveMemberId(req: Request): string {
  const queryMember = req.query.member_id as string;
  const bodyMember = req.body?.member_id as string;
  const headerMember = req.headers['x-member-id'] as string;
  const candidate = queryMember || bodyMember || headerMember;

  if (candidate && db.getFamilyMember(candidate)) {
    return candidate;
  }

  // Fallback to first primary family member of default user
  const demoUser = db.getUserByEmail('demo@pnmp.com');
  if (demoUser) {
    const members = db.getFamilyMembers(demoUser.id);
    if (members.length > 0) return members[0].id;
  }

  return 'mem-demo-riyas';
}

// Track meal plan generation locks to prevent duplicate calls (Section 57)
const generatingMealPlanLocks = new Set<string>();

// =========================================================================
// API Routes
// =========================================================================

// 1. AI Configuration & Status
app.get('/api/ai-status', (_req: Request, res: Response) => {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const model = (process.env.GEMINI_MODEL || '').trim() || GEMINI_MODEL_DEFAULT;

  const isConfigured = Boolean(
    apiKey &&
    apiKey !== 'YOUR_GEMINI_API_KEY_HERE' &&
    apiKey !== 'PASTE_YOUR_GEMINI_API_KEY_HERE' &&
    !apiKey.startsWith('YOUR_')
  );

  res.json({
    success: true,
    configured: isConfigured,
    status: isConfigured ? 'AI Ready' : 'AI Configuration Missing',
    model,
  });
});

// 2. Auth Routes
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required.' });
    return;
  }

  let user = db.getUserByEmail(email);
  if (!user && (email.toLowerCase().includes('riyas') || email.toLowerCase() === 'lovelyriyas20@gmail.com')) {
    const created = db.createUser('Riyas', email, password);
    user = created.user;
  } else if (!user || user.password_hash !== password) {
    res.status(401).json({ success: false, error: 'Invalid email or password. (Hint: use Password123! for demo)' });
    return;
  }

  const members = db.getFamilyMembers(user.id);
  const primaryMember = members.find(m => m.is_primary) || members[0];

  res.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, language: user.language, theme: user.theme },
    active_member_id: primaryMember?.id,
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    res.status(400).json({ success: false, error: 'All fields are required.' });
    return;
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    return;
  }

  const { user, primaryMember } = db.createUser(name, email, password);
  res.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, language: user.language, theme: user.theme },
    active_member_id: primaryMember.id,
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const requestedUserId = (req.query.user_id as string) || (req.headers['x-user-id'] as string);
  let user = requestedUserId ? db.getUserById(requestedUserId) : null;
  if (!user) {
    user = db.getUserByEmail('demo@pnmp.com');
  }
  if (!user) {
    res.status(404).json({ success: false, error: 'User session not found.' });
    return;
  }

  const members = db.getFamilyMembers(user.id);
  const activeId = getActiveMemberId(req);

  res.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, language: user.language, theme: user.theme },
    active_member_id: activeId || members[0]?.id,
    family_members: members,
  });
});

// 3. Family Profiles & Switching
app.get('/api/family', (req: Request, res: Response) => {
  const demoUser = db.getUserByEmail('demo@pnmp.com');
  if (!demoUser) {
    res.json({ success: true, members: [] });
    return;
  }

  const members = db.getFamilyMembers(demoUser.id);
  const enriched = members.map(m => {
    const profile = db.getProfile(m.id);
    const targets = calculateNutritionPlan(
      profile.weight_kg,
      profile.height_cm,
      profile.age,
      profile.gender,
      profile.activity_level,
      profile.fitness_goal
    );
    return { member: m, profile, targets };
  });

  res.json({ success: true, members: enriched, active_member_id: getActiveMemberId(req) });
});

app.post('/api/family/add', (req: Request, res: Response) => {
  const demoUser = db.getUserByEmail('demo@pnmp.com');
  if (!demoUser) {
    res.status(400).json({ success: false, error: 'User not found.' });
    return;
  }

  const { name, relationship, age, gender, height_cm, weight_kg, activity_level, dietary_preference, fitness_goal } = req.body || {};
  if (!name) {
    res.status(400).json({ success: false, error: 'Member name is required.' });
    return;
  }

  const newMember = db.addFamilyMember(demoUser.id, name, relationship || 'Family Member', {
    age: Number(age) || 25,
    gender: gender || 'Male',
    height_cm: Number(height_cm) || 170,
    weight_kg: Number(weight_kg) || 65,
    activity_level: activity_level || 'Moderately Active',
    dietary_preference: dietary_preference || 'Vegetarian',
    fitness_goal: fitness_goal || 'Weight Maintenance',
    target_weight_kg: Number(weight_kg) || 65,
  });

  res.json({ success: true, member: newMember });
});

app.delete('/api/family/:id', (req: Request, res: Response) => {
  const demoUser = db.getUserByEmail('demo@pnmp.com');
  const { id } = req.params;
  if (!demoUser) {
    res.status(400).json({ success: false, error: 'User not found.' });
    return;
  }

  const deleted = db.deleteFamilyMember(id, demoUser.id);
  if (deleted) {
    res.json({ success: true, message: 'Family member removed.' });
  } else {
    res.status(400).json({ success: false, error: 'Cannot remove primary account owner or member not found.' });
  }
});

app.post('/api/switch-member', (req: Request, res: Response) => {
  const memberId = req.body?.member_id || req.body?.memberId;
  const member = db.getFamilyMember(memberId);
  if (!member) {
    res.status(404).json({ success: false, error: 'Family member not found.' });
    return;
  }

  res.json({ success: true, member_id: member.id, name: member.name });
});

// 4. User Profile & Scientific Targets
app.get('/api/profile', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const member = db.getFamilyMember(memberId);
  const profile = db.getProfile(memberId);
  const targets = calculateNutritionPlan(
    profile.weight_kg,
    profile.height_cm,
    profile.age,
    profile.gender,
    profile.activity_level,
    profile.fitness_goal
  );

  res.json({ success: true, member, profile, targets });
});

app.put('/api/profile', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const body = req.body || {};

  const updates: Partial<typeof body> = {};
  if (body.age !== undefined) updates.age = Math.max(1, Number(body.age));
  if (body.gender) updates.gender = body.gender;
  if (body.height_cm !== undefined) updates.height_cm = Math.max(50, Number(body.height_cm));
  if (body.weight_kg !== undefined) updates.weight_kg = Math.max(20, Number(body.weight_kg));
  if (body.activity_level) updates.activity_level = body.activity_level;
  if (body.dietary_preference) updates.dietary_preference = body.dietary_preference;
  if (body.allergies !== undefined) updates.allergies = String(body.allergies).trim();
  if (body.medical_conditions !== undefined) updates.medical_conditions = String(body.medical_conditions).trim();
  if (body.fitness_goal) updates.fitness_goal = body.fitness_goal;
  if (body.target_weight_kg !== undefined) updates.target_weight_kg = Number(body.target_weight_kg);

  const updatedProfile = db.updateProfile(memberId, updates);
  const targets = calculateNutritionPlan(
    updatedProfile.weight_kg,
    updatedProfile.height_cm,
    updatedProfile.age,
    updatedProfile.gender,
    updatedProfile.activity_level,
    updatedProfile.fitness_goal
  );

  res.json({ success: true, profile: updatedProfile, targets, message: 'Profile updated successfully.' });
});

// 5. Meals (Today & History)
app.get(['/api/meals', '/api/today'], (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const today = new Date().toISOString().split('T')[0];
  const queryDate = (req.query.date as string) || today;

  const todayMeals = db.getMeals(memberId, queryDate);
  const history = db.getAllMealsHistory(memberId, 50);

  // Calculate totals
  const totals = todayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: Math.round((acc.protein + (m.protein || 0)) * 10) / 10,
      carbohydrates: Math.round((acc.carbohydrates + (m.carbohydrates || 0)) * 10) / 10,
      fat: Math.round((acc.fat + (m.fat || 0)) * 10) / 10,
      fiber: Math.round((acc.fiber + (m.fiber || 0)) * 10) / 10,
      sugar: Math.round((acc.sugar + (m.sugar || 0)) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0 }
  );

  res.json({
    success: true,
    meals: todayMeals,
    history,
    totals,
  });
});

app.post('/api/log-meal', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const body = req.body || {};
  const mealData = body.meal || body;
  const mealType = body.mealType || mealData.meal_type || 'Lunch';
  const mealDate = body.date || mealData.date || new Date().toISOString().split('T')[0];

  if (!mealData || !mealData.food_name) {
    res.status(400).json({ success: false, error: 'Food name is required to log a meal.' });
    return;
  }

  const addedMeal = db.addMeal({
    member_id: memberId,
    food_name: String(mealData.food_name).trim(),
    serving_size: String(mealData.serving_size || '1 serving').trim(),
    calories: Math.max(0, Math.round(Number(mealData.calories) || 0)),
    protein: Math.max(0, Math.round((Number(mealData.protein) || 0) * 10) / 10),
    carbohydrates: Math.max(0, Math.round((Number(mealData.carbohydrates || mealData.carbs) || 0) * 10) / 10),
    fat: Math.max(0, Math.round((Number(mealData.fat) || 0) * 10) / 10),
    fiber: Math.max(0, Math.round((Number(mealData.fiber) || 0) * 10) / 10),
    sugar: Math.max(0, Math.round((Number(mealData.sugar) || 0) * 10) / 10),
    ingredients: Array.isArray(mealData.ingredients) ? mealData.ingredients : [],
    health_notes: String(mealData.health_notes || '').trim(),
    warnings: String(mealData.warnings || '').trim(),
    meal_type: mealType,
    confidence: Number(mealData.confidence) || 90,
    date: mealDate,
  });

  const todayMeals = db.getMeals(memberId, mealDate);
  const totals = todayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: Math.round((acc.protein + m.protein) * 10) / 10,
      carbohydrates: Math.round((acc.carbohydrates + m.carbohydrates) * 10) / 10,
      fat: Math.round((acc.fat + m.fat) * 10) / 10,
      fiber: Math.round((acc.fiber + m.fiber) * 10) / 10,
      sugar: Math.round((acc.sugar + m.sugar) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0 }
  );

  res.json({
    success: true,
    message: `Successfully logged '${addedMeal.food_name}' to ${mealType}!`,
    meal: addedMeal,
    totals,
  });
});

app.delete('/api/meals/:id', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const { id } = req.params;
  const deleted = db.deleteMeal(id, memberId);

  if (deleted) {
    res.json({ success: true, message: 'Meal removed from diary.' });
  } else {
    res.status(404).json({ success: false, error: 'Meal not found or unauthorized.' });
  }
});

// 6. Multimodal Food Scan
app.post('/api/food-scan', upload.single('image'), async (req: Request, res: Response) => {
  try {
    let imageBuffer: Buffer | null = null;
    let mimeType = 'image/jpeg';

    if (req.file) {
      imageBuffer = req.file.buffer;
      mimeType = req.file.mimetype || 'image/jpeg';
    } else if (req.body?.imageBase64) {
      const rawBase64 = String(req.body.imageBase64);
      if (rawBase64.includes(';base64,')) {
        const parts = rawBase64.split(';base64,');
        mimeType = parts[0].replace('data:', '');
        imageBuffer = Buffer.from(parts[1], 'base64');
      } else {
        imageBuffer = Buffer.from(rawBase64, 'base64');
      }
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      res.status(400).json({ success: false, error: 'Please upload a valid food image (JPG, PNG, or WEBP).' });
      return;
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(mimeType.toLowerCase())) {
      res.status(400).json({ success: false, error: 'Invalid file format. Please upload JPG, PNG, or WEBP image.' });
      return;
    }

    const result = await analyzeFoodImage(imageBuffer, mimeType);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const errorMsg = (err as Error)?.message || 'An error occurred during food recognition.';
    if (errorMsg.startsWith('CONFIG_MISSING:')) {
      res.status(400).json({ success: false, error: 'Gemini API key is not configured. Please check your .env settings.' });
      return;
    }
    if (errorMsg.startsWith('NON_FOOD:')) {
      res.status(400).json({ success: false, error: errorMsg.replace('NON_FOOD:', '') });
      return;
    }
    res.status(500).json({ success: false, error: errorMsg.replace(/^[A-Z_]+:/, '') });
  }
});

// 7. Manual Nutrition Search (Section 60)
app.all(['/api/nutrition/search', '/api/nutrition-search'], async (req: Request, res: Response) => {
  try {
    const query = String(req.body?.query || req.query?.query || req.query?.q || '').trim();
    if (!query) {
      res.status(400).json({ success: false, error: 'Search query is required.' });
      return;
    }

    const result = await searchNutrition(query);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = (err as Error)?.message || 'Failed to retrieve food nutrition.';
    res.status(400).json({ success: false, error: msg.replace(/^[A-Z_]+:/, '') });
  }
});

// 8. Weekly Meal Plan (CRITICAL BUG FIX & SECTIONS 48-58)
app.get('/api/meal-plan', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const plan = db.getCurrentMealPlan(memberId);
  const groceryItems = db.getGroceryItems(memberId);
  const profile = db.getProfile(memberId);
  const targets = calculateNutritionPlan(
    profile.weight_kg,
    profile.height_cm,
    profile.age,
    profile.gender,
    profile.activity_level,
    profile.fitness_goal
  );

  res.json({
    success: true,
    plan: plan || null,
    grocery_items: groceryItems,
    profile,
    targets,
  });
});

app.post('/api/generate-meal-plan', async (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);

  // Duplicate Prevention Lock (Section 57)
  if (generatingMealPlanLocks.has(memberId)) {
    res.status(429).json({
      success: false,
      error: 'Generating your personalized 7-day meal plan... Please wait a moment.',
    });
    return;
  }

  try {
    generatingMealPlanLocks.add(memberId);

    const profile = db.getProfile(memberId);
    const targets = calculateNutritionPlan(
      profile.weight_kg,
      profile.height_cm,
      profile.age,
      profile.gender,
      profile.activity_level,
      profile.fitness_goal
    );

    // Call Gemini with strict structured schema validation
    const generated = await generateWeeklyMealPlan(profile, targets);

    // Save plan to SQLite / persistent database store (Section 53)
    const savedRecord = db.saveMealPlan(memberId, {
      weekly_plan: generated.weekly_plan,
      grocery_list: generated.grocery_list,
      summary: generated.summary,
      medical_disclaimer: generated.medical_disclaimer,
    });

    const groceryItems = db.getGroceryItems(memberId);

    res.json({
      success: true,
      message: 'Personalized 7-day meal plan successfully generated and stored!',
      plan: savedRecord,
      grocery_items: groceryItems,
    });
  } catch (err: unknown) {
    const errorMsg = (err as Error)?.message || 'Unable to generate your meal plan right now. Please try again later.';
    res.status(400).json({ success: false, error: errorMsg.replace(/^[A-Z_]+:/, '') });
  } finally {
    generatingMealPlanLocks.delete(memberId);
  }
});

app.delete('/api/meal-plan', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  db.deleteMealPlan(memberId);
  res.json({ success: true, message: 'Meal plan cleared.' });
});

// 9. Grocery List Management (Section 65)
app.get('/api/grocery', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const items = db.getGroceryItems(memberId);
  res.json({ success: true, items });
});

app.post('/api/grocery/add', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const { name, category } = req.body || {};
  if (!name || !String(name).trim()) {
    res.status(400).json({ success: false, error: 'Item name is required.' });
    return;
  }

  const item = db.addGroceryItem(memberId, name, category);
  res.json({ success: true, item });
});

app.put('/api/grocery/:id/toggle', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const { id } = req.params;
  const updated = db.toggleGroceryItem(id, memberId);
  if (updated) {
    res.json({ success: true, item: updated });
  } else {
    res.status(404).json({ success: false, error: 'Item not found.' });
  }
});

app.delete('/api/grocery/:id', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const { id } = req.params;
  db.deleteGroceryItem(id, memberId);
  res.json({ success: true, message: 'Item removed.' });
});

app.post('/api/grocery/clear-completed', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const count = db.clearCompletedGroceryItems(memberId);
  res.json({ success: true, cleared: count, items: db.getGroceryItems(memberId) });
});

// 10. Favorite Foods (Section 62)
app.get('/api/favorites', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const favs = db.getFavorites(memberId);
  res.json({ success: true, favorites: favs });
});

app.post('/api/favorites', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const body = req.body || {};
  if (!body.food_name) {
    res.status(400).json({ success: false, error: 'Food name is required.' });
    return;
  }

  const fav = db.addFavorite(memberId, {
    food_name: body.food_name,
    serving_size: body.serving_size || '1 serving',
    calories: Number(body.calories) || 0,
    protein: Number(body.protein) || 0,
    carbohydrates: Number(body.carbohydrates || body.carbs) || 0,
    fat: Number(body.fat) || 0,
    fiber: Number(body.fiber) || 0,
    sugar: Number(body.sugar) || 0,
    meal_type: body.meal_type || 'Lunch',
  });

  res.json({ success: true, favorite: fav });
});

app.delete('/api/favorites/:id', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const { id } = req.params;
  db.removeFavorite(id, memberId);
  res.json({ success: true, message: 'Favorite removed.' });
});

// 11. Lifestyle Trackers (Water, Sleep, Weight)
app.post('/api/water', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const amount = Number(req.body?.amount_ml || 250);
  const today = new Date().toISOString().split('T')[0];

  const total = db.addWaterLog(memberId, amount, today);
  res.json({ success: true, total_water: total, added: amount });
});

app.get('/api/water', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const today = new Date().toISOString().split('T')[0];
  const total = db.getWaterToday(memberId, today);
  res.json({ success: true, total_water: total });
});

app.post('/api/sleep', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const hours = Number(req.body?.hours || 8);
  const quality = req.body?.quality || 'Good';
  const today = new Date().toISOString().split('T')[0];

  const log = db.logSleep(memberId, hours, quality, today);
  res.json({ success: true, log });
});

app.get('/api/sleep', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const today = new Date().toISOString().split('T')[0];
  const log = db.getSleepToday(memberId, today);
  res.json({ success: true, sleep: log || null });
});

app.post('/api/weight', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const weight = Number(req.body?.weight_kg || 70);
  const today = new Date().toISOString().split('T')[0];

  const log = db.logWeight(memberId, weight, today);
  res.json({ success: true, log });
});

app.get('/api/weight', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const logs = db.getWeightLogs(memberId);
  res.json({ success: true, logs });
});

// 12. Progress Analytics Data (Section 64 & 67)
app.get('/api/progress-data', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const days: string[] = [];
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  const calories: number[] = [];
  const protein: number[] = [];
  const carbs: number[] = [];
  const fat: number[] = [];
  const water: number[] = [];
  const sleep: number[] = [];
  const weightLogs = db.getWeightLogs(memberId);

  for (const day of days) {
    const dayMeals = db.getMeals(memberId, day);
    calories.push(dayMeals.reduce((acc, m) => acc + m.calories, 0));
    protein.push(Math.round(dayMeals.reduce((acc, m) => acc + m.protein, 0) * 10) / 10);
    carbs.push(Math.round(dayMeals.reduce((acc, m) => acc + m.carbohydrates, 0) * 10) / 10);
    fat.push(Math.round(dayMeals.reduce((acc, m) => acc + m.fat, 0) * 10) / 10);

    water.push(db.getWaterToday(memberId, day));
    const s = db.getSleepToday(memberId, day);
    sleep.push(s ? s.hours : 0);
  }

  // Weight progression aligned to labels
  const weightData: Array<number | null> = days.map(d => {
    const match = weightLogs.filter(w => w.date <= d).pop();
    return match ? match.weight_kg : null;
  });

  const labels = days.map(d => {
    const dateObj = new Date(d);
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  res.json({
    success: true,
    labels,
    calories,
    protein,
    carbohydrates: carbs,
    fat,
    water,
    sleep,
    weight: weightData,
  });
});

// 13. Reminders System (Section 68)
app.get('/api/reminders', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const reminders = db.getReminders(memberId);
  res.json({ success: true, reminders });
});

app.put('/api/reminders', (req: Request, res: Response) => {
  const memberId = getActiveMemberId(req);
  const list = req.body?.reminders || [];
  const updated = db.updateReminders(memberId, list);
  res.json({ success: true, reminders: updated });
});

// 14. Settings (Theme & Language - Section 69)
app.post('/api/settings', (req: Request, res: Response) => {
  const demoUser = db.getUserByEmail('demo@pnmp.com');
  if (!demoUser) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }

  const { language, theme, name } = req.body || {};
  const updated = db.updateUserSettings(demoUser.id, {
    language: language === 'ta' || language === 'hi' ? language : 'en',
    theme: theme === 'dark' ? 'dark' : 'light',
    name,
  });

  res.json({ success: true, user: updated });
});

// =========================================================================
// Vite Dev Server / Static Asset Handler
// =========================================================================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PNMP Health Platform active and listening on port ${PORT}`);
  });
}

startServer();
