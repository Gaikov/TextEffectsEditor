import { Checkbox, HTMLSelect } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import {
  NOISE_TYPES,
  type NoiseEffect,
  type NoiseType,
} from '../../effects';
import { fontStore } from '../../store/fontStore';
import { UndoPropertyChange, undoService } from '../../undo';
import {
  EffectColorInput,
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
    .join(' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2');
}

function previewNoiseColor(
  effect: NoiseEffect,
  key: 'foregroundColor' | 'backgroundColor',
  value: string,
) {
  if (effect[key] === value) return;
  effect[key] = value;
  fontStore.touchEffects();
}

function commitNoiseColor(
  effect: NoiseEffect,
  key: 'foregroundColor' | 'backgroundColor',
  previousValue: string,
  nextValue: string,
  label: string,
) {
  if (previousValue === nextValue) return;

  undoService.record(
    new UndoPropertyChange(
      effect,
      key,
      previousValue,
      nextValue,
      label,
      fontStore.touchEffects,
    ),
  );
}

export const NoiseEffectEditor = observer(function NoiseEffectEditor({
  effect,
  index,
  count,
  depth,
  dragHandleAttributes,
  dragHandleListeners,
}: EffectEditorProps<NoiseEffect>) {
  return (
    <EffectEditorFrame
      effect={effect}
      index={index}
      count={count}
      depth={depth}
      title="Noise"
      dragHandleAttributes={dragHandleAttributes}
      dragHandleListeners={dragHandleListeners}
    >
      <EffectRow label="Type">
        <HTMLSelect
          fill
          minimal
          value={effect.noiseType}
          onChange={(e) => {
            fontStore.setEffectProperty(
              effect,
              'noiseType',
              e.target.value as NoiseType,
              'Noise type',
            );
          }}
          options={NOISE_TYPES.map((noiseType) => ({
            value: noiseType,
            label: formatLabel(noiseType),
          }))}
        />
      </EffectRow>
      <EffectRow label="Foreground">
        <EffectColorInput
          color={effect.foregroundColor}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'foregroundColor',
              value,
              'Noise foreground',
            );
          }}
          onPickerCommit={(previousValue, nextValue) => {
            commitNoiseColor(
              effect,
              'foregroundColor',
              previousValue,
              nextValue,
              'Noise foreground',
            );
          }}
          onPickerPreview={(value) => {
            previewNoiseColor(effect, 'foregroundColor', value);
          }}
        />
      </EffectRow>
      <EffectRow label="Background">
        <EffectColorInput
          color={effect.backgroundColor}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'backgroundColor',
              value,
              'Noise background',
            );
          }}
          onPickerCommit={(previousValue, nextValue) => {
            commitNoiseColor(
              effect,
              'backgroundColor',
              previousValue,
              nextValue,
              'Noise background',
            );
          }}
          onPickerPreview={(value) => {
            previewNoiseColor(effect, 'backgroundColor', value);
          }}
        />
      </EffectRow>
      <EffectOpacityRow
        label="Bg opacity"
        value={effect.backgroundOpacity}
        onChange={(value) => {
          fontStore.setEffectProperty(
            effect,
            'backgroundOpacity',
            value,
            'Noise background opacity',
          );
        }}
      />
      <EffectOpacityRow
        value={effect.opacity}
        onChange={(value) => {
          fontStore.setEffectProperty(effect, 'opacity', value, 'Noise opacity');
        }}
      />
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
              'Noise seed',
            );
          }}
        />
      </EffectRow>
      <EffectOpacityRow
        label="Density"
        value={effect.density}
        onChange={(value) => {
          fontStore.setEffectProperty(effect, 'density', value, 'Noise density');
        }}
      />
      <EffectOpacityRow
        label="Contrast"
        value={effect.contrast}
        onChange={(value) => {
          fontStore.setEffectProperty(effect, 'contrast', value, 'Noise contrast');
        }}
      />
      <EffectRow label="Grain">
        <EffectNumberInput
          value={effect.grainSize}
          min={1}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'grainSize',
              Math.max(1, value),
              'Noise grain',
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
              'Noise octaves',
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
            'Noise persistence',
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
              'Noise lacunarity',
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
              'Noise scale',
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
              'Noise rotation',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="Stretch X">
        <EffectNumberInput
          value={effect.stretchX}
          min={0.01}
          stepSize={0.1}
          minorStepSize={0.1}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'stretchX',
              Math.max(0.01, value),
              'Noise stretch X',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="Stretch Y">
        <EffectNumberInput
          value={effect.stretchY}
          min={0.01}
          stepSize={0.1}
          minorStepSize={0.1}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'stretchY',
              Math.max(0.01, value),
              'Noise stretch Y',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="X offset">
        <EffectNumberInput
          value={effect.xOffset}
          onChange={(value) => {
            fontStore.setEffectProperty(effect, 'xOffset', value, 'Noise X offset');
          }}
        />
      </EffectRow>
      <EffectRow label="Y offset">
        <EffectNumberInput
          value={effect.yOffset}
          onChange={(value) => {
            fontStore.setEffectProperty(effect, 'yOffset', value, 'Noise Y offset');
          }}
        />
      </EffectRow>
      <EffectRow label="Threshold">
        <EffectNumberInput
          value={effect.threshold}
          min={-1}
          max={1}
          stepSize={0.01}
          minorStepSize={0.01}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'threshold',
              Math.max(-1, Math.min(1, value)),
              'Noise threshold',
            );
          }}
        />
      </EffectRow>
      <EffectOpacityRow
        label="Softness"
        value={effect.softness}
        onChange={(value) => {
          fontStore.setEffectProperty(effect, 'softness', value, 'Noise softness');
        }}
      />
      <EffectRow label="Mono">
        <Checkbox
          checked={effect.monochrome}
          onChange={() => {
            fontStore.setEffectProperty(
              effect,
              'monochrome',
              !effect.monochrome,
              'Noise monochrome',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="Invert">
        <Checkbox
          checked={effect.invert}
          onChange={() => {
            fontStore.setEffectProperty(
              effect,
              'invert',
              !effect.invert,
              'Noise invert',
            );
          }}
        />
      </EffectRow>
    </EffectEditorFrame>
  );
});
