/**
 * PNMP - Personalized Nutrition & Meal Planner
 * Client-side Controller & Dynamic Interactions
 */

// Global State
let currentScannedFood = null;

// =========================================================================
// Toast Notification Utility
// =========================================================================
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(container);
  }

  const toastId = 'toast-' + Date.now();
  const bgClass = type === 'success' ? 'bg-success text-white' :
                  type === 'warning' ? 'bg-warning text-dark' :
                  type === 'danger' ? 'bg-danger text-white' : 'bg-primary text-white';

  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body fw-semibold py-3 px-3">
          <i class="bi ${type === 'success' ? 'bi-check-circle-fill' : type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'} me-2"></i>
          ${message}
        </div>
        <button type="button" class="btn-close ${type === 'warning' ? '' : 'btn-close-white'} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', toastHtml);

  const toastEl = document.getElementById(toastId);
  const bsToast = new bootstrap.Toast(toastEl, { delay: 4500 });
  bsToast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// =========================================================================
// Family Member Switcher
// =========================================================================
async function switchFamilyMember(memberId) {
  try {
    const res = await fetch('/api/switch-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId })
    });
    const data = await res.json();
    if (data.success) {
      window.location.reload();
    } else {
      showToast(data.error || 'Failed to switch profile', 'danger');
    }
  } catch (err) {
    showToast('Network error switching profile.', 'danger');
  }
}

// =========================================================================
// Water Tracking
// =========================================================================
async function logWater(amountMl) {
  try {
    const res = await fetch('/api/water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount_ml: amountMl })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`+${amountMl} ml water logged! Total: ${data.total_water} ml`, 'success');
      // Update DOM if on dashboard
      const waterDisplay = document.getElementById('waterCurrentDisplay');
      if (waterDisplay) {
        waterDisplay.innerText = `${data.total_water} ml`;
      }
      const waterBar = document.getElementById('waterProgressBar');
      const waterTarget = parseInt(waterBar?.dataset?.target || '2500', 10);
      if (waterBar && waterTarget > 0) {
        const pct = Math.min(100, Math.round((data.total_water / waterTarget) * 100));
        waterBar.style.width = pct + '%';
        waterBar.innerText = pct + '%';
      }
    } else {
      showToast(data.error || 'Could not log water.', 'danger');
    }
  } catch (err) {
    showToast('Failed to record water intake.', 'danger');
  }
}

