import { makeAutoObservable } from 'mobx';
import { createEffectId } from './effectId';
import {
  isRecord,
  readNumber,
  readOpacity,
  readString,
  type SerializedFontEffect,
} from './effectSnapshot';
import type {
  FontEffectKind,
  FontEffectRenderContext,
  FontEffectType,
  IFontEffect,
} from './IFontEffect';

export class ShadowText implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'shadow';
  kind: FontEffectKind = 'post';
  color = '#000000';
  opacity = 1;
  xOffset = 0;
  yOffset = 0;
  shadowBlur = 8;
  shadowOffsetX = 4;
  shadowOffsetY = 4;

  constructor() {
    makeAutoObservable(this, { draw: false });
  }

  draw({ endShadowGroup }: FontEffectRenderContext) {
    endShadowGroup(this);
  }
}

export interface SerializedShadowText extends SerializedFontEffect {
  type: 'shadow';
  color: string;
  opacity: number;
  xOffset: number;
  yOffset: number;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

export function serializeShadowText(effect: ShadowText): SerializedShadowText {
  return {
    type: 'shadow',
    color: effect.color,
    opacity: effect.opacity,
    xOffset: effect.xOffset,
    yOffset: effect.yOffset,
    shadowBlur: effect.shadowBlur,
    shadowOffsetX: effect.shadowOffsetX,
    shadowOffsetY: effect.shadowOffsetY,
  };
}

export function deserializeShadowText(value: unknown) {
  if (!isRecord(value)) return null;

  const effect = new ShadowText();
  effect.color = readString(value.color, effect.color);
  effect.opacity = readOpacity(value.opacity, effect.opacity);
  effect.xOffset = readNumber(value.xOffset, effect.xOffset);
  effect.yOffset = readNumber(value.yOffset, effect.yOffset);
  effect.shadowBlur = readNumber(value.shadowBlur, effect.shadowBlur, 0);
  effect.shadowOffsetX = readNumber(value.shadowOffsetX, effect.shadowOffsetX);
  effect.shadowOffsetY = readNumber(value.shadowOffsetY, effect.shadowOffsetY);
  return effect;
}
