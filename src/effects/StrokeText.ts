import { makeAutoObservable } from 'mobx';
import type { TextPosition } from '../store/fontStore';
import { createEffectId } from './effectId';
import {
  isRecord,
  readLineCap,
  readLineDash,
  readLineJoin,
  readNumber,
  readString,
  type SerializedFontEffect,
} from './effectSnapshot';
import type { FontEffectType, IFontEffect } from './IFontEffect';

export class StrokeText implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'stroke';
  color = '#10161A';
  xOffset = 0;
  yOffset = 0;
  lineWidth = 2;
  lineCap: CanvasLineCap = 'butt';
  lineJoin: CanvasLineJoin = 'miter';
  miterLimit = 10;
  lineDash: number[] = [];
  lineDashOffset = 0;

  constructor() {
    makeAutoObservable(this, { draw: false });
  }

  draw(text: string, context: CanvasRenderingContext2D, position: TextPosition) {
    context.save();
    context.strokeStyle = this.color;
    context.lineWidth = this.lineWidth;
    context.lineCap = this.lineCap;
    context.lineJoin = this.lineJoin;
    context.miterLimit = this.miterLimit;
    context.setLineDash(this.lineDash);
    context.lineDashOffset = this.lineDashOffset;
    context.strokeText(
      text,
      position.x + this.xOffset,
      position.y + this.yOffset,
    );
    context.restore();
  }
}

export interface SerializedStrokeText extends SerializedFontEffect {
  type: 'stroke';
  color: string;
  xOffset: number;
  yOffset: number;
  lineWidth: number;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  miterLimit: number;
  lineDash: number[];
  lineDashOffset: number;
}

export function serializeStrokeText(effect: StrokeText): SerializedStrokeText {
  return {
    type: 'stroke',
    color: effect.color,
    xOffset: effect.xOffset,
    yOffset: effect.yOffset,
    lineWidth: effect.lineWidth,
    lineCap: effect.lineCap,
    lineJoin: effect.lineJoin,
    miterLimit: effect.miterLimit,
    lineDash: [...effect.lineDash],
    lineDashOffset: effect.lineDashOffset,
  };
}

export function deserializeStrokeText(value: unknown) {
  if (!isRecord(value)) return null;

  const effect = new StrokeText();
  effect.color = readString(value.color, effect.color);
  effect.xOffset = readNumber(value.xOffset, effect.xOffset);
  effect.yOffset = readNumber(value.yOffset, effect.yOffset);
  effect.lineWidth = readNumber(value.lineWidth, effect.lineWidth, 0);
  effect.lineCap = readLineCap(value.lineCap, effect.lineCap);
  effect.lineJoin = readLineJoin(value.lineJoin, effect.lineJoin);
  effect.miterLimit = readNumber(value.miterLimit, effect.miterLimit, 0);
  effect.lineDash = readLineDash(value.lineDash, effect.lineDash);
  effect.lineDashOffset = readNumber(
    value.lineDashOffset,
    effect.lineDashOffset,
  );
  return effect;
}
