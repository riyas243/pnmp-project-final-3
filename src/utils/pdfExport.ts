import jsPDF from 'jspdf';
import { MealPlanRecord, UserProfile, NutritionPlan, GroceryItem, ProgressData } from '../types.ts';

export function exportMealPlanPdf(
  plan: MealPlanRecord,
  memberName: string,
  profile: UserProfile,
  targets: NutritionPlan,
  groceryItems: GroceryItem[]
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header Banner
  doc.setFillColor(16, 185, 129); // Emerald-500
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PNMP Personalized 7-Day Meal Plan', 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Member: ${memberName} | Goal: ${profile.fitness_goal} | Target: ${targets.target_calories} kcal/day | Diet: ${profile.dietary_preference}`,
    14,
    21
  );

  y = 36;
  doc.setTextColor(30, 41, 59);

  // Summary
  if (plan.summary) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Plan Summary & Dietitian Guidance:', 14, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const splitSummary = doc.splitTextToSize(plan.summary, pageWidth - 28);
    doc.text(splitSummary, 14, y);
    y += splitSummary.length * 4.5 + 4;
  }

  // Iterate days
  for (const day of plan.weekly_plan) {
    if (y > 250) {
      doc.addPage();
      y = 18;
    }

    // Day Header
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 4, pageWidth - 28, 8, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(
      `${day.day} Schedule — Daily Total: ${day.daily_total.calories} kcal (P: ${day.daily_total.protein}g | C: ${day.daily_total.carbohydrates}g | F: ${day.daily_total.fat}g)`,
      16,
      y + 1.5
    );
    y += 8;

    // Meals Table / Rows
    doc.setFontSize(8.5);
    for (const meal of day.meals) {
      if (y > 270) {
        doc.addPage();
        y = 18;
      }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text(`[${meal.meal_type}]`, 16, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(`${meal.food_name} (${meal.serving_size})`, 48, y);

      const macroStr = `${meal.calories} kcal  |  P: ${meal.protein}g  C: ${meal.carbohydrates}g  F: ${meal.fat}g`;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(macroStr, pageWidth - 14, y, { align: 'right' });

      y += 5;
    }
    y += 4;
  }

  // Grocery List Page
  doc.addPage();
  y = 20;

  doc.setFillColor(16, 185, 129);
  doc.rect(14, y - 6, pageWidth - 28, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Weekly Grocery Shopping List', 18, y);
  y += 10;

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const itemsToPrint = groceryItems.length > 0 ? groceryItems : (plan as any).grocery_list || [];

  if (itemsToPrint.length === 0) {
    doc.text('No grocery items listed.', 16, y);
  } else {
    let col = 16;
    for (const item of itemsToPrint) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const name = typeof item === 'string' ? item : item.name || item.item || 'Item';
      const cat = typeof item === 'object' && item.category ? ` [${item.category}]` : '';
      const checkedBox = typeof item === 'object' && item.checked ? '[x]' : '[ ]';

      doc.text(`${checkedBox} ${name}${cat}`, col, y);
      y += 6;
    }
  }

  // Disclaimer
  if (plan.medical_disclaimer) {
    y += 8;
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    const splitDisc = doc.splitTextToSize(`Disclaimer: ${plan.medical_disclaimer}`, pageWidth - 28);
    doc.text(splitDisc, 14, y);
  }

  doc.save(`PNMP_Meal_Plan_${memberName.replace(/\s+/g, '_')}.pdf`);
}

