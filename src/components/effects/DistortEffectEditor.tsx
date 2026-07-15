import { HTMLSelect } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import {
  DISTORT_NOISE_TYPES,
  type DistortEffect,
  type DistortNoiseType,
} from '../../effects';
import { fontStore } from '../../store/fontStore';
import {
  EffectNumberInput,
  EffectOpacityRow,
  EffectRow,
} from './EffectEditorFields';
import { EffectEditorFrame } from './EffectEditorFrame';
import type { EffectEditorProps } from './effectEditorRegistry';

function formatLabel(value: string) {
  return value
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export const DistortEffectEditor = observer(function DistortEffectEditor({
  effect,
  index,
  count,
  depth,
  dragHandleAttributes,
  dragHandleListeners,
}: EffectEditorProps<DistortEffect>) {
  return (
    <EffectEditorFrame
      effect={effect}
      index={index}
      count={count}
      depth={depth}
      title="Distort"
      dragHandleAttributes={dragHandleAttributes}
      dragHandleListeners={dragHandleListeners}
    >
      <EffectOpacityRow
        value={effect.opacity}
        onChange={(value) => {
          fontStore.setEffectProperty(effect, 'opacity', value, 'Distort opacity');
        }}
      />
      <EffectRow label="Type">
        <HTMLSelect
          fill
          minimal
          value={effect.noiseType}
          onChange={(e) => {
            fontStore.setEffectProperty(
              effect,
              'noiseType',
              e.target.value as DistortNoiseType,
              'Distort type',
            );
          }}
          options={DISTORT_NOISE_TYPES.map((noiseType) => ({
            value: noiseType,
            label: formatLabel(noiseType),
          }))}
        />
      </EffectRow>
      <EffectRow label="Seed">
        <EffectNumberInput
          value={effect.seed}
          stepSize={1}
          minorStepSize={1}
          allowFloat={false}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'seed',
              Math.round(value),
              'Distort seed',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="Strength">
        <EffectNumberInput
          value={effect.strength}
          min={0}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'strength',
              Math.max(0, value),
              'Distort strength',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="Grain">
        <EffectNumberInput
          value={effect.grainSize}
          min={1}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'grainSize',
              Math.max(1, value),
              'Distort grain',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="Scale">
        <EffectNumberInput
          value={effect.scale}
          min={0.01}
          stepSize={0.1}
          minorStepSize={0.1}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'scale',
              Math.max(0.01, value),
              'Distort scale',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="X amount">
        <EffectNumberInput
          value={effect.xAmount}
          stepSize={0.1}
          minorStepSize={0.1}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'xAmount',
              value,
              'Distort X amount',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="Y amount">
        <EffectNumberInput
          value={effect.yAmount}
          stepSize={0.1}
          minorStepSize={0.1}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'yAmount',
              value,
              'Distort Y amount',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="Rotation">
        <EffectNumberInput
          value={effect.rotation}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'rotation',
              value,
              'Distort rotation',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="Octaves">
        <EffectNumberInput
          value={effect.octaves}
          min={1}
          max={8}
          stepSize={1}
          minorStepSize={1}
          allowFloat={false}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'octaves',
              Math.round(Math.max(1, Math.min(8, value))),
              'Distort octaves',
            );
          }}
        />
      </EffectRow>
      <EffectOpacityRow
        label="Persistence"
        value={effect.persistence}
        onChange={(value) => {
          fontStore.setEffectProperty(
            effect,
            'persistence',
            value,
            'Distort persistence',
          );
        }}
      />
      <EffectRow label="Lacunarity">
        <EffectNumberInput
          value={effect.lacunarity}
          min={1}
          stepSize={0.1}
          minorStepSize={0.1}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'lacunarity',
              Math.max(1, value),
              'Distort lacunarity',
            );
          }}
        />
      </EffectRow>
    </EffectEditorFrame>
  );
});
