import { makeAutoObservable } from 'mobx';
import { createEffectId } from './effectId';
import {
  isRecord,
  readClampedNumber,
  readCollapsed,
  readNumber,
  readOpacity,
  readString,
  readVisible,
  type SerializedFontEffect,
} from './effectSnapshot';
import type {
  FontEffectRenderContext,
  FontEffectType,
  IFontEffect,
} from './IFontEffect';

const MIN_SPREAD = 1;
const MAX_SPREAD = 8;

function clampSpread(value: number) {
  return Math.round(Math.max(MIN_SPREAD, Math.min(MAX_SPREAD, value)));
}

export class GlowEffect implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'glow';
  visible = true;
  collapsed = true;
  color = '#2D72D2';
  opacity = 1;
  blur = 12;
  spread = 1;

  constructor() {
    makeAutoObservable(this, { draw: false });
  }

  draw({ context, createBufferCanvas, width, height }: FontEffectRenderContext) {
    const sourceCanvas = createBufferCanvas();
    const sourceContext = sourceCanvas.getContext('2d');
    if (!sourceContext) return;

    sourceContext.drawImage(context.canvas, 0, 0);

    const glowCanvas = createBufferCanvas();
    const glowContext = glowCanvas.getContext('2d');
    if (!glowContext) return;

    glowContext.filter = this.blur > 0 ? `blur(${this.blur}px)` : 'none';
    glowContext.drawImage(sourceCanvas, 0, 0);
    glowContext.filter = 'none';
    glowContext.globalCompositeOperation = 'source-in';
    glowContext.fillStyle = this.color;
    glowContext.fillRect(0, 0, width, height);

    context.save();
    context.clearRect(0, 0, width, height);
    context.globalAlpha = this.opacity;
    for (let i = 0; i < clampSpread(this.spread); i += 1) {
      context.drawImage(glowCanvas, 0, 0);
    }
    context.globalAlpha = 1;
    context.drawImage(sourceCanvas, 0, 0);
    context.restore();
  }
}

export interface SerializedGlowEffect extends SerializedFontEffect {
  type: 'glow';
  visible: boolean;
  collapsed: boolean;
  color: string;
  opacity: number;
  blur: number;
  spread: number;
}

export function serializeGlowEffect(effect: GlowEffect): SerializedGlowEffect {
  return {
    type: 'glow',
    visible: effect.visible,
    collapsed: effect.collapsed,
    color: effect.color,
    opacity: effect.opacity,
    blur: effect.blur,
    spread: effect.spread,
  };
}

export function deserializeGlowEffect(value: unknown) {
  if (!isRecord(value)) return null;

  const effect = new GlowEffect();
  effect.visible = readVisible(value.visible, effect.visible);
  effect.collapsed = readCollapsed(value.collapsed, effect.collapsed);
  effect.color = readString(value.color, effect.color);
  effect.opacity = readOpacity(value.opacity, effect.opacity);
  effect.blur = readNumber(value.blur, effect.blur, 0);
  effect.spread = readClampedNumber(
    value.spread,
    effect.spread,
    MIN_SPREAD,
    MAX_SPREAD,
  );
  return effect;
}
