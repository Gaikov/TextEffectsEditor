import type { ComponentType } from 'react';
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from '@dnd-kit/core';
import type {
  ColorFillText,
  FontEffectType,
  GradientFillText,
  GroupEffect,
  IFontEffect,
  ShadowText,
  StrokeText,
} from '../../effects';
import { ColorFillTextEditor } from './ColorFillTextEditor';
import { GradientFillTextEditor } from './GradientFillTextEditor';
import { GroupEffectEditor } from './GroupEffectEditor';
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
  gradientFill: GradientFillTextEditor as ComponentType<
    EffectEditorProps<GradientFillText>
  >,
};

export function getEffectEditor(effect: IFontEffect) {
  return effectEditorRegistry[effect.type];
}
