/**
 * PNMP Persistent Database Engine (Node / Server)
 * - Atomic JSON file storage in ./instance/pnmp_store.json
 * - Matches SQLite relational schema & foreign keys
 * - Pre-seeded demo user (demo@pnmp.com / Password123!)
 * - Isolated data for each family member
 */

import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  language: 'en' | 'ta' | 'hi';
  theme: 'light' | 'dark';
  created_at: string;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  is_primary: boolean;
  created_at: string;
}

export interface UserProfile {
  member_id: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  height_cm: number;
  weight_kg: number;
  activity_level: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extra Active';
  dietary_preference: 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Eggetarian' | 'Pescatarian' | 'Keto' | 'Jain';
  allergies: string;
  medical_conditions: string;
  fitness_goal: 'Weight Loss' | 'Weight Maintenance' | 'Weight Gain';
  target_weight_kg: number;
  updated_at: string;
}

export interface Meal {
  id: string;
  member_id: string;
  food_name: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  ingredients?: string[];
  health_notes?: string;
  warnings?: string;
  meal_type: 'Breakfast' | 'Morning Snack' | 'Lunch' | 'Evening Snack' | 'Dinner' | 'Snack';
  confidence: number;
  date: string; // YYYY-MM-DD
  created_at: string;
}

export interface WaterLog {
  id: string;
  member_id: string;
  amount_ml: number;
  date: string;
  created_at: string;
}

export interface SleepLog {
  id: string;
  member_id: string;
  hours: number;
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  date: string;
  created_at: string;
}

export interface WeightLog {
  id: string;
  member_id: string;
  weight_kg: number;
  date: string;
  created_at: string;
}

export interface MealPlanDayMeal {
  meal_type: 'Breakfast' | 'Morning Snack' | 'Lunch' | 'Evening Snack' | 'Dinner';
  food_name: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  ingredients?: string[];
  prep_notes?: string;
}

export interface MealPlanDay {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  day_number?: number;
  meals: MealPlanDayMeal[];
  daily_total: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
}

export interface GroceryItem {
  id: string;
  member_id: string;
  name: string;
  category: 'Produce' | 'Proteins' | 'Grains & Pantry' | 'Dairy & Alternatives' | 'Vegetables' | 'Fruits' | 'Other';
  checked: boolean;
  created_at: string;
}

export interface MealPlanRecord {
  id: string;
  member_id: string;
  week_identifier: string;
  generated_date: string;
  weekly_plan: MealPlanDay[];
  summary?: string;
  medical_disclaimer?: string;
  created_at: string;
}

export interface FavoriteFood {
  id: string;
  member_id: string;
  food_name: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  meal_type: string;
  created_at: string;
}

export interface ReminderSetting {
  id: string;
  member_id: string;
  type: 'water' | 'meal' | 'sleep' | 'plan';
  label: string;
  time: string;
  enabled: boolean;
}

export interface DatabaseSchema {
  users: User[];
  family_members: FamilyMember[];
  profiles: UserProfile[];
  meals: Meal[];
  water_logs: WaterLog[];
  sleep_logs: SleepLog[];
  weight_logs: WeightLog[];
  meal_plans: MealPlanRecord[];
  grocery_items: GroceryItem[];
  favorites: FavoriteFood[];
  reminders: ReminderSetting[];
}

const DB_DIR = path.resolve(process.cwd(), 'instance');
const DB_FILE = path.resolve(DB_DIR, 'pnmp_store.json');

