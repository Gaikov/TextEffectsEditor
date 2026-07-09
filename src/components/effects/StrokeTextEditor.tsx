import { HTMLSelect, InputGroup } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import type { StrokeText } from '../../effects';
import {
  EffectColorInput,
  EffectNumberInput,
  EffectRow,
  parseLineDash,
} from './EffectEditorFields';
import { EffectEditorFrame } from './EffectEditorFrame';
import type { EffectEditorProps } from './effectEditorRegistry';

export const StrokeTextEditor = observer(function StrokeTextEditor({
  effect,
  index,
  count,
}: EffectEditorProps<StrokeText>) {
  return (
    <EffectEditorFrame
      effect={effect}
      index={index}
      count={count}
      title="Stroke"
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
      <EffectRow label="Width">
        <EffectNumberInput
          value={effect.lineWidth}
          min={0}
          onChange={(value) => {
            effect.lineWidth = value;
          }}
        />
      </EffectRow>
      <EffectRow label="Cap">
        <HTMLSelect
          fill
          minimal
          value={effect.lineCap}
          onChange={(e) => {
            effect.lineCap = e.target.value as CanvasLineCap;
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
            effect.lineJoin = e.target.value as CanvasLineJoin;
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
            effect.miterLimit = value;
          }}
        />
      </EffectRow>
      <EffectRow label="Dash">
        <InputGroup
          small
          value={effect.lineDash.join(', ')}
          onChange={(e) => {
            effect.lineDash = parseLineDash(e.target.value);
          }}
          placeholder="4, 2"
          fill
        />
      </EffectRow>
      <EffectRow label="Dash off">
        <EffectNumberInput
          value={effect.lineDashOffset}
          onChange={(value) => {
            effect.lineDashOffset = value;
          }}
        />
      </EffectRow>
    </EffectEditorFrame>
  );
});
