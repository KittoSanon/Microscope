import type { SlideDefinition } from '../types/microscope';

function drawRedBloodCells(ctx: CanvasRenderingContext2D) {
  for (let i = 0; i < 68; i++) {
    const angle = i * 2.39996;
    const dist = Math.sqrt(i / 68) * 185;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    const r = 9.5 + (i % 3) * 0.7;

    ctx.fillStyle = '#e15b76';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8c3cf';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.48, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWhiteBloodCellsAndPlatelets(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.translate(35, -15);
  ctx.fillStyle = '#f3e8ff';
  ctx.beginPath();
  ctx.arc(0, 0, 14.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4c1d95';
  const lobes = [
    [-5, -3, 5.2],
    [4, -4, 4.8],
    [2, 5, 5.0],
  ];
  for (const [lx, ly, lr] of lobes) {
    ctx.beginPath();
    ctx.arc(lx, ly, lr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = '#6d28d9';
  for (let p = 0; p < 10; p++) {
    const px = -10 + Math.cos(p * 1.7) * 18;
    const py = 42 + Math.sin(p * 2.1) * 14;
    ctx.beginPath();
    ctx.ellipse(px, py, 3.2, 2.0, p * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const humanBloodSmearSlide: SlideDefinition = {
  id: 'human-blood-smear',
  name: 'Human Blood Smear',
  shortTitle: 'Human Blood',
  subtitle: 'RBCs, WBCs & Platelets',
  badgeColor: '#ef4444',
  category: 'Hematology',
  stain: 'Wright–Giemsa',
  description:
    'Red blood cells and platelets sit at slightly different depths from the white-cell layer. Use fine focus to inspect each plane.',
  focalPlane: 44,
  requiresOilAt100x: true,
  labels: [
    { id: 'rbc', text: 'Erythrocyte (RBC)', x: -45, y: -20, minMag: 100 },
    { id: 'neutrophil', text: 'Neutrophil (PMN)', x: 35, y: -15, minMag: 400 },
    { id: 'platelet', text: 'Platelets', x: -10, y: 42, minMag: 400 },
  ],
  depthLayers: [
    { focusOffset: -3.5, render: (ctx) => drawRedBloodCells(ctx) },
    {
      focusOffset: 3.5,
      render: (ctx) => drawWhiteBloodCellsAndPlatelets(ctx),
    },
  ],
  render(ctx) {
    ctx.fillStyle = '#fdeef2';
    ctx.fillRect(-260, -260, 520, 520);
  },
};