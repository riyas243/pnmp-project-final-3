/**
 * PNMP Scientific Nutrition Calculation Engine (Node / Server)
 * - BMI & WHO weight classification
 * - Mifflin-St Jeor BMR equation
 * - TDEE with activity multipliers
 * - Personalized caloric target & macronutrient distribution
 * - Hydration & sleep requirements
 */

export interface BmiResult {
  bmi: number;
  category: 'Underweight' | 'Normal Weight' | 'Overweight' | 'Obese' | 'N/A';
  color: 'info' | 'success' | 'warning' | 'danger' | 'secondary';
  advice: string;
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

export function calculateBmi(weightKg: number, heightCm: number): BmiResult {
  if (heightCm <= 0 || weightKg <= 0) {
    return { bmi: 0, category: 'N/A', color: 'secondary', advice: 'Invalid measurements' };
  }

  const heightM = heightCm / 100.0;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

  if (bmi < 18.5) {
    return {
      bmi,
      category: 'Underweight',
      color: 'info',
      advice: 'A moderate caloric surplus with nutrient-dense foods is recommended for healthy mass gain.',
    };
  } else if (bmi <= 24.9) {
    return {
      bmi,
      category: 'Normal Weight',
      color: 'success',
      advice: 'Healthy weight range. Maintain balanced macronutrients and active physical lifestyle.',
    };
  } else if (bmi <= 29.9) {
    return {
      bmi,
      category: 'Overweight',
      color: 'warning',
      advice: 'A moderate caloric deficit and structured daily exercise are recommended.',
    };
  } else {
    return {
      bmi,
      category: 'Obese',
      color: 'danger',
      advice: 'Consult a certified healthcare provider or registered dietitian for personalized guidance.',
    };
  }
}

export function calculateBmr(weightKg: number, heightCm: number, age: number, gender: string): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 0;

  const g = (gender || 'male').trim().toLowerCase();
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;

  const bmr = g === 'female' || g === 'f' ? base - 161 : base + 5;
  return Math.round(Math.max(500, bmr) * 10) / 10;
}

export function calculateTdee(bmr: number, activityLevel: string): number {
  const multipliers: Record<string, number> = {
    Sedentary: 1.2,
    'Lightly Active': 1.375,
    'Moderately Active': 1.55,
    'Very Active': 1.725,
    'Extra Active': 1.9,
  };
  const mult = multipliers[activityLevel] || 1.375;
  return Math.round(bmr * mult * 10) / 10;
}

export function calculateNutritionPlan(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string,
  activityLevel: string = 'Moderately Active',
  fitnessGoal: string = 'Weight Maintenance'
): NutritionPlan {
  const bmiInfo = calculateBmi(weightKg, heightCm);
  const bmr = calculateBmr(weightKg, heightCm, age, gender);
  const tdee = calculateTdee(bmr, activityLevel);

  const g = (gender || 'male').toLowerCase();
  const minSafe = g === 'female' || g === 'f' ? 1200 : 1500;
  const goal = (fitnessGoal || 'Weight Maintenance').trim();

  let targetCalories = Math.round(tdee);
  let proteinRatio = 0.25;
  let carbsRatio = 0.50;
  let fatRatio = 0.25;
  let goalNote = 'Maintaining current weight and optimizing body composition and vital energy.';

  if (goal === 'Weight Loss') {
    targetCalories = Math.max(minSafe, Math.round(tdee - 500));
    proteinRatio = 0.30;
    carbsRatio = 0.45;
    fatRatio = 0.25;
    goalNote = 'Targeting ~0.5 kg safe fat loss per week through a balanced 500 kcal deficit.';
  } else if (goal === 'Weight Gain') {
    targetCalories = Math.round(tdee + 400);
    proteinRatio = 0.25;
    carbsRatio = 0.55;
    fatRatio = 0.20;
    goalNote = 'Targeting lean muscle growth with a progressive 400 kcal surplus.';
  }

  const proteinG = Math.round(((targetCalories * proteinRatio) / 4.0) * 10) / 10;
  const carbsG = Math.round(((targetCalories * carbsRatio) / 4.0) * 10) / 10;
  const fatG = Math.round(((targetCalories * fatRatio) / 9.0) * 10) / 10;
  const waterTargetMl = Math.round(Math.max(1500, Math.min(4500, weightKg * 35)));

  return {
    bmi: bmiInfo.bmi,
    bmi_category: bmiInfo.category,
    bmi_color: bmiInfo.color,
    bmi_advice: bmiInfo.advice,
    bmr,
    tdee,
    target_calories: targetCalories,
    goal,
    goal_note: goalNote,
    protein_g: proteinG,
    carbs_g: carbsG,
    fat_g: fatG,
    water_target_ml: waterTargetMl,
    sleep_target_hours: 8.0,
  };
}