function getInitialDatabase(): DatabaseSchema {
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];

  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  };

  const demoUserId = 'usr-demo-1';
  const primaryMemberId = 'mem-demo-riyas';
  const secondaryMemberId = 'mem-demo-sarah';

  return {
    users: [
      {
        id: demoUserId,
        name: 'Riyas Demo',
        email: 'demo@pnmp.com',
        password_hash: 'Password123!', // Simple hash for preview demo
        language: 'en',
        theme: 'light',
        created_at: now,
      },
    ],
    family_members: [
      {
        id: primaryMemberId,
        user_id: demoUserId,
        name: 'Riyas Demo',
        relationship: 'Self',
        is_primary: true,
        created_at: now,
      },
      {
        id: secondaryMemberId,
        user_id: demoUserId,
        name: 'Sarah (Spouse)',
        relationship: 'Spouse',
        is_primary: false,
        created_at: now,
      },
    ],
    profiles: [
      {
        member_id: primaryMemberId,
        age: 25,
        gender: 'Male',
        height_cm: 175,
        weight_kg: 72,
        activity_level: 'Moderately Active',
        dietary_preference: 'Vegetarian',
        allergies: 'None',
        medical_conditions: 'None',
        fitness_goal: 'Weight Loss',
        target_weight_kg: 68,
        updated_at: now,
      },
      {
        member_id: secondaryMemberId,
        age: 24,
        gender: 'Female',
        height_cm: 162,
        weight_kg: 56,
        activity_level: 'Lightly Active',
        dietary_preference: 'Vegetarian',
        allergies: 'Peanuts',
        medical_conditions: 'None',
        fitness_goal: 'Weight Maintenance',
        target_weight_kg: 55,
        updated_at: now,
      },
    ],
    meals: [
      {
        id: 'meal-init-1',
        member_id: primaryMemberId,
        food_name: 'Oatmeal with Almonds & Berries',
        serving_size: '1 bowl (250g)',
        calories: 320,
        protein: 11,
        carbohydrates: 48,
        fat: 9,
        fiber: 7,
        sugar: 8,
        ingredients: ['rolled oats', 'almond milk', 'sliced almonds', 'blueberries'],
        health_notes: 'Rich in dietary fiber and essential micronutrients.',
        warnings: '',
        meal_type: 'Breakfast',
        confidence: 96,
        date: today,
        created_at: now,
      },
      {
        id: 'meal-init-2',
        member_id: primaryMemberId,
        food_name: 'Greek Salad with Paneer & Olive Oil',
        serving_size: '1 plate (300g)',
        calories: 420,
        protein: 22,
        carbohydrates: 14,
        fat: 28,
        fiber: 4,
        sugar: 3,
        ingredients: ['cucumbers', 'tomatoes', 'fresh paneer', 'extra virgin olive oil', 'oregano'],
        health_notes: 'High in quality protein and heart-healthy fats.',
        warnings: '',
        meal_type: 'Lunch',
        confidence: 94,
        date: today,
        created_at: now,
      },
      {
        id: 'meal-init-3',
        member_id: primaryMemberId,
        food_name: 'Mixed Roasted Nuts & Green Tea',
        serving_size: '30g',
        calories: 180,
        protein: 6,
        carbohydrates: 8,
        fat: 15,
        fiber: 3,
        sugar: 1,
        ingredients: ['walnuts', 'almonds', 'green tea'],
        health_notes: 'Antioxidant-rich snack for sustained afternoon energy.',
        warnings: '',
        meal_type: 'Evening Snack',
        confidence: 92,
        date: today,
        created_at: now,
      },
    ],
    water_logs: [
      { id: 'w-1', member_id: primaryMemberId, amount_ml: 500, date: today, created_at: now },
      { id: 'w-2', member_id: primaryMemberId, amount_ml: 750, date: today, created_at: now },
      { id: 'w-3', member_id: primaryMemberId, amount_ml: 500, date: daysAgo(1), created_at: now },
      { id: 'w-4', member_id: primaryMemberId, amount_ml: 1000, date: daysAgo(1), created_at: now },
      { id: 'w-5', member_id: primaryMemberId, amount_ml: 750, date: daysAgo(2), created_at: now },
    ],
    sleep_logs: [
      { id: 's-1', member_id: primaryMemberId, hours: 7.5, quality: 'Good', date: today, created_at: now },
      { id: 's-2', member_id: primaryMemberId, hours: 8.0, quality: 'Excellent', date: daysAgo(1), created_at: now },
      { id: 's-3', member_id: primaryMemberId, hours: 6.5, quality: 'Fair', date: daysAgo(2), created_at: now },
    ],
    weight_logs: [
      { id: 'wt-1', member_id: primaryMemberId, weight_kg: 74.0, date: daysAgo(21), created_at: now },
      { id: 'wt-2', member_id: primaryMemberId, weight_kg: 73.2, date: daysAgo(14), created_at: now },
      { id: 'wt-3', member_id: primaryMemberId, weight_kg: 72.5, date: daysAgo(7), created_at: now },
      { id: 'wt-4', member_id: primaryMemberId, weight_kg: 72.0, date: today, created_at: now },
    ],
    meal_plans: [],
    grocery_items: [
      { id: 'g-1', member_id: primaryMemberId, name: 'Rolled Oats', category: 'Grains & Pantry', checked: true, created_at: now },
      { id: 'g-2', member_id: primaryMemberId, name: 'Fresh Paneer (400g)', category: 'Proteins', checked: false, created_at: now },
      { id: 'g-3', member_id: primaryMemberId, name: 'Spinach & Cucumbers', category: 'Produce', checked: false, created_at: now },
      { id: 'g-4', member_id: primaryMemberId, name: 'Almond Milk (Unsweetened)', category: 'Dairy & Alternatives', checked: false, created_at: now },
    ],
    favorites: [
      {
        id: 'fav-1',
        member_id: primaryMemberId,
        food_name: 'Avocado Toast with Poached Egg',
        serving_size: '1 slice (180g)',
        calories: 290,
        protein: 12,
        carbohydrates: 24,
        fat: 16,
        fiber: 7,
        sugar: 2,
        meal_type: 'Breakfast',
        created_at: now,
      },
      {
        id: 'fav-2',
        member_id: primaryMemberId,
        food_name: 'Quinoa Veggie Bowl with Tahini',
        serving_size: '1 bowl (350g)',
        calories: 460,
        protein: 18,
        carbohydrates: 58,
        fat: 16,
        fiber: 9,
        sugar: 4,
        meal_type: 'Lunch',
        created_at: now,
      },
    ],
    reminders: [
      { id: 'r-1', member_id: primaryMemberId, type: 'water', label: 'Hydration Drink Reminder', time: '10:00', enabled: true },
      { id: 'r-2', member_id: primaryMemberId, type: 'meal', label: 'Lunch Nutrition Reminder', time: '13:00', enabled: true },
      { id: 'r-3', member_id: primaryMemberId, type: 'sleep', label: 'Wind-Down & Sleep Log', time: '22:30', enabled: false },
      { id: 'r-4', member_id: primaryMemberId, type: 'plan', label: 'Weekly Meal Plan Review', time: '18:00', enabled: true },
    ],
  };
}

