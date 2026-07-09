import type { ReactNode } from 'react';
import { Button, ControlGroup, InputGroup, NumericInput, Popover } from '@blueprintjs/core';
import styles from '../FontProperties.module.css';

export function parseLineDash(value: string) {
  return value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((number) => Number.isFinite(number) && number >= 0);
}

export function EffectColorInput({
  color,
  onChange,
}: {
  color: string;
  onChange: (value: string) => void;
}) {
  return (
    <ControlGroup fill>
      <Popover
        content={
          <div style={{ padding: 8 }}>
            <input
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        }
      >
        <Button
          minimal
          small
          style={{
            width: 30,
            minWidth: 30,
            background: color,
            borderRadius: '3px 0 0 3px',
          }}
        />
      </Popover>
      <InputGroup
        small
        value={color}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#10161A"
        fill
      />
    </ControlGroup>
  );
}

export function EffectNumberInput({
  value,
  onChange,
  min,
  max,
  stepSize,
  minorStepSize,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  stepSize?: number;
  minorStepSize?: number;
}) {
  return (
    <NumericInput
      small
      value={value}
      onValueChange={onChange}
      min={min}
      max={max}
      stepSize={stepSize}
      minorStepSize={minorStepSize}
      fill
      buttonPosition="none"
    />
  );
}

export function EffectOpacityRow({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <EffectRow label="Opacity">
      <input
        className="bp6-input bp6-small"
        type="number"
        min={0}
        max={1}
        step={0.01}
        value={String(value)}
        onChange={(e) => {
          const nextValue = Number(e.target.value);
          if (Number.isFinite(nextValue)) {
            onChange(Math.max(0, Math.min(1, nextValue)));
          }
        }}
      />
    </EffectRow>
  );
}

export function EffectRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.effectRow}>
      <span className={styles.effectLabel}>{label}</span>
      {children}
    </div>
  );
}
