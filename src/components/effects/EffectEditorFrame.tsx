import type { CSSProperties, ReactNode } from 'react';
import { Button } from '@blueprintjs/core';
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from '@dnd-kit/core';
import type { IFontEffect } from '../../effects';
import { fontStore } from '../../store/fontStore';
import styles from '../FontProperties.module.css';

const ICON_BUTTON_STYLE: CSSProperties = {
  minWidth: 24,
};

export function EffectEditorFrame({
  effect,
  index,
  count,
  depth,
  title,
  dragHandleAttributes,
  dragHandleListeners,
  children,
}: {
  effect: IFontEffect;
  index: number;
  count: number;
  depth: number;
  title: string;
  dragHandleAttributes?: DraggableAttributes;
  dragHandleListeners?: DraggableSyntheticListeners;
  children?: ReactNode;
}) {
  return (
    <div
      className={styles.effectCard}
      style={{ marginLeft: depth > 0 ? 10 : 0 }}
    >
      <div className={styles.effectHeader}>
        <div className={styles.effectHeaderTitle}>
          <Button
            small
            minimal
            icon="drag-handle-vertical"
            aria-label="Drag effect"
            className={styles.dragHandle}
            {...dragHandleAttributes}
            {...dragHandleListeners}
          />
          <span className={styles.effectTitle}>{title}</span>
        </div>
        <div className={styles.effectActions}>
          <Button
            small
            minimal
            icon="arrow-up"
            aria-label="Move effect up"
            disabled={index === 0}
            style={ICON_BUTTON_STYLE}
            onClick={() => fontStore.moveEffect(effect.id, 'up')}
          />
          <Button
            small
            minimal
            icon="arrow-down"
            aria-label="Move effect down"
            disabled={index === count - 1}
            style={ICON_BUTTON_STYLE}
            onClick={() => fontStore.moveEffect(effect.id, 'down')}
          />
          <Button
            small
            minimal
            icon="trash"
            aria-label="Delete effect"
            intent="danger"
            style={ICON_BUTTON_STYLE}
            onClick={() => fontStore.removeEffect(effect.id)}
          />
        </div>
      </div>
      {children}
    </div>
  );
}
