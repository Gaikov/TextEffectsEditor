import { observer } from 'mobx-react-lite';
import type { ShadowText } from '../../effects';
import {
  EffectColorInput,
  EffectNumberInput,
  EffectOpacityRow,
  EffectRow,
} from './EffectEditorFields';
import { EffectEditorFrame } from './EffectEditorFrame';
import type { EffectEditorProps } from './effectEditorRegistry';

export const ShadowTextEditor = observer(function ShadowTextEditor({
  effect,
  index,
  count,
}: EffectEditorProps<ShadowText>) {
  return (
    <EffectEditorFrame
      effect={effect}
      index={index}
      count={count}
      title="End Shadow"
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
      <EffectRow label="X offset">
        <EffectNumberInput
          value={effect.xOffset}
          onChange={(value) => {
            effect.xOffset = value;
          }}
        />
      </EffectRow>
      <EffectRow label="Y offset">
        <EffectNumberInput
          value={effect.yOffset}
          onChange={(value) => {
            effect.yOffset = value;
          }}
        />
      </EffectRow>
      <EffectRow label="Blur">
        <EffectNumberInput
          value={effect.shadowBlur}
          min={0}
          onChange={(value) => {
            effect.shadowBlur = value;
          }}
        />
      </EffectRow>
      <EffectRow label="Shadow X">
        <EffectNumberInput
          value={effect.shadowOffsetX}
          onChange={(value) => {
            effect.shadowOffsetX = value;
          }}
        />
      </EffectRow>
      <EffectRow label="Shadow Y">
        <EffectNumberInput
          value={effect.shadowOffsetY}
          onChange={(value) => {
            effect.shadowOffsetY = value;
          }}
        />
      </EffectRow>
    </EffectEditorFrame>
  );
});
