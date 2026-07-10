import { observer } from 'mobx-react-lite';
import type { ColorFillText } from '../../effects';
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

export const ColorFillTextEditor = observer(function ColorFillTextEditor({
  effect,
  index,
  count,
  depth,
  dragHandleAttributes,
  dragHandleListeners,
}: EffectEditorProps<ColorFillText>) {
  return (
    <EffectEditorFrame
      effect={effect}
      index={index}
      count={count}
      depth={depth}
      title="Fill"
      dragHandleAttributes={dragHandleAttributes}
      dragHandleListeners={dragHandleListeners}
    >
      <EffectRow label="Color">
        <EffectColorInput
          color={effect.color}
          onChange={(value) => {
            fontStore.setEffectProperty(effect, 'color', value, 'Fill color');
          }}
          onPickerCommit={(previousValue, nextValue) => {
            commitEffectColor(effect, previousValue, nextValue, 'Fill color');
          }}
          onPickerPreview={(value) => {
            previewEffectColor(effect, value);
          }}
        />
      </EffectRow>
      <EffectOpacityRow
        value={effect.opacity}
        onChange={(value) => {
          fontStore.setEffectProperty(effect, 'opacity', value, 'Fill opacity');
        }}
      />
      <EffectRow label="X offset">
        <EffectNumberInput
          value={effect.xOffset}
          onChange={(value) => {
            fontStore.setEffectProperty(effect, 'xOffset', value, 'Fill X offset');
          }}
        />
      </EffectRow>
      <EffectRow label="Y offset">
        <EffectNumberInput
          value={effect.yOffset}
          onChange={(value) => {
            fontStore.setEffectProperty(effect, 'yOffset', value, 'Fill Y offset');
          }}
        />
      </EffectRow>
    </EffectEditorFrame>
  );
});
