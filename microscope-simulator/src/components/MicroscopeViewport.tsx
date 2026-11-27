import { useEffect, useRef, type FC, type PointerEvent, type WheelEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Crosshair, Tag } from 'lucide-react';
import type { OpticsState, SlideDefinition } from '../types/microscope';
import { FINE_FOCUS_PERCENT_PER_DETENT } from '../constants/focus';

interface MicroscopeViewportProps {
  slide: SlideDefinition;
  optics: OpticsState;
  onPanChange: (pan: { x: number; y: number }) => void;
  onFineFocusDelta: (delta: number) => void;
  onToggleReticle: () => void;
  onToggleLabels: () => void;
  onRotateDelta?: (deltaDeg: number) => void;
  onTiltDelta?: (deltaDeg: number) => void;
}

const OPTICAL_SPECS: Record<
  number,
  { na: string; fovUm: number; dofUm: string; scaleMaxUm: number }
> = {
  4: { na: '0.10 NA', fovUm: 4500, dofUm: '55.0 µm', scaleMaxUm: 1900 },
  10: { na: '0.25 NA', fovUm: 1800, dofUm: '8.5 µm', scaleMaxUm: 760 },
  40: { na: '0.65 NA', fovUm: 450, dofUm: '1.2 µm', scaleMaxUm: 190 },
  100: { na: '1.25 NA', fovUm: 180, dofUm: '0.35 µm', scaleMaxUm: 76 },
};

// Default image orientation (applied automatically, no button needed).
// Change these to true/false as you like.
const FLIP_H = true; // mirror left <-> right
const FLIP_V = true; // mirror up <-> down
const fx = FLIP_H ? -1 : 1;
const fy = FLIP_V ? -1 : 1;
const FOCUS_BLUR_GAIN = 4;

