import { makeAutoObservable } from 'mobx';
import { createEffectId } from './effectId';
import {
  isRecord,
  readClampedNumber,
  readCollapsed,
  readNumber,
  readOpacity,
  readVisible,
  type SerializedFontEffect,
} from './effectSnapshot';
import type {
  FontEffectRenderContext,
  FontEffectType,
  IFontEffect,
} from './IFontEffect';

const MIN_ITERATIONS = 1;
const MAX_ITERATIONS = 8;

function clampIterations(value: number) {
  return Math.round(Math.max(MIN_ITERATIONS, Math.min(MAX_ITERATIONS, value)));
}

export class BlurEffect implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'blur';
  visible = true;
  collapsed = true;
  opacity = 1;
  radius = 6;
  iterations = 1;

  constructor() {
    makeAutoObservable(this, { draw: false });
  }

  draw({ context, createBufferCanvas, width, height }: FontEffectRenderContext) {
    const sourceCanvas = createBufferCanvas();
    const sourceContext = sourceCanvas.getContext('2d');
    if (!sourceContext) return;

    sourceContext.drawImage(context.canvas, 0, 0);

    const firstBuffer = createBufferCanvas();
    const secondBuffer = createBufferCanvas();
    const firstContext = firstBuffer.getContext('2d');
    const secondContext = secondBuffer.getContext('2d');
    if (!firstContext || !secondContext) return;

    let currentCanvas = sourceCanvas;
    for (let i = 0; i < clampIterations(this.iterations); i += 1) {
      const targetCanvas = i % 2 === 0 ? firstBuffer : secondBuffer;
      const targetContext = i % 2 === 0 ? firstContext : secondContext;
      targetContext.clearRect(0, 0, width, height);
      targetContext.filter = this.radius > 0 ? `blur(${this.radius}px)` : 'none';
      targetContext.drawImage(currentCanvas, 0, 0);
      targetContext.filter = 'none';
      currentCanvas = targetCanvas;
    }

    context.save();
    context.clearRect(0, 0, width, height);
    context.globalAlpha = this.opacity;
    context.drawImage(currentCanvas, 0, 0);
    context.restore();
  }
}

export interface SerializedBlurEffect extends SerializedFontEffect {
  type: 'blur';
  visible: boolean;
  collapsed: boolean;
  opacity: number;
  radius: number;
  iterations: number;
}

export function serializeBlurEffect(effect: BlurEffect): SerializedBlurEffect {
  return {
    type: 'blur',
    visible: effect.visible,
    collapsed: effect.collapsed,
    opacity: effect.opacity,
    radius: effect.radius,
    iterations: effect.iterations,
  };
}

export function deserializeBlurEffect(value: unknown) {
  if (!isRecord(value)) return null;

  const effect = new BlurEffect();
  effect.visible = readVisible(value.visible, effect.visible);
  effect.collapsed = readCollapsed(value.collapsed, effect.collapsed);
  effect.opacity = readOpacity(value.opacity, effect.opacity);
  effect.radius = readNumber(value.radius, effect.radius, 0);
  effect.iterations = readClampedNumber(
    value.iterations,
    effect.iterations,
    MIN_ITERATIONS,
    MAX_ITERATIONS,
  );
  return effect;
}
