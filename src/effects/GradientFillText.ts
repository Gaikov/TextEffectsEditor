import { makeAutoObservable } from 'mobx';
import { createEffectId } from './effectId';
import {
  isRecord,
  readNumber,
  readOpacity,
  readString,
  readStringArray,
  type SerializedFontEffect,
} from './effectSnapshot';
import type {
  FontEffectKind,
  FontEffectRenderContext,
  FontEffectType,
  IFontEffect,
} from './IFontEffect';

export type GradientFillDirection = 'horizontal' | 'vertical';

function readGradientFillDirection(
  value: unknown,
  fallback: GradientFillDirection,
): GradientFillDirection {
  return value === 'horizontal' || value === 'vertical' ? value : fallback;
}

function parseFontSize(font: string) {
  const match = font.match(/(\d+(?:\.\d+)?)px/);
  return match ? Number(match[1]) : 16;
}

function getTextBounds(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
) {
  const metrics = context.measureText(text);
  const fontSize = parseFontSize(context.font);
  const left = x - (metrics.actualBoundingBoxLeft || metrics.width / 2);
  const right = x + (metrics.actualBoundingBoxRight || metrics.width / 2);
  const top = y - (metrics.actualBoundingBoxAscent || fontSize / 2);
  const bottom = y + (metrics.actualBoundingBoxDescent || fontSize / 2);

  return { left, right, top, bottom };
}

export class GradientFillText implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'gradientFill';
  kind: FontEffectKind = 'content';
  opacity = 1;
  xOffset = 0;
  yOffset = 0;
  colors = ['#106BA3', '#DB2C6F'];
  direction: GradientFillDirection = 'horizontal';

  constructor() {
    makeAutoObservable(this, { draw: false });
  }

  private drawTo(
    context: CanvasRenderingContext2D,
    position: FontEffectRenderContext['position'],
    text: string,
  ) {
    const x = position.x + this.xOffset;
    const y = position.y + this.yOffset;
    const bounds = getTextBounds(context, text, x, y);

    context.save();
    context.globalAlpha = this.opacity;

    const gradient =
      this.direction === 'vertical'
        ? context.createLinearGradient(0, bounds.top, 0, bounds.bottom)
        : context.createLinearGradient(bounds.left, 0, bounds.right, 0);
    const colors = this.colors.length > 0 ? this.colors : ['#10161A'];
    const denominator = Math.max(1, colors.length - 1);
    colors.forEach((color, index) => {
      gradient.addColorStop(index / denominator, color);
    });
    context.fillStyle = gradient;
    context.fillText(text, x, y);
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

export interface SerializedGradientFillText extends SerializedFontEffect {
  type: 'gradientFill';
  opacity: number;
  xOffset: number;
  yOffset: number;
  colors: string[];
  direction: GradientFillDirection;
}

export function serializeGradientFillText(
  effect: GradientFillText,
): SerializedGradientFillText {
  return {
    type: 'gradientFill',
    opacity: effect.opacity,
    xOffset: effect.xOffset,
    yOffset: effect.yOffset,
    colors: [...effect.colors],
    direction: effect.direction,
  };
}

export function deserializeGradientFillText(value: unknown) {
  if (!isRecord(value)) return null;

  const effect = new GradientFillText();
  effect.opacity = readOpacity(value.opacity, effect.opacity);
  effect.xOffset = readNumber(value.xOffset, effect.xOffset);
  effect.yOffset = readNumber(value.yOffset, effect.yOffset);
  const legacyColors = [
    readString(value.startColor, effect.colors[0]),
    readString(value.endColor, effect.colors[1]),
  ];
  effect.colors = readStringArray(value.colors, legacyColors);
  effect.direction = readGradientFillDirection(
    value.direction,
    effect.direction,
  );
  return effect;
}