export const MicroscopeViewport: FC<MicroscopeViewportProps> = ({
  slide,
  optics,
  onPanChange,
  onFineFocusDelta,
  onToggleReticle,
  onToggleLabels,
}) => {

  const { t } = useTranslation();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const opticsRef = useRef<OpticsState>(optics);
  const slideRef = useRef<SlideDefinition>(slide);
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const smoothStateRef = useRef({
    panX: optics.pan.x,
    panY: optics.pan.y,
    zoom: optics.objective * 10,
  });

  useEffect(() => {
    opticsRef.current = optics;
  }, [optics]);

  useEffect(() => {
    slideRef.current = slide;
  }, [slide]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const availableW = parent.clientWidth - 24;
      const availableH = parent.clientHeight - 16;
      const size = Math.max(200, Math.min(availableW, availableH, 390));
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(size * dpr));
      canvas.height = Math.max(1, Math.floor(size * dpr));
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const renderFrame = (timeMs: number) => {
      const currentOptics = opticsRef.current;
      const currentSlide = slideRef.current;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(cx, cy) - 4 * dpr;

      const s = smoothStateRef.current;
      const targetZoom = currentOptics.objective * 10;
      s.panX += (currentOptics.pan.x - s.panX) * 0.22;
      s.panY += (currentOptics.pan.y - s.panY) * 0.22;
      s.zoom += (targetZoom - s.zoom) * 0.18;

      const totalMag = s.zoom;
      const zoomScale = (totalMag / 40) * (width / 420);

      const effectiveFocus = Math.max(
        0,
        Math.min(
          100,
          currentOptics.coarseFocus +
            currentOptics.fineFocus * FINE_FOCUS_PERCENT_PER_DETENT,
        ),
      );

      const focusDelta = Math.abs(effectiveFocus - currentSlide.focalPlane);

      const baseDofMultiplier =
        currentOptics.objective === 4
          ? 0.22
          : currentOptics.objective === 10
          ? 0.16
          : currentOptics.objective === 40
          ? 0.34
          : 0.55;

      const aperture = currentOptics.diaphragm / 100;
      const dofMultiplier =
        baseDofMultiplier * (0.55 + aperture * 0.9) * FOCUS_BLUR_GAIN;
      const diffractionBlur = (1 - aperture) ** 2 * 0.7 * dpr;

      const missingOil =
        currentOptics.objective === 100 &&
        currentSlide.requiresOilAt100x &&
        !currentOptics.oilImmersion;

      const lightNorm = currentOptics.lampOn
        ? currentOptics.illumination / 100
        : 0;
      const apertureTransmission = 0.25 + aperture * 0.75;
      const brightness = currentOptics.lampOn
        ? (0.12 + lightNorm * 1.12) * apertureTransmission
        : 0.03;
      const warmth = Math.max(0, (0.65 - lightNorm) * 0.45);
      const contrast = 0.8 + (1 - aperture) * 0.55;

      const rotDeg = currentOptics.rotation ?? 0;
      const tiltDeg = (currentOptics as OpticsState & { tiltX?: number }).tiltX ?? 0;
      const rotRad = (rotDeg * Math.PI) / 180;
      const tiltRad = (tiltDeg * Math.PI) / 180;
      const tiltScaleY = Math.max(0.15, Math.cos(tiltRad));

      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      if (!currentOptics.lampOn) {
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, width, height);
      } else {
        const bgRed = Math.min(255, Math.round(244 + warmth * 22));
        const bgGreen = Math.min(255, Math.round(246 - warmth * 12));
        const bgBlue = Math.min(255, Math.round(250 - warmth * 40));
        ctx.fillStyle = `rgb(${bgRed}, ${bgGreen}, ${bgBlue})`;
        ctx.fillRect(0, 0, width, height);

        const toneFilter = `brightness(${brightness.toFixed(
          2
        )}) contrast(${contrast.toFixed(2)})`;

        const baseBlurPx =
          focusDelta * dofMultiplier * dpr +
          diffractionBlur +
          (missingOil ? 7.5 * dpr : 0);

        // Main slide layer (flipped by default)
        ctx.save();
        ctx.filter = `blur(${baseBlurPx.toFixed(2)}px) ${toneFilter}`;
        ctx.translate(cx, cy);
        ctx.rotate(rotRad);
        ctx.scale(zoomScale * fx, zoomScale * tiltScaleY * fy);
        // Moving the physical stage shifts the specimen oppositely in the eyepiece.
        ctx.translate(s.panX, s.panY);
        currentSlide.render(ctx, timeMs, currentOptics);
        ctx.restore();

        // Depth layers (flipped by default)
        currentSlide.depthLayers?.forEach((layer) => {
          const layerDelta = Math.abs(
            effectiveFocus - (currentSlide.focalPlane + layer.focusOffset)
          );
          const layerBlurPx =
            layerDelta * dofMultiplier * dpr +
            diffractionBlur +
            (missingOil ? 7.5 * dpr : 0);
          const depthFade = Math.max(0.35, 1 - layerDelta * 0.045);

          ctx.save();
          ctx.globalAlpha = depthFade;
          ctx.filter = `blur(${layerBlurPx.toFixed(2)}px)`;
          ctx.translate(cx, cy);
          ctx.rotate(rotRad);
          ctx.scale(zoomScale * fx, zoomScale * tiltScaleY * fy);
          ctx.translate(s.panX, s.panY);
          layer.render(ctx, timeMs, currentOptics);
          ctx.restore();
        });

        // Anatomical Labels (positions follow the flipped image)
        if (currentOptics.showLabels && focusDelta < 14 && !missingOil) {
          const cosR = Math.cos(rotRad);
          const sinR = Math.sin(rotRad);

          for (const label of currentSlide.labels) {
            if (totalMag >= label.minMag) {
              const localX = (label.x + s.panX) * fx;
              const localY = (label.y + s.panY) * tiltScaleY * fy;
              const rotatedX = localX * cosR - localY * sinR;
              const rotatedY = localX * sinR + localY * cosR;

              const screenX = rotatedX * zoomScale + cx;
              const screenY = rotatedY * zoomScale + cy;

              if (Math.hypot(screenX - cx, screenY - cy) < radius * 0.82) {
                ctx.save();
                ctx.font = `${Math.round(10.5 * dpr)}px ui-sans-serif, system-ui, sans-serif`;
                const padX = 6 * dpr;
                const textW = ctx.measureText(label.text).width;
                const boxH = 17 * dpr;

                ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
                ctx.beginPath();
                ctx.roundRect(
                  screenX + 5 * dpr,
                  screenY - boxH / 2,
                  textW + padX * 2,
                  boxH,
                  4 * dpr
                );
                ctx.fill();

                ctx.fillStyle = '#f8fafc';
                ctx.textBaseline = 'middle';
                ctx.fillText(label.text, screenX + 5 * dpr + padX, screenY);
                ctx.restore();
              }
            }
          }
        }
      }

      // Ocular Pointer Needle & Bottom Micrometer Ruler
      if (currentOptics.showReticle) {
        ctx.save();
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.lineWidth = 2.2 * dpr;
        ctx.beginPath();
        ctx.moveTo(cx + radius, cy);
        ctx.lineTo(cx, cy);
        ctx.stroke();

        const rulerY = cy + radius * 0.62;
        const rulerW = radius * 1.15;
        const startX = cx - rulerW / 2;
        const divisions = 20;
        const step = rulerW / divisions;

        ctx.strokeStyle = 'rgba(15, 23, 42, 0.72)';
        ctx.lineWidth = 1.2 * dpr;
        ctx.beginPath();
        ctx.moveTo(startX, rulerY);
        ctx.lineTo(startX + rulerW, rulerY);
        for (let i = 0; i <= divisions; i++) {
          const tx = startX + i * step;
          const tickH = (i % 5 === 0 ? 7 : 3.5) * dpr;
          ctx.moveTo(tx, rulerY - tickH);
          ctx.lineTo(tx, rulerY);
        }
        ctx.stroke();

        const spec = OPTICAL_SPECS[currentOptics.objective];
        const perDiv = spec.scaleMaxUm / 10;
        ctx.font = `${Math.round(10 * dpr)}px ui-monospace, monospace`;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
        ctx.textAlign = 'left';
        ctx.fillText('0', startX, rulerY + 13 * dpr);
        ctx.textAlign = 'center';
        ctx.fillText(
          `${spec.scaleMaxUm} µm (${perDiv} µm/div)`,
          cx + 12 * dpr,
          rulerY + 13 * dpr
        );
        ctx.restore();
      }

      // Keep the eyepiece edge subtle; the iris mainly changes illumination and depth of field.
      const edgeShade = 0.1 + (1 - aperture) * 0.13;
      const grad = ctx.createRadialGradient(
        cx,
        cy,
        radius * 0.55,
        cx,
        cy,
        radius
      );
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(
        0.84,
        `rgba(2, 6, 23, ${(edgeShade * 0.25).toFixed(2)})`
      );
      grad.addColorStop(1, `rgba(2, 6, 23, ${edgeShade.toFixed(2)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.restore();

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3 * dpr;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    animationFrameId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    const totalMag = optics.objective * 10;
    const worldScale = (totalMag / 40) * 1.2;

    // Undo the view rotation so dragging follows the mouse
    const r = ((optics.rotation ?? 0) * Math.PI) / 180;
    const rdx = dx * Math.cos(r) + dy * Math.sin(r);
    const rdy = -dx * Math.sin(r) + dy * Math.cos(r);

    // Undo the flip so dragging still follows the mouse
    onPanChange({
      x: Math.max(-220, Math.min(220, optics.pan.x + (rdx * fx) / worldScale)),
      y: Math.max(-220, Math.min(220, optics.pan.y + (rdy * fy) / worldScale)),
    });
  };

  const handlePointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleWheel = (e: WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const step = e.deltaY > 0 ? -1 : 1;
    onFineFocusDelta(step);
  };

  const totalMag = optics.objective * 10;
  const spec = OPTICAL_SPECS[optics.objective];
  const needsOilWarning =
    optics.objective === 100 && slide.requiresOilAt100x && !optics.oilImmersion;

  return (
    <div className="flex h-full min-h-0 flex-col justify-between">
      {/* Main Eyepiece Card */}
      <div className="flex min-h-0 flex-1 flex-col justify-between rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0e1628] to-[#090f1c] p-3.5 shadow-lg">
        <div className="flex shrink-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-slate-100">
              {/* {slide.name} */}
              {t(`slides.${slide.id}.name`, { defaultValue: slide.name })}
            </h2>
            <p className="line-clamp-2 text-xs text-slate-400">
              {/* {slide.description} */}
              {t(`slides.${slide.id}.description`, { defaultValue: slide.description })}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
            <button
              type="button"
              onClick={onToggleReticle}
              className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150 cursor-pointer ${
                optics.showReticle
                  ? 'border-cyan-500/50 bg-cyan-950/70 text-cyan-300'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Crosshair className="h-3.5 w-3.5" />
              {/* Reticle */}
              {t('viewport.reticle')}
            </button>
          </div>
        </div>

        {/* Circular Eyepiece Canvas */}
        <div className="my-1.5 flex min-h-0 flex-1 flex-col items-center justify-center">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            className="cursor-grab active:cursor-grabbing touch-none rounded-full shadow-[0_0_50px_rgba(0,0,0,0.85)]"
          />

          {needsOilWarning && (
            <div className="mt-2 rounded border border-amber-500/40 bg-amber-950/70 px-3 py-1 text-[11px] text-amber-200">
              100× Oil Immersion objective requires immersion oil drop (n = 1.515)
            </div>
          )}
        </div>

        {/* <p className="shrink-0 text-center text-[11px] text-slate-400">
          Drag inside eyepiece to pan slide • Scroll wheel to fine-focus • Arrow keys for stage X/Y
        </p> */}
      </div>

      {/* Bottom 4 Telemetry Cards */}
      <div className="mt-2.5 grid shrink-0 grid-cols-4 gap-2">
        <div className="rounded-lg border border-slate-800/80 bg-[#0d1424] py-2 px-2 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {/* Total Mag */}
            {t('viewport.totalMag')}
          </div>
          <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-cyan-400">
            {totalMag}×
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-[#0d1424] py-2 px-2 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {/* Num. Aperture */}
            {t('viewport.numAperture')}
          </div>
          <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-100">
            {spec.na}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-[#0d1424] py-2 px-2 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {/* FOV Diameter */}
            {t('viewport.fovDiameter')}
          </div>
          <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-sky-400">
            {spec.fovUm} µm
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-[#0d1424] py-2 px-2 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {/* Depth of Field */}
            {t('viewport.depthOfField')}
          </div>
          <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-100">
            {spec.dofUm}
          </div>
        </div>
      </div>
    </div>
  );
};