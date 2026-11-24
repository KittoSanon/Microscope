import type { SlideDefinition } from '../types/microscope';

function drawCellWalls(ctx: CanvasRenderingContext2D) {
  const cols = 6;
  const rows = 5;
  const cellW = 34;
  const cellH = 26;
  const startX = -(cols * cellW) / 2;
  const startY = -(rows * cellH) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = r * 13 + c * 7;
      const x = startX + c * cellW;
      const y = startY + r * cellH;

      ctx.fillStyle = seed % 2 === 0 ? '#f6d8dc' : '#f1cbd2';
      ctx.fillRect(x, y, cellW, cellH);
      ctx.strokeStyle = '#7c2d3b';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x, y, cellW, cellH);
    }
  }
}

function drawNuclei(ctx: CanvasRenderingContext2D, parity: number) {
  const cols = 6;
  const rows = 5;
  const cellW = 34;
  const cellH = 26;
  const startX = -(cols * cellW) / 2;
  const startY = -(rows * cellH) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = r * 13 + c * 7;
      if (seed % 2 !== parity) continue;

      const cx = startX + c * cellW + cellW / 2;
      const cy = startY + r * cellH + cellH / 2;
      const stage = seed % 4;
      ctx.fillStyle = '#581c87';
      ctx.strokeStyle = '#581c87';

      if (stage === 0 || stage === 1) {
        ctx.beginPath();
        ctx.arc(cx, cy, stage === 0 ? 6.5 : 7.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (stage === 2) {
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 6);
        ctx.lineTo(cx, cy + 6);
        ctx.stroke();
      } else {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy - 5);
        ctx.lineTo(cx - 5, cy + 5);
        ctx.moveTo(cx + 5, cy - 5);
        ctx.lineTo(cx + 5, cy + 5);
        ctx.stroke();
      }
    }
  }
}

export const onionRootTipSlide: SlideDefinition = {
  id: 'onion-root-tip',
  name: 'Onion Root Tip (Mitosis)',
  shortTitle: 'Onion Root Tip',
  subtitle: 'Mitosis Stages',
  badgeColor: '#f43f5e',
  category: 'Botany',
  stain: 'Acetocarmine',
  description:
    'Layered meristem tissue showing cell walls and nuclei at different depths. Use fine focus to move between the two nucleus planes.',
  focalPlane: 50,
  requiresOilAt100x: false,
  labels: [
    { id: 'cell-wall', text: 'Cell Wall', x: -55, y: -35, minMag: 100 },
    { id: 'interphase', text: 'Interphase Nucleus', x: 0, y: 0, minMag: 400 },
    { id: 'anaphase', text: 'Anaphase Chromatids', x: 52, y: 28, minMag: 400 },
  ],
  depthLayers: [
    { focusOffset: -3.5, render: (ctx) => drawNuclei(ctx, 0) },
    { focusOffset: 3.5, render: (ctx) => drawNuclei(ctx, 1) },
  ],
  render: (ctx) => drawCellWalls(ctx),
};