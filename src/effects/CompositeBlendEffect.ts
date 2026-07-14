import { makeAutoObservable } from 'mobx';
import { createEffectId } from './effectId';
import {
  isRecord,
  readCollapsed,
  readOpacity,
  readVisible,
  type SerializedFontEffect,
} from './effectSnapshot';
import type {
  FontEffectRenderContext,
  FontEffectType,
  IFontEffect,
} from './IFontEffect';

export const COMPOSITE_BLEND_OPERATIONS = [
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
  'source-over',
  'source-atop',
  'destination-over',
  'destination-atop',
  'destination-out',
  'lighter',
  'copy',
  'xor',
] as const satisfies readonly GlobalCompositeOperation[];

export type CompositeBlendOperation =
  (typeof COMPOSITE_BLEND_OPERATIONS)[number];

function readCompositeBlendOperation(
  value: unknown,
  fallback: CompositeBlendOperation,
) {
  return typeof value === 'string' &&
    COMPOSITE_BLEND_OPERATIONS.includes(value as CompositeBlendOperation)
    ? (value as CompositeBlendOperation)
    : fallback;
}

export class CompositeBlendEffect implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'compositeBlend';
  visible = true;
  collapsed = true;
  opacity = 0.5;
  operation: CompositeBlendOperation = 'multiply';

  constructor() {
    makeAutoObservable(this, { draw: false });
  }

  draw({ context, createBufferCanvas }: FontEffectRenderContext) {
    const sourceCanvas = createBufferCanvas();
    const sourceContext = sourceCanvas.getContext('2d');
    if (!sourceContext) return;

    sourceContext.drawImage(context.canvas, 0, 0);

    context.save();
    context.globalAlpha = this.opacity;
    context.globalCompositeOperation = this.operation;
    context.drawImage(sourceCanvas, 0, 0);
    context.restore();
  }
}

export interface SerializedCompositeBlendEffect extends SerializedFontEffect {
  type: 'compositeBlend';
  visible: boolean;
  collapsed: boolean;
  opacity: number;
  operation: CompositeBlendOperation;
}

export function serializeCompositeBlendEffect(
  effect: CompositeBlendEffect,
): SerializedCompositeBlendEffect {
  return {
    type: 'compositeBlend',
    visible: effect.visible,
    collapsed: effect.collapsed,
    opacity: effect.opacity,
    operation: effect.operation,
  };
}

export function deserializeCompositeBlendEffect(value: unknown) {
  if (!isRecord(value)) return null;

  const effect = new CompositeBlendEffect();
  effect.visible = readVisible(value.visible, effect.visible);
  effect.collapsed = readCollapsed(value.collapsed, effect.collapsed);
  effect.opacity = readOpacity(value.opacity, effect.opacity);
  effect.operation = readCompositeBlendOperation(value.operation, effect.operation);
  return effect;
}