export function exportNutritionReportPdf(
  memberName: string,
  profile: UserProfile,
  targets: NutritionPlan,
  progress: ProgressData
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PNMP Comprehensive Health & Nutrition Report', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Patient/Member: ${memberName} | Date: ${new Date().toLocaleDateString()} | PNMP Diagnostic Engine`,
    14,
    22
  );

  y = 40;
  doc.setTextColor(15, 23, 42);

  // Section 1: Biometrics & Metabolic Targets
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Biometric Assessment & Metabolic Targets', 14, y);
  y += 6;

  doc.setFillColor(248, 250, 252);
  doc.rect(14, y - 2, pageWidth - 28, 38, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const col1 = 18;
  const col2 = 80;
  const col3 = 140;

  doc.text(`Age: ${profile.age} yrs`, col1, y + 4);
  doc.text(`Gender: ${profile.gender}`, col1, y + 10);
  doc.text(`Height: ${profile.height_cm} cm`, col1, y + 16);
  doc.text(`Weight: ${profile.weight_kg} kg`, col1, y + 22);
  doc.text(`Target Weight: ${profile.target_weight_kg || profile.weight_kg} kg`, col1, y + 28);

  doc.text(`BMI: ${targets.bmi} (${targets.bmi_category})`, col2, y + 4);
  doc.text(`BMR: ${targets.bmr} kcal/day`, col2, y + 10);
  doc.text(`TDEE: ${targets.tdee} kcal/day`, col2, y + 16);
  doc.text(`Activity: ${profile.activity_level}`, col2, y + 22);
  doc.text(`Fitness Goal: ${profile.fitness_goal}`, col2, y + 28);

  doc.text(`Daily Calorie Target: ${targets.target_calories} kcal`, col3, y + 4);
  doc.text(`Protein Target: ${targets.protein_g} g`, col3, y + 10);
  doc.text(`Carbs Target: ${targets.carbs_g} g`, col3, y + 16);
  doc.text(`Fat Target: ${targets.fat_g} g`, col3, y + 22);
  doc.text(`Hydration Goal: ${targets.water_target_ml} ml`, col3, y + 28);

  y += 44;

  // Section 2: Clinical Constraints
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. Dietary Preferences & Health Considerations', 14, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dietary Style: ${profile.dietary_preference}`, 18, y);
  y += 5;
  doc.text(`Allergies & Intolerances: ${profile.allergies || 'None reported'}`, 18, y);
  y += 5;
  doc.text(`Medical Conditions: ${profile.medical_conditions || 'None reported'}`, 18, y);
  y += 5;
  doc.text(`Dietitian Goal Strategy: ${targets.goal_note}`, 18, y);
  y += 10;

  // Section 3: 14-Day Nutritional Trend Summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Recent 14-Day Intake & Lifestyle Log', 14, y);
  y += 6;

  // Table Header
  doc.setFillColor(226, 232, 240);
  doc.rect(14, y - 2, pageWidth - 28, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Date', 16, y + 3);
  doc.text('Calories (kcal)', 45, y + 3);
  doc.text('Protein (g)', 85, y + 3);
  doc.text('Carbs (g)', 115, y + 3);
  doc.text('Fat (g)', 145, y + 3);
  doc.text('Water (ml)', 175, y + 3);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const sampleDays = Math.min(14, progress.labels.length);
  for (let i = 0; i < sampleDays; i++) {
    if (y > 270) {
      doc.addPage();
      y = 18;
    }
    const isAlt = i % 2 === 1;
    if (isAlt) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 3, pageWidth - 28, 5.5, 'F');
    }
    doc.text(progress.labels[i] || '', 16, y);
    doc.text(String(progress.calories[i] || 0), 45, y);
    doc.text(String(progress.protein[i] || 0), 85, y);
    doc.text(String(progress.carbohydrates[i] || 0), 115, y);
    doc.text(String(progress.fat[i] || 0), 145, y);
    doc.text(String(progress.water[i] || 0), 175, y);
    y += 5.5;
  }

  // Footer / Disclaimer
  y += 8;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This report is generated automatically by PNMP Health Engine for personal nutrition optimization. Not a formal medical prescription.',
    14,
    y
  );

  doc.save(`PNMP_Nutrition_Report_${memberName.replace(/\s+/g, '_')}.pdf`);
}
