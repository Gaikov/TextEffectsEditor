import type { IconName } from '@blueprintjs/core';
import { ColorFillText } from './ColorFillText';
import type { FontEffectType, IFontEffect } from './IFontEffect';
import { StrokeText } from './StrokeText';

export interface FontEffectDefinition {
  type: FontEffectType;
  label: string;
  icon: IconName;
  create: () => IFontEffect;
}

export const fontEffectDefinitions: FontEffectDefinition[] = [
  {
    type: 'fill',
    label: 'Fill',
    icon: 'color-fill',
    create: () => new ColorFillText(),
  },
  {
    type: 'stroke',
    label: 'Stroke',
    icon: 'style',
    create: () => new StrokeText(),
  },
];

const fontEffectDefinitionByType = new Map(
  fontEffectDefinitions.map((definition) => [definition.type, definition]),
);

export function createFontEffect(type: FontEffectType) {
  const definition = fontEffectDefinitionByType.get(type);
  if (!definition) {
    throw new Error(`Unknown font effect type: ${type}`);
  }

  return definition.create();
}

export function getFontEffectDefinition(type: FontEffectType) {
  return fontEffectDefinitionByType.get(type);
}
