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
  headerActions,
  children,
}: {
  effect: IFontEffect;
  index: number;
  count: number;
  depth: number;
  title: string;
  dragHandleAttributes?: DraggableAttributes;
  dragHandleListeners?: DraggableSyntheticListeners;
  headerActions?: ReactNode;
  children?: ReactNode;
}) {
  const hasBody = children !== undefined && children !== null;

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
          {headerActions}
          <Button
            small
            minimal
            icon={effect.collapsed ? 'chevron-right' : 'chevron-down'}
            aria-label={effect.collapsed ? 'Expand effect' : 'Collapse effect'}
            style={ICON_BUTTON_STYLE}
            onClick={() => {
              fontStore.setEffectProperty(
                effect,
                'collapsed',
                !effect.collapsed,
                'Effect collapse',
              );
            }}
          />
          <Button
            small
            minimal
            icon={effect.visible ? 'eye-open' : 'eye-off'}
            aria-label={effect.visible ? 'Hide effect' : 'Show effect'}
            intent={effect.visible ? undefined : 'warning'}
            style={ICON_BUTTON_STYLE}
            onClick={() => {
              fontStore.setEffectProperty(
                effect,
                'visible',
                !effect.visible,
                'Effect visibility',
              );
            }}
          />
          <Button
            small
            minimal
            icon="duplicate"
            aria-label="Duplicate effect"
            style={ICON_BUTTON_STYLE}
            onClick={() => fontStore.duplicateEffect(effect.id)}
          />
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
      {hasBody && (
        <div
          className={`${styles.effectBodyFrame} ${
            effect.collapsed
              ? styles.effectBodyFrameCollapsed
              : styles.effectBodyFrameExpanded
          }`}
        >
          <div className={styles.effectBodyClip} aria-hidden={effect.collapsed}>
            <div className={styles.effectBody}>{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}
