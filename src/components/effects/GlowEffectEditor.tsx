import { observer } from 'mobx-react-lite';
import type { GlowEffect } from '../../effects';
import {
  EffectColorInput,
  EffectNumberInput,
  EffectOpacityRow,
  EffectRow,
} from './EffectEditorFields';
import { EffectEditorFrame } from './EffectEditorFrame';
import type { EffectEditorProps } from './effectEditorRegistry';

export const GlowEffectEditor = observer(function GlowEffectEditor({
  effect,
  index,
  count,
  depth,
  dragHandleAttributes,
  dragHandleListeners,
}: EffectEditorProps<GlowEffect>) {
  return (
    <EffectEditorFrame
      effect={effect}
      index={index}
      count={count}
      depth={depth}
      title="Glow"
      dragHandleAttributes={dragHandleAttributes}
      dragHandleListeners={dragHandleListeners}
    >
      <EffectRow label="Color">
        <EffectColorInput
          color={effect.color}
          onChange={(value) => {
            effect.color = value;
          }}
        />
      </EffectRow>
      <EffectOpacityRow
        value={effect.opacity}
        onChange={(value) => {
          effect.opacity = value;
        }}
      />
      <EffectRow label="Blur">
        <EffectNumberInput
          value={effect.blur}
          min={0}
          onChange={(value) => {
            effect.blur = value;
          }}
        />
      </EffectRow>
      <EffectRow label="Spread">
        <EffectNumberInput
          value={effect.spread}
          min={1}
          max={8}
          stepSize={1}
          minorStepSize={1}
          onChange={(value) => {
            effect.spread = Math.round(Math.max(1, Math.min(8, value)));
          }}
        />
      </EffectRow>
    </EffectEditorFrame>
  );
});
