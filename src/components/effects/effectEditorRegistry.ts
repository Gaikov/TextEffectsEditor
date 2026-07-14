import type { ComponentType } from 'react';
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from '@dnd-kit/core';
import type {
  BlurEffect,
  ColorFillText,
  CompositeBlendEffect,
  FontEffectType,
  GlowEffect,
  GradientFillText,
  GroupEffect,
  IFontEffect,
  InnerShadowEffect,
  NoiseEffect,
  PatternFillText,
  ShadowText,
  StrokeText,
} from '../../effects';
import { BlurEffectEditor } from './BlurEffectEditor';
import { ColorFillTextEditor } from './ColorFillTextEditor';
import { CompositeBlendEffectEditor } from './CompositeBlendEffectEditor';
import { GlowEffectEditor } from './GlowEffectEditor';
import { GradientFillTextEditor } from './GradientFillTextEditor';
import { GroupEffectEditor } from './GroupEffectEditor';
import { InnerShadowEffectEditor } from './InnerShadowEffectEditor';
import { NoiseEffectEditor } from './NoiseEffectEditor';
import { PatternFillTextEditor } from './PatternFillTextEditor';
import { ShadowTextEditor } from './ShadowTextEditor';
import { StrokeTextEditor } from './StrokeTextEditor';

export interface EffectEditorProps<T extends IFontEffect = IFontEffect> {
  effect: T;
  index: number;
  count: number;
  depth: number;
  dragHandleAttributes?: DraggableAttributes;
  dragHandleListeners?: DraggableSyntheticListeners;
  renderChildren?: (
    effects: IFontEffect[],
    depth: number,
    parentId: string | null,
  ) => React.ReactNode;
}

type EffectEditorComponent = ComponentType<EffectEditorProps<any>>;

export const effectEditorRegistry: Record<
  FontEffectType,
  EffectEditorComponent
> = {
  group: GroupEffectEditor as ComponentType<EffectEditorProps<GroupEffect>>,
  fill: ColorFillTextEditor as ComponentType<EffectEditorProps<ColorFillText>>,
  stroke: StrokeTextEditor as ComponentType<EffectEditorProps<StrokeText>>,
  shadow: ShadowTextEditor as ComponentType<EffectEditorProps<ShadowText>>,
  innerShadow: InnerShadowEffectEditor as ComponentType<
    EffectEditorProps<InnerShadowEffect>
  >,
  glow: GlowEffectEditor as ComponentType<EffectEditorProps<GlowEffect>>,
  blur: BlurEffectEditor as ComponentType<EffectEditorProps<BlurEffect>>,
  compositeBlend: CompositeBlendEffectEditor as ComponentType<
    EffectEditorProps<CompositeBlendEffect>
  >,
  patternFill: PatternFillTextEditor as ComponentType<
    EffectEditorProps<PatternFillText>
  >,
  noise: NoiseEffectEditor as ComponentType<EffectEditorProps<NoiseEffect>>,
  gradientFill: GradientFillTextEditor as ComponentType<
    EffectEditorProps<GradientFillText>
  >,
};

export function getEffectEditor(effect: IFontEffect) {
  return effectEditorRegistry[effect.type];
}
