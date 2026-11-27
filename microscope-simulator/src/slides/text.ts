import specimenPhotoUrl from '../assets/sample-slides/ก.png';
import type { SlideDefinition } from '../types/microscope';

let cachedImage: HTMLImageElement | null = null;
let imageLoaded = false;

function getSpecimenImage(): HTMLImageElement | null {
  if (!cachedImage) {
    const img = new Image();
    img.src = specimenPhotoUrl;
    img.onload = () => {
      imageLoaded = true;
    };
    cachedImage = img;
  }
  return imageLoaded ? cachedImage : null;
}

export const textSlide: SlideDefinition = {
  id: 'text-slide',
  name: 'ก',
  shortTitle: 'text',
  subtitle: 'Text Slide',
  badgeColor: '#a855f7',
  category: 'Text',
  stain: 'Local Asset',
  description:
    'Image projection indecator',
  focalPlane: 80,
  requiresOilAt100x: false,
  isAnimated: false,
  labels: [],
  render(ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-260, -260, 520, 520);

    const img = getSpecimenImage();
    if (!img) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Loading specimen...', 0, 0);
      return;
    }

    const maxDim = 220;
    const aspect = img.width / img.height || 1;
    const drawW = aspect >= 1 ? maxDim : maxDim * aspect;
    const drawH = aspect >= 1 ? maxDim / aspect : maxDim;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  },
};