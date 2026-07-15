import { observer } from 'mobx-react-lite';
import type { GlowEffect } from '../../effects';
import { fontStore } from '../../store/fontStore';
import {
  EffectColorInput,
  EffectNumberInput,
  EffectOpacityRow,
  EffectRow,
} from './EffectEditorFields';
import { EffectEditorFrame } from './EffectEditorFrame';
import { commitEffectColor, previewEffectColor } from './effectColorUndo';
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
            fontStore.setEffectProperty(effect, 'color', value, 'Glow color');
          }}
          onPickerCommit={(previousValue, nextValue) => {
            commitEffectColor(effect, previousValue, nextValue, 'Glow color');
          }}
          onPickerPreview={(value) => {
            previewEffectColor(effect, value);
          }}
        />
      </EffectRow>
      <EffectOpacityRow
        value={effect.opacity}
        onChange={(value) => {
          fontStore.setEffectProperty(effect, 'opacity', value, 'Glow opacity');
        }}
      />
      <EffectRow label="Blur">
        <EffectNumberInput
          value={effect.blur}
          min={0}
          onChange={(value) => {
            fontStore.setEffectProperty(effect, 'blur', value, 'Glow blur');
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
          allowFloat={false}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'spread',
              Math.round(Math.max(1, Math.min(8, value))),
              'Glow spread',
            );
          }}
        />
      </EffectRow>
    </EffectEditorFrame>
  );
});
