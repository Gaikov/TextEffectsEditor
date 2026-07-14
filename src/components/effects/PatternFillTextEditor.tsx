import { HTMLSelect } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import {
  PATTERN_FILL_TYPES,
  type PatternFillText,
  type PatternFillType,
} from '../../effects';
import { fontStore } from '../../store/fontStore';
import {
  EffectColorInput,
  EffectNumberInput,
  EffectOpacityRow,
  EffectRow,
} from './EffectEditorFields';
import { EffectEditorFrame } from './EffectEditorFrame';
import type { EffectEditorProps } from './effectEditorRegistry';
import { UndoPropertyChange, undoService } from '../../undo';

function formatPatternType(patternType: PatternFillType) {
  return patternType
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function previewPatternColor(
  effect: PatternFillText,
  key: 'foregroundColor' | 'backgroundColor',
  value: string,
) {
  if (effect[key] === value) return;
  effect[key] = value;
  fontStore.touchEffects();
}

function commitPatternColor(
  effect: PatternFillText,
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

export const PatternFillTextEditor = observer(function PatternFillTextEditor({
  effect,
  index,
  count,
  depth,
  dragHandleAttributes,
  dragHandleListeners,
}: EffectEditorProps<PatternFillText>) {
  return (
    <EffectEditorFrame
      effect={effect}
      index={index}
      count={count}
      depth={depth}
      title="Pattern Fill"
      dragHandleAttributes={dragHandleAttributes}
      dragHandleListeners={dragHandleListeners}
    >
      <EffectRow label="Type">
        <HTMLSelect
          fill
          minimal
          value={effect.patternType}
          onChange={(e) => {
            fontStore.setEffectProperty(
              effect,
              'patternType',
              e.target.value as PatternFillType,
              'Pattern type',
            );
          }}
          options={PATTERN_FILL_TYPES.map((patternType) => ({
            value: patternType,
            label: formatPatternType(patternType),
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
              'Pattern foreground',
            );
          }}
          onPickerCommit={(previousValue, nextValue) => {
            commitPatternColor(
              effect,
              'foregroundColor',
              previousValue,
              nextValue,
              'Pattern foreground',
            );
          }}
          onPickerPreview={(value) => {
            previewPatternColor(effect, 'foregroundColor', value);
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
              'Pattern background',
            );
          }}
          onPickerCommit={(previousValue, nextValue) => {
            commitPatternColor(
              effect,
              'backgroundColor',
              previousValue,
              nextValue,
              'Pattern background',
            );
          }}
          onPickerPreview={(value) => {
            previewPatternColor(effect, 'backgroundColor', value);
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
            'Pattern background opacity',
          );
        }}
      />
      <EffectOpacityRow
        value={effect.opacity}
        onChange={(value) => {
          fontStore.setEffectProperty(
            effect,
            'opacity',
            value,
            'Pattern opacity',
          );
        }}
      />
      <EffectRow label="Cell">
        <EffectNumberInput
          value={effect.cellSize}
          min={2}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'cellSize',
              Math.max(2, value),
              'Pattern cell size',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="Thickness">
        <EffectNumberInput
          value={effect.thickness}
          min={1}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'thickness',
              Math.max(1, value),
              'Pattern thickness',
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
              'Pattern rotation',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="Scale">
        <EffectNumberInput
          value={effect.scale}
          min={0.1}
          stepSize={0.1}
          minorStepSize={0.1}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'scale',
              Math.max(0.1, value),
              'Pattern scale',
            );
          }}
        />
      </EffectRow>
      <EffectRow label="X offset">
        <EffectNumberInput
          value={effect.xOffset}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'xOffset',
              value,
              'Pattern X offset',
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
              'Pattern Y offset',
            );
          }}
        />
      </EffectRow>
    </EffectEditorFrame>
  );
});
