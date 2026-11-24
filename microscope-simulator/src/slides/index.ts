import type { SlideCategory, SlideDefinition } from '../types/microscope';
import { humanBloodSmearSlide } from './humanBloodSmear';
import { leafEpidermisSlide } from './leafEpidermis';
import { onionRootTipSlide } from './onionRootTip';
import { pondWaterLiveSlide } from './pondWaterLive';
import { textSlide } from './text';

export const SLIDE_REGISTRY: SlideDefinition[] = [
    textSlide,
    onionRootTipSlide,
    humanBloodSmearSlide,
    pondWaterLiveSlide,
    leafEpidermisSlide,
];

export function getSlideById(id: string): SlideDefinition {
  return SLIDE_REGISTRY.find((s) => s.id === id) ?? SLIDE_REGISTRY[0];
}

export function filterSlides(
  category: SlideCategory | 'All',
  search: string
): SlideDefinition[] {
  const q = search.trim().toLowerCase();
  return SLIDE_REGISTRY.filter((slide) => {
    const matchesCategory = category === 'All' || slide.category === category;
    const matchesQuery =
      !q ||
      slide.name.toLowerCase().includes(q) ||
      slide.stain.toLowerCase().includes(q) ||
      slide.category.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });
}