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
  FontEffectRenderContext,
  FontEffectType,
  IFontEffect,
} from './IFontEffect';

export class ColorFillText implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'fill';
  color = '#10161A';
  opacity = 1;
  xOffset = 0;
  yOffset = 0;

  constructor() {
    makeAutoObservable(this, { draw: false });
  }

  private drawTo(
    context: CanvasRenderingContext2D,
    position: FontEffectRenderContext['position'],
    text: string,
  ) {
    context.save();
    context.globalAlpha = this.opacity;
    context.fillStyle = this.color;
    context.fillText(
      text,
      position.x + this.xOffset,
      position.y + this.yOffset,
    );
    context.restore();
  }

  draw({ context, position, text }: FontEffectRenderContext) {
    this.drawTo(context, position, text);
  }
}

export interface SerializedColorFillText extends SerializedFontEffect {
  type: 'fill';
  color: string;
  opacity: number;
  xOffset: number;
  yOffset: number;
}

export function serializeColorFillText(
  effect: ColorFillText,
): SerializedColorFillText {
  return {
    type: 'fill',
    color: effect.color,
    opacity: effect.opacity,
    xOffset: effect.xOffset,
    yOffset: effect.yOffset,
  };
}

export function deserializeColorFillText(value: unknown) {
  if (!isRecord(value)) return null;

  const effect = new ColorFillText();
  effect.color = readString(value.color, effect.color);
  effect.opacity = readOpacity(value.opacity, effect.opacity);
  effect.xOffset = readNumber(value.xOffset, effect.xOffset);
  effect.yOffset = readNumber(value.yOffset, effect.yOffset);
  return effect;
}
