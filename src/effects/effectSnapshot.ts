import type { FontEffectType } from './IFontEffect';

export interface SerializedFontEffect {
  type: FontEffectType;
  [key: string]: unknown;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readString(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

export function readStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;

  const strings = value.filter((item): item is string => typeof item === 'string');
  return strings.length === value.length ? strings : fallback;
}

export function readNumber(value: unknown, fallback: number, min?: number) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return min == null ? number : Math.max(min, number);
}

export function readClampedNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  return Math.min(max, readNumber(value, fallback, min));
}

export function readOpacity(value: unknown, fallback = 1) {
  return readClampedNumber(value, fallback, 0, 1);
}

export function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

export function readLineDash(value: unknown, fallback: number[]) {
  if (!Array.isArray(value)) return fallback;

  const lineDash = value
    .map((item) => readNumber(item, NaN, 0))
    .filter((item) => Number.isFinite(item));
  return lineDash.length === value.length ? lineDash : fallback;
}

export function readLineCap(value: unknown, fallback: CanvasLineCap) {
  return value === 'butt' || value === 'round' || value === 'square'
    ? value
    : fallback;
}

export function readLineJoin(value: unknown, fallback: CanvasLineJoin) {
  return value === 'miter' || value === 'round' || value === 'bevel'
    ? value
    : fallback;
}
