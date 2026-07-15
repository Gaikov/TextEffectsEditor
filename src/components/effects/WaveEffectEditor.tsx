import { HTMLSelect } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import {
  WAVE_DIRECTIONS,
  type WaveDirection,
  type WaveEffect,
} from '../../effects';
import { fontStore } from '../../store/fontStore';
import {
  EffectNumberInput,
  EffectOpacityRow,
  EffectRow,
} from './EffectEditorFields';
import { EffectEditorFrame } from './EffectEditorFrame';
import type { EffectEditorProps } from './effectEditorRegistry';

function formatDirection(direction: WaveDirection) {
  return `${direction.charAt(0).toUpperCase()}${direction.slice(1)}`;
}

export const WaveEffectEditor = observer(function WaveEffectEditor({
  effect,
  index,
  count,
  depth,
  dragHandleAttributes,
  dragHandleListeners,
}: EffectEditorProps<WaveEffect>) {
  return (
    <EffectEditorFrame
      effect={effect}
      index={index}
      count={count}
      depth={depth}
      title="Wave"
      dragHandleAttributes={dragHandleAttributes}
      dragHandleListeners={dragHandleListeners}
    >
      <EffectOpacityRow
        value={effect.opacity}
        onChange={(value) => {
          fontStore.setEffectProperty(effect, 'opacity', value, 'Wave opacity');
        }}
      />
      <EffectRow label="Direction">
        <HTMLSelect
          fill
          minimal
          value={effect.direction}
          onChange={(e) => {
            fontStore.setEffectProperty(
              effect,
              'direction',
              e.target.value as WaveDirection,
              'Wave direction',
            );
          }}
          options={WAVE_DIRECTIONS.map((direction) => ({
            value: direction,
            label: formatDirection(direction),
          }))}
        />
      </EffectRow>
      <EffectRow label="Amplitude">
        <EffectNumberInput
          value={effect.amplitude}
          min={0}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'amplitude',
              Math.max(0, value),
              'Wave amplitude',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="Wavelength">
        <EffectNumberInput
          value={effect.wavelength}
          min={1}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'wavelength',
              Math.max(1, value),
              'Wave wavelength',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="Phase">
        <EffectNumberInput
          value={effect.phase}
          onChange={(value) => {
            fontStore.setEffectProperty(effect, 'phase', value, 'Wave phase');
          }}
        />
      </EffectRow>
    </EffectEditorFrame>
  );
});
