import { HTMLSelect, InputGroup } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import type { StrokeText } from '../../effects';
import { fontStore } from '../../store/fontStore';
import {
  EffectColorInput,
  EffectNumberInput,
  EffectOpacityRow,
  EffectRow,
  parseLineDash,
} from './EffectEditorFields';
import { EffectEditorFrame } from './EffectEditorFrame';
import { commitEffectColor, previewEffectColor } from './effectColorUndo';
import type { EffectEditorProps } from './effectEditorRegistry';

export const StrokeTextEditor = observer(function StrokeTextEditor({
  effect,
  index,
  count,
  depth,
  dragHandleAttributes,
  dragHandleListeners,
}: EffectEditorProps<StrokeText>) {
  return (
    <EffectEditorFrame
      effect={effect}
      index={index}
      count={count}
      depth={depth}
      title="Stroke"
      dragHandleAttributes={dragHandleAttributes}
      dragHandleListeners={dragHandleListeners}
    >
      <EffectRow label="Color">
        <EffectColorInput
          color={effect.color}
          onChange={(value) => {
            fontStore.setEffectProperty(effect, 'color', value, 'Stroke color');
          }}
          onPickerCommit={(previousValue, nextValue) => {
            commitEffectColor(effect, previousValue, nextValue, 'Stroke color');
          }}
          onPickerPreview={(value) => {
            previewEffectColor(effect, value);
          }}
        />
      </EffectRow>
      <EffectOpacityRow
        value={effect.opacity}
        onChange={(value) => {
          fontStore.setEffectProperty(effect, 'opacity', value, 'Stroke opacity');
        }}
      />
      <EffectRow label="X offset">
        <EffectNumberInput
          value={effect.xOffset}
          onChange={(value) => {
            fontStore.setEffectProperty(effect, 'xOffset', value, 'Stroke X offset');
          }}
        />
      </EffectRow>
      <EffectRow label="Y offset">
        <EffectNumberInput
          value={effect.yOffset}
          onChange={(value) => {
            fontStore.setEffectProperty(effect, 'yOffset', value, 'Stroke Y offset');
          }}
        />
      </EffectRow>
      <EffectRow label="Width">
        <EffectNumberInput
          value={effect.lineWidth}
          min={0}
          onChange={(value) => {
            fontStore.setEffectProperty(effect, 'lineWidth', value, 'Stroke width');
          }}
        />
      </EffectRow>
      <EffectRow label="Cap">
        <HTMLSelect
          fill
          minimal
          value={effect.lineCap}
          onChange={(e) => {
            fontStore.setEffectProperty(
              effect,
              'lineCap',
              e.target.value as CanvasLineCap,
              'Stroke cap',
            );
          }}
          options={['butt', 'round', 'square'].map((value) => ({
            value,
            label: value,
          }))}
        />
      </EffectRow>
      <EffectRow label="Join">
        <HTMLSelect
          fill
          minimal
          value={effect.lineJoin}
          onChange={(e) => {
            fontStore.setEffectProperty(
              effect,
              'lineJoin',
              e.target.value as CanvasLineJoin,
              'Stroke join',
            );
          }}
          options={['miter', 'round', 'bevel'].map((value) => ({
            value,
            label: value,
          }))}
        />
      </EffectRow>
      <EffectRow label="Miter">
        <EffectNumberInput
          value={effect.miterLimit}
          min={0}
          onChange={(value) => {
            fontStore.setEffectProperty(effect, 'miterLimit', value, 'Stroke miter');
          }}
        />
      </EffectRow>
      <EffectRow label="Dash">
        <InputGroup
          small
          value={effect.lineDash.join(', ')}
          onChange={(e) => {
            fontStore.setArrayValue(
              effect.lineDash,
              parseLineDash(e.target.value),
              'Stroke dash',
              fontStore.touchEffects,
            );
          }}
          placeholder="4, 2"
          fill
        />
      </EffectRow>
      <EffectRow label="Dash off">
        <EffectNumberInput
          value={effect.lineDashOffset}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'lineDashOffset',
              value,
              'Stroke dash offset',
            );
          }}
        />
      </EffectRow>
    </EffectEditorFrame>
  );
});
