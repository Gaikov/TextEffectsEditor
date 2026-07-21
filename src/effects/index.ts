import type { IconName } from '@blueprintjs/core';
import { makeAutoObservable } from 'mobx';
import {
  GroupEffect,
  createFontEffect as createDomainFontEffect,
  deserializeFontEffect as deserializeDomainFontEffect,
  fontEffectDefinitions as domainFontEffectDefinitions,
  type FontEffectType,
  type IFontEffect,
} from 'grom-font-effects';

export * from 'grom-font-effects';

const EFFECT_ICONS = {
  blur: 'filter',
  compositeBlend: 'merge-columns',
  distort: 'random',
  fill: 'color-fill',
  glow: 'highlight',
  gradientFill: 'tint',
  group: 'layers',
  innerShadow: 'inner-join',
  noise: 'scatter-plot',
  patternFill: 'grid',
  shadow: 'moon',
  stroke: 'style',
  wave: 'waves',
} satisfies Record<FontEffectType, IconName>;

export const fontEffectDefinitions = domainFontEffectDefinitions.map(
  (definition) => ({
    ...definition,
    create: () => createFontEffect(definition.type),
    icon: EFFECT_ICONS[definition.type],
  }),
);

export function makeEffectObservable(effect: IFontEffect) {
  makeAutoObservable(effect, { draw: false });
  if (effect instanceof GroupEffect) {
    effect.children.forEach(makeEffectObservable);
  }
  return effect;
}

export function createFontEffect(type: FontEffectType) {
  return makeEffectObservable(createDomainFontEffect(type));
}

export function deserializeFontEffect(value: unknown) {
  const effect = deserializeDomainFontEffect(value);
  return effect ? makeEffectObservable(effect) : null;
}
