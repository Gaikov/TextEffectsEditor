import { makeAutoObservable } from 'mobx';
import { createEffectId } from './effectId';
import {
  isRecord,
  readBoolean,
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

export type NoiseType = 'value' | 'fractal' | 'cellular' | 'speckle';

export const NOISE_TYPES = [
  'value',
  'fractal',
  'cellular',
  'speckle',
] as const satisfies readonly NoiseType[];

function readNoiseType(value: unknown, fallback: NoiseType) {
  return typeof value === 'string' && NOISE_TYPES.includes(value as NoiseType)
    ? (value as NoiseType)
    : fallback;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
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
  return clamp01(1 - minDistance);
}

function hexToRgb(color: string) {
  const value = color.trim().replace(/^#/, '');
  const normalized =
    value.length === 3
      ? value.split('').map((char) => char + char).join('')
      : value.padEnd(6, '0').slice(0, 6);
  const number = Number.parseInt(normalized, 16);
  if (!Number.isFinite(number)) return { r: 0, g: 0, b: 0 };
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  };
}

function shapeNoiseValue(
  value: number,
  density: number,
  contrast: number,
  threshold: number,
  softness: number,
  invert: boolean,
) {
  let nextValue = invert ? 1 - value : value;
  nextValue = (nextValue - 0.5) * (1 + contrast * 3) + 0.5;
  const cutoff = clamp01(1 - density + threshold);
  if (softness <= 0) return nextValue >= cutoff ? 1 : 0;
  return clamp01((nextValue - cutoff + softness) / (softness * 2));
}

export class NoiseEffect implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'noise';
  visible = true;
  collapsed = true;
  opacity = 0.5;
  seed = 1;
  scale = 1;
  xOffset = 0;
  yOffset = 0;
  foregroundColor = '#FFFFFF';
  backgroundColor = '#000000';
  backgroundOpacity = 0;
  noiseType: NoiseType = 'fractal';
  density = 0.5;
  contrast = 0.75;
  grainSize = 2;
  octaves = 4;
  persistence = 0.5;
  lacunarity = 2;
  rotation = 0;
  stretchX = 1;
  stretchY = 1;
  monochrome = false;
  invert = false;
  threshold = 0;
  softness = 0.25;

  constructor() {
    makeAutoObservable(this, { draw: false });
  }

  private sampleNoise(x: number, y: number) {
    const grainSize = Math.max(1, this.grainSize);
    const scale = Math.max(0.01, this.scale);
    const stretchX = Math.max(0.01, this.stretchX);
    const stretchY = Math.max(0.01, this.stretchY);
    const angle = (-this.rotation * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const shiftedX = x + this.xOffset;
    const shiftedY = y + this.yOffset;
    const sampleX = (shiftedX * cos - shiftedY * sin) / grainSize / scale / stretchX;
    const sampleY = (shiftedX * sin + shiftedY * cos) / grainSize / scale / stretchY;

    if (this.noiseType === 'value') {
      return valueNoise(sampleX, sampleY, this.seed);
    }
    if (this.noiseType === 'cellular') {
      return cellularNoise(sampleX, sampleY, this.seed);
    }
    if (this.noiseType === 'speckle') {
      return hash2(Math.floor(sampleX), Math.floor(sampleY), this.seed);
    }
    return fractalNoise(
      sampleX,
      sampleY,
      this.seed,
      Math.max(1, Math.round(this.octaves)),
      this.persistence,
      this.lacunarity,
    );
  }

  draw({ context, createBufferCanvas, width, height }: FontEffectRenderContext) {
    const sourceCanvas = createBufferCanvas();
    const sourceContext = sourceCanvas.getContext('2d');
    if (!sourceContext) return;
    sourceContext.drawImage(context.canvas, 0, 0);

    const textureCanvas = createBufferCanvas();
    const textureContext = textureCanvas.getContext('2d');
    if (!textureContext) return;

    const image = textureContext.createImageData(width, height);
    const data = image.data;
    const foreground = hexToRgb(this.foregroundColor);
    const background = hexToRgb(this.backgroundColor);
    const backgroundOpacity = clamp01(this.backgroundOpacity);
    const density = clamp01(this.density);
    const contrast = clamp01(this.contrast);
    const softness = clamp01(this.softness);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const noiseValue = shapeNoiseValue(
          this.sampleNoise(x, y),
          density,
          contrast,
          this.threshold,
          softness,
          this.invert,
        );
        if (this.monochrome) {
          const gray = Math.round(noiseValue * 255);
          data[index] = gray;
          data[index + 1] = gray;
          data[index + 2] = gray;
          data[index + 3] = Math.round(255 * Math.max(noiseValue, backgroundOpacity));
        } else {
          data[index] = Math.round(mix(background.r, foreground.r, noiseValue));
          data[index + 1] = Math.round(mix(background.g, foreground.g, noiseValue));
          data[index + 2] = Math.round(mix(background.b, foreground.b, noiseValue));
          data[index + 3] = Math.round(
            255 * mix(backgroundOpacity, 1, noiseValue),
          );
        }
      }
    }
    textureContext.putImageData(image, 0, 0);
    textureContext.globalCompositeOperation = 'destination-in';
    textureContext.drawImage(sourceCanvas, 0, 0);

    context.save();
    context.clearRect(0, 0, width, height);
    context.drawImage(sourceCanvas, 0, 0);
    context.globalAlpha = this.opacity;
    context.drawImage(textureCanvas, 0, 0);
    context.restore();
  }
}

