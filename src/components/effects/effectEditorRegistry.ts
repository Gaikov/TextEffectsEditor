import type { ComponentType } from 'react';
import type {
  ColorFillText,
  FontEffectType,
  GradientFillText,
  IFontEffect,
  ShadowText,
  StartShadowEffect,
  StrokeText,
} from '../../effects';
import { ColorFillTextEditor } from './ColorFillTextEditor';
import { GradientFillTextEditor } from './GradientFillTextEditor';
import { ShadowTextEditor } from './ShadowTextEditor';
import { StartShadowEffectEditor } from './StartShadowEffectEditor';
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
  shadow: ShadowTextEditor as ComponentType<EffectEditorProps<ShadowText>>,
  startShadow: StartShadowEffectEditor as ComponentType<
    EffectEditorProps<StartShadowEffect>
  >,
  gradientFill: GradientFillTextEditor as ComponentType<
    EffectEditorProps<GradientFillText>
  >,
};

export function getEffectEditor(effect: IFontEffect) {
  return effectEditorRegistry[effect.type];
}
