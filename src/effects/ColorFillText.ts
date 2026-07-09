import { makeAutoObservable } from 'mobx';
import type { TextPosition } from '../store/fontStore';
import { createEffectId } from './effectId';
import {
  isRecord,
  readNumber,
  readString,
  type SerializedFontEffect,
} from './effectSnapshot';
import type { FontEffectType, IFontEffect } from './IFontEffect';

export class ColorFillText implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'fill';
  color = '#10161A';
  xOffset = 0;
  yOffset = 0;

  constructor() {
    makeAutoObservable(this, { draw: false });
  }

  draw(text: string, context: CanvasRenderingContext2D, position: TextPosition) {
    context.save();
    context.fillStyle = this.color;
    context.fillText(
      text,
      position.x + this.xOffset,
      position.y + this.yOffset,
    );
    context.restore();
  }
}

export interface SerializedColorFillText extends SerializedFontEffect {
  type: 'fill';
  color: string;
  xOffset: number;
  yOffset: number;
}

export function serializeColorFillText(
  effect: ColorFillText,
): SerializedColorFillText {
  return {
    type: 'fill',
    color: effect.color,
    xOffset: effect.xOffset,
    yOffset: effect.yOffset,
  };
}

export function deserializeColorFillText(value: unknown) {
  if (!isRecord(value)) return null;

  const effect = new ColorFillText();
  effect.color = readString(value.color, effect.color);
  effect.xOffset = readNumber(value.xOffset, effect.xOffset);
  effect.yOffset = readNumber(value.yOffset, effect.yOffset);
  return effect;
}
