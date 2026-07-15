import { observer } from 'mobx-react-lite';
import type { BlurEffect } from '../../effects';
import { fontStore } from '../../store/fontStore';
import {
  EffectNumberInput,
  EffectOpacityRow,
  EffectRow,
} from './EffectEditorFields';
import { EffectEditorFrame } from './EffectEditorFrame';
import type { EffectEditorProps } from './effectEditorRegistry';

export const BlurEffectEditor = observer(function BlurEffectEditor({
  effect,
  index,
  count,
  depth,
  dragHandleAttributes,
  dragHandleListeners,
}: EffectEditorProps<BlurEffect>) {
  return (
    <EffectEditorFrame
      effect={effect}
      index={index}
      count={count}
      depth={depth}
      title="Blur"
      dragHandleAttributes={dragHandleAttributes}
      dragHandleListeners={dragHandleListeners}
    >
      <EffectOpacityRow
        value={effect.opacity}
        onChange={(value) => {
          fontStore.setEffectProperty(effect, 'opacity', value, 'Blur opacity');
        }}
      />
      <EffectRow label="Radius">
        <EffectNumberInput
          value={effect.radius}
          min={0}
          onChange={(value) => {
            fontStore.setEffectProperty(effect, 'radius', value, 'Blur radius');
          }}
        />
      </EffectRow>
      <EffectRow label="Passes">
        <EffectNumberInput
          value={effect.iterations}
          min={1}
          max={8}
          stepSize={1}
          minorStepSize={1}
          allowFloat={false}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'iterations',
              Math.round(Math.max(1, Math.min(8, value))),
              'Blur passes',
            );
          }}
        />
      </EffectRow>
    </EffectEditorFrame>
  );
});
