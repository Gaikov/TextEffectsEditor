import { makeAutoObservable } from 'mobx';
import {
  createFontEffect,
  deserializeFontEffect,
  serializeFontEffect,
  type SerializedFontEffect,
  type FontEffectType,
  type IFontEffect,
} from '../effects';
import {
  isRecord,
  readBoolean,
  readNumber,
  readString,
} from '../effects/effectSnapshot';
import { isValidFont } from '../fonts';

export type FontEffectMoveDirection = 'up' | 'down';

export interface TextPosition {
  x: number;
  y: number;
}

export interface FontStoreSnapshot {
  version: 1;
  text: string;
  fontFamily: string;
  fontSize: number;
  canvasWidth: number;
  canvasHeight: number;
  boldWeight: number;
  italic: boolean;
  effects: SerializedFontEffect[];
}

const MIN_CANVAS_SIZE = 1;
const MAX_CANVAS_SIZE = 4096;
const MIN_FONT_SIZE = 1;
const MAX_FONT_SIZE = 2048;
const MIN_FONT_WEIGHT = 100;
const MAX_FONT_WEIGHT = 900;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeFontWeight(value: number) {
  return clamp(
    Math.round(value / 100) * 100,
    MIN_FONT_WEIGHT,
    MAX_FONT_WEIGHT,
  );
}

class FontStore {
  text = 'Hello World';
  fontFamily = 'Arial';
  fontSize = 72;
  canvasWidth = 1200;
  canvasHeight = 800;
  boldWeight = 400;
  italic = false;
  effects: IFontEffect[] = [createFontEffect('fill')];

  constructor() {
    makeAutoObservable(this);
  }

  setCanvasWidth = (v: number) => {
    this.canvasWidth = clamp(v, MIN_CANVAS_SIZE, MAX_CANVAS_SIZE);
  };

  setCanvasHeight = (v: number) => {
    this.canvasHeight = clamp(v, MIN_CANVAS_SIZE, MAX_CANVAS_SIZE);
  };

  toggleItalic = () => {
    this.italic = !this.italic;
  };

  addEffect = (type: FontEffectType) => {
    this.effects.push(createFontEffect(type));
  };

  removeEffect = (id: string) => {
    this.effects = this.effects.filter((effect) => effect.id !== id);
  };

  moveEffect = (id: string, direction: FontEffectMoveDirection) => {
    const index = this.effects.findIndex((effect) => effect.id === id);
    if (index === -1) return;

    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= this.effects.length) return;

    const nextEffects = [...this.effects];
    const [effect] = nextEffects.splice(index, 1);
    nextEffects.splice(nextIndex, 0, effect);
    this.effects = nextEffects;
  };

  get fontValid(): boolean {
    return isValidFont(this.fontFamily);
  }

  toJSON = (): FontStoreSnapshot => ({
    version: 1,
    text: this.text,
    fontFamily: this.fontFamily,
    fontSize: this.fontSize,
    canvasWidth: this.canvasWidth,
    canvasHeight: this.canvasHeight,
    boldWeight: this.boldWeight,
    italic: this.italic,
    effects: this.effects
      .map(serializeFontEffect)
      .filter((effect): effect is SerializedFontEffect => effect !== null),
  });

  loadJSON = (value: unknown) => {
    if (!isRecord(value)) return false;

    this.text = readString(value.text, this.text);
    this.fontFamily = readString(value.fontFamily, this.fontFamily);
    this.fontSize = clamp(
      readNumber(value.fontSize, this.fontSize, MIN_FONT_SIZE),
      MIN_FONT_SIZE,
      MAX_FONT_SIZE,
    );
    this.canvasWidth = clamp(
      readNumber(value.canvasWidth, this.canvasWidth, MIN_CANVAS_SIZE),
      MIN_CANVAS_SIZE,
      MAX_CANVAS_SIZE,
    );
    this.canvasHeight = clamp(
      readNumber(value.canvasHeight, this.canvasHeight, MIN_CANVAS_SIZE),
      MIN_CANVAS_SIZE,
      MAX_CANVAS_SIZE,
    );
    this.boldWeight = normalizeFontWeight(
      readNumber(value.boldWeight, this.boldWeight, MIN_FONT_WEIGHT),
    );
    this.italic = readBoolean(value.italic, this.italic);

    const effects = Array.isArray(value.effects)
      ? value.effects
          .map(deserializeFontEffect)
          .filter((effect): effect is IFontEffect => effect !== null)
      : [];
    this.effects = effects.length > 0 ? effects : [createFontEffect('fill')];

    return true;
  };
}

export const fontStore = new FontStore();
