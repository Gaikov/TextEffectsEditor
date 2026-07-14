import { HTMLSelect } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import {
  COMPOSITE_BLEND_OPERATIONS,
  type CompositeBlendEffect,
  type CompositeBlendOperation,
} from '../../effects';
import { fontStore } from '../../store/fontStore';
import { EffectOpacityRow, EffectRow } from './EffectEditorFields';
import { EffectEditorFrame } from './EffectEditorFrame';
import type { EffectEditorProps } from './effectEditorRegistry';

function formatOperationLabel(operation: CompositeBlendOperation) {
  return operation
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export const CompositeBlendEffectEditor = observer(
  function CompositeBlendEffectEditor({
    effect,
    index,
    count,
    depth,
    dragHandleAttributes,
    dragHandleListeners,
  }: EffectEditorProps<CompositeBlendEffect>) {
    return (
      <EffectEditorFrame
        effect={effect}
        index={index}
        count={count}
        depth={depth}
        title="Composite / Blend"
        dragHandleAttributes={dragHandleAttributes}
        dragHandleListeners={dragHandleListeners}
      >
        <EffectOpacityRow
          value={effect.opacity}
          onChange={(value) => {
            fontStore.setEffectProperty(
              effect,
              'opacity',
              value,
              'Composite opacity',
            );
          }}
        />
        <EffectRow label="Mode">
          <HTMLSelect
            fill
            minimal
            value={effect.operation}
            onChange={(e) => {
              fontStore.setEffectProperty(
                effect,
                'operation',
                e.target.value as CompositeBlendOperation,
                'Composite mode',
              );
            }}
            options={COMPOSITE_BLEND_OPERATIONS.map((operation) => ({
              value: operation,
              label: formatOperationLabel(operation),
            }))}
          />
        </EffectRow>
      </EffectEditorFrame>
    );
  },
);
