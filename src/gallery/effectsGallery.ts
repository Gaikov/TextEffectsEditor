import {
  getFontEffectDefinition,
  type FontEffectType,
  type SerializedFontEffect,
} from '../effects';
import { isRecord } from '../effects/effectSnapshot';

export const EFFECTS_GALLERY_STORAGE_KEY = 'fontEffects.gallery';

export interface EffectsGalleryItem {
  id: string;
  name: string;
  createdAt: string;
  effects: SerializedFontEffect[];
}

function createGalleryId() {
  return `gallery-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function readGalleryItem(value: unknown): EffectsGalleryItem | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string') return null;
  if (typeof value.name !== 'string') return null;
  if (typeof value.createdAt !== 'string') return null;
  if (!Array.isArray(value.effects)) return null;

  const effects = value.effects.filter(
    (effect): effect is SerializedFontEffect =>
      isRecord(effect) &&
      typeof effect.type === 'string' &&
      getFontEffectDefinition(effect.type as FontEffectType) != null,
  );
  if (effects.length === 0) return null;

  return {
    id: value.id,
    name: value.name,
    createdAt: value.createdAt,
    effects,
  };
}

export function loadEffectsGallery() {
  try {
    const storedValue = window.localStorage.getItem(EFFECTS_GALLERY_STORAGE_KEY);
    if (storedValue == null) return [];

    const parsedValue = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) return [];

    return parsedValue
      .map(readGalleryItem)
      .filter((item): item is EffectsGalleryItem => item !== null);
  } catch (error) {
    console.warn('Unable to load effects gallery.', error);
    return [];
  }
}

export function saveEffectsGallery(items: EffectsGalleryItem[]) {
  try {
    window.localStorage.setItem(
      EFFECTS_GALLERY_STORAGE_KEY,
      JSON.stringify(items),
    );
  } catch (error) {
    console.warn('Unable to save effects gallery.', error);
  }
}

export function createEffectsGalleryItem(
  effects: SerializedFontEffect[],
  name = '',
): EffectsGalleryItem {
  return {
    id: createGalleryId(),
    name,
    createdAt: new Date().toISOString(),
    effects,
  };
}
