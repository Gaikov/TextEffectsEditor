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

export type DistortNoiseType = 'value' | 'fractal' | 'cellular';

export const DISTORT_NOISE_TYPES = [
  'value',
  'fractal',
  'cellular',
] as const satisfies readonly DistortNoiseType[];

function readDistortNoiseType(
  value: unknown,
  fallback: DistortNoiseType,
) {
  return typeof value === 'string' &&
    DISTORT_NOISE_TYPES.includes(value as DistortNoiseType)
    ? (value as DistortNoiseType)
    : fallback;
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hash2(x: number, y: number, seed: number) {
  let value =
    Math.imul(x, 374761393) ^
    Math.imul(y, 668265263) ^
    Math.imul(seed, 2147483647);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function valueNoise(x: number, y: number, seed: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const xf = smoothstep(x - x0);
  const yf = smoothstep(y - y0);
  const n00 = hash2(x0, y0, seed);
  const n10 = hash2(x0 + 1, y0, seed);
  const n01 = hash2(x0, y0 + 1, seed);
  const n11 = hash2(x0 + 1, y0 + 1, seed);
  return mix(mix(n00, n10, xf), mix(n01, n11, xf), yf);
}

function fractalNoise(
  x: number,
  y: number,
  seed: number,
  octaves: number,
  persistence: number,
  lacunarity: number,
) {
  let amplitude = 1;
  let frequency = 1;
  let sum = 0;
  let total = 0;
  for (let i = 0; i < octaves; i += 1) {
    sum += valueNoise(x * frequency, y * frequency, seed + i * 1013) * amplitude;
    total += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  return total > 0 ? sum / total : 0;
}

function cellularNoise(x: number, y: number, seed: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  let minDistance = Number.POSITIVE_INFINITY;
  for (let yy = -1; yy <= 1; yy += 1) {
    for (let xx = -1; xx <= 1; xx += 1) {
      const cellX = x0 + xx;
      const cellY = y0 + yy;
      const pointX = cellX + hash2(cellX, cellY, seed);
      const pointY = cellY + hash2(cellX, cellY, seed + 17);
      const distance = Math.hypot(pointX - x, pointY - y);
      minDistance = Math.min(minDistance, distance);
    }
  }
  return Math.max(0, Math.min(1, 1 - minDistance));
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
  const weights = [
    (1 - tx) * (1 - ty),
    tx * (1 - ty),
    (1 - tx) * ty,
    tx * ty,
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

  return [red / alpha, green / alpha, blue / alpha, alpha * 255] as const;
}

export class DistortEffect implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'distort';
  visible = true;
  collapsed = true;
  opacity = 1;
  noiseType: DistortNoiseType = 'fractal';
  seed = 1;
  strength = 16;
  grainSize = 48;
  scale = 1;
  xAmount = 1;
  yAmount = 1;
  rotation = 0;
  octaves = 4;
  persistence = 0.5;
  lacunarity = 2;

  constructor() {
    makeAutoObservable(this, { draw: false });
  }

  private sampleNoise(x: number, y: number, seed: number) {
    const grainSize = Math.max(1, this.grainSize);
    const scale = Math.max(0.01, this.scale);
    const angle = (-this.rotation * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const sampleX = (x * cos - y * sin) / grainSize / scale;
    const sampleY = (x * sin + y * cos) / grainSize / scale;

    if (this.noiseType === 'value') {
      return valueNoise(sampleX, sampleY, seed);
    }
    if (this.noiseType === 'cellular') {
      return cellularNoise(sampleX, sampleY, seed);
    }
    return fractalNoise(
      sampleX,
      sampleY,
      seed,
      Math.max(1, Math.round(this.octaves)),
      this.persistence,
      this.lacunarity,
    );
  }

  draw({ context, createBufferCanvas, width, height }: FontEffectRenderContext) {
    const sourceImage = context.getImageData(0, 0, width, height);
    const outputImage = context.createImageData(width, height);
    const source = sourceImage.data;
    const output = outputImage.data;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const xNoise = this.sampleNoise(x, y, this.seed);
        const yNoise = this.sampleNoise(x, y, this.seed + 4099);
        const xOffset = (xNoise - 0.5) * 2 * this.strength * this.xAmount;
        const yOffset = (yNoise - 0.5) * 2 * this.strength * this.yAmount;
        const pixel = sampleBilinear(
          source,
          width,
          height,
          x - xOffset,
          y - yOffset,
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

export interface SerializedDistortEffect extends SerializedFontEffect {
  type: 'distort';
  visible: boolean;
  collapsed: boolean;
  opacity: number;
  noiseType: DistortNoiseType;
  seed: number;
  strength: number;
  grainSize: number;
  scale: number;
  xAmount: number;
  yAmount: number;
  rotation: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
}

export function serializeDistortEffect(
  effect: DistortEffect,
): SerializedDistortEffect {
  return {
    type: 'distort',
    visible: effect.visible,
    collapsed: effect.collapsed,
    opacity: effect.opacity,
    noiseType: effect.noiseType,
    seed: effect.seed,
    strength: effect.strength,
    grainSize: effect.grainSize,
    scale: effect.scale,
    xAmount: effect.xAmount,
    yAmount: effect.yAmount,
    rotation: effect.rotation,
    octaves: effect.octaves,
    persistence: effect.persistence,
    lacunarity: effect.lacunarity,
  };
}

export function deserializeDistortEffect(value: unknown) {
  if (!isRecord(value)) return null;

  const effect = new DistortEffect();
  effect.visible = readVisible(value.visible, effect.visible);
  effect.collapsed = readCollapsed(value.collapsed, effect.collapsed);
  effect.opacity = readOpacity(value.opacity, effect.opacity);
  effect.noiseType = readDistortNoiseType(value.noiseType, effect.noiseType);
  effect.seed = Math.round(readNumber(value.seed, effect.seed));
  effect.strength = readNumber(value.strength, effect.strength, 0);
  effect.grainSize = readNumber(value.grainSize, effect.grainSize, 1);
  effect.scale = readNumber(value.scale, effect.scale, 0.01);
  effect.xAmount = readNumber(value.xAmount, effect.xAmount);
  effect.yAmount = readNumber(value.yAmount, effect.yAmount);
  effect.rotation = readNumber(value.rotation, effect.rotation);
  effect.octaves = readClampedNumber(value.octaves, effect.octaves, 1, 8);
  effect.persistence = readClampedNumber(
    value.persistence,
    effect.persistence,
    0,
    1,
  );
  effect.lacunarity = readNumber(value.lacunarity, effect.lacunarity, 1);
  return effect;
}
