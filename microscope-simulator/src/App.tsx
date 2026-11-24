import { useCallback, useEffect, useState } from 'react';
import { Crosshair, Microscope, RotateCcw } from 'lucide-react';
import { ControlPanel } from './components/ControlPanel';
import { MicroscopeDiagram } from './components/MicroscopeDiagram';
import { MicroscopeViewport } from './components/MicroscopeViewport';
import { getSlideById, SLIDE_REGISTRY } from './slides';

import { LanguageSwitch } from './components/LanguagesSwitch';
<LanguageSwitch />

import type {
  MicroscopePartId,
  ObjectivePower,
  OpticsState,
} from './types/microscope';

const OBJECTIVE_ORDER: ObjectivePower[] = [4, 10, 40, 100];

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createRandomChallenge(slide = SLIDE_REGISTRY[
  Math.floor(Math.random() * SLIDE_REGISTRY.length)
]) {
  const focusOffset = randomBetween(18, 30) * (Math.random() < 0.5 ? -1 : 1);

  return {
    slideId: slide.id,
    optics: {
      objective: 4,
      coarseFocus: Math.max(0, Math.min(100, slide.focalPlane + focusOffset)),
      fineFocus: Math.round(randomBetween(-40, 40)),
      lampOn: Math.random() < 0.5,
      illumination: Math.round(randomBetween(10, 35)),
      diaphragm: Math.round(randomBetween(20, 70)),
      oilImmersion: false,
      showReticle: true,
      showLabels: false,
      pan: { x: -180, y: -180 },
      rotation: 0,
      tiltX: 0,
    } as OpticsState & { tiltX: number },
  };
}

