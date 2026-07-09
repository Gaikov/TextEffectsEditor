import { makeAutoObservable } from 'mobx';
import { createEffectId } from './effectId';
import { isRecord, type SerializedFontEffect } from './effectSnapshot';
import type {
  FontEffectKind,
  FontEffectRenderContext,
  FontEffectType,
  IFontEffect,
} from './IFontEffect';

export class StartShadowEffect implements IFontEffect {
  id = createEffectId();
  type: FontEffectType = 'startShadow';
  kind: FontEffectKind = 'marker';
  opacity = 1;

  constructor() {
    makeAutoObservable(this, { draw: false });
  }

  draw({ startShadowGroup }: FontEffectRenderContext) {
    startShadowGroup();
  }
}

export interface SerializedStartShadowEffect extends SerializedFontEffect {
  type: 'startShadow';
}

export function serializeStartShadowEffect(): SerializedStartShadowEffect {
  return { type: 'startShadow' };
}

export function deserializeStartShadowEffect(value: unknown) {
  return isRecord(value) ? new StartShadowEffect() : null;
}
