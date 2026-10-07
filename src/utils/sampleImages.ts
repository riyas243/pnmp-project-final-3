/**
 * Provides realistic rendered food images as real File/Blob objects
 * for rapid testing of JPG, PNG, and WEBP uploads.
 */

export interface SampleDish {
  id: string;
  name: string;
  category: string;
  format: 'jpg' | 'png' | 'webp';
  mimeType: string;
  description: string;
  render: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export const SAMPLE_DISHES: SampleDish[] = [
  {
    id: 'grilled-chicken-salad',
    name: 'Mediterranean Grilled Chicken Salad',
    category: 'High Protein Lunch',
    format: 'jpg',
    mimeType: 'image/jpeg',
    description: 'Fresh grilled chicken breast sliced over mixed greens, cherry tomatoes, cucumbers, kalamata olives, and feta.',
    render: (ctx, w, h) => {
      // Background bowl
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);
      
      // Wooden table
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#c79d6e');
      grad.addColorStop(1, '#a67c4d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Ceramic Bowl
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner bowl
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.38, 0, Math.PI * 2);
      ctx.fillStyle = '#f1f5f9';
      ctx.fill();

      // Salad greens
      const greenColors = ['#15803d', '#16a34a', '#22c55e', '#4ade80'];
      for (let i = 0; i < 45; i++) {
        ctx.beginPath();
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (w * 0.3);
        const x = w / 2 + Math.cos(angle) * dist;
        const y = h / 2 + Math.sin(angle) * dist;
        ctx.arc(x, y, 14 + Math.random() * 18, 0, Math.PI * 2);
        ctx.fillStyle = greenColors[Math.floor(Math.random() * greenColors.length)];
        ctx.fill();
      }

      // Cherry tomatoes (red)
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8 + 0.3;
        const dist = w * 0.22;
        ctx.beginPath();
        ctx.arc(w / 2 + Math.cos(angle) * dist, h / 2 + Math.sin(angle) * dist, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
      }

      // Grilled Chicken Strips
      ctx.fillStyle = '#d97706';
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.translate(w / 2 - 40 + i * 20, h / 2 - 20);
        ctx.rotate(-0.35);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-15, -45, 24, 90);
        // Grill marks
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-15, -30, 24, 4);
        ctx.fillRect(-15, -10, 24, 4);
        ctx.fillRect(-15, 10, 24, 4);
        ctx.fillRect(-15, 30, 24, 4);
        ctx.restore();
      }

      // Label on image
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Grilled Chicken Salad (150g Chicken, Greens, Olive Oil)', w / 2, h - 25);
    },
  },
  {
    id: 'avocado-egg-toast',
    name: 'Artisan Avocado Toast & Egg',
    category: 'Balanced Breakfast',
    format: 'png',
    mimeType: 'image/png',
    description: 'Sourdough toast layered with smashed Haas avocado, poached egg, chili flakes, and microgreens.',
    render: (ctx, w, h) => {
      // Marble counter
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(w * 0.2, h * 0.3, 140, 0, Math.PI * 2);
      ctx.fill();

      // Slate Plate
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(w * 0.1, h * 0.12, w * 0.8, h * 0.72, 28);
      ctx.fill();

      // Toast Slice
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.roundRect(w * 0.22, h * 0.22, w * 0.56, h * 0.52, 16);
      ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.roundRect(w * 0.25, h * 0.25, w * 0.5, h * 0.46, 12);
      ctx.fill();

      // Smashed Avocado
      ctx.fillStyle = '#4d7c0f';
      ctx.beginPath();
      ctx.roundRect(w * 0.27, h * 0.27, w * 0.46, h * 0.42, 10);
      ctx.fill();

      // Avocado Texture
      ctx.fillStyle = '#65a30d';
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.arc(w * 0.3 + Math.random() * (w * 0.4), h * 0.3 + Math.random() * (h * 0.35), 10 + Math.random() * 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Poached Egg White
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.48, 55, 45, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Runny Egg Yolk
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(w * 0.51, h * 0.47, 24, 0, Math.PI * 2);
      ctx.fill();

      // Chili flakes
      ctx.fillStyle = '#dc2626';
      for (let i = 0; i < 15; i++) {
        ctx.fillRect(w * 0.35 + Math.random() * (w * 0.3), h * 0.35 + Math.random() * (h * 0.25), 4, 4);
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Avocado Toast with Poached Egg', w / 2, h - 25);
    },
  },
  {
    id: 'berry-oatmeal-bowl',
    name: 'Steel-Cut Oatmeal with Berries',
    category: 'High Fiber Breakfast',
    format: 'webp',
    mimeType: 'image/webp',
    description: 'Warm steel-cut oats topped with blueberries, strawberries, chia seeds, and almond milk.',
    render: (ctx, w, h) => {
      // Warm rustic surface
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(0, 0, w, h);

      // Ceramic bowl
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.38, 0, Math.PI * 2);
      ctx.fill();

      // Oatmeal base
      ctx.fillStyle = '#d6d3d1';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.33, 0, Math.PI * 2);
      ctx.fill();

      // Oatmeal texture
      ctx.fillStyle = '#e7e5e4';
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (w * 0.28);
        ctx.arc(w / 2 + Math.cos(angle) * dist, h / 2 + Math.sin(angle) * dist, 6 + Math.random() * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Fresh Blueberries
      ctx.fillStyle = '#1e1b4b';
      for (let i = 0; i < 12; i++) {
        const x = w * 0.38 + (i % 4) * 25 + Math.random() * 6;
        const y = h * 0.38 + Math.floor(i / 4) * 22;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();
      }

      // Strawberries
      ctx.fillStyle = '#ef4444';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(w * 0.55 + i * 16, h * 0.48);
        ctx.lineTo(w * 0.65 + i * 16, h * 0.58);
        ctx.lineTo(w * 0.48 + i * 16, h * 0.6);
        ctx.fill();
      }

      // Chia seeds sprinkle
      ctx.fillStyle = '#0f172a';
      for (let i = 0; i < 30; i++) {
        ctx.fillRect(w * 0.3 + Math.random() * (w * 0.4), h * 0.3 + Math.random() * (h * 0.4), 2, 2);
      }

      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Steel-Cut Oatmeal with Fresh Berries', w / 2, h - 25);
    },
  },
  {
    id: 'test-non-food',
    name: 'Office Notebook & Mechanical Wrench (Non-Food Test)',
    category: 'Safety & Negative Testing',
    format: 'jpg',
    mimeType: 'image/jpeg',
    description: 'Test case: An industrial wrench and stationery notebook with zero edible food items.',
    render: (ctx, w, h) => {
      // Metal workbench
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 0, w, h);

      // Blueprint / Notebook
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(w * 0.15, h * 0.15, w * 0.4, h * 0.65);
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      ctx.fillText('TECHNICAL SPEC 2026', w * 0.18, h * 0.25);
      ctx.fillText('PART #882-B', w * 0.18, h * 0.32);
      ctx.fillText('NON-EDIBLE HARDWARE', w * 0.18, h * 0.4);

      // Steel wrench
      ctx.save();
      ctx.translate(w * 0.65, h * 0.45);
      ctx.rotate(0.5);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-15, -120, 30, 240);
      // Wrench head
      ctx.beginPath();
      ctx.arc(0, -120, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(0, -120, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Non-Food Item Test (Mechanical Hardware)', w / 2, h - 25);
    },
  },
];

/**
 * Converts a sample dish to a real File object for testing.
 */
export async function createSampleFile(dish: SampleDish): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  dish.render(ctx, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error('Failed to generate image blob'));
          return;
        }
        const file = new File([blob], `${dish.id}.${dish.format}`, {
          type: dish.mimeType,
          lastModified: Date.now(),
        });
        resolve(file);
      },
      dish.mimeType,
      0.92
    );
  });
}
