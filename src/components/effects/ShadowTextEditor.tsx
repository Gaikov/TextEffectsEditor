import { observer } from 'mobx-react-lite';
import type { ShadowText } from '../../effects';
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

export const ShadowTextEditor = observer(function ShadowTextEditor({
  effect,
  index,
  count,
  depth,
  dragHandleAttributes,
  dragHandleListeners,
}: EffectEditorProps<ShadowText>) {
  return (
    <EffectEditorFrame
      effect={effect}
      index={index}
      count={count}
      depth={depth}
      title="Shadow"
      dragHandleAttributes={dragHandleAttributes}
      dragHandleListeners={dragHandleListeners}
    >
      <EffectRow label="Color">
        <EffectColorInput
          color={effect.color}
          onChange={(value) => {
            fontStore.setEffectProperty(effect, 'color', value, 'Shadow color');
          }}
          onPickerCommit={(previousValue, nextValue) => {
            commitEffectColor(effect, previousValue, nextValue, 'Shadow color');
          }}
          onPickerPreview={(value) => {
            previewEffectColor(effect, value);
          }}
        />
      </EffectRow>
      <EffectOpacityRow
        value={effect.opacity}
        onChange={(value) => {
          fontStore.setEffectProperty(effect, 'opacity', value, 'Shadow opacity');
        }}
      />
      <EffectRow label="X offset">
        <EffectNumberInput
          value={effect.xOffset}
          onChange={(value) => {
            fontStore.setEffectProperty(effect, 'xOffset', value, 'Shadow X offset');
          }}
        />
      </EffectRow>
      <EffectRow label="Y offset">
        <EffectNumberInput
          value={effect.yOffset}
          onChange={(value) => {
            fontStore.setEffectProperty(effect, 'yOffset', value, 'Shadow Y offset');
          }}
        />
      </EffectRow>
      <EffectRow label="Blur">
        <EffectNumberInput
          value={effect.shadowBlur}
          min={0}
          onChange={(value) => {
            fontStore.setEffectProperty(effect, 'shadowBlur', value, 'Shadow blur');
          }}
        />
      </EffectRow>
      <EffectRow label="Shadow X">
        <EffectNumberInput
          value={effect.shadowOffsetX}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'shadowOffsetX',
              value,
              'Shadow offset X',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="Shadow Y">
        <EffectNumberInput
          value={effect.shadowOffsetY}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'shadowOffsetY',
              value,
              'Shadow offset Y',
            );
          }}
        />
      </EffectRow>
    </EffectEditorFrame>
  );
});