// Custom water input submit
function logCustomWater() {
  const input = document.getElementById('customWaterInput');
  const amount = parseInt(input?.value || '0', 10);
  if (amount > 0) {
    logWater(amount);
    if (input) input.value = '';
    const modalEl = document.getElementById('waterModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }
  } else {
    showToast('Please enter a valid amount in ml.', 'warning');
  }
}

// =========================================================================
// Sleep Tracking
// =========================================================================
async function logSleep(hours, quality = 'Good') {
  try {
    const res = await fetch('/api/sleep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours: hours, quality: quality })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`${hours} hours sleep logged!`, 'success');
      const sleepDisplay = document.getElementById('sleepCurrentDisplay');
      if (sleepDisplay) sleepDisplay.innerText = `${hours} hrs`;
      const sleepModal = document.getElementById('sleepModal');
      if (sleepModal) {
        const modal = bootstrap.Modal.getInstance(sleepModal);
        if (modal) modal.hide();
      }
    } else {
      showToast(data.error || 'Could not log sleep.', 'danger');
    }
  } catch (err) {
    showToast('Failed to record sleep hours.', 'danger');
  }
}

// =========================================================================
// Meal Removal
// =========================================================================
async function deleteMeal(mealId) {
  if (!confirm('Are you sure you want to remove this logged meal?')) return;
  try {
    const res = await fetch(`/api/meal/${mealId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Meal removed from today’s log.', 'info');
      const row = document.getElementById(`meal-row-${mealId}`);
      if (row) row.remove();
      setTimeout(() => window.location.reload(), 600);
    } else {
      showToast(data.error || 'Failed to remove meal.', 'danger');
    }
  } catch (err) {
    showToast('Error removing meal.', 'danger');
  }
}

// =========================================================================
// Food Scan System (Gemini Multimodal)
// =========================================================================
function initFoodScan() {
  const dropzone = document.getElementById('scanDropzone');
  const fileInput = document.getElementById('foodImageInput');
  const previewContainer = document.getElementById('previewContainer');
  const previewImg = document.getElementById('previewImg');
  const scanBtn = document.getElementById('scanFoodBtn');
  const loadingArea = document.getElementById('scanLoadingArea');
  const resultCard = document.getElementById('scanResultCard');
  const scanAnotherBtn = document.getElementById('scanAnotherBtn');
  const logMealBtn = document.getElementById('logScannedMealBtn');

  if (!dropzone || !fileInput) return;

  let selectedFile = null;

  // Click to open file dialog
  dropzone.addEventListener('click', () => fileInput.click());

  // Drag and drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      handleFileSelected(fileInput.files[0]);
    }
  });

  function handleFileSelected(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      showToast('Please upload a valid food image (JPG, PNG, WEBP).', 'warning');
      return;
    }

    if (file.size > 16 * 1024 * 1024) {
      showToast('Image size is too large. Please select an image under 16MB.', 'warning');
      return;
    }

    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewContainer.classList.remove('d-none');
      dropzone.classList.add('d-none');
      scanBtn.disabled = false;
      resultCard.classList.add('d-none');
    };
    reader.readAsDataURL(file);
  }

  // Scan Button Event
  scanBtn.addEventListener('click', async () => {
    if (!selectedFile) {
      showToast('Please select an image first.', 'warning');
      return;
    }

    // Lock UI & show loader
    scanBtn.disabled = true;
    loadingArea.classList.remove('d-none');
    resultCard.classList.add('d-none');

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('/api/food-scan', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      loadingArea.classList.add('d-none');
      scanBtn.disabled = false;

      if (!response.ok || !data.success) {
        showToast(data.error || 'AI food recognition failed. Please try again.', 'danger');
        return;
      }

      // Display Structured Results
      renderScanResult(data.data);
      showToast('Food recognized successfully!', 'success');

    } catch (err) {
      loadingArea.classList.add('d-none');
      scanBtn.disabled = false;
      showToast('Network error while analyzing image. Please try again.', 'danger');
    }
  });

  function renderScanResult(food) {
    currentScannedFood = food;
    document.getElementById('resFoodName').innerText = food.food_name;
    document.getElementById('resConfidence').innerText = `${food.confidence}% confidence`;
    document.getElementById('resServingSize').innerText = food.serving_size;
    document.getElementById('resCalories').innerText = food.calories;
    document.getElementById('resProtein').innerText = `${food.protein} g`;
    document.getElementById('resCarbs').innerText = `${food.carbohydrates} g`;
    document.getElementById('resFat').innerText = `${food.fat} g`;
    document.getElementById('resFiber').innerText = `${food.fiber} g`;
    document.getElementById('resSugar').innerText = `${food.sugar} g`;

    // Ingredients
    const ingrList = document.getElementById('resIngredientsList');
    ingrList.innerHTML = '';
    if (food.ingredients && food.ingredients.length > 0) {
      food.ingredients.forEach(item => {
        const span = document.createElement('span');
        span.className = 'badge bg-light text-dark border me-1 mb-1 p-2';
        span.innerText = item;
        ingrList.appendChild(span);
      });
    } else {
      ingrList.innerHTML = '<span class="text-muted small">No specific ingredients listed</span>';
    }

    // Health Notes & Warnings
    document.getElementById('resHealthNotes').innerText = food.health_notes || 'Healthy dietary choice.';
    const warnEl = document.getElementById('resWarnings');
    if (food.warnings) {
      warnEl.innerText = food.warnings;
      warnEl.parentElement.classList.remove('d-none');
    } else {
      warnEl.parentElement.classList.add('d-none');
    }

    resultCard.classList.remove('d-none');
    resultCard.scrollIntoView({ behavior: 'smooth' });
  }

  // Scan Another Reset
  if (scanAnotherBtn) {
    scanAnotherBtn.addEventListener('click', () => {
      selectedFile = null;
      fileInput.value = '';
      previewImg.src = '';
      previewContainer.classList.add('d-none');
      resultCard.classList.add('d-none');
      dropzone.classList.remove('d-none');
      scanBtn.disabled = true;
    });
  }

  // Log Meal from scan
  if (logMealBtn) {
    logMealBtn.addEventListener('click', async () => {
      if (!currentScannedFood) return;
      const mealTypeSelect = document.getElementById('scanMealTypeSelect');
      const mealType = mealTypeSelect ? mealTypeSelect.value : 'Lunch';

      try {
        logMealBtn.disabled = true;
        logMealBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Logging...';

        const payload = {
          food_name: currentScannedFood.food_name,
          serving_size: currentScannedFood.serving_size,
          calories: currentScannedFood.calories,
          protein: currentScannedFood.protein,
          carbohydrates: currentScannedFood.carbohydrates,
          fat: currentScannedFood.fat,
          fiber: currentScannedFood.fiber,
          sugar: currentScannedFood.sugar,
          confidence: currentScannedFood.confidence,
          meal_type: mealType
        };

        const res = await fetch('/api/log-meal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        logMealBtn.disabled = false;
        logMealBtn.innerHTML = '<i class="bi bi-bookmark-check-fill me-1"></i> Logged to Diary!';

        if (data.success) {
          showToast(data.message || 'Meal logged successfully!', 'success');
          setTimeout(() => {
            window.location.href = '/today';
          }, 900);
        } else {
          showToast(data.error || 'Failed to log meal.', 'danger');
        }
      } catch (err) {
        logMealBtn.disabled = false;
        logMealBtn.innerHTML = '<i class="bi bi-bookmark-plus me-1"></i> Log This Meal';
        showToast('Error recording meal.', 'danger');
      }
    });
  }
}

// =========================================================================
// AI 7-Day Meal Plan Generator
// =========================================================================
async function triggerGenerateMealPlan() {
  const btn = document.getElementById('genPlanBtn');
  const loader = document.getElementById('planLoadingArea');
  const content = document.getElementById('planContentArea');

  if (btn) btn.disabled = true;
  if (loader) loader.classList.remove('d-none');

  try {
    const res = await fetch('/api/generate-meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();

    if (btn) btn.disabled = false;
    if (loader) loader.classList.add('d-none');

    if (data.success) {
      showToast('AI 7-Day Meal Plan generated successfully!', 'success');
      window.location.reload();
    } else {
      showToast(data.error || 'Failed to generate meal plan. Please check Gemini API configuration.', 'danger');
    }
  } catch (err) {
    if (btn) btn.disabled = false;
    if (loader) loader.classList.add('d-none');
    showToast('Network error while generating plan. Please try again.', 'danger');
  }
}

// Log meal directly from Weekly Meal Plan
async function logPlanMeal(foodName, mealType, calories, protein, carbs, fat, servingSize) {
  try {
    const payload = {
      food_name: foodName,
      meal_type: mealType || 'Lunch',
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbohydrates: Number(carbs) || 0,
      fat: Number(fat) || 0,
      serving_size: servingSize || '1 serving',
      confidence: 95
    };

    const res = await fetch('/api/log-meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      showToast(`Logged "${foodName}" to Today's Diary!`, 'success');
      setTimeout(() => {
        window.location.href = '/today';
      }, 700);
    } else {
      showToast(data.error || 'Failed to log meal.', 'danger');
    }
  } catch (err) {
    showToast('Network error while logging meal.', 'danger');
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initFoodScan();
});
