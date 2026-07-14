import { observer } from 'mobx-react-lite';
import type { InnerShadowEffect } from '../../effects';
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

export const InnerShadowEffectEditor = observer(function InnerShadowEffectEditor({
  effect,
  index,
  count,
  depth,
  dragHandleAttributes,
  dragHandleListeners,
}: EffectEditorProps<InnerShadowEffect>) {
  return (
    <EffectEditorFrame
      effect={effect}
      index={index}
      count={count}
      depth={depth}
      title="Inner Shadow"
      dragHandleAttributes={dragHandleAttributes}
      dragHandleListeners={dragHandleListeners}
    >
      <EffectRow label="Color">
        <EffectColorInput
          color={effect.color}
          onChange={(value) => {
            fontStore.setEffectProperty(effect, 'color', value, 'Inner shadow color');
          }}
          onPickerCommit={(previousValue, nextValue) => {
            commitEffectColor(
              effect,
              previousValue,
              nextValue,
              'Inner shadow color',
            );
          }}
          onPickerPreview={(value) => {
            previewEffectColor(effect, value);
          }}
        />
      </EffectRow>
      <EffectOpacityRow
        value={effect.opacity}
        onChange={(value) => {
          fontStore.setEffectProperty(
            effect,
            'opacity',
            value,
            'Inner shadow opacity',
          );
        }}
      />
      <EffectRow label="X offset">
        <EffectNumberInput
          value={effect.xOffset}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'xOffset',
              value,
              'Inner shadow X offset',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="Y offset">
        <EffectNumberInput
          value={effect.yOffset}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'yOffset',
              value,
              'Inner shadow Y offset',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="Blur">
        <EffectNumberInput
          value={effect.shadowBlur}
          min={0}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'shadowBlur',
              value,
              'Inner shadow blur',
            );
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
              'Inner shadow offset X',
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
              'Inner shadow offset Y',
            );
          }}
        />
      </EffectRow>
    </EffectEditorFrame>
  );
});
