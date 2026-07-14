import { makeAutoObservable } from 'mobx';
import { createEffectId } from './effectId';
import {
  isRecord,
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

export class InnerShadowEffect implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'innerShadow';
  visible = true;
  collapsed = true;
  color = '#000000';
  opacity = 0.55;
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

    const outsideCanvas = createBufferCanvas();
    const outsideContext = outsideCanvas.getContext('2d');
    if (!outsideContext) return;

    outsideContext.fillStyle = '#000000';
    outsideContext.fillRect(0, 0, width, height);
    outsideContext.globalCompositeOperation = 'destination-out';
    outsideContext.drawImage(sourceCanvas, 0, 0);

    const blurredOutsideCanvas = createBufferCanvas();
    const blurredOutsideContext = blurredOutsideCanvas.getContext('2d');
    if (!blurredOutsideContext) return;

    blurredOutsideContext.filter =
      this.shadowBlur > 0 ? `blur(${this.shadowBlur}px)` : 'none';
    blurredOutsideContext.drawImage(
      outsideCanvas,
      this.xOffset + this.shadowOffsetX,
      this.yOffset + this.shadowOffsetY,
    );
    blurredOutsideContext.filter = 'none';

    const shadowCanvas = createBufferCanvas();
    const shadowContext = shadowCanvas.getContext('2d');
    if (!shadowContext) return;

    shadowContext.drawImage(blurredOutsideCanvas, 0, 0);
    shadowContext.globalCompositeOperation = 'source-in';
    shadowContext.fillStyle = this.color;
    shadowContext.fillRect(0, 0, width, height);
    shadowContext.globalCompositeOperation = 'destination-in';
    shadowContext.drawImage(sourceCanvas, 0, 0);

    context.save();
    context.clearRect(0, 0, width, height);
    context.drawImage(sourceCanvas, 0, 0);
    context.globalAlpha = this.opacity;
    context.drawImage(shadowCanvas, 0, 0);
    context.restore();
  }
}

export interface SerializedInnerShadowEffect extends SerializedFontEffect {
  type: 'innerShadow';
  visible: boolean;
  collapsed: boolean;
  color: string;
  opacity: number;
  xOffset: number;
  yOffset: number;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

export function serializeInnerShadowEffect(
  effect: InnerShadowEffect,
): SerializedInnerShadowEffect {
  return {
    type: 'innerShadow',
    visible: effect.visible,
    collapsed: effect.collapsed,
    color: effect.color,
    opacity: effect.opacity,
    xOffset: effect.xOffset,
    yOffset: effect.yOffset,
    shadowBlur: effect.shadowBlur,
    shadowOffsetX: effect.shadowOffsetX,
    shadowOffsetY: effect.shadowOffsetY,
  };
}

export function deserializeInnerShadowEffect(value: unknown) {
  if (!isRecord(value)) return null;

  const effect = new InnerShadowEffect();
  effect.visible = readVisible(value.visible, effect.visible);
  effect.collapsed = readCollapsed(value.collapsed, effect.collapsed);
  effect.color = readString(value.color, effect.color);
  effect.opacity = readOpacity(value.opacity, effect.opacity);
  effect.xOffset = readNumber(value.xOffset, effect.xOffset);
  effect.yOffset = readNumber(value.yOffset, effect.yOffset);
  effect.shadowBlur = readNumber(value.shadowBlur, effect.shadowBlur, 0);
  effect.shadowOffsetX = readNumber(value.shadowOffsetX, effect.shadowOffsetX);
  effect.shadowOffsetY = readNumber(value.shadowOffsetY, effect.shadowOffsetY);
  return effect;
}
