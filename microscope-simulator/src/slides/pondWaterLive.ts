import type { SlideDefinition } from '../types/microscope';

function drawSpirogyraAndDiatoms(
  ctx: CanvasRenderingContext2D,
  timeMs: number
) {
  const t = timeMs * 0.001;

  ctx.save();
  ctx.translate(-55, 30);
  ctx.rotate(-0.35);
  ctx.strokeStyle = '#3f6212';
  ctx.lineWidth = 2;
  ctx.strokeRect(-75, -11, 150, 22);

  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (let x = -70; x <= 70; x += 4) {
    const y = Math.sin(x * 0.14 + t * 0.4) * 7.5;
    if (x === -70) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#a16207';
  const diatoms = [
    [62, -45, 0.5],
    [-75, -55, -0.7],
    [78, 42, 1.1],
  ];
  for (const [dx, dy, rot] of diatoms) {
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawParamecium(ctx: CanvasRenderingContext2D, timeMs: number) {
  const t = timeMs * 0.001;
  const px = Math.cos(t * 0.55) * 48;
  const py = Math.sin(t * 0.8) * 32 - 12;
  const heading = Math.atan2(
    Math.cos(t * 0.8) * 32 * 0.8,
    -Math.sin(t * 0.55) * 48 * 0.55
  );

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(heading);

  ctx.fillStyle = 'rgba(163, 230, 53, 0.35)';
  ctx.strokeStyle = '#4d7c0f';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 9.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#365314';
  ctx.beginPath();
  ctx.arc(-2, 0, 4.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(77, 124, 15, 0.7)';
  ctx.lineWidth = 1;
  for (let i = -9; i <= 9; i++) {
    const cx = i * 2.1;
    const wiggle = Math.sin(t * 18 + i) * 2.2;
    ctx.beginPath();
    ctx.moveTo(cx, -9.5);
    ctx.lineTo(cx + wiggle, -13);
    ctx.moveTo(cx, 9.5);
    ctx.lineTo(cx - wiggle, 13);
    ctx.stroke();
  }
  ctx.restore();
}

export const pondWaterLiveSlide: SlideDefinition = {
  id: 'pond-water-live',
  name: 'Live Pond Water',
  shortTitle: 'Pond Water',
  subtitle: 'Live Microorganisms',
  badgeColor: '#10b981',
  category: 'Limnology',
  stain: 'Unstained / Brightfield',
  description:
    'Pond microorganisms drift at different depths. Use fine focus to inspect the moving Paramecium and algae planes.',
  focalPlane: 58,
  requiresOilAt100x: false,
  isAnimated: true,
  labels: [
    { id: 'paramecium', text: 'Paramecium', x: 0, y: -15, minMag: 100 },
    { id: 'spirogyra', text: 'Spirogyra Filament', x: -55, y: 30, minMag: 100 },
  ],
//   depthLayers: [
//     {
//       focusOffset: -3.5,
//       render: (ctx, timeMs) => drawSpirogyraAndDiatoms(ctx, timeMs),
//     },
//     {
//       focusOffset: 3.5,
//       render: (ctx, timeMs) => drawParamecium(ctx, timeMs),
//     },
//   ],
//   render(ctx) {
//     ctx.fillStyle = '#eff6d3';
//     ctx.fillRect(-260, -260, 520, 520);
//   },

  depthLayers: [
    {
      focusOffset: 4.5,
      render: (ctx, timeMs) => drawParamecium(ctx, timeMs),
    },
  ],
  render(ctx, timeMs) {
    ctx.fillStyle = '#eff6d3';
    ctx.fillRect(-260, -260, 520, 520);
    drawSpirogyraAndDiatoms(ctx, timeMs);
  },
};