export function App() {
  const [initialChallenge] = useState(createRandomChallenge);
  const [selectedSlideId, setSelectedSlideId] = useState<string>(
    initialChallenge.slideId
  );
  const [optics, setOptics] = useState<OpticsState>(initialChallenge.optics);
  const [selectedPart, setSelectedPart] = useState<MicroscopePartId | null>(
    null
  );
  const [showDiagramLabels, setShowDiagramLabels] = useState(true);

  const activeSlide = getSlideById(selectedSlideId);
  const effectiveFocus = optics.coarseFocus + optics.fineFocus * 0.12;
  const specimenIsClear =
    Math.abs(effectiveFocus - activeSlide.focalPlane) < 1.2 &&
    optics.lampOn &&
    optics.illumination >= 35;

  const handleSelectSlide = (slideId: string) => {
    const nextSlide = getSlideById(slideId);
    const nextChallenge = createRandomChallenge(nextSlide);
    setSelectedSlideId(nextChallenge.slideId);
    setOptics(nextChallenge.optics);
    setSelectedPart(null);
  };

  const handlePanChange = useCallback((pan: { x: number; y: number }) => {
    setOptics((prev) => ({ ...prev, pan }));
  }, []);

  const handleFineFocusDelta = useCallback((delta: number) => {
    setOptics((prev) => ({
      ...prev,
      fineFocus: Math.max(-50, Math.min(50, prev.fineFocus + delta)),
    }));
  }, []);

  const handleRotateDelta = useCallback((deltaDeg: number) => {
    setOptics((prev) => ({
      ...prev,
      rotation: ((((prev.rotation ?? 0) + deltaDeg + 180) % 360) + 360) % 360 - 180,
    }));
  }, []);

  const handleTiltDelta = useCallback((deltaDeg: number) => {
    setOptics((prev) => {
      const currentTilt = (prev as OpticsState & { tiltX?: number }).tiltX ?? 0;
      const nextTilt = Math.max(-45, Math.min(45, currentTilt + deltaDeg));
      return { ...prev, tiltX: nextTilt } as OpticsState;
    });
  }, []);

  const handleAutoFocus = () => {
    setOptics((prev) => ({
      ...prev,
      coarseFocus: activeSlide.focalPlane,
      fineFocus: 0,
    }));
  };

  const handleReset = () => {
    setOptics(createRandomChallenge(activeSlide).optics);
    setSelectedPart(null);
  };

  const handleCycleObjective = () => {
    setOptics((prev) => {
      const idx = OBJECTIVE_ORDER.indexOf(prev.objective);
      const next = OBJECTIVE_ORDER[(idx + 1) % OBJECTIVE_ORDER.length];
      return { ...prev, objective: next };
    });
  };

  const handleToggleLamp = () => {
    setOptics((prev) => ({ ...prev, lampOn: !prev.lampOn }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const step = Math.max(1, Math.round(48 / optics.objective));
      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dy = -step;
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dy = step;
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dx = -step;
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dx = step;
      else return;

      e.preventDefault();
      setOptics((prev) => ({
        ...prev,
        pan: {
          x: Math.max(-220, Math.min(220, prev.pan.x + dx)),
          y: Math.max(-220, Math.min(220, prev.pan.y + dy)),
        },
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [optics.objective]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#080d18] text-slate-100">
      {/* Top Bar */}
      <header className="shrink-0 border-b border-slate-800/90 bg-[#0b1120] px-4 py-2">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/15 text-cyan-400">
              <Microscope className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-bold leading-tight tracking-tight text-slate-100">
                  Compound Microscope Simulation
                </h1>
                <span className="shrink-0 rounded border border-cyan-500/30 bg-cyan-950/70 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase leading-none text-cyan-300">
                  Brightfield Sim
                </span>
              </div>
              <p className="truncate text-[11px] leading-tight text-slate-400">
                Create by Peson Suksabai
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`hidden rounded-lg border px-2.5 py-1.5 text-xs font-medium sm:inline-flex ${
                specimenIsClear
                  ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300'
                  : 'border-amber-500/40 bg-amber-950/60 text-amber-300'
              }`}
              role="status"
              aria-live="polite"
            >
              {specimenIsClear ? 'Specimen clear' : 'Setup needed'}
            </span>

            <button
              type="button"
              onClick={handleAutoFocus}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-cyan-500/40 bg-cyan-950/60 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-900/60 transition cursor-pointer"
            >
              <Crosshair className="h-3.5 w-3.5 shrink-0" />
              Auto-Focus
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" />
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen 12-Column Workstation */}
      <main className="grid min-h-0 w-full flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-12">
        {/* Left + Middle Workstation (7 Columns) */}
        <div className="flex min-h-0 flex-col gap-3 lg:col-span-7">
          {/* Prepared Slide Tray */}
          <section className="shrink-0 rounded-xl border border-slate-800/90 bg-[#0d1424] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Prepared Slide Tray (Click to Mount Specimen)
              </span>
              <span className="shrink-0 rounded border border-slate-700 bg-slate-900 px-2.5 py-0.5 font-mono text-[11px] text-slate-300">
                Stain: {activeSlide.stain}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SLIDE_REGISTRY.map((slide, index) => {
                const active = slide.id === activeSlide.id;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => handleSelectSlide(slide.id)}
                    className={`rounded-lg border p-2 text-left transition cursor-pointer ${
                      active
                        ? 'border-cyan-400/80 bg-cyan-500/10 shadow-sm'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono text-[10px] font-semibold uppercase ${
                          active ? 'text-cyan-400' : 'text-slate-400'
                        }`}
                      >
                        Slide 0{index + 1}
                      </span>
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: slide.badgeColor }}
                      />
                    </div>
                    <div className="mt-0.5 truncate text-xs font-semibold text-slate-100">
                      {slide.shortTitle}
                    </div>
                    <div className="truncate text-[10px] text-slate-400">
                      {slide.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Bottom Split: Hardware Schematic + Precision Controls */}
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-12">
            <div className="min-h-0 md:col-span-6">
              <MicroscopeDiagram
                selectedPart={selectedPart}
                onSelectPart={setSelectedPart}
                showLabels={showDiagramLabels}
                onToggleLabels={() => setShowDiagramLabels((show) => !show)}
                objective={optics.objective}
                coarseFocus={optics.coarseFocus}
                fineFocus={optics.fineFocus}
                lampOn={optics.lampOn}
                illumination={optics.illumination}
                diaphragm={optics.diaphragm}
                pan={optics.pan}
                onCycleObjective={handleCycleObjective}
                onToggleLamp={handleToggleLamp}
              />
            </div>

            <div className="min-h-0 overflow-y-auto pr-0.5 md:col-span-6">
              <ControlPanel
                optics={optics}
                focalPlane={activeSlide.focalPlane}
                selectedPart={selectedPart}
                onChangeOptics={setOptics}
              />
            </div>
          </div>
        </div>

        {/* Right: Circular Eyepiece Viewport + Telemetry Bar (5 Columns) */}
        <section className="min-h-0 lg:col-span-5">
          <MicroscopeViewport
            slide={activeSlide}
            optics={optics}
            onPanChange={handlePanChange}
            onFineFocusDelta={handleFineFocusDelta}
            onToggleReticle={() =>
              setOptics((prev) => ({ ...prev, showReticle: !prev.showReticle }))
            }
            onToggleLabels={() =>
              setOptics((prev) => ({ ...prev, showLabels: !prev.showLabels }))
            }
            onRotateDelta={handleRotateDelta}
            onTiltDelta={handleTiltDelta}
          />
        </section>
      </main>
    </div>
  );
}

export default App;