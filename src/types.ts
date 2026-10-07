export interface FoodScanData {
  food_name: string;
  confidence: number;
  serving_size: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  ingredients: string[];
  health_notes: string;
  warnings: string;
}

export interface LoggedMealItem extends FoodScanData {
  id: string;
  member_id?: string;
  loggedAt?: string;
  date?: string;
  mealType: 'Breakfast' | 'Morning Snack' | 'Lunch' | 'Evening Snack' | 'Dinner' | 'Snack';
  imageUrl?: string;
}

export type AIStatusType =
  | 'AI Ready'
  | 'AI Configuration Missing'
  | 'AI Service Temporarily Unavailable'
  | 'Analyzing Image'
  | 'Recognition Successful'
  | 'Recognition Failed';

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
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
  updated_at?: string;
}

export interface NutritionPlan {
  bmi: number;
  bmi_category: string;
  bmi_color: string;
  bmi_advice: string;
  bmr: number;
  tdee: number;
  target_calories: number;
  goal: string;
  goal_note: string;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_target_ml: number;
  sleep_target_hours: number;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  is_primary: boolean;
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
  category: string;
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

export interface WeightLog {
  id: string;
  member_id: string;
  weight_kg: number;
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

export interface ProgressData {
  labels: string[];
  calories: number[];
  protein: number[];
  carbohydrates: number[];
  fat: number[];
  water: number[];
  sleep: number[];
  weight: Array<number | null>;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  language?: 'en' | 'ta' | 'hi';
  theme?: 'light' | 'dark';
}
