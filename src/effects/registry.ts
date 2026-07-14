import type { IconName } from '@blueprintjs/core';
import {
  BlurEffect,
  deserializeBlurEffect,
  serializeBlurEffect,
} from './BlurEffect';
import {
  ColorFillText,
  deserializeColorFillText,
  serializeColorFillText,
} from './ColorFillText';
import {
  CompositeBlendEffect,
  deserializeCompositeBlendEffect,
  serializeCompositeBlendEffect,
} from './CompositeBlendEffect';
import { isRecord, type SerializedFontEffect } from './effectSnapshot';
import {
  GradientFillText,
  deserializeGradientFillText,
  serializeGradientFillText,
} from './GradientFillText';
import {
  GlowEffect,
  deserializeGlowEffect,
  serializeGlowEffect,
} from './GlowEffect';
import {
  GroupEffect,
  applySerializedGroupFields,
  readGroupChildren,
  serializeGroupEffect,
} from './GroupEffect';
import {
  InnerShadowEffect,
  deserializeInnerShadowEffect,
  serializeInnerShadowEffect,
} from './InnerShadowEffect';
import type { FontEffectType, IFontEffect } from './IFontEffect';
import {
  PatternFillText,
  deserializePatternFillText,
  serializePatternFillText,
} from './PatternFillText';
import {
  NoiseEffect,
  deserializeNoiseEffect,
  serializeNoiseEffect,
} from './NoiseEffect';
import {
  ShadowText,
  deserializeShadowText,
  serializeShadowText,
} from './ShadowText';
import {
  StrokeText,
  deserializeStrokeText,
  serializeStrokeText,
} from './StrokeText';

export interface FontEffectDefinition {
  type: FontEffectType;
  label: string;
  icon: IconName;
  create: () => IFontEffect;
  serialize: (effect: IFontEffect) => SerializedFontEffect | null;
  deserialize: (value: unknown) => IFontEffect | null;
}

export const fontEffectDefinitions: FontEffectDefinition[] = [
  {
    type: 'group',
    label: 'Group',
    icon: 'layers',
    create: () => new GroupEffect(),
    serialize: (effect) =>
      effect instanceof GroupEffect
        ? serializeGroupEffect(effect, serializeFontEffect)
        : null,
    deserialize: deserializeGroupEffect,
  },
  {
    type: 'fill',
    label: 'Fill',
    icon: 'color-fill',
    create: () => new ColorFillText(),
    serialize: (effect) =>
      effect instanceof ColorFillText ? serializeColorFillText(effect) : null,
    deserialize: deserializeColorFillText,
  },
  {
    type: 'stroke',
    label: 'Stroke',
    icon: 'style',
    create: () => new StrokeText(),
    serialize: (effect) =>
      effect instanceof StrokeText ? serializeStrokeText(effect) : null,
    deserialize: deserializeStrokeText,
  },
  {
    type: 'shadow',
    label: 'Shadow',
    icon: 'moon',
    create: () => new ShadowText(),
    serialize: (effect) =>
      effect instanceof ShadowText ? serializeShadowText(effect) : null,
    deserialize: deserializeShadowText,
  },
  {
    type: 'innerShadow',
    label: 'Inner Shadow',
    icon: 'inner-join',
    create: () => new InnerShadowEffect(),
    serialize: (effect) =>
      effect instanceof InnerShadowEffect
        ? serializeInnerShadowEffect(effect)
        : null,
    deserialize: deserializeInnerShadowEffect,
  },
  {
    type: 'glow',
    label: 'Glow',
    icon: 'highlight',
    create: () => new GlowEffect(),
    serialize: (effect) =>
      effect instanceof GlowEffect ? serializeGlowEffect(effect) : null,
    deserialize: deserializeGlowEffect,
  },
  {
    type: 'blur',
    label: 'Blur',
    icon: 'filter',
    create: () => new BlurEffect(),
    serialize: (effect) =>
      effect instanceof BlurEffect ? serializeBlurEffect(effect) : null,
    deserialize: deserializeBlurEffect,
  },
  {
    type: 'compositeBlend',
    label: 'Composite / Blend',
    icon: 'merge-columns',
    create: () => new CompositeBlendEffect(),
    serialize: (effect) =>
      effect instanceof CompositeBlendEffect
        ? serializeCompositeBlendEffect(effect)
        : null,
    deserialize: deserializeCompositeBlendEffect,
  },
  {
    type: 'patternFill',
    label: 'Pattern Fill',
    icon: 'grid',
    create: () => new PatternFillText(),
    serialize: (effect) =>
      effect instanceof PatternFillText ? serializePatternFillText(effect) : null,
    deserialize: deserializePatternFillText,
  },
  {
    type: 'noise',
    label: 'Noise',
    icon: 'scatter-plot',
    create: () => new NoiseEffect(),
    serialize: (effect) =>
      effect instanceof NoiseEffect ? serializeNoiseEffect(effect) : null,
    deserialize: deserializeNoiseEffect,
  },
  {
    type: 'gradientFill',
    label: 'Gradient Fill',
    icon: 'tint',
    create: () => new GradientFillText(),
    serialize: (effect) =>
      effect instanceof GradientFillText
        ? serializeGradientFillText(effect)
        : null,
    deserialize: deserializeGradientFillText,
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

export function serializeFontEffect(effect: IFontEffect) {
  return fontEffectDefinitionByType.get(effect.type)?.serialize(effect) ?? null;
}

export function deserializeFontEffect(value: unknown) {
  if (!isRecord(value) || typeof value.type !== 'string') return null;

  const definition = fontEffectDefinitionByType.get(value.type as FontEffectType);
  return definition?.deserialize(value) ?? null;
}

function deserializeGroupEffect(value: unknown) {
  if (!isRecord(value)) return null;

  const effect = new GroupEffect(
    readGroupChildren(value)
      .map(deserializeFontEffect)
      .filter((child): child is IFontEffect => child !== null),
  );
  applySerializedGroupFields(effect, value);
  return effect;
}
