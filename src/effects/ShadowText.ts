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

export class ShadowText implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'shadow';
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

  draw({ context, createBufferCanvas, width, height }: FontEffectRenderContext) {
    const sourceCanvas = createBufferCanvas();
    const sourceContext = sourceCanvas.getContext('2d');
    if (!sourceContext) return;

    sourceContext.drawImage(context.canvas, 0, 0);

    const shadowCanvas = createBufferCanvas();
    const shadowContext = shadowCanvas.getContext('2d');
    if (!shadowContext) return;

    shadowContext.filter =
      this.shadowBlur > 0 ? `blur(${this.shadowBlur}px)` : 'none';
    shadowContext.drawImage(
      sourceCanvas,
      this.xOffset + this.shadowOffsetX,
      this.yOffset + this.shadowOffsetY,
    );
    shadowContext.filter = 'none';
    shadowContext.globalCompositeOperation = 'source-in';
    shadowContext.fillStyle = this.color;
    shadowContext.fillRect(0, 0, width, height);

    context.save();
    context.clearRect(0, 0, width, height);
    context.globalAlpha = this.opacity;
    context.drawImage(shadowCanvas, 0, 0);
    context.globalAlpha = 1;
    context.drawImage(sourceCanvas, 0, 0);
    context.restore();
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
