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

export type PatternFillType =
  | 'stripes'
  | 'dots'
  | 'checker'
  | 'grid';

export const PATTERN_FILL_TYPES = [
  'stripes',
  'dots',
  'checker',
  'grid',
] as const satisfies readonly PatternFillType[];

function readPatternFillType(value: unknown, fallback: PatternFillType) {
  return typeof value === 'string' &&
    PATTERN_FILL_TYPES.includes(value as PatternFillType)
      ? (value as PatternFillType)
      : fallback;
}

function colorWithOpacity(color: string, opacity: number) {
  const alpha = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${alpha}`;
}

function applyPatternTransform(
  pattern: CanvasPattern,
  scale: number,
  rotation: number,
) {
  if (!pattern.setTransform || typeof DOMMatrix === 'undefined') return;

  const matrix = new DOMMatrix();
  matrix.scaleSelf(scale, scale);
  matrix.rotateSelf(rotation);
  pattern.setTransform(matrix);
}

export class PatternFillText implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'patternFill';
  visible = true;
  collapsed = true;
  opacity = 1;
  xOffset = 0;
  yOffset = 0;
  patternType: PatternFillType = 'stripes';
  foregroundColor = '#FFFFFF';
  backgroundColor = '#106BA3';
  backgroundOpacity = 1;
  cellSize = 16;
  thickness = 6;
  rotation = -45;
  scale = 1;

  constructor() {
    makeAutoObservable(this, { draw: false });
  }

  private createTile() {
    const size = Math.max(2, Math.round(this.cellSize));
    const thickness = Math.max(1, Math.min(size, this.thickness));
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) return canvas;

    context.fillStyle = colorWithOpacity(
      this.backgroundColor,
      this.backgroundOpacity,
    );
    context.fillRect(0, 0, size, size);
    context.fillStyle = this.foregroundColor;

    if (this.patternType === 'dots') {
      context.beginPath();
      context.arc(size / 2, size / 2, thickness, 0, Math.PI * 2);
      context.fill();
    } else if (this.patternType === 'checker') {
      const half = size / 2;
      context.fillRect(0, 0, half, half);
      context.fillRect(half, half, half, half);
    } else if (this.patternType === 'grid') {
      context.fillRect(0, 0, size, thickness);
      context.fillRect(0, 0, thickness, size);
    } else {
      context.fillRect(0, 0, size, thickness);
    }

    return canvas;
  }

  private drawTo(
    context: CanvasRenderingContext2D,
    position: FontEffectRenderContext['position'],
    text: string,
  ) {
    const pattern = context.createPattern(this.createTile(), 'repeat');
    if (!pattern) return;

    applyPatternTransform(pattern, Math.max(0.1, this.scale), this.rotation);

    context.save();
    context.globalAlpha = this.opacity;
    context.fillStyle = pattern;
    context.fillText(
      text,
      position.x + this.xOffset,
      position.y + this.yOffset,
    );
    context.restore();
  }

  draw({ context, position, text }: FontEffectRenderContext) {
    this.drawTo(context, position, text);
  }
}

export interface SerializedPatternFillText extends SerializedFontEffect {
  type: 'patternFill';
  visible: boolean;
  collapsed: boolean;
  opacity: number;
  xOffset: number;
  yOffset: number;
  patternType: PatternFillType;
  foregroundColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  cellSize: number;
  thickness: number;
  rotation: number;
  scale: number;
}

export function serializePatternFillText(
  effect: PatternFillText,
): SerializedPatternFillText {
  return {
    type: 'patternFill',
    visible: effect.visible,
    collapsed: effect.collapsed,
    opacity: effect.opacity,
    xOffset: effect.xOffset,
    yOffset: effect.yOffset,
    patternType: effect.patternType,
    foregroundColor: effect.foregroundColor,
    backgroundColor: effect.backgroundColor,
    backgroundOpacity: effect.backgroundOpacity,
    cellSize: effect.cellSize,
    thickness: effect.thickness,
    rotation: effect.rotation,
    scale: effect.scale,
  };
}

export function deserializePatternFillText(value: unknown) {
  if (!isRecord(value)) return null;

  const effect = new PatternFillText();
  effect.visible = readVisible(value.visible, effect.visible);
  effect.collapsed = readCollapsed(value.collapsed, effect.collapsed);
  effect.opacity = readOpacity(value.opacity, effect.opacity);
  effect.xOffset = readNumber(value.xOffset, effect.xOffset);
  effect.yOffset = readNumber(value.yOffset, effect.yOffset);
  effect.patternType = readPatternFillType(value.patternType, effect.patternType);
  effect.foregroundColor = readString(
    value.foregroundColor,
    effect.foregroundColor,
  );
  effect.backgroundColor = readString(
    value.backgroundColor,
    effect.backgroundColor,
  );
  effect.backgroundOpacity = readOpacity(
    value.backgroundOpacity,
    effect.backgroundOpacity,
  );
  effect.cellSize = readNumber(value.cellSize, effect.cellSize, 2);
  effect.thickness = readNumber(value.thickness, effect.thickness, 1);
  effect.rotation = readNumber(value.rotation, effect.rotation);
  effect.scale = readClampedNumber(value.scale, effect.scale, 0.1, 20);
  return effect;
}
