import { makeAutoObservable } from 'mobx';
import {
  createFontEffect,
  type FontEffectType,
  type IFontEffect,
} from '../effects';
import { isValidFont } from '../fonts';

export type FontEffectMoveDirection = 'up' | 'down';

export interface TextPosition {
  x: number;
  y: number;
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
    this.canvasWidth = Math.max(1, v);
  };

  setCanvasHeight = (v: number) => {
    this.canvasHeight = Math.max(1, v);
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
}

export const fontStore = new FontStore();
