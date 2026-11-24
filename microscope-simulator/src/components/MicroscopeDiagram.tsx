import React, { useEffect, useRef, useState } from 'react';
import { Tag } from 'lucide-react';
import type { MicroscopePartId, ObjectivePower } from '../types/microscope';



interface MicroscopeDiagramProps {
  selectedPart: MicroscopePartId | null;
  onSelectPart: (part: MicroscopePartId) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  objective: ObjectivePower;
  coarseFocus: number;
  fineFocus: number;
  lampOn: boolean;
  illumination: number;
  diaphragm: number;
  pan: { x: number; y: number };
  onCycleObjective: () => void;
  onToggleLamp: () => void;
}

const OBJECTIVE_RING_COLOR: Record<ObjectivePower, string> = {
  4: '#f43f5e',
  10: '#f59e0b',
  40: '#38bdf8',
  100: '#f8fafc',
};

const OBJECTIVE_BARREL_HEIGHT: Record<ObjectivePower, number> = {
  4: 26,
  10: 30,
  40: 34,
  100: 38,
};

const OBJECTIVE_TURRET_ANGLE: Record<ObjectivePower, number> = {
  4: 0,
  10: 14,
  40: -14,
  100: -26,
};

function lerp(current: number, target: number, factor: number): number {
  const diff = target - current;
  if (Math.abs(diff) < 0.01) return target;
  return current + diff * factor;
}

