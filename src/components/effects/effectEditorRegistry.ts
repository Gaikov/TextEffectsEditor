import type { ComponentType } from 'react';
import type {
  ColorFillText,
  FontEffectType,
  IFontEffect,
  StrokeText,
} from '../../effects';
import { ColorFillTextEditor } from './ColorFillTextEditor';
import { StrokeTextEditor } from './StrokeTextEditor';

export interface EffectEditorProps<T extends IFontEffect = IFontEffect> {
  effect: T;
  index: number;
  count: number;
}

type EffectEditorComponent = ComponentType<EffectEditorProps<any>>;

export const effectEditorRegistry: Record<
  FontEffectType,
  EffectEditorComponent
> = {
  fill: ColorFillTextEditor as ComponentType<EffectEditorProps<ColorFillText>>,
  stroke: StrokeTextEditor as ComponentType<EffectEditorProps<StrokeText>>,
};

export function getEffectEditor(effect: IFontEffect) {
  return effectEditorRegistry[effect.type];
}
