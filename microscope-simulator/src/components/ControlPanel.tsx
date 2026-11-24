import React from 'react';



import type {
  MicroscopePartId,
  ObjectivePower,
  OpticsState,
} from '../types/microscope';

interface ControlPanelProps {
  optics: OpticsState;
  focalPlane: number;
  selectedPart: MicroscopePartId | null;
  onChangeOptics: (updater: (prev: OpticsState) => OpticsState) => void;
}

const OBJECTIVE_CARDS: { power: ObjectivePower; label: string }[] = [
  { power: 4, label: 'Scanning' },
  { power: 10, label: 'Low Power' },
  { power: 40, label: 'High Dry' },
  { power: 100, label: 'Oil Imm' },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  optics,
  focalPlane,
  selectedPart,
  onChangeOptics,
}) => {
  const cardHighlight = (parts: MicroscopePartId[]) =>
    selectedPart && parts.includes(selectedPart)
      ? 'border-cyan-500/70 ring-1 ring-cyan-500/40'
      : 'border-slate-800/90';

  const isHighMag = optics.objective >= 40;
  // Coarse covers wide range (1.0x); Fine gives precision micro-steps (0.06x)
  const effectiveFocus = Math.max(
    0,
    Math.min(100, optics.coarseFocus + optics.fineFocus * 0.12)
  );
  const deltaZ = effectiveFocus - focalPlane;
  const isSharp = Math.abs(deltaZ) < 1.0;
  const highMagCoarseHazard =
    isHighMag && Math.abs(optics.coarseFocus - focalPlane) > 8;

  // Vernier scale coordinates centered at standard stage origin (35.00 mm, 12.00 mm)
  const vernierX = (35 + optics.pan.x * 0.05).toFixed(2);
  const vernierY = (12 + optics.pan.y * 0.05).toFixed(2);

  return (
    <div className="space-y-3">
      {/* 1. Revolving Nosepiece (Objective) */}
      <div
        className={`rounded-xl border bg-gradient-to-b from-[#0e1628] to-[#0a101e] p-3.5 transition-all duration-150 ${cardHighlight([
          'nosepiece',
          'objectives',
          'ocular',
        ])}`}
      >
        <div className="mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Revolving Nosepiece
          </span>
          <span className="rounded border border-cyan-500/30 bg-cyan-950/60 px-2 py-0.5 font-mono text-[11px] tabular-nums text-cyan-300">
            {optics.objective * 10}× Total ({optics.objective}× Obj)
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {OBJECTIVE_CARDS.map(({ power, label }) => {
            const active = optics.objective === power;
            return (
              <button
                key={power}
                type="button"
                onClick={() =>
                  onChangeOptics((prev) => ({ ...prev, objective: power }))
                }
                className={`flex flex-col items-center justify-center rounded-lg border py-2 px-1 transition-all duration-150 cursor-pointer ${
                  active
                    ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300 shadow-inner'
                    : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span className="text-xs font-bold tabular-nums">{power}×</span>
                <span className="text-[10px] text-slate-400">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
          <span className="text-xs text-slate-400">
            Immersion Oil Drop (n = 1.515):
          </span>
          <button
            type="button"
            onClick={() =>
              onChangeOptics((prev) => ({
                ...prev,
                oilImmersion: !prev.oilImmersion,
              }))
            }
            className={`rounded border px-2.5 py-1 font-mono text-[11px] font-medium transition-all duration-150 cursor-pointer ${
              optics.oilImmersion
                ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {optics.oilImmersion ? 'ON (Oil Bridge)' : 'OFF (Air Gap)'}
          </button>
        </div>
      </div>

      {/* 2. Focus Adjustment (Z-Axis Stage) */}
      <div
        className={`rounded-xl border bg-gradient-to-b from-[#0e1628] to-[#0a101e] p-3.5 transition-all duration-150 ${cardHighlight([
          'focus',
        ])}`}
      >
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Focus Adjustment
          </span>
          <span
            className={`rounded border px-2 py-0.5 font-mono text-[10px] tabular-nums transition-colors duration-150 ${
              isSharp
                ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300'
                : 'border-amber-500/40 bg-amber-950/60 text-amber-300'
            }`}
          >
            {isSharp ? 'Sharp Focus' : 'Out of Focus'} (Δz:{' '}
            {deltaZ >= 0 ? `+${deltaZ.toFixed(1)}` : deltaZ.toFixed(1)} µm)
          </span>
        </div>

        <div className="space-y-2.5">
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-slate-300">
                Coarse Focus Knob{' '}
                <span className="text-[10px] text-slate-400">
                  (Rough / Wide)
                </span>
              </span>
              <span className="font-mono tabular-nums text-slate-300">
                {optics.coarseFocus.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={optics.coarseFocus}
              onChange={(e) =>
                onChangeOptics((prev) => ({
                  ...prev,
                  coarseFocus: Number(e.target.value),
                }))
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-slate-300">
                Fine Focus Knob{' '}
                <span className="text-[10px] text-slate-400">
                  (Precision / High-Mag)
                </span>
              </span>
              <span className="font-mono tabular-nums text-slate-300">
                {optics.fineFocus >= 0
                  ? `+${(optics.fineFocus * 0.12).toFixed(2)}`
                  : (optics.fineFocus * 0.12).toFixed(2)}{' '}
                µm
              </span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              step={1}
              value={optics.fineFocus}
              onChange={(e) =>
                onChangeOptics((prev) => ({
                  ...prev,
                  fineFocus: Number(e.target.value),
                }))
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {highMagCoarseHazard && (
          <p className="mt-2 rounded border border-amber-500/30 bg-amber-950/50 px-2.5 py-1 text-[10px] text-amber-200">
            At {optics.objective}× magnification, depth of field is shallow—use
            Fine Focus for small adjustments and avoid coarse sweeps to prevent
            slide/objective contact.
          </p>
        )}
      </div>

      {/* 3. Illuminator & Iris Diaphragm */}
      <div
        className={`rounded-xl border bg-gradient-to-b from-[#0e1628] to-[#0a101e] p-3.5 transition-all duration-150 ${cardHighlight([
          'illuminator',
          'diaphragm',
        ])}`}
      >
        <div className="mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
            Illuminator & Iris Diaphragm
          </span>
          <button
            type="button"
            onClick={() =>
              onChangeOptics((prev) => ({ ...prev, lampOn: !prev.lampOn }))
            }
            className={`flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] font-semibold transition-all duration-150 cursor-pointer ${
              optics.lampOn
                ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300'
                : 'border-slate-700 bg-slate-900 text-slate-400'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                optics.lampOn ? 'bg-emerald-400' : 'bg-slate-500'
              }`}
            />
            {optics.lampOn ? 'LAMP ON' : 'LAMP OFF'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1 flex justify-between text-[11px]">
              <span className="text-slate-300">Rheostat Brightness</span>
              <span className="font-mono tabular-nums text-amber-300">
                {optics.illumination}%
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={1}
              value={optics.illumination}
              onChange={(e) =>
                onChangeOptics((prev) => ({
                  ...prev,
                  illumination: Number(e.target.value),
                }))
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="mb-1 flex justify-between text-[11px]">
              <span className="text-slate-300">Iris Aperture</span>
              <span className="font-mono tabular-nums text-cyan-300">
                {optics.diaphragm}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={1}
              value={optics.diaphragm}
              onChange={(e) =>
                onChangeOptics((prev) => ({
                  ...prev,
                  diaphragm: Number(e.target.value),
                }))
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4. Mechanical Stage Vernier (X / Y) */}
      <div
        className={`rounded-xl border bg-gradient-to-b from-[#0e1628] to-[#0a101e] p-3.5 transition-all duration-150 ${cardHighlight([
          'stage',
        ])}`}
      >
        <div className="mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            Mechanical Stage Vernier
          </span>
          <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] tabular-nums text-slate-300">
            X: {vernierX} mm | Y: {vernierY} mm
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1 flex justify-between text-[11px]">
              <span className="text-slate-300">Stage X (Left / Right)</span>
              <span className="font-mono tabular-nums text-slate-300">
                {Math.round(optics.pan.x * 5)} µm
              </span>
            </div>
            <input
              type="range"
              min={-220}
              max={220}
              step={1}
              value={optics.pan.x}
              onChange={(e) =>
                onChangeOptics((prev) => ({
                  ...prev,
                  pan: { ...prev.pan, x: Number(e.target.value) },
                }))
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="mb-1 flex justify-between text-[11px]">
              <span className="text-slate-300">Stage Y (Up / Down)</span>
              <span className="font-mono tabular-nums text-slate-300">
                {Math.round(optics.pan.y * 5)} µm
              </span>
            </div>
            <input
              type="range"
              min={-220}
              max={220}
              step={1}
              value={optics.pan.y}
              onChange={(e) =>
                onChangeOptics((prev) => ({
                  ...prev,
                  pan: { ...prev.pan, y: Number(e.target.value) },
                }))
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};