export interface SerializedNoiseEffect extends SerializedFontEffect {
  type: 'noise';
  visible: boolean;
  collapsed: boolean;
  opacity: number;
  seed: number;
  scale: number;
  xOffset: number;
  yOffset: number;
  foregroundColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  noiseType: NoiseType;
  density: number;
  contrast: number;
  grainSize: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  rotation: number;
  stretchX: number;
  stretchY: number;
  monochrome: boolean;
  invert: boolean;
  threshold: number;
  softness: number;
}

export function serializeNoiseEffect(effect: NoiseEffect): SerializedNoiseEffect {
  return {
    type: 'noise',
    visible: effect.visible,
    collapsed: effect.collapsed,
    opacity: effect.opacity,
    seed: effect.seed,
    scale: effect.scale,
    xOffset: effect.xOffset,
    yOffset: effect.yOffset,
    foregroundColor: effect.foregroundColor,
    backgroundColor: effect.backgroundColor,
    backgroundOpacity: effect.backgroundOpacity,
    noiseType: effect.noiseType,
    density: effect.density,
    contrast: effect.contrast,
    grainSize: effect.grainSize,
    octaves: effect.octaves,
    persistence: effect.persistence,
    lacunarity: effect.lacunarity,
    rotation: effect.rotation,
    stretchX: effect.stretchX,
    stretchY: effect.stretchY,
    monochrome: effect.monochrome,
    invert: effect.invert,
    threshold: effect.threshold,
    softness: effect.softness,
  };
}

export function deserializeNoiseEffect(value: unknown) {
  if (!isRecord(value)) return null;

  const effect = new NoiseEffect();
  effect.visible = readVisible(value.visible, effect.visible);
  effect.collapsed = readCollapsed(value.collapsed, effect.collapsed);
  effect.opacity = readOpacity(value.opacity, effect.opacity);
  effect.seed = Math.round(readNumber(value.seed, effect.seed));
  effect.scale = readNumber(value.scale, effect.scale, 0.01);
  effect.xOffset = readNumber(value.xOffset, effect.xOffset);
  effect.yOffset = readNumber(value.yOffset, effect.yOffset);
  effect.foregroundColor = readString(value.foregroundColor, effect.foregroundColor);
  effect.backgroundColor = readString(value.backgroundColor, effect.backgroundColor);
  effect.backgroundOpacity = readOpacity(
    value.backgroundOpacity,
    effect.backgroundOpacity,
  );
  effect.noiseType = readNoiseType(value.noiseType, effect.noiseType);
  effect.density = readOpacity(value.density, effect.density);
  effect.contrast = readOpacity(value.contrast, effect.contrast);
  effect.grainSize = readNumber(value.grainSize, effect.grainSize, 1);
  effect.octaves = readClampedNumber(value.octaves, effect.octaves, 1, 8);
  effect.persistence = readClampedNumber(
    value.persistence,
    effect.persistence,
    0,
    1,
  );
  effect.lacunarity = readNumber(value.lacunarity, effect.lacunarity, 1);
  effect.rotation = readNumber(value.rotation, effect.rotation);
  effect.stretchX = readNumber(value.stretchX, effect.stretchX, 0.01);
  effect.stretchY = readNumber(value.stretchY, effect.stretchY, 0.01);
  effect.monochrome = readBoolean(value.monochrome, effect.monochrome);
  effect.invert = readBoolean(value.invert, effect.invert);
  effect.threshold = readClampedNumber(value.threshold, effect.threshold, -1, 1);
  effect.softness = readOpacity(value.softness, effect.softness);
  return effect;
}