export const MicroscopeDiagram: React.FC<MicroscopeDiagramProps> = ({
  selectedPart,
  onSelectPart,
  showLabels,
  onToggleLabels,
  objective,
  coarseFocus,
  fineFocus,
  lampOn,
  illumination,
  diaphragm,
  pan,
  onCycleObjective,
  onToggleLamp,
}) => {
  const focusCombined = Math.max(0, Math.min(100, coarseFocus + fineFocus * 0.15));

  const targetsRef = useRef({
    turretAngle: OBJECTIVE_TURRET_ANGLE[objective],
    barrelH: OBJECTIVE_BARREL_HEIGHT[objective],
    focusAngle: -135 + (focusCombined / 100) * 270,
    stageY: ((50 - focusCombined) / 50) * 5,
    slideX: Math.max(-11, Math.min(11, (pan.x / 220) * 11)),
    vernierAngle: (pan.x / 220) * 150 + (pan.y / 220) * 75,
    dimmerAngle: -135 + (illumination / 100) * 270,
    irisWidth: 8 + (diaphragm / 100) * 18,
    beamStrength: lampOn ? 0.15 + (illumination / 100) * 0.55 : 0,
  });

  targetsRef.current = {
    turretAngle: OBJECTIVE_TURRET_ANGLE[objective],
    barrelH: OBJECTIVE_BARREL_HEIGHT[objective],
    focusAngle: -135 + (focusCombined / 100) * 270,
    stageY: ((50 - focusCombined) / 50) * 5,
    slideX: Math.max(-11, Math.min(11, (pan.x / 220) * 11)),
    vernierAngle: (pan.x / 220) * 150 + (pan.y / 220) * 75,
    dimmerAngle: -135 + (illumination / 100) * 270,
    irisWidth: 8 + (diaphragm / 100) * 18,
    beamStrength: lampOn ? 0.15 + (illumination / 100) * 0.55 : 0,
  };

  const [anim, setAnim] = useState(targetsRef.current);

  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const smooth = 1 - Math.exp(-16 * dt);
      const t = targetsRef.current;

      setAnim((prev) => {
        const next = {
          turretAngle: lerp(prev.turretAngle, t.turretAngle, smooth),
          barrelH: lerp(prev.barrelH, t.barrelH, smooth),
          focusAngle: lerp(prev.focusAngle, t.focusAngle, smooth),
          stageY: lerp(prev.stageY, t.stageY, smooth),
          slideX: lerp(prev.slideX, t.slideX, smooth),
          vernierAngle: lerp(prev.vernierAngle, t.vernierAngle, smooth),
          dimmerAngle: lerp(prev.dimmerAngle, t.dimmerAngle, smooth),
          irisWidth: lerp(prev.irisWidth, t.irisWidth, smooth),
          beamStrength: lerp(prev.beamStrength, t.beamStrength, smooth),
        };
        return next;
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const isHighlighted = (part: MicroscopePartId) => selectedPart === part;
  const ringColor = OBJECTIVE_RING_COLOR[objective];
  const irisBarX = 132 - anim.irisWidth / 2;

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0e1628] to-[#090f1c] p-3.5 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-100">Microscope Parts</h2>
          <span className="text-[10px] text-slate-400">
            {selectedPart ? `Selected: ${selectedPart}` : 'Click a part to adjust'}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleLabels}
          aria-pressed={showLabels}
          className={`flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition cursor-pointer ${
            showLabels
              ? 'border-cyan-500/50 bg-cyan-950/70 text-cyan-300'
              : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Tag className="h-3.5 w-3.5" />
          Labels {showLabels ? 'On' : 'Off'}
        </button>
      </div>

      <svg
        viewBox="0 0 280 355"
        className="mx-auto my-1 h-full max-h-[440px] w-full max-w-[350px] select-none"
        role="img"
        aria-label="Animated Compound Microscope Schematic"
      >
        <defs>
          <linearGradient id="scopeMetalSmooth" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="100%" stopColor="#172033" />
          </linearGradient>

          <linearGradient id="barrelChromeSmooth" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="45%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          <linearGradient id="beamConeSmooth" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.85" />
            <stop offset="65%" stopColor="#fef08a" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#fef9c3" stopOpacity="0.06" />
          </linearGradient>

          <filter id="lampGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Optical Axis Centerline */}
        <line
          x1="132"
          y1="22"
          x2="132"
          y2="292"
          stroke="#475569"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.55"
        />

        {/* Lower Light Cone */}
        <polygon
          points="118,288 146,288 153,212 111,212"
          fill="url(#beamConeSmooth)"
          opacity={anim.beamStrength}
        />

        {/* Upper Light Cone */}
        <polygon
          points="122,184 142,184 137,142 127,142"
          fill="url(#beamConeSmooth)"
          opacity={anim.beamStrength * 0.85}
        />

        {/* C-Frame Arm */}
        <path
          d="M 106 102 C 54 124, 52 246, 102 292"
          fill="none"
          stroke="url(#scopeMetalSmooth)"
          strokeWidth="22"
          strokeLinecap="round"
        />
        <path
          d="M 73 142 C 66 164, 66 186, 72 204"
          fill="none"
          stroke="#090f1c"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Base */}
        <path
          d="M 44 320 C 44 302, 56 292, 74 292 L 214 292 C 224 292, 230 299, 230 310 L 230 320 Z"
          fill="url(#scopeMetalSmooth)"
          stroke="#64748b"
          strokeWidth="1.4"
        />
        <rect
          x="40"
          y="320"
          width="194"
          height="7"
          rx="3"
          fill="#172033"
          stroke="#475569"
          strokeWidth="1.2"
        />

        {/* 10x Ocular */}
        <g onClick={() => onSelectPart('ocular')} className="cursor-pointer">
          <g transform="rotate(26 154 54)">
            <rect
              x="145"
              y="26"
              width="18"
              height="34"
              rx="2"
              fill="#1e293b"
              stroke={isHighlighted('ocular') ? '#38bdf8' : '#64748b'}
              strokeWidth={isHighlighted('ocular') ? '2.2' : '1.4'}
            />
            <rect
              x="142"
              y="20"
              width="24"
              height="7"
              rx="2"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.6"
            />
          </g>
          <path
            d="M 98 84 L 146 60 L 162 86 L 112 108 Z"
            fill="url(#scopeMetalSmooth)"
            stroke={isHighlighted('ocular') ? '#38bdf8' : '#64748b'}
            strokeWidth={isHighlighted('ocular') ? '2' : '1.3'}
          />
          <circle
            cx="122"
            cy="86"
            r="9"
            fill="#334155"
            stroke="#64748b"
            strokeWidth="1.2"
          />
          {showLabels && (
            <text
              x="178"
              y="42"
              className="fill-slate-100 font-mono text-[12px] font-semibold pointer-events-none"
              paintOrder="stroke"
              stroke="#090f1c"
              strokeWidth="3"
              strokeLinejoin="round"
            >
              10x Eyepiece
            </text>
          )}
        </g>

        {/* Revolving Nosepiece & Objectives */}
        <g
          onClick={() => {
            onSelectPart('nosepiece');
            onCycleObjective();
          }}
          className="cursor-pointer"
        >
          <g
            transform={`rotate(${anim.turretAngle.toFixed(2)} 132 114)`}
          >
            <path
              d="M 104 108 L 160 108 L 166 121 L 98 121 Z"
              fill="#334155"
              stroke={
                isHighlighted('nosepiece') || isHighlighted('objectives')
                  ? '#38bdf8'
                  : '#64748b'
              }
              strokeWidth={
                isHighlighted('nosepiece') || isHighlighted('objectives')
                  ? '2.1'
                  : '1.4'
              }
            />
            <rect
              x="98"
              y="116"
              width="12"
              height="24"
              rx="2"
              transform="rotate(28 104 128)"
              fill="#334155"
              stroke="#64748b"
              strokeWidth="1.2"
            />
            <rect
              x="154"
              y="116"
              width="12"
              height="24"
              rx="2"
              transform="rotate(-28 160 128)"
              fill="#334155"
              stroke="#64748b"
              strokeWidth="1.2"
            />
            <rect
              x="124"
              y="121"
              width="16"
              height={anim.barrelH}
              rx="2"
              fill="url(#barrelChromeSmooth)"
              stroke="#1e293b"
              strokeWidth="1.2"
            />
            <rect
              x="124"
              y={121 + anim.barrelH * 0.58}
              width="16"
              height="4"
              fill={ringColor}
            />
            <rect
              x="126"
              y={121 + anim.barrelH}
              width="12"
              height="3"
              rx="1"
              fill="#0f172a"
            />
          </g>

          {showLabels && (
            <>
              <text
                x="176"
                y="108"
                className="fill-slate-100 font-mono text-[12px] font-semibold pointer-events-none"
                paintOrder="stroke"
                stroke="#090f1c"
                strokeWidth="3"
                strokeLinejoin="round"
              >
                Nosepiece
              </text>
              <text
                x="176"
                y="128"
                className="fill-cyan-300 font-mono text-[12px] font-semibold pointer-events-none"
                paintOrder="stroke"
                stroke="#090f1c"
                strokeWidth="3"
                strokeLinejoin="round"
              >
                {objective}x Objective
              </text>
            </>
          )}
        </g>

        {/* Stage + Iris + X/Y Vernier */}
        <g transform={`translate(0 ${anim.stageY.toFixed(2)})`}>
          <g transform={`translate(${anim.slideX.toFixed(2)} 0)`}>
            <rect
              x="106"
              y="186"
              width="52"
              height="4.5"
              rx="1.5"
              fill="#7dd3fc"
              fillOpacity="0.65"
              stroke="#bae6fd"
              strokeWidth="0.7"
            />
            <ellipse cx="132" cy="185.5" rx="6" ry="2" fill="#ec4899" />
          </g>

          <path
            d="M 111 186 L 111 182 L 121 182"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1.3"
          />
          <path
            d="M 153 186 L 153 182 L 143 182"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1.3"
          />

          <g onClick={() => onSelectPart('stage')} className="cursor-pointer">
            <rect
              x="82"
              y="190.5"
              width="102"
              height="8"
              rx="2"
              fill="#334155"
              stroke={isHighlighted('stage') ? '#38bdf8' : '#64748b'}
              strokeWidth={isHighlighted('stage') ? '2.1' : '1.3'}
            />
            {showLabels && (
              <text
                x="24"
                y="197"
                className="fill-slate-100 font-mono text-[12px] font-semibold pointer-events-none"
                paintOrder="stroke"
                stroke="#090f1c"
                strokeWidth="3"
                strokeLinejoin="round"
              >
                Stage
              </text>
            )}
          </g>

          <g
            onClick={() => onSelectPart('diaphragm')}
            className="cursor-pointer"
          >
            <rect
              x="110"
              y="201"
              width="44"
              height="14"
              rx="3"
              fill="#1e293b"
              stroke={isHighlighted('diaphragm') ? '#38bdf8' : '#64748b'}
              strokeWidth={isHighlighted('diaphragm') ? '2.1' : '1.3'}
            />
            <rect
              x={irisBarX}
              y="206.5"
              width={anim.irisWidth}
              height="3"
              rx="1.5"
              fill="#38bdf8"
            />
            <circle cx="161" cy="208" r="2.5" fill="#38bdf8" />
            {showLabels && (
              <text
                x="168"
                y="211"
                className="fill-slate-100 font-mono text-[12px] font-semibold pointer-events-none"
                paintOrder="stroke"
                stroke="#090f1c"
                strokeWidth="3"
                strokeLinejoin="round"
              >
                Iris Diaphragm
              </text>
            )}
          </g>

          <g onClick={() => onSelectPart('stage')} className="cursor-pointer">
            <line
              x1="168"
              y1="198.5"
              x2="168"
              y2="226"
              stroke="#94a3b8"
              strokeWidth="2"
            />
            <rect
              x="162"
              y="216"
              width="12"
              height="9"
              rx="2"
              fill="#475569"
              stroke="#94a3b8"
              strokeWidth="1.1"
            />
            <g transform={`rotate(${anim.vernierAngle.toFixed(2)} 168 231)`}>
              <rect
                x="163"
                y="225"
                width="10"
                height="12"
                rx="2"
                fill="#0284c7"
                stroke="#7dd3fc"
                strokeWidth="1.2"
              />
              <line
                x1="168"
                y1="226"
                x2="168"
                y2="236"
                stroke="#e0f2fe"
                strokeWidth="1.2"
              />
            </g>
            {showLabels && (
              <text
                x="182"
                y="234"
                className="fill-slate-100 font-mono text-[12px] font-semibold pointer-events-none"
                paintOrder="stroke"
                stroke="#090f1c"
                strokeWidth="3"
                strokeLinejoin="round"
              >
                X/Y Stage
              </text>
            )}
          </g>
        </g>

        {/* Coarse / Fine Focus Rotary Knob */}
        <g onClick={() => onSelectPart('focus')} className="cursor-pointer">
          <circle
            cx="72"
            cy="244"
            r="19"
            fill="#1e293b"
            stroke={isHighlighted('focus') ? '#38bdf8' : '#64748b'}
            strokeWidth={isHighlighted('focus') ? '2.2' : '1.5'}
          />
          <circle
            cx="72"
            cy="244"
            r="16"
            fill="none"
            stroke="#475569"
            strokeWidth="1.5"
            strokeDasharray="2 3"
          />
          <g transform={`rotate(${anim.focusAngle.toFixed(2)} 72 244)`}>
            <circle
              cx="72"
              cy="244"
              r="11"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.6"
            />
            <line
              x1="72"
              y1="244"
              x2="81"
              y2="244"
              stroke="#38bdf8"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
          {showLabels && (
            <text
              x="16"
              y="277"
              className="fill-slate-100 font-mono text-[12px] font-semibold pointer-events-none"
              paintOrder="stroke"
              stroke="#090f1c"
              strokeWidth="3"
              strokeLinejoin="round"
            >
              Coarse/Fine Focus
            </text>
          )}
        </g>

        {/* Lamp & Dimmer */}
        <g
          onClick={() => {
            onSelectPart('illuminator');
            onToggleLamp();
          }}
          className="cursor-pointer"
        >
          <rect
            x="116"
            y="286"
            width="32"
            height="7"
            rx="2"
            fill="#1e293b"
            stroke={isHighlighted('illuminator') ? '#38bdf8' : '#64748b'}
            strokeWidth="1.3"
          />
          <ellipse
            cx="132"
            cy="288"
            rx="12"
            ry="3.5"
            fill={lampOn ? '#fef08a' : '#334155'}
            filter={lampOn ? 'url(#lampGlow)' : undefined}
          />
          {showLabels && (
            <text
              x="158"
              y="283"
              className="fill-slate-100 font-mono text-[12px] font-semibold pointer-events-none"
              paintOrder="stroke"
              stroke="#090f1c"
              strokeWidth="3"
              strokeLinejoin="round"
            >
              Lamp / Brightness
            </text>
          )}
          <rect
            x="153"
            y="300"
            width="18"
            height="13"
            rx="3"
            fill="#0f172a"
            stroke="#475569"
            strokeWidth="1.2"
          />
          <rect
            x="159"
            y="303.5"
            width="6"
            height="6"
            rx="1.5"
            fill={lampOn ? '#22c55e' : '#475569'}
          />
          <g transform={`rotate(${anim.dimmerAngle.toFixed(2)} 189 306.5)`}>
            <circle
              cx="189"
              cy="306.5"
              r="9.5"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.6"
            />
            <line
              x1="189"
              y1="306.5"
              x2="195"
              y2="301.5"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </g>
      </svg>

      <p className="border-t border-slate-800/80 pt-2 text-center text-[11px] text-slate-400">
        Click <span className="text-cyan-400">objective</span> to cycle magnification or{' '}
        <span className="text-cyan-400">lamp</span> to toggle power.
      </p>
    </div>
  );
};