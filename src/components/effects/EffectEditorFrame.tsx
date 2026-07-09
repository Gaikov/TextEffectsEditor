import type { CSSProperties, ReactNode } from 'react';
import { Button } from '@blueprintjs/core';
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
  title,
  children,
}: {
  effect: IFontEffect;
  index: number;
  count: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.effectCard}>
      <div className={styles.effectHeader}>
        <span className={styles.effectTitle}>{title}</span>
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
