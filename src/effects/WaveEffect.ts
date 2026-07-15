import { makeAutoObservable } from 'mobx';
import { createEffectId } from './effectId';
import {
  isRecord,
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

export type WaveDirection = 'horizontal' | 'vertical' | 'both';

export const WAVE_DIRECTIONS = [
  'horizontal',
  'vertical',
  'both',
] as const satisfies readonly WaveDirection[];

function readWaveDirection(value: unknown, fallback: WaveDirection) {
  return typeof value === 'string' &&
    WAVE_DIRECTIONS.includes(value as WaveDirection)
    ? (value as WaveDirection)
    : fallback;
}

function readChannel(
  source: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  channel: number,
) {
  return source[(y * width + x) * 4 + channel];
}

function sampleBilinear(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  if (x0 < 0 || y0 < 0 || x1 >= width || y1 >= height) {
    return null;
  }

  const tx = x - x0;
  const ty = y - y0;
  const topWeight = 1 - ty;
  const bottomWeight = ty;
  const leftWeight = 1 - tx;
  const rightWeight = tx;
  const weights = [
    leftWeight * topWeight,
    rightWeight * topWeight,
    leftWeight * bottomWeight,
    rightWeight * bottomWeight,
  ] as const;
  const points = [
    [x0, y0],
    [x1, y0],
    [x0, y1],
    [x1, y1],
  ] as const;
  let alpha = 0;
  let red = 0;
  let green = 0;
  let blue = 0;

  for (let i = 0; i < points.length; i += 1) {
    const [pointX, pointY] = points[i];
    const weight = weights[i];
    const pointAlpha = readChannel(source, width, pointX, pointY, 3) / 255;
    alpha += pointAlpha * weight;
    red += readChannel(source, width, pointX, pointY, 0) * pointAlpha * weight;
    green += readChannel(source, width, pointX, pointY, 1) * pointAlpha * weight;
    blue += readChannel(source, width, pointX, pointY, 2) * pointAlpha * weight;
  }

  if (alpha <= 0) return [0, 0, 0, 0] as const;

  return [
    red / alpha,
    green / alpha,
    blue / alpha,
    alpha * 255,
  ] as const;
}

export class WaveEffect implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'wave';
  visible = true;
  collapsed = true;
  opacity = 1;
  direction: WaveDirection = 'horizontal';
  amplitude = 12;
  wavelength = 96;
  phase = 0;

  constructor() {
    makeAutoObservable(this, { draw: false });
  }

  draw({ context, createBufferCanvas, width, height }: FontEffectRenderContext) {
    const sourceImage = context.getImageData(0, 0, width, height);
    const outputImage = context.createImageData(width, height);
    const source = sourceImage.data;
    const output = outputImage.data;
    const wavelength = Math.max(1, this.wavelength);
    const phase = (this.phase * Math.PI) / 180;
    const waveFactor = (Math.PI * 2) / wavelength;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const horizontalOffset =
          this.direction === 'horizontal' || this.direction === 'both'
            ? Math.sin(y * waveFactor + phase) * this.amplitude
            : 0;
        const verticalOffset =
          this.direction === 'vertical' || this.direction === 'both'
            ? Math.sin(x * waveFactor + phase) * this.amplitude
            : 0;
        const pixel = sampleBilinear(
          source,
          width,
          height,
          x - horizontalOffset,
          y - verticalOffset,
        );
        if (pixel == null) continue;

        const outputIndex = (y * width + x) * 4;
        output[outputIndex] = pixel[0];
        output[outputIndex + 1] = pixel[1];
        output[outputIndex + 2] = pixel[2];
        output[outputIndex + 3] = pixel[3];
      }
    }

    const outputCanvas = createBufferCanvas();
    const outputContext = outputCanvas.getContext('2d');
    if (!outputContext) return;
    outputContext.putImageData(outputImage, 0, 0);

    context.clearRect(0, 0, width, height);
    context.save();
    context.globalAlpha = this.opacity;
    context.drawImage(outputCanvas, 0, 0);
    context.restore();
  }
}

export interface SerializedWaveEffect extends SerializedFontEffect {
  type: 'wave';
  visible: boolean;
  collapsed: boolean;
  opacity: number;
  direction: WaveDirection;
  amplitude: number;
  wavelength: number;
  phase: number;
}

export function serializeWaveEffect(effect: WaveEffect): SerializedWaveEffect {
  return {
    type: 'wave',
    visible: effect.visible,
    collapsed: effect.collapsed,
    opacity: effect.opacity,
    direction: effect.direction,
    amplitude: effect.amplitude,
    wavelength: effect.wavelength,
    phase: effect.phase,
  };
}

export function deserializeWaveEffect(value: unknown) {
  if (!isRecord(value)) return null;

  const effect = new WaveEffect();
  effect.visible = readVisible(value.visible, effect.visible);
  effect.collapsed = readCollapsed(value.collapsed, effect.collapsed);
  effect.opacity = readOpacity(value.opacity, effect.opacity);
  effect.direction = readWaveDirection(value.direction, effect.direction);
  effect.amplitude = readNumber(value.amplitude, effect.amplitude, 0);
  effect.wavelength = readNumber(value.wavelength, effect.wavelength, 1);
  effect.phase = readNumber(value.phase, effect.phase);
  return effect;
}