class PNMPDatabase {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.warn('Corrupted database file detected, reinitializing with starter seed:', err);
        this.data = getInitialDatabase();
        this.save();
      }
    } else {
      this.data = getInitialDatabase();
      this.save();
    }
  }

  private save(): void {
    try {
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // --- Users & Auth ---
  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  createUser(name: string, email: string, passwordHash: string): { user: User; primaryMember: FamilyMember } {
    const userId = `usr-${Date.now()}`;
    const memberId = `mem-${Date.now()}`;
    const now = new Date().toISOString();

    const user: User = {
      id: userId,
      name,
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      language: 'en',
      theme: 'light',
      created_at: now,
    };

    const primaryMember: FamilyMember = {
      id: memberId,
      user_id: userId,
      name,
      relationship: 'Self',
      is_primary: true,
      created_at: now,
    };

    const defaultProfile: UserProfile = {
      member_id: memberId,
      age: 25,
      gender: 'Male',
      height_cm: 172,
      weight_kg: 68,
      activity_level: 'Moderately Active',
      dietary_preference: 'Vegetarian',
      allergies: '',
      medical_conditions: '',
      fitness_goal: 'Weight Maintenance',
      target_weight_kg: 68,
      updated_at: now,
    };

    this.data.users.push(user);
    this.data.family_members.push(primaryMember);
    this.data.profiles.push(defaultProfile);
    this.save();

    return { user, primaryMember };
  }

  updateUserSettings(userId: string, updates: Partial<Pick<User, 'language' | 'theme' | 'name'>>): User | undefined {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return undefined;
    if (updates.language) user.language = updates.language;
    if (updates.theme) user.theme = updates.theme;
    if (updates.name) user.name = updates.name;
    this.save();
    return user;
  }

  // --- Family Members ---
  getFamilyMembers(userId: string): FamilyMember[] {
    return this.data.family_members
      .filter(m => m.user_id === userId)
      .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
  }

  getFamilyMember(memberId: string): FamilyMember | undefined {
    return this.data.family_members.find(m => m.id === memberId);
  }

  addFamilyMember(userId: string, name: string, relationship: string, profileData?: Partial<UserProfile>): FamilyMember {
    const memberId = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const member: FamilyMember = {
      id: memberId,
      user_id: userId,
      name,
      relationship: relationship || 'Family Member',
      is_primary: false,
      created_at: now,
    };

    const profile: UserProfile = {
      member_id: memberId,
      age: profileData?.age || 25,
      gender: profileData?.gender || 'Male',
      height_cm: profileData?.height_cm || 170,
      weight_kg: profileData?.weight_kg || 65,
      activity_level: profileData?.activity_level || 'Moderately Active',
      dietary_preference: profileData?.dietary_preference || 'Vegetarian',
      allergies: profileData?.allergies || '',
      medical_conditions: profileData?.medical_conditions || '',
      fitness_goal: profileData?.fitness_goal || 'Weight Maintenance',
      target_weight_kg: profileData?.target_weight_kg || profileData?.weight_kg || 65,
      updated_at: now,
    };

    this.data.family_members.push(member);
    this.data.profiles.push(profile);
    this.save();

    return member;
  }

  deleteFamilyMember(memberId: string, userId: string): boolean {
    const member = this.data.family_members.find(m => m.id === memberId && m.user_id === userId);
    if (!member || member.is_primary) return false;

    this.data.family_members = this.data.family_members.filter(m => m.id !== memberId);
    this.data.profiles = this.data.profiles.filter(p => p.member_id !== memberId);
    this.data.meals = this.data.meals.filter(m => m.member_id !== memberId);
    this.data.water_logs = this.data.water_logs.filter(w => w.member_id !== memberId);
    this.data.sleep_logs = this.data.sleep_logs.filter(s => s.member_id !== memberId);
    this.data.weight_logs = this.data.weight_logs.filter(w => w.member_id !== memberId);
    this.data.meal_plans = this.data.meal_plans.filter(p => p.member_id !== memberId);
    this.data.grocery_items = this.data.grocery_items.filter(g => g.member_id !== memberId);
    this.data.favorites = this.data.favorites.filter(f => f.member_id !== memberId);
    this.data.reminders = this.data.reminders.filter(r => r.member_id !== memberId);

    this.save();
    return true;
  }

  // --- Profiles ---
  getProfile(memberId: string): UserProfile {
    let p = this.data.profiles.find(pr => pr.member_id === memberId);
    if (!p) {
      p = {
        member_id: memberId,
        age: 25,
        gender: 'Male',
        height_cm: 172,
        weight_kg: 68,
        activity_level: 'Moderately Active',
        dietary_preference: 'Vegetarian',
        allergies: '',
        medical_conditions: '',
        fitness_goal: 'Weight Maintenance',
        target_weight_kg: 68,
        updated_at: new Date().toISOString(),
      };
      this.data.profiles.push(p);
      this.save();
    }
    return p;
  }

  updateProfile(memberId: string, updates: Partial<UserProfile>): UserProfile {
    const p = this.getProfile(memberId);
    Object.assign(p, updates, { updated_at: new Date().toISOString() });

    // Also update weight log if weight changed
    if (updates.weight_kg !== undefined && updates.weight_kg > 0) {
      const today = new Date().toISOString().split('T')[0];
      const existing = this.data.weight_logs.find(w => w.member_id === memberId && w.date === today);
      if (existing) {
        existing.weight_kg = updates.weight_kg;
      } else {
        this.data.weight_logs.push({
          id: `wt-${Date.now()}`,
          member_id: memberId,
          weight_kg: updates.weight_kg,
          date: today,
          created_at: new Date().toISOString(),
        });
      }
    }

    this.save();
    return p;
  }

  // --- Meals ---
  getMeals(memberId: string, dateStr?: string): Meal[] {
    return this.data.meals
      .filter(m => m.member_id === memberId && (!dateStr || m.date === dateStr))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getAllMealsHistory(memberId: string, limit = 50): Meal[] {
    return this.data.meals
      .filter(m => m.member_id === memberId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  addMeal(meal: Omit<Meal, 'id' | 'created_at'>): Meal {
    const newMeal: Meal = {
      ...meal,
      id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    this.data.meals.unshift(newMeal);
    this.save();
    return newMeal;
  }

  deleteMeal(id: string, memberId: string): boolean {
    const initialLen = this.data.meals.length;
    this.data.meals = this.data.meals.filter(m => !(m.id === id && m.member_id === memberId));
    const deleted = this.data.meals.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // --- Water Logs ---
  getWaterToday(memberId: string, dateStr: string): number {
    return this.data.water_logs
      .filter(w => w.member_id === memberId && w.date === dateStr)
      .reduce((sum, item) => sum + item.amount_ml, 0);
  }

  addWaterLog(memberId: string, amountMl: number, dateStr: string): number {
    this.data.water_logs.push({
      id: `w-${Date.now()}`,
      member_id: memberId,
      amount_ml: amountMl,
      date: dateStr,
      created_at: new Date().toISOString(),
    });
    this.save();
    return this.getWaterToday(memberId, dateStr);
  }

  // --- Sleep Logs ---
  getSleepToday(memberId: string, dateStr: string): SleepLog | undefined {
    return this.data.sleep_logs
      .filter(s => s.member_id === memberId && s.date === dateStr)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }

  logSleep(memberId: string, hours: number, quality: SleepLog['quality'], dateStr: string): SleepLog {
    const newLog: SleepLog = {
      id: `s-${Date.now()}`,
      member_id: memberId,
      hours,
      quality,
      date: dateStr,
      created_at: new Date().toISOString(),
    };
    this.data.sleep_logs.push(newLog);
    this.save();
    return newLog;
  }

  // --- Weight Logs ---
  getWeightLogs(memberId: string): WeightLog[] {
    return this.data.weight_logs
      .filter(w => w.member_id === memberId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  logWeight(memberId: string, weightKg: number, dateStr: string): WeightLog {
    const newLog: WeightLog = {
      id: `wt-${Date.now()}`,
      member_id: memberId,
      weight_kg: weightKg,
      date: dateStr,
      created_at: new Date().toISOString(),
    };
    this.data.weight_logs.push(newLog);
    // Also update profile weight
    const p = this.getProfile(memberId);
    p.weight_kg = weightKg;
    this.save();
    return newLog;
  }

  // --- Meal Plans ---
  getCurrentMealPlan(memberId: string): MealPlanRecord | undefined {
    return this.data.meal_plans
      .filter(p => p.member_id === memberId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }

  saveMealPlan(memberId: string, plan: { weekly_plan: MealPlanDay[]; summary?: string; medical_disclaimer?: string; grocery_list?: any[] }): MealPlanRecord {
    const record: MealPlanRecord = {
      id: `plan-${Date.now()}`,
      member_id: memberId,
      week_identifier: `Week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      generated_date: new Date().toISOString().split('T')[0],
      weekly_plan: plan.weekly_plan,
      summary: plan.summary,
      medical_disclaimer: plan.medical_disclaimer,
      created_at: new Date().toISOString(),
    };

    // Remove older plans for this member to prevent duplicate stacking
    this.data.meal_plans = this.data.meal_plans.filter(p => p.member_id !== memberId);
    this.data.meal_plans.unshift(record);

    // If grocery items provided in plan, populate grocery items table
    if (Array.isArray(plan.grocery_list) && plan.grocery_list.length > 0) {
      // Clear old grocery items for this member
      this.data.grocery_items = this.data.grocery_items.filter(g => g.member_id !== memberId);
      for (const item of plan.grocery_list) {
        if (typeof item === 'string') {
          this.data.grocery_items.push({
            id: `g-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            member_id: memberId,
            name: item,
            category: 'Produce',
            checked: false,
            created_at: new Date().toISOString(),
          });
        } else if (item && typeof item === 'object') {
          this.data.grocery_items.push({
            id: `g-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            member_id: memberId,
            name: item.name || item.item || 'Item',
            category: item.category || 'Produce',
            checked: false,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    this.save();
    return record;
  }

  deleteMealPlan(memberId: string): boolean {
    const initLen = this.data.meal_plans.length;
    this.data.meal_plans = this.data.meal_plans.filter(p => p.member_id !== memberId);
    if (this.data.meal_plans.length < initLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Grocery Items ---
  getGroceryItems(memberId: string): GroceryItem[] {
    return this.data.grocery_items.filter(g => g.member_id === memberId);
  }

  addGroceryItem(memberId: string, name: string, category: GroceryItem['category']): GroceryItem {
    const item: GroceryItem = {
      id: `g-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      member_id: memberId,
      name: name.trim(),
      category: category || 'Other',
      checked: false,
      created_at: new Date().toISOString(),
    };
    this.data.grocery_items.push(item);
    this.save();
    return item;
  }

  toggleGroceryItem(id: string, memberId: string): GroceryItem | undefined {
    const item = this.data.grocery_items.find(g => g.id === id && g.member_id === memberId);
    if (item) {
      item.checked = !item.checked;
      this.save();
    }
    return item;
  }

  deleteGroceryItem(id: string, memberId: string): boolean {
    const initLen = this.data.grocery_items.length;
    this.data.grocery_items = this.data.grocery_items.filter(g => !(g.id === id && g.member_id === memberId));
    if (this.data.grocery_items.length < initLen) {
      this.save();
      return true;
    }
    return false;
  }

  clearCompletedGroceryItems(memberId: string): number {
    const before = this.data.grocery_items.length;
    this.data.grocery_items = this.data.grocery_items.filter(g => !(g.member_id === memberId && g.checked));
    const cleared = before - this.data.grocery_items.length;
    if (cleared > 0) this.save();
    return cleared;
  }

  // --- Favorites ---
  getFavorites(memberId: string): FavoriteFood[] {
    return this.data.favorites.filter(f => f.member_id === memberId);
  }

  addFavorite(memberId: string, food: Omit<FavoriteFood, 'id' | 'member_id' | 'created_at'>): FavoriteFood {
    // Avoid exact duplicates
    const existing = this.data.favorites.find(
      f => f.member_id === memberId && f.food_name.toLowerCase() === food.food_name.toLowerCase()
    );
    if (existing) return existing;

    const newFav: FavoriteFood = {
      ...food,
      id: `fav-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      member_id: memberId,
      created_at: new Date().toISOString(),
    };
    this.data.favorites.unshift(newFav);
    this.save();
    return newFav;
  }

  removeFavorite(id: string, memberId: string): boolean {
    const initLen = this.data.favorites.length;
    this.data.favorites = this.data.favorites.filter(f => !(f.id === id && f.member_id === memberId));
    if (this.data.favorites.length < initLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Reminders ---
  getReminders(memberId: string): ReminderSetting[] {
    let rems = this.data.reminders.filter(r => r.member_id === memberId);
    if (rems.length === 0) {
      // Seed default reminders
      rems = [
        { id: `r-1-${memberId}`, member_id: memberId, type: 'water', label: 'Hydration Drink Reminder', time: '10:00', enabled: true },
        { id: `r-2-${memberId}`, member_id: memberId, type: 'meal', label: 'Lunch Nutrition Reminder', time: '13:00', enabled: true },
        { id: `r-3-${memberId}`, member_id: memberId, type: 'sleep', label: 'Wind-Down & Sleep Log', time: '22:30', enabled: false },
        { id: `r-4-${memberId}`, member_id: memberId, type: 'plan', label: 'Weekly Meal Plan Review', time: '18:00', enabled: true },
      ];
      this.data.reminders.push(...rems);
      this.save();
    }
    return rems;
  }

  updateReminders(memberId: string, reminders: ReminderSetting[]): ReminderSetting[] {
    this.data.reminders = this.data.reminders.filter(r => r.member_id !== memberId);
    this.data.reminders.push(...reminders.map(r => ({ ...r, member_id: memberId })));
    this.save();
    return this.getReminders(memberId);
  }
}

export const db = new PNMPDatabase();
