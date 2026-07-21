import { makeAutoObservable } from 'mobx';
import {
  createFontEffect,
  deserializeFontEffect,
  GroupEffect,
  isRecord,
  readBoolean,
  readNumber,
  readString,
  serializeFontEffect,
  type SerializedFontEffect,
  type FontEffectType,
  type IFontEffect,
} from '../effects';
import { isValidFont } from '../fonts';
import {
  UndoArrayChange,
  UndoBatch,
  UndoPropertyChange,
  undoService,
} from '../undo';

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
const DEFAULT_TEXT = 'Hello World';
const DEFAULT_FONT_FAMILY = 'Arial';
const DEFAULT_FONT_SIZE = 180;
const DEFAULT_CANVAS_WIDTH = 1200;
const DEFAULT_CANVAS_HEIGHT = 800;
const DEFAULT_BOLD_WEIGHT = 400;
const DEFAULT_ITALIC = false;

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
  text = DEFAULT_TEXT;
  fontFamily = DEFAULT_FONT_FAMILY;
  fontSize = DEFAULT_FONT_SIZE;
  canvasWidth = DEFAULT_CANVAS_WIDTH;
  canvasHeight = DEFAULT_CANVAS_HEIGHT;
  boldWeight = DEFAULT_BOLD_WEIGHT;
  italic = DEFAULT_ITALIC;
  effects: IFontEffect[] = [createFontEffect('fill')];
  effectsVersion = 0;

  constructor() {
    makeAutoObservable(this);
  }

  setCanvasWidth = (v: number) => {
    this.setRootProperty(
      'canvasWidth',
      clamp(v, MIN_CANVAS_SIZE, MAX_CANVAS_SIZE),
      'Canvas width',
    );
  };

  setCanvasHeight = (v: number) => {
    this.setRootProperty(
      'canvasHeight',
      clamp(v, MIN_CANVAS_SIZE, MAX_CANVAS_SIZE),
      'Canvas height',
    );
  };

  toggleItalic = () => {
    this.setRootProperty('italic', !this.italic, 'Italic');
  };

  addEffect = (type: FontEffectType) => {
    this.addEffectToGroup(type);
  };

  newDocument = () => {
    this.text = DEFAULT_TEXT;
    this.fontFamily = DEFAULT_FONT_FAMILY;
    this.fontSize = DEFAULT_FONT_SIZE;
    this.canvasWidth = DEFAULT_CANVAS_WIDTH;
    this.canvasHeight = DEFAULT_CANVAS_HEIGHT;
    this.boldWeight = DEFAULT_BOLD_WEIGHT;
    this.italic = DEFAULT_ITALIC;
    this.effects.splice(0, this.effects.length, createFontEffect('fill'));
    this.touchEffects();
    undoService.clear();
  };

  replaceEffectsFromSerialized = (
    serializedEffects: SerializedFontEffect[],
    label = 'Apply gallery effect',
  ) => {
    const effects = serializedEffects
      .map(deserializeFontEffect)
      .filter((effect): effect is IFontEffect => effect !== null);
    if (effects.length === 0) return false;

    this.applyEffectsArrayChange(this.effects, effects, label);
    return true;
  };

  addEffectToGroup = (type: FontEffectType, groupId?: string) => {
    const effect = createFontEffect(type);
    effect.collapsed = false;
    const effects = this.getEffectsForParent(groupId ?? null);
    if (!effects) return;

    this.applyEffectsArrayChange(
      effects,
      [...effects, effect],
      `Add ${type}`,
    );
  };

  removeEffect = (id: string) => {
    const location = this.findEffectLocation(this.effects, id, null);
    if (!location) return;

    this.applyEffectsArrayChange(
      location.effects,
      location.effects.filter((effect) => effect.id !== id),
      'Remove effect',
    );
  };

  duplicateEffect = (id: string) => {
    const location = this.findEffectLocation(this.effects, id, null);
    if (!location) return;

    const serializedEffect = serializeFontEffect(location.effect);
    if (!serializedEffect) return;

    const duplicate = deserializeFontEffect(serializedEffect);
    if (!duplicate) return;

    duplicate.collapsed = false;
    if (duplicate instanceof GroupEffect) {
      duplicate.name = `${duplicate.name.trim() || 'Group'} copy`;
    }

    const nextEffects = [...location.effects];
    nextEffects.splice(location.index + 1, 0, duplicate);
    this.applyEffectsArrayChange(
      location.effects,
      nextEffects,
      'Duplicate effect',
    );
  };

  moveEffect = (id: string, direction: FontEffectMoveDirection) => {
    const location = this.findEffectLocation(this.effects, id, null);
    if (!location) return;

    const nextIndex =
      direction === 'up' ? location.index - 1 : location.index + 1;
    if (nextIndex < 0 || nextIndex >= location.effects.length) return;

    const nextEffects = [...location.effects];
    const [effect] = nextEffects.splice(location.index, 1);
    nextEffects.splice(nextIndex, 0, effect);
    this.applyEffectsArrayChange(location.effects, nextEffects, 'Move effect');
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

    const targetEffects = this.getEffectsForParent(targetParentId);
    if (!targetEffects) return false;

    if (location.effects === targetEffects) {
      const nextEffects = [...location.effects];
      const [effect] = nextEffects.splice(location.index, 1);
      nextEffects.splice(clamp(nextTargetIndex, 0, nextEffects.length), 0, effect);
      this.applyEffectsArrayChange(location.effects, nextEffects, 'Move effect');
      return true;
    }

    const sourceNext = location.effects.filter(
      (effect) => effect.id !== effectId,
    );
    const targetNext = [...targetEffects];
    targetNext.splice(clamp(nextTargetIndex, 0, targetNext.length), 0, location.effect);
    undoService.execute(
      new UndoBatch(
        [
          new UndoArrayChange(
            location.effects,
            [...location.effects],
            sourceNext,
            'Move effect source',
            this.touchEffects,
          ),
          new UndoArrayChange(
            targetEffects,
            [...targetEffects],
            targetNext,
            'Move effect target',
            this.touchEffects,
          ),
        ],
        'Move effect',
      ),
    );
    return true;
  };

  touchEffects = () => {
    this.effectsVersion += 1;
  };

  setProperty = <T extends object, K extends keyof T>(
    target: T,
    key: K,
    value: T[K],
    label?: string,
    afterApply?: () => void,
  ) => {
    if (Object.is(target[key], value)) return;

    undoService.execute(
      new UndoPropertyChange(
        target,
        key,
        target[key],
        value,
        label,
        afterApply,
      ),
    );
  };

  setEffectProperty = <T extends IFontEffect, K extends keyof T>(
    effect: T,
    key: K,
    value: T[K],
    label?: string,
  ) => {
    this.setProperty(effect, key, value, label, this.touchEffects);
  };

  setRootProperty = <K extends keyof FontStore>(
    key: K,
    value: FontStore[K],
    label?: string,
  ) => {
    this.setProperty(this, key, value, label);
  };

  setArrayValue = <T>(
    target: T[],
    value: T[],
    label?: string,
    afterApply?: () => void,
  ) => {
    undoService.execute(
      new UndoArrayChange(target, [...target], value, label, afterApply),
    );
  };

  private applyEffectsArrayChange = (
    target: IFontEffect[],
    value: IFontEffect[],
    label?: string,
  ) => {
    this.setArrayValue(target, value, label, this.touchEffects);
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
    this.effects.splice(
      0,
      this.effects.length,
      ...(effects.length > 0 ? effects : [createFontEffect('fill')]),
    );
    this.touchEffects();
    undoService.clear();

    return true;
  };
}

export const fontStore = new FontStore();
