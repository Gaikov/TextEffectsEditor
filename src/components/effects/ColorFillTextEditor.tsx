import { observer } from 'mobx-react-lite';
import type { ColorFillText } from '../../effects';
import { EffectColorInput, EffectNumberInput, EffectRow } from './EffectEditorFields';
import { EffectEditorFrame } from './EffectEditorFrame';
import type { EffectEditorProps } from './effectEditorRegistry';

export const ColorFillTextEditor = observer(function ColorFillTextEditor({
  effect,
  index,
  count,
}: EffectEditorProps<ColorFillText>) {
  return (
    <EffectEditorFrame
      effect={effect}
      index={index}
      count={count}
      title="Fill"
    >
      <EffectRow label="Color">
        <EffectColorInput
          color={effect.color}
          onChange={(value) => {
            effect.color = value;
          }}
        />
      </EffectRow>
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
    </EffectEditorFrame>
  );
});
