export type ObjectivePower = 4 | 10 | 40 | 100;

export type SlideCategory =
  | 'Botany'
  | 'Histology'
  | 'Microbiology'
  | 'Hematology'
  | 'Limnology'
  | 'Text';

export type MicroscopePartId =
  | 'ocular'
  | 'nosepiece'
  | 'objectives'
  | 'stage'
  | 'condenser'
  | 'diaphragm'
  | 'focus'
  | 'illuminator';

export interface OpticsState {
  objective: ObjectivePower; // Multiplied by 10x ocular -> 40x to 1000x
  coarseFocus: number;       // 0 - 100
  fineFocus: number;         // Detent count, at 1 percentage point per detent
  lampOn: boolean;
  illumination: number;      // 0 - 100
  diaphragm: number;         // 10 - 100
  oilImmersion: boolean;
  showReticle: boolean;
  showLabels: boolean;
  pan: { x: number; y: number };
  rotation: number;          // left/right angle in degrees (e.g., -180 to 180)
  tiltX: number;            // up/down tilt in degrees (e.g., -45 to 45)
}

export interface SpecimenLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  minMag: number;
}

export type SpecimenRenderer = (
  ctx: CanvasRenderingContext2D,
  timeMs: number,
  optics: OpticsState
) => void;

export interface SpecimenDepthLayer {
  focusOffset: number;
  render: SpecimenRenderer;
}

export interface SlideDefinition {
  id: string;
  name: string;
  shortTitle: string;
  subtitle: string;
  badgeColor: string;
  category: SlideCategory;
  stain: string;
  description: string;
  focalPlane: number;
  requiresOilAt100x: boolean;
  isAnimated?: boolean;
  labels: SpecimenLabel[];
  depthLayers?: SpecimenDepthLayer[];
  render: SpecimenRenderer;
}