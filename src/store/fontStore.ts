import { makeAutoObservable } from 'mobx';
import {
  createFontEffect,
  deserializeFontEffect,
  GroupEffect,
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
  effectsVersion = 0;

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
    this.touchEffects();
  };

  addEffectToGroup = (type: FontEffectType, groupId?: string) => {
    const effect = createFontEffect(type);
    if (!groupId) {
      this.effects.push(effect);
      this.touchEffects();
      return;
    }

    const group = this.findGroup(groupId);
    if (!group) return;

    group.addEffect(effect);
    this.touchEffects();
  };

  removeEffect = (id: string) => {
    this.effects = this.removeEffectFromList(this.effects, id);
    this.touchEffects();
  };

  moveEffect = (id: string, direction: FontEffectMoveDirection) => {
    if (this.moveEffectInList(this.effects, id, direction)) {
      this.touchEffects();
    }
  };

  moveEffectToParent = (
    effectId: string,
    targetParentId: string | null,
    targetIndex: number,
    adjustForSourceRemoval = true,
  ) => {
    const location = this.findEffectLocation(this.effects, effectId, null);
    if (!location) return false;
    if (effectId === targetParentId) return false;
    if (
      targetParentId !== null &&
      location.effect instanceof GroupEffect &&
      this.effectContainsId(location.effect, targetParentId)
    ) {
      return false;
    }

    let nextTargetIndex = targetIndex;
    if (
      adjustForSourceRemoval &&
      location.parentId === targetParentId &&
      location.index < nextTargetIndex
    ) {
      nextTargetIndex -= 1;
    }

    const [effect] = location.effects.splice(location.index, 1);
    const targetEffects = this.getEffectsForParent(targetParentId);
    if (!targetEffects) {
      location.effects.splice(location.index, 0, effect);
      return false;
    }

    const clampedIndex = clamp(nextTargetIndex, 0, targetEffects.length);
    targetEffects.splice(clampedIndex, 0, effect);
    this.touchEffects();
    return true;
  };

  private touchEffects = () => {
    this.effectsVersion += 1;
  };

  private findGroup = (id: string): GroupEffect | undefined => {
    return this.findGroupInList(this.effects, id);
  };

  private findGroupInList = (
    effects: IFontEffect[],
    id: string,
  ): GroupEffect | undefined => {
    for (const effect of effects) {
      if (effect instanceof GroupEffect) {
        if (effect.id === id) return effect;
        const childGroup = this.findGroupInList(effect.children, id);
        if (childGroup) return childGroup;
      }
    }

    return undefined;
  };

  private getEffectsForParent = (
    parentId: string | null,
  ): IFontEffect[] | undefined => {
    if (parentId === null) return this.effects;
    return this.findGroup(parentId)?.children;
  };

  private findEffectLocation = (
    effects: IFontEffect[],
    id: string,
    parentId: string | null,
  ):
    | {
        effect: IFontEffect;
        effects: IFontEffect[];
        index: number;
        parentId: string | null;
      }
    | undefined => {
    const index = effects.findIndex((effect) => effect.id === id);
    if (index !== -1) {
      return { effect: effects[index], effects, index, parentId };
    }

    for (const effect of effects) {
      if (effect instanceof GroupEffect) {
        const location = this.findEffectLocation(
          effect.children,
          id,
          effect.id,
        );
        if (location) return location;
      }
    }

    return undefined;
  };

  private effectContainsId = (effect: IFontEffect, id: string): boolean => {
    if (!(effect instanceof GroupEffect)) return false;
    return effect.children.some(
      (child) => child.id === id || this.effectContainsId(child, id),
    );
  };

  private removeEffectFromList = (
    effects: IFontEffect[],
    id: string,
  ): IFontEffect[] => {
    return effects
      .filter((effect) => effect.id !== id)
      .map((effect) => {
        if (effect instanceof GroupEffect) {
          effect.children = this.removeEffectFromList(effect.children, id);
        }
        return effect;
      });
  };

  private moveEffectInList = (
    effects: IFontEffect[],
    id: string,
    direction: FontEffectMoveDirection,
  ): boolean => {
    const index = effects.findIndex((effect) => effect.id === id);
    if (index === -1) {
      for (const effect of effects) {
        if (
          effect instanceof GroupEffect &&
          this.moveEffectInList(effect.children, id, direction)
        ) {
          return true;
        }
      }

      return false;
    }

    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex >= 0 && nextIndex < effects.length) {
      const nextEffects = [...effects];
      const [effect] = nextEffects.splice(index, 1);
      nextEffects.splice(nextIndex, 0, effect);

      if (effects === this.effects) {
        this.effects = nextEffects;
      } else {
        effects.splice(0, effects.length, ...nextEffects);
      }
      return true;
    }

    return false;
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
    this.touchEffects();

    return true;
  };
}

export const fontStore = new FontStore();
