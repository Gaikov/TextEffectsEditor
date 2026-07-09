import { makeAutoObservable } from 'mobx';
import { createEffectId } from './effectId';
import {
  isRecord,
  readLineCap,
  readLineDash,
  readLineJoin,
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

export class StrokeText implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'stroke';
  kind: FontEffectKind = 'content';
  color = '#10161A';
  opacity = 1;
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

  private drawTo(
    context: CanvasRenderingContext2D,
    position: FontEffectRenderContext['position'],
    text: string,
  ) {
    context.save();
    context.globalAlpha = this.opacity;
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

  draw({
    getCurrentTargetContext,
    position,
    text,
  }: FontEffectRenderContext) {
    this.drawTo(getCurrentTargetContext(), position, text);
  }
}

export interface SerializedStrokeText extends SerializedFontEffect {
  type: 'stroke';
  color: string;
  opacity: number;
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
    opacity: effect.opacity,
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
  effect.opacity = readOpacity(value.opacity, effect.opacity);
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
