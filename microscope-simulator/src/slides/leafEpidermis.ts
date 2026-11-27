import type { SlideDefinition } from '../types/microscope';

function drawPavementCells(ctx: CanvasRenderingContext2D) {
  const cols = 5;
  const rows = 5;
  const w = 48;
  const h = 38;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c - cols / 2) * w;
      const y = (r - rows / 2) * h;
      ctx.strokeStyle = '#3f6212';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    }
  }
}

function drawStoma(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = '#16a34a';
  ctx.strokeStyle = '#14532d';
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  ctx.ellipse(0, -8, 17, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, 8, 17, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fef9c3';
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const leafEpidermisSlide: SlideDefinition = {
  id: 'leaf-epidermis',
  name: 'Leaf Epidermis (Stomata)',
  shortTitle: 'Leaf Epidermis',
  subtitle: 'Guard Cells & Stomata',
  badgeColor: '#84cc16',
  category: 'Botany',
  stain: 'Toluidine Blue / Natural',
  description:
    'Pavement cells and the stomatal guard-cell layer occupy different depths. Use fine focus to inspect each plane.',
  focalPlane: 77,
  requiresOilAt100x: false,
  labels: [
    { id: 'stoma', text: 'Stomatal Pore', x: 0, y: 0, minMag: 100 },
    { id: 'guard', text: 'Guard Cells', x: 0, y: -14, minMag: 100 },
    { id: 'epidermis', text: 'Epidermal Cell', x: -65, y: -40, minMag: 100 },
  ],
  depthLayers: [
    { focusOffset: -3.5, render: (ctx) => drawPavementCells(ctx) },
    { focusOffset: 3.5, render: (ctx) => drawStoma(ctx) },
  ],
  render(ctx) {
    ctx.fillStyle = '#ecfccb';
    ctx.fillRect(-260, -260, 520, 520);
  },
};